import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertTriangle, Play, Navigation, Heart, Bell, Train, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';

export default function TrainDetails() {
  const { trainNumber } = useParams<{ trainNumber: string }>();
  const [searchParams] = useSearchParams();
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dateParam = searchParams.get('date') || getTodayDateString();
  const [selectedJourneyDate, setSelectedJourneyDate] = useState(dateParam);

  const [train, setTrain] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [liveStatus, setLiveStatus] = useState<any>(null);
  
  const [showLive, setShowLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeError, setRouteError] = useState('');
  const [liveError, setLiveError] = useState('');
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [showCoachLayout, setShowCoachLayout] = useState(false);
  
  const [hasAlert, setHasAlert] = useState(false);
  const [alertId, setAlertId] = useState<number | null>(null);
  const [alertMinutes, setAlertMinutes] = useState(15);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const { language, t } = useLanguage();
  const [syncState, setSyncState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'POLLING'>('IDLE');
  const sseRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<number | null>(null);

  const bubbleStationCode = (() => {
    if (!liveStatus) return null;
    const status = (liveStatus.runStatus || liveStatus.status)?.toLowerCase();
    
    if (status === 'reached' || status === 'reached-destination' || status === 'completed') {
      if (route && route.stations && route.stations.length > 0) {
        return route.stations[route.stations.length - 1].stationCode?.toUpperCase();
      }
      return train?.destinationStation?.toUpperCase();
    }

    const firstStation = liveStatus.stations?.[0];
    const hasDepartedFirst = (() => {
      if (!firstStation) return true;
      const seq = firstStation.sequenceNumber || firstStation.sequence;
      if (seq > 1) return true;
      const statusStr = firstStation.status?.toLowerCase();
      return statusStr === 'departed' || 
             statusStr === 'passed' || 
             statusStr === 'skipped' || 
             statusStr === 'completed';
    })();
    const isUnstarted = status === 'not-started' || status === 'scheduled' || (!status && !hasDepartedFirst);

    if (isUnstarted) {
      if (route && route.stations && route.stations.length > 0) {
        return route.stations[0].stationCode?.toUpperCase();
      }
      return train?.sourceStation?.toUpperCase();
    }

    if (liveStatus.currentStationCode) {
      return liveStatus.currentStationCode.toUpperCase();
    }

    return liveStatus.nextStationCode?.toUpperCase();
  })();

  const navigate = useNavigate();

  // Cleanup connections on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Combined fetch of user favorites and alert settings on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !trainNumber) return;

    const checkStatus = async () => {
      try {
        const favResponse: any = await api.get('/api/v1/favorites');
        if (favResponse.success && favResponse.data) {
          const match = favResponse.data.find(
            (f: any) => f.favoriteType === 'TRAIN' && f.itemCode === trainNumber
          );
          if (match) {
            setIsFavorite(true);
            setFavoriteId(match.id);
          }
        }

        const alertResponse: any = await api.get('/api/v1/alerts');
        if (alertResponse.success && alertResponse.data) {
          const match = alertResponse.data.find(
            (a: any) => a.trainNumber === trainNumber
          );
          if (match) {
            setHasAlert(true);
            setAlertId(match.id);
            setAlertMinutes(match.thresholdMinutes);
          }
        }
      } catch (err) {
        console.error('Error checking user settings status', err);
      }
    };

    checkStatus();
  }, [trainNumber]);

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
        const response: any = await api.post('/api/v1/favorites/train', {
          itemCode: trainNumber,
          itemName: train.trainName,
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

  const handleSaveAlert = async () => {
    try {
      const response: any = await api.post('/api/v1/alerts/threshold', {
        trainNumber,
        trainName: train.trainName,
        thresholdMinutes: alertMinutes,
      });

      if (response.success && response.data) {
        setHasAlert(true);
        setAlertId(response.data.id);
        setShowAlertModal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save alert setting');
    }
  };

  const handleDeleteAlert = async () => {
    if (!alertId) return;
    try {
      const response: any = await api.delete(`/api/v1/alerts/${alertId}`);
      if (response.success) {
        setHasAlert(false);
        setAlertId(null);
        setAlertMinutes(15);
        setShowAlertModal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete alert setting');
    }
  };

  // Load Static Details and Route
  useEffect(() => {
    if (!trainNumber) return;

    const fetchTrainData = async () => {
      setLoading(true);
      setError('');
      setRouteError('');
      try {
        const url = `/api/v1/trains/${trainNumber}` + (selectedJourneyDate ? `?journeyDate=${selectedJourneyDate}` : '');
        const detailsResponse: any = await api.get(url);
        if (detailsResponse.success) {
          setTrain(detailsResponse.data);
        }
      } catch (err: any) {
        try {
          const liveUrl = `/api/v1/trains/${trainNumber}/live` + (selectedJourneyDate ? `?journeyDate=${selectedJourneyDate}` : '');
          const liveResponse: any = await api.get(liveUrl);
          if (liveResponse.success && liveResponse.data) {
            const live = liveResponse.data;
            setLiveStatus(live);
            setShowLive(true);
            setSyncState('POLLING');
            setTrain({
              trainNumber: live.trainNumber || trainNumber,
              trainName: live.trainName || `Train ${trainNumber}`,
              trainType: 'Live',
              category: 'LIVE',
              sourceStation: live.currentStationCode || 'Current',
              destinationStation: live.nextStationCode || 'Next',
              distance: null,
              duration: null,
              runningDays: 'Live data only',
            });
            setRouteError('Static train details are unavailable, but RailRadar live telemetry is connected.');
          } else {
            setError(err.message || 'Failed to load train details');
            setLoading(false);
            return;
          }
        } catch (liveErr: any) {
          setError(liveErr.message || err.message || 'Failed to load train details');
          setLoading(false);
          return;
        }
      }

      try {
        const routeUrl = `/api/v1/trains/${trainNumber}/route` + (selectedJourneyDate ? `?journeyDate=${selectedJourneyDate}` : '');
        const routeResponse: any = await api.get(routeUrl);
        if (routeResponse.success) {
          setRoute(routeResponse.data);
          if (routeResponse.data && routeResponse.data.coachPosition) {
            const list = routeResponse.data.coachPosition.split('-');
            const firstCoach = list.find((c: string) => c !== 'ENG');
            if (firstCoach) setSelectedCoach(firstCoach);
          }
        }
      } catch (err: any) {
        setRoute(null);
        setRouteError(err.message || 'RailRadar route data is not available for this train right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainData();
  }, [trainNumber, selectedJourneyDate]);

  const startPolling = () => {
    const poll = async () => {
      try {
        const liveUrl = `/api/v1/trains/${trainNumber}/live` + (selectedJourneyDate ? `?journeyDate=${selectedJourneyDate}` : '');
        const response: any = await api.get(liveUrl);
        if (response.success && response.data) {
          setLiveStatus(response.data);
          setLiveError('');
        }
      } catch (err) {
        console.error('REST polling fallback error', err);
        setLiveError('RailRadar live status is not available right now.');
      }
    };
    poll(); // initial call
    intervalRef.current = window.setInterval(poll, 10000);
  };

  // Load Live Status with SSE and REST fallback
  const handleToggleLive = () => {
    if (syncState !== 'IDLE') {
      // Disconnect
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSyncState('IDLE');
      setShowLive(false);
      setLiveStatus(null);
      return;
    }

    setSyncState('CONNECTING');
    setShowLive(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const sseUrl = `${API_BASE_URL}/api/v1/live-updates/${trainNumber}` + (selectedJourneyDate ? `?journeyDate=${selectedJourneyDate}` : '');
    const sse = new EventSource(sseUrl);
    sseRef.current = sse;

    sse.addEventListener('live-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveStatus(data);
        setSyncState('CONNECTED');
      } catch (err) {
        console.error('Error parsing live update event data', err);
      }
    });

    sse.onerror = (err) => {
      console.warn('SSE stream failed. Switching to fallback REST polling.', err);
      sse.close();
      sseRef.current = null;
      setSyncState('POLLING');
      startPolling();
    };
  };

  const format12Hour = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const formatDelayedTime = (timeStr: string, delayMins: number) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h);
      let min = parseInt(m) + delayMins;
      
      while (min >= 60) {
        min -= 60;
        hour += 1;
      }
      hour = hour % 24;
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      const formattedMin = min < 10 ? `0${min}` : min;
      return `${formattedHour}:${formattedMin} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Group stations into halts and collapsible pass blocks
  interface TimelineHalt {
    type: 'HALT';
    station: any;
  }

  interface TimelinePassThroughBlock {
    type: 'PASS_BLOCK';
    stations: any[];
    id: string;
  }

  type TimelineItem = TimelineHalt | TimelinePassThroughBlock;

  const getTimelineItems = (): TimelineItem[] => {
    if (!route || !route.stations) return [];
    
    const items: TimelineItem[] = [];
    let currentPassBlock: any[] = [];
    let passBlockCounter = 0;

    route.stations.forEach((s: any) => {
      if (s.isHalt) {
        if (currentPassBlock.length > 0) {
          const blockId = `block_${passBlockCounter++}`;
          items.push({
            type: 'PASS_BLOCK',
            id: blockId,
            stations: [...currentPassBlock]
          });
          currentPassBlock = [];
        }
        items.push({
          type: 'HALT',
          station: s
        });
      } else {
        currentPassBlock.push(s);
      }
    });

    if (currentPassBlock.length > 0) {
      const blockId = `block_${passBlockCounter++}`;
      items.push({
        type: 'PASS_BLOCK',
        id: blockId,
        stations: [...currentPassBlock]
      });
    }

    return items;
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4" />
        <p>Loading train profile...</p>
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl flex items-center space-x-2 text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error || 'Train details not found.'}</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const renderRunningDaysList = (runDaysString: string | undefined) => {
    if (!runDaysString) return null;
    const daysMap = [
      { key: 'sun', label: 'S' },
      { key: 'mon', label: 'M' },
      { key: 'tue', label: 'T' },
      { key: 'wed', label: 'W' },
      { key: 'thu', label: 'T' },
      { key: 'fri', label: 'F' },
      { key: 'sat', label: 'S' }
    ];
    const normalized = runDaysString.toLowerCase();
    
    return (
      <div className="flex items-center space-x-1.5 bg-slate-950/50 px-2.5 py-1 rounded-md border border-white/5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Runs:</span>
        <div className="flex items-center space-x-1">
          {daysMap.map((d, i) => {
            const isActive = normalized.includes(d.key) || normalized.includes('daily') || normalized.includes('all') || normalized.includes('live data');
            return (
              <span
                key={i}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border transition-all ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    : 'bg-white/2 text-slate-650 border-white/5'
                }`}
                title={d.key.toUpperCase()}
              >
                {d.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const generateSecondSittingSeats = () => {
    const rows = [];
    const totalRows = 12; // 72 seats total
    for (let r = 0; r < totalRows; r++) {
      const isEvenRow = r % 2 === 1;
      let left, right;
      if (!isEvenRow) {
        // Odd row index (row 1, 3, 5...): snake increments left-to-right
        const startVal = r * 6 + 1;
        left = [startVal, startVal + 1, startVal + 2];
        right = [startVal + 3, startVal + 4, startVal + 5];
      } else {
        // Even row index (row 2, 4, 6...): snake increments right-to-left
        const startVal = r * 6 + 1;
        left = [startVal + 5, startVal + 4, startVal + 3];
        right = [startVal + 2, startVal + 1, startVal];
      }
      rows.push({ left, right });
    }
    return rows;
  };

  const generateSleeperBerths = () => {
    const compartments = [];
    const totalCompartments = 9; // 72 berths total
    for (let c = 0; c < totalCompartments; c++) {
      const startVal = c * 8 + 1;
      compartments.push({
        lower1: startVal,      // Lower
        middle1: startVal + 1,  // Middle
        upper1: startVal + 2,   // Upper
        lower2: startVal + 3,   // Lower
        middle2: startVal + 4,  // Middle
        upper2: startVal + 5,   // Upper
        sideLower: startVal + 6, // Side Lower
        sideUpper: startVal + 7  // Side Upper
      });
    }
    return compartments;
  };

  const getSeatPosition = (seatNum: number, coachType: string) => {
    if (coachType === '2S' || coachType === 'CC') {
      const remainder = (seatNum - 1) % 6;
      if (remainder === 0 || remainder === 5) return 'WINDOW';
      if (remainder === 1 || remainder === 4) return 'MIDDLE';
      return 'AISLE';
    }
    const remainder = (seatNum - 1) % 8;
    if (remainder === 0 || remainder === 3) return 'LOWER';
    if (remainder === 1 || remainder === 4) return 'MIDDLE';
    if (remainder === 2 || remainder === 5) return 'UPPER';
    if (remainder === 6) return 'SIDE LOWER';
    return 'SIDE UPPER';
  };

  const getCoachType = (coachName: string) => {
    if (coachName.startsWith('D')) return '2S'; // Second Sitting
    if (coachName.startsWith('C')) return 'CC'; // Chair Car
    if (coachName.startsWith('S')) return 'SL'; // Sleeper
    if (coachName.startsWith('B') || coachName.startsWith('M')) return '3A'; // AC 3 Tier
    if (coachName.startsWith('A')) return '2A'; // AC 2 Tier
    if (coachName.startsWith('H')) return '1A'; // AC 1st Class
    return coachName;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer bg-slate-900/40 border border-slate-800/80 px-3.5 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400" />
          <span>Back to Previous Page</span>
        </button>
      </div>

      {/* Train Metadata Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">{translateName(train.trainName, language)}</h1>
              <span className="bg-indigo-900/60 border border-indigo-750 text-indigo-400 px-2.5 py-0.5 rounded text-sm font-bold uppercase">{train.trainNumber}</span>
            </div>
            
            <div className="flex items-center space-x-2.5 text-xs text-slate-400">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{train.trainType}</span>
              <span>•</span>
              <span>Category: {train.category}</span>
              <span>•</span>
              {renderRunningDaysList(train.runningDays)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleLive}
              disabled={syncState === 'CONNECTING'}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide border cursor-pointer transition-all ${
                syncState !== 'IDLE' 
                  ? 'bg-amber-600/20 border-amber-500/30 text-amber-400 hover:bg-slate-950' 
                  : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
              }`}
            >
              <Navigation className={`h-4 w-4 ${syncState === 'CONNECTING' ? 'animate-pulse' : ''}`} />
              <span>
                {syncState === 'IDLE' && t('trackLive')}
                {syncState === 'CONNECTING' && t('locating')}
                {syncState === 'CONNECTED' && t('stopTracking')}
                {syncState === 'POLLING' && t('stopTracking')}
              </span>
            </button>

            {route && route.coachPosition && (
              <button
                onClick={() => setShowCoachLayout(!showCoachLayout)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide border cursor-pointer transition-all ${
                  showCoachLayout
                    ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-405 hover:bg-slate-950 shadow-md'
                    : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span className="text-xs">💺</span>
                <span>{showCoachLayout ? 'Hide Seating' : 'Coach Position'}</span>
              </button>
            )}

            <button
              onClick={handleToggleFavorite}
              className={`border p-2 rounded-lg transition-colors cursor-pointer ${
                isFavorite 
                  ? 'bg-red-950/20 border-red-900/30 text-red-500 hover:bg-slate-950' 
                  : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-red-400'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
            </button>

            <button
              onClick={() => {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                  navigate('/login');
                  return;
                }
                setShowAlertModal(true);
              }}
              className={`border p-2 rounded-lg transition-colors cursor-pointer ${
                hasAlert 
                  ? 'bg-amber-950/20 border-amber-900/30 text-amber-500 hover:bg-slate-950' 
                  : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-amber-500'
              }`}
            >
              <Bell className={`h-5 w-5 ${hasAlert ? 'fill-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Route Summary */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between text-sm gap-4">
          <div className="flex items-center space-x-4">
            <div className="text-left">
              <p className="text-xs text-slate-500">{t('origin')}</p>
              <p className="font-semibold text-slate-200">{translateName(train.sourceStation, language)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-650" />
            <div className="text-left">
              <p className="text-xs text-slate-500">{t('destination')}</p>
              <p className="font-semibold text-slate-200">{translateName(train.destinationStation, language)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-8 text-xs text-slate-450">
            <div>
              <p className="text-slate-400">{t('distance')}</p>
              <p className="font-bold text-slate-300">{train.distance != null ? `${train.distance} km` : "--"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t('duration')}</p>
              <p className="font-bold text-slate-300">{train.duration != null ? `${(train.duration / 60).toFixed(1)} hrs` : "--"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Running Status Panel */}
      {showLive && liveStatus && (
        <div className="bg-amber-950/20 border border-amber-900/30 p-6 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-amber-900/20 pb-3">
            <div className="flex items-center space-x-3 text-amber-400 font-bold">
              <Play className="h-4 w-4 fill-amber-400 animate-ping" />
              <span className="uppercase text-sm tracking-wide">{t('liveTelemetry')}</span>
              <div className="flex items-center space-x-1.5 pl-3 border-l border-amber-900/40 text-xs font-semibold text-slate-350">
                {syncState === 'CONNECTED' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{t('liveStream')}</span>
                  </>
                )}
                {syncState === 'CONNECTING' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>{t('syncing')}</span>
                  </>
                )}
                {syncState === 'POLLING' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                    <span>{t('polling')}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-500">
              Updated {new Date(liveStatus.lastUpdatedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500">{t('currentPos')}</p>
              <p className="font-bold text-slate-200 mt-0.5">
                {(() => {
                  const runStatus = (liveStatus.runStatus || liveStatus.status)?.toLowerCase();
                  const firstStation = liveStatus.stations?.[0];
                  const hasDepartedFirst = (() => {
                    if (!firstStation) return true;
                    const seq = firstStation.sequenceNumber || firstStation.sequence;
                    if (seq > 1) return true;
                    const statusStr = firstStation.status?.toLowerCase();
                    return statusStr === 'departed' || 
                           statusStr === 'passed' || 
                           statusStr === 'skipped' || 
                           statusStr === 'completed';
                  })();
                  const isUnstarted = runStatus === 'not-started' || runStatus === 'scheduled' || (!runStatus && !hasDepartedFirst);

                  if (isUnstarted) {
                    const srcName = translateName(liveStatus.stations?.[0]?.stationName || liveStatus.currentStationName || train?.sourceStation || 'Source', language);
                    const srcCode = liveStatus.stations?.[0]?.stationCode || liveStatus.currentStationCode || train?.sourceStation;
                    const codeSuffix = srcCode ? ` (${srcCode})` : '';
                    return `Yet to start from ${srcName}${codeSuffix}`;
                  }
                  if (runStatus === 'reached' || runStatus === 'reached-destination' || runStatus === 'completed') {
                    const destName = translateName(train?.destinationStation || liveStatus.nextStationName || 'Destination', language);
                    return `Reached destination: ${destName}`;
                  }
                  
                  // Map from currentStationCode if available
                  if (liveStatus.currentStationCode) {
                    const matchedStation = route?.stations?.find(
                      (s: any) => s.stationCode?.toUpperCase() === liveStatus.currentStationCode?.toUpperCase()
                    );
                    const stationName = matchedStation 
                      ? translateName(matchedStation.stationName, language) 
                      : translateName(liveStatus.currentStationName, language);

                    const currentStationStatus = liveStatus.stations?.find(
                      (s: any) => s.stationCode?.toUpperCase() === liveStatus.currentStationCode?.toUpperCase()
                    );
                    const prefix = currentStationStatus?.status?.toLowerCase() === 'departed' ? 'Departed' : 'At';
                    return `${prefix} ${stationName} (${liveStatus.currentStationCode})`;
                  }
                  
                  const fallbackVal = translateName(liveStatus.lastLocationInfo, language);
                  return fallbackVal || 'Live position reported by RailRadar';
                })()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('nextStop')}</p>
              <p className="font-bold text-slate-200 mt-0.5">
                {(() => {
                  const runStatus = (liveStatus.runStatus || liveStatus.status)?.toLowerCase();
                  const firstStation = liveStatus.stations?.[0];
                  const hasDepartedFirst = (() => {
                    if (!firstStation) return true;
                    const seq = firstStation.sequenceNumber || firstStation.sequence;
                    if (seq > 1) return true;
                    const statusStr = firstStation.status?.toLowerCase();
                    return statusStr === 'departed' || 
                           statusStr === 'passed' || 
                           statusStr === 'skipped' || 
                           statusStr === 'completed';
                  })();
                  const isUnstarted = runStatus === 'not-started' || runStatus === 'scheduled' || (!runStatus && !hasDepartedFirst);

                  if (runStatus === 'reached' || runStatus === 'reached-destination' || runStatus === 'completed') {
                    return 'Journey Completed';
                  }

                  if (isUnstarted) {
                    const firstStop = liveStatus.stations?.find((s: any) => (s.isHalt || s.halt) && (s.sequenceNumber > 1 || s.sequence > 1));
                    if (firstStop) {
                      return `${translateName(firstStop.stationName, language)} (${firstStop.stationCode})`;
                    }
                  }

                  // Find the next upcoming halt station (always sequence number > 1)
                  const nextHaltStation = liveStatus.stations?.find((s: any) => {
                    const statusStr = s.status?.toLowerCase();
                    return (s.isHalt || s.halt) && 
                           (s.sequenceNumber > 1 || s.sequence > 1) &&
                           statusStr !== 'departed' && 
                           statusStr !== 'passed' && 
                           statusStr !== 'skipped' && 
                           statusStr !== 'completed';
                  });

                  if (nextHaltStation) {
                    return `${translateName(nextHaltStation.stationName, language)} (${nextHaltStation.stationCode})`;
                  }

                  if (!liveStatus.nextStationName || liveStatus.nextStationName === '-') {
                    if (route && route.stations && route.stations.length > 1) {
                      return `${translateName(route.stations[1].stationName, language)} (${route.stations[1].stationCode})`;
                    }
                    return '---';
                  }
                  return `${translateName(liveStatus.nextStationName, language)}${
                    liveStatus.nextStationCode && liveStatus.nextStationCode !== '-' ? ` (${liveStatus.nextStationCode})` : ''
                  }`;
                })()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('delay')}</p>
              <p className={`font-bold mt-0.5 ${liveStatus.delayMinutes > 0 && (liveStatus.runStatus || liveStatus.status)?.toLowerCase() !== 'not-started' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(() => {
                  const runStatus = (liveStatus.runStatus || liveStatus.status)?.toLowerCase();
                  const firstStation = liveStatus.stations?.[0];
                  const hasDepartedFirst = (() => {
                    if (!firstStation) return true;
                    const seq = firstStation.sequenceNumber || firstStation.sequence;
                    if (seq > 1) return true;
                    const statusStr = firstStation.status?.toLowerCase();
                    return statusStr === 'departed' || 
                           statusStr === 'passed' || 
                           statusStr === 'skipped' || 
                           statusStr === 'completed';
                  })();
                  const isUnstarted = runStatus === 'not-started' || runStatus === 'scheduled' || (!runStatus && !hasDepartedFirst);

                  if (isUnstarted) {
                    return 'Scheduled (No Delay)';
                  }
                  return liveStatus.delayMinutes > 0 ? `${liveStatus.delayMinutes} ${t('lateMins')}` : t('onTime');
                })()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('speedBearing')}</p>
              <p className="font-bold text-slate-200 mt-0.5">{(liveStatus.speed != null ? liveStatus.speed : 0)} km/h • {(liveStatus.bearing != null ? liveStatus.bearing : 0)}°</p>
            </div>
          </div>
        </div>
      )}

      {showLive && liveError && (
        <div className="bg-amber-950/20 border border-amber-900/40 text-amber-300 px-4 py-3 rounded-xl text-sm">
          {liveError}
        </div>
      )}

      {/* Coach Layout Section */}
      {showCoachLayout && route && route.coachPosition && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-lg flex items-center space-x-2">
              <span>Coach Position & Seating Layout</span>
            </h3>
            {selectedCoach && (
              <span className="text-xs font-semibold bg-indigo-950 text-indigo-400 px-3 py-1 rounded-full border border-indigo-900/30">
                Selected: {selectedCoach} ({getCoachType(selectedCoach)})
              </span>
            )}
          </div>

          {/* Scrolling Track of Coaches */}
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
            <div className="flex items-end space-x-3 min-w-max px-2 py-2">
              {/* Locomotive Engine graphic */}
              <div className="flex flex-col items-center space-y-1">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 border border-slate-600 h-12 px-4 rounded-lg flex items-center justify-center font-black text-xs relative shadow-md">
                  <div className="absolute -top-1 left-2 w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" />
                  <div className="absolute -top-1 left-5 w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" />
                  <span className="flex items-center space-x-1 select-none">
                    <span>🚂</span>
                    <span className="tracking-widest">ENG</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold">Engine</span>
              </div>

              {/* Guard / Coach sequence */}
              {route.coachPosition.split('-').filter(Boolean).filter((c: string) => c !== 'ENG').map((coachName: string, idx: number) => {
                const isSelected = selectedCoach === coachName;
                const coachSeq = idx + 1;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCoach(coachName);
                      setSelectedSeat(null);
                    }}
                    className={`flex flex-col items-center space-y-1 focus:outline-none cursor-pointer transition-all ${
                      isSelected ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <div
                      className={`h-12 px-3 rounded-lg flex items-center justify-center font-bold text-xs border transition-all shadow-md ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 animate-pulse-subtle'
                          : 'bg-slate-950 text-slate-300 border-slate-850 hover:border-slate-700'
                      }`}
                      style={{ minWidth: '4.5rem' }}
                    >
                      {coachName}
                    </div>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-400 font-extrabold' : 'text-slate-500'}`}>
                      {coachSeq}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seating Layout Area */}
          {selectedCoach && (
            <div className="space-y-4">
              {/* Caution warning matching user screenshot */}
              <div className="bg-red-600 text-white text-[11px] sm:text-xs font-extrabold px-4 py-3 rounded-lg text-center shadow-lg border border-red-700/30 uppercase tracking-wide">
                ⚠️ WARNING! Coach position may not be accurate for certain trains. Please check it once at station
              </div>

              {/* Seat Layout grid container */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 shadow-inner max-w-xl mx-auto">
                <div className="text-center mb-6">
                  <h4 className="text-slate-200 font-bold text-sm">
                    Interactive Layout: Coach {selectedCoach}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click any seat to select or view location information
                  </p>
                </div>

                {/* 3+3 layout (2S/CC) */}
                {(getCoachType(selectedCoach) === '2S' || getCoachType(selectedCoach) === 'CC') && (
                  <div className="space-y-4">
                    {generateSecondSittingSeats().map((row, rowIdx) => (
                      <div key={rowIdx} className="flex justify-between items-center">
                        {/* Left column (3 seats) */}
                        <div className="flex space-x-2">
                          {row.left.map((seatNum) => {
                            const isSelected = selectedSeat === seatNum;
                            const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                            return (
                              <button
                                key={seatNum}
                                onClick={() => setSelectedSeat(seatNum)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-350'
                                }`}
                              >
                                <span className="text-sm font-black">{seatNum}</span>
                                <span className={`text-[7px] font-bold tracking-tighter uppercase mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                  {pos}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Aisle */}
                        <div className="w-8 flex justify-center text-[10px] font-bold text-slate-700 tracking-widest uppercase [writing-mode:vertical-lr] select-none">
                          Aisle
                        </div>

                        {/* Right column (3 seats) */}
                        <div className="flex space-x-2">
                          {row.right.map((seatNum) => {
                            const isSelected = selectedSeat === seatNum;
                            const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                            return (
                              <button
                                key={seatNum}
                                onClick={() => setSelectedSeat(seatNum)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-350'
                                }`}
                              >
                                <span className="text-sm font-black">{seatNum}</span>
                                <span className={`text-[7px] font-bold tracking-tighter uppercase mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                  {pos}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sleeper Layout (SL/3A/2A/1A) */}
                {['SL', '3A', '2A', '1A'].includes(getCoachType(selectedCoach)) && (
                  <div className="space-y-6">
                    {/* Render berths in groups of 8 (compartments) */}
                    {generateSleeperBerths().map((comp, compIdx) => (
                      <div key={compIdx} className="border border-slate-900 rounded-lg p-3 bg-slate-900/30 space-y-3">
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-900 pb-1.5">
                          Compartment {compIdx + 1}
                        </div>

                        <div className="flex justify-between items-center">
                          {/* Left Column: 6 berths in facing layout */}
                          <div className="grid grid-cols-3 gap-2">
                            {/* Bay 1: Lower, Middle, Upper */}
                            <div className="flex flex-col space-y-1.5">
                              {[comp.lower1, comp.middle1, comp.upper1].map((seatNum) => {
                                const isSelected = selectedSeat === seatNum;
                                const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                                return (
                                  <button
                                    key={seatNum}
                                    onClick={() => setSelectedSeat(seatNum)}
                                    className={`w-12 h-11 rounded border flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                        : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-350'
                                    }`}
                                  >
                                    <span className="text-xs font-extrabold">{seatNum}</span>
                                    <span className="text-[7px] font-semibold tracking-tighter uppercase mt-0.5 text-slate-500">
                                      {pos}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Separator / Face space */}
                            <div className="w-4 flex items-center justify-center text-[8px] font-bold text-slate-800 [writing-mode:vertical-lr] select-none">
                              ↔
                            </div>

                            {/* Bay 2: Lower, Middle, Upper */}
                            <div className="flex flex-col space-y-1.5">
                              {[comp.lower2, comp.middle2, comp.upper2].map((seatNum) => {
                                const isSelected = selectedSeat === seatNum;
                                const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                                return (
                                  <button
                                    key={seatNum}
                                    onClick={() => setSelectedSeat(seatNum)}
                                    className={`w-12 h-11 rounded border flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                        : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-355'
                                    }`}
                                  >
                                    <span className="text-xs font-extrabold">{seatNum}</span>
                                    <span className="text-[7px] font-semibold tracking-tighter uppercase mt-0.5 text-slate-500">
                                      {pos}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Aisle */}
                          <div className="w-6 flex justify-center text-[8px] font-bold text-slate-700 tracking-widest uppercase [writing-mode:vertical-lr] select-none">
                            Aisle
                          </div>

                          {/* Right Column: 2 side berths */}
                          <div className="flex flex-col space-y-1.5 pr-1">
                            {[comp.sideLower, comp.sideUpper].map((seatNum) => {
                              const isSelected = selectedSeat === seatNum;
                              const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                              return (
                                <button
                                  key={seatNum}
                                  onClick={() => setSelectedSeat(seatNum)}
                                  className={`w-14 h-11 rounded border flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                      : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-355'
                                  }`}
                                >
                                  <span className="text-xs font-extrabold">{seatNum}</span>
                                  <span className="text-[7px] font-semibold tracking-tighter uppercase mt-0.5 text-slate-500">
                                    {pos}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* General / Pantry / Engine / Guard Car unreserved message */}
                {!['2S', 'CC', 'SL', '3A', '2A', '1A'].includes(getCoachType(selectedCoach)) && (
                  <div className="text-center py-10 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3">
                    <span className="text-4xl select-none">💺</span>
                    <h5 className="font-bold text-slate-300 text-sm">
                      {selectedCoach === 'GEN'
                        ? 'General Unreserved Coach'
                        : selectedCoach === 'PC'
                        ? 'Pantry Car Coach'
                        : selectedCoach === 'SLRD' || selectedCoach === 'EOG'
                        ? 'Guard & Generator Coach'
                        : 'Locomotive Cab'}
                    </h5>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Seat reservation is not available for this coach type. Seats are unreserved and occupied on a first-come, first-served basis.
                    </p>
                  </div>
                )}
              </div>

              {/* Selected seat details card */}
              {selectedSeat !== null && (
                <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl max-w-sm mx-auto text-center space-y-1.5 shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Selected Reservation Info</p>
                  <p className="text-slate-100 font-extrabold text-lg">
                    Coach {selectedCoach} • Seat {selectedSeat}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Position: <span className="font-bold text-indigo-300">{getSeatPosition(selectedSeat, getCoachType(selectedCoach))}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Complete Station Route Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-200 text-lg">{t('routeTimetable')}</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
            {/* Date selector input */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Journey Date:</span>
              <input
                type="date"
                value={selectedJourneyDate}
                onChange={(e) => setSelectedJourneyDate(e.target.value)}
                className="bg-transparent text-slate-200 border-none outline-none font-bold text-xs [color-scheme:dark] cursor-pointer"
              />
            </div>
            <span className="flex items-center space-x-1.5">
              <span className="h-3 w-3 bg-sky-600 rounded-full inline-block border border-slate-900" />
              <span>Halt Station</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 bg-slate-700 rounded-full inline-block" />
              <span>Non-Stopping</span>
            </span>
          </div>
        </div>

        {route && route.stations && route.stations.length > 0 ? (
          <div className="relative pl-6 sm:pl-10 py-4 max-w-4xl mx-auto">
            {/* The vertical timeline blue line */}
            <div className="absolute left-[88px] sm:left-[118px] top-4 bottom-4 w-1.5 bg-sky-600 rounded-full" />

            <div className="space-y-1">
              {getTimelineItems().map((item) => {
                if (item.type === 'HALT') {
                  const s = item.station;
                  const liveStop = liveStatus?.stations?.find(
                    (ls: any) => ls.stationCode?.toUpperCase() === s.stationCode?.toUpperCase()
                  );
                  const isTrainHere = showLive && bubbleStationCode === s.stationCode?.toUpperCase();

                  return (
                    <div key={s.sequenceNumber} className="grid grid-cols-12 gap-4 items-center py-6 relative">
                      {/* 1. Arrival Timing (Left) */}
                      <div className="col-span-3 text-right pr-2">
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          {s.arrivalTime ? format12Hour(s.arrivalTime) : '---'}
                        </div>
                        {showLive && liveStop && liveStop.delayMinutes > 0 && s.arrivalTime && (
                          <div className="text-[10px] sm:text-xs text-red-500 font-bold mt-0.5 leading-none">
                            {formatDelayedTime(s.arrivalTime, liveStop.delayMinutes)}
                          </div>
                        )}
                      </div>

                      {/* 2. Timeline indicator dot */}
                      <div className="col-span-1 flex justify-center relative">
                        <div className="h-5 w-5 rounded-full bg-slate-900 border-4 border-sky-600 z-10 flex items-center justify-center relative">
                          <div className="h-2.5 w-2.5 bg-sky-400 rounded-full" />
                          
                          {/* Pulsing glow if this is active stop */}
                          {isTrainHere && (
                            <div className="absolute -inset-2 bg-sky-500/30 rounded-full animate-ping" />
                          )}
                        </div>

                        {/* Train Icon bubble sliding above/on the dot */}
                        {isTrainHere && (
                          <div className="absolute -top-14 z-20 bg-gradient-to-br from-sky-400 to-sky-600 text-white w-11 h-11 rounded-full shadow-xl shadow-sky-500/35 border-2 border-slate-900 animate-bounce flex items-center justify-center">
                            <Train className="h-5.5 w-5.5" />
                            <span className="absolute -bottom-1.5 bg-sky-950 text-[7px] font-black px-1 rounded uppercase tracking-wider border border-sky-400 select-none">Live</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Station name, platform (6 cols) */}
                      <div className="col-span-5 pl-2">
                        <h4 className="font-bold text-sm sm:text-base text-slate-100">{translateName(s.stationName, language)}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] sm:text-xs text-slate-400">
                          <span className="font-semibold text-slate-400">
                            {s.distance !== undefined && s.distance !== null ? `${s.distance} km` : `${s.sequenceNumber * 80} km`}
                          </span>
                          {s.platform && (
                            <span className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] font-bold">
                              Platform {s.platform}
                            </span>
                          )}
                          {s.haltMinutes > 0 && (
                            <span className="text-indigo-400 font-semibold">{s.haltMinutes} mins halt</span>
                          )}
                          {s.speedToNextStationKmph !== undefined && s.speedToNextStationKmph !== null && s.speedToNextStationKmph > 0 && (
                            <span className="bg-amber-950/40 text-amber-400 px-1.5 py-0.5 rounded border border-amber-900/30 text-[9px] font-bold flex items-center space-x-1">
                              <span>⚡</span>
                              <span>{s.speedToNextStationKmph} km/h</span>
                            </span>
                          )}
                          {showLive && liveStop && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border transition-all ${
                              liveStop.status?.toLowerCase() === 'departed'
                                ? 'bg-indigo-950/40 border-indigo-900/30 text-indigo-400'
                                : liveStop.status?.toLowerCase() === 'arrived'
                                ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}>
                              {liveStop.status || 'Scheduled'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4. Departure Timing (Right) */}
                      <div className="col-span-3 text-right">
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          {s.departureTime ? format12Hour(s.departureTime) : '---'}
                        </div>
                        {showLive && liveStop && liveStop.delayMinutes > 0 && s.departureTime && (
                          <div className="text-[10px] sm:text-xs text-red-500 font-bold mt-0.5 leading-none">
                                      {formatDelayedTime(s.departureTime, liveStop.delayMinutes)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          } else {
                            const isExpanded = !!expandedBlocks[item.id];
                            const isTrainInBlock = showLive && item.stations?.some(
                              (ps: any) => ps.stationCode?.toUpperCase() === bubbleStationCode
                            );

                            return (
                              <div key={item.id} className="my-1">
                                {/* Collapse/Expand Toggle Row */}
                                <div className="grid grid-cols-12 gap-4 items-center py-2 relative">
                                  <div className="col-span-3" />

                                  <div className="col-span-1 flex justify-center relative">
                                    <div className="h-6 w-1 border-r border-dashed border-sky-600/60" />

                                    {/* Pulsing indicator if train is in this collapsed block */}
                                    {!isExpanded && isTrainInBlock && (
                                      <div className="absolute top-1/2 -translate-y-1/2 z-20 bg-gradient-to-br from-sky-400 to-sky-600 text-white w-9 h-9 rounded-full shadow-lg shadow-sky-500/35 border-2 border-slate-900 animate-bounce flex items-center justify-center">
                                        <Train className="h-4.5 w-4.5" />
                                        <span className="absolute -bottom-1 bg-sky-950 text-[6px] font-black px-1 rounded uppercase tracking-wider border border-sky-400 select-none">Live</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="col-span-8 text-left pl-2">
                                    <button
                                      onClick={() => toggleBlock(item.id)}
                                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-sky-950/40 border border-sky-900/30 cursor-pointer transition-all hover:bg-sky-900/20"
                                    >
                                      <span>{isExpanded ? 'Hide' : 'Show'} {item.stations.length} non-stopping stations</span>
                                      <ChevronDown className={`h-3.5 w-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                      {!isExpanded && isTrainInBlock && (
                                        <span className="ml-2 bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider animate-pulse border border-sky-500/30">
                                          Train is here
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Render pass-through stations list */}
                                {isExpanded && (
                                  <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl space-y-1.5 my-2">
                                    {item.stations.map((passStation: any) => {
                                      const isTrainAtPassStation = showLive && bubbleStationCode === passStation.stationCode?.toUpperCase();
                                      return (
                                        <div key={passStation.sequenceNumber} className="grid grid-cols-12 gap-4 items-center py-2 relative">
                                          {/* Arrival timing */}
                                          <div className="col-span-3 text-right pr-2">
                                            <span className="text-[10px] sm:text-xs text-slate-400">
                                              {passStation.arrivalTime ? format12Hour(passStation.arrivalTime) : '---'}
                                            </span>
                                          </div>

                                          {/* Dot / Live train bubble */}
                                          <div className="col-span-1 flex justify-center relative">
                                            {isTrainAtPassStation ? (
                                              <div className="h-5 w-5 rounded-full bg-slate-900 border-4 border-sky-600 z-10 flex items-center justify-center relative">
                                                <div className="h-2.5 w-2.5 bg-sky-400 rounded-full" />
                                                <div className="absolute -inset-2 bg-sky-500/30 rounded-full animate-ping" />

                                                <div className="absolute -top-14 z-20 bg-gradient-to-br from-sky-400 to-sky-600 text-white w-11 h-11 rounded-full shadow-xl shadow-sky-500/35 border-2 border-slate-900 animate-bounce flex items-center justify-center">
                                                  <Train className="h-5.5 w-5.5" />
                                                  <span className="absolute -bottom-1.5 bg-sky-950 text-[7px] font-black px-1 rounded uppercase tracking-wider border border-sky-400 select-none">Live</span>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="h-2.5 w-2.5 bg-slate-700 rounded-full border border-slate-900 z-10" />
                                            )}
                                          </div>

                                          {/* Station details */}
                                          <div className="col-span-5 pl-2 text-left">
                                            <span className="font-semibold text-xs sm:text-sm text-slate-300">
                                              {translateName(passStation.stationName, language)}
                                            </span>
                                            <span className="text-[9px] text-slate-500 ml-2">
                                              {passStation.distance !== undefined && passStation.distance !== null ? `${passStation.distance} km` : `${passStation.sequenceNumber * 80} km`}
                                            </span>
                                            {passStation.speedToNextStationKmph !== undefined && passStation.speedToNextStationKmph !== null && passStation.speedToNextStationKmph > 0 && (
                                              <span className="text-[9px] text-amber-500 font-bold ml-2">
                                                ⚡ {passStation.speedToNextStationKmph} km/h
                                              </span>
                                            )}
                                          </div>

                                          {/* Departure timing */}
                                          <div className="col-span-3 text-right">
                                            <span className="text-[10px] sm:text-xs text-slate-400">
                                              {passStation.departureTime ? format12Hour(passStation.departureTime) : '---'}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500">
                      <p>{routeError || 'No route schedule mapping available.'}</p>
                    </div>
                  )}
      </div>
      {/* Alert settings modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold border-b border-slate-800 pb-3">
              <Bell className="h-5 w-5 fill-indigo-500/20" />
              <h3 className="text-lg text-slate-100 font-bold">Delay Alert Settings</h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-slate-4-00 text-slate-400">Receive a warning badge when delay exceeds:</p>
              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                <input
                  type="number"
                  min="1"
                  value={alertMinutes}
                  onChange={(e) => setAlertMinutes(parseInt(e.target.value) || 1)}
                  className="bg-transparent text-slate-100 font-bold text-lg w-20 outline-none"
                />
                <span className="text-slate-450 text-sm">minutes</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              {hasAlert ? (
                <button
                  onClick={handleDeleteAlert}
                  className="text-red-400 hover:text-red-300 text-xs font-semibold hover:underline cursor-pointer"
                >
                  Remove Alert
                </button>
              ) : (
                <span />
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-850"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAlert}
                  className="bg-indigo-650 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow shadow-indigo-650/15 cursor-pointer"
                >
                  Save Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Live Status Bottom Banner */}
      {showLive && liveStatus && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[90%] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl z-40 flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 animate-pulse">
              <Train className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">{t('currentPos') || 'Current Position'}</p>
              <p className="text-sm font-bold text-sky-400 mt-0.5">{translateName(liveStatus.lastLocationInfo, language)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs bg-slate-950 text-slate-400 px-2.5 py-1.5 rounded-lg border border-slate-800 font-bold">
              {(liveStatus.speed != null ? liveStatus.speed : 0)} km/h
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


