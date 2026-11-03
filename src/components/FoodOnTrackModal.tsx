import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Utensils,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Search
} from 'lucide-react';
import api from '../services/api';
import { getStationGastronomy, type StationDelicacy } from '../data/stationGastronomy';

interface RouteStationInput {
  stationCode: string;
  stationName: string;
  arrivalTime?: string;
  departureTime?: string;
  haltMinutes?: number;
  distanceFromSource?: number;
}

interface FoodOnTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName?: string;
  routeStations: RouteStationInput[];
}

interface EnrichedFoodStop {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  haltMinutes: number;
  isSafeHalt: boolean;
  mealPhase: 'Breakfast' | 'Lunch' | 'Evening Tea & Snacks' | 'Dinner' | 'Late Night Refreshment';
  delicacy: StationDelicacy;
}

export default function FoodOnTrackModal({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  routeStations
}: FoodOnTrackModalProps) {
  const [filter, setFilter] = useState<'ALL' | 'SAFE' | 'BREAKFAST' | 'LUNCH' | 'DINNER'>('ALL');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('email') || localStorage.getItem('user_email') || '';
      if (stored) setEmail(stored);
      setStatus(null);
    }
  }, [isOpen]);

  // Enrich route stations with authentic gastronomy data and meal phases
  const foodStops = useMemo<EnrichedFoodStop[]>(() => {
    if (!routeStations || routeStations.length === 0) return [];

    return routeStations.map((st) => {
      const arr = st.arrivalTime || st.departureTime || '12:00';
      const halt = st.haltMinutes || 0;
      const delicacy = getStationGastronomy(st.stationCode);

      // Determine Meal Phase based on Arrival Time (HH:mm)
      let mealPhase: 'Breakfast' | 'Lunch' | 'Evening Tea & Snacks' | 'Dinner' | 'Late Night Refreshment' = 'Lunch';
      const [h] = arr.split(':').map(Number);
      const hour = isNaN(h) ? 12 : h;

      if (hour >= 6 && hour < 11) {
        mealPhase = 'Breakfast';
      } else if (hour >= 11 && hour < 16) {
        mealPhase = 'Lunch';
      } else if (hour >= 16 && hour < 19) {
        mealPhase = 'Evening Tea & Snacks';
      } else if (hour >= 19 && hour <= 23) {
        mealPhase = 'Dinner';
      } else {
        mealPhase = 'Late Night Refreshment';
      }

      return {
        stationCode: st.stationCode,
        stationName: st.stationName,
        arrivalTime: arr,
        departureTime: st.departureTime || arr,
        haltMinutes: halt,
        isSafeHalt: halt >= 10,
        mealPhase,
        delicacy
      };
    });
  }, [routeStations]);

  // Filtered stops
  const filteredStops = useMemo(() => {
    return foodStops.filter((stop) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        stop.stationName.toLowerCase().includes(q) ||
        stop.stationCode.toLowerCase().includes(q) ||
        stop.delicacy.delicacyTitle.toLowerCase().includes(q) ||
        stop.delicacy.badgeShortText.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filter === 'SAFE') return stop.isSafeHalt;
      if (filter === 'BREAKFAST') return stop.mealPhase === 'Breakfast';
      if (filter === 'LUNCH') return stop.mealPhase === 'Lunch';
      if (filter === 'DINNER') return stop.mealPhase === 'Dinner';
      return true;
    });
  }, [foodStops, filter, search]);

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }

    try {
      setSending(true);
      setStatus(null);

      // Save email locally
      localStorage.setItem('email', email.trim().toLowerCase());

      const payload = {
        trainNumber,
        trainName: trainName || 'Express',
        email: email.trim().toLowerCase(),
        stops: foodStops.map((s) => ({
          stationCode: s.stationCode,
          stationName: s.stationName,
          arrivalTime: s.arrivalTime,
          haltMinutes: s.haltMinutes,
          mealPhase: s.mealPhase,
          delicacyTitle: s.delicacy.delicacyTitle,
          badgeEmoji: s.delicacy.badgeEmoji,
          bestPlatformOrStall: s.delicacy.bestPlatformOrStall,
          mustTryItems: s.delicacy.mustTryItems ? s.delicacy.mustTryItems.join(', ') : ''
        }))
      };

      const res: any = await api.post(`/api/v1/trains/${trainNumber}/food-guide/email`, payload);
      setStatus({
        type: 'success',
        text: res?.message || `Food on Track journey guide dispatched to ${email.trim()}! Please check your inbox.`
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Could not send food guide email. Please verify connection.'
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Culinary & Meal Itinerary</span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Food on Track: Route Delicacy & Meal Planner</span>
              </h2>
              <p className="text-xs text-slate-400">
                Train {trainNumber} {trainName ? `• ${trainName}` : ''} ({foodStops.length} Gastronomic Stops)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All Stops ({foodStops.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('SAFE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'SAFE'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe 10+ Min Halts</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('BREAKFAST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === 'BREAKFAST'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              🌅 Breakfast
            </button>
            <button
              type="button"
              onClick={() => setFilter('LUNCH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === 'LUNCH'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              🍛 Lunch
            </button>
            <button
              type="button"
              onClick={() => setFilter('DINNER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === 'DINNER'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              🍲 Dinner
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter station or delicacy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Scrollable Delicacy Cards */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
          {filteredStops.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No food halts match the selected filter.</p>
              <button
                type="button"
                onClick={() => {
                  setFilter('ALL');
                  setSearch('');
                }}
                className="text-xs text-amber-400 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredStops.map((stop, idx) => (
              <div
                key={`${stop.stationCode}-${idx}`}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{stop.stationName}</span>
                      <span className="text-xs font-mono text-slate-400">({stop.stationCode})</span>
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Arr {stop.arrivalTime}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                      {stop.mealPhase}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 ${
                        stop.isSafeHalt
                          ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300'
                          : 'bg-amber-950/80 border border-amber-600/60 text-amber-300'
                      }`}
                    >
                      {stop.isSafeHalt ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>{stop.haltMinutes} min halt (Safe Step-Out)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>{stop.haltMinutes} min (Quick Stop)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Delicacy Title & Best Stall */}
                  <div className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                    <span className="text-base">{stop.delicacy.badgeEmoji}</span>
                    <span>{stop.delicacy.delicacyTitle}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {stop.delicacy.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                    <div>
                      <strong className="text-slate-300">📍 Best Stall:</strong>{' '}
                      <span>{stop.delicacy.bestPlatformOrStall}</span>
                    </div>
                    {stop.delicacy.mustTryItems && stop.delicacy.mustTryItems.length > 0 && (
                      <div>
                        <strong className="text-indigo-300">✨ Must Try:</strong>{' '}
                        <span>{stop.delicacy.mustTryItems.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Email Dispatch Form */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 space-y-3">
          {status && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                status.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{status.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatus(null)}
                className="text-xs underline hover:opacity-80 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="Enter email to receive formatted journey food itinerary..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {sending ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Food Guide...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Email My Journey Food Guide</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

