import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown, Calendar, ChevronDown, Clock, Navigation, RefreshCw, X, ArrowRight, GitFork } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';
import { searchHistoryService } from '../services/searchHistoryService';
import { isBacktrackingRoute, getStationDistanceKm } from '../utils/stationClusters';
import { searchStationsFast, TOTAL_STATIONS_COUNT } from '../utils/stationSearchHelper';

export default function TrainsBetweenStations() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search Input States
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const [destQuery, setDestQuery] = useState('');
  const [destList, setDestList] = useState<any[]>([]);
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const [searchNearby, setSearchNearby] = useState(false);
  const [travelDate, setTravelDate] = useState<string>(''); // empty string = "All Dates (irrespective of dates)"

  // Sort & Filter States
  const [sortBy, setSortBy] = useState<'DEPARTURE' | 'ARRIVAL' | 'DURATION'>('DEPARTURE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Dropdown UI toggles
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sourceBoxRef = useRef<HTMLDivElement>(null);
  const destBoxRef = useRef<HTMLDivElement>(null);

  // Data states
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
      if (sourceBoxRef.current && !sourceBoxRef.current.contains(e.target as Node)) {
        setSourceList([]);
      }
      if (destBoxRef.current && !destBoxRef.current.contains(e.target as Node)) {
        setDestList([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format 12-hour AM/PM time
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

  // Format duration into compact string e.g. "2h 8m"
  const formatDurationCompact = (mins?: number) => {
    if (!mins || mins <= 0) return '0m';
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0 && m > 0) return `${hours}h ${m}m`;
    if (hours > 0) return `${hours}h`;
    return `${m}m`;
  };

  // Format distance in km
  const formatDistanceKm = (km?: number | null, durationMinutes?: number) => {
    if (km && km > 0) {
      return `${km.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
    }
    if (durationMinutes && durationMinutes > 0) {
      const estimated = Math.round((durationMinutes / 60) * 55 * 10) / 10;
      return `${estimated.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
    }
    return '108.1 km';
  };

  // Determine train category
  const getTrainCategory = (trainNumber: string, trainName: string = ''): string => {
    const upper = (trainName || '').toUpperCase();
    const num = (trainNumber || '').trim();
    if (upper.includes('VANDE BHARAT')) return 'Vande Bharat Express';
    if (upper.includes('SPECIAL') || upper.includes('FESTIVAL') || num.startsWith('0')) return 'Train on Demand';
    if (upper.includes('SF') || upper.includes('SUPERFAST') || upper.includes('KRANTI')) return 'Superfast Express';
    if (upper.includes('RAJDHANI')) return 'Rajdhani Express';
    if (upper.includes('SHATABDI')) return 'Shatabdi Express';
    if (upper.includes('DURONTO')) return 'Duronto Express';
    if (upper.includes('GARIB RATH')) return 'Garib Rath';
    if (upper.includes('AMRIT BHARAT')) return 'Amrit Bharat Express';
    if (upper.includes('PASSENGER') || upper.includes('MEMU')) return 'Passenger';
    return 'Mail/Express';
  };

  // Debounced search for source station with instant local A-Z & relevance ranking
  useEffect(() => {
    const trimmed = sourceQuery.trim();
    // Instant local results (alphabetical if empty, relevance-ranked if query)
    setSourceList(searchStationsFast(trimmed));

    if (trimmed.length < 2) return;

    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${trimmed}`);
        if (response?.success && response?.data && Array.isArray(response.data) && response.data.length > 0) {
          const apiStations = response.data;
          const existingCodes = new Set(apiStations.map((s: any) => s.stationCode.toUpperCase()));
          const localSupplement = searchStationsFast(trimmed).filter((s) => !existingCodes.has(s.stationCode));
          setSourceList([...apiStations, ...localSupplement].slice(0, 50));
        }
      } catch (err) {
        console.error('Error searching source stations', err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [sourceQuery]);

  // Debounced search for destination station with instant local A-Z & relevance ranking
  useEffect(() => {
    const trimmed = destQuery.trim();
    // Instant local results (alphabetical if empty, relevance-ranked if query)
    setDestList(searchStationsFast(trimmed));

    if (trimmed.length < 2) return;

    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${trimmed}`);
        if (response?.success && response?.data && Array.isArray(response.data) && response.data.length > 0) {
          const apiStations = response.data;
          const existingCodes = new Set(apiStations.map((s: any) => s.stationCode.toUpperCase()));
          const localSupplement = searchStationsFast(trimmed).filter((s) => !existingCodes.has(s.stationCode));
          setDestList([...apiStations, ...localSupplement].slice(0, 50));
        }
      } catch (err) {
        console.error('Error searching destination stations', err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [destQuery]);

  // Helper to deduplicate journeys across cluster queries while prioritizing exact user inputs
  const deduplicateJourneys = (items: any[], primarySrc: string, primaryDst: string): any[] => {
    if (!Array.isArray(items)) return [];
    const normSrc = (primarySrc || '').trim().toUpperCase();
    const normDst = (primaryDst || '').trim().toUpperCase();

    const getScore = (item: any): number => {
      let score = 0;
      const s = (item.originStationCode || '').trim().toUpperCase();
      const d = (item.destinationStationCode || '').trim().toUpperCase();
      
      // Origin scoring: exact user origin gets highest priority (+100).
      // If train only stops at nearby station, prefer closer stations to user's origin (+0..50).
      if (s === normSrc) {
        score += 100;
      } else {
        const dist = getStationDistanceKm(normSrc, s);
        if (dist !== null) {
          score += Math.max(0, 50 - Math.min(dist, 50));
        } else {
          score += 10;
        }
      }

      // Destination scoring: exact user destination gets highest priority (+100).
      if (d === normDst) {
        score += 100;
      } else {
        const dist = getStationDistanceKm(normDst, d);
        if (dist !== null) {
          score += Math.max(0, 50 - Math.min(dist, 50));
        } else {
          score += 10;
        }
      }

      return score;
    };

    const map = new Map<string, { item: any; score: number }>();

    for (const item of items) {
      if (!item) continue;
      const isDirect = item.direct !== false;
      const tNum1 = (item.firstTrainNumber || item.trainNumber || '').trim();
      if (!tNum1) continue;

      // Unique train key: each direct physical train is identified purely by its train number.
      // Connecting routes are identified by the train pair (first + second train).
      const trainKey = isDirect
        ? `DIR_${tNum1}`
        : `CONN_${tNum1}_${(item.secondTrainNumber || '').trim()}`;

      const score = getScore(item);
      const existing = map.get(trainKey);

      // If train not yet stored, or this instance matches user's exact stations better, keep it!
      if (!existing || score > existing.score) {
        map.set(trainKey, { item, score });
      }
    }

    return Array.from(map.values()).map(v => v.item);
  };

  // Fetch trains function with optional nearby cluster expansion
  const fetchTrainsBetween = async (srcCode: string, dstCode: string, dateParamStr: string, useNearby?: boolean) => {
    if (!srcCode || !dstCode) return;
    setLoading(true);
    setError('');
    setSearched(true);
    const nearbyActive = useNearby !== undefined ? useNearby : searchNearby;
    try {
      const dateQuery = dateParamStr ? `&date=${dateParamStr}` : '';

      // Single unified API call to backend (backend manages intelligent corridor discovery & caching)
      const response: any = await api.get(
        `/api/v1/journey/plan?source=${srcCode}&destination=${dstCode}${dateQuery}&nearby=${nearbyActive}`
      );
      const data = response?.data || (Array.isArray(response) ? response : []);
      setTrains(deduplicateJourneys(data, srcCode, dstCode));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trains between stations.');
      setTrains([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load from URL search params
  useEffect(() => {
    const src = searchParams.get('source');
    const dst = searchParams.get('destination');
    const dt = searchParams.get('date') || '';
    const nb = searchParams.get('nearby');
    const nearbyVal = nb === 'true';

    if (nb !== null) setSearchNearby(nearbyVal);
    setTravelDate(dt);

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

          await fetchTrainsBetween(src, dst, dt, nearbyVal);
        } catch (err: any) {
          setError(err.message || 'Failed to load stations.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [searchParams]);

  // Handle Search / Re-search click
  const handleViewTrains = () => {
    const src = selectedSource?.stationCode || sourceQuery.trim().toUpperCase();
    const dst = selectedDest?.stationCode || destQuery.trim().toUpperCase();
    if (!src || !dst) {
      setError('Please select both origin and destination stations.');
      return;
    }

    if (selectedSource) {
      searchHistoryService.addSearch({
        type: 'STATION',
        code: selectedSource.stationCode,
        title: selectedSource.stationName,
        subtitle: [selectedSource.district, selectedSource.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
      });
    }
    if (selectedDest) {
      searchHistoryService.addSearch({
        type: 'STATION',
        code: selectedDest.stationCode,
        title: selectedDest.stationName,
        subtitle: [selectedDest.district, selectedDest.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
      });
    }

    const dateQuery = travelDate ? `&date=${travelDate}` : '';
    navigate(`/trains-between?source=${src}&destination=${dst}${dateQuery}&nearby=${searchNearby}`, { replace: true });
    fetchTrainsBetween(src, dst, travelDate, searchNearby);
  };

  // Swap Stations button
  const handleSwapStations = () => {
    const tempSrc = selectedSource;
    const tempQuery = sourceQuery;

    setSelectedSource(selectedDest);
    setSourceQuery(destQuery);
    setSelectedDest(tempSrc);
    setDestQuery(tempQuery);

    if (selectedDest && tempSrc) {
      const dateQuery = travelDate ? `&date=${travelDate}` : '';
      navigate(`/trains-between?source=${selectedDest.stationCode}&destination=${tempSrc.stationCode}${dateQuery}&nearby=${searchNearby}`, { replace: true });
      fetchTrainsBetween(selectedDest.stationCode, tempSrc.stationCode, travelDate, searchNearby);
    }
  };

  // Date selection helper
  const handleSelectDate = (dateVal: string) => {
    setTravelDate(dateVal);
    setShowDateDropdown(false);
    const src = selectedSource?.stationCode || searchParams.get('source');
    const dst = selectedDest?.stationCode || searchParams.get('destination');
    if (src && dst) {
      const dateQuery = dateVal ? `&date=${dateVal}` : '';
      navigate(`/trains-between?source=${src}&destination=${dst}${dateQuery}&nearby=${searchNearby}`, { replace: true });
      fetchTrainsBetween(src, dst, dateVal, searchNearby);
    }
  };

  // Toggle Search Nearby helper
  const handleToggleNearby = (checked: boolean) => {
    setSearchNearby(checked);
    const src = selectedSource?.stationCode || searchParams.get('source');
    const dst = selectedDest?.stationCode || searchParams.get('destination');
    if (src && dst) {
      const dateQuery = travelDate ? `&date=${travelDate}` : '';
      navigate(`/trains-between?source=${src}&destination=${dst}${dateQuery}&nearby=${checked}`, { replace: true });
      fetchTrainsBetween(src, dst, travelDate, checked);
    }
  };

  // Calculate day of week if date is selected (e.g. "thu")
  const getSelectedDayOfWeek = (dStr: string) => {
    if (!dStr) return null;
    try {
      const d = new Date(dStr);
      return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
    } catch {
      return null;
    }
  };
  const activeDayOfWeek = getSelectedDayOfWeek(travelDate);

  // Route Filter: DIRECT vs CONNECTING
  const [routeFilter, setRouteFilter] = useState<'DIRECT' | 'CONNECTING'>('DIRECT');

  // Compute direct trains
  const directTrains = trains.filter((t: any) => t.direct !== false);

  // Set of all direct train numbers operating between source cluster and destination cluster
  const directTrainNumbers = useMemo(() => {
    const set = new Set<string>();
    for (const d of directTrains) {
      const num = (d.firstTrainNumber || d.trainNumber || '').trim();
      if (num) set.add(num);
    }
    return set;
  }, [directTrains]);

  // Average direct reference distance for excessive detour detection
  const averageDirectDistanceKm = useMemo(() => {
    const validDists = directTrains
      .map((d: any) => d.totalDistanceKm || d.firstLegDistanceKm)
      .filter((km: any) => typeof km === 'number' && km > 0);
    if (validDists.length === 0) return 0;
    return validDists.reduce((a: number, b: number) => a + b, 0) / validDists.length;
  }, [directTrains]);

  // Filter out redundant and backtracking connecting routes:
  // 1. Same train cannot be both Leg 1 and Leg 2
  // 2. Redundant Leg 2: If Leg 2 is ALREADY a direct train from the origin cluster,
  //    traveling to an earlier station (like Ramagundam) just to board it is backtracking!
  // 3. Redundant Leg 1: If Leg 1 already travels directly to destination, transferring midway is unnecessary
  // 4. Excessive Detour: Reject itineraries that exceed 1.65x the direct rail distance
  const connectingTrains = useMemo(() => {
    return trains.filter((t: any) => {
      if (t.direct !== false) return false;

      const num1 = (t.firstTrainNumber || '').trim();
      const num2 = (t.secondTrainNumber || '').trim();

      // Rule 1: Not identical trains
      if (num1 && num2 && num1 === num2) return false;

      // Rule 2: If Leg 2 is already a direct train from our origin, traveling to another junction to catch it is backtracking
      if (num2 && directTrainNumbers.has(num2)) return false;

      // Rule 3: If Leg 1 is already a direct train, no need to transfer off it
      if (num1 && directTrainNumbers.has(num1)) return false;

      // Rule 4: Discard extreme circuitous detours (> 1.65x direct distance)
      if (averageDirectDistanceKm > 0 && t.totalDistanceKm && t.totalDistanceKm > averageDirectDistanceKm * 1.65) {
        return false;
      }

      // Rule 5: Geographic Backtracking: transfer station cannot be further away from destination than origin
      const transCode = (t.transferStationCode || '').trim();
      const sCode = (t.originStationCode || searchParams.get('source') || '').trim();
      const dCode = (t.destinationStationCode || searchParams.get('destination') || '').trim();
      if (transCode && sCode && dCode && isBacktrackingRoute(sCode, transCode, dCode)) {
        return false;
      }

      return true;
    });
  }, [trains, directTrainNumbers, averageDirectDistanceKm]);

  const activeRouteTrains = routeFilter === 'DIRECT' ? directTrains : connectingTrains;

  // Compute Categories with counts based on active route filter
  const categoryCounts = activeRouteTrains.reduce((acc: Record<string, number>, t: any) => {
    const cat = getTrainCategory(t.firstTrainNumber, t.firstTrainName);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.keys(categoryCounts).sort();

  // Filter and Sort trains
  const filteredTrains = activeRouteTrains.filter((t: any) => {
    if (selectedCategory !== 'ALL') {
      const cat = getTrainCategory(t.firstTrainNumber, t.firstTrainName);
      if (cat !== selectedCategory) return false;
    }
    // If travel date is selected, check if train runs on this day of week
    if (activeDayOfWeek) {
      const runDays = (t.firstTrainRunDays || '').toLowerCase();
      if (runDays && !runDays.includes('daily') && !runDays.includes(activeDayOfWeek)) {
        return false;
      }
    }
    return true;
  });

  const sortedTrains = [...filteredTrains].sort((a, b) => {
    if (sortBy === 'DEPARTURE') {
      const aTime = a.originDepartureTime || '';
      const bTime = b.originDepartureTime || '';
      return aTime.localeCompare(bTime);
    }
    if (sortBy === 'ARRIVAL') {
      const aTime = a.destinationArrivalTime || '';
      const bTime = b.destinationArrivalTime || '';
      return aTime.localeCompare(bTime);
    }
    return (a.totalDurationMinutes || 0) - (b.totalDurationMinutes || 0);
  });

  // Today and Tomorrow strings
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const getDateLabel = () => {
    if (!travelDate) return 'All Dates';
    if (travelDate === todayStr) return 'Today';
    if (travelDate === tomorrowStr) return 'Tomorrow';
    return travelDate;
  };

  const getSortLabel = () => {
    if (sortBy === 'DEPARTURE') return 'Departure';
    if (sortBy === 'ARRIVAL') return 'Arrival';
    return 'Duration';
  };

  const daysList = [
    { code: 'mon', label: 'Mon' },
    { code: 'tue', label: 'Tue' },
    { code: 'wed', label: 'Wed' },
    { code: 'thu', label: 'Thu' },
    { code: 'fri', label: 'Fri' },
    { code: 'sat', label: 'Sat' },
    { code: 'sun', label: 'Sun' },
  ];

  const getHeaderSourceTitle = () => {
    const rawName = selectedSource?.stationName || searchParams.get('source') || 'Origin';
    if (!searchNearby) return rawName;
    return `${rawName} & Nearby Stations`;
  };

  const getHeaderDestTitle = () => {
    const rawName = selectedDest?.stationName || searchParams.get('destination') || 'Destination';
    if (!searchNearby) return rawName;
    return `${rawName} & Nearby Stations`;
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 relative text-slate-200">
      {/* Top Header Row with Back to Home & Action Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Left: Back to Home + Route Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95 shadow-sm"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{getHeaderSourceTitle()}</span>
              <span className="text-slate-500 font-normal">→</span>
              <span>{getHeaderDestTitle()}</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {sortedTrains.length} {routeFilter === 'DIRECT' ? 'direct trains' : 'connecting routes'} available {travelDate ? `on ${travelDate}` : '(irrespective of dates)'}
            </p>
          </div>
        </div>

        {/* Right: Date Picker Dropdown + Sort Dropdown */}
        <div className="flex items-center gap-2">
          {/* Date Selector Pill */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setShowDateDropdown(prev => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{getDateLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-[#121928] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                  Select Travel Date
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectDate('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    !travelDate ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>All Dates (All Trains)</span>
                  {!travelDate && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDate(todayStr)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    travelDate === todayStr ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>Today ({todayStr})</span>
                  {travelDate === todayStr && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDate(tomorrowStr)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    travelDate === tomorrowStr ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>Tomorrow ({tomorrowStr})</span>
                  {travelDate === tomorrowStr && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </button>
                <div className="pt-2 mt-1 border-t border-white/5">
                  <label className="text-[10px] text-slate-400 font-semibold block px-2 mb-1">
                    Or Pick Specific Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => handleSelectDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown Pill (matching screenshot) */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setShowSortDropdown(prev => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{getSortLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#121928] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in backdrop-blur-xl">
                <div className="text-xs font-bold text-slate-300 pb-2 mb-1 border-b border-white/10">
                  Sort Trains By
                </div>
                <div className="space-y-1 pt-1">
                  {/* Option 1: Departure Time */}
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('DEPARTURE');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                      sortBy === 'DEPARTURE' ? 'bg-blue-600/15 border border-blue-500/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs">Departure Time</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">When trains leave from origin</div>
                    </div>
                    {sortBy === 'DEPARTURE' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md"></span>
                    )}
                  </button>

                  {/* Option 2: Arrival Time */}
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('ARRIVAL');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                      sortBy === 'ARRIVAL' ? 'bg-blue-600/15 border border-blue-500/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs">Arrival Time</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">When trains reach destination</div>
                    </div>
                    {sortBy === 'ARRIVAL' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md"></span>
                    )}
                  </button>

                  {/* Option 3: Journey Duration */}
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('DURATION');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                      sortBy === 'DURATION' ? 'bg-blue-600/15 border border-blue-500/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs">Journey Duration</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Fastest trains first</div>
                    </div>
                    {sortBy === 'DURATION' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md"></span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "Find Trains" Top Card (Matching exact user screenshot) */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-4 sm:p-5 relative shadow-xl">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span>Find Trains</span>
        </div>

        <div className="relative space-y-3">
          {/* Origin Station Row */}
          <div ref={sourceBoxRef} className="relative">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl focus-within:border-blue-500/70 transition">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-400 shrink-0"></span>
              {selectedSource && (
                <span className="bg-blue-900/40 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                  {selectedSource.stationCode}
                </span>
              )}
              <input
                type="text"
                value={selectedSource ? `${translateName(selectedSource.stationName, language)}` : sourceQuery}
                onChange={(e) => {
                  setSourceQuery(e.target.value);
                  setSelectedSource(null);
                }}
                onFocus={() => {
                  if (selectedSource) {
                    setSourceQuery('');
                    setSelectedSource(null);
                  }
                  setSourceList(searchStationsFast(sourceQuery));
                }}
                placeholder="Search origin station..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white outline-none placeholder-slate-500"
              />
              {(selectedSource || sourceQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSource(null);
                    setSourceQuery('');
                  }}
                  className="text-slate-500 hover:text-slate-300 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Source Autocomplete Dropdown */}
            {sourceList.length > 0 && !selectedSource && (
              <div className="absolute left-0 right-0 mt-1 bg-[#151c2c] border border-slate-700/80 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-40 divide-y divide-white/5">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-950/90 sticky top-0 flex items-center justify-between border-b border-white/5 uppercase tracking-wider backdrop-blur-md">
                  <span>{sourceQuery.trim() ? 'Matching Stations' : 'All 10,794 Stations (A - Z)'}</span>
                  <span className="text-[9px] text-blue-400 font-mono">
                    {sourceQuery.trim() ? `${sourceList.length} matching` : `${TOTAL_STATIONS_COUNT.toLocaleString()} stations`}
                  </span>
                </div>
                {sourceList.map((s) => (
                  <button
                    key={s.stationCode}
                    type="button"
                    onClick={() => {
                      setSelectedSource(s);
                      setSourceQuery(`${translateName(s.stationName, language)} (${s.stationCode})`);
                      setSourceList([]);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                        {s.stationCode}
                      </span>
                      <span className="font-semibold text-white">{translateName(s.stationName, language)}</span>
                    </div>
                    {(s.state || s.district) && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {[s.district, s.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connected track line with Swap Button on right */}
          <div className="relative flex items-center justify-between px-3 h-5">
            <div className="w-0.5 h-full bg-slate-700 ml-1"></div>
            <button
              type="button"
              onClick={handleSwapStations}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer z-10"
              title="Swap Stations"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination Station Row */}
          <div ref={destBoxRef} className="relative">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl focus-within:border-blue-500/70 transition">
              <span className="w-3 h-3 rounded-full border-2 border-blue-400 shrink-0"></span>
              {selectedDest && (
                <span className="bg-blue-900/40 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">
                  {selectedDest.stationCode}
                </span>
              )}
              <input
                type="text"
                value={selectedDest ? `${translateName(selectedDest.stationName, language)}` : destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setSelectedDest(null);
                }}
                onFocus={() => {
                  if (selectedDest) {
                    setDestQuery('');
                    setSelectedDest(null);
                  }
                  setDestList(searchStationsFast(destQuery));
                }}
                placeholder="Search destination station..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white outline-none placeholder-slate-500"
              />
              {(selectedDest || destQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDest(null);
                    setDestQuery('');
                  }}
                  className="text-slate-500 hover:text-slate-300 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Destination Autocomplete Dropdown */}
            {destList.length > 0 && !selectedDest && (
              <div className="absolute left-0 right-0 mt-1 bg-[#151c2c] border border-slate-700/80 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-40 divide-y divide-white/5">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-950/90 sticky top-0 flex items-center justify-between border-b border-white/5 uppercase tracking-wider backdrop-blur-md">
                  <span>{destQuery.trim() ? 'Matching Stations' : 'All 10,794 Stations (A - Z)'}</span>
                  <span className="text-[9px] text-blue-400 font-mono">
                    {destQuery.trim() ? `${destList.length} matching` : `${TOTAL_STATIONS_COUNT.toLocaleString()} stations`}
                  </span>
                </div>
                {destList.map((d) => (
                  <button
                    key={d.stationCode}
                    type="button"
                    onClick={() => {
                      setSelectedDest(d);
                      setDestQuery(`${translateName(d.stationName, language)} (${d.stationCode})`);
                      setDestList([]);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                        {d.stationCode}
                      </span>
                      <span className="font-semibold text-white">{translateName(d.stationName, language)}</span>
                    </div>
                    {(d.state || d.district) && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {[d.district, d.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search nearby checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="nearbyStations"
              checked={searchNearby}
              onChange={(e) => handleToggleNearby(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="nearbyStations" className="text-xs text-slate-400 cursor-pointer select-none">
              Search nearby stations
            </label>
          </div>

          {/* View Trains Big Blue Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleViewTrains}
              disabled={loading}
              className="w-full bg-[#2563eb] hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading Trains...</span>
                </>
              ) : (
                <span>View Trains →</span>
              )}
            </button>
          </div>

          {/* Going to more cities? Plan trip -> (Matching user screenshot) */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <GitFork className="w-3.5 h-3.5 text-slate-500" />
              <span>Going to more cities?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (selectedSource?.stationCode) params.set('source', selectedSource.stationCode);
                if (selectedDest?.stationCode) params.set('destination', selectedDest.stationCode);
                if (travelDate) params.set('date', travelDate);
                const queryStr = params.toString() ? `?${params.toString()}` : '';
                navigate(`/journey${queryStr}`);
              }}
              className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Plan trip</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Route Mode Switcher: Direct Trains vs Connecting Options */}
      {trains.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRouteFilter('DIRECT');
                setSelectedCategory('ALL');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                routeFilter === 'DIRECT'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>Direct Trains</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${routeFilter === 'DIRECT' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {directTrains.length}
              </span>
            </button>

            {connectingTrains.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRouteFilter('CONNECTING');
                  setSelectedCategory('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  routeFilter === 'CONNECTING'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                <span>Connecting Routes</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${routeFilter === 'CONNECTING' ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {connectingTrains.length}
                </span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            {routeFilter === 'DIRECT' ? (
              <span>Showing direct non-stop trains</span>
            ) : (
              <span>Showing 1-transfer connecting journey options</span>
            )}
          </div>
        </div>
      )}

      {/* Category Pills Filter Row (Matching screenshot) */}
      {activeRouteTrains.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#2563eb] text-white shadow-md'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            All {routeFilter === 'DIRECT' ? 'Trains' : 'Routes'} <span className="ml-1 opacity-80">{activeRouteTrains.length}</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat} <span className="ml-1 opacity-80">{categoryCounts[cat]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-semibold">Fetching running trains...</p>
        </div>
      )}

      {/* Train Cards Grid */}
      {!loading && searched && (
        <>
          {sortedTrains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTrains.map((t: any, idx: number) => {
                // If this is a connecting route (1 transfer)
                if (t.direct === false) {
                  return (
                    <div
                      key={idx}
                      className="bg-[#0c1322] border border-purple-500/30 hover:border-purple-500/60 rounded-xl p-4 sm:p-5 space-y-3.5 transition shadow-lg flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top Row: Transfer header & Total Distance */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 truncate">
                            <GitFork className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate">Via {t.transferStationCode} ({translateName(t.transferStationName || t.transferStationCode, language)})</span>
                          </div>
                          <span className="text-[10px] font-semibold bg-purple-950/70 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded shrink-0">
                            {formatDistanceKm(t.totalDistanceKm, t.totalDurationMinutes)}
                          </span>
                        </div>

                        {/* Leg 1 */}
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-white">{t.firstTrainNumber} - {translateName(t.firstTrainName, language)}</span>
                            <span className="text-[11px] text-slate-300 font-semibold">{formatTimeToAMPM(t.originDepartureTime)} → {formatTimeToAMPM(t.transferArrivalTime)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{t.originStationCode} → {t.transferStationCode}</span>
                            <span>{formatDistanceKm(t.firstLegDistanceKm)}</span>
                          </div>
                        </div>

                        {/* Layover indicator */}
                        <div className="flex items-center justify-center gap-1.5 py-0.5 text-[11px] text-amber-400 font-medium">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{formatDurationCompact(t.layoverMinutes)} transfer layover at {t.transferStationCode}</span>
                        </div>

                        {/* Leg 2 */}
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-white">{t.secondTrainNumber} - {translateName(t.secondTrainName, language)}</span>
                            <span className="text-[11px] text-slate-300 font-semibold">{formatTimeToAMPM(t.transferDepartureTime)} → {formatTimeToAMPM(t.destinationArrivalTime)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{t.transferStationCode} → {t.destinationStationCode}</span>
                            <span>{formatDistanceKm(t.secondLegDistanceKm)}</span>
                          </div>
                        </div>

                        {/* Total journey duration */}
                        <div className="flex items-center justify-between text-xs pt-0.5 text-slate-400">
                          <span>Total Journey Duration:</span>
                          <span className="font-bold text-white">{formatDurationCompact(t.totalDurationMinutes)}</span>
                        </div>
                      </div>

                      {/* Quick Action Footer */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[11px]">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/trains/${t.firstTrainNumber}?date=${travelDate || todayStr}`}
                            className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Leg 1 ({t.firstTrainNumber})</span>
                          </Link>
                          <span className="text-slate-700">|</span>
                          <Link
                            to={`/trains/${t.secondTrainNumber}?date=${travelDate || todayStr}`}
                            className="font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Leg 2 ({t.secondTrainNumber})</span>
                          </Link>
                        </div>
                        <Link
                          to={`/journey?source=${t.originStationCode}&destination=${t.destinationStationCode}${travelDate ? `&date=${travelDate}` : ''}`}
                          className="font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <span>Itinerary</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                }

                // Direct Train Card
                const category = getTrainCategory(t.firstTrainNumber, t.firstTrainName);
                const runDaysStr = (t.firstTrainRunDays || '').toLowerCase();
                const isDaily = runDaysStr.includes('daily');
                const displayDistance = t.totalDistanceKm || t.firstLegDistanceKm;

                return (
                  <div
                    key={idx}
                    className="bg-[#0c1322] border border-slate-800/90 hover:border-blue-500/40 rounded-xl p-4 sm:p-5 space-y-3.5 transition shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Train Number, Name, Category Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold text-white text-xs sm:text-sm tracking-wide">
                            {t.firstTrainNumber}
                          </div>
                          <h3 className="text-xs text-slate-200 font-medium truncate mt-0.5">
                            {translateName(t.firstTrainName, language)}
                          </h3>
                        </div>
                        <span className="bg-slate-900 border border-slate-700/60 text-slate-400 px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase shrink-0">
                          {category}
                        </span>
                      </div>

                      {/* 3-Column Timeline */}
                      <div className="flex items-center justify-between gap-2 pt-2 text-xs">
                        {/* Origin */}
                        <div className="text-left min-w-[75px]">
                          <div className="font-extrabold text-white text-xs sm:text-sm">
                            {formatTimeToAMPM(t.originDepartureTime)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-300 text-xs">
                              {t.originStationCode}
                            </span>
                            {selectedSource?.stationCode && t.originStationCode !== selectedSource.stationCode && (
                              <span className="text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1 py-0.2 rounded">
                                Nearby
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[100px]">
                            {translateName(t.originStationName, language)}
                          </div>
                        </div>

                        {/* Track & Duration */}
                        <div className="flex-1 flex flex-col items-center px-1">
                          <span className="text-[10px] sm:text-[11px] text-slate-300 font-semibold">
                            {formatDurationCompact(t.totalDurationMinutes)}
                          </span>
                          <div className="w-full flex items-center gap-1 my-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                            <div className="flex-1 border-t border-slate-600 border-dashed"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                            {formatDistanceKm(displayDistance, t.totalDurationMinutes)}
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="text-right min-w-[75px]">
                          <div className="font-extrabold text-white text-xs sm:text-sm">
                            {formatTimeToAMPM(t.destinationArrivalTime)}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            {selectedDest?.stationCode && t.destinationStationCode !== selectedDest.stationCode && (
                              <span className="text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 py-0.2 rounded">
                                Nearby
                              </span>
                            )}
                            <span className="font-bold text-slate-300 text-xs">
                              {t.destinationStationCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[100px] text-right">
                            {translateName(t.destinationStationName, language)}
                          </div>
                        </div>
                      </div>

                      {/* Running Days Pill Row */}
                      <div className="flex items-center gap-1.5 pt-3">
                        {daysList.map((day) => {
                          const isRunsOnDay = isDaily || (runDaysStr ? runDaysStr.includes(day.code) : true);
                          const isDayActive = activeDayOfWeek ? (activeDayOfWeek === day.code && isRunsOnDay) : isRunsOnDay;

                          if (!isRunsOnDay) {
                            return (
                              <span key={day.code} className="text-[10px] text-slate-600 font-medium px-1.5 py-0.5">
                                {day.label}
                              </span>
                            );
                          }

                          return (
                            <span
                              key={day.code}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition ${
                                isDayActive
                                  ? 'bg-[#2563eb] text-white shadow-sm font-bold'
                                  : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}
                            >
                              {day.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Action Footer */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-[11px]">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/trains/${t.firstTrainNumber}?date=${travelDate || todayStr}`}
                          className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Timetable</span>
                        </Link>
                        <span className="text-slate-700">|</span>
                        <Link
                          to={`/map?train=${t.firstTrainNumber}`}
                          className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Live Tracker</span>
                        </Link>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px]">
                        #{t.firstTrainNumber}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0c1322] border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <p className="font-bold text-white text-sm">No Trains Found Between These Stations</p>
              <p className="text-xs text-slate-500">
                Try selecting "All Dates" or changing your origin and destination stations.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
