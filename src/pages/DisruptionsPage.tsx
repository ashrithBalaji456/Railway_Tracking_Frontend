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
  Filter
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
  }, []);

  useEffect(() => {
    fetchExceptions(selectedType);
  }, [selectedType]);

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

  const fetchExceptions = async (type: string) => {
    setLoading(true);
    setError('');
    try {
      const res: any = await getDisruptions(type);
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

    const stations = exception.stationsAffected || [];
    const fromStation = stations.length > 0 ? stations[0] : '';
    const toStation = stations.length > 1 ? stations[stations.length - 1] : '';

    if (!fromStation || !toStation) {
      setAltLoading(false);
      setAltError('Station endpoints are not available for this disruption to query alternatives.');
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

  const filteredExceptions = exceptions.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.trainNumber?.toLowerCase().includes(q) ||
      item.trainName?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      (item.stationsAffected && item.stationsAffected.some(s => s.toLowerCase().includes(q)))
    );
  });

  const getBadge = (type: string) => {
    const t = type?.toUpperCase();
    if (t?.includes('CANCEL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <XCircle className="w-3.5 h-3.5 text-rose-400" /> Cancelled
        </span>
      );
    }
    if (t?.includes('DIVERT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <GitFork className="w-3.5 h-3.5 text-amber-400" /> Diverted
        </span>
      );
    }
    if (t?.includes('RESCHED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
          <Clock className="w-3.5 h-3.5 text-sky-400" /> Rescheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
        <AlertTriangle className="w-3.5 h-3.5 text-purple-400" /> {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Train Disruptions & Alerts</h1>
              <p className="text-sm text-slate-400">Live railway cancellations, diversions, and schedule exceptions</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchSummary();
            fetchExceptions(selectedType);
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Disruptions</div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary ? summary.total : (loading ? '...' : exceptions.length)}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-rose-900/30 p-4 rounded-xl">
          <div className="text-xs text-rose-400 uppercase tracking-wider font-semibold">Cancelled Trains</div>
          <div className="text-2xl font-bold text-rose-300 mt-1">
            {summary?.cancelled ?? '—'}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-amber-900/30 p-4 rounded-xl">
          <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Diverted Routes</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            {summary?.diverted ?? '—'}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-sky-900/30 p-4 rounded-xl">
          <div className="text-xs text-sky-400 uppercase tracking-wider font-semibold">Rescheduled</div>
          <div className="text-2xl font-bold text-sky-300 mt-1">
            {summary?.rescheduled ?? '—'}
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Filter Tabs */}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedType === tab.id
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Filter Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by train name or number..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-3" />
          <p className="text-slate-400 font-medium">Loading railway disruption reports...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <h3 className="font-semibold text-lg">Unable to load disruptions</h3>
          <p className="text-sm text-rose-300/80 mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchExceptions(selectedType)}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition"
          >
            Retry
          </button>
        </div>
      ) : filteredExceptions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No active disruptions found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No disruptions match your filter "${searchQuery}". Try a different keyword.`
              : 'Trains in this category appear to be running according to regular schedules without reported exceptions.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExceptions.map((ex, idx) => {
            const isCancelled = ex.type?.toUpperCase().includes('CANCEL');
            const isDiverted = ex.type?.toUpperCase().includes('DIVERT');

            return (
              <div
                key={`${ex.trainNumber}-${idx}`}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-rose-400 border border-slate-700 text-sm">
                        {ex.trainNumber}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">
                          {ex.trainName || `Train ${ex.trainNumber}`}
                        </h3>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Train #{ex.trainNumber}
                        </div>
                      </div>
                    </div>
                    <div>{getBadge(ex.type)}</div>
                  </div>

                  {/* Disruption Description */}
                  {ex.description && (
                    <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-xs text-slate-300 mb-3">
                      <p className="font-medium">{ex.description}</p>
                    </div>
                  )}

                  {/* Route & Dates Details */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    {(ex.startDate || ex.endDate) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {ex.startDate ? `From: ${ex.startDate}` : ''}
                          {ex.endDate ? ` to ${ex.endDate}` : ''}
                        </span>
                      </div>
                    )}

                    {ex.stationsAffected && ex.stationsAffected.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>
                          Affected Stations: <span className="text-slate-300">{ex.stationsAffected.join(', ')}</span>
                        </span>
                      </div>
                    )}

                    {ex.alternativeRoute && (
                      <div className="flex items-start gap-2">
                        <GitFork className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          Diversion: <span className="text-amber-300">{ex.alternativeRoute}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => navigate(`/trains/${ex.trainNumber}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    <TrainIcon className="w-3.5 h-3.5 text-slate-400" />
                    Live Details
                  </button>

                  {(isCancelled || isDiverted) && (
                    <button
                      onClick={() => handleFindAlternatives(ex)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrainIcon className="w-5 h-5 text-rose-400" />
                  Active Alternative Trains
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alternative options for disrupted train #{activeException?.trainNumber} ({activeException?.trainName})
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
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            #{train.trainNumber}
                          </span>
                          {train.trainType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                              {train.trainType}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <div>
                            Dep: <span className="text-slate-200 font-medium">{train.departureTime || '—'}</span> ({train.fromStationCode})
                          </div>
                          <div>→</div>
                          <div>
                            Arr: <span className="text-slate-200 font-medium">{train.arrivalTime || '—'}</span> ({train.toStationCode})
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
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
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
