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

        // 4. Dispatch Awake Email asynchronously if email was configured
        try {
            android.content.SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
            String backupEmail = prefs.getString("backupEmail", "");
            if (backupEmail.contains("@")) {
                final String email = backupEmail;
                final String trainNumber = prefs.getString("trainNumber", "");
                final String trainName = prefs.getString("trainName", "Express");
                final String stationCode = prefs.getString("stationCode", "");
                final String stationName = prefs.getString("stationName", stationCode);
                final String platform = prefs.getString("platform", "");

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
                        payload.put("trainNumber", trainNumber);
                        payload.put("trainName", trainName);
                        payload.put("stationCode", stationCode);
                        payload.put("stationName", stationName);
                        payload.put("etaMinutes", 0);
                        payload.put("platform", platform);
                        payload.put("action", "AWAKE");

                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            os.write(payload.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                            os.flush();
                        }
                        conn.getResponseCode();
                    } catch (Exception ignored) {}
                }).start();
            }
        } catch (Exception ignored) {}
    }
}
