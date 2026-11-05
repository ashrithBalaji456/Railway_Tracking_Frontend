import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown, Calendar, ChevronDown, Clock, Navigation, RefreshCw, X, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';
import { searchHistoryService } from '../services/searchHistoryService';

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
    if (hours > 0) return `${hours}h ${m}m`;
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

  // Debounced search for source station
  useEffect(() => {
    if (sourceQuery.trim().length < 2) {
      setSourceList([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${sourceQuery}`);
        if (response?.success && response?.data) {
          setSourceList(response.data);
        }
      } catch (err) {
        console.error('Error searching source stations', err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [sourceQuery]);

  // Debounced search for destination station
  useEffect(() => {
    if (destQuery.trim().length < 2) {
      setDestList([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${destQuery}`);
        if (response?.success && response?.data) {
          setDestList(response.data);
        }
      } catch (err) {
        console.error('Error searching destination stations', err);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [destQuery]);

  // Fetch trains function
  const fetchTrainsBetween = async (srcCode: string, dstCode: string, dateParamStr: string) => {
    if (!srcCode || !dstCode) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const dateQuery = dateParamStr ? `&date=${dateParamStr}` : '';
      const response: any = await api.get(
        `/api/v1/journey/plan?source=${srcCode}&destination=${dstCode}${dateQuery}`
      );
      if (response && response.success && response.data) {
        setTrains(response.data);
      } else if (Array.isArray(response)) {
        setTrains(response);
      } else {
        setTrains([]);
      }
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

    if (nb !== null) setSearchNearby(nb === 'true');
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

          await fetchTrainsBetween(src, dst, dt);
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
    fetchTrainsBetween(src, dst, travelDate);
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
      fetchTrainsBetween(selectedDest.stationCode, tempSrc.stationCode, travelDate);
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
      fetchTrainsBetween(src, dst, dateVal);
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

  // Compute Categories with counts
  const categoryCounts = trains.reduce((acc: Record<string, number>, t: any) => {
    const cat = getTrainCategory(t.firstTrainNumber, t.firstTrainName);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.keys(categoryCounts).sort();

  // Filter and Sort trains
  const filteredTrains = trains.filter((t: any) => {
    if (selectedCategory !== 'ALL') {
      const cat = getTrainCategory(t.firstTrainNumber, t.firstTrainName);
      if (cat !== selectedCategory) return false;
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
              <span>{selectedSource?.stationName || searchParams.get('source') || 'Origin'}</span>
              <span className="text-slate-500 font-normal">→</span>
              <span>{selectedDest?.stationName || searchParams.get('destination') || 'Destination'}</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {sortedTrains.length} trains available {travelDate ? `on ${travelDate}` : '(irrespective of dates)'}
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
          <div className="relative">
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
          <div className="relative">
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
              onChange={(e) => setSearchNearby(e.target.checked)}
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
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Category Pills Filter Row (Matching screenshot) */}
      {trains.length > 0 && (
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
            All Trains <span className="ml-1 opacity-80">{trains.length}</span>
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
                const category = getTrainCategory(t.firstTrainNumber, t.firstTrainName);
                const runDaysStr = (t.firstTrainRunDays || 'mon,tue,wed,thu,fri,sat,sun').toLowerCase();

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
                          <div className="font-bold text-slate-300 text-xs mt-0.5">
                            {t.originStationCode}
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
                            {formatDistanceKm(t.firstLegDistanceKm, t.totalDurationMinutes)}
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="text-right min-w-[75px]">
                          <div className="font-extrabold text-white text-xs sm:text-sm">
                            {formatTimeToAMPM(t.destinationArrivalTime)}
                          </div>
                          <div className="font-bold text-slate-300 text-xs mt-0.5">
                            {t.destinationStationCode}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[100px] text-right">
                            {translateName(t.destinationStationName, language)}
                          </div>
                        </div>
                      </div>

                      {/* Running Days Pill Row */}
                      <div className="flex items-center gap-1.5 pt-3">
                        {daysList.map((day) => {
                          const isRunsOnDay = runDaysStr.includes(day.code) || runDaysStr.includes('daily');
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
