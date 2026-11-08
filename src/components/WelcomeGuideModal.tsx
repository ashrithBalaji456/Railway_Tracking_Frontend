import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  Train, 
  Clock, 
  Bell, 
  MapPin, 
  Bot, 
  ShieldCheck, 
  Zap, 
  Compass, 
  FileText, 
  Lock, 
  Radio, 
  ChevronDown, 
  Utensils, 
  HeartHandshake, 
  HelpCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import heroImg from '../assets/hero.png';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: () => void;
}

export default function WelcomeGuideModal({ isOpen, onClose, onMarkAsRead }: WelcomeGuideModalProps) {
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endSentinelRef = useRef<HTMLDivElement>(null);

  // Reset scroll and reached-end state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setHasReachedEnd(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // Intercept Android hardware back gesture to close modal without marking as read
  useEffect(() => {
    if (!isOpen) return;

    const handleAndroidBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener('app:android-back', handleAndroidBack);
    return () => {
      window.removeEventListener('app:android-back', handleAndroidBack);
    };
  }, [isOpen, onClose]);

  // IntersectionObserver to detect when user reaches the end of the document
  useEffect(() => {
    if (!isOpen) return;

    const sentinel = endSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasReachedEnd(true);
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  // Fallback scroll position check
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      setHasReachedEnd(true);
    }
  };

  const handleMarkAsReadClick = () => {
    if (!hasReachedEnd) return;
    localStorage.setItem('railtrack_welcome_guide_read', 'true');
    onMarkAsRead();
  };

  if (!isOpen) return null;

  return (
    <div 
      data-modal-open="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Modal Dialog Container */}
      <div 
        className="relative w-full max-w-4xl bg-slate-900/95 border border-indigo-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background Layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 rounded-2xl sm:rounded-3xl">
          {/* Ken-Burns Animated Train Image */}
          <div 
            className="absolute inset-0 opacity-15 bg-cover bg-center transition-all"
            style={{
              backgroundImage: `url(${heroImg})`,
              animation: 'kenburns 25s ease-in-out infinite alternate',
              filter: 'blur(1px) contrast(1.1)'
            }}
          />
          {/* Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/98" />

          {/* Gliding Train Silhouette Animation across Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden opacity-80">
            <div 
              className="w-48 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{
                animation: 'trainTrackGlide 4s linear infinite'
              }}
            />
          </div>
        </div>

        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Train className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Official Passenger Handbook
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400">
                  Version 2.0 • 100% Ad-Free
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                RailTrack India — Master Guide & Why Choose Us
              </h2>
            </div>
          </div>

          {/* Wrong Symbol (Close 'X') Button */}
          <button
            type="button"
            onClick={onClose}
            data-modal-close="true"
            aria-label="Close"
            title="Close without marking as read"
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8 text-sm sm:text-base leading-relaxed text-slate-300 scroll-smooth"
        >
          {/* Executive Intro Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-purple-950/50 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Welcome to the Future of Indian Railways Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  RailTrack India is an industrial-grade, cloud-native telemetry portal engineered to give rail passengers, daily commuters, and waiting families <strong>crystal-clear, real-time control over their journeys</strong>. We believe critical railway travel tools should never be gated behind paid subscriptions, cluttered with commercial ads, or compromise your personal privacy.
                </p>
              </div>
            </div>
          </div>

          {/* 1. Brief About Our App */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>1. What is RailTrack India? (Brief Overview)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              RailTrack India connects directly with high-frequency Indian Railways live telemetry streams and official IRCTC database feeds. The application aggregates:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs sm:text-sm">
                  <Radio className="w-4 h-4" />
                  <span>Real-Time GPS Telemetry</span>
                </div>
                <p className="text-xs text-slate-400">
                  Live satellite train coordinates, speed index, upcoming halt distances, and accurate station arrival timestamps.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Adaptive Night Wake-Up Alarms</span>
                </div>
                <p className="text-xs text-slate-400">
                  Hardware sirens that protect sleeping passengers by adjusting trigger times dynamically when trains crawl or stop.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Live Junction Display Boards</span>
                </div>
                <p className="text-xs text-slate-400">
                  Explore 2, 4, or 8-hour digital departure and arrival boards with verified track platform numbers and email snapshots.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm">
                  <Bot className="w-4 h-4" />
                  <span>RailAI Conversational Assistant</span>
                </div>
                <p className="text-xs text-slate-400">
                  Powered by Google Gemini 1.5 Flash with live function-calling tools to answer fare, route, and delay queries in natural language.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Why Use Our App? */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>2. Why To Use Our App? (Critical Problems We Solve)</span>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl">
                <strong className="text-red-300">Problem 1: Missed Sleep & Midnight Halts on Delayed Trains</strong>
                <p className="text-slate-300 mt-1">
                  In other apps, an alarm set for 30 minutes before arrival rings at the <em>scheduled</em> time (e.g., 11:30 PM). If your train is delayed by 3 hours and reaches at 2:30 AM, you are woken up at 11:30 PM for nothing! <strong>RailTrack India recalculates the alarm target dynamically</strong> based on actual live arrival so you sleep undisturbed.
                </p>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                <strong className="text-amber-300">Problem 2: Sudden Platform Track Re-assignments</strong>
                <p className="text-slate-300 mt-1">
                  In crowded junctions like New Delhi (NDLS) or Secunderabad (SC), running up and down foot overbridges with heavy luggage is exhausting. Our Live Station Board queries the railway signaling feed to show the expected platform number before you reach the station.
                </p>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl">
                <strong className="text-blue-300">Problem 3: Zero Advertisements, Loans, or Spam</strong>
                <p className="text-slate-300 mt-1">
                  Commercial train apps bombard you with full-screen rummy ads, instant loan banners, and insurance popups. RailTrack India is <strong>100% clean, ad-free, and respects your privacy</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* 3. How To Use Our App? */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <span>3. How To Use Our App? (Step-by-Step Practical Manual)</span>
            </div>
            <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li>
                <strong className="text-white">Track a Live Train:</strong> On the Home page, type your 5-digit train number (e.g. <code>12758</code> or <code>12678</code>). Click the result to view real-time location, speed, intermediate stops, and live delay badges.
              </li>
              <li>
                <strong className="text-white">Explore Live Station Boards:</strong> Visit the Station Explorer, type any station code (e.g. <code>MCI</code>, <code>NDLS</code>, <code>BPA</code>), pick a time window (2, 4, or 8 hours), and click <em>"Email Board"</em> to send an offline table to your inbox.
              </li>
              <li>
                <strong className="text-white">Set Night Wake-Up Alarms:</strong> On the train details screen, tap <em>"Alarm Cockpit"</em>, choose your destination station, select an advance warning buffer (15m to 120m), and arm the alarm. Control the alarm on your lock screen with <strong>"I AM AWAKE"</strong> or <strong>"Snooze 5m"</strong>.
              </li>
              <li>
                <strong className="text-white">Chat with RailAI:</strong> Click the floating RailAI bubble in the bottom corner to ask questions like <em>"What is the 3AC fare on 12952 from Delhi to Mumbai?"</em> or <em>"Is 12758 running on time?"</em>.
              </li>
              <li>
                <strong className="text-white">Track PNR & 06:00 AM Morning Reminders:</strong> On the PNR page, enter your 10-digit number to check waitlist clearance odds, view the IRCTC charting countdown clock, and schedule an automated morning briefing.
              </li>
            </ol>
          </section>

          {/* 4. When To Use Our App? */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <Clock className="w-5 h-5 text-sky-400" />
              <span>4. When To Use Our App? (Journey Lifecycle Milestones)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-amber-400 font-bold">120 Days to 1 Day Prior:</span>
                <p className="text-slate-300 mt-0.5">Use Punctuality Analysis & Fare Breakdowns to choose the most reliable train.</p>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-sky-400 font-bold">4 Hours Prior (Charting):</span>
                <p className="text-slate-300 mt-0.5">Check Chart 1 preparation to confirm coach and berth confirmation status.</p>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-emerald-400 font-bold">06:00 AM Travel Day:</span>
                <p className="text-slate-300 mt-0.5">Wake up to an automated boarding memo email with platform number and 1-tap live tracking.</p>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span className="text-purple-400 font-bold">Night Travel Sleep:</span>
                <p className="text-slate-300 mt-0.5">Rest peacefully knowing our hardware siren and email alarm wake you based on actual arrival time.</p>
              </div>
            </div>
          </section>

          {/* 5. Master Comparison Table vs Others */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
              <span>5. Why Our App is the BEST Compared to Others?</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-200 border-b border-slate-800 font-semibold">
                    <th className="p-3">Feature / Capability</th>
                    <th className="p-3 text-emerald-400">RailTrack India</th>
                    <th className="p-3 text-slate-400">NTES (Official)</th>
                    <th className="p-3 text-slate-400">Where Is My Train</th>
                    <th className="p-3 text-slate-400">IXIGO / ConfirmTkt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="p-3 font-semibold text-white">Ad-Free & Privacy First</td>
                    <td className="p-3 text-emerald-400 font-bold">✅ 100% Ad-Free (Zero Spam)</td>
                    <td className="p-3 text-slate-400">⚠️ Slow / Clunky</td>
                    <td className="p-3 text-red-400">❌ Fullscreen Ads</td>
                    <td className="p-3 text-red-400">❌ Heavy Loans & Rummy Ads</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Adaptive Night Alarm</td>
                    <td className="p-3 text-emerald-400 font-bold">✅ Dynamic Hybrid (Time or Distance)</td>
                    <td className="p-3 text-red-400">❌ None</td>
                    <td className="p-3 text-amber-400">⚠️ Static GPS only</td>
                    <td className="p-3 text-red-400">❌ Basic Push</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Transactional Email Delivery</td>
                    <td className="p-3 text-emerald-400 font-bold">✅ Brevo v3 (Snapshots & 6 AM memos)</td>
                    <td className="p-3 text-red-400">❌ None</td>
                    <td className="p-3 text-red-400">❌ None</td>
                    <td className="p-3 text-amber-400">⚠️ Marketing Emails</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Conversational Rail AI</td>
                    <td className="p-3 text-emerald-400 font-bold">✅ Google Gemini 1.5 Flash Tools</td>
                    <td className="p-3 text-red-400">❌ None</td>
                    <td className="p-3 text-red-400">❌ None</td>
                    <td className="p-3 text-amber-400">⚠️ Scripted FAQ Bot</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Live Station Display Boards</td>
                    <td className="p-3 text-emerald-400 font-bold">✅ 2h/4h/8h windows with platform tracks</td>
                    <td className="p-3 text-slate-400">⚠️ Basic list</td>
                    <td className="p-3 text-slate-400">⚠️ Basic list</td>
                    <td className="p-3 text-slate-400">⚠️ Cluttered</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Edge Cases Handled */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>6. Edge Cases Handled & System Resilience</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Midnight Date Rollover:</strong> Correctly reconciles timetables when a train crosses 00:00 IST midnight, eliminating date-offset bugs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Severe 10+ Hour Delays:</strong> The system shifts alarms dynamically rather than waking you at the outdated schedule.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Early Train Acceleration:</strong> Parallel hybrid distance guard triggers immediately if train skips loop halts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Signal Halts Outside Junction:</strong> Prevents premature awakening while the train is halted at an outer signal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Offline Dead-Zone Tunnels:</strong> Pre-cached station metadata ensures autocomplete search functions even with zero mobile data.</span>
              </li>
            </ul>
          </section>

          {/* 7. Future Updates & Roadmap */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg border-b border-indigo-500/20 pb-1.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>7. Upcoming Future Updates & Roadmap</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl">
                <strong className="text-purple-300">Coach Composition Radar (Coming Soon):</strong>
                <p className="text-slate-300 mt-1">Live loco-to-guard coach sequence so you know exactly where coach B4 or S2 will stop on the platform.</p>
              </div>
              <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-xl">
                <strong className="text-teal-300">Offline P2P Bluetooth Mesh:</strong>
                <p className="text-slate-300 mt-1">Allows passengers in the same coach to sync GPS coordinates offline without cellular data.</p>
              </div>
              <div className="p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl">
                <strong className="text-sky-300">Platform Accessibility Guide:</strong>
                <p className="text-slate-300 mt-1">Live escalator and lift operational status at major junctions for elderly passengers.</p>
              </div>
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
                <strong className="text-indigo-300">Pantry Car Cleanliness Audits:</strong>
                <p className="text-slate-300 mt-1">Passenger-verified food safety ratings and official IRCTC standard meal price monitors.</p>
              </div>
            </div>
          </section>

          {/* Sentinel element to trigger intersection observer at the bottom */}
          <div ref={endSentinelRef} className="h-6" />
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            {!hasReachedEnd ? (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium animate-pulse">
                <ChevronDown className="w-4 h-4" />
                Please scroll to the bottom of the guide to enable "Mark as Read"
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                You have reached the end! You can now mark this guide as read.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleMarkAsReadClick}
              disabled={!hasReachedEnd}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                hasReachedEnd
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Read & Continue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

