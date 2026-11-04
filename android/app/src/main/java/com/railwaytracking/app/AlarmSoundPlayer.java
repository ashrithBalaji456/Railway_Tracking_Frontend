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

    private static void ensureDefaultAlarmWav(Context context) {
        File wavFile = new File(context.getFilesDir(), "default_rail_alarm.wav");
        if (wavFile.exists() && wavFile.length() > 5000) {
            return;
        }
        try {
            int sampleRate = 22050;
            int numSeconds = 4;
            int numSamples = sampleRate * numSeconds;
            byte[] generatedSnd = new byte[2 * numSamples];

            // 4-chord upbeat railway chime sequence (C5, E5, G5, C6)
            double[] freqs = { 523.25, 659.25, 783.99, 1046.50 };
            int samplesPerNote = numSamples / 8;

            int idx = 0;
            for (int i = 0; i < numSamples; ++i) {
                int noteIndex = (i / samplesPerNote) % freqs.length;
                double freq = freqs[noteIndex];
                int noteSample = i % samplesPerNote;
                double decay = Math.max(0.15, 1.0 - ((double) noteSample / samplesPerNote));
                double sample = Math.sin(2 * Math.PI * i / (sampleRate / freq)) * decay;
                sample += 0.3 * Math.sin(4 * Math.PI * i / (sampleRate / freq)) * decay;

                short val = (short) ((sample / 1.3) * 32767);
                generatedSnd[idx++] = (byte) (val & 0x00ff);
                generatedSnd[idx++] = (byte) ((val & 0xff00) >>> 8);
            }

            int totalAudioLen = generatedSnd.length;
            int totalDataLen = totalAudioLen + 36;
            long longSampleRate = sampleRate;
            int channels = 1;
            long byteRate = 16 * sampleRate * channels / 8;

            byte[] header = new byte[44];
            header[0] = 'R'; header[1] = 'I'; header[2] = 'F'; header[3] = 'F';
            header[4] = (byte) (totalDataLen & 0xff);
            header[5] = (byte) ((totalDataLen >> 8) & 0xff);
            header[6] = (byte) ((totalDataLen >> 16) & 0xff);
            header[7] = (byte) ((totalDataLen >> 24) & 0xff);
            header[8] = 'W'; header[9] = 'A'; header[10] = 'V'; header[11] = 'E';
            header[12] = 'f'; header[13] = 'm'; header[14] = 't'; header[15] = ' ';
            header[16] = 16; header[17] = 0; header[18] = 0; header[19] = 0;
            header[20] = 1; header[21] = 0;
            header[22] = (byte) channels; header[23] = 0;
            header[24] = (byte) (longSampleRate & 0xff);
            header[25] = (byte) ((longSampleRate >> 8) & 0xff);
            header[26] = (byte) ((longSampleRate >> 16) & 0xff);
            header[27] = (byte) ((longSampleRate >> 24) & 0xff);
            header[28] = (byte) (byteRate & 0xff);
            header[29] = (byte) ((byteRate >> 8) & 0xff);
            header[30] = (byte) ((byteRate >> 16) & 0xff);
            header[31] = (byte) ((byteRate >> 24) & 0xff);
            header[32] = (byte) (channels * 16 / 8); header[33] = 0;
            header[34] = 16; header[35] = 0;
            header[36] = 'd'; header[37] = 'a'; header[38] = 't'; header[39] = 'a';
            header[40] = (byte) (totalAudioLen & 0xff);
            header[41] = (byte) ((totalAudioLen >> 8) & 0xff);
            header[42] = (byte) ((totalAudioLen >> 16) & 0xff);
            header[43] = (byte) ((totalAudioLen >> 24) & 0xff);

            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(wavFile)) {
                fos.write(header);
                fos.write(generatedSnd);
                fos.flush();
            }
            Log.d(TAG, "Generated self-contained alarm audio: " + wavFile.getAbsolutePath());
        } catch (Exception e) {
            Log.e(TAG, "Failed generating default alarm wav", e);
        }
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

            // Ensure our self-contained energetic alarm chime exists
            ensureDefaultAlarmWav(context);

            // 2. Determine audio source: custom uploaded MP3 or built-in rail alarm
            Uri soundUri;
            File customFile = new File(context.getFilesDir(), "custom_alarm_sound.mp3");
            File defaultWav = new File(context.getFilesDir(), "default_rail_alarm.wav");
            if (customFile.exists() && customFile.length() > 0) {
                soundUri = Uri.fromFile(customFile);
                Log.d(TAG, "Using custom uploaded alarm sound: " + customFile.getAbsolutePath());
            } else if (defaultWav.exists() && defaultWav.length() > 0) {
                soundUri = Uri.fromFile(defaultWav);
                Log.d(TAG, "Using built-in RailTrack alarm chime: " + defaultWav.getAbsolutePath());
            } else {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (soundUri == null) {
                    soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
            }

            // Elevate alarm volume if subdued
            android.media.AudioManager am = (android.media.AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int maxVol = am.getStreamMaxVolume(android.media.AudioManager.STREAM_ALARM);
                int currentVol = am.getStreamVolume(android.media.AudioManager.STREAM_ALARM);
                if (currentVol < maxVol / 2) {
                    am.setStreamVolume(android.media.AudioManager.STREAM_ALARM, (int)(maxVol * 0.85), 0);
                }
            }

            // 3. Initialize MediaPlayer with infinite looping
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
            mediaPlayer.setOnCompletionListener(mp -> {
                try {
                    mp.seekTo(0);
                    mp.start();
                } catch (Exception ex) {
                    Log.w(TAG, "Loop replay failed", ex);
                }
            });
            mediaPlayer.prepare();
            mediaPlayer.start();
            isPlaying = true;
            Log.d(TAG, "MediaPlayer successfully started looping alarm continuously");

            // 4. Start rhythmic vibration pulse
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
            Log.e(TAG, "Failed to start primary alarm player: " + e.getMessage(), e);
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

    public synchronized void stopAlarm() {
        stopAlarm(null);
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

