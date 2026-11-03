import { useState, useEffect } from 'react';
import { Bell, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import webNotificationService from '../utils/webNotificationService';

export default function PermissionPromptBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [grantedSuccess, setGrantedSuccess] = useState(false);

  useEffect(() => {
    // Only show if browser supports notifications, permission is 'default', and user hasn't dismissed it
    if (!webNotificationService.isSupported()) return;

    const currentPermission = webNotificationService.getPermission();
    const isDismissed = localStorage.getItem('rail_notification_prompt_dismissed');

    if (currentPermission === 'default' && !isDismissed) {
      // Show banner after 1.5 seconds on first visit
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showBanner) return null;

  const handleRequestPermission = async () => {
    const granted = await webNotificationService.requestPermission();
    if (granted) {
      setGrantedSuccess(true);
      webNotificationService.playAlertChime();
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    } else {
      // Denied or closed
      localStorage.setItem('rail_notification_prompt_dismissed', 'true');
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('rail_notification_prompt_dismissed', 'true');
    setShowBanner(false);
  };

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-md w-full bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-indigo-950/60 text-slate-100 animate-in slide-in-from-bottom-5 duration-300">
      {grantedSuccess ? (
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Notifications Activated!</h4>
            <p className="text-xs text-emerald-300 mt-0.5">
              Lock-screen travel alerts and departure wake-up alarms are now active.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Lock-Screen Alerts</span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">
                  Enable Real-Time Train Alerts & Alarms?
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Dismiss for now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Get instant delay warnings, IRCTC chart preparation notifications, and departure wake-up alarms even when your phone is locked.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Notifications</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
