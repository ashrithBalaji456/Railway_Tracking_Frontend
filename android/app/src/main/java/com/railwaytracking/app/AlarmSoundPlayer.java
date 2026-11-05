package com.railwaytracking.app;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import java.io.File;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * AlarmSoundPlayer:
 * High-reliability hardware alarm audio player.
 * Uses official Android Alarm Stream (STREAM_ALARM / USAGE_ALARM) with exclusive AudioFocus,
 * infinite looping, and guaranteed built-in raw alarm fallback to ensure alarms NEVER stop until explicitly dismissed.
 */
public class AlarmSoundPlayer {
    private static final String TAG = "AlarmSoundPlayer";
    private static AlarmSoundPlayer instance;

    private MediaPlayer mediaPlayer;
    private AssetFileDescriptor currentAfd;
    private Ringtone fallbackRingtone;
    private Vibrator vibrator;
    private PowerManager.WakeLock cpuWakeLock;
    private PowerManager.WakeLock screenWakeLock;
    private AudioFocusRequest audioFocusRequest;
    private boolean isPlaying = false;
    private ScheduledExecutorService watchdogExecutor;
    private Context appContext;

    private AlarmSoundPlayer() {}

    public static synchronized AlarmSoundPlayer getInstance() {
        if (instance == null) {
            instance = new AlarmSoundPlayer();
        }
        return instance;
    }

    public synchronized void startAlarm(Context context) {
        if (context != null) {
            this.appContext = context.getApplicationContext();
        }
        if (this.appContext == null) {
            this.appContext = context;
        }

        if (isPlaying && mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    Log.d(TAG, "Alarm is already actively playing audio and vibrating");
                    return;
                }
            } catch (Exception ignored) {}
        }

        Log.d(TAG, "Starting robust alarm playback & continuous vibration...");

        try {
            // 1. Acquire CPU WakeLock + Screen WakeLock
            PowerManager pm = (PowerManager) appContext.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (cpuWakeLock == null || !cpuWakeLock.isHeld()) {
                    cpuWakeLock = pm.newWakeLock(
                        PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                        "railtrack:alarm_sound_cpu_wakelock"
                    );
                    cpuWakeLock.acquire(15 * 60 * 1000L); // 15 mins safety limit
                }
                if (screenWakeLock == null || !screenWakeLock.isHeld()) {
                    screenWakeLock = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                        "railtrack:alarm_sound_screen_wakelock"
                    );
                    screenWakeLock.acquire(15 * 60 * 1000L);
                }
            }

            // 2. Request Exclusive Alarm AudioFocus
            AudioManager am = (AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

            if (am != null) {
                try {
                    int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                    int curVol = am.getStreamVolume(AudioManager.STREAM_ALARM);
                    if (curVol < (int)(maxVol * 0.85)) {
                        am.setStreamVolume(AudioManager.STREAM_ALARM, (int)(maxVol * 0.90), 0);
                    }
                } catch (Exception volEx) {
                    Log.w(TAG, "Volume adjustment bypassed: " + volEx.getMessage());
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                        .setAudioAttributes(audioAttributes)
                        .setAcceptsDelayedFocusGain(false)
                        .setOnAudioFocusChangeListener(focusChange -> {
                            Log.d(TAG, "AudioFocus change: " + focusChange);
                            if (focusChange == AudioManager.AUDIOFOCUS_LOSS || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                                // Immediately reclaim if alarm is still supposed to be sounding!
                                if (isPlaying && am != null && audioFocusRequest != null) {
                                    try {
                                        am.requestAudioFocus(audioFocusRequest);
                                    } catch (Exception ignored) {}
                                }
                            }
                        })
                        .build();
                    am.requestAudioFocus(audioFocusRequest);
                } else {
                    am.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE);
                }
            }

            // 3. Start continuous rhythmic hardware vibration (Loops indefinitely at index 0)
            startHardwareVibration(appContext);

            // 4. Initialize and start MediaPlayer
            stopMediaPlayerOnly();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setWakeMode(appContext, PowerManager.PARTIAL_WAKE_LOCK);
            mediaPlayer.setAudioAttributes(audioAttributes);

            File customFile = new File(appContext.getFilesDir(), "custom_alarm_sound.mp3");
            boolean usePhysicalCustomFile = customFile.exists() && customFile.length() > 1024;

            boolean sourceSet = false;

            if (usePhysicalCustomFile) {
                try {
                    Log.d(TAG, "Playing user custom MP3 track: " + customFile.getAbsolutePath() + " (" + customFile.length() + " bytes)");
                    mediaPlayer.setDataSource(customFile.getAbsolutePath());
                    sourceSet = true;
                } catch (Exception customEx) {
                    Log.w(TAG, "Failed loading custom MP3, falling back: " + customEx.getMessage());
                }
            }

            // If no custom file or loading failed, try bundled RAW alarm sound
            if (!sourceSet) {
                try {
                    int rawId = appContext.getResources().getIdentifier("alarm_alert", "raw", appContext.getPackageName());
                    if (rawId != 0) {
                        currentAfd = appContext.getResources().openRawResourceFd(rawId);
                        if (currentAfd != null) {
                            mediaPlayer.setDataSource(currentAfd.getFileDescriptor(), currentAfd.getStartOffset(), currentAfd.getLength());
                            sourceSet = true;
                            Log.d(TAG, "Using guaranteed built-in raw alarm asset (R.raw.alarm_alert)");
                        }
                    }
                } catch (Exception rawEx) {
                    Log.w(TAG, "Raw asset alarm loading failed: " + rawEx.getMessage());
                }
            }

            // If still not set, fallback to system alarm ringtone URI
            if (!sourceSet) {
                Uri soundUri = RingtoneManager.getActualDefaultRingtoneUri(appContext, RingtoneManager.TYPE_ALARM);
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                }
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                }
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                Log.d(TAG, "Using system alarm tone URI: " + soundUri);
                try {
                    mediaPlayer.setDataSource(appContext, soundUri);
                    sourceSet = true;
                } catch (Exception uriEx) {
                    Log.w(TAG, "Direct URI failed: " + uriEx.getMessage());
                }
            }

            mediaPlayer.setLooping(true);

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer encountered error (" + what + ", " + extra + ")");
                stopMediaPlayerOnly();
                startRingtoneFallback(appContext);
                return true;
            });

            mediaPlayer.setOnCompletionListener(mp -> {
                try {
                    mp.seekTo(0);
                    mp.start();
                } catch (Exception ex) {
                    Log.w(TAG, "Replay seek failed, restarting: " + ex.getMessage());
                    stopMediaPlayerOnly();
                    startAlarm(appContext);
                }
            });

            mediaPlayer.prepare();
            mediaPlayer.start();
            isPlaying = true;
            Log.d(TAG, "MediaPlayer successfully started looping continuously!");

            // 5. Active 1-Second Watchdog: Auto-restarts playback if stopped while isPlaying is true
            startWatchdog();

        } catch (Exception e) {
            Log.e(TAG, "Failed launching MediaPlayer alarm, switching to Ringtone fallback: " + e.getMessage(), e);
            startRingtoneFallback(appContext);
        }
    }

    private void startHardwareVibration(Context context) {
        try {
            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = { 0, 800, 400, 800, 400, 1200 };
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
                Log.d(TAG, "Hardware looping vibration active (repeating continuously)");
            }
        } catch (Exception vex) {
            Log.w(TAG, "Hardware vibration start warning: " + vex.getMessage());
        }
    }

    private synchronized void startRingtoneFallback(Context context) {
        try {
            startHardwareVibration(context);
            if (fallbackRingtone == null || !fallbackRingtone.isPlaying()) {
                Uri ringtoneUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM);
                if (ringtoneUri == null) {
                    ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                }
                if (ringtoneUri == null) {
                    ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                }
                fallbackRingtone = RingtoneManager.getRingtone(context, ringtoneUri);
                if (fallbackRingtone != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        fallbackRingtone.setLooping(true);
                    }
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    fallbackRingtone.setAudioAttributes(aa);
                    fallbackRingtone.play();
                    isPlaying = true;
                    Log.d(TAG, "Ringtone fallback playing");
                }
            }
            startWatchdog();
        } catch (Exception ex) {
            Log.e(TAG, "Ringtone fallback failed: " + ex.getMessage(), ex);
        }
    }

    private synchronized void startWatchdog() {
        stopWatchdog();
        watchdogExecutor = Executors.newSingleThreadScheduledExecutor();
        watchdogExecutor.scheduleWithFixedDelay(() -> {
            if (!isPlaying) return;
            try {
                // Check Audio Playback
                boolean audioActive = false;
                if (mediaPlayer != null) {
                    try {
                        if (mediaPlayer.isPlaying()) {
                            audioActive = true;
                        } else {
                            mediaPlayer.seekTo(0);
                            mediaPlayer.start();
                            audioActive = true;
                        }
                    } catch (Exception mpEx) {
                        Log.w(TAG, "Watchdog player check error: " + mpEx.getMessage());
                        stopMediaPlayerOnly();
                    }
                }

                if (!audioActive && fallbackRingtone != null) {
                    try {
                        if (fallbackRingtone.isPlaying()) {
                            audioActive = true;
                        } else {
                            fallbackRingtone.play();
                            audioActive = true;
                        }
                    } catch (Exception rEx) {
                        Log.w(TAG, "Watchdog ringtone check error: " + rEx.getMessage());
                    }
                }

                // If neither is sounding, completely rebuild and restart player!
                if (!audioActive && appContext != null) {
                    Log.d(TAG, "Watchdog detected alarm stopped! Rebuilding alarm session...");
                    startAlarm(appContext);
                }
            } catch (Exception ex) {
                Log.w(TAG, "Watchdog loop exception: " + ex.getMessage());
            }
        }, 1, 1, TimeUnit.SECONDS);
    }

    private synchronized void stopWatchdog() {
        if (watchdogExecutor != null) {
            try {
                watchdogExecutor.shutdownNow();
            } catch (Exception ignored) {}
            watchdogExecutor = null;
        }
    }

    public synchronized void stopAlarm() {
        stopAlarm(null);
    }

    public synchronized void stopAlarm(Context context) {
        Log.d(TAG, "Explicit stopAlarm called: terminating audio, watchdog, and vibration");
        isPlaying = false;
        stopWatchdog();
        stopMediaPlayerOnly();

        if (fallbackRingtone != null) {
            try {
                if (fallbackRingtone.isPlaying()) {
                    fallbackRingtone.stop();
                }
            } catch (Exception ignored) {}
            fallbackRingtone = null;
        }

        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
        }

        Context ctx = context != null ? context : appContext;
        if (ctx != null && audioFocusRequest != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                try {
                    am.abandonAudioFocusRequest(audioFocusRequest);
                } catch (Exception ignored) {}
            }
            audioFocusRequest = null;
        }

        if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
            try {
                cpuWakeLock.release();
            } catch (Exception ignored) {}
            cpuWakeLock = null;
        }
        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            try {
                screenWakeLock.release();
            } catch (Exception ignored) {}
            screenWakeLock = null;
        }
    }

    private void stopMediaPlayerOnly() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
            } catch (Exception ignored) {}
            try {
                mediaPlayer.reset();
            } catch (Exception ignored) {}
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        if (currentAfd != null) {
            try {
                currentAfd.close();
            } catch (Exception ignored) {}
            currentAfd = null;
        }
    }

    public synchronized boolean isPlaying() {
        return isPlaying;
    }
}
