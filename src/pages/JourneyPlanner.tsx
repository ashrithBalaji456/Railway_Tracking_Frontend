import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, ArrowRight, RefreshCw, AlertTriangle, Clock, Calendar, HelpCircle, Train, Navigation, ArrowLeft, TrendingUp, ArrowUpDown, Mail, CheckCircle2, Plus } from 'lucide-react';
import api, { getJourneyOverlay, emailJourneyItinerary } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';
import { searchHistoryService } from '../services/searchHistoryService';

export default function JourneyPlanner() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const [destQuery, setDestQuery] = useState('');
  const [destList, setDestList] = useState<any[]>([]);
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const [intermediateCities, setIntermediateCities] = useState<string[]>([]);
  const [transferFilter, setTransferFilter] = useState<'ALL' | 'DIRECT'>('ALL');
  const [preferredTime, setPreferredTime] = useState<'ANY' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'>('ANY');
  const [includeNearby, setIncludeNearby] = useState(true);

  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [travelDate, setTravelDate] = useState('');

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<Record<string, number>>({});
  const [loadingOverlay, setLoadingOverlay] = useState(false);

  // Email Itinerary Modal State
  const [emailModalJourney, setEmailModalJourney] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleOpenEmailModal = (journey: any) => {
    const savedEmail = localStorage.getItem('email') || '';
    setEmailInput(savedEmail);
    setEmailStatus(null);
    setEmailModalJourney(journey);
  };

  const handleSendItineraryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailModalJourney) return;

    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const response: any = await emailJourneyItinerary({
        recipientEmail: emailInput.trim(),
        recipientName: localStorage.getItem('username') || undefined,
        travelDate: travelDate || undefined,
        journey: emailModalJourney,
      });

      if (response.success || response.status === 200) {
        setEmailStatus({
          type: 'success',
          message: `Itinerary sent to ${emailInput.trim()} via Brevo!`,
        });
        setTimeout(() => {
          setEmailModalJourney(null);
          setEmailStatus(null);
        }, 2200);
      } else {
        setEmailStatus({
          type: 'error',
          message: response.message || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setEmailStatus({
        type: 'error',
        message: err.message || 'Failed to dispatch email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Auto-load journey search when coming from Home page "Trains Between Stations" card
  useEffect(() => {
    const src = searchParams.get('source');
    const dst = searchParams.get('destination');
    const dt = searchParams.get('date');
    const nb = searchParams.get('nearby');

    if (nb !== null) setIncludeNearby(nb === 'true');
    if (dt) setTravelDate(dt);

    if (src && dst) {
      (async () => {
        setLoading(true);
        setError('');
        try {
          const [sRes, dRes]: any = await Promise.all([
            api.get(`/api/v1/stations?query=${src}`),
            api.get(`/api/v1/stations?query=${dst}`)
          ]);

          const sMatch = sRes?.data?.find((s: any) => s.stationCode.toUpperCase() === src.toUpperCase()) || sRes?.data?.[0] || { stationCode: src.toUpperCase(), stationName: src.toUpperCase() };
          const dMatch = dRes?.data?.find((s: any) => s.stationCode.toUpperCase() === dst.toUpperCase()) || dRes?.data?.[0] || { stationCode: dst.toUpperCase(), stationName: dst.toUpperCase() };

          setSelectedSource(sMatch);
          setSourceQuery(`${sMatch.stationName} (${sMatch.stationCode})`);
          setSelectedDest(dMatch);
          setDestQuery(`${dMatch.stationName} (${dMatch.stationCode})`);

          const dateParam = dt ? `&date=${dt}` : '';
          const planRes: any = await api.get(`/api/v1/journey/plan?source=${src}&destination=${dst}${dateParam}`);
          if (planRes.success && planRes.data) {
            setJourneys(planRes.data);
            setSearched(true);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to search trains between stations.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [searchParams]);

  // Debounced Autocomplete for Source Station
  useEffect(() => {
    if (sourceQuery.trim().length < 2) {
      setSourceList([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${sourceQuery}`);
        if (response.success && response.data) {
          setSourceList(response.data);
        }
      } catch (err) {
        console.error('Error searching source stations', err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [sourceQuery]);

  // Debounced Autocomplete for Destination Station
  useEffect(() => {
    if (destQuery.trim().length < 2) {
      setDestList([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${destQuery}`);
        if (response.success && response.data) {
          setDestList(response.data);
        }
      } catch (err) {
        console.error('Error searching dest stations', err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [destQuery]);

  const handlePlanJourney = async () => {
    if (!selectedSource || !selectedDest) {
      setError('Please select both origin and destination stations.');
      return;
    }

    // Record both stations to search history
    searchHistoryService.addSearch({
      type: 'STATION',
      code: selectedSource.stationCode,
      title: selectedSource.stationName,
      subtitle: [selectedSource.district, selectedSource.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
    });
    searchHistoryService.addSearch({
      type: 'STATION',
      code: selectedDest.stationCode,
      title: selectedDest.stationName,
      subtitle: [selectedDest.district, selectedDest.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
    });

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const dateParam = travelDate ? `&date=${travelDate}` : '';
      const response: any = await api.get(
        `/api/v1/journey/plan?source=${selectedSource.stationCode}&destination=${selectedDest.stationCode}${dateParam}`
      );
      if (response.success && response.data) {
        setJourneys(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to solve journey routes.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  const formatDuration = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs} hrs ${m} mins` : `${m} mins`;
  };

  const swapStations = () => {
    const tempSource = selectedSource;
    const tempQuery = sourceQuery;

    setSelectedSource(selectedDest);
    setSourceQuery(destQuery);

    setSelectedDest(tempSource);
    setDestQuery(tempQuery);
  };

  const toggleDelayOverlay = async () => {
    if (showOverlay) {
      setShowOverlay(false);
      return;
    }
    setShowOverlay(true);
    if (Object.keys(overlayData).length > 0) return;

    setLoadingOverlay(true);
    try {
      const trainNumbers: string[] = [];
      journeys.forEach((j) => {
        if (j.firstTrainNumber) trainNumbers.push(j.firstTrainNumber);
        if (j.secondTrainNumber) trainNumbers.push(j.secondTrainNumber);
      });
      const unique = Array.from(new Set(trainNumbers));
      const res: any = await getJourneyOverlay({ trains: unique, date: travelDate });
      const delaysMap: Record<string, number> = {};
      if (res?.data?.delays) {
        res.data.delays.forEach((d: any) => {
          if (d.train) {
            delaysMap[d.train] = d.arrivalDelayMinutes != null ? d.arrivalDelayMinutes : (d.departureDelayMinutes || 0);
          }
        });
      }
      setOverlayData(delaysMap);
    } catch (e) {
      console.warn('Could not fetch journey delay overlay:', e);
    } finally {
      setLoadingOverlay(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-12 space-y-4 sm:space-y-6 relative">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back to previous page button */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors text-xs sm:text-sm font-semibold cursor-pointer bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400" />
          <span>Multi-City Trip Planner</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="flex items-center space-x-3 sm:space-x-4 border-b border-white/10 pb-4 sm:pb-6 relative z-10">
        <div className="p-2.5 sm:p-4 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl text-indigo-400 shadow-lg shadow-indigo-950/20 transition-all duration-300 hover:scale-105 shrink-0">
          <Calendar className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-100 to-indigo-300 tracking-tight leading-none">
            Multi-City Journey Planner
          </h1>
          <p className="text-xs text-slate-400 mt-1 sm:mt-2 font-medium tracking-wide">
            Plan seamless direct and alternative connecting train routes across Indian Railways stations.
          </p>
        </div>
      </div>

      {/* Query Form Box - Styled matching RailRadar Multi-City Planner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 space-y-5 sm:space-y-6 relative overflow-hidden transition-all duration-300 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
        <div className="text-base sm:text-lg font-bold text-slate-200 pb-2 border-b border-slate-800">
          Multi-City Journey Planner
        </div>

        {/* 1. Origin Station Block (Top) */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
              <span>Starting Station (Origin)</span>
            </label>
            {selectedSource && (
              <span className="text-[10px] font-bold text-emerald-400 font-mono bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                {selectedSource.stationCode}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-400 pointer-events-none">
              <MapPin className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={selectedSource ? `${translateName(selectedSource.stationName, language)} (${selectedSource.stationCode})` : sourceQuery}
              onChange={(e) => {
                setSourceQuery(e.target.value);
                setSelectedSource(null);
              }}
              onFocus={() => {
                if (selectedSource) {
                  setSourceQuery('');
                  setSelectedSource(null);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl w-full pl-10 pr-14 py-3 sm:py-3.5 text-slate-200 outline-none text-xs sm:text-sm font-semibold placeholder-slate-500 focus:border-indigo-500 transition shadow-inner"
              placeholder="Search origin (e.g. CSMT, UJN)..."
            />
            {selectedSource && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSource(null);
                  setSourceQuery('');
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-indigo-400 hover:text-indigo-300 text-[10px] font-bold tracking-wider uppercase"
              >
                Clear
              </button>
            )}
          </div>

          {/* Source Autocomplete Dropdown */}
          {sourceList.length > 0 && !selectedSource && (
            <div className="absolute left-0 right-0 mt-2 bg-[#1c212e] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-30 backdrop-blur-xl divide-y divide-white/5 animate-fade-in">
              {sourceList.map((s) => (
                <button
                  key={s.stationCode}
                  type="button"
                  onClick={() => {
                    setSelectedSource(s);
                    setSourceQuery(`${translateName(s.stationName, language)} (${s.stationCode})`);
                    setSourceList([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:text-sky-300 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-500/35 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase shrink-0 min-w-[54px] text-center font-mono">{s.stationCode}</span>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-slate-100 font-semibold text-xs truncate">{translateName(s.stationName, language)}</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {[s.district, s.state].filter(Boolean).filter((x: string) => x !== '-').join(', ')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Departure Date & Preferred Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Departure Date
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl w-full px-3 py-2.5 text-slate-200 outline-none text-xs font-semibold cursor-pointer [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Preferred Time
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl w-full px-3 py-2.5 text-slate-200 outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="ANY">Any time</option>
                <option value="MORNING">Morning (06:00 - 12:00)</option>
                <option value="AFTERNOON">Afternoon (12:00 - 18:00)</option>
                <option value="EVENING">Evening (18:00 - 24:00)</option>
                <option value="NIGHT">Night (00:00 - 06:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Swap Stations Button */}
        <div className="relative flex items-center justify-center my-1 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <button
            type="button"
            onClick={swapStations}
            className="relative z-10 px-4 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-indigo-500/50 rounded-full text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95 group cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
            <span>Swap Stations</span>
          </button>
        </div>

        {/* 2. Destination Station Block */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
              <span>Final Destination</span>
            </label>
            {selectedDest && (
              <span className="text-[10px] font-bold text-rose-400 font-mono bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
                {selectedDest.stationCode}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-rose-400 pointer-events-none">
              <MapPin className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={selectedDest ? `${translateName(selectedDest.stationName, language)} (${selectedDest.stationCode})` : destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value);
                setSelectedDest(null);
              }}
              onFocus={() => {
                if (selectedDest) {
                  setDestQuery('');
                  setSelectedDest(null);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl w-full pl-10 pr-14 py-3 sm:py-3.5 text-slate-200 outline-none text-xs sm:text-sm font-semibold placeholder-slate-500 focus:border-indigo-500 transition shadow-inner"
              placeholder="Search destination (e.g. GHY, NDLS)..."
            />
            {selectedDest && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDest(null);
                  setDestQuery('');
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-indigo-400 hover:text-indigo-300 text-[10px] font-bold tracking-wider uppercase"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dest Autocomplete Dropdown */}
          {destList.length > 0 && !selectedDest && (
            <div className="absolute left-0 right-0 mt-2 bg-[#1c212e] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-30 backdrop-blur-xl divide-y divide-white/5 animate-fade-in">
              {destList.map((d) => (
                <button
                  key={d.stationCode}
                  type="button"
                  onClick={() => {
                    setSelectedDest(d);
                    setDestQuery(`${translateName(d.stationName, language)} (${d.stationCode})`);
                    setDestList([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:text-sky-300 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-500/35 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase shrink-0 min-w-[54px] text-center font-mono">{d.stationCode}</span>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-slate-100 font-semibold text-xs truncate">{translateName(d.stationName, language)}</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {[d.district, d.state].filter(Boolean).filter((x: string) => x !== '-').join(', ')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Intermediate City Rows */}
        {intermediateCities.map((city, idx) => (
          <div key={idx} className="space-y-1 relative z-10">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[11px] font-black flex items-center justify-center">via</span>
                <span>Via City / Junction #{idx + 1}</span>
              </span>
              <button
                type="button"
                onClick={() => setIntermediateCities(prev => prev.filter((_, i) => i !== idx))}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                const val = e.target.value;
                setIntermediateCities(prev => prev.map((c, i) => i === idx ? val : c));
              }}
              placeholder="Intermediate Junction (e.g. BZA, ET, NGP)..."
              className="bg-slate-950 border border-slate-800 rounded-xl w-full px-3.5 py-2.5 text-slate-200 outline-none text-xs sm:text-sm font-semibold placeholder-slate-500 focus:border-indigo-500 transition"
            />
          </div>
        ))}

        {/* + Add Another City Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIntermediateCities(prev => [...prev, ''])}
            className="w-full border border-dashed border-slate-700 hover:border-blue-500 py-2.5 rounded-xl text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another City</span>
          </button>
        </div>

        {/* Transfers & Nearby Controls */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Transfers</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setTransferFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  transferFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Connections
              </button>
              <button
                type="button"
                onClick={() => setTransferFilter('DIRECT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  transferFilter === 'DIRECT'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Direct Only
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeNearby}
              onChange={(e) => setIncludeNearby(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-medium">Include nearby city stations</span>
          </label>
        </div>

        {/* Search Multi-City Trains Button */}
        <div className="pt-2 z-10 relative">
          <button
            onClick={handlePlanJourney}
            disabled={!selectedSource || !selectedDest || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-900 disabled:text-slate-500 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Searching Multi-City Routes...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-white" />
                <span>Search Multi-City Trains</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-xl flex items-center space-x-3 text-red-400 text-xs font-medium animate-fade-in">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="text-center py-24 text-slate-400 animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 animate-spin" />
          </div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-450">Calculating optimal paths...</p>
        </div>
      )}

      {/* Results Dashboard */}
      {!loading && searched && (() => {
        const filteredJourneys = journeys.filter((j) => {
          if (transferFilter === 'DIRECT' && !j.direct) return false;
          if (preferredTime !== 'ANY') {
            const timeStr = j.originDepartureTime || '';
            const hour = parseInt(timeStr.split(':')[0], 10);
            if (!isNaN(hour)) {
              if (preferredTime === 'MORNING' && (hour < 6 || hour >= 12)) return false;
              if (preferredTime === 'AFTERNOON' && (hour < 12 || hour >= 18)) return false;
              if (preferredTime === 'EVENING' && (hour < 18 || hour >= 24)) return false;
              if (preferredTime === 'NIGHT' && hour >= 6) return false;
            }
          }
          return true;
        });

        return (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="border-b border-white/5 pb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-200 flex items-center space-x-2.5">
                <Clock className="h-5.5 w-5.5 text-indigo-400" />
                <span>{t('availableJourneys')} ({filteredJourneys.length})</span>
              </h2>

              {journeys.length > 0 && (
                <button
                  onClick={toggleDelayOverlay}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    showOverlay
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showOverlay ? 'Hide Delay Overlay' : 'Overlay Delay Stats'}</span>
                  {loadingOverlay && <RefreshCw className="w-3 h-3 animate-spin" />}
                </button>
              )}
            </div>

            {filteredJourneys.length > 0 ? (
              <div className="space-y-4">
                {filteredJourneys.map((j, idx) => (
                <div
                  key={idx}
                  className="glass-panel rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group relative animate-fade-in"
                  style={{ animationDelay: `${idx * 75}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Left block: Timeline Route Graphic */}
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-450 pb-2.5 border-b border-white/5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${j.direct ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {j.direct ? t('directTrain') : t('connectingTrain')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEmailModal(j)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm hover:border-indigo-400/40"
                          title="Email this itinerary to yourself or family via Brevo"
                        >
                          <Mail className="h-3 w-3" />
                          <span>Email Itinerary</span>
                        </button>
                        <span className="text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md font-extrabold">{formatDuration(j.totalDurationMinutes)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
                      {/* First Leg Train */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                            <Train className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-indigo-400 text-xs tracking-wider block">{j.firstTrainNumber}</span>
                              {showOverlay && overlayData[j.firstTrainNumber] !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  overlayData[j.firstTrainNumber] > 15
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  ~{overlayData[j.firstTrainNumber]}m delay
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-200 text-[11px] leading-tight mt-0.5">{translateName(j.firstTrainName, language)}</h4>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-3.5">
                          <Link
                            to={`/trains/${j.firstTrainNumber}?date=${travelDate}`}
                            className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all duration-200 shadow-md shadow-indigo-500/5 hover:-translate-y-0.5"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>Timetable</span>
                          </Link>
                          <Link
                            to={`/map?train=${j.firstTrainNumber}`}
                            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-350 hover:text-emerald-250 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all duration-200 shadow-md shadow-emerald-500/5 hover:-translate-y-0.5"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            <span>Live Tracker</span>
                          </Link>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-slate-400 bg-slate-950/30 px-3.5 py-2.5 rounded-xl border border-white/5">
                          <div>
                            <span className="font-extrabold text-slate-100 text-[13px]">{formatTime(j.originDepartureTime)}</span>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{j.originStationCode}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-indigo-500/50" />
                          <div>
                            <span className="font-extrabold text-slate-100 text-[13px]">
                              {j.direct ? formatTime(j.destinationArrivalTime) : formatTime(j.transferArrivalTime)}
                            </span>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                              {j.direct ? j.destinationStationCode : j.transferStationCode}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Connection Details (Layovers warning) */}
                      {!j.direct && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-3 px-4 py-2 border border-white/5 bg-white/2 rounded-xl backdrop-blur-md">
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('transferAt')}</p>
                            <p className="font-extrabold text-slate-200 text-xs mt-0.5">{translateName(j.transferStationName, language)} ({j.transferStationCode})</p>
                            <p className="text-[10px] text-indigo-400 font-medium tracking-wide mt-1">{t('layover')}: {formatDuration(j.layoverMinutes)}</p>
                          </div>
                          
                          {/* Warning banners */}
                          {j.layoverWarning === 'TIGHT_CONNECTION' && (
                            <div className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] rounded-full font-black uppercase tracking-wider animate-pulse">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
                              <span>{t('tightConnection')}</span>
                            </div>
                          )}
                          {j.layoverWarning === 'LONG_LAYOVER' && (
                            <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900/60 border border-white/10 text-slate-400 text-[9px] rounded-full font-black uppercase tracking-wider">
                              <Clock className="h-3 w-3 shrink-0 text-amber-500" />
                              <span>{t('longLayover')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Second Leg Train (if connecting) */}
                      {!j.direct && (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                              <Train className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-indigo-400 text-xs tracking-wider block">{j.secondTrainNumber}</span>
                                {showOverlay && overlayData[j.secondTrainNumber] !== undefined && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    overlayData[j.secondTrainNumber] > 15
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    ~{overlayData[j.secondTrainNumber]}m delay
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-200 text-[11px] leading-tight mt-0.5">{translateName(j.secondTrainName, language)}</h4>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 mt-3.5">
                            <Link
                              to={`/trains/${j.secondTrainNumber}?date=${travelDate}`}
                              className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all duration-200 shadow-md shadow-indigo-500/5 hover:-translate-y-0.5"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>Timetable</span>
                            </Link>
                            <Link
                              to={`/map?train=${j.secondTrainNumber}`}
                              className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-350 hover:text-emerald-250 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition-all duration-200 shadow-md shadow-emerald-500/5 hover:-translate-y-0.5"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              <span>Live Tracker</span>
                            </Link>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 bg-slate-950/30 px-3.5 py-2.5 rounded-xl border border-white/5">
                            <div>
                              <span className="font-extrabold text-slate-100 text-[13px]">{formatTime(j.transferDepartureTime)}</span>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{j.transferStationCode}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-indigo-500/50" />
                            <div>
                              <span className="font-extrabold text-slate-100 text-[13px]">{formatTime(j.destinationArrivalTime)}</span>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{j.destinationStationCode}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 glass-panel rounded-2xl text-slate-400 space-y-4 animate-fade-in">
              <HelpCircle className="h-10 w-10 mx-auto opacity-30 text-indigo-455" />
              <div className="space-y-1">
                <p className="font-extrabold text-slate-200 text-sm tracking-wide">{t('noJourneysFound')}</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">{t('noJourneysFoundDesc')}</p>
              </div>
            </div>
          )}
        </div>
      );
    })()}

      {/* Email Itinerary Modal */}
      {emailModalJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Travel Itinerary</span>
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {emailModalJourney.originStationCode} ➔ {emailModalJourney.destinationStationCode}
                </h3>
              </div>
              <button
                onClick={() => setEmailModalJourney(null)}
                className="text-slate-500 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              We will send a formatted travel memo with departure/arrival timings, transfer halts, and a live tracking link via Brevo.
            </p>

            {emailStatus && (
              <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                emailStatus.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
              }`}>
                {emailStatus.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                <span>{emailStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSendItineraryEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. passenger@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalJourney(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      <span>Send Memo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
