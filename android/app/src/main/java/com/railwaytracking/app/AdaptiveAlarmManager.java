package com.railwaytracking.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Adaptive Alarm Manager:
 * Manages dynamic station wake-up alarms that automatically adapt to
 * Indian Railways live train delays and schedule changes.
 */
public class AdaptiveAlarmManager {

    private static final String TAG = "AdaptiveAlarmManager";
    public static final String PREFS_NAME = "rail_adaptive_alarm_prefs";
    public static final int SYNC_REQ_CODE = 8802;
    public static final int ALARM_REQ_CODE = 8801;
    public static final String SYNC_CHANNEL_ID = "railtrack_adaptive_sync";
    public static final int SYNC_NOTIFICATION_ID = 7702;

    private static AdaptiveAlarmManager instance;

    public static synchronized AdaptiveAlarmManager getInstance() {
        if (instance == null) {
            instance = new AdaptiveAlarmManager();
        }
        return instance;
    }

    public void armAlarm(
            Context context,
            String trainNumber,
            String trainName,
            String stationCode,
            String stationName,
            int triggerMinutes,
            String expectedArrival,
            String journeyDate,
            String backendUrl
    ) {
        long targetTriggerMillis = calculateTriggerMillis(expectedArrival, triggerMinutes);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean("isArmed", true)
                .putString("trainNumber", trainNumber)
                .putString("trainName", trainName != null ? trainName : "Train " + trainNumber)
                .putString("stationCode", stationCode.toUpperCase())
                .putString("stationName", stationName)
                .putInt("triggerMinutes", triggerMinutes)
                .putString("expectedArrival", expectedArrival)
                .putString("journeyDate", journeyDate != null ? journeyDate : "")
                .putString("backendUrl", backendUrl != null ? backendUrl : "https://railway-tracking-backend-gwa2.onrender.com")
                .putLong("targetTriggerMillis", targetTriggerMillis)
                .putLong("lastSyncMillis", System.currentTimeMillis())
                .apply();

        Log.d(TAG, "Adaptive alarm armed for train " + trainNumber + " at " + stationCode +
                ". Target trigger: " + new Date(targetTriggerMillis));

        // 1. Schedule exact system alarm clock
        scheduleAlarmClock(context, targetTriggerMillis, stationName, trainNumber, triggerMinutes);

        // 2. Schedule adaptive periodic background sync with 3-minute pre-flight check
        long timeUntilTarget = targetTriggerMillis - System.currentTimeMillis();
        long initialSyncDelay;
        if (timeUntilTarget <= (3 * 60 * 1000L)) {
            initialSyncDelay = Math.max(30 * 1000L, timeUntilTarget);
        } else if (timeUntilTarget <= (8 * 60 * 1000L)) {
            // Target is 3-8 mins away: schedule pre-flight check for exactly 3 mins prior
            initialSyncDelay = timeUntilTarget - (3 * 60 * 1000L);
        } else if (timeUntilTarget <= (35 * 60 * 1000L)) {
            initialSyncDelay = 5 * 60 * 1000L;
        } else {
            initialSyncDelay = 15 * 60 * 1000L;
        }
        scheduleNextSync(context, initialSyncDelay);
    }

    public void scheduleAlarmClock(
            Context context,
            long targetTriggerMillis,
            String stationName,
            String trainNumber,
            int triggerMinutes
    ) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title", "🔔 " + stationName + " Approaching (" + triggerMinutes + "m Warning)");
        intent.putExtra("body", "Train " + trainNumber + " is nearing " + stationName + "! Time to prepare.");

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                ALARM_REQ_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent showIntent = new Intent(context, MainActivity.class);
        showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        showIntent.putExtra("from_alarm", true);
        PendingIntent showPendingIntent = PendingIntent.getActivity(
                context,
                1001,
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(targetTriggerMillis, showPendingIntent);
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, targetTriggerMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, targetTriggerMillis, pendingIntent);
            }
            Log.d(TAG, "Scheduled system AlarmClock for: " + new Date(targetTriggerMillis));
        } catch (SecurityException se) {
            Log.e(TAG, "SecurityException scheduling alarm clock: " + se.getMessage());
        }
    }

    public void scheduleNextSync(Context context, long delayMillis) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent syncIntent = new Intent(context, AdaptiveSyncReceiver.class);
        PendingIntent syncPendingIntent = PendingIntent.getBroadcast(
                context,
                SYNC_REQ_CODE,
                syncIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAt = System.currentTimeMillis() + delayMillis;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
            }
            Log.d(TAG, "Next adaptive sync scheduled in " + (delayMillis / 60000) + " minutes (" + new Date(triggerAt) + ")");
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling adaptive sync: " + e.getMessage());
        }
    }

    public void cancelAlarm(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            // Cancel alarm clock
            Intent alarmIntent = new Intent(context, AlarmReceiver.class);
            PendingIntent piAlarm = PendingIntent.getBroadcast(
                    context,
                    ALARM_REQ_CODE,
                    alarmIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(piAlarm);

            // Cancel periodic sync
            Intent syncIntent = new Intent(context, AdaptiveSyncReceiver.class);
            PendingIntent piSync = PendingIntent.getBroadcast(
                    context,
                    SYNC_REQ_CODE,
                    syncIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(piSync);
        }

        try {
            Intent stopService = new Intent(context, AlarmForegroundService.class);
            context.stopService(stopService);
        } catch (Exception ignored) {}

        AlarmSoundPlayer.getInstance().stopAlarm(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(AlarmReceiver.NOTIFICATION_ID);
            nm.cancel(AlarmForegroundService.NOTIFICATION_ID);
            nm.cancel(SYNC_NOTIFICATION_ID);
        }

        Log.d(TAG, "Adaptive alarm and sync listeners cancelled successfully.");
    }

    public void postScheduleShiftNotification(
            Context context,
            String trainNumber,
            String stationName,
            long newTriggerMillis,
            int delayMinutes
    ) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        createSyncChannel(nm);

        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        String formattedTime = sdf.format(new Date(newTriggerMillis));

        String body = "Train " + trainNumber + " delayed (+" + delayMinutes + "m). Wake-up alarm automatically shifted to " + formattedTime + ".";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, SYNC_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("🚆 Train Schedule Updated: Alarm Shifted")
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true);

        nm.notify(SYNC_NOTIFICATION_ID, builder.build());
    }

    private void createSyncChannel(NotificationManager nm) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    SYNC_CHANNEL_ID,
                    "RailTrack Schedule Updates",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Silent notices when train delays adjust your wake-up alarm time");
            nm.createNotificationChannel(channel);
        }
    }

    public static long calculateTriggerMillis(String timeStr, int triggerMinutes) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return System.currentTimeMillis() + (triggerMinutes * 60 * 1000L);
        }

        try {
            String clean = timeStr.trim();
            if (clean.contains("T")) {
                int idx = clean.indexOf("T");
                clean = clean.substring(idx + 1, Math.min(clean.length(), idx + 6));
            }

            String[] parts = clean.split(":");
            int hour = Integer.parseInt(parts[0]);
            int min = Integer.parseInt(parts[1]);

            Calendar cal = Calendar.getInstance();
            int currentHour = cal.get(Calendar.HOUR_OF_DAY);
            int currentMin = cal.get(Calendar.MINUTE);

            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, min);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);

            // If parsed arrival time is earlier than current time today, it refers to tomorrow
            if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }

            // Subtract advance warning minutes
            cal.add(Calendar.MINUTE, -triggerMinutes);

            long calculated = cal.getTimeInMillis();
            return Math.max(System.currentTimeMillis() + 10000L, calculated);
        } catch (Exception e) {
            Log.w(TAG, "Failed parsing arrival time '" + timeStr + "', fallback to default countdown", e);
            return System.currentTimeMillis() + (triggerMinutes * 60 * 1000L);
        }
    }
}

