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

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

/**
 * Adaptive Alarm Manager:
 * Manages dynamic station wake-up alarms that automatically adapt to
 * Indian Railways live train delays and schedule changes.
 * Supports multiple stations on the same train or across different trains simultaneously.
 */
public class AdaptiveAlarmManager {

    private static final String TAG = "AdaptiveAlarmManager";
    public static final String PREFS_NAME = "rail_adaptive_alarm_prefs";
    public static final String PREF_ALARMS_MAP = "alarms_map_json";
    public static final String SYNC_CHANNEL_ID = "railtrack_adaptive_sync";

    private static AdaptiveAlarmManager instance;

    public static synchronized AdaptiveAlarmManager getInstance() {
        if (instance == null) {
            instance = new AdaptiveAlarmManager();
        }
        return instance;
    }

    public static String buildAlarmId(String trainNumber, String stationCode) {
        return (trainNumber != null ? trainNumber.trim() : "") + "_" + (stationCode != null ? stationCode.trim().toUpperCase() : "");
    }

    public static int getAlarmReqCode(String trainNumber, String stationCode) {
        String id = buildAlarmId(trainNumber, stationCode);
        return 10000 + (Math.abs(id.hashCode()) % 40000);
    }

    public static int getSyncReqCode(String trainNumber, String stationCode) {
        String id = buildAlarmId(trainNumber, stationCode) + "_SYNC";
        return 50000 + (Math.abs(id.hashCode()) % 40000);
    }

    public static int getNotificationId(String trainNumber, String stationCode) {
        String id = buildAlarmId(trainNumber, stationCode) + "_NOTIF";
        return 7000 + (Math.abs(id.hashCode()) % 2000);
    }

    public synchronized void armAlarm(
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
        armAlarm(context, trainNumber, trainName, stationCode, stationName, triggerMinutes, expectedArrival, journeyDate, backendUrl, "");
    }

    public synchronized void armAlarm(
            Context context,
            String trainNumber,
            String trainName,
            String stationCode,
            String stationName,
            int triggerMinutes,
            String expectedArrival,
            String journeyDate,
            String backendUrl,
            String platform
    ) {
        long targetTriggerMillis = calculateTriggerMillis(expectedArrival, triggerMinutes);
        String alarmId = buildAlarmId(trainNumber, stationCode);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject alarmsMap = getAlarmsMap(prefs);

        try {
            JSONObject alarmObj = new JSONObject();
            alarmObj.put("id", alarmId);
            alarmObj.put("trainNumber", trainNumber);
            alarmObj.put("trainName", trainName != null ? trainName : "Train " + trainNumber);
            alarmObj.put("stationCode", stationCode.toUpperCase());
            alarmObj.put("stationName", stationName);
            String cleanPlatform = (platform != null && !platform.equalsIgnoreCase("null") && !platform.equalsIgnoreCase("undefined")) ? platform : "";
            alarmObj.put("platform", cleanPlatform);
            alarmObj.put("triggerMinutes", triggerMinutes);
            alarmObj.put("expectedArrival", expectedArrival != null ? expectedArrival : "");
            alarmObj.put("journeyDate", journeyDate != null ? journeyDate : "");
            alarmObj.put("backendUrl", backendUrl != null ? backendUrl : "https://railway-tracking-backend-gwa2.onrender.com");
            alarmObj.put("targetTriggerMillis", targetTriggerMillis);
            alarmObj.put("lastSyncMillis", System.currentTimeMillis());

            alarmsMap.put(alarmId, alarmObj);

            // Save map and legacy fallback values
            prefs.edit()
                    .putString(PREF_ALARMS_MAP, alarmsMap.toString())
                    .putBoolean("isArmed", true)
                    .putString("trainNumber", trainNumber)
                    .putString("trainName", trainName != null ? trainName : "Train " + trainNumber)
                    .putString("stationCode", stationCode.toUpperCase())
                    .putString("stationName", stationName)
                    .putString("platform", cleanPlatform)
                    .putInt("triggerMinutes", triggerMinutes)
                    .putString("expectedArrival", expectedArrival != null ? expectedArrival : "")
                    .putString("journeyDate", journeyDate != null ? journeyDate : "")
                    .putString("backendUrl", backendUrl != null ? backendUrl : "https://railway-tracking-backend-gwa2.onrender.com")
                    .putLong("targetTriggerMillis", targetTriggerMillis)
                    .putLong("lastSyncMillis", System.currentTimeMillis())
                    .apply();

            Log.d(TAG, "Adaptive alarm armed for ID [" + alarmId + "] (" + stationName + ", Train " + trainNumber + "). Target: " + new Date(targetTriggerMillis));

            // 1. Schedule exact system alarm clock for this specific alarm
            scheduleAlarmClock(context, targetTriggerMillis, trainNumber, trainName, stationCode, stationName, platform, triggerMinutes);

            // 2. Schedule adaptive periodic background sync with 3-minute pre-flight check
            long timeUntilTarget = targetTriggerMillis - System.currentTimeMillis();
            long initialSyncDelay;
            if (timeUntilTarget <= (3 * 60 * 1000L)) {
                initialSyncDelay = Math.max(30 * 1000L, timeUntilTarget);
            } else if (timeUntilTarget <= (8 * 60 * 1000L)) {
                initialSyncDelay = timeUntilTarget - (3 * 60 * 1000L);
            } else if (timeUntilTarget <= (35 * 60 * 1000L)) {
                initialSyncDelay = 5 * 60 * 1000L;
            } else {
                initialSyncDelay = 15 * 60 * 1000L;
            }
            scheduleNextSync(context, trainNumber, stationCode, initialSyncDelay);

            // 3. Start Foreground Telemetry Service to guarantee unthrottled network polling
            try {
                Intent trackingService = new Intent(context, AdaptiveTrackingService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(trackingService);
                } else {
                    context.startService(trackingService);
                }
                Log.d(TAG, "Started AdaptiveTrackingService for live background telemetry polling.");
            } catch (Exception ex) {
                Log.e(TAG, "Failed launching AdaptiveTrackingService: " + ex.getMessage());
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed storing alarm for ID [" + alarmId + "]", e);
        }
    }

    public void scheduleAlarmClock(
            Context context,
            long targetTriggerMillis,
            String trainNumber,
            String trainName,
            String stationCode,
            String stationName,
            int triggerMinutes
    ) {
        scheduleAlarmClock(context, targetTriggerMillis, trainNumber, trainName, stationCode, stationName, "", triggerMinutes);
    }

    public void scheduleAlarmClock(
            Context context,
            long targetTriggerMillis,
            String trainNumber,
            String trainName,
            String stationCode,
            String stationName,
            String platform,
            int triggerMinutes
    ) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        int reqCode = getAlarmReqCode(trainNumber, stationCode);
        String alarmId = buildAlarmId(trainNumber, stationCode);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title", "🔔 " + stationName + " Approaching (" + triggerMinutes + "m Warning)");
        intent.putExtra("body", "Train " + trainNumber + " is nearing " + stationName + "! Time to prepare.");
        intent.putExtra("trainNumber", trainNumber);
        intent.putExtra("trainName", trainName);
        intent.putExtra("stationCode", stationCode);
        intent.putExtra("stationName", stationName);
        intent.putExtra("platform", platform != null ? platform : "");
        intent.putExtra("triggerMinutes", triggerMinutes);
        intent.putExtra("alarmId", alarmId);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                reqCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent showIntent = new Intent(context, MainActivity.class);
        showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        showIntent.putExtra("from_alarm", true);
        showIntent.putExtra("trainNumber", trainNumber);
        showIntent.putExtra("stationCode", stationCode);
        showIntent.putExtra("platform", platform != null ? platform : "");
        showIntent.putExtra("alarmId", alarmId);
        PendingIntent showPendingIntent = PendingIntent.getActivity(
                context,
                reqCode,
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
            Log.d(TAG, "Scheduled system AlarmClock for ID [" + alarmId + "] at: " + new Date(targetTriggerMillis));
        } catch (SecurityException se) {
            Log.e(TAG, "SecurityException scheduling alarm clock: " + se.getMessage());
        }
    }

    public void scheduleNextSync(Context context, String trainNumber, String stationCode, long delayMillis) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        int syncReqCode = getSyncReqCode(trainNumber, stationCode);
        String alarmId = buildAlarmId(trainNumber, stationCode);

        Intent syncIntent = new Intent(context, AdaptiveSyncReceiver.class);
        syncIntent.putExtra("trainNumber", trainNumber);
        syncIntent.putExtra("stationCode", stationCode);
        syncIntent.putExtra("alarmId", alarmId);

        PendingIntent syncPendingIntent = PendingIntent.getBroadcast(
                context,
                syncReqCode,
                syncIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAt = System.currentTimeMillis() + delayMillis;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Intent showIntent = new Intent(context, MainActivity.class);
                PendingIntent showPI = PendingIntent.getActivity(context, syncReqCode, showIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(triggerAt, showPI);
                alarmManager.setAlarmClock(clockInfo, syncPendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
            }
            Log.d(TAG, "Next adaptive sync for [" + alarmId + "] scheduled via AlarmClock in " + (delayMillis / 60000) + " minutes (" + new Date(triggerAt) + ")");
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling adaptive sync: " + e.getMessage());
        }
    }

    public void scheduleNextSync(Context context, long delayMillis) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String tn = prefs.getString("trainNumber", "");
        String sc = prefs.getString("stationCode", "");
        if (!tn.isEmpty() && !sc.isEmpty()) {
            scheduleNextSync(context, tn, sc, delayMillis);
        }
    }

    public synchronized void cancelAlarm(Context context, String trainNumber, String stationCode) {
        if (trainNumber == null || stationCode == null) {
            cancelAllAlarms(context);
            return;
        }

        String alarmId = buildAlarmId(trainNumber, stationCode);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        if (alarmManager != null) {
            int alarmReq = getAlarmReqCode(trainNumber, stationCode);
            Intent alarmIntent = new Intent(context, AlarmReceiver.class);
            PendingIntent piAlarm = PendingIntent.getBroadcast(
                    context,
                    alarmReq,
                    alarmIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(piAlarm);

            int syncReq = getSyncReqCode(trainNumber, stationCode);
            Intent syncIntent = new Intent(context, AdaptiveSyncReceiver.class);
            PendingIntent piSync = PendingIntent.getBroadcast(
                    context,
                    syncReq,
                    syncIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(piSync);
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject alarmsMap = getAlarmsMap(prefs);
        alarmsMap.remove(alarmId);

        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(PREF_ALARMS_MAP, alarmsMap.toString());

        if (alarmsMap.length() == 0) {
            editor.clear();
            stopAudioAndServices(context);
        } else {
            // Keep legacy keys populated with one remaining alarm
            Iterator<String> keys = alarmsMap.keys();
            if (keys.hasNext()) {
                JSONObject rem = alarmsMap.optJSONObject(keys.next());
                if (rem != null) {
                    editor.putBoolean("isArmed", true)
                            .putString("trainNumber", rem.optString("trainNumber"))
                            .putString("trainName", rem.optString("trainName"))
                            .putString("stationCode", rem.optString("stationCode"))
                            .putString("stationName", rem.optString("stationName"))
                            .putInt("triggerMinutes", rem.optInt("triggerMinutes"))
                            .putLong("targetTriggerMillis", rem.optLong("targetTriggerMillis"));
                }
            }
        }
        editor.apply();

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(getNotificationId(trainNumber, stationCode));
        }

        Log.d(TAG, "Adaptive alarm cancelled for ID [" + alarmId + "]. Remaining active alarms: " + alarmsMap.length());
    }

    public synchronized void cancelAllAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject alarmsMap = getAlarmsMap(prefs);

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            Iterator<String> keys = alarmsMap.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                JSONObject obj = alarmsMap.optJSONObject(key);
                if (obj != null) {
                    String tn = obj.optString("trainNumber");
                    String sc = obj.optString("stationCode");
                    int alarmReq = getAlarmReqCode(tn, sc);
                    Intent ai = new Intent(context, AlarmReceiver.class);
                    PendingIntent piA = PendingIntent.getBroadcast(context, alarmReq, ai, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    alarmManager.cancel(piA);

                    int syncReq = getSyncReqCode(tn, sc);
                    Intent si = new Intent(context, AdaptiveSyncReceiver.class);
                    PendingIntent piS = PendingIntent.getBroadcast(context, syncReq, si, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    alarmManager.cancel(piS);
                }
            }
        }

        prefs.edit().clear().apply();
        stopAudioAndServices(context);
        Log.d(TAG, "All adaptive alarms and sync listeners cancelled successfully.");
    }

    public void cancelAlarm(Context context) {
        cancelAllAlarms(context);
    }

    private void stopAudioAndServices(Context context) {
        try {
            Intent stopTracking = new Intent(context, AdaptiveTrackingService.class);
            context.stopService(stopTracking);
        } catch (Exception ignored) {}

        try {
            Intent stopService = new Intent(context, AlarmForegroundService.class);
            context.stopService(stopService);
        } catch (Exception ignored) {}

        AlarmSoundPlayer.getInstance().stopAlarm(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(AlarmReceiver.NOTIFICATION_ID);
            nm.cancel(AlarmForegroundService.NOTIFICATION_ID);
        }
    }

    public static JSONObject getAlarmsMap(SharedPreferences prefs) {
        String json = prefs.getString(PREF_ALARMS_MAP, null);
        if (json != null && !json.trim().isEmpty()) {
            try {
                return new JSONObject(json);
            } catch (Exception ignored) {}
        }
        JSONObject map = new JSONObject();
        if (prefs.getBoolean("isArmed", false)) {
            String tn = prefs.getString("trainNumber", "");
            String sc = prefs.getString("stationCode", "");
            if (!tn.isEmpty() && !sc.isEmpty()) {
                String id = buildAlarmId(tn, sc);
                try {
                    JSONObject legacy = new JSONObject();
                    legacy.put("id", id);
                    legacy.put("trainNumber", tn);
                    legacy.put("trainName", prefs.getString("trainName", "Train " + tn));
                    legacy.put("stationCode", sc);
                    legacy.put("stationName", prefs.getString("stationName", ""));
                    legacy.put("triggerMinutes", prefs.getInt("triggerMinutes", 30));
                    legacy.put("expectedArrival", prefs.getString("expectedArrival", ""));
                    legacy.put("journeyDate", prefs.getString("journeyDate", ""));
                    legacy.put("backendUrl", prefs.getString("backendUrl", ""));
                    legacy.put("targetTriggerMillis", prefs.getLong("targetTriggerMillis", 0L));
                    legacy.put("lastSyncMillis", prefs.getLong("lastSyncMillis", 0L));
                    map.put(id, legacy);
                } catch (Exception ignored) {}
            }
        }
        return map;
    }

    public List<JSONObject> getActiveAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject map = getAlarmsMap(prefs);
        List<JSONObject> list = new ArrayList<>();
        Iterator<String> keys = map.keys();
        while (keys.hasNext()) {
            JSONObject obj = map.optJSONObject(keys.next());
            if (obj != null) {
                list.add(obj);
            }
        }
        return list;
    }

    public static String formatDelayHoursAndMinutes(int delayMinutes) {
        if (delayMinutes <= 0) {
            return "On Time";
        }
        if (delayMinutes < 60) {
            return delayMinutes + " mins late";
        }
        int hrs = delayMinutes / 60;
        int mins = delayMinutes % 60;
        if (mins == 0) {
            return hrs + (hrs > 1 ? " hrs late" : " hr late");
        }
        return hrs + (hrs > 1 ? " hrs " : " hr ") + mins + " mins late";
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
        String delayText = formatDelayHoursAndMinutes(delayMinutes);

        String title = "🚆 Train " + trainNumber + " Schedule Update";
        String body = "Train is " + delayText + ". Wake-up alarm automatically shifted to " + formattedTime + " for " + stationName + ".";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, SYNC_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

        nm.notify(SYNC_CHANNEL_ID.hashCode(), builder.build());
    }

    public static String formatTimeClean(String rawTime) {
        if (rawTime == null || rawTime.trim().isEmpty()) {
            return "Scheduled";
        }
        String clean = rawTime.trim();
        try {
            if (clean.contains("T")) {
                int tIdx = clean.indexOf("T");
                String timePart = clean.substring(tIdx + 1);
                if (timePart.contains("+")) {
                    timePart = timePart.substring(0, timePart.indexOf("+"));
                } else if (timePart.contains("-")) {
                    timePart = timePart.substring(0, timePart.indexOf("-"));
                }
                String[] parts = timePart.split(":");
                int hour = Integer.parseInt(parts[0]);
                int min = Integer.parseInt(parts[1]);
                Calendar c = Calendar.getInstance();
                c.set(Calendar.HOUR_OF_DAY, hour);
                c.set(Calendar.MINUTE, min);
                SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                return sdf.format(c.getTime());
            } else if (clean.contains(":")) {
                String[] parts = clean.split(":");
                int hour = Integer.parseInt(parts[0]);
                int min = Integer.parseInt(parts[1]);
                Calendar c = Calendar.getInstance();
                c.set(Calendar.HOUR_OF_DAY, hour);
                c.set(Calendar.MINUTE, min);
                SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                return sdf.format(c.getTime());
            }
        } catch (Exception e) {
            Log.w(TAG, "formatTimeClean fallback: " + rawTime);
        }
        return clean;
    }

    public void postTelemetryStatusNotification(
            Context context,
            String trainNumber,
            String stationName,
            String stationCode,
            int delayMinutes,
            String expectedArrival,
            long targetTriggerMillis,
            long nextSyncMillis
    ) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        createSyncChannel(nm);

        SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        String alarmTimeStr = timeFmt.format(new Date(targetTriggerMillis));
        String nextSyncStr = timeFmt.format(new Date(nextSyncMillis));
        String checkedNowStr = timeFmt.format(new Date());

        String cleanArrival = formatTimeClean(expectedArrival);
        String delayText = formatDelayHoursAndMinutes(delayMinutes);
        String title = "🚆 Train " + trainNumber + " • " + stationCode + " (" + delayText + ")";
        String summary = "Arrival: " + cleanArrival + " • Alarm: " + alarmTimeStr;
        String fullBody = summary + "\n"
                + "Status: " + delayText + " • Checked: " + checkedNowStr + " • Next live check: " + nextSyncStr;

        Intent showIntent = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(context, 9091, showIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, SYNC_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_popup_sync)
                .setContentTitle(title)
                .setContentText(summary)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(fullBody))
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        nm.notify(getNotificationId(trainNumber, stationCode), builder.build());
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

            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, min);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);

            long arrivalMillis = cal.getTimeInMillis();
            long now = System.currentTimeMillis();

            // If parsed arrival time was more than 30 mins ago today, it refers to tomorrow
            if (arrivalMillis < (now - 30 * 60 * 1000L)) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
                arrivalMillis = cal.getTimeInMillis();
            }

            // Target trigger time is (arrival - advance warning minutes)
            long targetTrigger = arrivalMillis - (triggerMinutes * 60 * 1000L);

            // If train is arriving sooner than the trigger window (or running early), trigger immediately (in 5s)
            if (targetTrigger <= now && arrivalMillis > now) {
                return now + 5000L;
            }

            return Math.max(now + 10000L, targetTrigger);
        } catch (Exception e) {
            Log.w(TAG, "Failed parsing arrival time '" + timeStr + "', fallback to default countdown", e);
            return System.currentTimeMillis() + (triggerMinutes * 60 * 1000L);
        }
    }
}
