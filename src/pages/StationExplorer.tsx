import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Train, Building2, Clock, AlertTriangle, ArrowRight, Heart, CalendarDays, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { stationService } from '../services/stationService';
import { searchHistoryService } from '../services/searchHistoryService';
import RecentSearchesBar from '../components/RecentSearchesBar';
import RecentSearchesDropdown from '../components/RecentSearchesDropdown';

export default function StationExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stationCodeParam = searchParams.get('code') || '';
  
  const [stationQuery, setStationQuery] = useState('');
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showStationDrop, setShowStationDrop] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [boardMode, setBoardMode] = useState<'SCHEDULED' | 'LIVE'>('SCHEDULED');
  const [liveHours, setLiveHours] = useState(4);
  const [liveData, setLiveData] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  
  const [trains, setTrains] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('ALL'); // ALL, STOPPING, NON_STOP
  const [dayFilter, setDayFilter] = useState('ALL_DAYS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const dayOptions = [
    { value: 'ALL_DAYS', label: 'All Days' },
    { value: 'YESTERDAY', label: 'Yesterday' },
    { value: 'TODAY', label: 'Today' },
    { value: 'TOMORROW', label: 'Tomorrow' },
    { value: 'MON', label: 'Mon' },
    { value: 'TUE', label: 'Tue' },
    { value: 'WED', label: 'Wed' },
    { value: 'THU', label: 'Thu' },
    { value: 'FRI', label: 'Fri' },
    { value: 'SAT', label: 'Sat' },
    { value: 'SUN', label: 'Sun' },
  ];

  const weekdayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const getRelativeDayCode = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return weekdayCodes[date.getDay()];
  };

  const selectedDayCode = () => {
    if (dayFilter === 'ALL_DAYS') return null;
    if (dayFilter === 'YESTERDAY') return getRelativeDayCode(-1);
    if (dayFilter === 'TODAY') return getRelativeDayCode(0);
    if (dayFilter === 'TOMORROW') return getRelativeDayCode(1);
    return dayFilter.toLowerCase();
  };

  const getShiftedDay = (day: string, offset: number): string => {
    const index = weekdayCodes.indexOf(day.toLowerCase());
    if (index === -1) return day;
    const newIndex = (index + offset) % 7;
    return weekdayCodes[newIndex < 0 ? newIndex + 7 : newIndex];
  };

  const parseRunningDays = (runningDays: string | undefined) => {
    if (!runningDays) return [];
    return runningDays
      .split(',')
      .map((day) => day.trim().slice(0, 3).toLowerCase())
      .filter(Boolean);
  };

  const formatDelay = (minutes: number) => {

    if (!minutes || minutes <= 0) return 'On Time';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `Delayed by ${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}` : `Delayed by ${mins} mins`;
  };

  const dayCode = selectedDayCode();
  const filteredTrains = dayCode
    ? trains.filter((train) => {
        const offset = train.arrivalDay || 0;
        const originDays = parseRunningDays(train.runningDays);
        const arrivalDays = originDays.map((d) => getShiftedDay(d, offset));
        return arrivalDays.includes(dayCode);
      })
    : trains;

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);

  // Check if station is favorited on load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !stationCodeParam) {
      setIsFavorite(false);
      setFavoriteId(null);
      return;
    }

    const checkFavorite = async () => {
      try {
        const response: any = await api.get('/api/v1/favorites');
        if (response.success && response.data) {
          const match = response.data.find(
            (f: any) => f.favoriteType === 'STATION' && f.itemCode.toLowerCase() === stationCodeParam.toLowerCase()
          );
          if (match) {
            setIsFavorite(true);
            setFavoriteId(match.id);
          } else {
            setIsFavorite(false);
            setFavoriteId(null);
          }
        }
      } catch (err) {
        console.error('Error checking favorite status', err);
      }
    };

    checkFavorite();
  }, [stationCodeParam]);

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        const response: any = await api.delete(`/api/v1/favorites/${favoriteId}`);
        if (response.success) {
          setIsFavorite(false);
          setFavoriteId(null);
        }
      } else {
        const response: any = await api.post('/api/v1/favorites/station', {
          itemCode: selectedStation.stationCode,
          itemName: selectedStation.stationName,
        });
        if (response.success && response.data) {
          setIsFavorite(true);
          setFavoriteId(response.data.id);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update bookmark');
    }
  };

  // Debounced Station Search
  useEffect(() => {
    if (stationQuery.trim().length < 2) {
      setStationsList([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/stations?query=${stationQuery}`);
        if (response.success && response.data) {
          setStationsList(response.data);
        }
      } catch (err) {
        console.error('Error fetching stations', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [stationQuery]);

  // Load Station Details and Trains
  useEffect(() => {
    if (!stationCodeParam) return;

    const fetchStationData = async () => {
      setLoading(true);
      setError('');
      try {
        // Get details
        const detailsResponse: any = await api.get(`/api/v1/stations/${stationCodeParam}`);
        if (detailsResponse.success && detailsResponse.data) {
          setSelectedStation(detailsResponse.data);
          const s = detailsResponse.data;
          searchHistoryService.addSearch({
            type: 'STATION',
            code: s.stationCode,
            title: s.stationName,
            subtitle: [s.district, s.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
          });
        }

        // Get board trains (filtered on backend or mapped)
        const boardResponse: any = await api.get(`/api/v1/stations/${stationCodeParam}/trains?type=${filterType}`);
        if (boardResponse.success && boardResponse.data) {
          setTrains(boardResponse.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load station information');
      } finally {
        setLoading(false);
      }
    };

    fetchStationData();
  }, [stationCodeParam, filterType]);

  // Click outside to close station dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowStationDrop(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLiveBoard = async (showSpinner = true) => {
    if (!stationCodeParam) return;
    if (showSpinner) {
      setLiveLoading(true);
      setLiveError('');
    }
    try {
      const response: any = await stationService.getLiveStationBoard(stationCodeParam, liveHours);
      if (response.success && response.data) {
        setLiveData(response.data);
      }
    } catch (err: any) {
      setLiveError(err.message || 'Unable to load the live station board. Please try again.');
    } finally {
      if (showSpinner) {
        setLiveLoading(false);
      }
    }
  };

  useEffect(() => {
    if (boardMode !== 'LIVE' || !stationCodeParam) return;

    fetchLiveBoard(true);

    const intervalId = setInterval(() => {
      fetchLiveBoard(false);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [stationCodeParam, boardMode, liveHours]);

  const handleStationSelect = (code: string, itemData?: any) => {
    const cleanCode = code.toUpperCase();
    const match = itemData || stationsList.find((s) => s.stationCode.toUpperCase() === cleanCode) || selectedStation;
    
    searchHistoryService.addSearch({
      type: 'STATION',
      code: cleanCode,
      title: match?.stationName ? match.stationName : `Station ${cleanCode}`,
      subtitle: match ? [match.district, match.state].filter(Boolean).filter((x: string) => x !== '-').join(', ') : undefined,
    });

    setSearchParams({ code: cleanCode });
    setStationQuery('');
    setStationsList([]);
    setShowStationDrop(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Back to previous page button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400" />
          <span>Back to Previous Page</span>
        </button>
      </div>

      {/* Search Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-indigo-400" />
          <span>Select Station to Explore</span>
        </h2>
        <div ref={searchContainerRef} className="relative max-w-lg">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={stationQuery}
            onChange={(e) => {
              setStationQuery(e.target.value);
              setShowStationDrop(true);
            }}
            onFocus={() => setShowStationDrop(true)}
            className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg w-full pl-10 pr-3 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-650 text-sm"
            placeholder="Search by Station Code or Name (e.g. BZA, NDLS)"
          />

          {/* Autocomplete Dropdown */}
          {showStationDrop && stationsList.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#1c212e] border border-white/10 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-20 backdrop-blur-xl divide-y divide-white/5 animate-fade-in">
              {stationsList.map((s) => (
                <button
                  key={s.stationCode}
                  type="button"
                  onClick={() => handleStationSelect(s.stationCode, s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:text-sky-300 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-500/35 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase shrink-0 min-w-[54px] text-center font-mono">{s.stationCode}</span>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-slate-100 font-semibold text-xs truncate">{s.stationName}</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {[s.district, s.state].filter(Boolean).filter((x: string) => x !== '-').join(', ')}
                      </span>
                    </div>
                  </div>
                  {s.newCategory && s.newCategory !== '-' && (
                    <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded shrink-0">
                      {s.newCategory}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches Dropdown when input is empty & focused */}
          <RecentSearchesDropdown
            type="STATION"
            limit={5}
            isOpen={showStationDrop && stationQuery.trim().length === 0}
            onSelect={(code, item) => handleStationSelect(code, { stationName: item.title, district: item.subtitle })}
          />

          {/* Recent Searches Chips near search bar (Last 5) */}
          <RecentSearchesBar
            type="STATION"
            limit={5}
            onSelect={(code, item) => handleStationSelect(code, { stationName: item.title, district: item.subtitle })}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl flex items-center space-x-2 text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedStation ? (
        <div className="space-y-6">
          {/* Station Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">{selectedStation.stationName}</h1>
                  <span className="bg-indigo-900/60 border border-indigo-750 text-indigo-400 px-2.5 py-0.5 rounded text-sm font-bold uppercase">{selectedStation.stationCode}</span>
                </div>
                
                <button
                  onClick={handleToggleFavorite}
                  className={`border p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isFavorite 
                      ? 'bg-red-950/20 border-red-900/30 text-red-500 hover:bg-slate-950' 
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-red-500' : ''}`} />
                </button>
              </div>
              <p className="text-sm text-slate-450 mt-1">
                {[selectedStation.district, selectedStation.state].filter(Boolean).filter(x => x !== '-').join(', ') || selectedStation.city}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                {selectedStation.zone && (
                  <span className="bg-slate-800/80 border border-slate-700/60 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Zone: {selectedStation.zone}
                  </span>
                )}
                {selectedStation.division && (
                  <span className="bg-slate-800/80 border border-slate-700/60 text-sky-300 px-2 py-0.5 rounded font-mono">
                    Div: {selectedStation.division}
                  </span>
                )}
                {selectedStation.newCategory && selectedStation.newCategory !== '-' && (
                  <span className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded">
                    Cat: {selectedStation.newCategory}
                  </span>
                )}
                {selectedStation.oldCategory && selectedStation.oldCategory !== '-' && (
                  <span className="bg-slate-800/50 border border-slate-700/40 text-slate-400 px-2 py-0.5 rounded">
                    Old Cat: {selectedStation.oldCategory}
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-xs text-slate-550 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 space-y-1">
              <p>Latitude: <span className="text-slate-350">{selectedStation.latitude ? `${selectedStation.latitude}° N` : 'N/A'}</span></p>
              <p>Longitude: <span className="text-slate-350">{selectedStation.longitude ? `${selectedStation.longitude}° E` : 'N/A'}</span></p>
            </div>
          </div>


          {/* Filters & Board List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            {/* Board Mode Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/70 p-1">
              <button
                onClick={() => setBoardMode('SCHEDULED')}
                className={`flex-1 py-3 text-center text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
                  boardMode === 'SCHEDULED'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10'
                    : 'border-transparent text-slate-450 hover:text-slate-200'
                }`}
              >
                <span>📅 Scheduled Timetable</span>
                {!loading && trains.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    boardMode === 'SCHEDULED'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {filteredTrains.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setBoardMode('LIVE')}
                className={`flex-1 py-3 text-center text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
                  boardMode === 'LIVE'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10'
                    : 'border-transparent text-slate-450 hover:text-slate-200'
                }`}
              >
                <span>⚡ Live Station Board</span>
                {liveData?.trains && liveData.trains.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    boardMode === 'LIVE'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {liveData.trains.length}
                  </span>
                )}
              </button>
            </div>

            {boardMode === 'SCHEDULED' ? (
              <>
                {/* Filter Tabs */}
                <div className="border-b border-slate-800 bg-slate-950/50 p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {['ALL', 'STOPPING', 'NON_STOP'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                            filterType === type
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                              : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850'
                          }`}
                        >
                          {type === 'ALL' && 'All Trains'}
                          {type === 'STOPPING' && 'Halting / Stopping'}
                          {type === 'NON_STOP' && 'Pass-Through (Non-Stop)'}
                        </button>
                      ))}
                    </div>

                    {/* Prominent Train Count Badge */}
                    {!loading && trains.length > 0 && (
                      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-xs shrink-0 shadow-sm">
                        <Train className="h-4 w-4 text-indigo-400" />
                        <span className="text-slate-200 font-medium">
                          Train Count: <span className="text-indigo-300 font-bold text-sm">{filteredTrains.length}</span>
                          {dayFilter !== 'ALL_DAYS' && (
                            <span className="text-slate-400 text-[11px] ml-1">
                              (of {trains.length} total)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                    <CalendarDays className="h-4 w-4 text-slate-500 shrink-0 ml-1" />
                    {dayOptions.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => setDayFilter(day.value)}
                        className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          dayFilter === day.value
                            ? 'bg-slate-200 text-slate-950 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  {dayFilter !== 'ALL_DAYS' && !loading && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 px-1 pt-0.5">
                      <span>Showing <strong className="text-indigo-400">{filteredTrains.length}</strong> trains running on <strong className="text-slate-200">{dayOptions.find(d => d.value === dayFilter)?.label}</strong></span>
                    </div>
                  )}
                </div>

                {/* List */}
                {loading ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4" />
                    <p>Loading train board...</p>
                  </div>
                ) : filteredTrains.length > 0 ? (
                  <div className="divide-y divide-slate-800/60">
                    {filteredTrains.map((t, index) => (
                      <div key={`${t.trainNumber || 'train'}-${index}`} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/40 transition-colors">
                        {/* Train Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-indigo-400">{t.trainNumber}</span>
                            <h4 className="font-bold text-slate-100">{t.trainName}</h4>
                            <span className="text-xs text-slate-550">({t.trainType})</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                            <span className="font-semibold">{t.sourceStation}</span>
                            <ArrowRight className="h-3 w-3 text-slate-600" />
                            <span className="font-semibold">{t.destinationStation}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {parseRunningDays(t.runningDays).length === 7 ? (
                              <span className="text-[10px] font-bold bg-indigo-950/45 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Daily
                              </span>
                            ) : parseRunningDays(t.runningDays).length === 0 ? (
                              <span className="text-[10px] font-semibold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Runs: --
                              </span>
                            ) : (
                              parseRunningDays(t.runningDays).map((day) => (
                                <span key={day} className="text-[10px] font-extrabold bg-indigo-950/45 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                  {day}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Passage Timings & Badge */}
                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="space-y-1 text-left sm:text-right">
                            <div className="flex items-center space-x-1.5 text-sm text-slate-300">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <span>
                                {t.isHalt ? (
                                  <>Arr: <span className="font-semibold text-slate-200">{t.scheduledArrival?.substring(0,5)}</span> | Dep: <span className="font-semibold text-slate-200">{t.scheduledDeparture?.substring(0,5)}</span></>
                                ) : (
                                  <>Scheduled Passage: <span className="font-semibold text-slate-200">{t.scheduledArrival?.substring(0,5) || t.scheduledDeparture?.substring(0,5)}</span></>
                                )}
                              </span>
                            </div>
                            {t.delayMinutes > 0 ? (
                              <span className="text-xs text-amber-400">{formatDelay(t.delayMinutes)}</span>
                            ) : (
                              <span className="text-xs text-emerald-400">On Time</span>
                            )}
                          </div>

                          {/* STOP / PASS badge */}
                          <div className="flex items-center space-x-3">
                            {t.isHalt ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 uppercase tracking-wide">
                                🟢 STOP
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 uppercase tracking-wide">
                                🔵 NON-STOP
                              </span>
                            )}
                            
                            <button
                              onClick={() => navigate(`/trains/${t.trainNumber}`)}
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              View Route
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-550">
                    <Train className="h-10 w-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                    <p className="text-sm">No trains found for the selected stop type and running-day filter.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Live Board Window Selector */}
                <div className="border-b border-slate-800 bg-slate-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-200">Trains Arriving / Passing Through</h3>
                      {liveData?.trains && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                          {liveData.trains.length} {liveData.trains.length === 1 ? 'Train' : 'Trains'}
                        </span>
                      )}
                    </div>
                    {liveData && liveData.window && (
                      <p className="text-xs text-slate-500">
                        Window: {liveData.window.from} to {liveData.window.to} (Next {liveData.window.hours} Hours)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0">Time Window:</span>
                    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
                      {[2, 4, 6, 8].map((hours) => (
                        <button
                          key={hours}
                          onClick={() => setLiveHours(hours)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            liveHours === hours
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-205'
                          }`}
                        >
                          {hours} Hrs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Board List */}
                {liveLoading ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4" />
                    <p>Loading live station board...</p>
                  </div>
                ) : liveError ? (
                  <div className="text-center py-16 px-4 space-y-4">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto opacity-80" />
                    <p className="text-sm text-slate-450">{liveError}</p>
                    <button
                      onClick={() => fetchLiveBoard(true)}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Retry Loading
                    </button>
                  </div>
                ) : liveData && liveData.trains && liveData.trains.length > 0 ? (
                  <div className="divide-y divide-slate-800/60">
                    {liveData.trains.map((t: any, idx: number) => {
                      const isStopping = t.passType === 'STOPPING';
                      const delayVal = t.delayMinutes;
                      const formattedDelay = formatDelay(delayVal);
                      const expectedTimeStr = t.expectedArrival || t.expectedDeparture;
                      
                      const formatTimeOnly = (isoStr: string) => {
                        if (!isoStr) return '';
                        try {
                          const date = new Date(isoStr);
                          if (isNaN(date.getTime())) {
                            if (isoStr.includes(':')) return isoStr.substring(0, 5);
                            return isoStr;
                          }
                          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        } catch {
                          return isoStr;
                        }
                      };

                      const addDelayToTime = (timeStr: string, delayMinutes: number) => {
                        if (!timeStr) return '';
                        if (!delayMinutes || delayMinutes <= 0) return timeStr;
                        try {
                          const parts = timeStr.split(':');
                          if (parts.length < 2) return timeStr;
                          const hours = parseInt(parts[0], 10);
                          const minutes = parseInt(parts[1], 10);
                          if (isNaN(hours) || isNaN(minutes)) return timeStr;
                          
                          const totalMins = hours * 60 + minutes + delayMinutes;
                          const newHours = Math.floor(totalMins / 60) % 24;
                          const newMinutes = totalMins % 60;
                          
                          const hh = String(newHours).padStart(2, '0');
                          const mm = String(newMinutes).padStart(2, '0');
                          return `${hh}:${mm}`;
                        } catch {
                          return timeStr;
                        }
                      };

                      const expectedTimeFormatted = formatTimeOnly(expectedTimeStr);

                      return (
                        <div key={`${t.trainNumber}-${idx}`} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-850/40 transition-colors animate-fade-in">
                          {/* Left Column: Time & Train Info */}
                          <div className="flex items-start space-x-4">
                            <div className="text-left shrink-0 pt-0.5">
                              <span className="block font-extrabold text-lg text-slate-100">{expectedTimeFormatted || t.scheduledArrival || t.scheduledDeparture}</span>
                              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Expected</span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-bold text-indigo-400 text-sm">{t.trainNumber}</span>
                                <h4 className="font-bold text-slate-100 text-sm sm:text-base">{t.trainName}</h4>
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-700">{t.trainType}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2 text-xs text-slate-400">
                                <span className="font-semibold">{t.source.name} ({t.source.code})</span>
                                <ArrowRight className="h-3 w-3 text-slate-650" />
                                <span className="font-semibold">{t.destination.name} ({t.destination.code})</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {parseRunningDays(t.runningDays).length === 7 ? (
                                  <span className="text-[10px] font-bold bg-indigo-950/45 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    Daily
                                  </span>
                                ) : parseRunningDays(t.runningDays).length === 0 ? (
                                  <span className="text-[10px] font-semibold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    Runs: --
                                  </span>
                                ) : (
                                  parseRunningDays(t.runningDays).map((day) => (
                                    <span key={day} className="text-[10px] font-extrabold bg-indigo-950/45 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                      {day}
                                    </span>
                                  ))
                                )}
                              </div>
                              
                              <div className="pt-1 flex items-center space-x-2 text-xs">
                                {isStopping ? (
                                  <span className="inline-flex items-center text-emerald-400 font-bold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    🟢 STOPS HERE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-sky-400 font-bold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
                                    🔵 PASSES THROUGH
                                  </span>
                                )}
                                {!isStopping && (
                                  <span className="text-slate-500">(Passes through without a scheduled halt)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Time details, Platform, Delay */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 text-sm">
                            <div className="space-y-1 text-left sm:text-right">
                              {isStopping ? (
                                <div className="text-xs text-slate-350 space-y-1">
                                  <div>
                                    <p>Arrival: <span className="font-semibold text-slate-200">{t.scheduledArrival}</span></p>
                                    {delayVal > 0 && (
                                      <p className="text-[10px] text-red-500 font-bold mt-0.5 leading-none">
                                        Expected Arrival: {addDelayToTime(t.scheduledArrival, delayVal)}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p>Departure: <span className="font-semibold text-slate-200">{t.scheduledDeparture}</span></p>
                                    {delayVal > 0 && (
                                      <p className="text-[10px] text-red-500 font-bold mt-0.5 leading-none">
                                        Expected Departure: {addDelayToTime(t.scheduledDeparture, delayVal)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-350 space-y-1">
                                  <p>Scheduled Passage: <span className="font-semibold text-slate-200">{t.scheduledArrival || t.scheduledDeparture}</span></p>
                                  {delayVal > 0 && (
                                    <p className="text-[10px] text-red-500 font-bold mt-0.5 leading-none">
                                      Expected Passage: {addDelayToTime(t.scheduledArrival || t.scheduledDeparture, delayVal)}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-1 sm:justify-end">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                  delayVal > 0 ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                                }`}>
                                  {formattedDelay}
                                </span>
                                {t.liveStatus && (
                                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    {t.liveStatus.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              {(t.platform && t.platform !== '—' && t.platform.trim() !== '') ? (
                                <div className="text-center bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg shrink-0">
                                  <span className="block text-[9px] text-slate-550 font-bold uppercase tracking-wider">Platform</span>
                                  <span className="block font-black text-slate-100 text-base">{t.platform}</span>
                                </div>
                              ) : (
                                <div className="text-center bg-slate-950/40 border border-slate-900 px-3 py-1.5 rounded-lg shrink-0 opacity-50">
                                  <span className="block text-[9px] text-slate-600 font-bold uppercase tracking-wider">Platform</span>
                                  <span className="block font-black text-slate-500 text-base">—</span>
                                </div>
                              )}

                              <button
                                onClick={() => navigate(`/trains/${t.trainNumber}`)}
                                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Track Live
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-550">
                    <Train className="h-10 w-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                    <p className="text-sm">No trains found in the next {liveHours} hours.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-550 bg-slate-900/40 border border-slate-800/50 rounded-xl">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30 text-indigo-400" />
          <p className="text-sm">Please select a station from the lookup box above to begin exploring.</p>
        </div>
      )}
    </div>
  );
}




