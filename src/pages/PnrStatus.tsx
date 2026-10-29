import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Ticket, 
  ExternalLink, 
  MessageSquare, 
  Smartphone, 
  Train, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Trash2, 
  ArrowRight,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface SavedPnr {
  pnr: string;
  zone: string;
  timestamp: string;
  label?: string;
}

export default function PnrStatus() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [trainNumberInput, setTrainNumberInput] = useState('');
  const [savedPnrs, setSavedPnrs] = useState<SavedPnr[]>([]);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Load saved PNR history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rail_pnr_history');
      if (stored) {
        setSavedPnrs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading saved PNRs', e);
    }
  }, []);

  const cleanPnr = pnrInput.replace(/\D/g, '').slice(0, 10);
  const isValidPnr = cleanPnr.length === 10;

  // Determine PRS Server Zone from first digit
  const getPrsZone = (pnr: string): { zone: string; server: string; region: string } => {
    if (!pnr || pnr.length === 0) return { zone: 'Unknown', server: 'Indian Railways PRS', region: 'Pan-India' };
    const firstDigit = pnr.charAt(0);
    switch (firstDigit) {
      case '1':
        return { zone: 'SCR / South Central', server: 'Secunderabad PRS Hub', region: 'Telangana, Andhra Pradesh, Maharashtra' };
      case '2':
      case '3':
        return { zone: 'NR / NCR / NWR / NER', server: 'New Delhi / Northern PRS Hub', region: 'Delhi, UP, Punjab, Haryana, Rajasthan' };
      case '4':
      case '5':
        return { zone: 'WR / CR / WCR', server: 'Mumbai / Western & Central PRS Hub', region: 'Maharashtra, Gujarat, MP' };
      case '6':
      case '7':
        return { zone: 'SR / SWR', server: 'Chennai / Southern PRS Hub', region: 'Tamil Nadu, Kerala, Karnataka' };
      case '8':
      case '9':
        return { zone: 'ER / ECR / SER / ECoR / NFR', server: 'Kolkata / Eastern PRS Hub', region: 'West Bengal, Bihar, Odisha, Assam' };
      default:
        return { zone: 'Indian Railways', server: 'CRIS National PRS Server', region: 'Pan-India' };
    }
  };

  const prsInfo = getPrsZone(cleanPnr);

  // Save PNR to history
  const handleSavePnr = () => {
    if (!isValidPnr) return;
    try {
      const existing = savedPnrs.filter(item => item.pnr !== cleanPnr);
      const updated: SavedPnr[] = [
        {
          pnr: cleanPnr,
          zone: prsInfo.zone,
          timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        },
        ...existing
      ].slice(0, 8); // Keep last 8

      setSavedPnrs(updated);
      localStorage.setItem('rail_pnr_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save PNR', e);
    }
  };

  const handleDeleteSavedPnr = (pnrToDelete: string) => {
    const updated = savedPnrs.filter(item => item.pnr !== pnrToDelete);
    setSavedPnrs(updated);
    try {
      localStorage.setItem('rail_pnr_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPnr = () => {
    if (!cleanPnr) return;
    navigator.clipboard.writeText(cleanPnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Official portal URLs
  const officialIndianRailUrl = `https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en`;
  const officialIrctcUrl = `https://www.irctc.co.in/nget/enquiry/pnr-status`;
  const sms139Url = `sms:139?body=PNR%20${cleanPnr}`;
  const whatsAppRailMadadUrl = `https://wa.me/919881193322?text=PNR%20${cleanPnr}`;

  const handleOpenOfficial = (url: string) => {
    handleSavePnr();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Ticket className="w-3.5 h-3.5" />
              <span>Official Indian Railways PNR Portal & Multi-Channel Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Check PNR Status & Reservation Details
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Verify live booking confirmation, coach/berth allocation, waitlist progression, and chart preparation status directly from the official CRIS Passenger Reservation System (PRS).
            </p>
          </div>

          <div className="shrink-0 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-xs font-bold text-slate-200">100% Authentic CRIS Data</div>
            <div className="text-[10px] text-slate-400">Zero Third-Party Delays or Scraping Risks</div>
          </div>
        </div>
      </div>

      {/* Main PNR Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
        <div>
          <label htmlFor="pnrInput" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Enter 10-Digit PNR Number:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="pnrInput"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="e.g. 4521849021"
                value={pnrInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPnrInput(val);
                  setSearchParams(val ? { pnr: val } : {});
                }}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {cleanPnr.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPnr}
                    title="Copy PNR"
                    className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isValidPnr ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cleanPnr.length}/10
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!isValidPnr}
              onClick={() => handleOpenOfficial(officialIndianRailUrl)}
              className={`px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                isValidPnr
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Verify on IndianRail Portal</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time PRS Server Identification Box */}
        {cleanPnr.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-slate-400 text-[11px] font-semibold uppercase">Routing PRS Zone Architecture</div>
                <div className="text-slate-200 font-bold text-sm">{prsInfo.zone} ({prsInfo.server})</div>
                <div className="text-slate-400 text-[11px]">{prsInfo.region}</div>
              </div>
            </div>

            {isValidPnr ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid 10-Digit PNR Format
              </span>
            ) : (
              <span className="text-amber-400 text-xs font-medium self-start sm:self-center">
                Enter {10 - cleanPnr.length} more digits...
              </span>
            )}
          </div>
        )}

        {/* Multi-Channel Verification Actions Grid */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Direct Official Verification Channels</span>
            <span className="text-[10px] text-emerald-400 lowercase font-normal">(choose your preferred gateway)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Gateway 1: Indian Railways Portal */}
            <button
              type="button"
              onClick={() => handleOpenOfficial(officialIndianRailUrl)}
              className="text-left p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850/60 transition-all group cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-lg group-hover:scale-105 transition-transform">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Government</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm">IndianRail.gov.in</h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Official CRIS public portal. Instant berth, coach, quota, and charting verification.
                </p>
              </div>
              <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1 pt-1">
                <span>Open Gateway</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Gateway 2: IRCTC Official Web */}
            <button
              type="button"
              onClick={() => handleOpenOfficial(officialIrctcUrl)}
              className="text-left p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850/60 transition-all group cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-amber-950/60 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">IRCTC Portal</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm">IRCTC Official</h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Direct IRCTC passenger booking portal with detailed fare and passenger list breakdown.
                </p>
              </div>
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1 pt-1">
                <span>Check on IRCTC</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Gateway 3: Official 139 SMS / WhatsApp */}
            <a
              href={isValidPnr ? sms139Url : whatsAppRailMadadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSavePnr}
              className="text-left p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/60 transition-all group cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">1-Tap 139</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm">Official SMS 139 & WhatsApp</h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Pre-fills PNR query into your mobile SMS app or IRCTC Rail Madad WhatsApp bot.
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 pt-1">
                <span>{isValidPnr ? 'Send SMS 139' : 'Open Rail Madad'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Track Booked Train Live Fast Jump */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
            <Train className="w-4 h-4" />
            <span>Have your Train Number ready?</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Track Live Running Status, Platform & Coach Position
          </h3>
          <p className="text-xs text-slate-450">
            Once you know your train number, track its live GPS location, intermediate delay, coach composition (find where your coach is), and platform numbers in our app.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="e.g. 12723"
            value={trainNumberInput}
            onChange={(e) => setTrainNumberInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-28 sm:w-32 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            disabled={trainNumberInput.trim().length === 0}
            onClick={() => navigate(`/trains/${trainNumberInput.trim()}`)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Track Live
          </button>
        </div>
      </div>

      {/* Saved / Recent PNR Searches */}
      {savedPnrs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Recently Checked PNRs ({savedPnrs.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setSavedPnrs([]);
                localStorage.removeItem('rail_pnr_history');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {savedPnrs.map((item) => (
              <div
                key={item.pnr}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group"
              >
                <button
                  type="button"
                  onClick={() => {
                    setPnrInput(item.pnr);
                    setSearchParams({ pnr: item.pnr });
                  }}
                  className="text-left cursor-pointer flex-1 min-w-0"
                >
                  <span className="block font-mono text-sm font-bold text-indigo-300 tracking-wider">
                    {item.pnr.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate mt-0.5">
                    {item.zone} • {item.timestamp}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSavedPnr(item.pnr)}
                  title="Remove from history"
                  className="p-1 text-slate-600 hover:text-rose-400 transition-colors ml-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indian Railways PNR & Charting Knowledge Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Charting Rules */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>Official Chart Preparation Timeline</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <strong className="text-white block font-bold text-indigo-300">1. First Reservation Chart (Chart 1):</strong>
              <p className="text-slate-300">
                Prepared <strong className="text-amber-300">10 hours before</strong> scheduled departure from the originating station, customized by departure window:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400 mt-1">
                <li>
                  <strong className="text-slate-200">Trains departing after 2:00 PM or before 5:00 AM:</strong> Chart is finalized exactly <span className="text-emerald-400 font-bold">10 hours</span> before departure.
                </li>
                <li>
                  <strong className="text-slate-200">Trains departing between 5:00 AM and 2:00 PM:</strong> Chart is finalized the previous night at <span className="text-emerald-400 font-bold">8:00 PM</span> (or 9:00 PM depending on specific zonal updates).
                </li>
              </ul>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <strong className="text-white block mb-0.5 font-bold text-indigo-300">2. Second & Final Chart (Chart 2):</strong>
              Prepared exactly <strong className="text-amber-300">30 minutes</strong> before scheduled departure for all trains to allocate last-minute cancellations and current counter bookings.
            </div>
          </div>
        </div>

        {/* Quota & Status Code Reference */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>PNR Status Codes Quick Reference</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-emerald-400 block">CNF</span>
              <span className="text-slate-400">Confirmed Berth & Coach Allocated</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-sky-400 block">RAC</span>
              <span className="text-slate-400">Reservation Against Cancellation (Seat Guaranteed)</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-amber-400 block">GNWL</span>
              <span className="text-slate-400">General Waitlist (Highest Confirmation Chance)</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-rose-400 block">PQWL / RLWL</span>
              <span className="text-slate-400">Pooled / Remote Quota Waitlist (Intermediate Halts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Alert Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Important Boarding Notice for Waitlisted Passengers:</strong>
          <p className="mt-0.5 text-slate-300">
            If your online ticket (e-ticket booked on IRCTC) remains fully on the Waitlist (WL) after final chart preparation, it is automatically cancelled and refunded. Waitlisted e-ticket holders are strictly prohibited from boarding reserved coaches. Only passengers holding PRS physical counter waitlist tickets may board general/sleeper coaches as per railway guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
