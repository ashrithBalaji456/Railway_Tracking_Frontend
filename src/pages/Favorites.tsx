import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Train, Building2, Trash2, AlertCircle, Bell, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Favorites() {
  const [activeTab, setActiveTab] = useState<'BOOKMARKS' | 'ALERTS'>('BOOKMARKS');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const response: any = await api.get('/api/v1/favorites');
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response: any = await api.get('/api/v1/alerts');
      if (response.success && response.data) {
        setAlerts(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delay alerts');
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (activeTab === 'ALERTS') {
      fetchAlerts();
    }
  }, [activeTab]);

  const handleRemoveFavorite = async (id: number) => {
    try {
      const response: any = await api.delete(`/api/v1/favorites/${id}`);
      if (response.success) {
        setFavorites(favorites.filter((f) => f.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove favorite item');
    }
  };

  const handleRemoveAlert = async (id: number) => {
    try {
      const response: any = await api.delete(`/api/v1/alerts/${id}`);
      if (response.success) {
        setAlerts(alerts.filter((a) => a.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete alert setting');
    }
  };

  const favoriteTrains = favorites.filter((f) => f.favoriteType === 'TRAIN');
  const favoriteStations = favorites.filter((f) => f.favoriteType === 'STATION');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-5">
        <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-xl text-indigo-400">
          <Heart className="h-6 w-6 fill-indigo-400/25" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Your Dashboard</h1>
          <p className="text-xs text-slate-455 text-slate-400 mt-0.5">Manage your bookmarked routes and configured delay alarms.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl flex items-center space-x-2 text-red-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('BOOKMARKS')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === 'BOOKMARKS'
              ? 'bg-indigo-650 text-white shadow shadow-indigo-650/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Bookmarks
        </button>
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === 'ALERTS'
              ? 'bg-indigo-650 text-white shadow shadow-indigo-650/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Delay Alerts
        </button>
      </div>

      {/* Bookmarks Tab View */}
      {activeTab === 'BOOKMARKS' && (
        loading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4" />
            <p className="text-sm">Loading bookmarks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Favorite Trains */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-2">
                <Train className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-slate-200">Bookmarked Trains</h3>
              </div>
              <div className="p-4 flex-grow">
                {favoriteTrains.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteTrains.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg flex items-center justify-between group hover:border-slate-750 transition-colors"
                      >
                        <div
                          onClick={() => navigate(`/trains/${t.itemCode}`)}
                          className="flex-grow cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-indigo-400 text-sm">{t.itemCode}</span>
                            <h4 className="font-semibold text-slate-250 text-sm">{t.itemName}</h4>
                          </div>
                          <span className="text-[10px] text-indigo-500 font-bold tracking-wide uppercase mt-1 inline-block">Track live schedule</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFavorite(t.id)}
                          className="text-slate-500 hover:text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-550 space-y-2">
                    <Train className="h-8 w-8 mx-auto opacity-20 text-indigo-400" />
                    <p className="text-xs">No bookmarked trains found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Stations */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-slate-200">Bookmarked Stations</h3>
              </div>
              <div className="p-4 flex-grow">
                {favoriteStations.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteStations.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg flex items-center justify-between group hover:border-slate-750 transition-colors"
                      >
                        <div
                          onClick={() => navigate(`/stations?code=${s.itemCode}`)}
                          className="flex-grow cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded text-[10px] font-bold">{s.itemCode}</span>
                            <h4 className="font-semibold text-slate-250 text-sm">{s.itemName}</h4>
                          </div>
                          <span className="text-[10px] text-indigo-500 font-bold tracking-wide uppercase mt-1 inline-block">Explore departures board</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFavorite(s.id)}
                          className="text-slate-500 hover:text-red-400 p-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-550 space-y-2">
                    <Building2 className="h-8 w-8 mx-auto opacity-20 text-indigo-400" />
                    <p className="text-xs">No bookmarked stations found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Delay Alerts Tab View */}
      {activeTab === 'ALERTS' && (
        alertsLoading ? (
          <div className="text-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4" />
            <p className="text-sm">Loading active delay thresholds...</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-indigo-400 font-bold" />
                <h3 className="font-bold text-slate-200">Configured Delay Alarms</h3>
              </div>
              <button
                onClick={fetchAlerts}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {alerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className="p-5 bg-slate-950/50 border border-slate-850 hover:border-slate-700 transition-colors rounded-xl flex flex-col justify-between gap-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-indigo-400 text-sm">{a.trainNumber}</span>
                            <h4 className="font-bold text-slate-100 text-sm leading-snug">{a.trainName}</h4>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-[11px] text-slate-450 pt-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>Delay Threshold: <span className="font-semibold text-slate-300">{a.thresholdMinutes} mins</span></span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAlert(a.id)}
                          className="text-slate-550 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Warnings notification flags */}
                      <div className="pt-2 border-t border-slate-850/65 flex items-center justify-between text-xs">
                        <span className="text-slate-450">Current delay: <span className="font-bold text-slate-200">{a.currentDelay} mins</span></span>
                        
                        {a.triggered ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-950/60 border border-red-800/40 text-red-400 uppercase tracking-wider animate-pulse">
                            ⚠️ DELAY WARNING
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 uppercase tracking-wider">
                            ✅ Normal Run
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-550 space-y-2">
                  <Bell className="h-8 w-8 mx-auto opacity-20 text-indigo-400" />
                  <p className="text-xs">No active delay alerts configured.</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Click the bell icon next to any train route timetable page to get real-time warning badges.</p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
