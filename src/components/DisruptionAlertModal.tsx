import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Train,
  GitFork,
  Calendar,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import api from '../services/api';

interface DisruptionAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName?: string;
  disruptionType: string;
  message?: string;
  sourceStation?: string;
  destStation?: string;
  alternativeRoute?: string;
  effectiveDate?: string;
}

export default function DisruptionAlertModal({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  disruptionType,
  message,
  sourceStation,
  destStation,
  alternativeRoute,
  effectiveDate
}: DisruptionAlertModalProps) {
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('email') || localStorage.getItem('user_email') || '';
      if (stored) setEmail(stored);
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanType = (disruptionType || 'DISRUPTED').toUpperCase();
  const isCancelled = cleanType.includes('CANCEL');

  const handleArmAlert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'error', text: 'Please provide a valid recipient email address.' });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      // Save email locally
      localStorage.setItem('email', email.trim().toLowerCase());

      const res: any = await api.post('/api/v1/disruptions/alert', {
        trainNumber,
        trainName: trainName || 'Express',
        disruptionType: cleanType,
        message: message || 'Operational disruption reported along route.',
        sourceStation: sourceStation || 'Origin',
        destStation: destStation || 'Destination',
        alternativeRoute: alternativeRoute || undefined,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        email: email.trim().toLowerCase()
      });

      setStatus({
        type: 'success',
        text: res?.message || 'Disruption alert armed! You will receive automated email advisories for this train.'
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Could not arm disruption alert. Please check connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'error', text: 'Please enter a valid recipient email first.' });
      return;
    }

    try {
      setTesting(true);
      setStatus(null);

      const res: any = await api.post('/api/v1/disruptions/alert/test', {
        trainNumber,
        trainName: trainName || 'Express',
        disruptionType: cleanType,
        message: message || 'Operational disruption reported along route.',
        sourceStation: sourceStation || 'Origin',
        destStation: destStation || 'Destination',
        alternativeRoute: alternativeRoute || undefined,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        email: email.trim().toLowerCase()
      });

      setStatus({
        type: 'success',
        text: res?.message || `Sample disruption advisory email dispatched to ${email.trim()}! Please check your inbox.`
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to dispatch test advisory email via Brevo.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              isCancelled 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Route Disruption & Safety Advisory
              </h2>
              <p className="text-xs text-slate-400">
                Automated Brevo email notifications for train delays & cancellations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Train Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Train className="w-4 h-4 text-rose-400" />
                <span>Train {trainNumber}</span>
                {trainName && <span className="text-slate-400">• {trainName}</span>}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {cleanType}
              </span>
            </div>

            {(sourceStation || destStation) && (
              <div className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                <span className="text-slate-400">Route:</span>
                <span>{sourceStation || 'Origin'}</span>
                <span className="text-slate-500">➔</span>
                <span>{destStation || 'Destination'}</span>
                {effectiveDate && (
                  <span className="text-slate-500 text-[11px] ml-auto flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {effectiveDate}
                  </span>
                )}
              </div>
            )}

            {alternativeRoute && (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
                <GitFork className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block">Diverted Route:</strong>
                  <span>{alternativeRoute}</span>
                </div>
              </div>
            )}

            {message && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-200 block text-[11px] uppercase tracking-wider mb-0.5">
                  Official Notice:
                </strong>
                <span>{message}</span>
              </div>
            )}
          </div>

          {/* IRCTC Refund & Rights Guidance Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>IRCTC Passenger Rights & 100% Refund Guidelines:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
              <li>
                <strong>Cancelled Trains:</strong> Full refund is credited automatically to your booking bank account for e-tickets.
              </li>
              <li>
                <strong>Diverted Trains:</strong> If you choose not to travel due to diversion, file a TDR on IRCTC within 72 hours for a full refund with zero cancellation charges.
              </li>
            </ul>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                status.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{status.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatus(null)}
                className="text-xs underline hover:opacity-80 cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Email Subscription Form */}
          <form onSubmit={handleArmAlert} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Alert Recipient Email *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. traveler@domain.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                We will email you real-time status updates, route changes, or alternative train availability.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={testing}
                onClick={handleTestEmail}
                title="Send a sample email to preview the layout"
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Sample Email</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Arming...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Arm Disruption Alert</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
