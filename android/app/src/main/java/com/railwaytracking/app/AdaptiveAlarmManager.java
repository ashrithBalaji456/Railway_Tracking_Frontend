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
        armAlarm(context, trainNumber, trainName, stationCode, stationName, triggerMinutes, expectedArrival, journeyDate, backendUrl, "", "");
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
            String platform,
            String backupEmail,
            double distanceKm,
            String scheduledTime
    ) {
        String effectiveTime = (expectedArrival != null && !expectedArrival.trim().isEmpty() && !expectedArrival.equalsIgnoreCase("null"))
                ? expectedArrival : scheduledTime;
        long targetTriggerMillis = calculateTriggerMillis(effectiveTime, triggerMinutes);
        if (targetTriggerMillis <= 0) {
            targetTriggerMillis = System.currentTimeMillis() + (triggerMinutes * 60 * 1000L);
        }
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
            alarmObj.put("expectedArrival", effectiveTime != null ? effectiveTime : "");
            alarmObj.put("scheduledTime", scheduledTime != null ? scheduledTime : "");
            alarmObj.put("distanceKm", distanceKm);
            alarmObj.put("journeyDate", journeyDate != null ? journeyDate : "");
            alarmObj.put("backendUrl", backendUrl != null ? backendUrl : "https://railway-tracking-backend-gwa2.onrender.com");
            alarmObj.put("backupEmail", backupEmail != null ? backupEmail : "");
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
                    .putString("expectedArrival", effectiveTime != null ? effectiveTime : "")
                    .putString("scheduledTime", scheduledTime != null ? scheduledTime : "")
                    .putFloat("distanceKm", (float) distanceKm)
                    .putString("journeyDate", journeyDate != null ? journeyDate : "")
                    .putString("backendUrl", backendUrl != null ? backendUrl : "https://railway-tracking-backend-gwa2.onrender.com")
                    .putLong("targetTriggerMillis", targetTriggerMillis)
                    .putLong("lastSyncMillis", System.currentTimeMillis())
                    .apply();

            Log.d(TAG, "Adaptive alarm armed for ID [" + alarmId + "] (" + stationName + ", Train " + trainNumber + "). Target: " + new Date(targetTriggerMillis));

            // 1. Schedule exact system alarm clock for this specific alarm
            scheduleAlarmClock(context, targetTriggerMillis, trainNumber, trainName, stationCode, stationName, platform, triggerMinutes);

            // 2. Schedule adaptive periodic background sync with high-precision approach ladder
            long timeUntilTarget = targetTriggerMillis - System.currentTimeMillis();
            long initialSyncDelay;
            if (timeUntilTarget <= (3 * 60 * 1000L)) {
                initialSyncDelay = 45 * 1000L;
            } else if (timeUntilTarget <= (8 * 60 * 1000L)) {
                initialSyncDelay = 60 * 1000L;
            } else if (timeUntilTarget <= (15 * 60 * 1000L)) {
                initialSyncDelay = 2 * 60 * 1000L;
            } else if (timeUntilTarget <= (30 * 60 * 1000L)) {
                initialSyncDelay = 3 * 60 * 1000L;
            } else if (timeUntilTarget <= (60 * 60 * 1000L)) {
                initialSyncDelay = 5 * 60 * 1000L;
            } else {
                initialSyncDelay = 10 * 60 * 1000L;
            }

            if (distanceKm > 0) {
                if (distanceKm <= 2.0) {
                    initialSyncDelay = Math.min(initialSyncDelay, 30 * 1000L);
                } else if (distanceKm <= 5.0) {
                    initialSyncDelay = Math.min(initialSyncDelay, 60 * 1000L);
                } else if (distanceKm <= 12.0) {
                    initialSyncDelay = Math.min(initialSyncDelay, 2 * 60 * 1000L);
                } else if (distanceKm <= 25.0) {
                    initialSyncDelay = Math.min(initialSyncDelay, 3 * 60 * 1000L);
                }
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
            String platform,
            String backupEmail
    ) {
        armAlarm(context, trainNumber, trainName, stationCode, stationName, triggerMinutes, expectedArrival, journeyDate, backendUrl, platform, backupEmail, -1.0, "");
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

        long effectiveAlarmClockMillis = Math.max(System.currentTimeMillis() + 30000L, targetTriggerMillis);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(effectiveAlarmClockMillis, showPendingIntent);
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, effectiveAlarmClockMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, effectiveAlarmClockMillis, pendingIntent);
            }
            Log.d(TAG, "Scheduled system AlarmClock for ID [" + alarmId + "] at: " + new Date(effectiveAlarmClockMillis));

            // Schedule 5-second CPU Pre-Wakeup so CPU and audio hardware are 100% warm before alarm rings
            long preWakeMillis = targetTriggerMillis - 5000L;
            if (preWakeMillis > System.currentTimeMillis()) {
                Intent preWakeIntent = new Intent(context, AlarmReceiver.class);
                preWakeIntent.setAction(AlarmReceiver.ACTION_PREWAKE);
                preWakeIntent.putExtra("alarmId", alarmId);
                PendingIntent piPreWake = PendingIntent.getBroadcast(
                    context,
                    reqCode + 500,
                    preWakeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(preWakeMillis, showPendingIntent), piPreWake);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, preWakeMillis, piPreWake);
                }
                Log.d(TAG, "Scheduled 5-second CPU Pre-Wakeup for ID [" + alarmId + "] at: " + new Date(preWakeMillis));
            }
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

        // Immediate sync request: send broadcast directly without AlarmManager so past timestamps are never discarded!
        if (delayMillis <= 0) {
            Log.d(TAG, "Immediate sync requested for [" + alarmId + "]. Triggering broadcast directly.");
            context.sendBroadcast(syncIntent);
            return;
        }

        PendingIntent syncPendingIntent = PendingIntent.getBroadcast(
                context,
                syncReqCode,
                syncIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAt = System.currentTimeMillis() + delayMillis;
        try {
            // For approach intervals (delayMillis <= 5 minutes), use setAlarmClock to bypass Android Doze 9-minute throttling!
            if (delayMillis <= (5 * 60 * 1000L) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Intent showIntent = new Intent(context, MainActivity.class);
                PendingIntent showPI = PendingIntent.getActivity(context, syncReqCode, showIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(triggerAt, showPI);
                alarmManager.setAlarmClock(clockInfo, syncPendingIntent);
                Log.d(TAG, "Approach sync for [" + alarmId + "] scheduled via unthrottled AlarmClock in " + (delayMillis / 1000) + "s (" + new Date(triggerAt) + ")");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
                Log.d(TAG, "Standard sync for [" + alarmId + "] scheduled via exact RTC in " + (delayMillis / 1000) + "s (" + new Date(triggerAt) + ")");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAt, syncPendingIntent);
            }
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

            Intent preWakeIntent = new Intent(context, AlarmReceiver.class);
            PendingIntent piPreWake = PendingIntent.getBroadcast(
                    context,
                    alarmReq + 500,
                    preWakeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(piPreWake);

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
            int delayMinutes,
            double remainingKm,
            int triggerMinutes
    ) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        createSyncChannel(nm);

        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        String formattedTime = sdf.format(new Date(newTriggerMillis));
        String delayText = formatDelayHoursAndMinutes(delayMinutes);

        String title = "🚆 Train " + trainNumber + " Schedule Update";
        String body;
        if (triggerMinutes == 0) {
            String distPart = remainingKm >= 0.0 ? String.format(Locale.getDefault(), "%.1f km away", remainingKm) : "Approaching";
            body = "Train is " + distPart + " (" + delayText + "). Expected arrival shifted to " + formattedTime + " for " + stationName + ". Alarm rings at station.";
        } else {
            body = "Train is " + delayText + ". Wake-up alarm automatically shifted to " + formattedTime + " for " + stationName + ".";
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, SYNC_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

        nm.notify(SYNC_CHANNEL_ID.hashCode(), builder.build());
    }

    public void postScheduleShiftNotification(
            Context context,
            String trainNumber,
            String stationName,
            long newTriggerMillis,
            int delayMinutes
    ) {
        postScheduleShiftNotification(context, trainNumber, stationName, newTriggerMillis, delayMinutes, -1.0, 30);
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
            long nextSyncMillis,
            double remainingKm,
            int triggerMinutes
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
        String summary;
        if (triggerMinutes == 0) {
            String distPart = remainingKm >= 0.0 ? String.format(Locale.getDefault(), "%.1f km away", remainingKm) : "At station";
            summary = distPart + " • Expected: " + cleanArrival;
        } else {
            summary = "Arrival: " + cleanArrival + " • Alarm: " + alarmTimeStr;
        }

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
        postTelemetryStatusNotification(context, trainNumber, stationName, stationCode, delayMinutes, expectedArrival, targetTriggerMillis, nextSyncMillis, -1.0, 30);
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

    /**
     * Parse static clock timetable time (e.g. "03:02" or ISO) into absolute epoch milliseconds
     * without clamping to System.currentTimeMillis().
     */
    public static long parseClockTimeToMillis(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty() || timeStr.equalsIgnoreCase("null")) {
            return 0L;
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

            long millis = cal.getTimeInMillis();
            long now = System.currentTimeMillis();

            if (millis < (now - 12 * 60 * 60 * 1000L)) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
                millis = cal.getTimeInMillis();
            } else if (millis > (now + 12 * 60 * 60 * 1000L)) {
                cal.add(Calendar.DAY_OF_YEAR, -1);
                millis = cal.getTimeInMillis();
            }
            return millis;
        } catch (Exception e) {
            return 0L;
        }
    }

    public static long calculateTriggerMillis(String timeStr, int triggerMinutes) {
        if (timeStr == null || timeStr.trim().isEmpty() || timeStr.equalsIgnoreCase("null")) {
            return 0L;
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
