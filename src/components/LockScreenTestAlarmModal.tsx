import { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Smartphone, 
  X, 
  Play, 
  CheckCircle2, 
  VolumeX,
  ShieldCheck,
  Radio,
  ExternalLink,
  Bell
} from 'lucide-react';
import alarmAudioService, { type AlarmToneType } from '../utils/alarmAudioService';
import customAlarmSoundService from '../utils/customAlarmSoundService';
import webNotificationService from '../utils/webNotificationService';
import { 
  isNativeApp, 
  scheduleNativeAlarm, 
  cancelNativeAlarm, 
  stopNativeAlarm,
  syncCustomAudioToNative,
  checkNativeAlarmPermissions, 
  requestNativeOverlayPermission, 
  requestNativeNotificationPermission,
  openNativeNotificationSettings,
  triggerTestNotification,
  type NativeAlarmPermissions
} from '../utils/nativeAlarmBridge';

interface LockScreenTestAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber?: string;
  trainName?: string;
  stationName?: string;
  selectedToneType: AlarmToneType;
  selectedCustomSoundId?: string;
}

export default function LockScreenTestAlarmModal({
  isOpen,
  onClose,
  trainNumber = '12952',
  trainName = 'Mumbai Rajdhani',
  stationName = 'New Delhi (NDLS)',
  selectedToneType,
  selectedCustomSoundId
}: LockScreenTestAlarmModalProps) {
  const [testSeconds, setTestSeconds] = useState(120); // 2 minutes default
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [hasPermission, setHasPermission] = useState(() => {
    return webNotificationService.getPermission() === 'granted';
  });
  const [nativePerms, setNativePerms] = useState<NativeAlarmPermissions | null>(null);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check notification & native permissions when opened
  useEffect(() => {
    if (isOpen) {
      setHasPermission(webNotificationService.getPermission() === 'granted');
      if (isNativeApp()) {
        checkNativeAlarmPermissions().then((perms) => {
          if (perms) setNativePerms(perms);
        });
      }
    }
  }, [isOpen]);

  // Clean up worker & audio if unmounted
  useEffect(() => {
    return () => {
      cleanupBackgroundKeepAlive();
    };
  }, []);

  const cleanupBackgroundKeepAlive = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.pause();
        silentAudioRef.current.src = '';
      } catch (e) {}
      silentAudioRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    alarmAudioService.releaseWakeLock();
  };

  /**
   * Starts a background audio anchor to prevent mobile OS (Android/iOS)
   * from freezing JavaScript timers when the phone screen is locked.
   */
  const startBackgroundAudioAnchor = () => {
    if (isNativeApp()) {
      return; // Android hardware AlarmClock handles exact background wake-up without audio hacks
    }
    try {
      // 1. Silent looping Audio element (anchors Media Session in Android)
      const silentWavUri = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      const audio = new Audio(silentWavUri);
      audio.loop = true;
      audio.volume = 0.01;
      audio.play().catch((e) => console.warn('Silent audio anchor play suppressed:', e));
      silentAudioRef.current = audio;

      // 2. AudioContext keep-alive node
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001; // inaudible
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        audioContextRef.current = ctx;
      }
    } catch (err) {
      console.warn('Audio anchor initialization warning:', err);
    }
  };

  const handleTestNotification = async () => {
    try {
      setNotifSuccessMsg('Sending test notification...');
      if (isNativeApp()) {
        await triggerTestNotification(
          `🔔 RailTrack Alert: ${trainName}`,
          `Approaching ${stationName}. Notifications are operational on your device!`
        );
      } else {
        if (webNotificationService.isSupported() && webNotificationService.getPermission() !== 'granted') {
          const granted = await webNotificationService.requestPermission();
          setHasPermission(granted);
          if (!granted) {
            setNotifSuccessMsg('⚠️ Notification permission required.');
            return;
          }
        }
        webNotificationService.sendDepartureReminderAlert({
          trainNumber,
          trainName,
          stationName,
          platform: '3',
          scheduledTime: '05:15 AM',
          expectedTime: '05:15 AM (On-Time)',
          delayMinutes: 0,
          advanceMinutes: 30,
          pnr: '4521849021'
        });
      }
      setNotifSuccessMsg('✅ Test notification sent! Check your status bar.');
      setTimeout(() => setNotifSuccessMsg(null), 4000);
    } catch (e: any) {
      setNotifSuccessMsg('❌ Failed: ' + (e.message || 'Notification error'));
    }
  };

  const handleStartLockScreenTest = async () => {
    // 1. Check & request permissions
    if (isNativeApp()) {
      if (!nativePerms?.notifications) {
        await requestNativeNotificationPermission();
      }
    } else if (webNotificationService.isSupported() && webNotificationService.getPermission() !== 'granted') {
      const granted = await webNotificationService.requestPermission();
      setHasPermission(granted);
    }

    // 2. Pre-fetch custom sound blob URL and sync to native Android storage BEFORE timer starts!
    let preloadedCustomUrl: string | undefined = undefined;
    let preloadedCustomName: string | undefined = undefined;

    if (selectedCustomSoundId) {
      preloadedCustomUrl = (await customAlarmSoundService.getSoundBlobUrl(selectedCustomSoundId)) || undefined;
      const sounds = await customAlarmSoundService.getAllSounds();
      const found = sounds.find((s) => s.id === selectedCustomSoundId);
      if (found) {
        preloadedCustomName = found.name;
        if (isNativeApp() && found.blob) {
          await syncCustomAudioToNative(found.blob);
        }
      }
    }

    // 3. Acquire screen wake lock
    await alarmAudioService.acquireWakeLock();

    // 4. If running in Native Android app, schedule exact AlarmManager wake-up alarm!
    if (isNativeApp()) {
      try {
        await scheduleNativeAlarm(
          testSeconds,
          `🌅 RailTrack: ${trainName} Departure!`,
          `Approaching ${stationName}. Tap to open or silence alarm.`
        );
      } catch (e) {
        console.warn('Native alarm schedule fallback to web worker:', e);
      }
    }

    // 5. Start background audio anchor so Android/iOS doesn't freeze the timer when screen is locked
    startBackgroundAudioAnchor();

    // 6. Set state
    setSecondsRemaining(testSeconds);
    setIsArmed(true);

    // 7. Create Web Worker to run timer on an independent background thread
    const workerScript = `
      let target = Date.now() + ${testSeconds} * 1000;
      let interval = setInterval(function() {
        let now = Date.now();
        let remaining = Math.max(0, Math.ceil((target - now) / 1000));
        postMessage({ type: 'tick', remaining: remaining });
        if (remaining <= 0) {
          clearInterval(interval);
          postMessage({ type: 'complete' });
        }
      }, 1000);
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === 'tick') {
        setSecondsRemaining(e.data.remaining);
      } else if (e.data.type === 'complete') {
        // TIMER HIT 00:00!
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setIsArmed(false);
        setSecondsRemaining(null);

        // TRIGGER ALARM:
        // 1. Lock-screen OS push notification
        webNotificationService.sendDepartureReminderAlert({
          trainNumber,
          trainName,
          stationName,
          platform: '3',
          scheduledTime: '05:15 AM',
          expectedTime: '08:15 AM (Delayed by 3h)',
          delayMinutes: 180,
          advanceMinutes: 150,
          pnr: '4521849021'
        });

        // 2. Play continuous loud alarm with preloaded custom audio or synthesizer
        alarmAudioService.startContinuousAlarm({
          toneType: selectedToneType,
          customSoundUrl: preloadedCustomUrl,
          customSoundName: preloadedCustomName,
          trainNumber,
          stationName,
          etaMinutes: 25
        });

        // Release silent audio anchor now that loud alarm has taken over
        if (silentAudioRef.current) {
          try {
            silentAudioRef.current.pause();
            silentAudioRef.current.src = '';
          } catch (err) {}
          silentAudioRef.current = null;
        }
      }
    };
  };

  const handleCancelTimer = () => {
    if (isNativeApp()) {
      cancelNativeAlarm();
      stopNativeAlarm();
    }
    alarmAudioService.stopAlarm();
    cleanupBackgroundKeepAlive();
    setIsArmed(false);
    setSecondsRemaining(null);
  };

  const handleGrantOverlay = async () => {
    await requestNativeOverlayPermission();
    setTimeout(async () => {
      const p = await checkNativeAlarmPermissions();
      if (p) setNativePerms(p);
    }, 1500);
  };

  const handleGrantNotifications = async () => {
    try {
      await requestNativeNotificationPermission();
      await openNativeNotificationSettings();
    } catch {}
    setTimeout(async () => {
      const p = await checkNativeAlarmPermissions();
      if (p) setNativePerms(p);
    }, 1500);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // If armed and modal is closed, show a persistent floating countdown pill at bottom
  if (!isOpen && isArmed && secondsRemaining !== null) {
    return (
      <div className="fixed bottom-5 right-4 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-3 animate-pulse">
        <Radio className="w-5 h-5 text-yellow-200 animate-spin" />
        <div className="text-left">
          <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <span>Lock-Screen Alarm Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-sm font-black font-mono">Fires in {formatCountdown(secondsRemaining)}</div>
        </div>
        <button
          type="button"
          onClick={handleCancelTimer}
          className="ml-2 px-2.5 py-1 bg-black/40 hover:bg-black/60 rounded-lg text-xs font-bold text-white transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Lock-Screen Alarm Tester</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isNativeApp() ? 'Native Android AlarmManager + Audio Anchor' : 'Background Audio Anchor + Web Worker'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-slate-950/80 rounded-xl border border-amber-500/20 p-3.5 space-y-2 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>How to test with phone locked:</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
            <li>Select your test delay below (e.g. <strong>2 Minutes</strong>).</li>
            <li>Click <strong>&quot;Arm Test Alarm&quot;</strong>.</li>
            <li><strong>Lock your phone screen</strong> and place it on your desk.</li>
            <li>When the countdown reaches 00:00, the native alarm and audio player will wake up your screen and ring!</li>
          </ol>
        </div>

        {/* Android Native Permissions Cockpit if running inside Android App */}
        {isNativeApp() && (
          <div className="bg-slate-950/90 rounded-xl border border-indigo-500/30 p-3 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span>Android App Permissions</span>
              <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-200">Capacitor Native</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* Notification Permission */}
              <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Notifications</span>
                </span>
                {nativePerms?.notifications ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Granted
                    </span>
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Test Push
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGrantNotifications}
                    className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded cursor-pointer"
                  >
                    Enable
                  </button>
                )}
              </div>

              {/* Display over other apps (Overlay) */}
              <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Display Over Other Apps</span>
                </span>
                {nativePerms?.overlay ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Granted
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleGrantOverlay}
                    className="text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <span>Grant in Settings</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timer Duration Selection */}
        {!isArmed ? (
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Countdown Timer:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { sec: 30, label: '30 Seconds (Fast)' },
                { sec: 60, label: '1 Minute' },
                { sec: 120, label: '2 Minutes (Recommended)' },
                { sec: 300, label: '5 Minutes' }
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setTestSeconds(opt.sec)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                    testSeconds === opt.sec
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>

            {/* Notification Permission Indicator for Web */}
            {!isNativeApp() && (
              <div className="flex items-center justify-between text-[11px] p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Lock-Screen Notification Permission:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold flex items-center gap-1 ${
                    hasPermission ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {hasPermission ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Granted</span>
                      </>
                    ) : (
                      <span>Will Request on Start</span>
                    )}
                  </span>
                  {hasPermission && (
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Test
                    </button>
                  )}
                </div>
              </div>
            )}

            {notifSuccessMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium border ${
                notifSuccessMsg.includes('✅') 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : notifSuccessMsg.includes('❌') || notifSuccessMsg.includes('⚠️')
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 animate-pulse'
              }`}>
                {notifSuccessMsg}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestNotification}
                className="py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                title="Send an immediate test notification to check delivery"
              >
                <Bell className="w-4 h-4 text-indigo-400" />
                <span>Test Notification</span>
              </button>
              <button
                type="button"
                onClick={handleStartLockScreenTest}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Arm Test Alarm ({testSeconds >= 60 ? `${testSeconds / 60}m` : `${testSeconds}s`})</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Armed Countdown State */
          <div className="p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-300 flex items-center justify-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>{isNativeApp() ? 'ANDROID ALARMMANAGER ARMED' : 'BACKGROUND AUDIO ANCHOR ACTIVE'}</span>
              </div>
              <div className="text-4xl font-black font-mono text-white mt-1">
                {secondsRemaining !== null ? formatCountdown(secondsRemaining) : '--:--'}
              </div>
              <p className="text-xs text-amber-200/90 mt-2">
                🔒 <strong>Lock your phone now!</strong> The alarm will fire even with the screen off and locked.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelTimer}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 mx-auto transition cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Cancel Test Timer</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
