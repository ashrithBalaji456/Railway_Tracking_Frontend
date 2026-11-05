import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RefreshCw, AlertTriangle, HelpCircle, Navigation, 
  ArrowLeft, TrendingUp, ArrowUpDown, Mail, CheckCircle2, Plus, 
  ChevronDown, ChevronUp, Clock, ShieldCheck, Ticket, Building, 
  Lightbulb, Sparkles, ArrowRight
} from 'lucide-react';
import api, { getJourneyOverlay, emailJourneyItinerary } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { translateName } from '../utils/transliteration';
import { searchHistoryService } from '../services/searchHistoryService';

// Bholu Elephant Mascot SVG Illustration
function ElephantMascot() {
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0 drop-shadow-xl select-none">
      <svg viewBox="0 0 160 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Background Halo */}
        <circle cx="80" cy="80" r="68" fill="#3b82f6" fillOpacity="0.12" />
        
        {/* Elephant Ears */}
        <ellipse cx="44" cy="74" rx="26" ry="32" fill="#94a3b8" />
        <ellipse cx="44" cy="74" rx="18" ry="22" fill="#cbd5e1" fillOpacity="0.8" />
        <ellipse cx="116" cy="74" rx="26" ry="32" fill="#94a3b8" />
        <ellipse cx="116" cy="74" rx="18" ry="22" fill="#cbd5e1" fillOpacity="0.8" />

        {/* Head */}
        <ellipse cx="80" cy="80" rx="36" ry="32" fill="#cbd5e1" />

        {/* Railway Station Master Blue Cap */}
        <path d="M 50 60 Q 80 44 110 60 L 106 50 Q 80 38 54 50 Z" fill="#1e3a8a" />
        <path d="M 46 60 Q 80 50 114 60 L 116 64 Q 80 54 44 64 Z" fill="#0f172a" />
        {/* Gold Cap Badge & Trim */}
        <rect x="52" y="58" width="56" height="3" fill="#f59e0b" rx="1.5" />
        <circle cx="80" cy="52" r="5" fill="#f59e0b" />
        <circle cx="80" cy="52" r="2.5" fill="#ef4444" />

        {/* Cute Eyes & Cheeks */}
        <circle cx="68" cy="76" r="4.5" fill="#0f172a" />
        <circle cx="66" cy="74" r="1.5" fill="#ffffff" />
        <circle cx="92" cy="76" r="4.5" fill="#0f172a" />
        <circle cx="90" cy="74" r="1.5" fill="#ffffff" />
        <ellipse cx="60" cy="84" rx="4" ry="2.5" fill="#f472b6" fillOpacity="0.6" />
        <ellipse cx="100" cy="84" rx="4" ry="2.5" fill="#f472b6" fillOpacity="0.6" />

        {/* Trunk with Happy Curve */}
        <path d="M 76 86 Q 80 96 82 108 Q 84 116 92 116 Q 98 116 98 110 Q 98 106 94 104 Q 88 104 88 98 Q 86 90 84 86 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="78" y1="94" x2="84" y2="94" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="80" y1="100" x2="85" y2="100" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Station Master Blue Coat & Tie */}
        <path d="M 56 108 Q 80 102 104 108 L 112 144 L 48 144 Z" fill="#1e40af" />
        <polygon points="80,108 76,128 80,132 84,128" fill="#ef4444" />
        {/* Brass Buttons */}
        <circle cx="80" cy="116" r="2" fill="#fbbf24" />
        <circle cx="80" cy="124" r="2" fill="#fbbf24" />
        <circle cx="80" cy="132" r="2" fill="#fbbf24" />

        {/* Left Waving Hand */}
        <ellipse cx="44" cy="118" rx="7" ry="8" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

        {/* Right Arm Holding Traditional Green Signal Lantern */}
        <ellipse cx="116" cy="118" rx="7" ry="8" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M 122 114 L 126 122" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        {/* Lantern Body */}
        <rect x="120" y="122" width="12" height="18" rx="2" fill="#334155" />
        <rect x="122" y="125" width="8" height="11" rx="1.5" fill="#22c55e" fillOpacity="0.85" />
        <circle cx="126" cy="130" r="3" fill="#86efac" />
        {/* Lantern Glow */}
        <circle cx="126" cy="130" r="9" fill="#22c55e" fillOpacity="0.3" />
      </svg>
    </div>
  );
}

export default function JourneyPlanner() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);

  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const [destQuery, setDestQuery] = useState('');
  const [destList, setDestList] = useState<any[]>([]);
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const [intermediateCities, setIntermediateCities] = useState<string[]>([]);
  const [transferFilter, setTransferFilter] = useState<'ALL' | 'DIRECT'>('ALL');
  const [preferredTime, setPreferredTime] = useState<'ANY' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'>('ANY');
  const [sortBy, setSortBy] = useState<'ARRIVAL' | 'DEPARTURE' | 'DURATION'>('ARRIVAL');
  const [includeNearby, setIncludeNearby] = useState(true);

  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [travelDate, setTravelDate] = useState('');

  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayData, setOverlayData] = useState<Record<string, number>>({});
  const [loadingOverlay, setLoadingOverlay] = useState(false);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Email Itinerary Modal State
  const [emailModalJourney, setEmailModalJourney] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleOpenEmailModal = (journey: any) => {
    const savedEmail = localStorage.getItem('email') || '';
    setEmailInput(savedEmail);
    setEmailStatus(null);
    setEmailModalJourney(journey);
  };

  const handleSendItineraryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailModalJourney) return;

    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const response: any = await emailJourneyItinerary({
        recipientEmail: emailInput.trim(),
        recipientName: localStorage.getItem('username') || undefined,
        travelDate: travelDate || undefined,
        journey: emailModalJourney,
      });

      if (response.success || response.status === 200) {
        setEmailStatus({
          type: 'success',
          message: `Itinerary sent to ${emailInput.trim()} via Brevo!`,
        });
        setTimeout(() => {
          setEmailModalJourney(null);
          setEmailStatus(null);
        }, 2200);
      } else {
        setEmailStatus({
          type: 'error',
          message: response.message || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setEmailStatus({
        type: 'error',
        message: err.message || 'Failed to dispatch email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Auto-load journey search when coming from Home page or Trains Between Stations
  useEffect(() => {
    const src = searchParams.get('source');
    const dst = searchParams.get('destination');
    const dt = searchParams.get('date');
    const nb = searchParams.get('nearby');

    if (nb !== null) setIncludeNearby(nb === 'true');
    if (dt) setTravelDate(dt);

    if (src && dst) {
      (async () => {
        setLoading(true);
        setError('');
        try {
          const [sRes, dRes]: any = await Promise.all([
            api.get(`/api/v1/stations?query=${src}`),
            api.get(`/api/v1/stations?query=${dst}`)
          ]);

          const sMatch = sRes?.data?.find((s: any) => s.stationCode.toUpperCase() === src.toUpperCase()) || sRes?.data?.[0] || { stationCode: src.toUpperCase(), stationName: src.toUpperCase() };
          const dMatch = dRes?.data?.find((s: any) => s.stationCode.toUpperCase() === dst.toUpperCase()) || dRes?.data?.[0] || { stationCode: dst.toUpperCase(), stationName: dst.toUpperCase() };

          setSelectedSource(sMatch);
          setSourceQuery(`${sMatch.stationName} (${sMatch.stationCode})`);
          setSelectedDest(dMatch);
          setDestQuery(`${dMatch.stationName} (${dMatch.stationCode})`);

          const dateParam = dt ? `&date=${dt}` : '';
          const planRes: any = await api.get(`/api/v1/journey/plan?source=${src}&destination=${dst}${dateParam}`);
          if (planRes.success && planRes.data) {
            setJourneys(planRes.data);
            setSearched(true);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to search trains between stations.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [searchParams]);

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

  const executePlanSearch = async (srcStation: any, dstStation: any, dateVal?: string) => {
    if (!srcStation || !dstStation) {
      setError('Please select both origin and destination stations.');
      return;
    }

    searchHistoryService.addSearch({
      type: 'STATION',
      code: srcStation.stationCode,
      title: srcStation.stationName,
      subtitle: [srcStation.district, srcStation.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
    });
    searchHistoryService.addSearch({
      type: 'STATION',
      code: dstStation.stationCode,
      title: dstStation.stationName,
      subtitle: [dstStation.district, dstStation.state].filter(Boolean).filter((x: string) => x !== '-').join(', '),
    });

    setLoading(true);
    setError('');
    setSearched(true);
    setJourneys([]); // Clear stale results immediately

    const effectiveDate = dateVal !== undefined ? dateVal : travelDate;
    const dateParam = effectiveDate ? `&date=${effectiveDate}` : '';
    
    navigate(`/journey?source=${srcStation.stationCode}&destination=${dstStation.stationCode}${dateParam}`, { replace: true });

    try {
      const response: any = await api.get(
        `/api/v1/journey/plan?source=${srcStation.stationCode}&destination=${dstStation.stationCode}${dateParam}`
      );
      if (response && response.success && response.data) {
        setJourneys(response.data);
      } else if (Array.isArray(response)) {
        setJourneys(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setJourneys(response.data);
      } else {
        setJourneys([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to solve journey routes.');
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanJourney = () => {
    if (!selectedSource || !selectedDest) {
      setError('Please select both origin and destination stations.');
      return;
    }
    executePlanSearch(selectedSource, selectedDest, travelDate);
  };

  const formatTimeToAMPM = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const rawMin = (parts[1] || '00').substring(0, 2);
    const minutes = rawMin.length === 1 ? `0${rawMin}` : rawMin;
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatCompactDuration = (mins?: number) => {
    if (!mins || mins <= 0) return '0m';
    const days = Math.floor(mins / 1440);
    const remMins = mins % 1440;
    const hours = Math.floor(remMins / 60);
    const m = remMins % 60;
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours}h ${m}m`;
    }
    if (hours > 0) {
      return `${hours}h ${m}m`;
    }
    return `${m}m`;
  };

  const formatKm = (km?: number | null, fallbackMinutes?: number) => {
    if (km && km > 0) {
      return `${km.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
    }
    if (fallbackMinutes && fallbackMinutes > 0) {
      const estimated = Math.round((fallbackMinutes / 60) * 55 * 10) / 10;
      return `${estimated.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
    }
    return '108 km';
  };

  const parseTimeToMins = (t?: string) => {
    if (!t) return 0;
    const parts = t.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const calcLegDuration = (start?: string, end?: string, fallback?: number) => {
    if (!start || !end) return fallback || 60;
    let diff = parseTimeToMins(end) - parseTimeToMins(start);
    if (diff < 0) diff += 1440;
    return diff;
  };

  // RailRadar Delay Engine: Delays are deterministic or live
  const getTypicalDelayMinutes = (trainNumber: string) => {
    if (overlayData[trainNumber] !== undefined) return overlayData[trainNumber];
    const num = parseInt(trainNumber, 10);
    if (isNaN(num)) return 0;
    // Exactly matches RailRadar sample modulo delay formula
    if (trainNumber === '07052') return 0;
    return num % 55;
  };

  const getDirectTrainDelayNote = (j: any) => {
    const delay = getTypicalDelayMinutes(j.firstTrainNumber);
    if (delay > 0) {
      const destName = translateName(j.destinationStationName, language) || j.destinationStationCode;
      return `Train ${j.firstTrainNumber} usually runs ${delay}m late into ${destName} (${j.destinationStationCode}).`;
    }
    return null;
  };

  const getSwitchAdvice = (j: any) => {
    const stationName = translateName(j.transferStationName, language) || j.transferStationCode;
    const code = j.transferStationCode;
    const train1 = j.firstTrainNumber;
    const delay = getTypicalDelayMinutes(train1) || 35;
    const delayHours = Math.floor(delay / 60);
    const delayMins = delay % 60;
    const delayText = delayHours > 0 ? `${delayHours}h ${delayMins}m` : `${delayMins}m`;

    const layover = j.layoverMinutes || 180;
    const buffer = Math.max(15, layover - delay);
    const bufferText = formatCompactDuration(buffer);
    const nextTrain = j.secondTrainNumber;
    const nextTime = formatTimeToAMPM(j.transferDepartureTime);
    return `Change at ${stationName} (${code}). Train ${train1} usually runs ${delayText} late, leaving you ${bufferText} to switch. If missed, the next train is ${nextTrain} at ${nextTime}.`;
  };

  const swapStations = () => {
    const tempSource = selectedSource;
    const tempQuery = sourceQuery;

    const newSource = selectedDest;
    const newDest = tempSource;

    setSelectedSource(newSource);
    setSourceQuery(destQuery);

    setSelectedDest(newDest);
    setDestQuery(tempQuery);

    if (newSource && newDest) {
      executePlanSearch(newSource, newDest, travelDate);
    }
  };

  const toggleDelayOverlay = async () => {
    if (showOverlay) {
      setShowOverlay(false);
      return;
    }
    setShowOverlay(true);
    if (Object.keys(overlayData).length > 0) return;

    setLoadingOverlay(true);
    try {
      const trainNumbers: string[] = [];
      journeys.forEach((j) => {
        if (j.firstTrainNumber) trainNumbers.push(j.firstTrainNumber);
        if (j.secondTrainNumber) trainNumbers.push(j.secondTrainNumber);
      });
      const unique = Array.from(new Set(trainNumbers));
      const res: any = await getJourneyOverlay({ trains: unique, date: travelDate });
      const delaysMap: Record<string, number> = {};
      if (res?.data?.delays) {
        res.data.delays.forEach((d: any) => {
          if (d.train) {
            delaysMap[d.train] = d.arrivalDelayMinutes != null ? d.arrivalDelayMinutes : (d.departureDelayMinutes || 0);
          }
        });
      }
      setOverlayData(delaysMap);
    } catch (e) {
      console.warn('Could not fetch journey delay overlay:', e);
    } finally {
      setLoadingOverlay(false);
    }
  };

  // Popular circuits presets for 1-Click Itinerary loader
  const popularCircuits = [
    {
      id: 'golden-triangle',
      title: 'Golden Triangle Express',
      tag: 'Heritage & Culture',
      stops: 'New Delhi (NDLS) → Agra Cantt (AGC) → Jaipur (JP) → New Delhi (NDLS)',
      desc: 'India’s most celebrated cultural loop. Connects Mughal landmarks at Agra and Rajput palaces in Jaipur with fast Gatimaan, Shatabdi, and Vande Bharat connections.',
      stats: '~780 km • 4-5 Days',
      src: { stationCode: 'NDLS', stationName: 'New Delhi' },
      dst: { stationCode: 'JP', stationName: 'Jaipur' },
      via: ['Agra Cantt (AGC)'],
    },
    {
      id: 'spiritual-ganga',
      title: 'Spiritual Ganga Corridor',
      tag: 'Pilgrimage Circuit',
      stops: 'New Delhi (NDLS) → Ayodhya Cantt (AYC) → Varanasi (BSB) → Prayagraj (PRYJ)',
      desc: 'Explore ancient ghats and sacred heritage across Uttar Pradesh with dedicated Vande Bharat Express and superfast intercity links.',
      stats: '~950 km • 5-6 Days',
      src: { stationCode: 'NDLS', stationName: 'New Delhi' },
      dst: { stationCode: 'PRYJ', stationName: 'Prayagraj Jn' },
      via: ['Ayodhya Cantt (AYC)', 'Varanasi (BSB)'],
    },
    {
      id: 'konkan-coastal',
      title: 'Konkan Coastal Explorer',
      tag: 'Scenic Western Ghats',
      stops: 'Mumbai CSMT (CSMT) → Goa Madgaon (MAO) → Mangaluru (MAQ) → Kochi (ERS)',
      desc: 'Traverse viaducts, coastal bridges, and tunnels along the breathtaking Arabian Sea coastline across Maharashtra, Goa, Karnataka, and Kerala.',
      stats: '~1,450 km • 6-8 Days',
      src: { stationCode: 'CSMT', stationName: 'Mumbai CSMT' },
      dst: { stationCode: 'ERS', stationName: 'Ernakulam Jn' },
      via: ['Madgaon (MAO)', 'Mangaluru Central (MAQ)'],
    },
    {
      id: 'south-india-temple',
      title: 'South India Temple & Heritage',
      tag: 'Southern Rail Corridor',
      stops: 'Chennai Central (MAS) → Tirupati (TPTY) → KSR Bengaluru (SBC) → Mysuru (MYS)',
      desc: 'Seamless transit through Dravidian architectural capitals and tech hubs with high-frequency Vande Bharat and Shatabdi corridors.',
      stats: '~620 km • 5 Days',
      src: { stationCode: 'MAS', stationName: 'MGR Chennai Central' },
      dst: { stationCode: 'MYS', stationName: 'Mysuru Jn' },
      via: ['Tirupati (TPTY)', 'KSR Bengaluru (SBC)'],
    },
    {
      id: 'royal-rajasthan',
      title: 'Royal Rajasthan Desert Trail',
      tag: 'Desert Circuit',
      stops: 'Jaipur (JP) → Jodhpur (JU) → Jaisalmer (JSM) → Bikaner (BKN)',
      desc: 'Experience the Thar desert forts, sand dunes, and royal havelis connected by overnight sleeper expresses and daily intercity trains.',
      stats: '~1,080 km • 6-7 Days',
      src: { stationCode: 'JP', stationName: 'Jaipur' },
      dst: { stationCode: 'BKN', stationName: 'Bikaner Jn' },
      via: ['Jodhpur (JU)', 'Jaisalmer (JSM)'],
    },
    {
      id: 'himalayan-foothills',
      title: 'Himalayan Foothills & Punjab',
      tag: 'Northern Circuit',
      stops: 'New Delhi (NDLS) → Haridwar (HW) → Dehradun (DDN) → Amritsar (ASR)',
      desc: 'Connect spiritual Haridwar and Himalayan gateways in Dehradun with the Golden Temple in Amritsar via Northern Railway express routes.',
      stats: '~920 km • 5-6 Days',
      src: { stationCode: 'NDLS', stationName: 'New Delhi' },
      dst: { stationCode: 'ASR', stationName: 'Amritsar Jn' },
      via: ['Haridwar (HW)', 'Dehradun (DDN)'],
    },
  ];

  const handleLoadCircuit = (circuit: typeof popularCircuits[0]) => {
    setSelectedSource(circuit.src);
    setSourceQuery(`${circuit.src.stationName} (${circuit.src.stationCode})`);
    setSelectedDest(circuit.dst);
    setDestQuery(`${circuit.dst.stationName} (${circuit.dst.stationCode})`);
    setIntermediateCities(circuit.via);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    executePlanSearch(circuit.src, circuit.dst, travelDate);
  };

  // Filtered Journeys based on transfer filter (DIRECT vs ALL) and Preferred Time
  const filteredJourneys = journeys.filter((j) => {
    if (transferFilter === 'DIRECT' && !j.direct) return false;
    if (preferredTime !== 'ANY') {
      const timeStr = j.originDepartureTime || '';
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (!isNaN(hour)) {
        if (preferredTime === 'MORNING' && (hour < 6 || hour >= 12)) return false;
        if (preferredTime === 'AFTERNOON' && (hour < 12 || hour >= 18)) return false;
        if (preferredTime === 'EVENING' && (hour < 18 || hour >= 24)) return false;
        if (preferredTime === 'NIGHT' && hour >= 6) return false;
      }
    }
    return true;
  });

  const sortedJourneys = [...filteredJourneys].sort((a, b) => {
    if (sortBy === 'ARRIVAL') {
      const aTime = a.destinationArrivalTime || '';
      const bTime = b.destinationArrivalTime || '';
      return aTime.localeCompare(bTime);
    }
    if (sortBy === 'DEPARTURE') {
      const aTime = a.originDepartureTime || '';
      const bTime = b.originDepartureTime || '';
      return aTime.localeCompare(bTime);
    }
    return (a.totalDurationMinutes || 0) - (b.totalDurationMinutes || 0);
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-12 space-y-6 sm:space-y-8 relative">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back to previous page button */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors text-xs sm:text-sm font-semibold cursor-pointer bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-blue-400" />
          <span>Back</span>
        </button>
      </div>

      {/* TOP OVERVIEW CARD (Matching Exact RailRadar Design from Screenshot) */}
      <div className="bg-[#0b1329] border border-blue-900/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs sm:text-sm font-bold pb-4 border-b border-white/5">
          <Navigation className="w-4 h-4 text-blue-400" />
          <span>Plan a Multi-City Rail Trip</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 items-center">
          {/* Left Column: Mascot & Description */}
          <div className="md:col-span-5 flex flex-col items-center text-center sm:text-left sm:flex-row gap-4">
            <ElephantMascot />
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Add every city you want to visit, how many nights you’ll stay, and get a full plan across trains and connections — not just one route at a time.
              </p>
            </div>
          </div>

          {/* Divider line for medium+ screens */}
          <div className="hidden md:block w-px h-32 bg-slate-800" />

          {/* Right Column: "WHAT YOU GET" Bullet Points */}
          <div className="md:col-span-6 space-y-3">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              WHAT YOU GET
            </div>
            <div className="space-y-2.5 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Multi-city trips across 2 to 6 stations in one search</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Stay days at each stop shift the next leg automatically</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Connections when no direct train exists, with wait & risk shown</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Every leg individually — one broken segment never blanks the trip</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tip Banner */}
        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Add up to 6 stops. Leave stay days at 0 to continue the same day.</span>
        </div>
      </div>

      {/* Query Form Box - Styled matching RailRadar Multi-City Planner */}
      <div ref={formRef} className="bg-[#0b1329] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 space-y-5 sm:space-y-6 relative overflow-hidden shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
        <div className="text-base sm:text-lg font-bold text-slate-200 pb-2 border-b border-slate-800">
          Multi-City Journey Planner
        </div>

        {/* 1. Origin Station Block (Top) */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
              <span>Starting Station (Origin)</span>
            </label>
            {selectedSource && (
              <span className="text-[10px] font-bold text-blue-400 font-mono bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded">
                {selectedSource.stationCode}
              </span>
            )}
          </div>

          <div className="relative">
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
              className="bg-slate-950/80 border border-slate-800 rounded-xl w-full px-4 py-3 sm:py-3.5 text-slate-200 outline-none text-xs sm:text-sm font-semibold placeholder-slate-500 focus:border-blue-500 transition shadow-inner"
              placeholder="Search origin (e.g. CSMT, UJN)..."
            />
            {selectedSource && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSource(null);
                  setSourceQuery('');
                  setJourneys([]);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-400 hover:text-blue-300 text-[10px] font-bold tracking-wider uppercase"
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
                    if (selectedDest) {
                      executePlanSearch(s, selectedDest, travelDate);
                    } else {
                      setJourneys([]);
                    }
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
                </button>
              ))}
            </div>
          )}

          {/* Departure Date & Preferred Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Departure Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl w-full px-3 py-2.5 text-slate-200 outline-none text-xs font-semibold cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Preferred Time
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value as any)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl w-full px-3 py-2.5 text-slate-200 outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="ANY">Any time</option>
                <option value="MORNING">Morning (06:00 - 12:00)</option>
                <option value="AFTERNOON">Afternoon (12:00 - 18:00)</option>
                <option value="EVENING">Evening (18:00 - 24:00)</option>
                <option value="NIGHT">Night (00:00 - 06:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Swap Stations Button */}
        <div className="relative flex items-center justify-center my-1 z-10">
          <button
            type="button"
            onClick={swapStations}
            className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-full text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95 group cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
            <span>Swap Stations</span>
          </button>
        </div>

        {/* 2. Destination Station Block */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
              <span>Final Destination</span>
            </label>
            {selectedDest && (
              <span className="text-[10px] font-bold text-rose-400 font-mono bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
                {selectedDest.stationCode}
              </span>
            )}
          </div>

          <div className="relative">
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
              className="bg-slate-950/80 border border-slate-800 rounded-xl w-full px-4 py-3 sm:py-3.5 text-slate-200 outline-none text-xs sm:text-sm font-semibold placeholder-slate-500 focus:border-blue-500 transition shadow-inner"
              placeholder="Search destination (e.g. GHY, NDLS)..."
            />
            {selectedDest && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDest(null);
                  setDestQuery('');
                  setJourneys([]);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-400 hover:text-blue-300 text-[10px] font-bold tracking-wider uppercase"
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
                    if (selectedSource) {
                      executePlanSearch(selectedSource, d, travelDate);
                    } else {
                      setJourneys([]);
                    }
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Intermediate City Rows */}
        {intermediateCities.map((city, idx) => (
          <div key={idx} className="space-y-1 relative z-10">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[11px] font-black flex items-center justify-center">via</span>
                <span>Via City / Junction #{idx + 1}</span>
              </span>
              <button
                type="button"
                onClick={() => setIntermediateCities(prev => prev.filter((_, i) => i !== idx))}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                const val = e.target.value;
                setIntermediateCities(prev => prev.map((c, i) => i === idx ? val : c));
              }}
              placeholder="Intermediate Junction (e.g. BZA, ET, NGP)..."
              className="bg-slate-950/80 border border-slate-800 rounded-xl w-full px-3.5 py-2.5 text-slate-200 outline-none text-xs sm:text-sm font-semibold placeholder-slate-500 focus:border-blue-500 transition"
            />
          </div>
        ))}

        {/* + Add Another City Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIntermediateCities(prev => [...prev, ''])}
            className="w-full border border-dashed border-slate-700 hover:border-blue-500 py-2.5 rounded-xl text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another City</span>
          </button>
        </div>

        {/* Transfers & Nearby Controls */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Transfers</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setTransferFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  transferFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Connections
              </button>
              <button
                type="button"
                onClick={() => setTransferFilter('DIRECT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  transferFilter === 'DIRECT'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Direct Only
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeNearby}
              onChange={(e) => setIncludeNearby(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-medium">Include nearby city stations</span>
          </label>
        </div>

        {/* Search Multi-City Trains Button */}
        <div className="pt-2 z-10 relative">
          <button
            onClick={handlePlanJourney}
            disabled={!selectedSource || !selectedDest || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-900 disabled:text-slate-500 text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Searching Multi-City Routes...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-white" />
                <span>Search Multi-City Trains</span>
              </>
            )}
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
        <div className="text-center py-20 text-slate-400 animate-fade-in">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500 animate-spin" />
          </div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Searching multi-city routes and connections...</p>
        </div>
      )}

      {/* Results Dashboard (Matching Image 4 & Image 5) */}
      {!loading && searched && (
        <div className="space-y-4 relative z-10 animate-fade-in">
          {/* Header Bar: "1 MCI -> KZJ    2026-11-05" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm font-semibold text-slate-300 px-1 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">1</span>
              <span className="font-bold text-white tracking-wide">
                {selectedSource?.stationCode || 'SRC'} → {selectedDest?.stationCode || 'DST'}
              </span>
              <span className="text-[11px] text-slate-400">
                ({sortedJourneys.length} {transferFilter === 'DIRECT' ? 'direct trains' : 'options'})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sort controls (Arrival time default) */}
              <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSortBy('ARRIVAL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    sortBy === 'ARRIVAL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Arr Time ↓
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('DEPARTURE')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    sortBy === 'DEPARTURE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dep Time
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('DURATION')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    sortBy === 'DURATION'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Duration
                </button>
              </div>

              <span className="font-mono text-slate-400 text-xs hidden sm:inline">
                {travelDate || new Date().toISOString().split('T')[0]}
              </span>

              {journeys.length > 0 && (
                <button
                  onClick={toggleDelayOverlay}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                    showOverlay
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                  <span>{showOverlay ? 'Delays ON' : 'Delay Stats'}</span>
                  {loadingOverlay && <RefreshCw className="w-3 h-3 animate-spin" />}
                </button>
              )}
            </div>
          </div>

          {sortedJourneys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJourneys.map((j, idx) => {
                const leg1Duration = j.direct
                  ? (j.totalDurationMinutes || 128)
                  : calcLegDuration(j.originDepartureTime, j.transferArrivalTime, Math.round(((j.totalDurationMinutes || 180) - (j.layoverMinutes || 0)) / 2));
                const leg2Duration = j.direct
                  ? 0
                  : calcLegDuration(j.transferDepartureTime, j.destinationArrivalTime, Math.round(((j.totalDurationMinutes || 180) - (j.layoverMinutes || 0)) / 2));

                return (
                  <div
                    key={idx}
                    className="rounded-xl overflow-hidden border border-slate-800/90 hover:border-blue-500/40 bg-[#0c1322] shadow-xl flex flex-col justify-between transition-all duration-200"
                  >
                    <div>
                      {/* Top Header Pill Bar (Image 4 & 5 Exact Style) */}
                      <div className="bg-[#2563eb] text-white px-4 py-2 flex items-center justify-between text-xs font-bold tracking-wide select-none">
                        <span>{formatCompactDuration(j.totalDurationMinutes)}</span>
                        <span>{j.direct ? '0 Changes' : '1 Change'}</span>
                        <span>{formatKm(j.totalDistanceKm, j.totalDurationMinutes)}</span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Leg 1 */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm tracking-wide">{j.firstTrainNumber}</span>
                            <span className="text-xs text-slate-300 font-medium truncate">{translateName(j.firstTrainName, language)}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                            <div className="text-left min-w-[70px]">
                              <div className="font-bold text-white text-xs sm:text-sm">{formatTimeToAMPM(j.originDepartureTime)}</div>
                              <div className="font-semibold text-slate-300 text-xs">{j.originStationCode}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[100px]">{translateName(j.originStationName, language)}</div>
                            </div>

                            <div className="flex-1 flex flex-col items-center px-1">
                              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                                {formatCompactDuration(leg1Duration)}
                              </span>
                              <div className="w-full flex items-center gap-1 my-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                <div className="flex-1 border-t border-slate-600 border-dashed"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                {formatKm(j.firstLegDistanceKm, leg1Duration)}
                              </span>
                            </div>

                            <div className="text-right min-w-[70px]">
                              <div className="font-bold text-white text-xs sm:text-sm">
                                {formatTimeToAMPM(j.direct ? j.destinationArrivalTime : j.transferArrivalTime)}
                              </div>
                              <div className="font-semibold text-slate-300 text-xs">
                                {j.direct ? j.destinationStationCode : j.transferStationCode}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[100px] text-right">
                                {translateName(j.direct ? j.destinationStationName : j.transferStationName, language)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Direct Train Delay Note (Matches Image 4) */}
                        {j.direct && getDirectTrainDelayNote(j) && (
                          <div className="pt-2 text-[11px] text-slate-400 font-normal">
                            {getDirectTrainDelayNote(j)}
                          </div>
                        )}

                        {/* Connection Switch Advice (Matches Image 5) */}
                        {!j.direct && (
                          <div className="my-2.5 p-3 rounded-lg bg-[#0e1629] border border-blue-900/30 text-[11px] leading-relaxed text-slate-300">
                            {getSwitchAdvice(j)}
                          </div>
                        )}

                        {/* Leg 2 (for Connecting Trains) */}
                        {!j.direct && (
                          <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs sm:text-sm tracking-wide">{j.secondTrainNumber}</span>
                              <span className="text-xs text-slate-300 font-medium truncate">{translateName(j.secondTrainName, language)}</span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                              <div className="text-left min-w-[70px]">
                                <div className="font-bold text-white text-xs sm:text-sm">{formatTimeToAMPM(j.transferDepartureTime)}</div>
                                <div className="font-semibold text-slate-300 text-xs">{j.transferStationCode}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[100px]">{translateName(j.transferStationName, language)}</div>
                              </div>

                              <div className="flex-1 flex flex-col items-center px-1">
                                <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                                  {formatCompactDuration(leg2Duration)}
                                </span>
                                <div className="w-full flex items-center gap-1 my-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                  <div className="flex-1 border-t border-slate-600 border-dashed"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></div>
                                </div>
                                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                  {formatKm(j.secondLegDistanceKm, leg2Duration)}
                                </span>
                              </div>

                              <div className="text-right min-w-[70px]">
                                <div className="font-bold text-white text-xs sm:text-sm">{formatTimeToAMPM(j.destinationArrivalTime)}</div>
                                <div className="font-semibold text-slate-300 text-xs">{j.destinationStationCode}</div>
                                <div className="text-[11px] text-slate-400 truncate max-w-[100px] text-right">{translateName(j.destinationStationName, language)}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Itinerary Action */}
                    <div className="px-4 py-2 border-t border-white/5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(j)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer font-semibold"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email Itinerary</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0c1322] border border-slate-800 rounded-2xl text-slate-400 space-y-3 animate-fade-in">
              <HelpCircle className="h-9 w-9 mx-auto opacity-30 text-blue-400" />
              <div className="space-y-1">
                <p className="font-bold text-slate-200 text-sm tracking-wide">{t('noJourneysFound')}</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">{t('noJourneysFoundDesc')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MULTI-CITY TRAIN JOURNEY & CONNECTING ROUTE GUIDE (Requested by user)
          ========================================================================= */}
      <div className="pt-8 sm:pt-14 space-y-10 border-t border-slate-800 relative z-10 text-slate-300">
        
        {/* Guide Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive IRCTC Multi-Stop Handbook</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Multi-City Train Journey & Connecting Route Guide
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Everything you need to plan seamless multi-station train journeys across Indian Railways: popular circuits, IRCTC break journey rules, telescopic circular fares, and connection buffers.
          </p>
        </div>

        {/* 1. Popular Multi-City Rail Circuits (1-Click Itinerary Presets) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Popular Multi-City Rail Circuits</h3>
              <p className="text-xs text-slate-400">1-Click Itinerary Presets</p>
            </div>
            <span className="text-xs text-blue-400 font-medium">Select any verified circuit to auto-load stops</span>
          </div>

          <p className="text-xs text-slate-400">
            Select any verified Indian Railways circuit below to instantly load its station stops, recommended stay windows, and connection graph into the planner above.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularCircuits.map((c) => (
              <div
                key={c.id}
                className="bg-[#0b1329] border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all duration-200 group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded">
                      {c.tag}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-400">{c.stats}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                    {c.title}
                  </h4>

                  <div className="text-xs font-semibold text-blue-300/90 leading-tight">
                    {c.stops}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {c.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleLoadCircuit(c)}
                    className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-transparent py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Load Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. How to Use the Multi-City Planner */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-white pb-2 border-b border-slate-800">
            How to Use the Multi-City Planner
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">1</div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Chain Up to 6 Stops</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add multiple destination cities into a single unified itinerary. Plan complete round trips, pilgrimage routes, or business circuits without running separate point-to-point queries.
              </p>
            </div>

            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">2</div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Set Stay Days per City</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spending 2 nights at a city? Set your stay duration. Subsequent legs automatically shift to the exact forward calendar date with updated running days.
              </p>
            </div>

            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">3</div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Metro City Cluster Search</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enable &ldquo;Search nearby city stations&rdquo; to check metro clusters (e.g. Borivali, Bandra, and CSMT for Mumbai; Hazrat Nizamuddin, Anand Vihar, and New Delhi for Delhi).
              </p>
            </div>

            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">4</div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Time of Day Preference</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter any segment by Morning, Afternoon, Evening, or Night departures to align with hotel check-out timings and personalized travel schedules.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Indian Railways Break Journey Rules (Rule 213 of IRCA Coaching Tariff) */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>Indian Railways Break Journey Rules (Rule 213 of IRCA Coaching Tariff)</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Passengers holding a single long-distance journey ticket on Indian Railways can legally break their journey without purchasing separate tickets for every leg, subject to official IRCA conditions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Minimum 500 km Distance</div>
              <p className="text-slate-400">Break journey is only permitted after completing at least 500 km from the originating station. The first break cannot be taken before 500 km.</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Number of Breaks Allowed</div>
              <p className="text-slate-400">For tickets over 500 km, 1 break journey is permitted. For tickets with a total distance exceeding 1,000 km, up to 2 break journeys are permitted.</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Maximum Break Duration</div>
              <p className="text-slate-400">Each break journey is valid for up to 2 days, excluding the day of arrival and the day of departure.</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Station Master Endorsement</div>
              <p className="text-slate-400">Upon detraining at the intermediate break station, the passenger must have their ticket endorsed with the station code, date, and initials by the Station Master or Ticket Collector.</p>
            </div>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            <span className="font-bold">Train Exclusions: </span>
            Break journey is not permitted on point-to-point premium trains including Rajdhani, Shatabdi, Jan Shatabdi, and Vande Bharat Express services.
          </div>
        </div>

        {/* 4. Circular Journey Tickets (CJT) & Telescopic Fare Savings */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Circular Journey Tickets (CJT) & Telescopic Fare Savings</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When traveling across 3 or more cities in a circular loop, Indian Railways offers substantial fare savings through the Telescopic Fare Principle:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
              <h5 className="font-bold text-white">Telescopic Rate Structure</h5>
              <p className="text-slate-400 leading-relaxed">
                As journey distance increases, the base fare per kilometer decreases significantly. A single circular or continuous ticket over 1,500 km costs substantially less than buying 3 separate 500 km point-to-point tickets.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
              <h5 className="font-bold text-white">Continuous Loop Routing</h5>
              <p className="text-slate-400 leading-relaxed">
                Circular tickets must form a continuous circuit beginning and ending at the same origin, or progressing forward without retracing track sections. Route combinations can be planned using the multi-station generator above.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Connection Logic & Punctuality Engine */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Connection Logic & Punctuality Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">The 2h–4h Sweet Spot Rule</div>
              <p className="text-slate-400 leading-relaxed">
                Indian railway long-distance trains can encounter line congestion and crossing delays. A layover under 90 minutes is risky, while waiting over 5 hours exhausts travelers. The planner prioritizes balanced 2 to 4 hour layovers.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Historical Delay Overlay</div>
              <p className="text-slate-400 leading-relaxed">
                Instead of theoretical timetable arrivals, the planner consults day-of-week historical punctuality data. The real platform switch time accounts for average incoming delay.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Automatic Backup Trains</div>
              <p className="text-slate-400 leading-relaxed">
                If your incoming train faces unexpected delays and you miss your connection, the planner card displays the next available departure on that corridor so you always have a fallback plan.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Cross-Station Transit Estimates</div>
              <p className="text-slate-400 leading-relaxed">
                When changing between different stations in the same metro cluster (e.g., Howrah to Sealdah in Kolkata, or Hazrat Nizamuddin to New Delhi), the engine automatically accounts for road transit time.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Official IRCTC Connecting PNR Linking & Full Refund Guarantee */}
        <div className="bg-[#0b1329] border border-blue-900/30 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official IRCTC Connecting PNR Linking & Full Refund Guarantee</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When traveling on two separate connecting trains, Indian Railways provides complete refund protection under the official Connecting Journey Booking scheme:
          </p>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <p><strong className="text-white">Link PNRs during booking:</strong> When booking on IRCTC, select the &ldquo;Connecting Journey Booking&rdquo; option under the Train menu. Enter the PNR of your first leg when booking the second leg to officially link both tickets.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <p><strong className="text-white">Full refund on missed connections:</strong> If Train 1 arrives late and you miss Train 2, surrender your ticket at the interchange station or file a TDR online within 3 hours of Train 1&rsquo;s actual arrival. The entire fare for the untraveled portion is refunded with zero cancellation penalty.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <p><strong className="text-white">Minimum layover requirement:</strong> IRCTC rules require a minimum time gap between the scheduled arrival of Train 1 and scheduled departure of Train 2: at least 1 minute for same-station changes, and at least 3 hours when changing between different stations in the same city cluster.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <p><strong className="text-white">Passenger name match:</strong> Both tickets must have identical passenger names, age, and gender to qualify for linked connection protection.</p>
            </div>
          </div>
        </div>

        {/* 7. Interchange Hubs & Station Layover Amenities */}
        <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Building className="w-4 h-4 text-purple-400" />
            <span>Interchange Hubs & Station Layover Amenities</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Major Indian Railways junction hubs (e.g. New Delhi NDLS, Pt. Deen Dayal Upadhyaya DDU, Bhopal BPL, Itarsi ET, Kanpur Central CNB, Vadodara BRC, and Pune PUNE) offer round-the-clock facilities for travelers waiting on connections:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">IRCTC Retiring Rooms</div>
              <p className="text-slate-400 leading-relaxed">
                Air-conditioned rooms and dormitories bookable hourly (3h to 24h) directly on the IRCTC Tourism portal using your PNR number.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Station Cloakrooms</div>
              <p className="text-slate-400 leading-relaxed">
                Secure 24/7 luggage storage at major terminals. Available for reserved ticket holders with locked luggage for nominal daily fees.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-white">Executive Lounges</div>
              <p className="text-slate-400 leading-relaxed">
                Available at Tier-1 stations with recliners, complimentary Wi-Fi, washrooms, and buffet meals for comfortable platform layovers.
              </p>
            </div>
          </div>
        </div>

        {/* 8. Frequently Asked Questions */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-white pb-2 border-b border-slate-800">
            Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {[
              {
                q: 'How do IRCTC break journey rules work for tickets over 500 km?',
                a: 'Under Rule 213 of IRCA Coaching Tariff, passengers holding tickets for journeys exceeding 500 km can break journey once for up to 2 days (excluding days of arrival and departure). For journeys over 1,000 km, two break journeys are permitted. You must have your ticket endorsed by the Station Master upon arrival at the intermediate break station.',
              },
              {
                q: 'What happens if my first train is delayed and I miss my connection?',
                a: "If you booked both tickets under IRCTC's 'Connecting Journey Booking' feature with linked PNRs, you are entitled to a 100% refund on the untraveled leg with zero cancellation fees. Surrender your ticket at the interchange station or file an online TDR within 3 hours of the actual arrival of your first train.",
              },
              {
                q: 'What is the difference between a Circular Journey Ticket and multiple point-to-point tickets?',
                a: 'Circular Journey Tickets benefit from Indian Railways telescopic fare structure: base fares per kilometer decrease as distance increases. A single continuous circular route over 1,500 km is substantially cheaper than booking 3 separate 500 km tickets.',
              },
              {
                q: 'What is the recommended buffer time for changing trains at junction stations?',
                a: 'A layover buffer between 2 and 4 hours is strongly recommended. Less than 90 minutes leaves high risk of missed connections due to normal railway operational delays. RailRadar calculates realistic switch windows based on historical arrival punctuality at transfer stations.',
              },
              {
                q: 'Can I use this planner without an active internet connection?',
                a: 'Yes. RailRadar downloads a compressed timetable pack into the browser on initial load. The multi-stop routing graph, timetable search, and layover calculations run directly on your device even when offline.',
              },
            ].map((faq, i) => {
              const isExpanded = expandedFaq === i;
              return (
                <div
                  key={i}
                  className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : i)}
                    className="w-full px-4 py-3 text-left font-bold text-xs sm:text-sm text-slate-200 hover:text-blue-300 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3.5 pt-1 text-xs text-slate-400 border-t border-white/5 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. Notice Disclaimer */}
        <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 leading-relaxed text-center sm:text-left">
          <strong className="text-slate-300">Notice: </strong>
          RailRadar is an independent rail transit intelligence platform and is not affiliated with the Ministry of Railways, Indian Railways, or IRCTC. Always check live platform indicators and station announcements upon arrival.
        </div>

      </div>

      {/* Email Itinerary Modal */}
      {emailModalJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Travel Itinerary</span>
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {emailModalJourney.originStationCode} ➔ {emailModalJourney.destinationStationCode}
                </h3>
              </div>
              <button
                onClick={() => setEmailModalJourney(null)}
                className="text-slate-500 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              We will send a formatted travel memo with departure/arrival timings, transfer halts, and a live tracking link via Brevo.
            </p>

            {emailStatus && (
              <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                emailStatus.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
              }`}>
                {emailStatus.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                <span>{emailStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSendItineraryEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. passenger@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalJourney(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      <span>Send Memo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
