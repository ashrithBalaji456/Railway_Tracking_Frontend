import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, RefreshCw, AlertTriangle, Clock, Calendar, HelpCircle, Train, Navigation, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';
import { searchHistoryService } from '../services/searchHistoryService';
import RecentSearchesBar from '../components/RecentSearchesBar';

export default function JourneyPlanner() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const [destQuery, setDestQuery] = useState('');
  const [destList, setDestList] = useState<any[]>([]);
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [travelDate, setTravelDate] = useState('');

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 relative">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back to previous page button */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400" />
          <span>Back to Previous Page</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b border-white/10 pb-6 relative z-10">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-2xl text-indigo-400 shadow-lg shadow-indigo-950/20 transition-all duration-300 hover:scale-105 hover:border-indigo-500/30">
          <Calendar className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-100 to-indigo-300 tracking-tight leading-none">{t('journeyPlannerTitle')}</h1>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">{t('journeyPlannerDesc')}</p>
        </div>
      </div>

      {/* Query Form Box */}
      <div className="glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-8 space-y-8 relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10">
          
          {/* Subgrid for Origin & Destination to keep absolute Swap button centered */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative">
            
            {/* Origin Input */}
            <div className="space-y-2.5 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('originStationLabel')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <MapPin className="h-4.5 w-4.5 text-slate-450" />
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
                  className="glass-input rounded-xl w-full pl-10 pr-12 py-3 text-slate-200 outline-none text-xs font-semibold placeholder-slate-500"
                  placeholder={t('originPlaceholder')}
                />
                {selectedSource && (
                  <button
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
                      {s.newCategory && s.newCategory !== '-' && (
                        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded shrink-0">
                          {s.newCategory}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Stations for Origin */}
              <RecentSearchesBar
                type="STATION"
                limit={4}
                onSelect={(code, item) => {
                  setSelectedSource({ stationCode: code, stationName: item.title, district: item.subtitle });
                  setSourceQuery(`${item.title} (${code})`);
                  setSourceList([]);
                }}
              />
            </div>

            {/* Swap Button (Desktop floating) */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-7 z-20">
              <button
                onClick={swapStations}
                className="p-3 bg-slate-900/60 hover:bg-indigo-950/50 border border-white/10 hover:border-indigo-500/30 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all duration-300 shadow-lg cursor-pointer hover:scale-105 active:scale-95 group"
              >
                <RefreshCw className="h-4.5 w-4.5 group-hover:rotate-180 transition-transform duration-500 ease-out" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="space-y-2.5 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('destinationStationLabel')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <MapPin className="h-4.5 w-4.5 text-slate-450" />
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
                  className="glass-input rounded-xl w-full pl-10 pr-12 py-3 text-slate-200 outline-none text-xs font-semibold placeholder-slate-500"
                  placeholder={t('destinationPlaceholder')}
                />
                {selectedDest && (
                  <button
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
                      {d.newCategory && d.newCategory !== '-' && (
                        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded shrink-0">
                          {d.newCategory}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Stations for Destination */}
              <RecentSearchesBar
                type="STATION"
                limit={4}
                onSelect={(code, item) => {
                  setSelectedDest({ stationCode: code, stationName: item.title, district: item.subtitle });
                  setDestQuery(`${item.title} (${code})`);
                  setDestList([]);
                }}
              />
            </div>

          </div>

          {/* Travel Date Input */}
          <div className="lg:col-span-4 space-y-2.5 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Travel Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Calendar className="h-4.5 w-4.5 text-slate-450" />
              </span>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="glass-input rounded-xl w-full pl-10 pr-3.5 py-3 text-slate-200 outline-none text-xs font-semibold cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2 relative z-10">
          <button
            onClick={handlePlanJourney}
            disabled={!selectedSource || !selectedDest || loading}
            className="w-full md:w-auto bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-500 disabled:border-white/5 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-650/10 hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none transition-all duration-300 border border-white/5 cursor-pointer"
          >
            {t('findTravelRoutes')}
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
      {!loading && searched && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-200 border-b border-white/5 pb-3 flex items-center space-x-2.5">
            <Clock className="h-5.5 w-5.5 text-indigo-400" />
            <span>{t('availableJourneys')} ({journeys.length})</span>
          </h2>

          {journeys.length > 0 ? (
            <div className="space-y-4">
              {journeys.map((j, idx) => (
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
                      <span className="text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md font-extrabold">{formatDuration(j.totalDurationMinutes)}</span>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
                      {/* First Leg Train */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                            <Train className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-indigo-400 text-xs tracking-wider block">{j.firstTrainNumber}</span>
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
                              <span className="font-extrabold text-indigo-400 text-xs tracking-wider block">{j.secondTrainNumber}</span>
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
      )}
    </div>
  );
}
