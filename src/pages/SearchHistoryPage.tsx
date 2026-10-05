import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Train, 
  Building2, 
  Trash2, 
  Clock, 
  Search, 
  ArrowRight, 
  X, 
  Filter, 
  RefreshCw
} from 'lucide-react';
import { searchHistoryService, type SearchHistoryItem } from '../services/searchHistoryService';

export default function SearchHistoryPage() {
  const navigate = useNavigate();

  // Filters state
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TRAIN' | 'STATION'>('ALL');
  const [limitFilter, setLimitFilter] = useState<number>(20); // 5, 10, 20, 50, 0 (all)
  const [searchQuery, setSearchQuery] = useState('');
  
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load history function
  const loadHistory = () => {
    const raw = searchHistoryService.getHistory(typeFilter, limitFilter > 0 ? limitFilter : undefined);
    setHistoryItems(raw);
  };

  useEffect(() => {
    loadHistory();

    const handleUpdate = () => {
      loadHistory();
    };

    window.addEventListener('search-history-updated', handleUpdate);
    return () => window.removeEventListener('search-history-updated', handleUpdate);
  }, [typeFilter, limitFilter]);

  // Initial sync with backend
  useEffect(() => {
    const sync = async () => {
      setIsSyncing(true);
      await searchHistoryService.syncWithServer();
      loadHistory();
      setIsSyncing(false);
    };
    sync();
  }, []);

  const handleItemClick = (item: SearchHistoryItem) => {
    // Touch history to update timestamp
    searchHistoryService.addSearch({
      type: item.type,
      code: item.code,
      title: item.title,
      subtitle: item.subtitle,
    });

    if (item.type === 'TRAIN') {
      navigate(`/trains/${item.code}`);
    } else {
      navigate(`/stations?code=${item.code}`);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    searchHistoryService.removeSearch(id);
  };

  const handleClearAll = () => {
    const label = typeFilter === 'ALL' ? 'all search history' : `${typeFilter.toLowerCase()} search history`;
    if (window.confirm(`Are you sure you want to clear ${label}?`)) {
      searchHistoryService.clearHistory(typeFilter);
    }
  };

  // Filter with search query
  const filteredItems = historyItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-950/80 border border-indigo-700/40 rounded-xl text-indigo-400 shadow-inner">
            <History className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Search History</span>
              {isSyncing && (
                <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
              )}
            </h1>
            <p className="text-xs text-slate-400">
              Quickly re-visit your recently tracked trains and explored stations
            </p>
          </div>
        </div>

        {/* Clear All Button */}
        {filteredItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear {typeFilter === 'ALL' ? 'All' : typeFilter}</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Searches
            </button>
            <button
              onClick={() => setTypeFilter('TRAIN')}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'TRAIN'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Train className="h-3.5 w-3.5" />
              <span>Trains</span>
            </button>
            <button
              onClick={() => setTypeFilter('STATION')}
              className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'STATION'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Stations</span>
            </button>
          </div>

          {/* Limit Count Filter & Search Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Limit Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <Filter className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs text-slate-400 font-medium">Show:</span>
              <div className="flex items-center space-x-1">
                {[5, 10, 20, 50, 0].map((count) => (
                  <button
                    key={count}
                    onClick={() => setLimitFilter(count)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                      limitFilter === count
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {count === 0 ? 'All' : `Last ${count}`}
                  </button>
                ))}
              </div>
            </div>

            {/* In-History Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter history..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-7 py-1.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-slate-500">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No Search History Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No searches matching "${searchQuery}".`
                : 'Searches you perform for trains or stations will automatically show up here for 1-click access.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <span>Explore Railway Search</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isTrain = item.type === 'TRAIN';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/40 p-4 rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 hover:translate-x-0.5"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Type Icon Badge */}
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      isTrain
                        ? 'bg-indigo-950/70 border-indigo-700/40 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                        : 'bg-sky-950/70 border-sky-700/40 text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors'
                    }`}
                  >
                    {isTrain ? (
                      <Train className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex flex-col text-left">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                          isTrain
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {item.code}
                      </span>
                      <span className="text-slate-100 font-bold text-sm truncate group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </span>
                    </div>

                    {item.subtitle && (
                      <span className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    )}

                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    title="Remove from history"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="p-1.5 rounded-lg text-slate-600 group-hover:text-indigo-400 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
