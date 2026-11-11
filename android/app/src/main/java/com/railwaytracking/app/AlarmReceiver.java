package com.railwaytracking.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "railtrack_high_priority_alarm_v2";
    public static final String CHANNEL_NAME = "RailTrack Urgent Train Alarms";
    public static final int NOTIFICATION_ID = 9901;
    public static final String ACTION_PREWAKE = "com.railwaytracking.app.ACTION_PREWAKE";
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && ACTION_PREWAKE.equals(intent.getAction())) {
            Log.d(TAG, "5-Second CPU Pre-Wakeup triggered! Waking CPU and screen to prepare audio hardware.");
            try {
                android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    android.os.PowerManager.WakeLock cpuLock = pm.newWakeLock(
                        android.os.PowerManager.PARTIAL_WAKE_LOCK | android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP,
                        "railtrack:prewake_cpu"
                    );
                    cpuLock.acquire(15000L); // Keep CPU awake through the 5s transition into the alarm

                    android.os.PowerManager.WakeLock screenLock = pm.newWakeLock(
                        android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                        android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        android.os.PowerManager.ON_AFTER_RELEASE,
                        "railtrack:prewake_screen"
                    );
                    screenLock.acquire(10000L);
                }
            } catch (Exception ex) {
                Log.w(TAG, "Pre-wakeup lock error: " + ex.getMessage());
            }
            return;
        }

        Log.d(TAG, "AlarmReceiver fired! Starting AlarmForegroundService.");

        // Wake screen and CPU immediately on alarm trigger so device is 100% active
        try {
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                android.os.PowerManager.WakeLock cpuLock = pm.newWakeLock(
                    android.os.PowerManager.PARTIAL_WAKE_LOCK | android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "railtrack:alarm_receiver_cpu"
                );
                cpuLock.acquire(20000L); // 20s transition CPU guarantee

                android.os.PowerManager.WakeLock screenLock = pm.newWakeLock(
                    android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                    android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    android.os.PowerManager.ON_AFTER_RELEASE,
                    "railtrack:alarm_receiver_screen_wakeup"
                );
                screenLock.acquire(10000L); // Keep screen lit for 10s
            }
        } catch (Exception ex) {
            Log.w(TAG, "Screen wakeup lock warning: " + ex.getMessage());
        }

        String title = intent != null ? intent.getStringExtra("title") : null;
        if (title == null || title.isBlank()) {
            title = "🌅 RailTrack Wake-Up Alarm!";
        }
        String body = intent != null ? intent.getStringExtra("body") : null;
        if (body == null || body.isBlank()) {
            body = "Your scheduled train departure alarm is ringing now! Tap to open or silence.";
        }

        int triggerMinutes = intent != null ? intent.getIntExtra("triggerMinutes", 30) : 30;
        String alarmId = intent != null ? intent.getStringExtra("alarmId") : null;
        String trainNumber = intent != null ? intent.getStringExtra("trainNumber") : null;
        String stationCode = intent != null ? intent.getStringExtra("stationCode") : null;

        // Physical Distance Guard for At-Station Landmark Alarms (triggerMinutes == 0):
        // Landmark alarms purely consider distance! The alarm MUST only ring when the train
        // physically reaches within 1.0 km radius, arrives at the station, or has departed it.
        if (triggerMinutes == 0 && stationCode != null) {
            android.content.SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
            org.json.JSONObject alarmsMap = AdaptiveAlarmManager.getAlarmsMap(prefs);
            String targetAlarmId = alarmId != null ? alarmId : AdaptiveAlarmManager.buildAlarmId(trainNumber, stationCode);
            org.json.JSONObject targetAlarm = alarmsMap.optJSONObject(targetAlarmId);
            double targetDist = targetAlarm != null ? targetAlarm.optDouble("distanceKm", -1.0) : -1.0;
            double lastKnownDist = prefs.getFloat("lastKnownDistanceKm", -1.0f);

            boolean isPhysicalArrivalConfirmed = (targetDist > 0 && lastKnownDist > 0 && lastKnownDist >= (targetDist - 1.0));
            if (!isPhysicalArrivalConfirmed) {
                Log.d(TAG, "Landmark Alarm Clock fired on time, but physical train is at " + lastKnownDist
                        + " km (target " + targetDist + " km). Landmark alarms purely consider distance! Suppressing premature ring and polling live tracking!");
                String tn = targetAlarm != null ? targetAlarm.optString("trainName") : ("Train " + trainNumber);
                String sn = targetAlarm != null ? targetAlarm.optString("stationName") : stationCode;
                AdaptiveAlarmManager.getInstance().scheduleAlarmClock(context, System.currentTimeMillis() + 60000L, trainNumber, tn, stationCode, sn, 0);
                AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 0);
                return;
            }
        }

        // Delegate execution to un-killable Foreground Service
        Intent serviceIntent = new Intent(context, AlarmForegroundService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        if (intent != null) {
            serviceIntent.putExtra("trainNumber", trainNumber);
            serviceIntent.putExtra("trainName", intent.getStringExtra("trainName"));
            serviceIntent.putExtra("stationCode", stationCode);
            serviceIntent.putExtra("stationName", intent.getStringExtra("stationName"));
            serviceIntent.putExtra("platform", intent.getStringExtra("platform"));
            serviceIntent.putExtra("triggerMinutes", triggerMinutes);
            serviceIntent.putExtra("alarmId", alarmId);
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception ex) {
            Log.e(TAG, "Failed to start AlarmForegroundService: " + ex.getMessage());
            // Fallback direct playback
            AlarmSoundPlayer.getInstance().startAlarm(context);
        }
    }
}
