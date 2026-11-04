import { useState, useEffect } from 'react';
import { Bell, ShieldCheck, X, CheckCircle2, Smartphone, ExternalLink, ArrowRight } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);
  const [grantedSuccess, setGrantedSuccess] = useState(false);
  const [nativePerms, setNativePerms] = useState<NativeAlarmPermissions | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check if user already skipped for this session
    const isDismissed = sessionStorage.getItem('rail_permission_modal_dismissed') === 'true';

    if (isNativeApp()) {
      // 1. Immediately trigger native Android notification permission dialog on startup
      requestNativeNotificationPermission().catch(() => {});

      // 2. Poll permission state and display modal if missing and not dismissed
      const pollPermissions = async () => {
        try {
          const perms = await checkNativeAlarmPermissions();
          if (!isMounted) return;
          if (perms) {
            setNativePerms(perms);
            if (!perms.notifications || !perms.overlay) {
              if (!sessionStorage.getItem('rail_permission_modal_dismissed')) {
                setShowModal(true);
              }
            } else {
              setShowModal(false);
            }
          } else {
            if (!sessionStorage.getItem('rail_permission_modal_dismissed')) {
              setShowModal(true);
            }
          }
        } catch {
          if (isMounted && !sessionStorage.getItem('rail_permission_modal_dismissed')) {
            setShowModal(true);
          }
        }
      };

      pollPermissions();
      // Low-frequency polling only to detect background permission changes
      const interval = setInterval(pollPermissions, 3000);

      // 3. Immediately re-check when user returns from Android Settings
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          try {
            const perms = await checkNativeAlarmPermissions();
            if (!isMounted) return;
            if (perms) {
              setNativePerms(perms);
              if (perms.notifications && perms.overlay) {
                setGrantedSuccess(true);
                try {
                  await triggerTestNotification(
                    '🔔 RailTrack Notifications Active',
                    'Lock-screen alerts and departure wake-up alarms are operational!'
                  );
                } catch {}
                setTimeout(() => {
                  if (isMounted) {
                    setShowModal(false);
                    sessionStorage.setItem('rail_permission_modal_dismissed', 'true');
                  }
                }, 2000);
              }
            }
          } catch {}
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        isMounted = false;
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // Web browser handling: prompt immediately on load
    if (webNotificationService.isSupported() && !isDismissed) {
      const current = webNotificationService.getPermission();
      if (current === 'default') {
        setShowModal(true);
        webNotificationService.requestPermission().then((granted) => {
          if (!isMounted) return;
          if (granted) {
            setGrantedSuccess(true);
            webNotificationService.playAlertChime();
            webNotificationService.sendSampleDepartureAlert();
            setTimeout(() => {
              if (isMounted) {
                setShowModal(false);
                sessionStorage.setItem('rail_permission_modal_dismissed', 'true');
              }
            }, 2500);
          }
        }).catch(() => {});
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  if (!showModal) return null;

  const handleRequestNotification = async () => {
    if (isNativeApp()) {
      try {
        await requestNativeNotificationPermission();
      } catch (err) {
        console.warn('requestNativeNotificationPermission failed:', err);
      }
      // Immediately open app notification settings so user can toggle on if OS prompt is suppressed
      try {
        await openNativeNotificationSettings();
      } catch (err) {
        console.warn('openNativeNotificationSettings failed:', err);
      }
      return;
    }

    // Web browser
    const granted = await webNotificationService.requestPermission();
    if (granted) {
      setGrantedSuccess(true);
      webNotificationService.playAlertChime();
      webNotificationService.sendSampleDepartureAlert();
      setTimeout(() => {
        setShowModal(false);
        sessionStorage.setItem('rail_permission_modal_dismissed', 'true');
      }, 2500);
    }
  };

  const handleRequestOverlay = async () => {
    if (isNativeApp()) {
      try {
        await requestNativeOverlayPermission();
      } catch (err) {
        console.warn('requestNativeOverlayPermission failed:', err);
      }
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('rail_permission_modal_dismissed', 'true');
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-indigo-950/80 text-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {grantedSuccess ? (
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">All Permissions Enabled!</h3>
              <p className="text-xs text-emerald-300 mt-1 max-w-xs leading-relaxed">
                RailTrack can now wake your phone on the lock screen and deliver real-time train alerts.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Required Setup</span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {isNativeApp() ? 'Enable Travel Alarm Permissions' : 'Enable Real-Time Train Alerts'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isNativeApp()
                ? 'To ensure your departure alarms wake you even when your phone is locked or muted, RailTrack requires two device permissions:'
                : 'Allow notifications to get instant train delay updates, platform changes, and wake-up reminders.'}
            </p>

            {/* Permission Cards */}
            <div className="space-y-2.5 pt-1">
              {/* 1. Notifications Card */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1. System Notifications</h4>
                    <p className="text-[10px] text-slate-400">Heads-up alert & lock-screen alarm banner</p>
                  </div>
                </div>

                {nativePerms?.notifications ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Granted
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestNotification}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Allow</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 2. Display Over Other Apps Card (Android Native Only) */}
              {isNativeApp() && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">2. Display Over Other Apps</h4>
                      <p className="text-[10px] text-slate-400">Wakes screen & displays full-screen alarm</p>
                    </div>
                  </div>

                  {nativePerms?.overlay ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Granted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOverlay}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>Enable</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between text-slate-500 text-[11px]">
              <span>You can adjust this anytime in device settings</span>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition cursor-pointer px-2 py-1 rounded hover:bg-slate-800"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
