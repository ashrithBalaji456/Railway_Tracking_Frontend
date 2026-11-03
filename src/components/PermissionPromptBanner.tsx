import { useState, useEffect } from 'react';
import { Bell, ShieldCheck, X, CheckCircle2, Smartphone, ExternalLink } from 'lucide-react';
import webNotificationService from '../utils/webNotificationService';
import { 
  isNativeApp, 
  checkNativeAlarmPermissions, 
  requestNativeNotificationPermission,
  openNativeNotificationSettings,
  requestNativeOverlayPermission,
  triggerTestNotification,
  type NativeAlarmPermissions 
} from '../utils/nativeAlarmBridge';

export default function PermissionPromptBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [grantedSuccess, setGrantedSuccess] = useState(false);
  const [nativePerms, setNativePerms] = useState<NativeAlarmPermissions | null>(null);

  useEffect(() => {
    if (isNativeApp()) {
      checkNativeAlarmPermissions().then((perms) => {
        if (perms) {
          setNativePerms(perms);
          if (!perms.notifications || !perms.overlay) {
            const timer = setTimeout(() => setShowBanner(true), 800);
            return () => clearTimeout(timer);
          }
        }
      });
      return;
    }

    // Web fallback
    const isDismissed = localStorage.getItem('rail_notification_prompt_dismissed');
    if (isDismissed) return;
    if (!webNotificationService.isSupported()) return;
    const currentPermission = webNotificationService.getPermission();
    if (currentPermission === 'default') {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showBanner) return null;

  const handleRequestPermission = async () => {
    if (isNativeApp()) {
      await requestNativeNotificationPermission();
      setTimeout(async () => {
        const perms = await checkNativeAlarmPermissions();
        if (perms) {
          setNativePerms(perms);
          if (perms.notifications) {
            setGrantedSuccess(true);
            try {
              await triggerTestNotification(
                '🔔 RailTrack Notifications Active',
                'Lock-screen alerts and departure wake-up alarms are now enabled!'
              );
            } catch (err) {}
            setTimeout(() => setShowBanner(false), 3500);
          } else {
            await openNativeNotificationSettings();
          }
        }
      }, 1000);
      return;
    }

    const granted = await webNotificationService.requestPermission();
    if (granted) {
      setGrantedSuccess(true);
      webNotificationService.playAlertChime();
      webNotificationService.sendSampleDepartureAlert();
      setTimeout(() => setShowBanner(false), 3500);
    } else {
      localStorage.setItem('rail_notification_prompt_dismissed', 'true');
      setShowBanner(false);
    }
  };

  const handleRequestOverlay = async () => {
    await requestNativeOverlayPermission();
    setTimeout(async () => {
      const perms = await checkNativeAlarmPermissions();
      if (perms) setNativePerms(perms);
    }, 1500);
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
                  {isNativeApp() ? 'Enable Android Alarm & Notification Permissions' : 'Enable Real-Time Train Alerts & Alarms?'}
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
            {isNativeApp()
              ? 'Allow RailTrack to post urgent train notifications and display the alarm screen over your lock screen when your departure is near.'
              : 'Get instant delay warnings, IRCTC chart preparation notifications, and departure wake-up alarms even when your phone is locked.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Notifications</span>
            </button>

            {isNativeApp() && !nativePerms?.overlay && (
              <button
                type="button"
                onClick={handleRequestOverlay}
                className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Display Over Apps</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
