package com.railwaytracking.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * AdaptiveTrackingService:
 * Continuous Foreground Service that actively polls Indian Railways live telemetry
 * while an alarm is armed. Because it runs as a DATA_SYNC Foreground Service with
 * a wake lock, Android OS NEVER throttles or suppresses its network requests in Doze mode!
 * 
 * If a train speeds up, runs early, or arrives ahead of schedule, this service triggers
 * the loud wake-up alarm immediately so the passenger never misses their station.
 */
public class AdaptiveTrackingService extends Service {

    private static final String TAG = "AdaptiveTrackingService";
    public static final String CHANNEL_ID = "railtrack_adaptive_guardian";
    public static final String CHANNEL_NAME = "RailTrack Live Journey Guardian";
    public static final int NOTIFICATION_ID = 8803;
    public static final String ACTION_STOP = "com.railwaytracking.app.ACTION_STOP_TRACKING";

    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private boolean isTracking = false;

    // Active polling interval: every 5 minutes while armed
    private static final long POLL_INTERVAL_MS = 5 * 60 * 1000L;
    private volatile long currentPollIntervalMs = POLL_INTERVAL_MS;

    private final Runnable pollTask = new Runnable() {
        @Override
        public void run() {
            if (!isTracking) return;
            performLiveTelemetryCheck();
            if (isTracking) {
                handler.postDelayed(this, currentPollIntervalMs);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "railtrack:adaptive_tracking_wakelock"
            );
            wakeLock.acquire(12 * 60 * 60 * 1000L); // Max 12 hours safety timeout
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopTracking();
            return START_NOT_STICKY;
        }

        SharedPreferences prefs = getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
        JSONObject alarmsMap = AdaptiveAlarmManager.getAlarmsMap(prefs);

        if (alarmsMap.length() == 0) {
            Log.d(TAG, "No active alarms found. Stopping AdaptiveTrackingService.");
            stopTracking();
            return START_NOT_STICKY;
        }

        String trainNumber = prefs.getString("trainNumber", "");
        String stationName = prefs.getString("stationName", "Destination");
        int triggerMinutes = prefs.getInt("triggerMinutes", 30);

        Notification notification = buildGuardianNotification(trainNumber, stationName, triggerMinutes, alarmsMap.length());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int serviceType = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC;
            }
            try {
                startForeground(NOTIFICATION_ID, notification, serviceType);
            } catch (Exception ex) {
                Log.w(TAG, "startForeground with type failed, falling back: " + ex.getMessage());
                startForeground(NOTIFICATION_ID, notification);
            }
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        if (!isTracking) {
            isTracking = true;
            // Run first check after 10 seconds, then every 5 minutes
            handler.postDelayed(pollTask, 10000L);
            Log.d(TAG, "AdaptiveTrackingService started in foreground. Continuous telemetry polling enabled.");
        }

        return START_STICKY;
    }

    private void performLiveTelemetryCheck() {
        executor.execute(() -> {
            try {
                SharedPreferences prefs = getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE);
                JSONObject alarmsMap = AdaptiveAlarmManager.getAlarmsMap(prefs);

                if (alarmsMap.length() == 0) {
                    handler.post(this::stopTracking);
                    return;
                }

                Iterator<String> keys = alarmsMap.keys();
                while (keys.hasNext()) {
                    String alarmId = keys.next();
                    JSONObject alarm = alarmsMap.optJSONObject(alarmId);
                    if (alarm == null) continue;

                    String trainNumber = alarm.optString("trainNumber", "");
                    String trainName = alarm.optString("trainName", "Train " + trainNumber);
                    String stationCode = alarm.optString("stationCode", "");
                    String stationName = alarm.optString("stationName", stationCode);
                    int triggerMinutes = alarm.optInt("triggerMinutes", 30);
                    String journeyDate = alarm.optString("journeyDate", "");
                    String backendUrl = alarm.optString("backendUrl", "https://railway-tracking-backend-gwa2.onrender.com");
                    long currentTargetMillis = alarm.optLong("targetTriggerMillis", 0L);
                    String platform = alarm.optString("platform", "");

                    if (trainNumber.isEmpty() || stationCode.isEmpty()) continue;

                    StringBuilder urlBuilder = new StringBuilder(backendUrl)
                            .append("/api/v1/trains/")
                            .append(trainNumber)
                            .append("/live");

                    if (!journeyDate.isEmpty()) {
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
                        Log.w(TAG, "Live check HTTP " + responseCode + " for train " + trainNumber);
                        continue;
                    }

                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject root = new JSONObject(sb.toString());
                    if (!root.optBoolean("success", false) || !root.has("data")) continue;

                    JSONObject data = root.getJSONObject("data");
                    int currentDelay = data.optInt("delayMinutes", 0);
                    JSONArray stations = data.optJSONArray("stations");

                    boolean stationFound = false;
                    String liveArrival = null;
                    boolean isAtStation = false;
                    String livePlatform = platform;
                    double targetDistanceKm = alarm.optDouble("distanceKm", -1.0);
                    String scheduledTime = alarm.optString("scheduledTime", "");
                    double currentDist = -1.0;
                    String currentStationCodeFromData = data.optString("currentStationCode", "");

                    if (stations != null) {
                        for (int i = 0; i < stations.length(); i++) {
                            JSONObject st = stations.getJSONObject(i);
                            String code = st.optString("stationCode", "");
                            String status = st.optString("status", "").toUpperCase();

                            boolean passed = status.equals("PASSED") || status.equals("DEPARTED") || status.equals("AT_STATION") || status.equals("ARRIVED") || code.equalsIgnoreCase(currentStationCodeFromData);
                            if (passed) {
                                if (st.has("distance") && !st.isNull("distance")) {
                                    double d = st.optDouble("distance", -1.0);
                                    if (d > currentDist) currentDist = d;
                                }
                            }

                            if (code.equalsIgnoreCase(stationCode)) {
                                stationFound = true;
                                String rawExp = st.optString("expectedArrival", "");
                                if (rawExp != null && !rawExp.isEmpty() && !rawExp.equalsIgnoreCase("null")) {
                                    liveArrival = rawExp;
                                } else {
                                    liveArrival = "";
                                }
                                String rawSched = st.optString("arrivalTime", st.optString("departureTime", ""));
                                if (rawSched != null && !rawSched.isEmpty() && !rawSched.equalsIgnoreCase("null")) {
                                    if (scheduledTime.isEmpty() || scheduledTime.equalsIgnoreCase("null")) {
                                        scheduledTime = rawSched;
                                    }
                                }
                                if (status.equals("AT_STATION") || status.equals("ARRIVED")) {
                                    isAtStation = true;
                                }
                                if (st.has("platform") && !st.optString("platform").isEmpty()) {
                                    livePlatform = st.optString("platform");
                                }
                                if (st.has("distance") && !st.isNull("distance")) {
                                    targetDistanceKm = st.optDouble("distance", targetDistanceKm);
                                }
                                break;
                            }
                        }
                    }

                    if (data.has("currentDistanceKm") && !data.isNull("currentDistanceKm")) {
                        double liveDist = data.optDouble("currentDistanceKm", -1.0);
                        if (liveDist > currentDist) currentDist = liveDist;
                    }

                    if (currentDist > 0) {
                        getSharedPreferences(AdaptiveAlarmManager.PREFS_NAME, Context.MODE_PRIVATE)
                                .edit()
                                .putFloat("lastKnownDistanceKm", (float) currentDist)
                                .apply();
                    }

                    // Origin Departure Guard & Smart Sleep Back-Off: Check if train has departed origin station
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

                    // Smart Sleep Back-Off for unstarted overnight trains
                    if (!isOriginStation && !hasDepartedOrigin && millisUntilOriginDeparture > (60 * 60 * 1000L)) {
                        long sleepDelay = Math.min(60 * 60 * 1000L, Math.max(15 * 60 * 1000L, millisUntilOriginDeparture - (30 * 60 * 1000L)));
                        currentPollIntervalMs = sleepDelay;
                        Log.d(TAG, "Train " + trainNumber + " unstarted from origin. Service polling relaxed to " + (sleepDelay / 60000) + "m.");
                    } else {
                        currentPollIntervalMs = POLL_INTERVAL_MS;
                    }

                    // High precision polling when nearing within 3.0 km radius of target milestone
                    if (targetDistanceKm > 0 && currentDist > 0 && (targetDistanceKm - currentDist) <= 3.0 && (targetDistanceKm - currentDist) > 0) {
                        currentPollIntervalMs = 3 * 60 * 1000L;
                    }

                    // 1. Train physically arrived or reached within 1.0 km of target milestone distance!
                    boolean isMilestoneDistanceReached = (targetDistanceKm > 0 && currentDist > 0 && currentDist >= (targetDistanceKm - 1.0));

                    if (isAtStation || isMilestoneDistanceReached) {
                        if (!isOriginStation && !hasDepartedOrigin) {
                            Log.d(TAG, "Train " + trainNumber + " has not yet departed origin station! Delaying downline alarm.");
                            continue;
                        }
                        Log.d(TAG, "Train " + trainNumber + " reached landmark milestone " + stationCode + " (currentDist=" + currentDist + "km, target=" + targetDistanceKm + "km)! Firing alarm immediately.");
                        triggerAlarmNow(stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                        return;
                    }

                    long newTargetMillis = 0L;
                    long expectedArrivalMillis = 0L;
                    if (stationFound && liveArrival != null && !liveArrival.trim().isEmpty() && !liveArrival.equalsIgnoreCase("null")) {
                        expectedArrivalMillis = AdaptiveAlarmManager.calculateTriggerMillis(liveArrival, 0);
                        newTargetMillis = expectedArrivalMillis - (triggerMinutes * 60 * 1000L);
                    } else if (!scheduledTime.isEmpty() && !scheduledTime.equalsIgnoreCase("null")) {
                        long schedBase = AdaptiveAlarmManager.calculateTriggerMillis(scheduledTime, 0);
                        if (schedBase > 0) {
                            expectedArrivalMillis = schedBase + (currentDelay * 60 * 1000L);
                            newTargetMillis = expectedArrivalMillis - (triggerMinutes * 60 * 1000L);
                        }
                    }

                    if (newTargetMillis > 0) {
                        long shiftDelta = Math.abs(newTargetMillis - currentTargetMillis);
                        long remainingToNewTarget = newTargetMillis - System.currentTimeMillis();

                        // 2. Train running early: Target time reached or passed! Fire alarm now!
                        if (remainingToNewTarget <= 0) {
                            if (!isOriginStation && !hasDepartedOrigin) {
                                Log.d(TAG, "Train " + trainNumber + " has not yet departed origin station! Delaying downline alarm.");
                                continue;
                            }
                            Log.d(TAG, "Train running early or target reached! Firing alarm now!");
                            triggerAlarmNow(stationName, trainNumber, stationCode, livePlatform, triggerMinutes);
                            return;
                        }

                        // 3. Significant shift detected (>= 3 minutes): Reschedule system AlarmClock!
                        if (shiftDelta >= (3 * 60 * 1000L)) {
                            Log.d(TAG, "Schedule shift detected for [" + alarmId + "] (" + (shiftDelta / 60000) + "m). Updating AlarmClock from "
                                    + currentTargetMillis + " to " + newTargetMillis);

                            alarm.put("targetTriggerMillis", newTargetMillis);
                            if (liveArrival != null && !liveArrival.isEmpty() && !liveArrival.equalsIgnoreCase("null")) {
                                alarm.put("expectedArrival", liveArrival);
                            }
                            alarm.put("platform", livePlatform);
                            alarm.put("lastSyncMillis", System.currentTimeMillis());
                            alarmsMap.put(alarmId, alarm);
                            prefs.edit().putString(AdaptiveAlarmManager.PREF_ALARMS_MAP, alarmsMap.toString()).apply();

                            AdaptiveAlarmManager.getInstance().scheduleAlarmClock(
                                    this,
                                    newTargetMillis,
                                    trainNumber,
                                    trainName,
                                    stationCode,
                                    stationName,
                                    livePlatform,
                                    triggerMinutes
                            );

                            AdaptiveAlarmManager.getInstance().postScheduleShiftNotification(
                                    this,
                                    trainNumber,
                                    stationName,
                                    newTargetMillis,
                                    currentDelay
                            );

                            updateNotification(trainNumber, stationName, triggerMinutes, newTargetMillis);
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Background telemetry check exception: " + e.getMessage());
            }
        });
    }

    private void triggerAlarmNow(String stationName, String trainNumber, String stationCode, String platform, int triggerMinutes) {
        String cleanPlatform = (platform != null && !platform.equalsIgnoreCase("null") && !platform.equalsIgnoreCase("undefined")) ? platform : "";

        Intent serviceIntent = new Intent(this, AlarmForegroundService.class);
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
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception ex) {
            Log.e(TAG, "Failed launching AlarmForegroundService: " + ex.getMessage());
            AlarmSoundPlayer.getInstance().startAlarm(this);
        }

        stopTracking();
    }

    private Notification buildGuardianNotification(String trainNumber, String stationName, int triggerMinutes, int totalAlarms) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background monitor ensuring you wake up even if your train is early or delayed");
            channel.enableVibration(false);
            nm.createNotificationChannel(channel);
        }

        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 1003, mainIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, StopAlarmReceiver.class);
        stopIntent.setAction(StopAlarmReceiver.ACTION_STOP_ALARM);
        PendingIntent stopPi = PendingIntent.getBroadcast(this, 1004, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String title = "🚆 Train " + trainNumber + " Night Guardian Active";
        String body = "Monitoring live schedule to " + stationName + " (" + triggerMinutes + "m warning). Guaranteed wake-up.";
        if (totalAlarms > 1) {
            body = totalAlarms + " station alarms active. Continuous live tracking enabled.";
        }

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .setContentIntent(pi)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Disarm", stopPi)
                .build();
    }

    private void updateNotification(String trainNumber, String stationName, int triggerMinutes, long targetMillis) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
        String formatted = sdf.format(new Date(targetMillis));

        String title = "🚆 Train " + trainNumber + " Night Guardian Active";
        String body = "Live delay adjusted: Alarm rings at " + formatted + " for " + stationName + ".";

        Intent mainIntent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 1003, mainIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .setContentIntent(pi)
                .build();

        nm.notify(NOTIFICATION_ID, notification);
    }

    public void stopTracking() {
        isTracking = false;
        handler.removeCallbacks(pollTask);
        stopForeground(true);

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(NOTIFICATION_ID);
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }

        stopSelf();
        Log.d(TAG, "AdaptiveTrackingService stopped cleanly.");
    }

    @Override
    public void onDestroy() {
        stopTracking();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
