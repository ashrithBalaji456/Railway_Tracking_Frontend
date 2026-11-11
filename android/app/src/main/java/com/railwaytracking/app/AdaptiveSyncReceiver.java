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
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
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
        final String scheduledTime = targetAlarm.optString("scheduledTime", "");
        final double storedDistanceKm = targetAlarm.optDouble("distanceKm", -1.0);
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
            String effectiveScheduledTime = scheduledTime;
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
                double targetDist = storedDistanceKm > 0 ? storedDistanceKm : -1.0;
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
                        if (passed) {
                            if (seq > currentSeq) currentSeq = seq;
                            if (st.has("distance") && !st.isNull("distance")) {
                                double d = st.optDouble("distance", -1.0);
                                if (d > currentDist) currentDist = d;
                            }
                        }

                        if (code.equalsIgnoreCase(stationCode)) {
                            stationFound = true;
                            targetSeq = seq;
                            String rawExp = st.optString("expectedArrival", "");
                            if (rawExp != null && !rawExp.isEmpty() && !rawExp.equalsIgnoreCase("null")) {
                                liveArrival = rawExp;
                            } else {
                                liveArrival = "";
                            }
                            String rawSched = st.optString("scheduledArrival", st.optString("scheduledDeparture", st.optString("arrivalTime", st.optString("departureTime", ""))));
                            if (rawSched != null && !rawSched.isEmpty() && !rawSched.equalsIgnoreCase("null")) {
                                if (effectiveScheduledTime.isEmpty() || effectiveScheduledTime.equalsIgnoreCase("null")) {
                                    effectiveScheduledTime = rawSched;
                                }
                            }
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
                                targetDist = st.optDouble("distance", targetDist);
                            }
                            targetLat = st.optDouble("latitude", st.optDouble("lat", 0.0));
                            targetLng = st.optDouble("longitude", st.optDouble("lng", 0.0));
                        }
                    }
                }

                if (data.has("currentDistanceKm") && !data.isNull("currentDistanceKm")) {
                    double liveDist = data.optDouble("currentDistanceKm", -1.0);
                    if (liveDist > currentDist) currentDist = liveDist;
                }

                // Fallback to persisted route station distances map if currentDist or targetDist is missing
                String stnDistJson = prefs.getString("station_distances_" + trainNumber, "{}");
                try {
                    JSONObject distMap = new JSONObject(stnDistJson);
                    if (currentDist <= 0 && !currentStationCodeFromData.isEmpty() && distMap.has(currentStationCodeFromData.toUpperCase())) {
                        currentDist = distMap.optDouble(currentStationCodeFromData.toUpperCase(), -1.0);
                    }
                    if (targetDist <= 0 && distMap.has(stationCode.toUpperCase())) {
                        targetDist = distMap.optDouble(stationCode.toUpperCase(), -1.0);
                    }
                } catch (Exception ignored) {}

                // If train's current reported station matches target station, mark arrived
                if (stationCode.equalsIgnoreCase(currentStationCodeFromData)) {
                    isAtStation = true;
                }

                if (currentDist > 0) {
                    context.getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE)
                            .edit()
                            .putFloat("lastKnownDistanceKm", (float) currentDist)
                            .apply();
                }

                // If train has physically arrived, departed, or reached/passed station sequence or within 1.0 km of landmark milestone, wake user immediately!
                boolean isSequenceReached = (currentSeq > 0 && targetSeq > 0 && currentSeq >= targetSeq);
                boolean isMilestonePassed = (targetDist > 0 && currentDist > 0 && currentDist >= (targetDist - 1.0));
                if (isAtStation || isMilestonePassed || isSequenceReached) {
                    Log.d(TAG, "Train " + trainNumber + " physically arrived/passed " + stationCode
                            + " (isAtStation=" + isAtStation + ", isSequenceReached=" + isSequenceReached + ", currentDist=" + currentDist + "km, target=" + targetDist + "km)! Firing alarm immediately.");
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

                // Origin Departure Guard & Smart Sleep Back-Off: Check if train has actually departed from the origin station
                boolean isOriginStation = false;
                boolean hasDepartedOrigin = true;
                long millisUntilOriginDeparture = 0L;
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
                        String originDepartureStr = firstStation.optString("scheduledDeparture",
                                firstStation.optString("departureTime",
                                firstStation.optString("expectedDeparture",
                                data.optString("originDepartureTime", ""))));
                        if (!originDepartureStr.isEmpty()) {
                            long originDepMillis = AdaptiveAlarmManager.calculateTriggerMillis(originDepartureStr, 0);
                            millisUntilOriginDeparture = originDepMillis - System.currentTimeMillis();
                        }
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
                long newTargetMillis = 0L;
                long expectedArrivalMillis = 0L;

                if (!fixedSnoozeActive && stationFound && liveArrival != null && !liveArrival.trim().isEmpty() && !liveArrival.equalsIgnoreCase("null")) {
                    expectedArrivalMillis = AdaptiveAlarmManager.calculateTriggerMillis(liveArrival, 0);
                    newTargetMillis = expectedArrivalMillis - (triggerMinutes * 60 * 1000L);
                } else if (!fixedSnoozeActive && !effectiveScheduledTime.isEmpty() && !effectiveScheduledTime.equalsIgnoreCase("null")) {
                    long schedBase = AdaptiveAlarmManager.parseClockTimeToMillis(effectiveScheduledTime);
                    if (schedBase > 0) {
                        expectedArrivalMillis = schedBase + (currentDelay * 60 * 1000L);
                        newTargetMillis = expectedArrivalMillis - (triggerMinutes * 60 * 1000L);
                    }
                }

                if (newTargetMillis > 0) {
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
                            if (liveArrival != null && !liveArrival.isEmpty() && !liveArrival.equalsIgnoreCase("null")) {
                                objToUpdate.put("expectedArrival", liveArrival);
                            }
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
                                currentDelay,
                                remainingKm,
                                triggerMinutes
                        );
                    } else {
                        Log.d(TAG, "Train " + trainNumber + " timing steady. Shift delta: " + (shiftDifference / 1000) + "s.");
                    }
                }

                // Calculate next sync interval with pre-flight check
                long remainingToTarget = effectiveTargetMillis - System.currentTimeMillis();
                long nextDelay;
                if (remainingToTarget <= 0) {
                    if (!isOriginStation && !hasDepartedOrigin) {
                        Log.d(TAG, "Train " + trainNumber + " has not yet departed origin station! Delaying downline alarm.");
                        AdaptiveAlarmManager.getInstance().scheduleNextSync(context, trainNumber, stationCode, 3 * 60 * 1000L);
                        return;
                    }

                    // Landmark Alarms purely consider distance:
                    // If alarm shifted to a time in the past or clock time passed, trigger ONLY IF physical distance condition is met!
                    if (triggerMinutes == 0) {
                        if (isDistanceTriggered || isAtStation || isMilestonePassed || isSequenceReached || (remainingKm >= 0.0 && remainingKm <= 1.0)) {
                            Log.d(TAG, "Shifted time passed and train physically arrived/within 1.0km of " + stationCode + "! Firing landmark alarm now.");
                            triggerAlarmNow(context, stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                            return;
                        }
                        Log.d(TAG, "Clock time passed for Landmark Alarm [" + finalAlarmId
                                + "], but landmark alarms purely consider distance. Train is " + String.format(Locale.getDefault(), "%.1f", remainingKm) + " km away. Polling rapidly (30s) until 1km radius or arrival!");
                        nextDelay = 30 * 1000L;
                    } else {
                        // Dynamic / advance warning alarm (e.g. 15m, 30m, 45m warning)
                        Log.d(TAG, "Pre-flight check: target reached or train running early for [" + finalAlarmId + "]! Triggering alarm now.");
                        triggerAlarmNow(context, stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                        return;
                    }
                } else if (remainingToTarget <= (3 * 60 * 1000L)) {
                    // Final approach (within 3 mins): poll every 45 seconds so train arrival is caught instantly
                    nextDelay = 45 * 1000L;
                } else if (remainingToTarget <= (8 * 60 * 1000L)) {
                    // Near station (within 8 mins): poll every 60 seconds (1 min)
                    nextDelay = 60 * 1000L;
                } else if (remainingToTarget <= (15 * 60 * 1000L)) {
                    // Approaching target (within 15 mins): poll every 2 minutes
                    nextDelay = 2 * 60 * 1000L;
                } else if (remainingToTarget <= (30 * 60 * 1000L)) {
                    // Within 30 mins: poll every 3 minutes
                    nextDelay = 3 * 60 * 1000L;
                } else if (remainingToTarget <= (60 * 60 * 1000L)) {
                    // Within 1 hour: poll every 5 minutes
                    nextDelay = 5 * 60 * 1000L;
                } else {
                    // Far destination (> 1 hour): check every 10 minutes
                    nextDelay = 10 * 60 * 1000L;
                }

                // SMART ORIGIN SLEEP BACK-OFF:
                // If user armed alarm overnight and train has NOT started from origin station,
                // and scheduled origin departure is more than 1 hour away:
                // Put background sync into deep sleep until 30 minutes before origin departure (capped at 90 mins max).
                if (!isOriginStation && !hasDepartedOrigin && millisUntilOriginDeparture > (60 * 60 * 1000L)) {
                    long sleepUntilOriginWindow = millisUntilOriginDeparture - (30 * 60 * 1000L);
                    nextDelay = Math.min(90 * 60 * 1000L, Math.max(30 * 60 * 1000L, sleepUntilOriginWindow));
                    Log.d(TAG, "Train " + trainNumber + " unstarted. Origin departure in "
                            + (millisUntilOriginDeparture / 3600000) + "h " + ((millisUntilOriginDeparture % 3600000) / 60000)
                            + "m. Sleeping sync for " + (nextDelay / 60000) + "m until 30m before origin start.");
                }

                // High-precision approach cadence:
                // Rapid checks based on actual physical distance so high-speed trains (80-100 km/h) never bypass milestones
                if (hasDepartedOrigin && remainingKm > 0) {
                    if (remainingKm <= 2.0) {
                        nextDelay = Math.min(nextDelay, 30 * 1000L); // 30 seconds within 2 km
                    } else if (remainingKm <= 5.0) {
                        nextDelay = Math.min(nextDelay, 60 * 1000L); // 1 minute within 5 km
                    } else if (remainingKm <= 12.0) {
                        nextDelay = Math.min(nextDelay, 2 * 60 * 1000L); // 2 minutes within 12 km
                    } else if (remainingKm <= 25.0) {
                        nextDelay = Math.min(nextDelay, 3 * 60 * 1000L); // 3 minutes within 25 km
                    } else if (remainingKm <= 40.0) {
                        nextDelay = Math.min(nextDelay, 5 * 60 * 1000L); // 5 minutes within 40 km
                    }
                }

                long nextSyncMillis = System.currentTimeMillis() + nextDelay;

                String arrivalDisplay = "";
                if (expectedArrivalMillis > 0) {
                    SimpleDateFormat arrivalFmt = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                    arrivalDisplay = arrivalFmt.format(new Date(expectedArrivalMillis));
                } else if (liveArrival != null && !liveArrival.isEmpty() && !liveArrival.equalsIgnoreCase("null")) {
                    arrivalDisplay = liveArrival;
                } else if (!effectiveScheduledTime.isEmpty() && !effectiveScheduledTime.equalsIgnoreCase("null")) {
                    arrivalDisplay = effectiveScheduledTime;
                } else if (defaultExpectedArrival != null && !defaultExpectedArrival.isEmpty() && !defaultExpectedArrival.equalsIgnoreCase("null")) {
                    arrivalDisplay = defaultExpectedArrival;
                }

                // Post visible status notification so user sees proof of live check + delay in hrs/mins + exact distance
                AdaptiveAlarmManager.getInstance().postTelemetryStatusNotification(
                        context,
                        trainNumber,
                        stationName,
                        stationCode,
                        currentDelay,
                        arrivalDisplay,
                        effectiveTargetMillis,
                        nextSyncMillis,
                        remainingKm,
                        triggerMinutes
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

        // Dismiss the stale telemetry progress notification so user never sees old distance (e.g. 5.9km away) when alarm rings!
        try {
            android.app.NotificationManager nm = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(AdaptiveAlarmManager.getNotificationId(trainNumber, stationCode));
            }
        } catch (Exception ignored) {}

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
     * 0m (Landmark) -> 1.0km, 15m -> 12km, 30m -> 25km, 45m -> 38km, 60m -> 50km, 90m -> 75km, 120m -> 100km.
     */
    private static double getSafeDistanceThresholdKm(int triggerMinutes) {
        if (triggerMinutes == 0) return 1.0; // Strictly 1.0 km radius for At-Station Landmark Alarms!
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
