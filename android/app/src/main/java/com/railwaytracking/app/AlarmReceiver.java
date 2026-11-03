package com.railwaytracking.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "railtrack_high_priority_alarm_v2";
    public static final String CHANNEL_NAME = "RailTrack Urgent Train Alarms";
    public static final int NOTIFICATION_ID = 9901;
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "AlarmReceiver fired! Initiating alarm sequence.");

        String title = intent.getStringExtra("title");
        if (title == null || title.isBlank()) {
            title = "🌅 RailTrack Wake-Up Alarm!";
        }
        String body = intent.getStringExtra("body");
        if (body == null || body.isBlank()) {
            body = "Your scheduled train departure alarm is ringing now! Tap to open or silence.";
        }

        // 1. Acquire temporary wake lock to ensure CPU runs even if phone was sleeping
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "railtrack:alarm_receiver_wakelock"
            );
            wakeLock.acquire(15000); // 15 seconds
        }

        // 2. START CONTINUOUS LOUD ALARM AUDIO + VIBRATION (Loops custom MP3 or default alarm)
        AlarmSoundPlayer.getInstance().startAlarm(context);

        // 3. Full-screen intent to launch MainActivity over lock screen
        Intent mainIntent = new Intent(context, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        mainIntent.putExtra("from_alarm", true);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            1001,
            mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 4. Stop Alarm Action Intent for the notification bar
        Intent stopIntent = new Intent(context, StopAlarmReceiver.class);
        stopIntent.setAction(StopAlarmReceiver.ACTION_STOP_ALARM);

        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
            context,
            1002,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 5. Create High-Priority Notification Channel with USAGE_ALARM
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmSound == null) {
            alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("High-priority alarms that wake the screen and play at alarm volume");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 1000});
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            channel.setSound(alarmSound, audioAttributes);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);
            notificationManager.createNotificationChannel(channel);
        }

        // 6. Build max-priority alarm notification with "STOP ALARM" action button
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true) // Cannot be accidentally cleared while ringing
            .setAutoCancel(false)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "🛑 STOP ALARM", stopPendingIntent);

        if (notificationManager != null) {
            boolean canPost = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                canPost = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            }
            if (canPost) {
                notificationManager.notify(NOTIFICATION_ID, builder.build());
                Log.d(TAG, "Alarm notification posted successfully with STOP ALARM action button");
            } else {
                Log.w(TAG, "POST_NOTIFICATIONS permission not granted; cannot display notification");
            }
        }

        // 7. Also launch MainActivity directly
        try {
            context.startActivity(mainIntent);
        } catch (Exception ignored) {}

        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
    }
}
