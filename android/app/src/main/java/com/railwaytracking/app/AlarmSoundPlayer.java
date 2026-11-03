package com.railwaytracking.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import java.io.File;

public class AlarmSoundPlayer {
    private static final String TAG = "AlarmSoundPlayer";
    private static AlarmSoundPlayer instance;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
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
            Log.d(TAG, "Alarm is already playing");
            return;
        }

        try {
            // 1. Acquire CPU WakeLock so playing doesn't get suspended by Doze mode
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "railtrack:alarm_sound_wakelock"
                );
                wakeLock.acquire(10 * 60 * 1000L); // 10 minutes max safety limit
            }

            // 2. Determine audio source: custom uploaded MP3 or system alarm tone
            Uri soundUri = null;
            File customFile = new File(context.getFilesDir(), "custom_alarm_sound.mp3");
            if (customFile.exists() && customFile.length() > 0) {
                soundUri = Uri.fromFile(customFile);
                Log.d(TAG, "Using custom uploaded alarm sound: " + customFile.getAbsolutePath() + " (" + customFile.length() + " bytes)");
            } else {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                Log.d(TAG, "Using default system alarm tone: " + soundUri);
            }

            // 3. Initialize MediaPlayer
            stopMediaPlayerOnly();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
            mediaPlayer.setDataSource(context, soundUri);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
            isPlaying = true;
            Log.d(TAG, "MediaPlayer successfully started looping alarm");

            // 4. Start rhythmic vibration pulse
            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = { 0, 800, 400, 800, 400, 1200 };
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = loop from start
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start custom alarm player: " + e.getMessage(), e);
            // Fallback: try default ringtone
            try {
                Uri fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (fallbackUri == null) {
                    fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                if (mediaPlayer == null) mediaPlayer = new MediaPlayer();
                mediaPlayer.reset();
                mediaPlayer.setDataSource(context, fallbackUri);
                mediaPlayer.setLooping(true);
                mediaPlayer.prepare();
                mediaPlayer.start();
                isPlaying = true;
            } catch (Exception ex) {
                Log.e(TAG, "Fallback alarm failed too: " + ex.getMessage());
            }
        }
    }

    public synchronized void stopAlarm(Context context) {
        Log.d(TAG, "Stopping alarm sound and vibration");
        stopMediaPlayerOnly();

        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
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

