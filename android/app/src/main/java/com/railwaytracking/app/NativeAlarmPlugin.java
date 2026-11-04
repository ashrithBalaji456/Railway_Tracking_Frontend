package com.railwaytracking.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.File;
import java.io.FileOutputStream;

@SuppressWarnings("deprecation")
@com.getcapacitor.NativePlugin(name = "NativeAlarm")
@CapacitorPlugin(name = "NativeAlarm")
public class NativeAlarmPlugin extends Plugin {

    public NativeAlarmPlugin() {
        super();
    }

    private static final String TAG = "NativeAlarmPlugin";
    private static final int ALARM_REQ_CODE = 8801;

    @PluginMethod
    public void scheduleExactAlarm(PluginCall call) {
        Integer seconds = call.getInt("seconds");
        if (seconds == null || seconds <= 0) {
            seconds = 120; // 2 minutes default
        }
        String title = call.getString("title", "🌅 RailTrack Wake-Up Alarm!");
        String body = call.getString("body", "Train departure alert! Tap to open and silence.");

        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        if (alarmManager == null) {
            call.reject("AlarmManager service not available");
            return;
        }

        // Check exact alarm permission on Android 12+ (API 31+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }

        long triggerAtMillis = System.currentTimeMillis() + (seconds * 1000L);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);

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
                AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(triggerAtMillis, showPendingIntent);
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }

            Log.d(TAG, "Exact AlarmClock scheduled in " + seconds + " seconds (" + triggerAtMillis + " ms)");

            JSObject ret = new JSObject();
            ret.put("scheduled", true);
            ret.put("triggerAtMillis", triggerAtMillis);
            ret.put("seconds", seconds);
            call.resolve(ret);
        } catch (SecurityException se) {
            Log.e(TAG, "SecurityException scheduling exact alarm: " + se.getMessage());
            call.reject("Exact alarm permission required: " + se.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Exception scheduling alarm: " + e.getMessage());
            call.reject("Failed scheduling alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void armAdaptiveStationAlarm(PluginCall call) {
        String trainNumber = call.getString("trainNumber");
        String stationCode = call.getString("stationCode");
        String stationName = call.getString("stationName", stationCode);
        Integer triggerMinutes = call.getInt("triggerMinutes", 30);
        String expectedArrival = call.getString("expectedArrival", "");
        String trainName = call.getString("trainName", "Train " + trainNumber);
        String journeyDate = call.getString("journeyDate", "");
        String backendUrl = call.getString("backendUrl", "https://railway-tracking-backend-gwa2.onrender.com");
        String platform = call.getString("platform", "");

        if (trainNumber == null || stationCode == null) {
            call.reject("trainNumber and stationCode are required");
            return;
        }

        Context context = getContext();

        // Check exact alarm permission on Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null && !am.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }

        AdaptiveAlarmManager.getInstance().armAlarm(
                context,
                trainNumber,
                trainName,
                stationCode,
                stationName,
                triggerMinutes,
                expectedArrival,
                journeyDate,
                backendUrl,
                platform
        );

        JSObject ret = new JSObject();
        ret.put("armed", true);
        ret.put("trainNumber", trainNumber);
        ret.put("stationCode", stationCode);
        ret.put("triggerMinutes", triggerMinutes);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        Context context = getContext();
        String trainNumber = call.getString("trainNumber");
        String stationCode = call.getString("stationCode");

        if (trainNumber != null && stationCode != null) {
            AdaptiveAlarmManager.getInstance().cancelAlarm(context, trainNumber, stationCode);
        } else {
            AdaptiveAlarmManager.getInstance().cancelAllAlarms(context);
        }

        JSObject ret = new JSObject();
        ret.put("cancelled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAdaptiveStationAlarm(PluginCall call) {
        Context context = getContext();
        String trainNumber = call.getString("trainNumber");
        String stationCode = call.getString("stationCode");

        if (trainNumber != null && stationCode != null) {
            AdaptiveAlarmManager.getInstance().cancelAlarm(context, trainNumber, stationCode);
        } else {
            AdaptiveAlarmManager.getInstance().cancelAllAlarms(context);
        }

        JSObject ret = new JSObject();
        ret.put("cancelled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getActiveAlarms(PluginCall call) {
        Context context = getContext();
        java.util.List<org.json.JSONObject> alarms = AdaptiveAlarmManager.getInstance().getActiveAlarms(context);
        com.getcapacitor.JSArray array = new com.getcapacitor.JSArray();
        for (org.json.JSONObject obj : alarms) {
            try {
                array.put(new JSObject(obj.toString()));
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("alarms", array);
        call.resolve(ret);
    }

    @PluginMethod
    public void setCustomAlarmAudio(PluginCall call) {
        String base64Data = call.getString("base64");
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("base64 audio data required");
            return;
        }

        try {
            byte[] audioBytes = Base64.decode(base64Data, Base64.DEFAULT);
            File audioFile = new File(getContext().getFilesDir(), "custom_alarm_sound.mp3");
            try (FileOutputStream fos = new FileOutputStream(audioFile)) {
                fos.write(audioBytes);
                fos.flush();
            }
            Log.d(TAG, "Saved custom alarm audio: " + audioFile.getAbsolutePath() + " (" + audioBytes.length + " bytes)");

            JSObject ret = new JSObject();
            ret.put("saved", true);
            ret.put("path", audioFile.getAbsolutePath());
            ret.put("size", audioBytes.length);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed saving custom audio: " + e.getMessage());
            call.reject("Failed to save audio file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearCustomAlarmAudio(PluginCall call) {
        try {
            File audioFile = new File(getContext().getFilesDir(), "custom_alarm_sound.mp3");
            if (audioFile.exists()) {
                audioFile.delete();
            }
            Log.d(TAG, "Cleared custom alarm audio; restored default ringtone");
            JSObject ret = new JSObject();
            ret.put("cleared", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed clearing custom audio: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        Context context = getContext();

        try {
            Intent stopService = new Intent(context, AlarmForegroundService.class);
            context.stopService(stopService);
        } catch (Exception ignored) {}

        AlarmSoundPlayer.getInstance().stopAlarm(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(AlarmReceiver.NOTIFICATION_ID);
            nm.cancel(AlarmForegroundService.NOTIFICATION_ID);
            nm.cancel(7701);
        }

        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isAlarmPlaying(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isPlaying", AlarmSoundPlayer.getInstance().isPlaying());
        call.resolve(ret);
    }

    @PluginMethod
    public void isAlarmRinging(PluginCall call) {
        boolean isPlaying = AlarmSoundPlayer.getInstance().isPlaying();
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);

        String ringingId = prefs.getString("ringing_alarm_id", "");
        String trainNumber = prefs.getString("ringing_train_number", prefs.getString("trainNumber", ""));
        String trainName = prefs.getString("trainName", "");
        String stationName = prefs.getString("ringing_station_name", prefs.getString("stationName", ""));
        String stationCode = prefs.getString("ringing_station_code", prefs.getString("stationCode", ""));
        String platform = prefs.getString("ringing_platform", prefs.getString("platform", ""));
        int triggerMinutes = prefs.getInt("ringing_trigger_minutes", prefs.getInt("triggerMinutes", 30));

        JSObject ret = new JSObject();
        ret.put("isRinging", isPlaying);
        ret.put("alarmId", ringingId);
        ret.put("trainNumber", trainNumber);
        ret.put("trainName", trainName);
        ret.put("stationName", stationName);
        ret.put("stationCode", stationCode);
        ret.put("platform", platform);
        ret.put("triggerMinutes", triggerMinutes);
        ret.put("expectedArrival", prefs.getString("expectedArrival", ""));
        call.resolve(ret);
    }

    @PluginMethod
    public void snoozeAlarm(PluginCall call) {
        int snoozeMinutes = call.getInt("minutes", 5);
        String trainNumber = call.getString("trainNumber");
        String stationCode = call.getString("stationCode");
        Context context = getContext();

        // 1. Stop current loud audio & foreground service
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

        android.content.SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
        if (trainNumber == null || trainNumber.isEmpty()) {
            trainNumber = prefs.getString("ringing_train_number", prefs.getString("trainNumber", ""));
        }
        if (stationCode == null || stationCode.isEmpty()) {
            stationCode = prefs.getString("ringing_station_code", prefs.getString("stationCode", ""));
        }
        String stationName = prefs.getString("ringing_station_name", prefs.getString("stationName", "Station"));
        String trainName = prefs.getString("trainName", "Train " + trainNumber);

        // 2. Schedule re-trigger in snoozeMinutes minutes
        long nextTriggerMillis = System.currentTimeMillis() + (snoozeMinutes * 60 * 1000L);
        AdaptiveAlarmManager.getInstance().scheduleAlarmClock(context, nextTriggerMillis, trainNumber, trainName, stationCode, stationName, snoozeMinutes);

        Log.d(TAG, "Alarm snoozed for [" + trainNumber + "_" + stationCode + "] for " + snoozeMinutes + " minutes; will re-ring at " + new java.util.Date(nextTriggerMillis));

        JSObject ret = new JSObject();
        ret.put("snoozed", true);
        ret.put("snoozeMinutes", snoozeMinutes);
        ret.put("nextTriggerMillis", nextTriggerMillis);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        boolean notificationsGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationsGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }

        boolean overlayGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            overlayGranted = Settings.canDrawOverlays(context);
        }

        boolean exactAlarmGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                exactAlarmGranted = alarmManager.canScheduleExactAlarms();
            }
        }

        JSObject ret = new JSObject();
        ret.put("notifications", notificationsGranted);
        ret.put("overlay", overlayGranted);
        ret.put("exactAlarm", exactAlarmGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        android.app.Activity activity = getActivity();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(context)) {
                boolean opened = false;
                // Strategy 1: Package-specific overlay settings
                try {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + context.getPackageName())
                    );
                    if (activity != null) {
                        activity.startActivity(intent);
                    } else {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(intent);
                    }
                    opened = true;
                } catch (Exception ex1) {
                    Log.w(TAG, "Package overlay intent failed: " + ex1.getMessage());
                }

                // Strategy 2: Generic overlay list (ColorOS/Realme UI/MIUI/OxygenOS fallback)
                if (!opened) {
                    try {
                        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                        if (activity != null) {
                            activity.startActivity(intent);
                        } else {
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            context.startActivity(intent);
                        }
                        opened = true;
                    } catch (Exception ex2) {
                        Log.w(TAG, "Generic overlay intent failed: " + ex2.getMessage());
                    }
                }

                // Strategy 3: App details settings fallback
                if (!opened) {
                    try {
                        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.parse("package:" + context.getPackageName()));
                        if (activity != null) {
                            activity.startActivity(intent);
                        } else {
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            context.startActivity(intent);
                        }
                        opened = true;
                    } catch (Exception ex3) {
                        Log.e(TAG, "All overlay intent attempts failed", ex3);
                    }
                }

                JSObject ret = new JSObject();
                ret.put("openedSettings", opened);
                call.resolve(ret);
                return;
            }
        }
        JSObject ret = new JSObject();
        ret.put("alreadyGranted", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        Context context = getContext();
        android.app.Activity activity = getActivity();
        boolean alreadyGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            alreadyGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            if (!alreadyGranted && activity != null) {
                ActivityCompat.requestPermissions(
                    activity,
                    new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                    2001
                );
            }
        }
        JSObject ret = new JSObject();
        ret.put("requested", true);
        ret.put("alreadyGranted", alreadyGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Context context = getContext();
        android.app.Activity activity = getActivity();
        boolean opened = false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
                    intent.putExtra("android.provider.extra.APP_PACKAGE", context.getPackageName());
                    intent.putExtra("app_package", context.getPackageName());
                    if (activity != null) {
                        activity.startActivity(intent);
                    } else {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(intent);
                    }
                    opened = true;
                } catch (Exception e1) {
                    Log.w(TAG, "Notification settings intent failed, trying app details: " + e1.getMessage());
                }
            }

            if (!opened) {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                if (activity != null) {
                    activity.startActivity(intent);
                } else {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                }
                opened = true;
            }

            JSObject ret = new JSObject();
            ret.put("opened", opened);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open notification settings", e);
            JSObject ret = new JSObject();
            ret.put("opened", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void sendTestNotification(PluginCall call) {
        Context context = getContext();
        String title = call.getString("title", "🔔 RailTrack Test Notification");
        String body = call.getString("body", "Notifications are active! You will receive live train delay alerts and departure wake-up alarms.");

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            call.reject("NotificationManager service not available");
            return;
        }

        String channelId = "railtrack_test_notification_channel";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.NotificationChannel channel = new android.app.NotificationChannel(
                channelId,
                "RailTrack Instant Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Test notifications and general train alerts");
            channel.enableVibration(true);
            nm.createNotificationChannel(channel);
        }

        Intent mainIntent = new Intent(context, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            2002,
            mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(new long[]{0, 300, 150, 300});

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                // Request it if not granted
                if (getActivity() != null) {
                    ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                        2001
                    );
                }
                call.reject("POST_NOTIFICATIONS permission not granted. Requested from user.");
                return;
            }
        }

        nm.notify(7701, builder.build());
        Log.d(TAG, "Test notification dispatched successfully (ID 7701)");

        JSObject ret = new JSObject();
        ret.put("sent", true);
        call.resolve(ret);
    }
}
