import { useState, useEffect } from 'react';
import { Clock, Trash2, ArrowRight } from 'lucide-react';
import { searchHistoryService, type SearchHistoryItem } from '../services/searchHistoryService';

interface RecentSearchesDropdownProps {
  type: 'TRAIN' | 'STATION' | 'ALL';
  limit?: number; // default 5
  isOpen: boolean;
  onSelect: (code: string, item: SearchHistoryItem) => void;
  onClose?: () => void;
  className?: string;
}

export default function RecentSearchesDropdown({
  type,
  limit = 5,
  isOpen,
  onSelect,
  className = '',
}: RecentSearchesDropdownProps) {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);

  const loadItems = () => {
    const list = searchHistoryService.getHistory(type, limit);
    setItems(list);
  };

  useEffect(() => {
    loadItems();

    const handleUpdate = () => {
      loadItems();
    };

    window.addEventListener('search-history-updated', handleUpdate);
    return () => window.removeEventListener('search-history-updated', handleUpdate);
  }, [type, limit]);

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 mt-2 bg-[#1c212e]/95 border border-white/10 rounded-xl shadow-2xl z-30 backdrop-blur-xl divide-y divide-white/5 animate-fade-in ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2 text-[11px] text-slate-400 bg-slate-900/60 rounded-t-xl">
        <span className="flex items-center space-x-1.5 font-semibold text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Recent {type === 'TRAIN' ? 'Trains' : type === 'STATION' ? 'Stations' : 'Searches'}</span>
        </span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            searchHistoryService.clearHistory(type);
          }}
          className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-[10px] font-medium"
        >
          Clear
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {items.map((item) => {
          const isTrain = item.type === 'TRAIN';

          return (
            <div
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item.code, item);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-white/10 hover:text-sky-300 flex items-center justify-between text-xs transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider font-mono shrink-0 min-w-[50px] text-center border ${
                    isTrain
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/35'
                  }`}
                >
                  {item.code}
                </span>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-slate-100 font-semibold text-xs truncate group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="text-[11px] text-slate-400 truncate">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    searchHistoryService.removeSearch(item.id);
                  }}
                  title="Remove from history"
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-200 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
