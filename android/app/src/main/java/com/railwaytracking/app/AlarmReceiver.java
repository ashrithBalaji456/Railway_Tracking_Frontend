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
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "AlarmReceiver fired! Starting AlarmForegroundService.");

        // Wake screen and CPU immediately on alarm trigger so device is 100% active
        try {
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
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

        // Delegate execution to un-killable Foreground Service
        Intent serviceIntent = new Intent(context, AlarmForegroundService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        if (intent != null) {
            serviceIntent.putExtra("trainNumber", intent.getStringExtra("trainNumber"));
            serviceIntent.putExtra("trainName", intent.getStringExtra("trainName"));
            serviceIntent.putExtra("stationCode", intent.getStringExtra("stationCode"));
            serviceIntent.putExtra("stationName", intent.getStringExtra("stationName"));
            serviceIntent.putExtra("platform", intent.getStringExtra("platform"));
            serviceIntent.putExtra("triggerMinutes", intent.getIntExtra("triggerMinutes", 30));
            serviceIntent.putExtra("alarmId", intent.getStringExtra("alarmId"));
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
