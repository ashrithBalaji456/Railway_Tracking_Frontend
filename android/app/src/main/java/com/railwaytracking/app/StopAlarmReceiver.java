package com.railwaytracking.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class StopAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_STOP_ALARM = "com.railwaytracking.app.ACTION_STOP_ALARM";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("StopAlarmReceiver", "STOP ALARM triggered from notification action!");

        // 1. Stop Foreground Service
        try {
            Intent stopService = new Intent(context, AlarmForegroundService.class);
            context.stopService(stopService);
        } catch (Exception ignored) {}

        // 2. Stop native ringing audio & vibration
        AlarmSoundPlayer.getInstance().stopAlarm(context);

        // 3. Dismiss the persistent alarm notification
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(AlarmReceiver.NOTIFICATION_ID);
            nm.cancel(AlarmForegroundService.NOTIFICATION_ID);
        }
    }
}
