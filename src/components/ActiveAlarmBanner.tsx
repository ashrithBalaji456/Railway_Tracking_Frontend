import { useState, useEffect } from 'react';
import { VolumeX, Clock, ShieldAlert } from 'lucide-react';
import alarmAudioService, { type ActiveAlarmInfo } from '../utils/alarmAudioService';
import { stopNativeAlarm, checkNativeAlarmRinging, isNativeApp, syncCustomAudioToNative } from '../utils/nativeAlarmBridge';
import customAlarmSoundService from '../utils/customAlarmSoundService';
import multiAlarmManager from '../utils/multiAlarmManager';
import RingingAlarmOverlay from './RingingAlarmOverlay';

export default function ActiveAlarmBanner() {
  const [alarmInfo, setAlarmInfo] = useState<(ActiveAlarmInfo & { stationCode?: string }) | null>(() => {
    return alarmAudioService.getActiveAlarmInfo() as any;
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

  useEffect(() => {
    // Ensure existing user's custom alarm song is streamed chunk-by-chunk to Android storage on boot
    const syncAudioOnBoot = async () => {
      try {
        if (isNativeApp()) {
          const defaultSound = await customAlarmSoundService.getDefaultSound();
          if (defaultSound && defaultSound.blob) {
            console.log('[ActiveAlarmBanner] Syncing default custom alarm song to native storage:', defaultSound.name);
            await syncCustomAudioToNative(defaultSound.blob);
          }
        }
      } catch (e) {
        console.warn('[ActiveAlarmBanner] Audio sync on boot error:', e);
      }
    };
    syncAudioOnBoot();
  }, []);

  useEffect(() => {
    // Check native Android hardware alarm state periodically and on focus/resume
    const pollNativeAlarm = async () => {
      try {
        const res = await checkNativeAlarmRinging();
        if (res && res.isRinging) {
          const matched = res.trainNumber && res.stationCode ? multiAlarmManager.getArmedAlarm(res.trainNumber, res.stationCode) : null;
          const fallback = !matched ? multiAlarmManager.getArmedAlarms()[0] : null;
          const config = matched || fallback;

          setAlarmInfo({
            isPlaying: true,
            trainNumber: res.trainNumber || config?.trainNumber || '',
            stationCode: res.stationCode || config?.stationCode || '',
            stationName: res.stationName || config?.stationName || 'Your Destination',
            platform: (res.platform && res.platform !== 'null') ? res.platform : ((config?.platform && config?.platform !== 'null') ? config.platform : ''),
            toneType: config?.toneType === 'custom' ? undefined : (config?.toneType || 'digital_clock'),
            customSoundName: config?.customSoundName,
            etaMinutes: res.triggerMinutes || config?.triggerMinutes || 5
          });
        }
      } catch (err) {
        // ignore
      }
    };

    pollNativeAlarm();
    const interval = setInterval(pollNativeAlarm, 1500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollNativeAlarm();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', pollNativeAlarm);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', pollNativeAlarm);
    };
  }, []);

  if (!alarmInfo || !alarmInfo.isPlaying) {
    return null;
  }

  const handleTurnOff = async () => {
    alarmAudioService.stopAlarm();
    await stopNativeAlarm();
    if (alarmInfo.trainNumber && alarmInfo.stationCode) {
      await multiAlarmManager.disarmAlarm(alarmInfo.trainNumber, alarmInfo.stationCode);
    } else {
      await multiAlarmManager.disarmAllAlarms();
    }
    setAlarmInfo(null);
  };

  const handleSnooze = async () => {
    alarmAudioService.stopAlarm();
    if (alarmInfo.trainNumber && alarmInfo.stationCode) {
      await multiAlarmManager.snoozeAlarm(alarmInfo.trainNumber, alarmInfo.stationCode, 5);
    } else {
      await multiAlarmManager.snoozeAlarm('', '', 5);
    }
    setAlarmInfo(null);
  };

  const trainLabel = alarmInfo.trainNumber ? `Train ${alarmInfo.trainNumber}` : 'Your Train';
  const stationLabel = alarmInfo.stationName ? `at ${alarmInfo.stationName}` : '';

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[90] bg-gradient-to-b from-slate-950 via-rose-950 to-red-900 text-white shadow-2xl border-b-2 border-rose-500/80 animate-in slide-in-from-top-full duration-300 pt-10 pb-3 sm:pt-4 sm:pb-3 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Alarm Status Telemetry */}
          <div className="flex items-center gap-3 text-center sm:text-left w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/50 flex items-center justify-center shrink-0 animate-bounce shadow-lg shadow-rose-600/40">
              <ShieldAlert className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-slate-950 shadow-sm">
                  🚨 ALARM RINGING NOW
                </span>
                <span className="text-[11px] text-rose-200 font-medium hidden sm:inline">
                  Screen Wake Lock Active
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-1 tracking-tight flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span>{trainLabel} {stationLabel}</span>
                {alarmInfo.customSoundName && (
                  <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-yellow-200 border border-white/20 truncate max-w-[200px]">
                    🎵 {alarmInfo.customSoundName}
                  </span>
                )}
              </h3>
            </div>
          </div>

          {/* Right: Urgent Off / Snooze Controls */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end shrink-0 pt-0.5 sm:pt-0">
            <button
              type="button"
              onClick={handleSnooze}
              className="px-4 py-2.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/20 text-xs font-bold text-rose-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Silence alarm for 5 minutes"
            >
              <Clock className="w-3.5 h-3.5 text-yellow-300" />
              <span>Snooze 5m</span>
            </button>

            <button
              type="button"
              onClick={handleTurnOff}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-white to-rose-50 text-rose-800 hover:text-rose-900 border-2 border-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl shadow-black/60 transition transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
              title="Silence all sounds, vibrations, and voice announcements"
            >
              <VolumeX className="w-4 h-4 text-rose-700" />
              <span>🛑 Turn Off Alarm</span>
            </button>
          </div>
        </div>
      </div>

      <RingingAlarmOverlay
        isOpen={Boolean(alarmInfo && alarmInfo.isPlaying)}
        onDismiss={handleTurnOff}
        onSnooze={handleSnooze}
        trainNumber={alarmInfo.trainNumber || ''}
        stationName={alarmInfo.stationName || 'Upcoming Station'}
        stationCode={alarmInfo.stationCode || ''}
        platform={alarmInfo.platform}
        etaMinutes={alarmInfo.etaMinutes || 5}
      />
    </>
  );
}
