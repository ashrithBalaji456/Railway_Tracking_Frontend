package com.railwaytracking.app;

import android.content.Context;
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

/**
 * AlarmSoundPlayer:
 * High-reliability hardware alarm audio player.
 * Uses official Android Alarm Stream (STREAM_ALARM / USAGE_ALARM) with exclusive AudioFocus,
 * infinite looping, and automatic Ringtone fallback to ensure alarms never terminate until user dismisses.
 */
public class AlarmSoundPlayer {
    private static final String TAG = "AlarmSoundPlayer";
    private static AlarmSoundPlayer instance;

    private MediaPlayer mediaPlayer;
    private Ringtone fallbackRingtone;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private AudioFocusRequest audioFocusRequest;
    private boolean isPlaying = false;

    private AlarmSoundPlayer() {}

    public static synchronized AlarmSoundPlayer getInstance() {
        if (instance == null) {
            instance = new AlarmSoundPlayer();
        }
        return instance;
    }

    public synchronized void startAlarm(Context context) {
        if (isPlaying) {
            Log.d(TAG, "Alarm is already actively sounding");
            return;
        }

        try {
            // 1. Acquire Full Screen & CPU WakeLock to guarantee the phone wakes up and stays on
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "railtrack:alarm_sound_wakelock"
                );
                wakeLock.acquire(15 * 60 * 1000L); // 15 minutes max timeout
            }

            // 2. Request Exclusive Alarm AudioFocus so no other app or WebView audio ducks or pauses the alarm
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

            if (am != null) {
                // Ensure alarm stream volume is near maximum
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int curVol = am.getStreamVolume(AudioManager.STREAM_ALARM);
                if (curVol < (int)(maxVol * 0.85)) {
                    am.setStreamVolume(AudioManager.STREAM_ALARM, (int)(maxVol * 0.90), 0);
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                        .setAudioAttributes(audioAttributes)
                        .setAcceptsDelayedFocusGain(false)
                        .setOnAudioFocusChangeListener(focusChange -> {
                            Log.d(TAG, "AudioFocus change: " + focusChange);
                        })
                        .build();
                    am.requestAudioFocus(audioFocusRequest);
                } else {
                    am.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE);
                }
            }

            // 3. Determine sound source: User's custom uploaded MP3 or Android System Alarm Ringtone
            Uri soundUri = null;
            File customFile = new File(context.getFilesDir(), "custom_alarm_sound.mp3");
            if (customFile.exists() && customFile.length() > 500) {
                soundUri = Uri.fromFile(customFile);
                Log.d(TAG, "Using custom uploaded alarm MP3: " + customFile.getAbsolutePath() + " (" + customFile.length() + " bytes)");
            } else {
                soundUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM);
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                }
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                }
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                Log.d(TAG, "Using Android System Alarm tone: " + soundUri);
            }

            // 4. Initialize and start primary MediaPlayer
            stopMediaPlayerOnly();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
            mediaPlayer.setDataSource(context, soundUri);
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setLooping(true);

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error (" + what + ", " + extra + "), triggering Ringtone fallback!");
                startRingtoneFallback(context);
                return true;
            });

            mediaPlayer.setOnCompletionListener(mp -> {
                try {
                    mp.seekTo(0);
                    mp.start();
                } catch (Exception ex) {
                    Log.w(TAG, "Replay failed, triggering Ringtone fallback", ex);
                    startRingtoneFallback(context);
                }
            });

            mediaPlayer.prepare();
            mediaPlayer.start();
            isPlaying = true;
            Log.d(TAG, "Alarm MediaPlayer successfully started looping continuously");

            // 5. Start continuous rhythmic vibration pattern
            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = { 0, 800, 400, 800, 400, 1200 };
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed launching MediaPlayer alarm, switching immediately to Ringtone fallback: " + e.getMessage(), e);
            startRingtoneFallback(context);
        }
    }

    private synchronized void startRingtoneFallback(Context context) {
        try {
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
                    Log.d(TAG, "Ringtone fallback playing continuously");
                }
            }
        } catch (Exception ex) {
            Log.e(TAG, "Ringtone fallback failed: " + ex.getMessage(), ex);
        }
    }

    public synchronized void stopAlarm() {
        stopAlarm(null);
    }

    public synchronized void stopAlarm(Context context) {
        Log.d(TAG, "Stopping all alarm audio and vibration");
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

        if (context != null && audioFocusRequest != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                try {
                    am.abandonAudioFocusRequest(audioFocusRequest);
                } catch (Exception ignored) {}
            }
            audioFocusRequest = null;
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
            wakeLock = null;
        }

        isPlaying = false;
    }

    private void stopMediaPlayerOnly() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    public synchronized boolean isPlaying() {
        return isPlaying;
    }
}
