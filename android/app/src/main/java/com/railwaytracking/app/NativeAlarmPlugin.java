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
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(
    name = "NativeAlarm",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class NativeAlarmPlugin extends Plugin {

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

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }

            Log.d(TAG, "Exact alarm scheduled in " + seconds + " seconds (" + triggerAtMillis + " ms)");

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
    public void cancelAlarm(PluginCall call) {
        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            Intent intent = new Intent(context, AlarmReceiver.class);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                ALARM_REQ_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pendingIntent);
        }
        JSObject ret = new JSObject();
        ret.put("cancelled", true);
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
        AlarmSoundPlayer.getInstance().stopAlarm(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(AlarmReceiver.NOTIFICATION_ID);
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(context)) {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("openedSettings", true);
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getActivity() != null) {
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                    2001
                );
            }
        }
        JSObject ret = new JSObject();
        ret.put("requested", true);
        call.resolve(ret);
    }
}
