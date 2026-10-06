import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Train, Building2, Map, ShieldAlert, Sparkles, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { searchHistoryService } from '../services/searchHistoryService';
import RecentSearchesBar from '../components/RecentSearchesBar';
import RecentSearchesDropdown from '../components/RecentSearchesDropdown';

export default function Home() {
  const [trainQuery, setTrainQuery] = useState('');
  const [stationQuery, setStationQuery] = useState('');
  const [trainsList, setTrainsList] = useState<any[]>([]);
  const [stationsList, setStationsList] = useState<any[]>([]);
  
  const [showTrainDrop, setShowTrainDrop] = useState(false);
  const [showStationDrop, setShowStationDrop] = useState(false);

  const trainSearchBoxRef = useRef<HTMLDivElement>(null);
  const stationSearchBoxRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (trainSearchBoxRef.current && !trainSearchBoxRef.current.contains(event.target as Node)) {
        setShowTrainDrop(false);
      }
      if (stationSearchBoxRef.current && !stationSearchBoxRef.current.contains(event.target as Node)) {
        setShowStationDrop(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Train Search
  useEffect(() => {
    const trimmed = trainQuery.trim();
    if (trimmed.length < 1 || (!/^\d+$/.test(trimmed) && trimmed.length < 2)) {
      setTrainsList([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/trains?query=${trimmed}`);
        if (response.success && response.data) {
          setTrainsList(response.data);
        }
      } catch (err) {
        console.error('Error fetching trains', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [trainQuery]);

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

  const handleTrainSelect = (trainNumber: string, itemData?: any) => {
    const match = itemData || trainsList.find((t) => t.trainNumber === trainNumber);
    searchHistoryService.addSearch({
      type: 'TRAIN',
      code: trainNumber,
      title: match?.trainName ? match.trainName : `Train ${trainNumber}`,
      subtitle: match?.trainType || 'Live Tracking',
    });

    setShowTrainDrop(false);
    navigate(`/trains/${trainNumber}`);
  };

  const handleStationSelect = (stationCode: string, itemData?: any) => {
    const cleanCode = stationCode.toUpperCase();
    const match = itemData || stationsList.find((s) => s.stationCode.toUpperCase() === cleanCode);
    
    const locationSubtitle = match
      ? [match.district, match.state].filter(Boolean).filter((x) => x !== '-').join(', ')
      : undefined;

    searchHistoryService.addSearch({
      type: 'STATION',
      code: cleanCode,
      title: match?.stationName ? match.stationName : `Station ${cleanCode}`,
      subtitle: locationSubtitle,
    });

    setShowStationDrop(false);
    navigate(`/stations?code=${cleanCode}`);
  };

  const handleSearchTrainSubmit = () => {
    if (!trainQuery.trim()) return;
    const exactMatch = trainsList.find((t) => t.trainNumber === trainQuery.trim());
    if (exactMatch) {
      handleTrainSelect(exactMatch.trainNumber, exactMatch);
    } else if (trainsList.length > 0) {
      handleTrainSelect(trainsList[0].trainNumber, trainsList[0]);
    } else {
      handleTrainSelect(trainQuery.trim());
    }
  };

  const handleSearchStationSubmit = () => {
    if (!stationQuery.trim()) return;
    const exactMatch = stationsList.find(
      (s) => s.stationCode.toUpperCase() === stationQuery.trim().toUpperCase()
    );
    if (exactMatch) {
      handleStationSelect(exactMatch.stationCode, exactMatch);
    } else if (stationsList.length > 0) {
      handleStationSelect(stationsList[0].stationCode, stationsList[0]);
    } else {
      handleStationSelect(stationQuery.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 py-16 px-4 text-center rounded-2xl border border-indigo-900/10 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent -z-10" />
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-900/40 border border-indigo-750 px-3 py-1 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Real-time Tracking Enabled</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>
      </header>

      {/* Main Search Panel */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
        {/* Train Search */}
        <div ref={trainSearchBoxRef} className="bg-slate-900/70 border border-slate-800 p-6 rounded-xl shadow-lg relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-indigo-950/80 border border-indigo-800/40 rounded-lg text-indigo-400">
              <Train className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-150">Search Trains</h3>
              <p className="text-xs text-slate-450">Enter train number or name (e.g. 12760, Charminar)</p>
            </div>
          </div>
          <div className="relative">
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  value={trainQuery}
                  onChange={(e) => {
                    setTrainQuery(e.target.value);
                    setShowTrainDrop(true);
                  }}
                  onFocus={() => setShowTrainDrop(true)}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg w-full pl-10 pr-3 py-3 text-slate-200 outline-none transition-all placeholder:text-slate-650 text-sm"
                  placeholder="e.g. 12760 or Charminar"
                />
              </div>
              <button
                onClick={handleSearchTrainSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-indigo-650/15 shrink-0"
              >
                Search
              </button>
            </div>

            {/* Dropdown for Live Search Results */}
            {showTrainDrop && trainsList.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#1c212e] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-20 backdrop-blur-xl divide-y divide-white/5 animate-fade-in">
                {trainsList.map((t) => (
                  <button
                    key={t.trainNumber}
                    type="button"
                    onClick={() => handleTrainSelect(t.trainNumber, t)}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 hover:text-sky-300 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer group"
                  >
                    <div>
                      <span className="font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors mr-2">{t.trainNumber}</span>
                      <span className="text-slate-200 font-medium">{t.trainName}</span>
                      {t.sourceStation && t.destinationStation && (
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          {t.sourceStation} &rarr; {t.destinationStation}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0 ml-2">{t.trainType}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches Dropdown when input is empty & focused */}
            <RecentSearchesDropdown
              type="TRAIN"
              limit={5}
              isOpen={showTrainDrop && trainQuery.trim().length === 0}
              onSelect={(code, item) => handleTrainSelect(code, { trainName: item.title, trainType: item.subtitle })}
            />

            {/* Recent Searches Chips Bar near search bar (Last 5) */}
            <RecentSearchesBar
              type="TRAIN"
              limit={5}
              onSelect={(code, item) => handleTrainSelect(code, { trainName: item.title, trainType: item.subtitle })}
            />
          </div>
        </div>

        {/* Station Search */}
        <div ref={stationSearchBoxRef} className="bg-slate-900/70 border border-slate-800 p-6 rounded-xl shadow-lg relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-indigo-950/80 border border-indigo-800/40 rounded-lg text-indigo-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-150">Explore Stations</h3>
              <p className="text-xs text-slate-450">Enter station code or city (e.g. BZA, Vijayawada)</p>
            </div>
          </div>
          <div className="relative">
            <div className="flex space-x-2">
              <div className="relative flex-grow">
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
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg w-full pl-10 pr-3 py-3 text-slate-200 outline-none transition-all placeholder:text-slate-650 text-sm"
                  placeholder="e.g. BZA or Vijayawada"
                />
              </div>
              <button
                onClick={handleSearchStationSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-indigo-650/15 shrink-0"
              >
                Search
              </button>
            </div>

            {/* Dropdown for Live Station Search Results */}
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
                          {[s.district, s.state].filter(Boolean).filter(x => x !== '-').join(', ')}
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

            {/* Recent Searches Chips Bar near search bar (Last 5) */}
            <RecentSearchesBar
              type="STATION"
              limit={5}
              onSelect={(code, item) => handleStationSelect(code, { stationName: item.title, district: item.subtitle })}
            />
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <h3 className="text-xl font-bold text-slate-200 mb-6 text-center md:text-left">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            onClick={() => navigate('/stations')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-550/40 p-6 rounded-xl hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="p-3 bg-indigo-950/60 w-fit rounded-lg text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <Building2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-200 mb-1">Station Explorer</h4>
            <p className="text-xs text-slate-450">Filter scheduled halts and intermediate pass-through trains.</p>
          </div>

          <div
            onClick={() => navigate('/map')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-550/40 p-6 rounded-xl hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="p-3 bg-indigo-950/60 w-fit rounded-lg text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <Map className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-200 mb-1">Live Map Tracker</h4>
            <p className="text-xs text-slate-450">Interactive geospatial map mapping exact routes, positions, and markers.</p>
          </div>

          <div
            onClick={() => navigate('/login')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-550/40 p-6 rounded-xl hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="p-3 bg-indigo-950/60 w-fit rounded-lg text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-200 mb-1">Alerts & Favorites</h4>
            <p className="text-xs text-slate-450">Save frequent trains and trigger automated custom delay thresholds.</p>
          </div>

          <div
            onClick={() => navigate('/history')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-550/40 p-6 rounded-xl hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="p-3 bg-indigo-950/60 w-fit rounded-lg text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <History className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-200 mb-1">Search History</h4>
            <p className="text-xs text-slate-450">Filter past 10, 20, or all searched trains & stations with 1-click tracking.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
