package com.railwaytracking.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * Foreground Service for continuous, un-killable background alarms.
 * Ensures audio playback and vibration continue even when screen is locked
 * or when user is multitasking in other apps (e.g. WhatsApp).
 */
public class AlarmForegroundService extends Service {

    public static final String CHANNEL_ID = "railtrack_urgent_alarm_service_v1";
    public static final String CHANNEL_NAME = "RailTrack Ongoing Departure Alarm";
    public static final int NOTIFICATION_ID = 9901;
    public static final String ACTION_STOP = "com.railwaytracking.app.ACTION_STOP_FOREGROUND_ALARM";
    private static final String TAG = "AlarmForegroundService";

    private PowerManager.WakeLock wakeLock;
    private android.media.session.MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "railtrack:alarm_foreground_service_wakelock"
            );
            wakeLock.acquire(15 * 60 * 1000L); // 15 mins safety timeout
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                mediaSession = new android.media.session.MediaSession(this, "RailTrackAlarmSession");
                android.media.session.PlaybackState.Builder pb = new android.media.session.PlaybackState.Builder()
                    .setState(android.media.session.PlaybackState.STATE_PLAYING, android.media.session.PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                    .setActions(android.media.session.PlaybackState.ACTION_PLAY | android.media.session.PlaybackState.ACTION_PAUSE | android.media.session.PlaybackState.ACTION_STOP);
                mediaSession.setPlaybackState(pb.build());
                mediaSession.setActive(true);
            } catch (Exception ex) {
                Log.w(TAG, "MediaSession setup: " + ex.getMessage());
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopAlarm();
            return START_NOT_STICKY;
        }

        String title = intent != null ? intent.getStringExtra("title") : null;
        if (title == null || title.isBlank()) {
            title = "🌅 RailTrack Wake-Up Alarm!";
        }
        String body = intent != null ? intent.getStringExtra("body") : null;
        if (body == null || body.isBlank()) {
            body = "Train departure alert is ringing! Tap to open or silence.";
        }

        if (intent != null) {
            String tn = intent.getStringExtra("trainNumber");
            String sc = intent.getStringExtra("stationCode");
            String sn = intent.getStringExtra("stationName");
            String pf = intent.getStringExtra("platform");
            int tm = intent.getIntExtra("triggerMinutes", 30);
            String aid = intent.getStringExtra("alarmId");

            if (tn != null && sc != null) {
                SharedPreferences prefs = getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit()
                        .putString("ringing_alarm_id", aid != null ? aid : AdaptiveAlarmManager.buildAlarmId(tn, sc))
                        .putString("ringing_train_number", tn)
                        .putString("ringing_station_code", sc)
                        .putString("ringing_station_name", sn != null ? sn : sc)
                        .putString("ringing_platform", pf != null ? pf : "")
                        .putInt("ringing_trigger_minutes", tm)
                        .apply();
            }
        }

        Notification notification = buildForegroundNotification(title, body);

        // Required in Android 14+ (API 34+) for foreground services
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int serviceType = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
            }
            try {
                startForeground(NOTIFICATION_ID, notification, serviceType);
            } catch (Exception ex) {
                Log.w(TAG, "startForeground with type failed, falling back: " + ex.getMessage());
                startForeground(NOTIFICATION_ID, notification);
            }
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        // Post ongoing alert notification with "STOP ALARM" action into top status bar
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, notification);
        }

        // Start loud audio + vibration loops
        AlarmSoundPlayer.getInstance().startAlarm(this);

        // Dispatch emergency approaching email asynchronously if configured
        final String backupEmail = intent != null ? intent.getStringExtra("backupEmail") : null;
        if (backupEmail != null && backupEmail.contains("@")) {
            final String trainNum = intent.getStringExtra("trainNumber");
            final String trainNam = intent.getStringExtra("trainName");
            final String stnCode = intent.getStringExtra("stationCode");
            final String stnName = intent.getStringExtra("stationName");
            final String pf = intent.getStringExtra("platform");
            final int tm = intent.getIntExtra("triggerMinutes", 30);
            dispatchBackupEmail(backupEmail, trainNum, trainNam, stnCode, stnName, pf, tm);
        }

        // Attempt to bring MainActivity over lock screen only if phone is locked or screen off
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            boolean isScreenOn = pm != null && pm.isInteractive();
            if (!isScreenOn) {
                Intent mainIntent = new Intent(this, MainActivity.class);
                mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                mainIntent.putExtra("from_alarm", true);
                startActivity(mainIntent);
            }
        } catch (Exception ex) {
            Log.w(TAG, "Could not start MainActivity from foreground service: " + ex.getMessage());
        }

        return START_STICKY;
    }

    private Notification buildForegroundNotification(String title, String body) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Continuous foreground departure alarms");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 1000});
            // Keep notification channel sound silent so AlarmSoundPlayer has exclusive looping control on STREAM_ALARM
            channel.setSound(null, null);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);
            nm.createNotificationChannel(channel);
        }

        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        mainIntent.putExtra("from_alarm", true);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            1001,
            mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, StopAlarmReceiver.class);
        stopIntent.setAction(StopAlarmReceiver.ACTION_STOP_ALARM);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
            this,
            1002,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon != 0 ? getApplicationInfo().icon : android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setSound(null)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "🛑 STOP ALARM", stopPendingIntent)
            .build();
    }

    private void dispatchBackupEmail(String email, String trainNumber, String trainName, String stationCode, String stationName, String platform, int etaMinutes) {
        new Thread(() -> {
            try {
                java.net.URL url = new java.net.URL("https://railway-tracking-backend-gwa2.onrender.com/api/v1/alarm/approaching");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                org.json.JSONObject payload = new org.json.JSONObject();
                payload.put("email", email.trim());
                payload.put("trainNumber", trainNumber != null ? trainNumber : "");
                payload.put("trainName", trainName != null ? trainName : "Express");
                payload.put("stationCode", stationCode != null ? stationCode : "");
                payload.put("stationName", stationName != null ? stationName : "");
                payload.put("etaMinutes", etaMinutes);
                payload.put("platform", platform != null ? platform : "");

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    os.flush();
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Dispatched emergency wake-up email to " + email + ", response code: " + code);
            } catch (Exception e) {
                Log.w(TAG, "Failed dispatching backup email from service: " + e.getMessage());
            }
        }).start();
    }

    public void stopAlarm() {
        AlarmSoundPlayer.getInstance().stopAlarm(this);
        stopForeground(true);

        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }

        SharedPreferences prefs = getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .remove("ringing_alarm_id")
                .remove("ringing_train_number")
                .remove("ringing_station_code")
                .remove("ringing_station_name")
                .remove("ringing_platform")
                .remove("ringing_trigger_minutes")
                .apply();

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(NOTIFICATION_ID);
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopAlarm();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
