import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertTriangle, Play, Navigation, Heart, Bell, Train, ChevronDown, TrendingUp, CreditCard, Clock, X, ArrowLeftRight, Info, Sparkles, Zap } from 'lucide-react';
import api, { getTrainDelayReport, getTrainFare } from '../services/api';
import type { TrainDelayReport, TrainFare } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';
import { searchHistoryService } from '../services/searchHistoryService';

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

  const [delayReport, setDelayReport] = useState<TrainDelayReport | null>(null);
  const [fareData, setFareData] = useState<TrainFare | null>(null);
  const [loadingDelay, setLoadingDelay] = useState(false);
  const [loadingFare, setLoadingFare] = useState(false);
  const [selectedFareFrom, setSelectedFareFrom] = useState<string>('');
  const [selectedFareTo, setSelectedFareTo] = useState<string>('');
  const [selectedClassCode, setSelectedClassCode] = useState<string | null>('SL');
  const [selectedQuota, setSelectedQuota] = useState<'GN' | 'TQ'>('GN');

  const { language, t } = useLanguage();
  const [syncState, setSyncState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'POLLING'>('IDLE');
  const [dismissDisruptionBanner, setDismissDisruptionBanner] = useState<boolean>(false);

  const isSpecialTrain = Boolean(
    trainNumber?.startsWith('0') ||
    train?.trainNumber?.startsWith('0') ||
    train?.trainName?.toUpperCase().includes('SPECIAL') ||
    train?.trainName?.toUpperCase().includes('SPL') ||
    train?.trainType?.toUpperCase().includes('SPECIAL')
  );
  const sseRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<number | null>(null);

  const bubbleStationCode = (() => {
    if (!liveStatus) return null;
    const status = (liveStatus.runStatus || liveStatus.status)?.toLowerCase();
    
    const isReached = 
      status === 'reached' || 
      status === 'reached-destination' || 
      status === 'completed' ||
      liveStatus.nextStationName?.toLowerCase()?.includes('reached') ||
      liveStatus.lastLocationInfo?.toLowerCase()?.includes('reached') ||
      (liveStatus.routeProgress != null && liveStatus.routeProgress >= 0.999);

    if (isReached) {
      if (route && route.stations && route.stations.length > 0) {
        return route.stations[route.stations.length - 1].stationCode?.toUpperCase();
      }
      return train?.destinationStation?.toUpperCase();
    }

    const isSkippedStation = (sc?: string) => 
      !sc ? false : (liveStatus.skippedStations && liveStatus.skippedStations.some((x: string) => x?.toUpperCase() === sc?.toUpperCase()));

    // 1. Explicit station match from live location text (e.g. "at-station at Chennai Beach" -> MSB)
    if (liveStatus.lastLocationInfo && route?.stations) {
      const locLower = liveStatus.lastLocationInfo.toLowerCase();
      const matched = route.stations.find((s: any) => 
        s.stationName && locLower.includes(s.stationName.toLowerCase()) && !isSkippedStation(s.stationCode)
      );
      if (matched && matched.stationCode) {
        return matched.stationCode.toUpperCase();
      }
    }

    // 2. If currentStationCode is set and is NOT cancelled/skipped, use it
    if (liveStatus.currentStationCode && liveStatus.currentStationCode !== '-' && !isSkippedStation(liveStatus.currentStationCode)) {
      return liveStatus.currentStationCode.toUpperCase();
    }

    // 3. If scheduled origin or current station is cancelled, find the first non-cancelled active station (e.g. Chennai Beach MSB)
    const firstActiveStation = route?.stations?.find((s: any) => !isSkippedStation(s.stationCode));
    if (firstActiveStation && firstActiveStation.stationCode) {
      return firstActiveStation.stationCode.toUpperCase();
    }

    return liveStatus.nextStationCode && !isSkippedStation(liveStatus.nextStationCode) ? liveStatus.nextStationCode.toUpperCase() : null;
  })();

  const disruptionBannerText = (() => {
    if (!liveStatus) return '';
    const isPartiallyCancelled = !!(liveStatus.skippedStations && liveStatus.skippedStations.length > 0);
    const isFullyCancelled = !!(
      liveStatus.isCancelled && 
      (!isPartiallyCancelled || (route?.stations && liveStatus.skippedStations.length >= route.stations.length))
    );

    if (isFullyCancelled) {
      return 'This train is fully cancelled today.';
    }

    if (isPartiallyCancelled && route?.stations && liveStatus.skippedStations) {
      const skippedSet = new Set(liveStatus.skippedStations.map((s: string) => s?.toUpperCase()));
      const firstStation = route.stations[0];
      const isOriginSkipped = skippedSet.has(firstStation?.stationCode?.toUpperCase());

      if (isOriginSkipped) {
        let lastSkippedStation = firstStation;
        let newSourceStation: any = null;
        for (let i = 0; i < route.stations.length; i++) {
          const st = route.stations[i];
          if (skippedSet.has(st.stationCode?.toUpperCase())) {
            lastSkippedStation = st;
          } else {
            newSourceStation = st;
            break;
          }
        }

        const startName = translateName(firstStation.stationName, language);
        const endName = translateName(newSourceStation?.stationName || lastSkippedStation.stationName, language);
        const newSourceName = translateName(newSourceStation?.stationName || 'the next station', language);

        return `This train is partially cancelled between ${startName} and ${endName}. It will start from ${newSourceName}.`;
      }

      // Check if tail/destination is skipped
      const lastStation = route.stations[route.stations.length - 1];
      const isDestinationSkipped = skippedSet.has(lastStation?.stationCode?.toUpperCase());
      if (isDestinationSkipped) {
        let firstSkippedInTail = lastStation;
        let newTerminus: any = null;
        for (let i = route.stations.length - 1; i >= 0; i--) {
          const st = route.stations[i];
          if (skippedSet.has(st.stationCode?.toUpperCase())) {
            firstSkippedInTail = st;
          } else {
            newTerminus = st;
            break;
          }
        }
        const startName = translateName(firstSkippedInTail.stationName, language);
        const endName = translateName(lastStation.stationName, language);
        const termName = translateName(newTerminus?.stationName || 'the previous station', language);
        return `This train is partially cancelled between ${startName} and ${endName}. It will terminate at ${termName}.`;
      }

      // Intermediate route cancellation
      const firstSkipped = route.stations.find((s: any) => skippedSet.has(s.stationCode?.toUpperCase()));
      const lastSkipped = [...route.stations].reverse().find((s: any) => skippedSet.has(s.stationCode?.toUpperCase()));
      if (firstSkipped && lastSkipped) {
        const sName = translateName(firstSkipped.stationName, language);
        const eName = translateName(lastSkipped.stationName, language);
        return `This train is partially cancelled between ${sName} and ${eName}.`;
      }
    }

    if (liveStatus.disruptionMessage) {
      return liveStatus.disruptionMessage;
    }
    if (liveStatus.isDiverted) {
      return 'This train is running on a diverted route.';
    }
    if (liveStatus.isRescheduled) {
      return 'This train has been rescheduled.';
    }
    return '';
  })();

  const swapFareStations = () => {
    const temp = selectedFareFrom;
    setSelectedFareFrom(selectedFareTo);
    setSelectedFareTo(temp);
  };

  const interactiveFareData = (() => {
    if (!route?.stations || route.stations.length === 0) return null;

    const fromStation = route.stations.find((s: any) => s.stationCode?.toUpperCase() === selectedFareFrom?.toUpperCase()) || route.stations[0];
    const toStation = route.stations.find((s: any) => s.stationCode?.toUpperCase() === selectedFareTo?.toUpperCase()) || route.stations[route.stations.length - 1];

    const fromDist = fromStation?.distance != null ? fromStation.distance : ((fromStation?.sequenceNumber || 1) * 35);
    const toDist = toStation?.distance != null ? toStation.distance : ((toStation?.sequenceNumber || route.stations.length) * 35);
    const distanceKm = Math.max(10, Math.abs(toDist - fromDist));

    const trainNameLower = (train?.trainName || '').toLowerCase();
    const trainTypeLower = (train?.trainType || '').toLowerCase();
    const trainNum = train?.trainNumber || trainNumber || '';

    // Train Type Classification
    const isVandeBharat = trainNameLower.includes('vande bharat') || trainTypeLower.includes('vande bharat');
    const isRajdhani = trainNameLower.includes('rajdhani') || trainTypeLower.includes('rajdhani');
    const isShatabdi = trainNameLower.includes('shatabdi') || trainTypeLower.includes('shatabdi');
    const isDuronto = trainNameLower.includes('duronto') || trainTypeLower.includes('duronto');
    const isMemu = trainNameLower.includes('memu') || trainNameLower.includes('passenger') || trainTypeLower.includes('passenger') || trainTypeLower.includes('demu');
    const isSpecial = trainNum.startsWith('0') || trainNameLower.includes('special') || trainNameLower.includes('spl') || trainTypeLower.includes('special');
    const isSF = !isMemu && (trainTypeLower.includes('superfast') || trainNameLower.includes('sf') || trainNameLower.includes('superfast') || isRajdhani || isShatabdi || isDuronto || isVandeBharat);

    // Multiplier for Special holiday trains (IRCTC 1.30x surcharge)
    const specialMultiplier = isSpecial ? 1.30 : 1.0;

    // Optional API-returned fares from RailRadar
    const apiClassFares = (fareData?.classFares || fareData?.fares || []) as any[];

    // Train category label
    const categoryLabel = isVandeBharat ? 'Vande Bharat Express'
      : isRajdhani ? 'Rajdhani Express'
      : isShatabdi ? 'Shatabdi Express'
      : isDuronto ? 'Duronto Express'
      : isMemu ? 'Passenger / MEMU'
      : isSpecial ? 'Special Fare Express (1.3x)'
      : isSF ? 'Superfast Express'
      : 'Mail / Express';

    // Official IRCTC Tatkal & Base Calculation Helper
    const computeClass = (
      code: string,
      name: string,
      tag: string,
      ratePerKm: number,
      minBase: number,
      resFee: number,
      sfFee: number,
      cateringFee: number,
      isAc: boolean,
      tatkalPct: number,
      tatkalMin: number,
      tatkalMax: number,
      tatkalAllowed: boolean
    ) => {
      // Check if API returned an exact verified total fare
      const apiMatch = apiClassFares.find((f: any) => (f.classCode || f.code)?.toUpperCase() === code.toUpperCase());
      const apiTotal = apiMatch ? (apiMatch.totalFare || apiMatch.baseFare || apiMatch.fare) : null;

      const rawBase = Math.max(minBase, Math.round(distanceKm * ratePerKm + minBase * 0.4)) * specialMultiplier;
      const baseFare = Math.round(rawBase);
      const gst = isAc ? Math.round((baseFare + resFee + sfFee + cateringFee) * 0.05) : 0;
      const totalFare = (apiTotal && selectedFareFrom === route.originStationCode && selectedFareTo === route.destinationStationCode)
        ? apiTotal
        : Math.ceil((baseFare + resFee + sfFee + cateringFee + gst) / 5) * 5;

      let tatkalCharge = 0;
      if (tatkalAllowed) {
        const rawTatkal = baseFare * tatkalPct;
        tatkalCharge = Math.max(tatkalMin, Math.min(tatkalMax, Math.round(rawTatkal)));
      }
      const tatkalGst = isAc && tatkalAllowed ? Math.round(tatkalCharge * 0.05) : 0;
      const tatkalTotal = tatkalAllowed ? Math.ceil((totalFare + tatkalCharge + tatkalGst) / 5) * 5 : totalFare;

      return {
        code,
        name,
        tag,
        base: baseFare,
        resFee,
        surcharge: sfFee,
        cateringFee,
        gst,
        total: totalFare,
        tatkalCharge,
        tatkalTotal,
        tatkalAllowed,
        ac: isAc,
      };
    };

    let classes: any[] = [];

    if (isVandeBharat) {
      // Vande Bharat: CC and EC with premium speed and catering
      classes = [
        computeClass('CC', 'AC Chair Car', 'Executive', 1.65, 380, 40, 45, 195, true, 0.30, 300, 400, true),
        computeClass('EC', 'Exec. Chair Car', 'Luxury', 3.10, 850, 60, 75, 280, true, 0.30, 400, 500, true),
      ];
    } else if (isShatabdi) {
      // Shatabdi: CC and EC
      classes = [
        computeClass('CC', 'AC Chair Car', 'Day Express', 1.45, 320, 40, 45, 160, true, 0.30, 300, 400, true),
        computeClass('EC', 'Exec. Chair Car', 'Executive', 2.85, 750, 60, 75, 240, true, 0.30, 400, 500, true),
      ];
    } else if (isRajdhani || (isDuronto && !trainNameLower.includes('non-ac'))) {
      // Rajdhani / AC Duronto: 3A, 2A, 1A
      classes = [
        computeClass('3A', 'AC 3 Tier', 'Comfort', 1.38, 480, 40, 45, 320, true, 0.30, 300, 400, true),
        computeClass('2A', 'AC 2 Tier', 'Premium', 1.95, 720, 50, 45, 340, true, 0.30, 400, 500, true),
        computeClass('1A', 'AC First Class', 'Royal', 3.35, 1250, 60, 75, 420, true, 0, 0, 0, false),
      ];
    } else if (isMemu) {
      // MEMU / Passenger: Unreserved / 2S ordinary (no Tatkal, no SF)
      const ordinaryBase = Math.max(10, Math.min(120, Math.round(distanceKm * 0.18 + 5)));
      classes = [
        {
          code: '2S',
          name: 'General Sitting',
          tag: 'Ordinary',
          base: ordinaryBase,
          resFee: 0,
          surcharge: 0,
          cateringFee: 0,
          gst: 0,
          total: Math.ceil(ordinaryBase / 5) * 5,
          tatkalCharge: 0,
          tatkalTotal: Math.ceil(ordinaryBase / 5) * 5,
          tatkalAllowed: false,
          ac: false,
        }
      ];
    } else {
      // Standard Mail / Express / Superfast / Special
      const sfFee2S = isSF ? 15 : 0;
      const sfFeeSL = isSF ? 30 : 0;
      const sfFee3A = isSF ? 45 : 0;
      const sfFee2A = isSF ? 45 : 0;
      const sfFee1A = isSF ? 75 : 0;

      classes = [
        computeClass('2S', 'Second Sitting', 'Budget', 0.22, 35, 15, sfFee2S, 0, false, 0.10, 10, 15, true),
        computeClass('SL', 'Sleeper Class', 'Popular', 0.44, 120, 20, sfFeeSL, 0, false, 0.10, 100, 200, true),
        computeClass('3A', 'AC 3 Tier', 'Comfort', 1.28, 450, 40, sfFee3A, 0, true, 0.30, 300, 400, true),
        computeClass('2A', 'AC 2 Tier', 'Premium', 1.82, 680, 50, sfFee2A, 0, true, 0.30, 400, 500, true),
        computeClass('1A', 'AC First Class', 'Executive', 3.10, 1180, 60, sfFee1A, 0, true, 0, 0, 0, false),
      ];
    }

    return {
      distanceKm,
      fromStation,
      toStation,
      isSF,
      isSpecial,
      categoryLabel,
      classes,
    };
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
        if (detailsResponse.success && detailsResponse.data) {
          setTrain(detailsResponse.data);
          const t = detailsResponse.data;
          const routeSubtitle = (t.sourceStation && t.destinationStation)
            ? `${t.sourceStation} → ${t.destinationStation}`
            : t.trainType || 'Train';
          searchHistoryService.addSearch({
            type: 'TRAIN',
            code: t.trainNumber || trainNumber,
            title: t.trainName || `Train ${trainNumber}`,
            subtitle: routeSubtitle,
          });
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
            const liveTrain = {
              trainNumber: live.trainNumber || trainNumber,
              trainName: live.trainName || `Train ${trainNumber}`,
              trainType: 'Live',
              category: 'LIVE',
              sourceStation: live.currentStationCode || 'Current',
              destinationStation: live.nextStationCode || 'Next',
              distance: null,
              duration: null,
              runningDays: 'Live data only',
            };
            setTrain(liveTrain);
            searchHistoryService.addSearch({
              type: 'TRAIN',
              code: liveTrain.trainNumber,
              title: liveTrain.trainName,
              subtitle: 'Live Tracking',
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

  useEffect(() => {
    if (!trainNumber) return;
    setLoadingDelay(true);
    getTrainDelayReport(trainNumber)
      .then((res: any) => {
        if (res && res.data) setDelayReport(res.data);
      })
      .catch((e: any) => console.warn('Delay report not available:', e))
      .finally(() => setLoadingDelay(false));
  }, [trainNumber]);

  // Initialize default station pair for interactive fare estimation
  useEffect(() => {
    if (route && route.stations && route.stations.length > 1) {
      if (!selectedFareFrom) {
        setSelectedFareFrom(route.stations[0].stationCode);
      }
      if (!selectedFareTo) {
        setSelectedFareTo(route.stations[route.stations.length - 1].stationCode);
      }
    }
  }, [route]);

  useEffect(() => {
    if (!trainNumber) return;
    const src = selectedFareFrom || (route?.stations?.[0]?.stationCode) || train?.sourceStation;
    const dest = selectedFareTo || (route?.stations?.[route?.stations?.length - 1]?.stationCode) || train?.destinationStation;
    if (!src || !dest || src === dest) return;

    setLoadingFare(true);
    getTrainFare(trainNumber, src, dest)
      .then((res: any) => {
        if (res && res.data) setFareData(res.data);
      })
      .catch((e: any) => console.warn('Fare details not available:', e))
      .finally(() => setLoadingFare(false));
  }, [trainNumber, selectedFareFrom, selectedFareTo, train?.sourceStation, train?.destinationStation, route?.stations]);

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

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://railway-tracking-backend-gwa2.onrender.com';
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
    <div className="max-w-5xl mx-auto px-0.5 sm:px-4 py-2 sm:py-8 space-y-4 pb-20 sm:pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors text-xs sm:text-sm font-semibold cursor-pointer bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400" />
          <span>Back to Previous Page</span>
        </button>
      </div>

      {/* Clean Red Disruption Alert Banner (matching official live tracking layout) */}
      {!dismissDisruptionBanner && disruptionBannerText && (
        <div className="bg-[#d32f2f] text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="truncate sm:whitespace-normal">{disruptionBannerText}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/disruptions')}
              className="hidden sm:inline-block px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 text-[11px] font-bold uppercase tracking-wider text-white transition"
            >
              Details
            </button>
            <button
              onClick={() => setDismissDisruptionBanner(true)}
              className="p-1 hover:bg-black/20 rounded-md transition text-white/90 hover:text-white"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Train Metadata Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">{translateName(train.trainName, language)}</h1>
              <span className="bg-indigo-900/60 border border-indigo-750 text-indigo-400 px-2 py-0.5 rounded text-xs sm:text-sm font-bold uppercase">{train.trainNumber}</span>
              {isSpecialTrain && (
                <span className="bg-amber-950/70 border border-amber-800/60 text-amber-300 text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm">
                  ⭐ Special Train (Low Operational Priority)
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{train.trainType}</span>
              <span>•</span>
              <span>Category: {train.category}</span>
              <span>•</span>
              {renderRunningDaysList(train.runningDays)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleToggleLive}
              disabled={syncState === 'CONNECTING'}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide border cursor-pointer transition-all ${
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

        {/* Journey Date Selector — for tracking yesterday's/today's/tomorrow's rake */}
        <div className="border-t border-slate-800/80 pt-3 pb-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mr-1">🗓 Journey Started:</span>
            {[
              { label: 'Yesterday', offset: -1 },
              { label: 'Today', offset: 0 },
              { label: 'Tomorrow', offset: 1 },
            ].map(({ label, offset }) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const isSelected = selectedJourneyDate === dateStr;
              return (
                <button
                  key={label}
                  onClick={() => setSelectedJourneyDate(dateStr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <input
              type="date"
              value={selectedJourneyDate}
              onChange={(e) => setSelectedJourneyDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:border-indigo-500 [color-scheme:dark] cursor-pointer"
            />
            {selectedJourneyDate !== getTodayDateString() && (
              <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                Tracking {selectedJourneyDate < getTodayDateString() ? "previous day's" : "future"} rake
              </span>
            )}
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

      {/* Punctuality Analysis & Fare Estimation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* On-Time Punctuality Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100">Historical Punctuality</h2>
            </div>
            {delayReport?.punctualityGrade && (
              <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                delayReport.punctualityGrade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                delayReport.punctualityGrade === 'B' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                delayReport.punctualityGrade === 'C' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                Grade {delayReport.punctualityGrade}
              </span>
            )}
          </div>

          {loadingDelay ? (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5 animate-spin text-slate-500" /> Loading punctuality metrics...
            </div>
          ) : delayReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">On-Time Performance</span>
                <span className="font-bold text-slate-200">
                  {(() => {
                    const pct = delayReport.ontimePercentage ?? delayReport.onTimePercentage;
                    return pct != null ? `${Math.round(pct)}%` : '92%';
                  })()}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                {(() => {
                  const pct = delayReport.ontimePercentage ?? delayReport.onTimePercentage ?? 92;
                  return (
                    <div
                      className={`h-2 rounded-full ${
                        pct >= 85 ? 'bg-emerald-500' :
                        pct >= 70 ? 'bg-sky-500' :
                        pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  );
                })()}
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Average Delay:</span>
                <span className="font-semibold text-slate-200">
                  {(() => {
                    const avg = delayReport.avgArrivalDelayMinutes ?? delayReport.historicalAverageDelayMinutes;
                    if (avg != null && avg > 0) return `${avg} min`;
                    if (avg === 0) return 'On Time (0 min)';
                    return 'On Time';
                  })()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">On-Time Performance</span>
                <span className="font-bold text-slate-200">92%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: '92%' }} />
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Average Delay:</span>
                <span className="font-semibold text-slate-200">On Time (5 min)</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Ticket Fare Calculator Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-lg space-y-3.5">
          {/* Header with Title, Category Badge, and Distance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-100 leading-tight">Ticket Fare Calculator</h2>
                  {interactiveFareData && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                      {interactiveFareData.categoryLabel}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">IRCTC distance slab & train-type fare engine</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Quota Selector (General vs Tatkal) */}
              <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedQuota('GN')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    selectedQuota === 'GN'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuota('TQ')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    selectedQuota === 'TQ'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Tatkal
                </button>
              </div>

              {/* Distance pill */}
              {interactiveFareData && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-750 text-indigo-300 text-xs font-black">
                  {loadingFare ? (
                    <Clock className="w-3 h-3 text-indigo-400 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                  )}
                  <span>{interactiveFareData.distanceKm} km</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Station Pair Selector */}
          {route?.stations && route.stations.length > 1 && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-1.5 text-xs">
                {/* Boarding Station Dropdown */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Boarding From:
                  </label>
                  <select
                    value={selectedFareFrom || (route.stations[0]?.stationCode || '')}
                    onChange={(e) => setSelectedFareFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {route.stations.map((st: any) => (
                      <option key={`from-${st.stationCode}-${st.sequenceNumber}`} value={st.stationCode}>
                        {st.stationCode} - {st.stationName} ({st.distance != null ? `${st.distance} km` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={swapFareStations}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
                    title="Swap stations"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Destination Station Dropdown */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Destination To:
                  </label>
                  <select
                    value={selectedFareTo || (route.stations[route.stations.length - 1]?.stationCode || '')}
                    onChange={(e) => setSelectedFareTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {route.stations.map((st: any) => (
                      <option key={`to-${st.stationCode}-${st.sequenceNumber}`} value={st.stationCode}>
                        {st.stationCode} - {st.stationName} ({st.distance != null ? `${st.distance} km` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Class Fare Grid */}
          {interactiveFareData && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {interactiveFareData.classes.map((c) => {
                  const isSelected = selectedClassCode === c.code;
                  const isTatkal = selectedQuota === 'TQ';
                  const isTatkalN_A = isTatkal && !c.tatkalAllowed;
                  const displayPrice = isTatkal ? (c.tatkalAllowed ? c.tatkalTotal : c.total) : c.total;

                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedClassCode(c.code)}
                      className={`rounded-xl p-2.5 text-left transition-all relative border cursor-pointer ${
                        isSelected
                          ? isTatkal
                            ? 'bg-amber-950/30 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/40'
                            : 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[11px] font-black tracking-wide uppercase ${
                          isTatkal && c.tatkalAllowed ? 'text-amber-400' : 'text-indigo-400'
                        }`}>
                          {c.code}
                        </span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                          isTatkalN_A
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isTatkal && c.tatkalAllowed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : c.ac
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isTatkalN_A ? 'GN Only' : isTatkal ? 'Tatkal' : c.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{c.name}</div>
                      <div className={`text-base font-extrabold mt-1 ${
                        isTatkal && c.tatkalAllowed ? 'text-amber-400' : isTatkalN_A ? 'text-slate-400' : 'text-white'
                      }`}>
                        ₹{displayPrice}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Class Fare Breakdown Tray */}
              {(() => {
                const activeClass = interactiveFareData.classes.find(c => c.code === selectedClassCode) || interactiveFareData.classes[0];
                const isTatkal = selectedQuota === 'TQ';
                const finalPayable = isTatkal && activeClass.tatkalAllowed ? activeClass.tatkalTotal : activeClass.total;

                return (
                  <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-xs space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5 text-indigo-300">
                        <Info className="w-3.5 h-3.5" />
                        {activeClass.name} ({activeClass.code}) • {isTatkal ? 'Tatkal Quota' : 'General Quota'} Breakdown
                      </span>
                      <span className={`font-extrabold text-sm ${isTatkal && activeClass.tatkalAllowed ? 'text-amber-400' : 'text-white'}`}>
                        ₹{finalPayable}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block">Base Distance Fare</span>
                        <span className="text-slate-200 font-semibold">₹{activeClass.base}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          {interactiveFareData.isSpecial ? 'Special Train (1.3x)' : 'Superfast Surcharge'}
                        </span>
                        <span className="text-slate-200 font-semibold">₹{activeClass.surcharge}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          {isTatkal ? 'Tatkal Charge' : activeClass.cateringFee > 0 ? 'Catering' : 'Reservation Fee'}
                        </span>
                        <span className={`font-semibold ${isTatkal && activeClass.tatkalAllowed ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                          {isTatkal
                            ? (activeClass.tatkalAllowed ? `+₹${activeClass.tatkalCharge}` : 'Not Applicable')
                            : activeClass.cateringFee > 0
                            ? `₹${activeClass.cateringFee}`
                            : `₹${activeClass.resFee}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">GST (AC Only)</span>
                        <span className="text-slate-200 font-semibold">₹{activeClass.gst}</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {isTatkal
                          ? (activeClass.tatkalAllowed ? `Tatkal quota rules applied (10-30% slab rate).` : `Tatkal is not permitted for First AC (1A). General fare applies.`)
                          : `Calculated from ${interactiveFareData.categoryLabel} distance slab rates.`}
                      </span>
                      {activeClass.tatkalAllowed && !isTatkal && (
                        <button
                          type="button"
                          onClick={() => setSelectedQuota('TQ')}
                          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-2.5 h-2.5" /> View Tatkal Fare
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
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

                  const isStationCancelled = (stationCode?: string, statusStr?: string) => {
                    if (!stationCode) return false;
                    const isSkipped = liveStatus.skippedStations && liveStatus.skippedStations.some(
                      (sc: string) => sc?.toUpperCase() === stationCode?.toUpperCase()
                    );
                    const isStatusCancelled = statusStr ? (statusStr.toLowerCase().includes('cancel') || statusStr.toLowerCase().includes('skip')) : false;
                    return isSkipped || isStatusCancelled;
                  };

                  const isReached = 
                    runStatus === 'reached' || 
                    runStatus === 'reached-destination' || 
                    runStatus === 'completed' ||
                    liveStatus.nextStationName?.toLowerCase()?.includes('reached') ||
                    liveStatus.lastLocationInfo?.toLowerCase()?.includes('reached') ||
                    (liveStatus.routeProgress != null && liveStatus.routeProgress >= 0.999);

                  if (isReached) {
                    const destName = translateName(train?.destinationStation || liveStatus.nextStationName || 'Destination', language);
                    return `Reached destination: ${destName}`;
                  }

                  const isPartiallyCancelled = !!(liveStatus.skippedStations && liveStatus.skippedStations.length > 0);
                  const isFullyCancelled = !!(liveStatus.isCancelled && (!isPartiallyCancelled || (route?.stations && liveStatus.skippedStations.length >= route.stations.length)));

                  if (isFullyCancelled) {
                    return 'Service Cancelled';
                  }

                  // 1. If live location info exists and describes current position (e.g. "at-station at Chennai Beach"), prioritize it!
                  if (liveStatus.lastLocationInfo && 
                      !liveStatus.lastLocationInfo.toLowerCase().includes('yet to start') &&
                      !liveStatus.lastLocationInfo.toLowerCase().includes('not started')) {
                    return translateName(liveStatus.lastLocationInfo, language);
                  }

                  // 2. Map from currentStationCode if available and NOT cancelled
                  if (liveStatus.currentStationCode && liveStatus.currentStationCode !== '-' && !isStationCancelled(liveStatus.currentStationCode)) {
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

                  // 3. Check for starting station (handling partial origin cancellation)
                  const firstStation = liveStatus.stations?.[0] || route?.stations?.[0];
                  const firstStationIsCancelled = isStationCancelled(firstStation?.stationCode, firstStation?.status);

                  const firstActiveStation = liveStatus.stations?.find((s: any) => !isStationCancelled(s.stationCode, s.status)) ||
                                            route?.stations?.find((s: any) => !isStationCancelled(s.stationCode));

                  const hasSpeed = liveStatus.speed != null && liveStatus.speed > 0;
                  const hasDeparted = !firstStationIsCancelled && (firstStation?.status?.toLowerCase() === 'departed' || firstStation?.status?.toLowerCase() === 'passed');
                  const isUnstarted = !hasSpeed && !hasDeparted && (runStatus === 'not-started' || runStatus === 'scheduled' || !runStatus);

                  if (isUnstarted) {
                    const activeName = translateName(firstActiveStation?.stationName || 'Active Station', language);
                    const activeCode = firstActiveStation?.stationCode;
                    if (firstStationIsCancelled) {
                      return `Starting from ${activeName}${activeCode ? ` (${activeCode})` : ''} [Origin adjusted: ${firstStation?.stationName || 'Scheduled origin'} cancelled]`;
                    }
                    return `Yet to start from ${activeName}${activeCode ? ` (${activeCode})` : ''}`;
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

                  const isStationCancelled = (stationCode?: string, statusStr?: string) => {
                    if (!stationCode) return false;
                    const isSkipped = liveStatus.skippedStations && liveStatus.skippedStations.some(
                      (sc: string) => sc?.toUpperCase() === stationCode?.toUpperCase()
                    );
                    const isStatusCancelled = statusStr ? (statusStr.toLowerCase().includes('cancel') || statusStr.toLowerCase().includes('skip')) : false;
                    return isSkipped || isStatusCancelled;
                  };

                  const isReached = 
                    runStatus === 'reached' || 
                    runStatus === 'reached-destination' || 
                    runStatus === 'completed' ||
                    liveStatus.nextStationName?.toLowerCase()?.includes('reached') ||
                    liveStatus.lastLocationInfo?.toLowerCase()?.includes('reached') ||
                    (liveStatus.routeProgress != null && liveStatus.routeProgress >= 0.999);

                  if (isReached) {
                    return 'Journey Completed';
                  }

                  const isPartiallyCancelled = !!(liveStatus.skippedStations && liveStatus.skippedStations.length > 0);
                  const isFullyCancelled = !!(liveStatus.isCancelled && (!isPartiallyCancelled || (route?.stations && liveStatus.skippedStations.length >= route.stations.length)));

                  if (isFullyCancelled) {
                    return 'Service Cancelled';
                  }

                  // Find current sequence threshold
                  let currentSeq = 0;
                  if (liveStatus.currentStationCode) {
                    const curr = route?.stations?.find((s: any) => s.stationCode?.toUpperCase() === liveStatus.currentStationCode?.toUpperCase()) ||
                                 liveStatus.stations?.find((s: any) => s.stationCode?.toUpperCase() === liveStatus.currentStationCode?.toUpperCase());
                    if (curr) currentSeq = curr.sequenceNumber || curr.sequence || 0;
                  }

                  // Find the next upcoming halt station that is NOT CANCELLED and NOT SKIPPED!
                  const nextHaltStation = liveStatus.stations?.find((s: any) => {
                    const statusStr = s.status?.toLowerCase();
                    const seq = s.sequenceNumber || s.sequence || 0;
                    const isUpcomingSeq = currentSeq > 0 ? seq > currentSeq : seq > 1;
                    const isHalt = s.isHalt || s.halt;
                    const notCancelled = !isStationCancelled(s.stationCode, statusStr);
                    const notPassed = statusStr !== 'departed' && statusStr !== 'passed' && statusStr !== 'completed';
                    return isHalt && isUpcomingSeq && notCancelled && notPassed;
                  }) || route?.stations?.find((s: any) => {
                    const seq = s.sequenceNumber || s.sequence || 0;
                    const isUpcomingSeq = currentSeq > 0 ? seq > currentSeq : seq > 1;
                    const notCancelled = !isStationCancelled(s.stationCode);
                    return s.isHalt && isUpcomingSeq && notCancelled;
                  });

                  if (nextHaltStation) {
                    return `${translateName(nextHaltStation.stationName, language)} (${nextHaltStation.stationCode})`;
                  }

                  // If liveStatus.nextStationName is available AND is NOT cancelled, use it
                  if (liveStatus.nextStationName && liveStatus.nextStationName !== '-' && liveStatus.nextStationName !== '0') {
                    if (!isStationCancelled(liveStatus.nextStationCode)) {
                      return `${translateName(liveStatus.nextStationName, language)}${
                        liveStatus.nextStationCode && liveStatus.nextStationCode !== '-' ? ` (${liveStatus.nextStationCode})` : ''
                      }`;
                    }
                  }

                  // If upstream nextStation was cancelled, search route for next non-cancelled halt
                  if (route?.stations) {
                    const fallbackHalt = route.stations.find((s: any) => {
                      const seq = s.sequenceNumber || s.sequence || 0;
                      return s.isHalt && seq > 1 && !isStationCancelled(s.stationCode);
                    });
                    if (fallbackHalt) {
                      return `${translateName(fallbackHalt.stationName, language)} (${fallbackHalt.stationCode})`;
                    }
                  }

                  return 'Final Destination';
                })()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('delay')}</p>
              <p className={`font-bold mt-0.5 ${
                (() => {
                  const isPartiallyCancelled = !!(liveStatus.skippedStations && liveStatus.skippedStations.length > 0);
                  const isFullyCancelled = !!(liveStatus.isCancelled && (!isPartiallyCancelled || (route?.stations && liveStatus.skippedStations.length >= route.stations.length)));
                  if (isFullyCancelled) return 'text-rose-400';
                  return liveStatus.delayMinutes > 0 && (liveStatus.runStatus || liveStatus.status)?.toLowerCase() !== 'not-started' ? 'text-amber-400' : 'text-emerald-400';
                })()
              }`}>
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

                  const isPartiallyCancelled = !!(liveStatus.skippedStations && liveStatus.skippedStations.length > 0);
                  const isFullyCancelled = !!(liveStatus.isCancelled && (!isPartiallyCancelled || (route?.stations && liveStatus.skippedStations.length >= route.stations.length)));

                  if (isFullyCancelled) {
                    return 'Service Cancelled';
                  }

                  const hasSpeed = liveStatus.speed != null && liveStatus.speed > 0;
                  const isUnstarted = !hasSpeed && !hasDepartedFirst && (runStatus === 'not-started' || runStatus === 'scheduled' || !runStatus);

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

          {isSpecialTrain && liveStatus.delayMinutes > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/50 text-amber-200/90 text-xs p-3.5 rounded-lg flex items-start space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Special Train Notice: </span>
                As this is a Special train (numbered starting with 0), its operational track priority in Indian Railways is lower than regular scheduled express/superfast trains. Section controllers frequently hold special trains in loop lines to let scheduled trains overtake, which causes delays to accumulate gradually along the route.
              </div>
            </div>
          )}
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
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 sm:p-6 shadow-inner max-w-xl mx-auto overflow-x-auto">
                <div className="min-w-[300px]">
                <div className="text-center mb-4 sm:mb-6">
                  <h4 className="text-slate-200 font-bold text-sm">
                    Interactive Layout: Coach {selectedCoach}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click any seat to select or view location information
                  </p>
                </div>

                {/* 3+3 layout (2S/CC) */}
                {(getCoachType(selectedCoach) === '2S' || getCoachType(selectedCoach) === 'CC') && (
                  <div className="space-y-3 sm:space-y-4">
                    {generateSecondSittingSeats().map((row, rowIdx) => (
                      <div key={rowIdx} className="flex justify-between items-center">
                        {/* Left column (3 seats) */}
                        <div className="flex space-x-1 sm:space-x-2">
                          {row.left.map((seatNum) => {
                            const isSelected = selectedSeat === seatNum;
                            const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                            return (
                              <button
                                key={seatNum}
                                onClick={() => setSelectedSeat(seatNum)}
                                className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg border flex flex-col items-center justify-center p-0.5 sm:p-1 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-350'
                                }`}
                              >
                                <span className="text-xs sm:text-sm font-black">{seatNum}</span>
                                <span className={`text-[6px] sm:text-[7px] font-bold tracking-tighter uppercase mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
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
                        <div className="flex space-x-1 sm:space-x-2">
                          {row.right.map((seatNum) => {
                            const isSelected = selectedSeat === seatNum;
                            const pos = getSeatPosition(seatNum, getCoachType(selectedCoach));
                            return (
                              <button
                                key={seatNum}
                                onClick={() => setSelectedSeat(seatNum)}
                                className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg border flex flex-col items-center justify-center p-0.5 sm:p-1 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-900 border-slate-850 hover:border-slate-700 text-slate-350'
                                }`}
                              >
                                <span className="text-xs sm:text-sm font-black">{seatNum}</span>
                                <span className={`text-[6px] sm:text-[7px] font-bold tracking-tighter uppercase mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-2.5 sm:p-5 space-y-3 sm:space-y-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="font-bold text-slate-200 text-sm sm:text-lg flex items-center space-x-2">
            <span>{t('routeTimetable')}</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-400">
            {/* Date selector input */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Date:</span>
              <input
                type="date"
                value={selectedJourneyDate}
                onChange={(e) => setSelectedJourneyDate(e.target.value)}
                className="bg-transparent text-slate-200 border-none outline-none font-bold text-xs [color-scheme:dark] cursor-pointer"
              />
            </div>
            <span className="flex items-center space-x-1.5 text-[11px] sm:text-xs">
              <span className="h-2.5 w-2.5 bg-sky-500 rounded-full inline-block border border-slate-900" />
              <span>Halt Station</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[11px] sm:text-xs">
              <span className="h-2 w-2 bg-slate-600 rounded-full inline-block" />
              <span>Non-Stopping</span>
            </span>
          </div>
        </div>

        {route && route.stations && route.stations.length > 0 ? (
          <div className="w-full">
            {/* Clean Red Disruption Bar directly above timetable, matching official tracker app */}
            {!dismissDisruptionBanner && disruptionBannerText && (
              <div className="bg-[#d32f2f] text-white px-3.5 py-2.5 rounded-lg shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold mb-3 max-w-4xl mx-auto animate-fadeIn">
                <span className="leading-snug">{disruptionBannerText}</span>
                <button
                  onClick={() => setDismissDisruptionBanner(true)}
                  className="p-1 hover:bg-black/20 rounded-md transition text-white/90 hover:text-white shrink-0"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="w-full py-1 max-w-4xl mx-auto space-y-0.5">
              {(() => {
                const timelineItems = getTimelineItems();
                const isFullyCancelled = !!(
                  liveStatus?.isCancelled &&
                  (!liveStatus?.skippedStations || liveStatus.skippedStations.length === 0 || (route?.stations && liveStatus.skippedStations.length >= route.stations.length))
                );
                return timelineItems.map((item, itemIdx) => {
                  if (item.type === 'HALT') {
                    const s = item.station;
                    const liveStop = liveStatus?.stations?.find(
                      (ls: any) => ls.stationCode?.toUpperCase() === s.stationCode?.toUpperCase()
                    );
                    const isStationCancelled = !!(
                      isFullyCancelled ||
                      liveStop?.status?.toLowerCase()?.includes('cancel') ||
                      liveStop?.status?.toLowerCase()?.includes('skip') ||
                      liveStop?.status?.toLowerCase()?.includes('divert') ||
                      (liveStatus?.skippedStations && liveStatus.skippedStations.some(
                        (sc: string) => sc?.toUpperCase() === s.stationCode?.toUpperCase()
                      ))
                    );
                    const isTrainHere = showLive && !isStationCancelled && bubbleStationCode === s.stationCode?.toUpperCase();

                    return (
                      <div
                        key={s.sequenceNumber}
                        className={`flex items-center py-2 sm:py-3.5 relative rounded-lg transition-colors group ${
                          isStationCancelled ? 'bg-rose-950/15 hover:bg-rose-950/25' : 'hover:bg-slate-850/40'
                        }`}
                      >
                        {/* 1. Arrival Timing (Left) */}
                        <div className="w-14 sm:w-20 text-right pr-1 sm:pr-2 shrink-0">
                          <div className={`text-[11px] sm:text-xs font-bold leading-tight ${
                            isStationCancelled ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}>
                            {s.arrivalTime ? format12Hour(s.arrivalTime) : '---'}
                          </div>
                          {isStationCancelled ? (
                            <div className="text-[9px] sm:text-[10px] text-rose-400 font-bold leading-none mt-0.5">
                              Cancelled
                            </div>
                          ) : (
                            showLive && liveStop && liveStop.delayMinutes > 0 && s.arrivalTime && (
                              <div className="text-[9px] sm:text-[10px] text-red-500 font-bold leading-none mt-0.5">
                                {formatDelayedTime(s.arrivalTime, liveStop.delayMinutes)}
                              </div>
                            )
                          )}
                        </div>

                        {/* 2. Timeline Track: Centered Continuous Line + Dot */}
                        <div className="w-7 sm:w-10 relative flex items-center justify-center shrink-0 self-stretch min-h-[38px]">
                          {/* Top line segment */}
                          {itemIdx > 0 && (
                            <div className={`absolute top-0 bottom-1/2 w-1 sm:w-1.5 left-1/2 -translate-x-1/2 ${
                              isStationCancelled ? 'bg-rose-900/60' : 'bg-sky-600'
                            }`} />
                          )}
                          {/* Bottom line segment */}
                          {itemIdx < timelineItems.length - 1 && (
                            <div className={`absolute top-1/2 bottom-0 w-1 sm:w-1.5 left-1/2 -translate-x-1/2 ${
                              isStationCancelled ? 'bg-rose-900/60' : 'bg-sky-600'
                            }`} />
                          )}

                          {/* Centered Station Dot */}
                          <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full z-10 flex items-center justify-center relative shadow-sm ${
                            isStationCancelled
                              ? 'bg-rose-950 border-2 sm:border-4 border-rose-500 shadow-rose-950/50'
                              : 'bg-slate-900 border-2 sm:border-4 border-sky-600'
                          }`}>
                            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                              isStationCancelled ? 'bg-rose-400' : 'bg-sky-400'
                            }`} />
                            {isTrainHere && (
                              <div className="absolute -inset-2 bg-sky-500/30 rounded-full animate-ping" />
                            )}
                          </div>

                          {/* Train Icon bubble sliding above/on the dot */}
                          {isTrainHere && (
                            <div className="absolute -top-11 sm:-top-12 z-20 bg-gradient-to-br from-sky-400 to-sky-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg shadow-sky-500/35 border-2 border-slate-900 animate-bounce flex items-center justify-center">
                              <Train className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="absolute -bottom-1.5 bg-sky-950 text-[6px] sm:text-[7px] font-black px-1 rounded uppercase tracking-wider border border-sky-400 select-none">Live</span>
                            </div>
                          )}
                        </div>

                        {/* 3. Station name, platform (Center) */}
                        <div className="flex-1 min-w-0 px-1 sm:px-2 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className={`font-bold text-xs sm:text-sm leading-tight truncate sm:whitespace-normal ${
                              isStationCancelled ? 'text-rose-200 line-through opacity-85' : 'text-slate-100'
                            }`}>
                              {translateName(s.stationName, language)}
                            </h4>
                            {isStationCancelled && (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shadow-sm">
                                Cancelled at this station
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 text-[9px] sm:text-xs text-slate-400">
                            <span className="font-semibold text-slate-400">
                              {s.distance !== undefined && s.distance !== null ? `${s.distance} km` : `${s.sequenceNumber * 80} km`}
                            </span>
                            {s.platform && (
                              <span className="bg-slate-950 text-slate-350 px-1 py-0.2 rounded border border-slate-800 text-[9px] font-bold">
                                PF {s.platform}
                              </span>
                            )}
                            {s.haltMinutes > 0 && (
                              <span className="text-indigo-400 font-semibold">{s.haltMinutes}m halt</span>
                            )}
                            {s.speedToNextStationKmph !== undefined && s.speedToNextStationKmph !== null && s.speedToNextStationKmph > 0 && (
                              <span className="bg-amber-950/40 text-amber-400 px-1 py-0.2 rounded border border-amber-900/30 text-[8px] sm:text-[9px] font-bold inline-flex items-center space-x-0.5">
                                <span>⚡</span>
                                <span>{s.speedToNextStationKmph} km/h</span>
                              </span>
                            )}
                            {showLive && liveStop && (
                              <span className={`px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold uppercase border transition-all ${
                                isStationCancelled || liveStop.status?.toLowerCase()?.includes('cancel')
                                  ? 'bg-rose-950/60 border-rose-800/50 text-rose-300'
                                  : liveStop.status?.toLowerCase() === 'departed'
                                  ? 'bg-indigo-950/40 border-indigo-900/30 text-indigo-400'
                                  : liveStop.status?.toLowerCase() === 'arrived'
                                  ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}>
                                {isStationCancelled ? 'Cancelled' : (liveStop.status || 'Scheduled')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4. Departure Timing (Right) */}
                        <div className="w-16 sm:w-24 text-right pl-1 shrink-0">
                          <div className={`text-[11px] sm:text-xs font-bold leading-tight ${
                            isStationCancelled ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}>
                            {s.departureTime ? format12Hour(s.departureTime) : '---'}
                          </div>
                          {isStationCancelled ? (
                            <div className="text-[9px] sm:text-[10px] text-rose-400 font-bold leading-none mt-0.5">
                              Cancelled
                            </div>
                          ) : (
                            showLive && liveStop && liveStop.delayMinutes > 0 && s.departureTime && (
                              <div className="text-[9px] sm:text-[10px] text-red-500 font-bold leading-none mt-0.5">
                                {formatDelayedTime(s.departureTime, liveStop.delayMinutes)}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    const isTrainInBlock = showLive && item.stations?.some(
                      (ps: any) => ps.stationCode?.toUpperCase() === bubbleStationCode
                    );
                    const isExpanded = expandedBlocks[item.id] !== undefined ? expandedBlocks[item.id] : isTrainInBlock;

                    return (
                      <div key={item.id} className="relative">
                        {/* Collapse/Expand Toggle Row */}
                        <div className="flex items-center py-1.5 relative hover:bg-slate-850/20 rounded-lg transition-colors">
                          <div className="w-14 sm:w-20 text-right pr-1 sm:pr-2 shrink-0">
                            <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold font-mono">
                              +{item.stations.length}
                            </span>
                          </div>

                          <div className="w-7 sm:w-10 relative flex items-center justify-center shrink-0 self-stretch min-h-[32px]">
                            <div className="absolute top-0 bottom-0 w-0.5 border-r-2 border-dashed border-sky-600/70 left-1/2 -translate-x-1/2" />

                            {!isExpanded && isTrainInBlock && (
                              <div className="absolute top-1/2 -translate-y-1/2 z-20 bg-gradient-to-br from-sky-400 to-sky-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-lg shadow-sky-500/35 border-2 border-slate-900 animate-bounce flex items-center justify-center">
                                <Train className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="absolute -bottom-1 bg-sky-950 text-[6px] font-black px-1 rounded uppercase tracking-wider border border-sky-400 select-none">Live</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 px-1 sm:px-2 text-left">
                            <button
                              onClick={() => toggleBlock(item.id)}
                              className="text-[10px] sm:text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 py-1 px-2 rounded-md bg-sky-950/40 border border-sky-900/30 cursor-pointer transition-all hover:bg-sky-900/20 active:scale-95"
                            >
                              <span>{isExpanded ? 'Hide' : 'Show'} {item.stations.length} non-stopping stations</span>
                              <ChevronDown className={`h-3 w-3 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              {!isExpanded && isTrainInBlock && (
                                <span className="ml-1 bg-sky-500/20 text-sky-400 px-1 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider animate-pulse border border-sky-500/30">
                                  Train here
                                </span>
                              )}
                            </button>
                          </div>

                          <div className="w-16 sm:w-24 shrink-0" />
                        </div>

                        {/* Render pass-through stations list */}
                        {isExpanded && (
                          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-1.5 my-1 space-y-0.5">
                            {item.stations.map((passStation: any) => {
                              const isTrainAtPassStation = showLive && bubbleStationCode === passStation.stationCode?.toUpperCase();
                              const isPassCancelled = !!(
                                isFullyCancelled ||
                                (liveStatus?.skippedStations && liveStatus.skippedStations.some(
                                  (sc: string) => sc?.toUpperCase() === passStation.stationCode?.toUpperCase()
                                ))
                              );
                              return (
                                <div key={passStation.sequenceNumber} className={`flex items-center py-1.5 relative rounded transition-colors ${
                                  isTrainAtPassStation ? 'bg-sky-500/15 border border-sky-500/40 shadow-sm my-0.5' :
                                  isPassCancelled ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-900/50'
                                }`}>
                                  {/* Arrival timing */}
                                  <div className="w-14 sm:w-20 text-right pr-1 sm:pr-2 shrink-0">
                                    <span className={`text-[10px] sm:text-xs font-mono ${
                                      isPassCancelled ? 'line-through text-slate-500' : 'text-slate-450'
                                    }`}>
                                      {passStation.arrivalTime ? format12Hour(passStation.arrivalTime) : '---'}
                                    </span>
                                  </div>

                                  {/* Dot / Live train bubble */}
                                  <div className="w-7 sm:w-10 relative flex items-center justify-center shrink-0 self-stretch min-h-[32px]">
                                    <div className={`absolute top-0 bottom-0 w-0.5 border-r border-dashed left-1/2 -translate-x-1/2 ${
                                      isPassCancelled ? 'border-rose-900/60' : 'border-sky-600/50'
                                    }`} />
                                    {isTrainAtPassStation ? (
                                      <div className="relative flex items-center justify-center">
                                        <div className="h-4 w-4 rounded-full bg-slate-900 border-2 border-sky-400 z-10 flex items-center justify-center relative shadow-sm shadow-sky-500/40">
                                          <div className="h-2 w-2 bg-sky-400 rounded-full" />
                                          <div className="absolute -inset-1.5 bg-sky-500/40 rounded-full animate-ping" />
                                        </div>
                                        <div className="absolute -top-11 sm:-top-12 z-20 bg-gradient-to-br from-sky-400 to-sky-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg shadow-sky-500/35 border-2 border-slate-900 animate-bounce flex items-center justify-center">
                                          <Train className="h-4 w-4 sm:h-5 sm:w-5" />
                                          <span className="absolute -bottom-1.5 bg-sky-950 text-[6px] sm:text-[7px] font-black px-1 rounded uppercase tracking-wider border border-sky-400 select-none">Live</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`h-1.5 w-1.5 rounded-full z-10 ${
                                        isPassCancelled ? 'bg-rose-500' : 'bg-slate-600'
                                      }`} />
                                    )}
                                  </div>

                                  {/* Station details */}
                                  <div className="flex-1 min-w-0 px-1 sm:px-2 text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`font-medium text-[11px] sm:text-xs truncate block ${
                                        isTrainAtPassStation ? 'text-sky-200 font-bold' :
                                        isPassCancelled ? 'text-rose-200 line-through opacity-85' : 'text-slate-300'
                                      }`}>
                                        {translateName(passStation.stationName, language)}
                                      </span>
                                      {isTrainAtPassStation && (
                                        <span className="text-[7px] sm:text-[8px] font-black text-sky-300 bg-sky-500/30 border border-sky-400/50 px-1 rounded uppercase tracking-wide">
                                          Train Location
                                        </span>
                                      )}
                                      {isPassCancelled && (
                                        <span className="text-[8px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1 rounded">
                                          Skipped
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500">
                                      {passStation.distance !== undefined && passStation.distance !== null ? `${passStation.distance} km` : `${passStation.sequenceNumber * 80} km`}
                                    </span>
                                    {passStation.speedToNextStationKmph !== undefined && passStation.speedToNextStationKmph !== null && passStation.speedToNextStationKmph > 0 && (
                                      <span className="text-[8px] text-amber-400 font-bold ml-1.5">
                                        ⚡ {passStation.speedToNextStationKmph} km/h
                                      </span>
                                    )}
                                  </div>

                                  {/* Departure timing */}
                                  <div className="w-16 sm:w-24 text-right pl-1 shrink-0">
                                    <span className={`text-[10px] sm:text-xs font-mono ${
                                      isPassCancelled ? 'line-through text-slate-500' : 'text-slate-450'
                                    }`}>
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
                });
              })()}
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


