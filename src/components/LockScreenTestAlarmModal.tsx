import { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Smartphone, 
  X, 
  Play, 
  CheckCircle2, 
  VolumeX,
  ShieldCheck,
  Radio
} from 'lucide-react';
import alarmAudioService, { type AlarmToneType } from '../utils/alarmAudioService';
import customAlarmSoundService from '../utils/customAlarmSoundService';
import webNotificationService from '../utils/webNotificationService';

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

  const workerRef = useRef<Worker | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check notification permission when opened
  useEffect(() => {
    if (isOpen) {
      setHasPermission(webNotificationService.getPermission() === 'granted');
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
    try {
      // 1. Silent looping Audio element (anchors Media Session in Android)
      // Generates a 1-second inaudible WAV audio data URI
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

  const handleStartLockScreenTest = async () => {
    // 1. Request notification permission if not yet granted
    if (webNotificationService.isSupported() && webNotificationService.getPermission() !== 'granted') {
      const granted = await webNotificationService.requestPermission();
      setHasPermission(granted);
    }

    // 2. Acquire screen wake lock
    await alarmAudioService.acquireWakeLock();

    // 3. Start background audio anchor so Android/iOS doesn't freeze the timer when screen is locked!
    startBackgroundAudioAnchor();

    // 4. Set state
    setSecondsRemaining(testSeconds);
    setIsArmed(true);

    // 5. Create Web Worker to run timer on an independent background thread
    // This avoids main-thread setInterval freezing during screen lock!
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

    worker.onmessage = async (e) => {
      if (e.data.type === 'tick') {
        setSecondsRemaining(e.data.remaining);
      } else if (e.data.type === 'complete') {
        // TIMER HIT 00:00! Clean up anchor and fire the alarm
        cleanupBackgroundKeepAlive();
        setIsArmed(false);
        setSecondsRemaining(null);

        // Fetch custom sound blob URL if configured
        let customUrl: string | undefined = undefined;
        let customName: string | undefined = undefined;

        if (selectedCustomSoundId) {
          const url = await customAlarmSoundService.getSoundBlobUrl(selectedCustomSoundId);
          if (url) {
            customUrl = url;
            const sounds = await customAlarmSoundService.getAllSounds();
            const found = sounds.find((s) => s.id === selectedCustomSoundId);
            if (found) customName = found.name;
          }
        }

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

        // 2. Play continuous loud alarm with custom audio or synthesizer
        alarmAudioService.startContinuousAlarm({
          toneType: selectedToneType,
          customSoundUrl: customUrl,
          customSoundName: customName,
          trainNumber,
          stationName,
          etaMinutes: 25
        });
      }
    };
  };

  const handleCancelTimer = () => {
    cleanupBackgroundKeepAlive();
    setIsArmed(false);
    setSecondsRemaining(null);
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
                Background audio anchor guarantees wakeup even when locked
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
            <li>Click <strong>"Arm Test Alarm"</strong>.</li>
            <li><strong>Lock your phone screen</strong> and place it on your desk.</li>
            <li>Our background audio anchor keeps the CPU active in the background, so the alarm and lock-screen notification will fire on time!</li>
          </ol>
        </div>

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

            {/* Notification Permission Indicator */}
            <div className="flex items-center justify-between text-[11px] p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Lock-Screen Notification Permission:</span>
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
            </div>

            <button
              type="button"
              onClick={handleStartLockScreenTest}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Arm Test Alarm (Rings in {testSeconds >= 60 ? `${testSeconds / 60}m` : `${testSeconds}s`})</span>
            </button>
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
                <span>BACKGROUND AUDIO ANCHOR ACTIVE</span>
              </div>
              <div className="text-4xl font-black font-mono text-white mt-1">
                {secondsRemaining !== null ? formatCountdown(secondsRemaining) : '--:--'}
              </div>
              <p className="text-xs text-amber-200/90 mt-2">
                🔒 <strong>Lock your phone now!</strong> The audio anchor ensures the timer continues running in background.
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
