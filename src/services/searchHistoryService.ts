import api from './api';

export interface SearchHistoryItem {
  id: string;
  backendId?: number;
  type: 'TRAIN' | 'STATION';
  code: string;
  title: string;
  subtitle?: string;
  timestamp: number;
}

const STORAGE_KEY = 'rail_search_history';

class SearchHistoryService {
  private getStorage(): SearchHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveStorage(items: SearchHistoryItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
      window.dispatchEvent(new CustomEvent('search-history-updated'));
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  }

  public getHistory(type: 'TRAIN' | 'STATION' | 'ALL' = 'ALL', limit?: number): SearchHistoryItem[] {
    const all = this.getStorage();
    const filtered = type === 'ALL' 
      ? all 
      : all.filter((item) => item.type.toUpperCase() === type.toUpperCase());
    
    // Sort most recent first
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (limit && limit > 0) {
      return filtered.slice(0, limit);
    }
    return filtered;
  }

  public addSearch(entry: {
    type: 'TRAIN' | 'STATION';
    code: string;
    title: string;
    subtitle?: string;
  }): SearchHistoryItem {
    const all = this.getStorage();
    const cleanType = entry.type.toUpperCase() as 'TRAIN' | 'STATION';
    const cleanCode = entry.code.trim().toUpperCase();

    // Deduplicate: remove older search for the same item
    const remaining = all.filter(
      (item) => !(item.type.toUpperCase() === cleanType && item.code.trim().toUpperCase() === cleanCode)
    );

    const newItem: SearchHistoryItem = {
      id: `${cleanType}_${cleanCode}_${Date.now()}`,
      type: cleanType,
      code: cleanCode,
      title: entry.title.trim(),
      subtitle: entry.subtitle?.trim() || undefined,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...remaining];
    this.saveStorage(updated);

    // Sync with backend if logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.post('/api/v1/history', {
        searchType: cleanType,
        itemCode: cleanCode,
        itemName: entry.title.trim(),
        subtitle: entry.subtitle?.trim() || '',
      })
      .then((res: any) => {
        if (res.success && res.data && res.data.id) {
          newItem.backendId = res.data.id;
          this.saveStorage([newItem, ...remaining]);
        }
      })
      .catch((err) => {
        console.warn('Could not sync search history to server', err);
      });
    }

    return newItem;
  }

  public removeSearch(id: string): void {
    const all = this.getStorage();
    const target = all.find((item) => item.id === id);
    const updated = all.filter((item) => item.id !== id);
    this.saveStorage(updated);

    if (target?.backendId) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        api.delete(`/api/v1/history/${target.backendId}`).catch(() => {});
      }
    }
  }

  public clearHistory(type: 'TRAIN' | 'STATION' | 'ALL' = 'ALL'): void {
    if (type === 'ALL') {
      this.saveStorage([]);
    } else {
      const all = this.getStorage();
      const updated = all.filter((item) => item.type.toUpperCase() !== type.toUpperCase());
      this.saveStorage(updated);
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      api.delete(`/api/v1/history?type=${type}`).catch(() => {});
    }
  }

  public async syncWithServer(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res: any = await api.get('/api/v1/history?type=ALL&limit=50');
      if (res.success && Array.isArray(res.data)) {
        const local = this.getStorage();
        const serverItems: SearchHistoryItem[] = res.data.map((d: any) => ({
          id: `${d.searchType}_${d.itemCode}_${new Date(d.searchedAt).getTime()}`,
          backendId: d.id,
          type: d.searchType as 'TRAIN' | 'STATION',
          code: d.itemCode,
          title: d.itemName,
          subtitle: d.subtitle || undefined,
          timestamp: new Date(d.searchedAt).getTime(),
        }));

        // Merge keeping the latest timestamp
        const map = new Map<string, SearchHistoryItem>();
        [...local, ...serverItems].forEach((item) => {
          const key = `${item.type}_${item.code.toUpperCase()}`;
          const existing = map.get(key);
          if (!existing || item.timestamp > existing.timestamp) {
            map.set(key, item);
          }
        });

        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        this.saveStorage(merged);
      }
    } catch (err) {
      console.warn('Failed to sync search history', err);
    }
  }
}

export const searchHistoryService = new SearchHistoryService();
