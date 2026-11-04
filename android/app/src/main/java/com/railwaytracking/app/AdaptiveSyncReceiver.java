package com.railwaytracking.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Adaptive Sync Receiver:
 * Executes periodically in background (every 15m, or 5m when near station)
 * to check Indian Railways live telemetry. If the train has been delayed
 * or recovered time, it dynamically reschedules the system AlarmClock!
 */
public class AdaptiveSyncReceiver extends BroadcastReceiver {

    private static final String TAG = "AdaptiveSyncReceiver";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "AdaptiveSyncReceiver triggered. Evaluating live train delay in background...");

        SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
        boolean isArmed = prefs.getBoolean("isArmed", false);
        if (!isArmed) {
            Log.d(TAG, "Adaptive alarm is not armed. Aborting background sync.");
            return;
        }

        final String trainNumber = prefs.getString("trainNumber", "");
        final String stationCode = prefs.getString("stationCode", "");
        final String stationName = prefs.getString("stationName", "");
        final int triggerMinutes = prefs.getInt("triggerMinutes", 30);
        final String journeyDate = prefs.getString("journeyDate", "");
        final String backendUrl = prefs.getString("backendUrl", "https://railway-tracking-backend-gwa2.onrender.com");
        final long currentTargetMillis = prefs.getLong("targetTriggerMillis", 0L);

        long now = System.currentTimeMillis();

        // 1. If target time has already been reached, trigger alarm immediately!
        if (currentTargetMillis > 0 && now >= currentTargetMillis) {
            Log.d(TAG, "Target trigger time reached! Firing alarm.");
            triggerAlarmNow(context, stationName, trainNumber, triggerMinutes);
            return;
        }

        // 2. Query backend live API with Android goAsync() to prevent OS killing the process
        final PendingResult pendingResult = goAsync();

        executor.execute(() -> {
            try {
                StringBuilder urlBuilder = new StringBuilder(backendUrl)
                        .append("/api/v1/trains/")
                        .append(trainNumber)
                        .append("/live");

                if (journeyDate != null && !journeyDate.trim().isEmpty()) {
                    urlBuilder.append("?journeyDate=").append(journeyDate.trim());
                }

                URL url = new URL(urlBuilder.toString());
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);
                conn.setRequestProperty("Accept", "application/json");

                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    Log.w(TAG, "Live status HTTP failed with code: " + responseCode + ". Retaining existing alarm.");
                    AdaptiveAlarmManager.getInstance().scheduleNextSync(context, 15 * 60 * 1000L);
                    return;
                }

                InputStream is = conn.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();
                is.close();

                JSONObject root = new JSONObject(sb.toString());
                if (!root.optBoolean("success", false) || !root.has("data")) {
                    Log.w(TAG, "Backend returned unsuccessful live payload. Retaining existing alarm.");
                    AdaptiveAlarmManager.getInstance().scheduleNextSync(context, 15 * 60 * 1000L);
                    return;
                }

                JSONObject data = root.getJSONObject("data");
                int currentDelay = data.optInt("delayMinutes", 0);
                JSONArray stations = data.optJSONArray("stations");

                boolean stationFound = false;
                String liveArrival = null;
                boolean isAtStation = false;

                if (stations != null) {
                    for (int i = 0; i < stations.length(); i++) {
                        JSONObject st = stations.getJSONObject(i);
                        String code = st.optString("stationCode", "");
                        if (code.equalsIgnoreCase(stationCode)) {
                            stationFound = true;
                            liveArrival = st.optString("expectedArrival", st.optString("arrivalTime", ""));
                            String status = st.optString("status", "").toUpperCase();
                            if (status.equals("AT_STATION") || status.equals("ARRIVED")) {
                                isAtStation = true;
                            }
                            break;
                        }
                    }
                }

                // If train has physically arrived, wake user immediately!
                if (isAtStation) {
                    Log.d(TAG, "Train physically arrived at " + stationCode + "! Firing alarm immediately.");
                    triggerAlarmNow(context, stationName, trainNumber, triggerMinutes);
                    return;
                }

                if (stationFound && liveArrival != null && !liveArrival.trim().isEmpty()) {
                    long newTargetMillis = AdaptiveAlarmManager.calculateTriggerMillis(liveArrival, triggerMinutes);
                    long shiftDifference = Math.abs(newTargetMillis - currentTargetMillis);

                    // If delay shift is greater than 3 minutes, reschedule AlarmClock!
                    if (shiftDifference >= (3 * 60 * 1000L)) {
                        Log.d(TAG, "Delay shift detected (" + (shiftDifference / 60000) + "m). Updating AlarmClock from "
                                + currentTargetMillis + " to " + newTargetMillis);

                        prefs.edit()
                                .putLong("targetTriggerMillis", newTargetMillis)
                                .putString("expectedArrival", liveArrival)
                                .putLong("lastSyncMillis", System.currentTimeMillis())
                                .apply();

                        AdaptiveAlarmManager.getInstance().scheduleAlarmClock(
                                context,
                                newTargetMillis,
                                stationName,
                                trainNumber,
                                triggerMinutes
                        );

                        AdaptiveAlarmManager.getInstance().postScheduleShiftNotification(
                                context,
                                trainNumber,
                                stationName,
                                newTargetMillis,
                                currentDelay
                        );
                    } else {
                        Log.d(TAG, "Train timing steady. Shift delta: " + (shiftDifference / 1000) + "s. No change needed.");
                    }

                    // Dynamically calculate next sync interval with 3-minute pre-flight check:
                    long remainingToTarget = newTargetMillis - System.currentTimeMillis();
                    long nextDelay;
                    if (remainingToTarget <= (3 * 60 * 1000L)) {
                        if (remainingToTarget <= 0) {
                            // Target reached or surpassed (train arrived earlier): trigger alarm ASAP!
                            Log.d(TAG, "Pre-flight check: target reached or train running early! Triggering alarm now.");
                            triggerAlarmNow(context, stationName, trainNumber, triggerMinutes);
                            return;
                        }
                        // Within 3 minutes of scheduled alarm: let AlarmClock ring in remaining seconds
                        nextDelay = remainingToTarget;
                    } else if (remainingToTarget <= (8 * 60 * 1000L)) {
                        // 3 to 8 minutes away: schedule exact 3-minute pre-flight check!
                        nextDelay = remainingToTarget - (3 * 60 * 1000L);
                    } else if (remainingToTarget <= (35 * 60 * 1000L)) {
                        // 8 to 35 minutes away: check every 5 minutes
                        nextDelay = 5 * 60 * 1000L;
                    } else {
                        // Far away (> 35 mins): check every 15 minutes
                        nextDelay = 15 * 60 * 1000L;
                    }

                    Log.d(TAG, "Next adaptive sync scheduled in " + (nextDelay / 60000) + "m (" + (nextDelay / 1000) + "s)");
                    AdaptiveAlarmManager.getInstance().scheduleNextSync(context, nextDelay);
                } else {
                    Log.d(TAG, "Target station not in live list or timing absent. Retrying in 15 mins.");
                    AdaptiveAlarmManager.getInstance().scheduleNextSync(context, 15 * 60 * 1000L);
                }

            } catch (Exception e) {
                Log.w(TAG, "Adaptive sync network check failed: " + e.getMessage() + ". Will retry in 15 mins.");
                AdaptiveAlarmManager.getInstance().scheduleNextSync(context, 15 * 60 * 1000L);
            } finally {
                pendingResult.finish();
            }
        });
    }

    private void triggerAlarmNow(Context context, String stationName, String trainNumber, int triggerMinutes) {
        Intent serviceIntent = new Intent(context, AlarmForegroundService.class);
        serviceIntent.putExtra("title", "🔔 " + stationName + " Approaching (" + triggerMinutes + "m Warning)");
        serviceIntent.putExtra("body", "Train " + trainNumber + " is nearing " + stationName + "! Tap to open or silence.");

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception ex) {
            Log.e(TAG, "Failed launching AlarmForegroundService from AdaptiveSyncReceiver: " + ex.getMessage());
            AlarmSoundPlayer.getInstance().startAlarm(context);
        }
    }
}

