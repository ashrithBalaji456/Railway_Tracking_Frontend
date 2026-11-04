import { Bell, AlertOctagon, Check, Luggage, Volume2, Train, Clock } from 'lucide-react';

interface RingingAlarmOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSnooze?: () => void;
  trainNumber: string;
  trainName?: string;
  stationName: string;
  stationCode: string;
  etaMinutes?: number;
  distanceKm?: number;
  platform?: string;
}

export default function RingingAlarmOverlay({
  isOpen,
  onDismiss,
  onSnooze,
  trainNumber,
  trainName,
  stationName,
  stationCode,
  etaMinutes = 25,
  distanceKm,
  platform
}: RingingAlarmOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-rose-950/95 flex flex-col items-center justify-between p-6 sm:p-10 animate-pulse text-white select-none">
      {/* Top Bar Warning */}
      <div className="w-full max-w-xl flex items-center justify-between bg-black/60 backdrop-blur-md border border-rose-500/50 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm sm:text-base">
          <AlertOctagon className="w-5 h-5 animate-spin" />
          <span>WAKE UP! STATION ARRIVAL IMMINENT</span>
        </div>
        <div className="flex items-center gap-2 bg-rose-600 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>ALARM RINGING</span>
        </div>
      </div>

      {/* Main Attention Center */}
      <div className="w-full max-w-xl text-center space-y-6 my-auto">
        <div className="inline-flex p-6 rounded-full bg-rose-600 border-4 border-white/80 shadow-2xl shadow-rose-500/60 animate-bounce">
          <Bell className="w-16 h-16 sm:w-20 sm:h-20 text-white fill-white" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
            <Train className="w-3.5 h-3.5" />
            <span>Train {trainNumber} {trainName ? `• ${trainName}` : ''}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {stationName}
          </h1>
          <div className="text-lg sm:text-xl font-mono text-rose-200">
            Station Code: <strong className="text-white underline">{stationCode}</strong>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/50 border border-white/20 rounded-2xl p-4">
          <div className="text-center">
            <span className="block text-[11px] text-slate-300 uppercase font-bold">Estimated Time</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300">~{etaMinutes}m</span>
          </div>
          {distanceKm != null && distanceKm > 0 && (
            <div className="text-center">
              <span className="block text-[11px] text-slate-300 uppercase font-bold">Distance</span>
              <span className="text-2xl sm:text-3xl font-black text-white">{distanceKm} km</span>
            </div>
          )}
          <div className="text-center col-span-2 sm:col-span-1">
            <span className="block text-[11px] text-slate-300 uppercase font-bold">Expected Platform</span>
            <span className="text-2xl sm:text-3xl font-black text-sky-300">
              {platform ? `#${platform}` : 'Check Boards'}
            </span>
          </div>
        </div>

        {/* Deboarding Quick Checklist */}
        <div className="bg-amber-950/70 border border-amber-500/40 rounded-xl p-3.5 text-left text-xs sm:text-sm text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <Luggage className="w-4 h-4" />
            <span>Deboarding Checklist:</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed">
            • Collect bags and chargers from under the berth.<br/>
            • Keep your phone, wallet, and ticket ready.<br/>
            • Move safely towards the door once train slows down.
          </p>
        </div>
      </div>

      {/* Big Dismiss and Snooze Buttons */}
      <div className="w-full max-w-xl pt-4 space-y-3">
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-rose-700 hover:text-rose-800 text-base sm:text-xl font-black uppercase tracking-wider shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
        >
          <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
          <span>I AM AWAKE &bull; STOP ALARM</span>
        </button>

        {onSnooze && (
          <button
            type="button"
            onClick={onSnooze}
            className="w-full py-3.5 px-6 rounded-xl bg-black/60 hover:bg-black/80 text-amber-300 border border-amber-400/50 text-sm sm:text-base font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
          >
            <Clock className="w-5 h-5 text-amber-300" />
            <span>Snooze for 5 Minutes</span>
          </button>
        )}
      </div>
    </div>
  );
}
