package com.railwaytracking.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final int NOTIF_REQ_CODE = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null) {
            getBridge().registerPlugin(NativeAlarmPlugin.class);
        }

        // 1. Turn on screen and show activity above keyguard when an alarm rings
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        // 2. Automatic Notification Permission Prompt on App Startup (Android 13+ / API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Requesting POST_NOTIFICATIONS permission from user on startup");
                requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, NOTIF_REQ_CODE);
            }
        }
    }
}
