package com.railwaytracking.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;
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
 * Executes periodically in background via high-priority AlarmManager.setAlarmClock.
 * Wakes the hardware modem/CPU (and temporarily screen) to query Indian Railways live delay,
 * automatically pushes forward or prepones the wake-up alarm, and posts a visible status notification.
 */
public class AdaptiveSyncReceiver extends BroadcastReceiver {

    private static final String TAG = "AdaptiveSyncReceiver";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "AdaptiveSyncReceiver triggered via AlarmClock! Waking hardware to check live telemetry...");

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        PowerManager.WakeLock screenLock = null;

        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "railtrack:sync_receiver_wakelock"
            );
            wakeLock.acquire(45000L); // 45 seconds safety timeout

            // Briefly activate screen for 3 seconds to ensure radio power-up across aggressive OEM Doze profiles
            try {
                screenLock = pm.newWakeLock(
                    PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "railtrack:sync_screen_wake"
                );
                screenLock.acquire(3000L);
            } catch (Exception ignored) {}
        }

        SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject alarmsMap = AdaptiveAlarmManager.getAlarmsMap(prefs);

        String intentTrain = intent != null ? intent.getStringExtra("trainNumber") : null;
        String intentStation = intent != null ? intent.getStringExtra("stationCode") : null;

        JSONObject targetAlarm = null;
        String alarmId = null;

        if (intentTrain != null && intentStation != null) {
            alarmId = AdaptiveAlarmManager.buildAlarmId(intentTrain, intentStation);
            targetAlarm = alarmsMap.optJSONObject(alarmId);
        }

        if (targetAlarm == null) {
            // Check legacy fallback
            if (!prefs.getBoolean("isArmed", false)) {
                Log.d(TAG, "No adaptive alarms currently active. Aborting background sync.");
                releaseLocks(wakeLock, screenLock);
                return;
            }
            String legacyTrain = prefs.getString("trainNumber", "");
            String legacyStation = prefs.getString("stationCode", "");
            alarmId = AdaptiveAlarmManager.buildAlarmId(legacyTrain, legacyStation);
            targetAlarm = alarmsMap.optJSONObject(alarmId);
        }

        if (targetAlarm == null) {
            Log.d(TAG, "Alarm configuration for ID [" + alarmId + "] not found. Aborting.");
            releaseLocks(wakeLock, screenLock);
            return;
        }

        final String finalAlarmId = alarmId;
        final String trainNumber = targetAlarm.optString("trainNumber", "");
        final String trainName = targetAlarm.optString("trainName", "Train " + trainNumber);
        final String stationCode = targetAlarm.optString("stationCode", "");
        final String stationName = targetAlarm.optString("stationName", stationCode);
        final int triggerMinutes = targetAlarm.optInt("triggerMinutes", 30);
        final String journeyDate = targetAlarm.optString("journeyDate", "");
        final String backendUrl = targetAlarm.optString("backendUrl", "https://railway-tracking-backend-gwa2.onrender.com");
        final String defaultExpectedArrival = targetAlarm.optString("expectedArrival", "");
        final String rawPlatform = targetAlarm.optString("platform", "");
        final String platform = (rawPlatform != null && !rawPlatform.equalsIgnoreCase("null") && !rawPlatform.equalsIgnoreCase("undefined")) ? rawPlatform : "";
        final long currentTargetMillis = targetAlarm.optLong("targetTriggerMillis", 0L);

        long now = System.currentTimeMillis();

        // 1. If target alarm time has already arrived, ring alarm immediately!
        if (currentTargetMillis > 0 && now >= currentTargetMillis) {
            Log.d(TAG, "Target trigger time reached for [" + finalAlarmId + "]! Firing alarm.");
            triggerAlarmNow(context, stationName, trainNumber, stationCode, platform, triggerMinutes);
            releaseLocks(wakeLock, screenLock);
            return;
        }

        // 2. Query backend live API with Android goAsync() to prevent OS killing the process
        final PendingResult pendingResult = goAsync();
        final PowerManager.WakeLock asyncWakeLock = wakeLock;
        final PowerManager.WakeLock asyncScreenLock = screenLock;

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
                    Log.w(TAG, "Live status HTTP failed with code: " + responseCode + " for train " + trainNumber + ". Retrying in 10 mins.");
                    AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 10 * 60 * 1000L);
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
                    Log.w(TAG, "Backend returned unsuccessful live payload for train " + trainNumber + ". Retrying in 10 mins.");
                    AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 10 * 60 * 1000L);
                    return;
                }

                JSONObject data = root.getJSONObject("data");
                int currentDelay = data.optInt("delayMinutes", 0);
                JSONArray stations = data.optJSONArray("stations");

                boolean stationFound = false;
                String liveArrival = null;
                boolean isAtStation = false;
                String livePlatform = platform;

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
                            if (st.has("platform")) {
                                String rawPlat = st.optString("platform");
                                if (rawPlat != null && !rawPlat.isEmpty() && !rawPlat.equalsIgnoreCase("null") && !rawPlat.equalsIgnoreCase("undefined")) {
                                    livePlatform = rawPlat;
                                }
                            }
                            break;
                        }
                    }
                }

                // If train has physically arrived or reached station, wake user immediately!
                if (isAtStation) {
                    Log.d(TAG, "Train " + trainNumber + " physically arrived at " + stationCode + "! Firing alarm immediately.");
                    triggerAlarmNow(context, stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                    return;
                }

                long effectiveTargetMillis = currentTargetMillis;
                if (stationFound && liveArrival != null && !liveArrival.trim().isEmpty()) {
                    long newTargetMillis = AdaptiveAlarmManager.calculateTriggerMillis(liveArrival, triggerMinutes);
                    long shiftDifference = Math.abs(newTargetMillis - currentTargetMillis);

                    // If schedule shift is >= 2 minutes, update AlarmClock!
                    if (shiftDifference >= (2 * 60 * 1000L)) {
                        Log.d(TAG, "Schedule shift detected for [" + finalAlarmId + "] (" + (shiftDifference / 60000) + "m). Updating AlarmClock from "
                                + currentTargetMillis + " to " + newTargetMillis);

                        effectiveTargetMillis = newTargetMillis;

                        // Update in JSON map
                        SharedPreferences freshPrefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
                        JSONObject freshMap = AdaptiveAlarmManager.getAlarmsMap(freshPrefs);
                        JSONObject objToUpdate = freshMap.optJSONObject(finalAlarmId);
                        if (objToUpdate != null) {
                            objToUpdate.put("targetTriggerMillis", newTargetMillis);
                            objToUpdate.put("expectedArrival", liveArrival);
                            objToUpdate.put("platform", livePlatform);
                            objToUpdate.put("lastSyncMillis", System.currentTimeMillis());
                            freshMap.put(finalAlarmId, objToUpdate);
                            freshPrefs.edit().putString(AdaptiveAlarmManager.PREF_ALARMS_MAP, freshMap.toString()).apply();
                        }

                        AdaptiveAlarmManager.getInstance().scheduleAlarmClock(
                                context,
                                newTargetMillis,
                                trainNumber,
                                trainName,
                                stationCode,
                                stationName,
                                livePlatform,
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
                        Log.d(TAG, "Train " + trainNumber + " timing steady. Shift delta: " + (shiftDifference / 1000) + "s.");
                    }
                }

                // Calculate next sync interval with pre-flight check
                long remainingToTarget = effectiveTargetMillis - System.currentTimeMillis();
                long nextDelay;
                if (remainingToTarget <= (3 * 60 * 1000L)) {
                    if (remainingToTarget <= 0) {
                        // Train running ahead of schedule or target reached: trigger alarm now!
                        Log.d(TAG, "Pre-flight check: target reached or train running early for [" + finalAlarmId + "]! Triggering alarm now.");
                        triggerAlarmNow(context, stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                        return;
                    }
                    nextDelay = Math.max(30 * 1000L, remainingToTarget);
                } else if (remainingToTarget <= (8 * 60 * 1000L)) {
                    // Pre-flight check: check exactly 3 minutes before the alarm
                    nextDelay = remainingToTarget - (3 * 60 * 1000L);
                } else if (remainingToTarget <= (20 * 60 * 1000L)) {
                    // Approaching target: check every 5 minutes
                    nextDelay = 5 * 60 * 1000L;
                } else if (remainingToTarget <= (45 * 60 * 1000L)) {
                    // Under 45 mins: check every 10 minutes
                    nextDelay = 10 * 60 * 1000L;
                } else {
                    // Long delay / far destination (> 45 mins): check every 15 minutes
                    nextDelay = 15 * 60 * 1000L;
                }

                long nextSyncMillis = System.currentTimeMillis() + nextDelay;

                // Post visible status notification so user sees proof of live check + delay in hrs/mins
                AdaptiveAlarmManager.getInstance().postTelemetryStatusNotification(
                        context,
                        trainNumber,
                        stationName,
                        stationCode,
                        currentDelay,
                        liveArrival != null ? liveArrival : defaultExpectedArrival,
                        effectiveTargetMillis,
                        nextSyncMillis
                );

                Log.d(TAG, "Live check completed for [" + finalAlarmId + "]. Next check scheduled in " + (nextDelay / 60000) + "m (" + (nextDelay / 1000) + "s)");
                AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, nextDelay);

            } catch (Exception e) {
                Log.w(TAG, "Adaptive sync network check failed for train " + trainNumber + ": " + e.getMessage() + ". Retrying in 10 mins.");
                AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 10 * 60 * 1000L);
            } finally {
                releaseLocks(asyncWakeLock, asyncScreenLock);
                pendingResult.finish();
            }
        });
    }

    private static void releaseLocks(PowerManager.WakeLock wakeLock, PowerManager.WakeLock screenLock) {
        if (screenLock != null && screenLock.isHeld()) {
            try {
                screenLock.release();
            } catch (Exception ignored) {}
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
    }

    private void triggerAlarmNow(Context context, String stationName, String trainNumber, String stationCode, String platform, int triggerMinutes) {
        String cleanPlatform = (platform != null && !platform.equalsIgnoreCase("null") && !platform.equalsIgnoreCase("undefined")) ? platform : "";

        Intent serviceIntent = new Intent(context, AlarmForegroundService.class);
        serviceIntent.putExtra("title", "🔔 " + stationName + " Approaching (" + triggerMinutes + "m Warning)");
        serviceIntent.putExtra("body", "Train " + trainNumber + " is nearing " + stationName + "! Tap to open or silence.");
        serviceIntent.putExtra("trainNumber", trainNumber);
        serviceIntent.putExtra("stationCode", stationCode);
        serviceIntent.putExtra("stationName", stationName);
        serviceIntent.putExtra("platform", cleanPlatform);
        serviceIntent.putExtra("triggerMinutes", triggerMinutes);
        serviceIntent.putExtra("alarmId", AdaptiveAlarmManager.buildAlarmId(trainNumber, stationCode));

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
