package com.railwaytracking.app;

import android.Manifest;
import android.content.Intent;
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
        this.initialPlugins.add(NativeAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null) {
            try {
                getBridge().registerPluginInstance(new NativeAlarmPlugin());
            } catch (Throwable t) {
                Log.w(TAG, "registerPluginInstance fallback: " + t.getMessage());
            }
        }

        wakeAndUnlockScreen();

        // Automatic Notification Permission Prompt on App Startup (Android 13+ / API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Requesting POST_NOTIFICATIONS permission from user on startup");
                requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, NOTIF_REQ_CODE);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        wakeAndUnlockScreen();
    }

    @Override
    public void onResume() {
        super.onResume();
        wakeAndUnlockScreen();
    }

    private void wakeAndUnlockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        );
    }
}
