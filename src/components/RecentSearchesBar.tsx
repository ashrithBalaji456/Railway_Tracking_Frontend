import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { searchHistoryService, type SearchHistoryItem } from '../services/searchHistoryService';

interface RecentSearchesBarProps {
  type: 'TRAIN' | 'STATION' | 'ALL';
  limit?: number; // default 5
  onSelect: (code: string, item: SearchHistoryItem) => void;
  className?: string;
}

export default function RecentSearchesBar({
  type,
  limit = 5,
  onSelect,
  className = '',
}: RecentSearchesBarProps) {
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

  if (items.length === 0) return null;

  return (
    <div className={`flex items-center flex-wrap gap-1.5 mt-2.5 text-xs animate-fade-in ${className}`}>
      <span className="flex items-center space-x-1 text-slate-400 font-semibold text-[11px] shrink-0 mr-0.5">
        <Clock className="w-3 h-3 text-indigo-400" />
        <span>Recent:</span>
      </span>

      {items.map((item) => {
        const isTrain = item.type === 'TRAIN';
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.code, item)}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-150 cursor-pointer shadow-sm ${
              isTrain
                ? 'bg-slate-950/90 hover:bg-indigo-950/40 border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200'
                : 'bg-slate-950/90 hover:bg-sky-950/40 border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-200'
            }`}
            title={`${item.title}${item.subtitle ? ` (${item.subtitle})` : ''}`}
          >
            <span
              className={`font-mono font-bold text-[10px] px-1 py-0.2 rounded ${
                isTrain
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {item.code}
            </span>
            <span className="truncate max-w-[130px] font-medium">{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}
