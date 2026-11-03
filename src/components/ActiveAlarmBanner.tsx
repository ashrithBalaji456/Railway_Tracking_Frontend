import { useState, useEffect } from 'react';
import { VolumeX, Clock, ShieldAlert } from 'lucide-react';
import alarmAudioService, { type ActiveAlarmInfo } from '../utils/alarmAudioService';

export default function ActiveAlarmBanner() {
  const [alarmInfo, setAlarmInfo] = useState<ActiveAlarmInfo | null>(() => {
    return alarmAudioService.getActiveAlarmInfo();
  });

  useEffect(() => {
    const handleAlarmState = (e: any) => {
      const detail = e.detail;
      if (detail && detail.isPlaying) {
        setAlarmInfo(detail);
      } else {
        setAlarmInfo(null);
      }
    };

    window.addEventListener('rail-alarm-state', handleAlarmState);
    return () => {
      window.removeEventListener('rail-alarm-state', handleAlarmState);
    };
  }, []);

  if (!alarmInfo || !alarmInfo.isPlaying) {
    return null;
  }

  const handleTurnOff = () => {
    alarmAudioService.stopAlarm();
    setAlarmInfo(null);
  };

  const handleSnooze = () => {
    alarmAudioService.stopAlarm();
    setAlarmInfo(null);
    // Snooze for 5 minutes
    setTimeout(() => {
      alarmAudioService.startContinuousAlarm({
        toneType: alarmInfo.toneType,
        trainNumber: alarmInfo.trainNumber,
        stationName: alarmInfo.stationName,
        etaMinutes: 5
      });
    }, 5 * 60 * 1000);
  };

  const trainLabel = alarmInfo.trainNumber ? `Train ${alarmInfo.trainNumber}` : 'Your Train';
  const stationLabel = alarmInfo.stationName ? `at ${alarmInfo.stationName}` : '';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-rose-900 via-red-800 to-rose-900 text-white shadow-2xl border-b-2 border-rose-500 animate-in slide-in-from-top-full duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Alarm Status Telemetry */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 animate-bounce">
            <ShieldAlert className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-yellow-400 text-black">
                🚨 ALARM RINGING NOW
              </span>
              <span className="text-xs text-rose-200 font-medium hidden sm:inline">
                Screen Wake Lock Active
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white mt-0.5 tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span>{trainLabel} {stationLabel}</span>
              {alarmInfo.customSoundName && (
                <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-yellow-300">
                  🎵 {alarmInfo.customSoundName}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Right: Urgent Off / Snooze Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
          <button
            type="button"
            onClick={handleSnooze}
            className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-bold text-rose-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="Silence alarm for 5 minutes"
          >
            <Clock className="w-3.5 h-3.5 text-yellow-300" />
            <span>Snooze 5m</span>
          </button>

          <button
            type="button"
            onClick={handleTurnOff}
            className="px-5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 border-2 border-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-black/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            title="Silence all sounds, vibrations, and voice announcements"
          >
            <VolumeX className="w-4 h-4 text-rose-700" />
            <span>🛑 Turn Off Alarm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
