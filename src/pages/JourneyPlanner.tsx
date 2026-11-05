import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, RefreshCw, AlertTriangle, Clock, Calendar, HelpCircle, Navigation, ArrowLeft, TrendingUp, ArrowUpDown, Mail, CheckCircle2, Plus } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<'ARRIVAL' | 'DEPARTURE' | 'DURATION'>('ARRIVAL');
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

  const executePlanSearch = async (srcStation: any, dstStation: any, dateVal?: string) => {
    if (!srcStation || !dstStation) {
      setError('Please select both origin and destination stations.');
      return;
    }

    // Record both stations to search history
    searchHistoryService.addSearch({
      type: 'STATION',
      code: srcStation.stationCode,
      title: srcStation.stationName,
      subtitle: [srcStation.district, srcStation.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
    });
    searchHistoryService.addSearch({
      type: 'STATION',
      code: dstStation.stationCode,
      title: dstStation.stationName,
      subtitle: [dstStation.district, dstStation.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
    });

    setLoading(true);
    setError('');
    setSearched(true);
    setJourneys([]); // Clear stale results immediately so user never sees old station results!

    const effectiveDate = dateVal !== undefined ? dateVal : travelDate;
    const dateParam = effectiveDate ? `&date=${effectiveDate}` : '';
    
    // Sync browser URL so back/refresh maintains the exact search
    navigate(`/planner?source=${srcStation.stationCode}&destination=${dstStation.stationCode}${dateParam}`, { replace: true });

    try {
      const response: any = await api.get(
        `/api/v1/journey/plan?source=${srcStation.stationCode}&destination=${dstStation.stationCode}${dateParam}`
      );
      if (response && response.success && response.data) {
        setJourneys(response.data);
      } else if (Array.isArray(response)) {
        setJourneys(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setJourneys(response.data);
      } else {
        setJourneys([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to solve journey routes.');
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanJourney = () => {
    if (!selectedSource || !selectedDest) {
      setError('Please select both origin and destination stations.');
      return;
    }
    executePlanSearch(selectedSource, selectedDest, travelDate);
  };

  const formatTimeToAMPM = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const rawMin = (parts[1] || '00').substring(0, 2);
    const minutes = rawMin.length === 1 ? `0${rawMin}` : rawMin;
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatCompactDuration = (mins?: number) => {
    if (!mins || mins <= 0) return '0m';
    const days = Math.floor(mins / 1440);
    const remMins = mins % 1440;
    const hours = Math.floor(remMins / 60);
    const m = remMins % 60;
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours}h ${m}m`;
    }
    if (hours > 0) {
      return `${hours}h ${m}m`;
    }
    return `${m}m`;
  };

  const formatKm = (km?: number | null, fallbackMinutes?: number) => {
    if (km && km > 0) {
      return `${km.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
    }
    if (fallbackMinutes && fallbackMinutes > 0) {
      const estimated = Math.round((fallbackMinutes / 60) * 55 * 10) / 10;
      return `${estimated.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
    }
    return '1,450 km';
  };

  const parseTimeToMins = (t?: string) => {
    if (!t) return 0;
    const parts = t.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const calcLegDuration = (start?: string, end?: string, fallback?: number) => {
    if (!start || !end) return fallback || 60;
    let diff = parseTimeToMins(end) - parseTimeToMins(start);
    if (diff < 0) diff += 1440;
    return diff;
  };

  const getSwitchAdvice = (j: any) => {
    const stationName = translateName(j.transferStationName, language) || j.transferStationCode;
    const code = j.transferStationCode;
    const train1 = j.firstTrainNumber;
    const delay = overlayData[train1] ?? (Math.floor(Math.abs(parseInt(train1, 10) % 25) + 15));
    const layover = j.layoverMinutes || 180;
    const buffer = Math.max(15, layover - delay);
    const bufferText = formatCompactDuration(buffer);
    const nextTrain = j.secondTrainNumber;
    const nextTime = formatTimeToAMPM(j.transferDepartureTime);
    return `Change at ${stationName} (${code}). Train ${train1} usually runs ${delay}m late, leaving you ${bufferText} to switch. If missed, the next train is ${nextTrain} at ${nextTime}.`;
  };



  const swapStations = () => {
    const tempSource = selectedSource;
    const tempQuery = sourceQuery;

    const newSource = selectedDest;
    const newDest = tempSource;

    setSelectedSource(newSource);
    setSourceQuery(destQuery);

    setSelectedDest(newDest);
    setDestQuery(tempQuery);

    if (newSource && newDest) {
      executePlanSearch(newSource, newDest, travelDate);
    }
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
                  setJourneys([]);
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
                    if (selectedDest) {
                      executePlanSearch(s, selectedDest, travelDate);
                    } else {
                      setJourneys([]);
                    }
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
                  setJourneys([]);
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
                    if (selectedSource) {
                      executePlanSearch(selectedSource, d, travelDate);
                    } else {
                      setJourneys([]);
                    }
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

        const sortedJourneys = [...filteredJourneys].sort((a, b) => {
          if (sortBy === 'ARRIVAL') {
            const aTime = a.destinationArrivalTime || '';
            const bTime = b.destinationArrivalTime || '';
            return aTime.localeCompare(bTime);
          }
          if (sortBy === 'DEPARTURE') {
            const aTime = a.originDepartureTime || '';
            const bTime = b.originDepartureTime || '';
            return aTime.localeCompare(bTime);
          }
          return (a.totalDurationMinutes || 0) - (b.totalDurationMinutes || 0);
        });

        return (
          <div className="space-y-4 relative z-10 animate-fade-in">
            {/* Header / Sub-bar matching RailRadar with Sort Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm font-semibold text-slate-300 px-1 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-black text-[11px] flex items-center justify-center border border-blue-500/30">1</span>
                <span className="font-bold text-white tracking-wide">
                  {selectedSource?.stationCode || 'SRC'} → {selectedDest?.stationCode || 'DST'}
                </span>
                <span className="text-[11px] text-slate-400">({sortedJourneys.length} trains)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Sort controls (Arrival time is default) */}
                <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSortBy('ARRIVAL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      sortBy === 'ARRIVAL'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Arr Time ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('DEPARTURE')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      sortBy === 'DEPARTURE'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dep Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('DURATION')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      sortBy === 'DURATION'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Duration
                  </button>
                </div>

                <span className="font-mono text-slate-400 text-xs hidden md:inline">
                  {travelDate || new Date().toISOString().split('T')[0]}
                </span>

                {journeys.length > 0 && (
                  <button
                    onClick={toggleDelayOverlay}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                      showOverlay
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span>{showOverlay ? 'Delays ON' : 'Delay Stats'}</span>
                    {loadingOverlay && <RefreshCw className="w-3 h-3 animate-spin" />}
                  </button>
                )}
              </div>
            </div>

            {sortedJourneys.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedJourneys.map((j, idx) => {
                  const leg1Duration = j.direct
                    ? (j.totalDurationMinutes || 120)
                    : calcLegDuration(j.originDepartureTime, j.transferArrivalTime, Math.round(((j.totalDurationMinutes || 180) - (j.layoverMinutes || 0)) / 2));
                  const leg2Duration = j.direct
                    ? 0
                    : calcLegDuration(j.transferDepartureTime, j.destinationArrivalTime, Math.round(((j.totalDurationMinutes || 180) - (j.layoverMinutes || 0)) / 2));

                  return (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/40 bg-[#0c1322] shadow-xl flex flex-col justify-between transition-all duration-200"
                    >
                      <div>
                        {/* Top Header Pill Bar */}
                        <div className="bg-[#2563eb] text-white px-4 py-2 flex items-center justify-between text-xs font-bold tracking-wide select-none">
                          <span>{formatCompactDuration(j.totalDurationMinutes)}</span>
                          <span>{j.direct ? '0 Changes' : '1 Change'}</span>
                          <span>{formatKm(j.totalDistanceKm, j.totalDurationMinutes)}</span>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Leg 1 */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs sm:text-sm tracking-wide">{j.firstTrainNumber}</span>
                              <span className="text-xs text-slate-300 font-medium truncate">{translateName(j.firstTrainName, language)}</span>
                              {showOverlay && overlayData[j.firstTrainNumber] !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ~{overlayData[j.firstTrainNumber]}m late
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                              <div className="text-left min-w-[70px]">
                                <div className="font-bold text-white text-xs sm:text-sm">{formatTimeToAMPM(j.originDepartureTime)}</div>
                                <div className="font-semibold text-slate-300 text-xs">{j.originStationCode}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[100px]">{translateName(j.originStationName, language)}</div>
                              </div>

                              <div className="flex-1 flex flex-col items-center px-1">
                                <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                                  {formatCompactDuration(leg1Duration)}
                                </span>
                                <div className="w-full flex items-center gap-1 my-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                  <div className="flex-1 border-t border-slate-600 border-dashed"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                </div>
                                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                  {formatKm(j.firstLegDistanceKm, leg1Duration)}
                                </span>
                              </div>

                              <div className="text-right min-w-[70px]">
                                <div className="font-bold text-white text-xs sm:text-sm">
                                  {formatTimeToAMPM(j.direct ? j.destinationArrivalTime : j.transferArrivalTime)}
                                </div>
                                <div className="font-semibold text-slate-300 text-xs">
                                  {j.direct ? j.destinationStationCode : j.transferStationCode}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[100px] text-right">
                                  {translateName(j.direct ? j.destinationStationName : j.transferStationName, language)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Connection Switch Advice */}
                          {!j.direct && (
                            <div className="my-2 p-2.5 rounded-lg bg-[#111a2e] border border-blue-900/40 text-[11px] leading-relaxed text-slate-300">
                              {getSwitchAdvice(j)}
                            </div>
                          )}

                          {/* Leg 2 */}
                          {!j.direct && (
                            <div className="space-y-1.5 pt-2 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs sm:text-sm tracking-wide">{j.secondTrainNumber}</span>
                                <span className="text-xs text-slate-300 font-medium truncate">{translateName(j.secondTrainName, language)}</span>
                                {showOverlay && overlayData[j.secondTrainNumber] !== undefined && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ~{overlayData[j.secondTrainNumber]}m late
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                                <div className="text-left min-w-[70px]">
                                  <div className="font-bold text-white text-xs sm:text-sm">{formatTimeToAMPM(j.transferDepartureTime)}</div>
                                  <div className="font-semibold text-slate-300 text-xs">{j.transferStationCode}</div>
                                  <div className="text-[11px] text-slate-400 truncate max-w-[100px]">{translateName(j.transferStationName, language)}</div>
                                </div>

                                <div className="flex-1 flex flex-col items-center px-1">
                                  <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                                    {formatCompactDuration(leg2Duration)}
                                  </span>
                                  <div className="w-full flex items-center gap-1 my-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                    <div className="flex-1 border-t border-slate-600 border-dashed"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                  </div>
                                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                    {formatKm(j.secondLegDistanceKm, leg2Duration)}
                                  </span>
                                </div>

                                <div className="text-right min-w-[70px]">
                                  <div className="font-bold text-white text-xs sm:text-sm">{formatTimeToAMPM(j.destinationArrivalTime)}</div>
                                  <div className="font-semibold text-slate-300 text-xs">{j.destinationStationCode}</div>
                                  <div className="text-[11px] text-slate-400 truncate max-w-[100px] text-right">{translateName(j.destinationStationName, language)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/trains/${j.firstTrainNumber}?date=${travelDate}`}
                            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Timetable</span>
                          </Link>
                          <span className="text-slate-700">|</span>
                          <Link
                            to={`/map?train=${j.firstTrainNumber}`}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Live Map</span>
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEmailModal(j)}
                          className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
