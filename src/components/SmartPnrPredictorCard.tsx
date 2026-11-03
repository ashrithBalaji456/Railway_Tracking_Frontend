import { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Mail,
  Send,
  MessageSquare,
  TrendingUp,
  Activity,
  ShieldCheck,
  Flame
} from 'lucide-react';
import api from '../services/api';
import {
  pnrPredictorService,
  type QuotaType,
  type TrainClassType,
  type ProbabilityResult,
  type ChartingTimelineResult
} from '../utils/pnrPredictorService';
import { whatsappShareService } from '../utils/whatsappShareService';

interface SmartPnrPredictorCardProps {
  initialPnr?: string;
  initialTrainNumber?: string;
  initialTrainName?: string;
  initialTravelDate?: string;
}

export default function SmartPnrPredictorCard({
  initialPnr = '',
  initialTrainNumber = '12951',
  initialTrainName = 'Mumbai Rajdhani',
  initialTravelDate
}: SmartPnrPredictorCardProps) {
  const [activeTab, setActiveTab] = useState<'predictor' | 'charting'>('predictor');

  // Predictor Inputs
  const [pnr, setPnr] = useState(initialPnr || '4521849021');
  const [quota, setQuota] = useState<QuotaType>('GNWL');
  const [travelClass, setTravelClass] = useState<TrainClassType>('SL');
  const [bookingStatus, setBookingStatus] = useState<number>(45);
  const [currentStatus, setCurrentStatus] = useState<number>(18);
  const [prediction, setPrediction] = useState<ProbabilityResult | null>(null);

  // Charting Inputs
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber || '12951');
  const [trainName, setTrainName] = useState(initialTrainName || 'Mumbai Rajdhani');
  const [departureTime, setDepartureTime] = useState('16:30');
  const [travelDate, setTravelDate] = useState(() => {
    if (initialTravelDate) return initialTravelDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [chartTimeline, setChartTimeline] = useState<ChartingTimelineResult | null>(null);

  // Email Notification Inputs
  const [alertEmail, setAlertEmail] = useState(() => localStorage.getItem('email') || '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [alertStatus, setAlertStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Keep PNR in sync if prop changes
  useEffect(() => {
    if (initialPnr) setPnr(initialPnr);
    if (initialTrainNumber) setTrainNumber(initialTrainNumber);
    if (initialTrainName) setTrainName(initialTrainName);
  }, [initialPnr, initialTrainNumber, initialTrainName]);

  // Recalculate prediction whenever inputs change
  useEffect(() => {
    const res = pnrPredictorService.calculateProbability({
      quota,
      travelClass,
      bookingStatus,
      currentStatus,
      travelDate
    });
    setPrediction(res);
  }, [quota, travelClass, bookingStatus, currentStatus, travelDate]);

  // Recalculate charting countdown every second
  useEffect(() => {
    const updateTimeline = () => {
      const res = pnrPredictorService.calculateChartTimeline(travelDate, departureTime);
      setChartTimeline(res);
    };

    updateTimeline();
    const interval = setInterval(updateTimeline, 1000);
    return () => clearInterval(interval);
  }, [travelDate, departureTime]);

  const handleScheduleChartAlert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!alertEmail.trim() || !alertEmail.includes('@')) {
      setAlertStatus({ type: 'error', text: 'Please provide a valid recipient email address.' });
      return;
    }

    try {
      setEmailLoading(true);
      setAlertStatus(null);
      await api.post('/api/v1/pnr/chart-alert', {
        pnr: pnr.replace(/\D/g, '').slice(0, 10) || '4521849021',
        trainNumber: trainNumber || '12951',
        trainName: trainName || 'Express',
        travelDate,
        departureTime,
        chartType: chartTimeline?.isChart1Ready ? 'Chart 2 (Final Chart)' : 'Chart 1 (First Reservation Chart)',
        confirmationProbability: `${prediction?.probability || 84}% (${prediction?.headline || 'High Chance'})`,
        email: alertEmail.trim()
      });

      setAlertStatus({
        type: 'success',
        text: `Chart notification armed! We will dispatch an automated email when IRCTC finalizes ${chartTimeline?.isChart1Ready ? 'Chart 2' : 'Chart 1'}.`
      });
    } catch (err: any) {
      setAlertStatus({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Could not register chart alert. Please verify your connection.'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleTestChartAlert = async () => {
    if (!alertEmail.trim() || !alertEmail.includes('@')) {
      setAlertStatus({ type: 'error', text: 'Please enter a valid recipient email first.' });
      return;
    }

    try {
      setEmailTesting(true);
      setAlertStatus(null);
      await api.post('/api/v1/pnr/chart-alert/test', {
        pnr: pnr.replace(/\D/g, '').slice(0, 10) || '4521849021',
        trainNumber: trainNumber || '12951',
        trainName: trainName || 'Mumbai Rajdhani',
        travelDate,
        departureTime,
        chartType: chartTimeline?.isChart1Ready ? 'Chart 2 (Final Chart)' : 'Chart 1 (First Reservation Chart)',
        confirmationProbability: `${prediction?.probability || 84}% (${prediction?.headline || 'High Chance'})`,
        email: alertEmail.trim()
      });

      setAlertStatus({
        type: 'success',
        text: `Sample IRCTC Chart Finalized email dispatched to ${alertEmail.trim()}! Please check your inbox.`
      });
    } catch (err: any) {
      setAlertStatus({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Could not dispatch test email.'
      });
    } finally {
      setEmailTesting(false);
    }
  };

  const handleSharePredictionToWhatsApp = () => {
    if (!prediction) return;
    whatsappShareService.sharePnrConfirmationPrediction({
      pnr: pnr.replace(/\D/g, '').slice(0, 10) || '4521849021',
      trainNumber: trainNumber || '12951',
      travelDate,
      quota,
      travelClass,
      currentStatus,
      probability: prediction.probability,
      headline: prediction.headline
    });
  };

  const handleShareChartingToWhatsApp = () => {
    if (!chartTimeline) return;
    whatsappShareService.shareChartPreparationCountdown({
      trainNumber: trainNumber || '12951',
      trainName,
      travelDate,
      departureTime,
      phaseTitle: chartTimeline.phaseTitle,
      countdownText: chartTimeline.countdownFormatted.text,
      ruleApplied: chartTimeline.ruleApplied
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>AI & Statistical Clearance Engine</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Smart PNR Confirmation & Charting Predictor</span>
            </h3>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('predictor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'predictor'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Confirmation Predictor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('charting')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'charting'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chart Countdown Clock</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONFIRMATION PROBABILITY PREDICTOR */}
      {activeTab === 'predictor' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter your ticket quota, travel class, and current waitlist position. Our statistical model evaluates coach capacity, seat turnover rates, quota allocations, and clearance velocities to forecast your confirmation likelihood.
          </p>

          {/* Interactive Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {/* Quota Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Quota Type</span>
                <span className="text-[10px] text-indigo-400 font-normal">GNWL recommended</span>
              </label>
              <select
                value={quota}
                onChange={(e) => setQuota(e.target.value as QuotaType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="GNWL">GNWL (General Waitlist - Highest)</option>
                <option value="RLWL">RLWL (Remote Location WL)</option>
                <option value="PQWL">PQWL (Pooled Quota WL - Low)</option>
                <option value="TQWL">TQWL (Tatkal WL - Lowest)</option>
                <option value="RAC">RAC (Reservation Against Cancellation)</option>
              </select>
            </div>

            {/* Travel Class Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Travel Class</span>
              </label>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value as TrainClassType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="SL">SL (Sleeper - Max Berths)</option>
                <option value="3A">3A (AC 3 Tier)</option>
                <option value="3E">3E (3 AC Economy)</option>
                <option value="2A">2A (AC 2 Tier)</option>
                <option value="1A">1A (First AC - Min Berths)</option>
                <option value="CC">CC (AC Chair Car)</option>
                <option value="2S">2S (Second Sitting)</option>
              </select>
            </div>

            {/* Booking & Current Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Booking Status</span>
                <span className="text-[10px] text-slate-500">At time of booking</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-12">{quota}</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Current Status</span>
                <span className="text-[10px] text-emerald-400">Right now</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 w-12">{quota === 'RAC' ? 'RAC' : 'WL'}</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Prediction Results Gauge & Insights */}
          {prediction && (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl sm:text-3xl font-extrabold ${
                      prediction.color === 'emerald' ? 'text-emerald-400' :
                      prediction.color === 'amber' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {prediction.probability}%
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Confirmation Probability
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {prediction.color === 'emerald' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {prediction.color === 'amber' && <TrendingUp className="w-4 h-4 text-amber-400" />}
                    {prediction.color === 'rose' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{prediction.headline}</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Cleared <strong>{prediction.clearedSoFar} spots</strong> so far</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleSharePredictionToWhatsApp}
                    title="Share this probability forecast to WhatsApp"
                    className="px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-950/40"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share to WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-700 ease-out rounded-full ${
                    prediction.color === 'emerald'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : prediction.color === 'amber'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500'
                  }`}
                  style={{ width: `${prediction.probability}%` }}
                />
              </div>

              {/* Statistical Explanation & Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Historical Clearance Insight</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">{prediction.insight}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Actionable Travel Guidance</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">{prediction.advice}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE IRCTC CHART PREPARATION CLOCK */}
      {activeTab === 'charting' && chartTimeline && (
        <div className="space-y-6">
          {/* Timeline Rule Banner */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-indigo-200">
                <strong>Standard Rule:</strong> {chartTimeline.ruleApplied}
              </span>
            </div>
            <button
              type="button"
              onClick={() => pnrPredictorService.playNotificationChime()}
              title="Test the Web Audio countdown alert chime"
              className="text-xs text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Chime Preview</span>
            </button>
          </div>

          {/* Time & Departure Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Train Number & Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 shrink-0"
                />
                <input
                  type="text"
                  value={trainName}
                  onChange={(e) => setTrainName(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Journey Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Scheduled Departure Time (Origin)
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Next Milestone: {chartTimeline.nextMilestone}</span>
            </div>

            <div className="font-mono text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-indigo-300 tracking-wider">
              {chartTimeline.countdownFormatted.text}
            </div>

            <div className="text-xs text-slate-400 max-w-xl mx-auto">
              {chartTimeline.phaseTitle} &bull; Target Time:{' '}
              <strong className="text-white">
                {chartTimeline.nextMilestoneTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                {chartTimeline.nextMilestoneTime.toLocaleDateString([], { month: 'short', day: 'numeric' })})
              </strong>
            </div>

            {/* Visual Step Timeline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-left">
              <div className={`p-2.5 rounded-xl border text-[11px] ${
                !chartTimeline.isChart1Ready ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Phase 1</div>
                <div>Booking Open</div>
              </div>

              <div className={`p-2.5 rounded-xl border text-[11px] ${
                chartTimeline.isChart1Ready && !chartTimeline.isChart2Ready ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : !chartTimeline.isChart1Ready ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Phase 2</div>
                <div>Chart 1 Finalized</div>
              </div>

              <div className={`p-2.5 rounded-xl border text-[11px] ${
                chartTimeline.isChart1Ready && !chartTimeline.isChart2Ready ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Phase 3</div>
                <div>Current Booking</div>
              </div>

              <div className={`p-2.5 rounded-xl border text-[11px] ${
                chartTimeline.isChart2Ready ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Phase 4</div>
                <div>Chart 2 Locked</div>
              </div>
            </div>
          </div>

          {/* Alert Form Status Message */}
          {alertStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                alertStatus.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {alertStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{alertStatus.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setAlertStatus(null)}
                className="text-xs underline hover:opacity-80 cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Action Row: Email Alert & WhatsApp Share */}
          <form onSubmit={handleScheduleChartAlert} className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="relative flex-1 w-full">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="Alert Recipient Email (e.g. traveler@domain.com)"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={emailTesting}
                onClick={handleTestChartAlert}
                title="Send a sample IRCTC Chart Alert email immediately"
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{emailTesting ? 'Testing...' : 'Test Email'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareChartingToWhatsApp}
                title="Share this chart countdown clock to WhatsApp"
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-950/40"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="submit"
                disabled={emailLoading}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{emailLoading ? 'Arming...' : 'Arm Chart Alert'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
