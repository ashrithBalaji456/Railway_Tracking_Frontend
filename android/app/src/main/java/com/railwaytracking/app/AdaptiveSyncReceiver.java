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
        final boolean isFixedSnooze = targetAlarm.optBoolean("isFixedSnooze", false);
        final long fixedSnoozeTargetMillis = targetAlarm.optLong("fixedSnoozeTargetMillis", 0L);
        long now = System.currentTimeMillis();

        // Query backend live API with Android goAsync() to query latest train progress, source departure, and schedule shifts
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

                // Sequence & distance tracking for Hybrid Distance Rule
                int currentSeq = -1;
                int targetSeq = -1;
                double currentDist = -1.0;
                double targetDist = -1.0;
                double targetLat = 0.0;
                double targetLng = 0.0;
                String currentStationCodeFromData = data.optString("currentStationCode", "");

                if (stations != null) {
                    for (int i = 0; i < stations.length(); i++) {
                        JSONObject st = stations.getJSONObject(i);
                        String code = st.optString("stationCode", "");
                        int seq = st.optInt("sequenceNumber", i + 1);
                        String status = st.optString("status", "").toUpperCase();

                        boolean passed = status.equals("PASSED") || status.equals("DEPARTED") || status.equals("AT_STATION") || status.equals("ARRIVED") || code.equalsIgnoreCase(currentStationCodeFromData);
                        if (passed && seq > currentSeq) {
                            currentSeq = seq;
                            if (st.has("distance") && !st.isNull("distance")) {
                                currentDist = st.optDouble("distance", -1.0);
                            }
                        }

                        if (code.equalsIgnoreCase(stationCode)) {
                            stationFound = true;
                            targetSeq = seq;
                            liveArrival = st.optString("expectedArrival", st.optString("arrivalTime", ""));
                            if (status.equals("AT_STATION") || status.equals("ARRIVED")) {
                                isAtStation = true;
                            }
                            if (st.has("platform")) {
                                String rawPlat = st.optString("platform");
                                if (rawPlat != null && !rawPlat.isEmpty() && !rawPlat.equalsIgnoreCase("null") && !rawPlat.equalsIgnoreCase("undefined")) {
                                    livePlatform = rawPlat;
                                }
                            }
                            if (st.has("distance") && !st.isNull("distance")) {
                                targetDist = st.optDouble("distance", -1.0);
                            }
                            targetLat = st.optDouble("latitude", st.optDouble("lat", 0.0));
                            targetLng = st.optDouble("longitude", st.optDouble("lng", 0.0));
                        }
                    }
                }

                // If train has physically arrived or reached station, wake user immediately!
                if (isAtStation) {
                    Log.d(TAG, "Train " + trainNumber + " physically arrived at " + stationCode + "! Firing alarm immediately.");
                    triggerAlarmNow(context, stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                    return;
                }

                // Calculate remaining distance to destination station
                double remainingKm = -1.0;
                if (targetDist > 0 && currentDist > 0 && targetDist >= currentDist) {
                    remainingKm = targetDist - currentDist;
                } else if (targetLat != 0.0 && targetLng != 0.0) {
                    double trainLat = data.optDouble("latitude", 0.0);
                    double trainLng = data.optDouble("longitude", 0.0);
                    if (trainLat != 0.0 && trainLng != 0.0) {
                        remainingKm = haversineKm(trainLat, trainLng, targetLat, targetLng);
                    }
                }

                double safeDistanceThreshold = getSafeDistanceThresholdKm(triggerMinutes);
                boolean isDistanceTriggered = (remainingKm > 0 && remainingKm <= safeDistanceThreshold && (currentSeq < 0 || targetSeq >= currentSeq));

                // Origin Departure Guard: Check if train has actually departed from the origin station
                boolean isOriginStation = false;
                boolean hasDepartedOrigin = true;
                if (stations != null && stations.length() > 0) {
                    JSONObject firstStation = stations.getJSONObject(0);
                    String firstCode = firstStation.optString("stationCode", "");
                    if (firstCode.equalsIgnoreCase(stationCode)) {
                        isOriginStation = true;
                    }
                    String firstStatus = firstStation.optString("status", "").toLowerCase();
                    String firstActualDep = firstStation.optString("actualDeparture", "");
                    String runStatus = data.optString("runStatus", data.optString("status", "")).toLowerCase();

                    boolean originDeparted = firstStatus.equals("departed") || firstStatus.equals("passed") || (!firstActualDep.isEmpty() && !firstActualDep.equalsIgnoreCase("null"));
                    boolean unstarted = runStatus.equals("not-started") || runStatus.equals("scheduled") || runStatus.equals("yet_to_start");
                    if (unstarted && !originDeparted) {
                        hasDepartedOrigin = false;
                    }
                }

                // Hybrid Distance Rule Trigger (Whichever Comes First: Time <= triggerMinutes OR Distance <= safeDistanceThreshold)
                if (isDistanceTriggered) {
                    if (!isOriginStation && !hasDepartedOrigin) {
                        Log.d(TAG, "Train " + trainNumber + " has not yet departed origin station! Delaying downline alarm.");
                        AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 3 * 60 * 1000L);
                        return;
                    }
                    Log.d(TAG, "Hybrid Distance Rule: Train " + trainNumber + " is " + String.format("%.1f", remainingKm)
                            + " km away from " + stationCode + " (<= threshold " + safeDistanceThreshold + " km). Firing alarm now!");
                    triggerAlarmNow(context, stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                    return;
                }

                boolean fixedSnoozeActive = isFixedSnooze && fixedSnoozeTargetMillis > System.currentTimeMillis();

                long effectiveTargetMillis = currentTargetMillis;
                if (!fixedSnoozeActive && stationFound && liveArrival != null && !liveArrival.trim().isEmpty()) {
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
                        if (!isOriginStation && !hasDepartedOrigin) {
                            Log.d(TAG, "Train " + trainNumber + " has not yet departed origin station! Delaying downline alarm.");
                            AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 3 * 60 * 1000L);
                            return;
                        }
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

                // If train is nearing safe distance boundary (threshold + 10 km), tighten sync to 1 min
                if (remainingKm > 0 && remainingKm <= (safeDistanceThreshold + 10.0)) {
                    nextDelay = Math.min(nextDelay, 60 * 1000L);
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

        SharedPreferences prefs = context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject alarmsMap = AdaptiveAlarmManager.getAlarmsMap(prefs);
        JSONObject target = alarmsMap.optJSONObject(AdaptiveAlarmManager.buildAlarmId(trainNumber, stationCode));
        if (target != null) {
            serviceIntent.putExtra("trainName", target.optString("trainName", "Train " + trainNumber));
            serviceIntent.putExtra("backupEmail", target.optString("backupEmail", ""));
        }

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

    /**
     * Calibrated safe distance thresholds corresponding to the selected alarm advance minutes:
     * 15m -> 12km, 30m -> 25km, 45m -> 38km, 60m -> 50km, 90m -> 75km, 120m -> 100km.
     */
    private static double getSafeDistanceThresholdKm(int triggerMinutes) {
        if (triggerMinutes <= 15) return 12.0;
        if (triggerMinutes <= 30) return 25.0;
        if (triggerMinutes <= 45) return 38.0;
        if (triggerMinutes <= 60) return 50.0;
        if (triggerMinutes <= 90) return 75.0;
        if (triggerMinutes <= 120) return 100.0;
        return Math.round(triggerMinutes * 0.83); // ~50 km/h baseline
    }

    /**
     * Great-circle geodesic distance between two GPS coordinates in kilometers.
     */
    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
