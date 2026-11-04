import { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Mail,
  MessageSquare,
  Clock,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Train,
  Trash2,
  Volume2,
  Smartphone,
  Save,
  RotateCw
} from 'lucide-react';
import api from '../services/api';
import webNotificationService from '../utils/webNotificationService';
import CustomSoundManagerModal from './CustomSoundManagerModal';
import LockScreenTestAlarmModal from './LockScreenTestAlarmModal';
import alarmAudioService, { type AlarmToneType } from '../utils/alarmAudioService';
import customAlarmSoundService from '../utils/customAlarmSoundService';
import { cancelNativeAlarm } from '../utils/nativeAlarmBridge';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TravelReminderItem {
  id: number;
  pnr: string;
  trainNumber: string;
  trainName?: string;
  travelDate: string;
  reminderSent: boolean;
  createdAt: string;
}

interface ArmedAlarmState {
  trainNumber: string;
  stationCode: string;
  stationName: string;
  targetArrivalTime?: string;
  thresholdMinutes?: number;
  triggerMinutes?: number;
  tone?: string;
  toneType?: string;
  customSoundId?: string;
  customSoundName?: string;
  armedAt?: string;
}

export default function NotificationPreferencesModal({ isOpen, onClose }: NotificationPreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<'preferences' | 'activeReminders'>('preferences');

  // Preferences form state
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [delayAlertThresholdMinutes, setDelayAlertThresholdMinutes] = useState(15);
  const [travelReminderEnabled, setTravelReminderEnabled] = useState(true);
  const [stationWakeUpAlarmEnabled, setStationWakeUpAlarmEnabled] = useState(true);

  // Reminders & Alarms state
  const [reminders, setReminders] = useState<TravelReminderItem[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [armedAlarm, setArmedAlarm] = useState<ArmedAlarmState | null>(null);

  // Action status
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSoundManagerOpen, setIsSoundManagerOpen] = useState(false);
  const [isLockScreenTesterOpen, setIsLockScreenTesterOpen] = useState(false);
  const [alarmTone, setAlarmTone] = useState<AlarmToneType>('digital_clock');
  const [selectedCustomSoundId, setSelectedCustomSoundId] = useState<string | undefined>(undefined);
  const [selectedSoundName, setSelectedSoundName] = useState<string>('Classic Travel Alarm');
  const [isAlarmSounding, setIsAlarmSounding] = useState(false);

  useEffect(() => {
    customAlarmSoundService.getDefaultSound().then((sound) => {
      if (sound) {
        setSelectedCustomSoundId(sound.id);
        setSelectedSoundName(sound.name);
      }
    });
  }, []);
  const [errorMessage, setErrorMessage] = useState('');

  // Initial load from localStorage & API
  useEffect(() => {
    if (!isOpen) return;

    const storedEmail = localStorage.getItem('email') || localStorage.getItem('user_email') || '';
    const storedPhone = localStorage.getItem('whatsapp_phone') || '';
    if (storedEmail) setEmail(storedEmail);
    if (storedPhone) setWhatsappPhone(storedPhone);

    // Read armed alarm from localStorage
    checkArmedAlarm();

    // Fetch preferences from backend if email is available
    if (storedEmail) {
      fetchPreferences(storedEmail);
      fetchActiveReminders(storedEmail);
    }
  }, [isOpen]);

  const checkArmedAlarm = () => {
    try {
      const rawAlarm = localStorage.getItem('rail_armed_alarm');
      if (rawAlarm) {
        setArmedAlarm(JSON.parse(rawAlarm));
      } else {
        setArmedAlarm(null);
      }
    } catch {
      setArmedAlarm(null);
    }
  };

  const fetchPreferences = async (userEmail: string) => {
    try {
      const res: any = await api.get('/api/v1/notifications/preferences', {
        params: { email: userEmail }
      });
      const data = res?.data || res;
      if (data) {
        if (data.whatsappPhone) setWhatsappPhone(data.whatsappPhone);
        if (data.weeklyDigestEnabled !== undefined) setWeeklyDigestEnabled(data.weeklyDigestEnabled);
        if (data.delayAlertThresholdMinutes !== undefined) setDelayAlertThresholdMinutes(data.delayAlertThresholdMinutes);
        if (data.travelReminderEnabled !== undefined) setTravelReminderEnabled(data.travelReminderEnabled);
        if (data.stationWakeUpAlarmEnabled !== undefined) setStationWakeUpAlarmEnabled(data.stationWakeUpAlarmEnabled);
      }
    } catch (err) {
      console.warn('Could not load remote notification preferences:', err);
    }
  };

  const fetchActiveReminders = async (userEmail: string) => {
    setRemindersLoading(true);
    try {
      const res: any = await api.get('/api/v1/notifications/active-reminders', {
        params: { email: userEmail }
      });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setReminders(list);
    } catch (err) {
      console.warn('Could not load active reminders:', err);
    } finally {
      setRemindersLoading(false);
    }
  };

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your primary email address');
      return;
    }

    setSaveLoading(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      // 1. Sync locally
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = whatsappPhone.replace(/\D/g, '');
      localStorage.setItem('email', cleanEmail);
      if (cleanPhone) {
        localStorage.setItem('whatsapp_phone', cleanPhone);
      }

      // 2. Sync to Backend using central api client (points to Render in production)
      await api.put('/api/v1/notifications/preferences', {
        email: cleanEmail,
        whatsappPhone: cleanPhone,
        weeklyDigestEnabled,
        delayAlertThresholdMinutes,
        travelReminderEnabled,
        stationWakeUpAlarmEnabled
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Refresh reminders with the updated email
      fetchActiveReminders(cleanEmail);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to save preferences. Please check your connection.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelReminder = async (id: number) => {
    try {
      await api.delete(`/api/v1/notifications/reminders/${id}`, {
        params: { email: email.trim().toLowerCase() }
      });
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to cancel reminder', err);
      alert('Could not cancel reminder. Please try again.');
    }
  };

  const handleDisarmAlarm = () => {
    if (window.confirm('Are you sure you want to disarm your station wake-up alarm?')) {
      localStorage.removeItem('rail_armed_alarm');
      alarmAudioService.stopAlarm();
      cancelNativeAlarm();
      setArmedAlarm(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Alerts & Preferences Center
              </h2>
              <p className="text-xs text-slate-400">
                Manage your travel reminders, night alarms, and notification channels
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Notification Rules & Channels
          </button>
          <button
            onClick={() => {
              setActiveTab('activeReminders');
              if (email.trim()) fetchActiveReminders(email.trim());
              checkArmedAlarm();
            }}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all relative ${
              activeTab === 'activeReminders'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Active Reminders & Alarms
            {(reminders.length > 0 || armedAlarm) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {activeTab === 'preferences' ? (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              {/* Identity & Channels */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Default Notification Channels</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Primary Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. traveler@gmail.com"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Used for PNR alerts, digests, and night emergency emails.</p>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      Default WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={e => setWhatsappPhone(e.target.value)}
                      placeholder="e.g. 919876543210"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Autofills in WhatsApp 1-tap sharing & quick alerts.</p>
                  </div>
                </div>
              </div>

              {/* Toggles & Thresholds */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Automated Alert Rules</span>
                </div>

                <div className="space-y-4 divide-y divide-slate-800/60">
                  {/* Weekly Digest */}
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">📬 Weekly Rail Gazette</div>
                      <div className="text-[11px] text-slate-400">
                        Receive a Monday morning digest of network analytics, route changes & travel guides.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyDigestEnabled}
                        onChange={e => setWeeklyDigestEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Travel Day Morning Reminder */}
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">🚆 Travel Day Morning Reminder</div>
                      <div className="text-[11px] text-slate-400">
                        Auto-dispatch a 6:00 AM journey briefing with live board link on the day of your travel.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={travelReminderEnabled}
                        onChange={e => setTravelReminderEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Station Wake-Up Alarm System */}
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">⏰ Station Approaching Night Guardian</div>
                      <div className="text-[11px] text-slate-400">
                        Synthesizes emergency audio tones and screen flashes when train is within threshold.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stationWakeUpAlarmEnabled}
                        onChange={e => setStationWakeUpAlarmEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Delay Threshold */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">⚠️ Live Delay Alert Sensitivity</div>
                        <div className="text-[11px] text-slate-400">
                          Notify me only when train delay exceeds this threshold
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        {delayAlertThresholdMinutes} mins
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[15, 30, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDelayAlertThresholdMinutes(mins)}
                          className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                            delayAlertThresholdMinutes === mins
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm shadow-amber-500/20'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                          }`}
                        >
                          {mins} mins delay
                        </button>
                      ))}
                    </div>
                  </div>

                    {/* Dynamic Departure & Wake-Up Alarm Section */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Departure Wake-Up Alarm & Custom Audio</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Sound: <strong className="text-amber-300">{selectedCustomSoundId ? `🎵 ${selectedSoundName}` : selectedSoundName}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsSoundManagerOpen(true)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 cursor-pointer transition"
                        >
                          Change / Upload MP3
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* 2-Min Lock Screen Test */}
                        <button
                          type="button"
                          onClick={() => setIsLockScreenTesterOpen(true)}
                          className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>⏰ Test in 2 Mins (Lock Phone)</span>
                        </button>

                        {/* Instant Alarm Test */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (isAlarmSounding) {
                              alarmAudioService.stopAlarm();
                              setIsAlarmSounding(false);
                              return;
                            }

                            if (webNotificationService.isSupported() && webNotificationService.getPermission() === 'default') {
                              await webNotificationService.requestPermission();
                            }

                            let customUrl: string | undefined = undefined;
                            let customName: string | undefined = undefined;
                            if (selectedCustomSoundId) {
                              const url = await customAlarmSoundService.getSoundBlobUrl(selectedCustomSoundId);
                              if (url) {
                                customUrl = url;
                                customName = selectedSoundName;
                              }
                            }

                            alarmAudioService.startContinuousAlarm({
                              toneType: alarmTone,
                              customSoundUrl: customUrl,
                              customSoundName: customName,
                              trainNumber: '12952',
                              stationName: 'New Delhi (NDLS)',
                              etaMinutes: 25
                            });
                            setIsAlarmSounding(true);

                            webNotificationService.sendSampleDepartureAlert();
                          }}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isAlarmSounding
                              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                              : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAlarmSounding ? '🛑 Stop Alarm' : 'Instant Alarm Test'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Instant Device Push Notifications Section */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                            Lock-Screen Device Push Alerts
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Plays audio chime & shows native OS notification when delay &gt; {delayAlertThresholdMinutes}m
                          </div>
                        </div>
                        {webNotificationService.getPermission() === 'granted' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Push Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              const granted = await webNotificationService.requestPermission();
                              if (granted) {
                                webNotificationService.sendSampleDelayAlert(
                                  '12952',
                                  'Mumbai Rajdhani',
                                  delayAlertThresholdMinutes
                                );
                              }
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 cursor-pointer transition"
                          >
                            Enable Push
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          webNotificationService.sendSampleDelayAlert(
                            '12952',
                            'Mumbai Rajdhani',
                            delayAlertThresholdMinutes
                          );
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span>🔔 Test Live Delay Notification on Device</span>
                      </button>
                    </div>
                </div>
              </div>

              {/* Status messages */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Preferences saved successfully! Channels synchronized.</span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save All Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Active Reminders & Alarms Tab */
            <div className="space-y-6">
              {/* Armed Station Wake-Up Alarm Section */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <Volume2 className="w-4 h-4" />
                    <span>Station Approaching Night Guardian</span>
                  </div>
                  {armedAlarm ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                      Armed & Monitoring
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Standby</span>
                  )}
                </div>

                {armedAlarm ? (
                  <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <Train className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Train {armedAlarm.trainNumber}</span>
                        <span className="text-slate-400">• Approaching</span>
                        <span className="text-rose-300 font-mono font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">{armedAlarm.stationCode}</span>
                        {armedAlarm.stationName && (
                          <span className="text-slate-300 text-[11px]">({armedAlarm.stationName})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Trigger: <strong>{(() => {
                          const m = armedAlarm.triggerMinutes || armedAlarm.thresholdMinutes || 30;
                          return m >= 60 ? (m % 60 === 0 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${(m / 60).toFixed(1)} hours`) : `${m} mins`;
                        })()}</strong> prior</span>
                        <span>Tone: <strong className="text-slate-200">
                          {armedAlarm.customSoundName
                            ? `🎵 ${armedAlarm.customSoundName} (Default)`
                            : (armedAlarm.toneType === 'custom'
                                ? (localStorage.getItem('rail_default_custom_sound_name') ? `🎵 ${localStorage.getItem('rail_default_custom_sound_name')} (Default)` : '🎵 Custom Song (Default)')
                                : (localStorage.getItem('rail_default_custom_sound_name')
                                    ? `🎵 ${localStorage.getItem('rail_default_custom_sound_name')} (Default)`
                                    : (armedAlarm.toneType || armedAlarm.tone || 'digital_clock').replace(/_/g, ' ')
                                  )
                              )
                          }
                        </strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={handleDisarmAlarm}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Disarm</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No station wake-up alarm is currently armed.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      You can set an alarm on any upcoming station from the <strong>Live Train Tracking</strong> screen.
                    </p>
                  </div>
                )}
              </div>

              {/* Scheduled PNR Morning Reminders Section */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <Calendar className="w-4 h-4" />
                    <span>Travel Day Morning Reminders (6:00 AM Cron)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => email.trim() && fetchActiveReminders(email.trim())}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${remindersLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {remindersLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Loading reminders for {email}...</span>
                  </div>
                ) : reminders.length > 0 ? (
                  <div className="space-y-2">
                    {reminders.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="font-mono text-indigo-400 tracking-wider">PNR {item.pnr}</span>
                            <span className="text-slate-400">• Train {item.trainNumber}</span>
                            {item.trainName && (
                              <span className="text-slate-300 text-[11px]">({item.trainName})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              Travel Date: <strong>{item.travelDate}</strong>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.reminderSent 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {item.reminderSent ? 'Dispatched' : 'Scheduled (6:00 AM)'}
                            </span>
                          </div>
                        </div>

                        {!item.reminderSent && (
                          <button
                            type="button"
                            onClick={() => handleCancelReminder(item.id)}
                            title="Cancel this reminder"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                    <p className="text-xs text-slate-400">No scheduled travel reminders found for {email || 'your email'}.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      When you check PNR status in <strong>PNR Status</strong>, you can schedule a travel morning briefing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Custom Audio & MP3 Upload Manager Modal */}
      <CustomSoundManagerModal
        isOpen={isSoundManagerOpen}
        onClose={() => setIsSoundManagerOpen(false)}
        selectedToneType={alarmTone}
        selectedCustomSoundId={selectedCustomSoundId}
        onSelectTone={(tone, customId) => {
          setAlarmTone(tone);
          setSelectedCustomSoundId(customId);
          if (customId) {
            customAlarmSoundService.getAllSounds().then((sounds) => {
              const found = sounds.find((s) => s.id === customId);
              if (found) setSelectedSoundName(found.name);
            });
          } else {
            const names: Record<AlarmToneType, string> = {
              digital_clock: 'Classic Travel Alarm',
              emergency_siren: 'Emergency Alert Siren',
              train_horn: 'Indian Railways Horn'
            };
            setSelectedSoundName(names[tone] || 'System Tone');
          }
        }}
      />

      {/* Lock Screen Countdown Test Timer Modal */}
      <LockScreenTestAlarmModal
        isOpen={isLockScreenTesterOpen}
        onClose={() => setIsLockScreenTesterOpen(false)}
        trainNumber="12952"
        trainName="Mumbai Rajdhani"
        stationName="New Delhi (NDLS)"
        selectedToneType={alarmTone}
        selectedCustomSoundId={selectedCustomSoundId}
      />
        </div>
    </div>
  );
}

