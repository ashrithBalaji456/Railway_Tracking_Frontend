import { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ToastItem {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
}

export default function InAppNotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotification = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.title) return;

      const newToast: ToastItem = {
        id: `${Date.now()}_${Math.random()}`,
        title: detail.title,
        body: detail.body,
        url: detail.url,
        timestamp: detail.timestamp || Date.now()
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 2)]); // Keep at most 3 simultaneous toasts

      // Auto dismiss after 8 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 8000);
    };

    window.addEventListener('rail-notification', handleNotification as any);
    return () => {
      window.removeEventListener('rail-notification', handleNotification as any);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-amber-950/40 text-slate-100 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-top-4 fade-in"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            {toast.title.includes('Alert') ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5 text-indigo-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-amber-300 tracking-wide leading-tight">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {toast.body}
            </p>

            {toast.url && (
              <button
                onClick={() => {
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  navigate(toast.url!);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer shadow-sm"
              >
                <span>View Live Train Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
