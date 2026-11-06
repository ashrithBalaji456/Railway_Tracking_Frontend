import { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  X, 
  Mail, 
  Smartphone,
  Music,
  Play,
  Check
} from 'lucide-react';
import { alarmAudioService, type AlarmToneType } from '../utils/alarmAudioService';
import customAlarmSoundService, { type CustomAlarmSound } from '../utils/customAlarmSoundService';
import { syncCustomAudioToNative } from '../utils/nativeAlarmBridge';

export interface WakeUpAlarmConfig {
  id?: string;
  trainNumber?: string;
  trainName?: string;
  stationCode: string;
  stationName: string;
  platform?: string;
  triggerMinutes: number;
  toneType: AlarmToneType | 'custom';
  customSoundId?: string;
  customSoundName?: string;
  backupEmail?: string;
  expectedArrival?: string;
  journeyDate?: string;
  armedAt: string;
}

interface StationWakeUpAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName?: string;
  station: {
    stationCode: string;
    stationName: string;
    expectedArrival?: string;
    distance?: number;
    platform?: string;
  };
  currentArmedConfig: WakeUpAlarmConfig | null;
  onArmAlarm: (config: WakeUpAlarmConfig) => void;
  onDisarmAlarm: () => void;
}

export default function StationWakeUpAlarmModal({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  station,
  currentArmedConfig,
  onArmAlarm,
  onDisarmAlarm
}: StationWakeUpAlarmModalProps) {
  const [triggerMinutes, setTriggerMinutes] = useState<number>(
    currentArmedConfig?.triggerMinutes || 30
  );
  const [selectedSoundMode, setSelectedSoundMode] = useState<AlarmToneType | 'custom'>(() => {
    if (currentArmedConfig?.customSoundName || currentArmedConfig?.toneType === 'custom') {
      return 'custom';
    }
    return (currentArmedConfig?.toneType as AlarmToneType) || 'custom';
  });
  const [customSound, setCustomSound] = useState<CustomAlarmSound | null>(null);
  const [backupEmail, setBackupEmail] = useState<string>(
    currentArmedConfig?.backupEmail || localStorage.getItem('email') || ''
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewingCustom, setPreviewingCustom] = useState(false);

  useEffect(() => {
    let isMounted = true;
    customAlarmSoundService.getDefaultSound().then((def) => {
      if (!isMounted) return;
      setCustomSound(def);
      if (!currentArmedConfig) {
        if (def) {
          setSelectedSoundMode('custom');
        } else {
          setSelectedSoundMode('digital_clock');
        }
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentArmedConfig]);

  if (!isOpen) return null;

  const isAlreadyArmedForThisStation =
    currentArmedConfig?.stationCode?.toUpperCase() === station.stationCode?.toUpperCase();

  const handlePreviewTone = (tone: AlarmToneType) => {
    setIsPreviewing(true);
    alarmAudioService.previewTone(tone);
    setTimeout(() => setIsPreviewing(false), 2200);
  };

  const handlePreviewCustom = async () => {
    if (!customSound) return;
    setPreviewingCustom(true);
    try {
      const url = await customAlarmSoundService.getSoundBlobUrl(customSound.id);
      if (url) {
        alarmAudioService.previewCustomSound(url);
      }
    } catch (e) {
      console.warn('Error previewing custom sound:', e);
    }
    setTimeout(() => setPreviewingCustom(false), 3500);
  };

  const handleSaveAndArm = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    alarmAudioService.acquireWakeLock();

    const isCustom = selectedSoundMode === 'custom' && !!customSound;
    if (isCustom && customSound?.blob) {
      try {
        await syncCustomAudioToNative(customSound.blob);
      } catch (e) {
        console.warn('Audio sync error before arming:', e);
      }
    }
    await onArmAlarm({
      trainNumber,
      trainName,
      stationCode: station.stationCode,
      stationName: station.stationName,
      platform: station.platform,
      triggerMinutes,
      toneType: isCustom ? 'custom' : (selectedSoundMode as AlarmToneType),
      customSoundId: isCustom ? customSound?.id : undefined,
      customSoundName: isCustom ? customSound?.name : undefined,
      backupEmail: backupEmail.trim() || undefined,
      expectedArrival: station.expectedArrival,
      armedAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header - Sticky Top */}
        <div className="flex items-start justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                <span>Night Travel Sleep Guardian</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Station Approaching Wake-Up Alarm</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* Target Station Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-indigo-950/70 text-indigo-400 rounded-lg shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Target Station</div>
                <div className="text-sm font-bold text-white truncate">
                  {station.stationName} <span className="font-mono text-indigo-400">({station.stationCode})</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Train: <strong className="text-slate-200">{trainNumber}</strong> {trainName ? `• ${trainName}` : ''}
                </div>
              </div>
            </div>
            {station.platform && (
              <span className="shrink-0 text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-sky-400 font-bold">
                PF #{station.platform}
              </span>
            )}
          </div>

          {/* Trigger Time Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Wake Me Up When Train Is:</span>
              </label>
              <span className="text-[10px] text-amber-300/90 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Time or Distance (1st match)
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { mins: 15, label: '15 mins', sub: '≤ 12 km' },
                { mins: 30, label: '30 mins', sub: '≤ 25 km' },
                { mins: 45, label: '45 mins', sub: '≤ 38 km' },
                { mins: 60, label: '1 hour', sub: '≤ 50 km' },
                { mins: 90, label: '1.5 hrs', sub: '≤ 75 km' },
                { mins: 120, label: '2 hours', sub: '≤ 100 km' }
              ].map(({ mins, label, sub }) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTriggerMinutes(mins)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    triggerMinutes === mins
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div>~{label}</div>
                  <div className="text-[9px] font-semibold text-emerald-400 mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              💡 <strong>Hybrid Rule:</strong> Guarantees alarm rings if train is within selected minutes <em>OR</em> enters the distance radius, protecting you if the train speeds up or delays.
            </p>
          </div>

          {/* Ringtone Selection & Preview */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Alarm Sound:</span>
              </span>
              {customSound && (
                <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                  <Music className="w-3 h-3" /> Default Audio Active
                </span>
              )}
            </label>

            {/* User's Default Custom MP3 Sound (if configured in Alarm Center) */}
            {customSound ? (
              <div
                onClick={() => setSelectedSoundMode('custom')}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                  selectedSoundMode === 'custom'
                    ? 'bg-amber-500/15 border-amber-500/70 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-lg shrink-0 ${selectedSoundMode === 'custom' ? 'bg-amber-500/25 text-amber-300' : 'bg-slate-900 text-slate-400'}`}>
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate max-w-[190px] sm:max-w-xs">{customSound.name}</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40">
                          DEFAULT
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Your uploaded song from Alarm Center • {(customSound.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewCustom();
                      }}
                      disabled={previewingCustom}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Play className={`w-3 h-3 ${previewingCustom ? 'animate-spin' : ''}`} />
                      <span>{previewingCustom ? 'Playing...' : 'Preview'}</span>
                    </button>
                    {selectedSoundMode === 'custom' && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Built-in Rail Synthesizers */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {customSound ? 'Or choose built-in rail synthesizers:' : 'Choose synthesized tone (or upload MP3 in Alarm Center):'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'digital_clock', label: 'Classic Digital', desc: 'Loud pulsing beeps' },
                  { id: 'emergency_siren', label: 'Emergency Siren', desc: 'Oscillating sweep' },
                  { id: 'train_horn', label: 'Locomotive Horn', desc: 'Dual-tone brass' }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedSoundMode(tone.id as AlarmToneType)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedSoundMode === tone.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{tone.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{tone.desc}</div>
                  </button>
                ))}
              </div>

              {selectedSoundMode !== 'custom' && (
                <button
                  type="button"
                  onClick={() => handlePreviewTone(selectedSoundMode as AlarmToneType)}
                  disabled={isPreviewing}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 text-indigo-400 ${isPreviewing ? 'animate-ping' : ''}`} />
                  <span>{isPreviewing ? 'Playing Test Ringtone...' : 'Test Loudness (Preview)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Optional Backup Brevo Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backup Emergency Email Alert (Optional):</span>
            </label>
            <input
              type="email"
              placeholder="you@domain.com"
              value={backupEmail}
              onChange={(e) => setBackupEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400 block">
              Fires an urgent deboarding email snapshot to your phone simultaneously when alarm rings.
            </span>
          </div>

          {/* How it works info badge */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-200">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Sleep Peacefully Guarantee</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[10px]">
              When armed, the app requests a <strong>Screen Wake Lock</strong> so your phone stays on alert. Continuous audio ringtone, repeating voice announcements, and device vibration will ring until you wake up and dismiss the alarm.
            </p>
          </div>
        </div>

        {/* Modal Actions - Sticky Bottom */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 backdrop-blur shrink-0 z-10">
          {isAlreadyArmedForThisStation ? (
            <button
              type="button"
              onClick={() => {
                onDisarmAlarm();
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer"
            >
              Disarm Current Alarm
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAndArm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAlreadyArmedForThisStation ? 'Update & Re-Arm Alarm' : 'Arm Wake-Up Alarm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
