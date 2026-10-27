import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  GitFork, 
  Clock, 
  Search, 
  ArrowRight, 
  Train as TrainIcon, 
  CheckCircle2,
  Calendar,
  Info
} from 'lucide-react';
import { getDisruptions, getDisruptionsSummary, getTrainsBetween } from '../services/api';
import type { TrainException, TrainExceptionSummary, TrainBetweenStations } from '../types';

export default function DisruptionsPage() {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState<TrainException[]>([]);
  const [summary, setSummary] = useState<TrainExceptionSummary | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modal for Alternative Trains
  const [altModalOpen, setAltModalOpen] = useState<boolean>(false);
  const [altLoading, setAltLoading] = useState<boolean>(false);
  const [altError, setAltError] = useState<string>('');
  const [altTrains, setAltTrains] = useState<TrainBetweenStations[]>([]);
  const [activeException, setActiveException] = useState<TrainException | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchExceptions();
  }, []);

  const fetchSummary = async () => {
    try {
      const res: any = await getDisruptionsSummary();
      if (res && res.data) {
        setSummary(res.data);
      }
    } catch (err: any) {
      console.warn('Could not fetch disruptions summary:', err);
    }
  };

  const fetchExceptions = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await getDisruptions();
      const list = res?.data || [];
      setExceptions(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load train disruptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindAlternatives = async (exception: TrainException) => {
    setActiveException(exception);
    setAltModalOpen(true);
    setAltLoading(true);
    setAltError('');
    setAltTrains([]);

    const fromStation = exception.sourceStationCode || (exception.stationsAffected && exception.stationsAffected[0]) || '';
    const toStation = exception.destinationStationCode || (exception.stationsAffected && exception.stationsAffected[exception.stationsAffected.length - 1]) || '';

    if (!fromStation || !toStation || fromStation === '-' || toStation === '-') {
      setAltLoading(false);
      setAltError('Origin or destination station is not specified for this disrupted train.');
      return;
    }

    try {
      const res: any = await getTrainsBetween(fromStation, toStation);
      const list = res?.data || [];
      setAltTrains(list);
      if (list.length === 0) {
        setAltError(`No direct alternative trains found between ${fromStation} and ${toStation}.`);
      }
    } catch (err: any) {
      setAltError(err?.message || 'Could not fetch alternative trains at this time.');
    } finally {
      setAltLoading(false);
    }
  };

  // Derive counts dynamically so cards are never blank/dashes
  const cancelledCount = summary?.cancelled != null && summary.cancelled > 0 
    ? summary.cancelled 
    : exceptions.filter(e => {
        const t = `${e.primaryType || ''} ${e.status || ''} ${e.type || ''} ${e.message || ''}`.toUpperCase();
        return t.includes('CANCEL');
      }).length;

  const divertedCount = summary?.diverted != null && summary.diverted > 0 
    ? summary.diverted 
    : exceptions.filter(e => {
        const t = `${e.primaryType || ''} ${e.status || ''} ${e.type || ''} ${e.message || ''}`.toUpperCase();
        return t.includes('DIVERT');
      }).length;

  const rescheduledCount = summary?.rescheduled != null && summary.rescheduled > 0 
    ? summary.rescheduled 
    : exceptions.filter(e => {
        const t = `${e.primaryType || ''} ${e.status || ''} ${e.type || ''} ${e.message || ''}`.toUpperCase();
        return t.includes('RESCHED');
      }).length;

  const totalCount = summary?.total != null && summary.total > 0
    ? summary.total
    : (cancelledCount + divertedCount + rescheduledCount || exceptions.length);

  const filteredExceptions = exceptions.filter((item) => {
    // 1. Tab / Category Filter (handled instantaneously in-memory)
    if (selectedType !== 'ALL') {
      const t = `${item.primaryType || ''} ${item.status || ''} ${item.type || ''} ${item.message || ''}`.toUpperCase();
      if (selectedType === 'CANCELLED' && !t.includes('CANCEL')) return false;
      if (selectedType === 'DIVERTED' && !t.includes('DIVERT')) return false;
      if (selectedType === 'RESCHEDULED' && !t.includes('RESCHED')) return false;
    }

    // 2. Search Query Filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.trainNumber?.toLowerCase().includes(q) ||
      item.trainName?.toLowerCase().includes(q) ||
      item.sourceStationName?.toLowerCase().includes(q) ||
      item.sourceStationCode?.toLowerCase().includes(q) ||
      item.destinationStationName?.toLowerCase().includes(q) ||
      item.destinationStationCode?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const getBadge = (rawType?: string, message?: string) => {
    const t = `${rawType || ''} ${message || ''}`.toUpperCase();
    if (t.includes('CANCEL')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40">
          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>Cancelled</span>
        </span>
      );
    }
    if (t.includes('DIVERT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40">
          <GitFork className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Diverted</span>
        </span>
      );
    }
    if (t.includes('RESCHED')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-950/40">
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Rescheduled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
        <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>{rawType || 'Disrupted'}</span>
      </span>
    );
  };

  const getTrainImageUrl = (name?: string, type?: string) => {
    const text = `${name || ''} ${type || ''}`.toUpperCase();
    if (text.includes('VANDE') || text.includes('VB')) {
      return 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=600&auto=format&fit=crop&q=70';
    }
    if (text.includes('RAJDHANI') || text.includes('SHATABDI') || text.includes('TEJAS')) {
      return 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=70';
    }
    if (text.includes('SUPERFAST') || text.includes('SF') || text.includes('EXPRESS')) {
      return 'https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=600&auto=format&fit=crop&q=70';
    }
    return 'https://images.unsplash.com/photo-1532103054090-a33923a7c527?w=600&auto=format&fit=crop&q=70';
  };

  const renderRunningDaysChips = (runningDays?: string) => {
    const daysMap = [
      { key: 'sun', label: 'Sun' },
      { key: 'mon', label: 'Mon' },
      { key: 'tue', label: 'Tue' },
      { key: 'wed', label: 'Wed' },
      { key: 'thu', label: 'Thu' },
      { key: 'fri', label: 'Fri' },
      { key: 'sat', label: 'Sat' },
    ];
    
    const str = (runningDays || 'Daily').toLowerCase();
    const isDaily = str.includes('daily') || str.includes('all') || str === '1111111' || str === '1,2,3,4,5,6,7';
    
    let activeCount = 7;
    if (!isDaily && runningDays) {
      activeCount = daysMap.filter(d => str.includes(d.key) || str.includes(d.label.toLowerCase())).length;
      if (activeCount === 0) activeCount = 7;
    }

    return (
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Runs {isDaily || activeCount === 7 ? 'Daily' : `${activeCount} days/week`}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold uppercase tracking-wider">
            {activeCount === 7 ? '7 Days / Week' : `${activeCount} Days`}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysMap.map((d, i) => {
            const isActive = isDaily || str.includes(d.key) || str.includes(d.label.toLowerCase()) || activeCount === 7;
            return (
              <span
                key={i}
                className={`py-1 rounded text-center text-[10px] font-bold border transition ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/40 text-slate-600 border-slate-800/60'
                }`}
              >
                {d.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-md shadow-rose-950/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Train Disruptions & Alerts</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Live railway network exceptions, route cancellations, and schedule deviations</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchSummary();
            fetchExceptions();
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/70 border border-slate-800/90 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Disruptions</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {loading ? '...' : totalCount}
          </div>
        </div>
        <div className="bg-slate-900/70 border border-rose-900/30 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-rose-400 uppercase tracking-wider font-bold">Cancelled Trains</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 mt-1">
            {loading ? '...' : cancelledCount}
          </div>
        </div>
        <div className="bg-slate-900/70 border border-amber-900/30 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-amber-400 uppercase tracking-wider font-bold">Diverted Routes</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
            {loading ? '...' : divertedCount}
          </div>
        </div>
        <div className="bg-slate-900/70 border border-sky-900/30 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-sky-400 uppercase tracking-wider font-bold">Rescheduled</div>
          <div className="text-2xl sm:text-3xl font-black text-sky-300 mt-1">
            {loading ? '...' : rescheduledCount}
          </div>
        </div>
      </div>

      {/* Controls & Search Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CANCELLED', label: 'Cancelled' },
            { id: 'DIVERTED', label: 'Diverted' },
            { id: 'RESCHEDULED', label: 'Rescheduled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedType === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search train name, number, or station..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="w-9 h-9 text-rose-500 animate-spin mb-3.5" />
          <p className="text-slate-300 font-semibold text-base">Loading railway disruption telemetry...</p>
          <p className="text-xs text-slate-500 mt-1">Connecting to official RailRadar feeds & local database</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center">
          <AlertTriangle className="w-9 h-9 mx-auto mb-2.5 text-rose-400" />
          <h3 className="font-bold text-lg text-white">Unable to load disruptions</h3>
          <p className="text-xs sm:text-sm text-rose-300/80 mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => {
              fetchSummary();
              fetchExceptions();
            }}
            className="mt-4 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
          >
            Retry Feed
          </button>
        </div>
      ) : filteredExceptions.length === 0 ? (
        <div className="p-14 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No active disruptions found</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No disruptions match your filter "${searchQuery}". Try a different keyword.`
              : 'Trains in this category are operating according to published timetables without reported exceptions.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredExceptions.map((ex, idx) => {
            const rawType = ex.primaryType || ex.status || ex.type || 'CANCELLED';
            const isCancelled = rawType.toUpperCase().includes('CANCEL');
            const isDiverted = rawType.toUpperCase().includes('DIVERT');
            const trainImg = getTrainImageUrl(ex.trainName, ex.trainType);

            const src = ex.sourceStationName || ex.sourceStationCode || 'Source';
            const dst = ex.destinationStationName || ex.destinationStationCode || 'Destination';
            const message = ex.message || ex.description;

            return (
              <div
                key={`${ex.trainNumber}-${idx}`}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-md group"
              >
                <div>
                  {/* Top Train Visual Header & Image Tag */}
                  <div className="relative h-32 w-full overflow-hidden bg-slate-950">
                    <img
                      src={trainImg}
                      alt={ex.trainName || `Train ${ex.trainNumber}`}
                      className="w-full h-full object-cover object-center opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                    {/* Top Tag Badges over Image */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-rose-400 font-black text-xs tracking-wider shadow">
                          #{ex.trainNumber}
                        </span>
                        {ex.trainType && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-bold text-[10px] uppercase tracking-wide">
                            {ex.trainType}
                          </span>
                        )}
                      </div>
                      <div>{getBadge(rawType, ex.message)}</div>
                    </div>

                    {/* Train Name at bottom of Image Banner */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight drop-shadow-md">
                        {ex.trainName || `Train ${ex.trainNumber}`}
                      </h3>
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold">{ex.trainType || 'Indian Railways'}</span>
                        {ex.distance && (
                          <>
                            <span>•</span>
                            <span>{ex.distance} km</span>
                          </>
                        )}
                        {ex.duration && (
                          <>
                            <span>•</span>
                            <span>{Math.floor(ex.duration / 60)}h {ex.duration % 60}m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3.5">
                    {/* Origin to Destination Route Banner */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Origin</div>
                        <div className="font-bold text-slate-200 truncate mt-0.5">
                          {src}
                        </div>
                        {ex.sourceStationCode && ex.sourceStationCode !== '-' && (
                          <div className="text-[10px] text-slate-400 font-mono">{ex.sourceStationCode}</div>
                        )}
                      </div>

                      <div className="px-3 flex flex-col items-center">
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                        <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Direct Route</span>
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Destination</div>
                        <div className="font-bold text-slate-200 truncate mt-0.5">
                          {dst}
                        </div>
                        {ex.destinationStationCode && ex.destinationStationCode !== '-' && (
                          <div className="text-[10px] text-slate-400 font-mono">{ex.destinationStationCode}</div>
                        )}
                      </div>
                    </div>

                    {/* How Many Days It Will Run: 7-Day Scheduler Component */}
                    {renderRunningDaysChips(ex.runningDays)}

                    {/* Disruption Notice / Reason */}
                    {message && (
                      <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 text-xs text-rose-200/90 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-rose-300">Notice: </span>
                          <span>{message}</span>
                        </div>
                      </div>
                    )}

                    {/* Schedule Date & Route Deviations */}
                    <div className="space-y-1 text-xs text-slate-400 pt-1">
                      {ex.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            Effective Date: <span className="text-slate-300 font-semibold">{ex.startDate}</span>
                          </span>
                        </div>
                      )}

                      {ex.alternativeRoute && (
                        <div className="flex items-start gap-2">
                          <GitFork className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            Diverted Via: <span className="text-amber-300 font-medium">{ex.alternativeRoute}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/trains/${ex.trainNumber}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 transition"
                  >
                    <TrainIcon className="w-3.5 h-3.5 text-slate-400" />
                    Live Telemetry & Route
                  </button>

                  {(isCancelled || isDiverted) && (
                    <button
                      onClick={() => handleFindAlternatives(ex)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Find Alternatives
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alternative Trains Modal */}
      {altModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrainIcon className="w-5 h-5 text-rose-400" />
                  Active Alternative Trains
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alternative train services for disrupted train #{activeException?.trainNumber} ({activeException?.trainName})
                </p>
              </div>
              <button
                onClick={() => setAltModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {altLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-7 h-7 text-rose-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Finding active running trains on this corridor...</p>
                </div>
              ) : altError ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">{altError}</p>
                </div>
              ) : altTrains.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No active running trains found for this route.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {altTrains.map((train) => (
                    <div
                      key={train.trainNumber}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {train.trainName || `Train ${train.trainNumber}`}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            #{train.trainNumber}
                          </span>
                          {train.trainType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                              {train.trainType}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <div>
                            Dep: <span className="text-slate-200 font-semibold">{train.departureTime || '—'}</span> ({train.fromStationCode})
                          </div>
                          <div>→</div>
                          <div>
                            Arr: <span className="text-slate-200 font-semibold">{train.arrivalTime || '—'}</span> ({train.toStationCode})
                          </div>
                          {train.durationMinutes && (
                            <div className="text-slate-500">
                              ({Math.floor(train.durationMinutes / 60)}h {train.durationMinutes % 60}m)
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setAltModalOpen(false);
                          navigate(`/trains/${train.trainNumber}`);
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold whitespace-nowrap transition"
                      >
                        Track Train
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setAltModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
