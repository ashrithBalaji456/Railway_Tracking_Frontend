import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Search, Train, RefreshCw, AlertCircle, MapPin, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function MapTracker() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const trainParam = searchParams.get('train') || '';

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  
  const [routeData, setRouteData] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [syncState, setSyncState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'POLLING'>('IDLE');
  const sseRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stationsGroupRef = useRef<L.LayerGroup | null>(null);
  const trainGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on India
    const map = L.map(mapContainerRef.current, {
      zoomControl: false // Custom zoom position later or default
    }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    stationsGroupRef.current = L.layerGroup().addTo(map);
    trainGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const formatDelay = (minutes: number) => {
    if (!minutes || minutes <= 0) return 'On Time';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''} (${minutes} mins)` : `${mins} mins`;
  };

  const formatDelayForPopup = (minutes: number) => {
    if (!minutes || minutes <= 0) return '<span style="color: #16A34A; font-weight: bold;">On Time</span>';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = hrs > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}` : `${mins} mins`;
    return `<span style="color: #DC2626; font-weight: bold;">${timeStr} (${minutes} mins)</span>`;
  };

  // Handle Map container resize and invalidate Leaflet size
  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.unobserve(container);
    };
  }, [routeData]);

  // Debounced Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response: any = await api.get(`/api/v1/trains?query=${query}`);
        if (response.success && response.data) {
          setSearchResults(response.data);
        }
      } catch (err) {
        console.error('Error searching trains', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Load selected train route and live status
  useEffect(() => {
    if (!trainParam) {
      setSyncState('IDLE');
      setSelectedTrain(null);
      setRouteData(null);
      setLiveData(null);
      return;
    }

    const fetchMapTelemetry = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch details
        const detailsResp: any = await api.get(`/api/v1/trains/${trainParam}`);
        if (detailsResp.success) {
          setSelectedTrain(detailsResp.data);
        }

        // 2. Fetch complete route geometry
        const routeResp: any = await api.get(`/api/v1/trains/${trainParam}/route`);
        if (routeResp.success) {
          setRouteData(routeResp.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve train map telemetry');
      } finally {
        setLoading(false);
      }
    };

    fetchMapTelemetry();

    // Setup Live Updates via SSE + Polling Fallback
    setSyncState('CONNECTING');
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const sse = new EventSource(`${API_BASE_URL}/api/v1/live-updates/${trainParam}`);
    sseRef.current = sse;

    sse.addEventListener('live-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveData(data);
        setSyncState('CONNECTED');
      } catch (err) {
        console.error('Error parsing live update event data', err);
      }
    });

    const startPolling = () => {
      const poll = async () => {
        try {
          const response: any = await api.get(`/api/v1/trains/${trainParam}/live`);
          if (response.success && response.data) {
            setLiveData(response.data);
          }
        } catch (err) {
          console.error('REST polling fallback error', err);
        }
      };
      poll(); // initial call
      intervalRef.current = window.setInterval(poll, 10000);
    };

    sse.onerror = (err) => {
      console.warn('SSE stream failed on map. Switching to fallback REST polling.', err);
      sse.close();
      sseRef.current = null;
      setSyncState('POLLING');
      startPolling();
    };

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [trainParam]);

  // Render Route and Live Position on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeData) return;

    // Clear previous layers
    if (stationsGroupRef.current) stationsGroupRef.current.clearLayers();
    if (trainGroupRef.current) trainGroupRef.current.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Filter stations that have valid coordinates
    const pathCoordinates: L.LatLngExpression[] = [];
    const bounds: L.LatLngBounds = L.latLngBounds([]);

    // Draw Station Markers
    routeData.stations.forEach((s: any) => {
      if (s.latitude && s.longitude) {
        const pos: L.LatLngExpression = [s.latitude, s.longitude];
        pathCoordinates.push(pos);
        bounds.extend(pos);

        // Customize marker based on halt status
        const color = s.isHalt ? '#10B981' : '#64748B'; // Emerald vs Slate
        const radius = s.isHalt ? 6 : 4;

        const stationMarker = L.circleMarker(pos, {
          radius,
          fillColor: color,
          color: '#0F172A', // border slate-900
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });

        // Add popup details
        stationMarker.bindPopup(`
          <div style="font-family: sans-serif; color: #1E293B;">
            <div style="font-weight: bold; font-size: 14px;">${s.stationName} (${s.stationCode})</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Sequence Stop: #${s.sequenceNumber}</div>
            <div style="margin-top: 6px; font-size: 12px; font-weight: 550;">
              ${s.isHalt 
                ? `Halt Duration: ${s.haltMinutes} mins<br/>Scheduled Arr: ${s.arrivalTime?.substring(0,5)} | Dep: ${s.departureTime?.substring(0,5)}` 
                : 'Pass-Through (No Halt)'
              }
            </div>
          </div>
        `);

        if (stationsGroupRef.current) {
          stationsGroupRef.current.addLayer(stationMarker);
        }
      }
    });

    // Draw Route Polyline
    if (pathCoordinates.length > 1) {
      polylineRef.current = L.polyline(pathCoordinates, {
        color: '#6366F1', // indigo-500
        weight: 3.5,
        opacity: 0.7,
        dashArray: '2, 6'
      }).addTo(map);
    }

    // Draw Current Live Train Position
    let trainPos: L.LatLngExpression | null = null;
    if (liveData) {
      if (liveData.latitude && liveData.longitude) {
        trainPos = [liveData.latitude, liveData.longitude];
      } else if (liveData.currentStationCode && routeData && routeData.stations) {
        const currentStation = routeData.stations.find(
          (s: any) => s.stationCode.toUpperCase() === liveData.currentStationCode.toUpperCase()
        );
        if (currentStation && currentStation.latitude && currentStation.longitude) {
          trainPos = [currentStation.latitude, currentStation.longitude];
        }
      }
    }

    if (trainPos) {
      bounds.extend(trainPos);

      // Stylized Pulsing SVG Train Icon
      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-30 animate-ping"></span>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-650 border border-slate-100 text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const trainMarker = L.marker(trainPos, { icon: trainIcon });

      trainMarker.bindPopup(`
        <div style="font-family: sans-serif; color: #1E293B; width: 180px;">
          <div style="font-weight: 800; font-size: 14px; color: #4F46E5;">${liveData.trainName}</div>
          <div style="font-size: 11px; font-weight: bold; color: #475569; margin-top: 1px;">#${liveData.trainNumber}</div>
          <hr style="margin: 8px 0; border: 0; border-top: 1px solid #E2E8F0;"/>
          <div style="font-size: 12px; line-height: 1.5;">
            <p><strong>Status:</strong> <span style="color: #D97706;">${liveData.runStatus}</span></p>
            <p><strong>Location:</strong> ${liveData.lastLocationInfo}</p>
            <p><strong>Delay:</strong> ${formatDelayForPopup(liveData.delayMinutes)}</p>
            <p><strong>Speed:</strong> ${liveData.speed != null ? `${liveData.speed} km/h` : '--'}</p>
          </div>
        </div>
      `);

      if (trainGroupRef.current) {
        trainGroupRef.current.addLayer(trainMarker);
      }

      // Open popup automatically
      trainMarker.openPopup();
    }

    // Fit map bounds to show route
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

  }, [routeData, liveData]);

  const selectTrain = (trainNumber: string) => {
    setSearchParams({ train: trainNumber });
    setQuery('');
    setSearchResults([]);
  };

  const handleRefreshTelemetry = async () => {
    if (!trainParam) return;
    try {
      const liveResp: any = await api.get(`/api/v1/trains/${trainParam}/live`);
      if (liveResp.success && liveResp.data) {
        setLiveData(liveResp.data);
      }
    } catch (err) {
      console.error('Error refreshing telemetry', err);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="flex flex-col md:flex-row h-[700px] md:h-[calc(100vh-10rem)] min-h-[500px] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900/60">
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 lg:w-96 h-[300px] md:h-full bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        {/* Search Panel */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/20">
          <h3 className="font-bold text-slate-200 text-sm tracking-wide uppercase flex items-center space-x-2">
            <Train className="h-4 w-4 text-indigo-400" />
            <span>Search Train to Map</span>
          </h3>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg w-full pl-9 pr-3 py-2 text-slate-200 outline-none transition-all placeholder:text-slate-650 text-xs"
              placeholder="Enter train number/name (e.g. 12760)"
            />

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto z-30">
                {searchResults.map((t) => (
                  <button
                    key={t.trainNumber}
                    onClick={() => selectTrain(t.trainNumber)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-800 border-b border-slate-850 last:border-b-0 flex items-center justify-between text-xs group"
                  >
                    <div>
                      <span className="font-bold text-indigo-400 mr-1.5">{t.trainNumber}</span>
                      <span className="text-slate-200">{t.trainName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">{t.trainType}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Train & Live Status Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-2" />
              <p className="text-xs">Loading route geometry...</p>
            </div>
          ) : error ? (
            <div className="bg-red-950/30 border border-red-900/30 p-3 rounded-lg flex items-center space-x-2 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : selectedTrain && routeData ? (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="space-y-1 bg-slate-950/45 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-100 text-sm leading-snug">{selectedTrain.trainName}</h4>
                  <span className="bg-indigo-950 text-indigo-400 border border-indigo-850 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">{selectedTrain.trainNumber}</span>
                </div>
                <p className="text-[11px] text-slate-450">{selectedTrain.sourceStation} → {selectedTrain.destinationStation}</p>
              </div>

              {/* Live telemetry values */}
              {liveData ? (
                <div className="bg-amber-950/15 border border-amber-900/20 p-3 rounded-lg space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-amber-900/10 pb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                      {syncState === 'CONNECTED' && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-emerald-450">Streaming Live</span>
                        </>
                      )}
                      {syncState === 'CONNECTING' && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="text-amber-500">Connecting...</span>
                        </>
                      )}
                      {syncState === 'POLLING' && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                          <span className="text-slate-400">Polling Fallback</span>
                        </>
                      )}
                    </span>
                    <button
                      onClick={handleRefreshTelemetry}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-slate-450">Current Position: <span className="text-slate-200 font-medium">{liveData.lastLocationInfo}</span></p>
                    <p className="text-slate-450">Delay: <span className={`font-semibold ${liveData.delayMinutes > 0 ? 'text-amber-400' : 'text-emerald-450'}`}>{formatDelay(liveData.delayMinutes)}</span></p>
                    <p className="text-slate-450">Speed: <span className="text-slate-200 font-medium">{liveData.speed != null ? `${liveData.speed} km/h` : '--'}</span></p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/20 border border-slate-800/80 p-3 rounded-lg text-[11px] text-slate-500 text-center py-5">
                  <p>No active telemetry for this train run. Click markers on the map to inspect static halts schedule.</p>
                </div>
              )}

              {/* Station sequence listing */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-350 text-[11px] uppercase tracking-wider">Stations along Route</h5>
                <div className="relative border-l-2 border-slate-800 ml-2.5 pl-4 space-y-3">
                  {routeData.stations.map((s: any) => (
                    <div key={s.sequenceNumber} className="relative group text-xs">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full border border-slate-900 ${s.isHalt ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-200">{s.stationName} <span className="text-[10px] text-slate-500 uppercase font-medium">{s.stationCode}</span></div>
                        <div className="text-[10px] text-slate-400">
                          {s.isHalt ? s.arrivalTime?.substring(0, 5) || s.departureTime?.substring(0, 5) : 'Pass'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-600 space-y-2">
              <MapPin className="h-8 w-8 mx-auto opacity-35 text-indigo-400" />
              <p className="text-xs">Select a train to see the route polyline and live location.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Interactive Leaflet Map */}
      <div ref={mapContainerRef} className="flex-1 h-[400px] md:h-full z-10 bg-slate-950"></div>
    </div>
  </div>
  );
}
