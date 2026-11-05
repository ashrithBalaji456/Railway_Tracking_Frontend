import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Clock, 
  Music, 
  Upload, 
  Trash2, 
  Star, 
  Check, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Send,
  AlertCircle,
  Bell
} from 'lucide-react';
import customAlarmSoundService, { type CustomAlarmSound } from '../utils/customAlarmSoundService';
import alarmAudioService, { type AlarmToneType } from '../utils/alarmAudioService';
import webNotificationService from '../utils/webNotificationService';
import LockScreenTestAlarmModal from './LockScreenTestAlarmModal';
import { isNativeApp, triggerTestNotification } from '../utils/nativeAlarmBridge';
import api from '../services/api';

interface AlarmCockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlarmCockpitModal({ isOpen, onClose }: AlarmCockpitModalProps) {
  const [activeTab, setActiveTab] = useState<'sounds' | 'lockTest' | 'instantTest'>('sounds');
  const [customSounds, setCustomSounds] = useState<CustomAlarmSound[]>([]);
  const [alarmTone, setAlarmTone] = useState<AlarmToneType>('digital_clock');
  const [selectedCustomSoundId, setSelectedCustomSoundId] = useState<string | undefined>(undefined);
  const [selectedSoundName, setSelectedSoundName] = useState<string>('Classic Travel Alarm');
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAlarmSounding, setIsAlarmSounding] = useState(false);
  const [testEmail, setTestEmail] = useState(localStorage.getItem('email') || '');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [notifTestStatus, setNotifTestStatus] = useState<string | null>(null);
  const [isLockTestModalOpen, setIsLockTestModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSounds = async () => {
    try {
      const list = await customAlarmSoundService.getAllSounds();
      setCustomSounds(list);
      const def = await customAlarmSoundService.getDefaultSound();
      if (def) {
        setSelectedCustomSoundId(def.id);
        setSelectedSoundName(def.name);
      }
    } catch (e) {
      console.warn('Failed to load custom sounds:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSounds();
    } else {
      alarmAudioService.stopPreview();
      setIsPlayingId(null);
      setIsAlarmSounding(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSoundsChanged = () => {
      loadSounds();
    };
    window.addEventListener('rail-custom-sounds-changed', handleSoundsChanged);
    return () => {
      window.removeEventListener('rail-custom-sounds-changed', handleSoundsChanged);
    };
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadError(null);

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Audio file is too large (maximum size is 20MB).');
      return;
    }

    try {
      setIsUploading(true);
      const saved = await customAlarmSoundService.saveSound(file);
      await loadSounds();
      setSelectedCustomSoundId(saved.id);
      setSelectedSoundName(saved.name);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save audio file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePlayTone = (tone: AlarmToneType) => {
    if (isPlayingId === tone) {
      alarmAudioService.stopPreview();
      setIsPlayingId(null);
    } else {
      setIsPlayingId(tone);
      alarmAudioService.previewTone(tone);
      setTimeout(() => {
        setIsPlayingId((prev) => (prev === tone ? null : prev));
      }, 2500);
    }
  };

  const handlePlayCustomSound = async (sound: CustomAlarmSound) => {
    if (isPlayingId === sound.id) {
      alarmAudioService.stopPreview();
      setIsPlayingId(null);
    } else {
      const url = await customAlarmSoundService.getSoundBlobUrl(sound.id);
      if (url) {
        setIsPlayingId(sound.id);
        alarmAudioService.previewCustomSound(url);
        setTimeout(() => {
          setIsPlayingId((prev) => (prev === sound.id ? null : prev));
        }, 4000);
      }
    }
  };

  const handleSelectSound = (tone: AlarmToneType, customId?: string, name?: string) => {
    setAlarmTone(tone);
    setSelectedCustomSoundId(customId);
    if (name) setSelectedSoundName(name);
  };

  const handleToggleAlarmTest = async () => {
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
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setEmailStatus('Please enter a valid email address.');
      return;
    }

    try {
      setEmailStatus('Dispatching sample wake-up email via Brevo...');
      await api.post('/api/v1/pnr/reminder/test', {
        pnr: '4521849021',
        trainNumber: '12952',
        trainName: 'Mumbai Rajdhani',
        travelDate: new Date().toISOString().split('T')[0],
        email: testEmail.trim(),
        boardingStation: 'New Delhi (NDLS)',
        departureTime: '05:15 AM',
        advanceMinutes: 150
      });
      setEmailStatus('✅ Sample early-morning wake-up email sent to ' + testEmail);
    } catch (e: any) {
      setEmailStatus('Failed to send test email: ' + (e.message || 'Network error'));
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setNotifTestStatus('Sending test notification...');
      if (isNativeApp()) {
        await triggerTestNotification(
          '🔔 RailTrack Live Alert Test',
          'Notifications are operational! You will receive live delay warnings & morning wake-up alarms.'
        );
      } else {
        if (webNotificationService.isSupported() && webNotificationService.getPermission() !== 'granted') {
          const granted = await webNotificationService.requestPermission();
          if (!granted) {
            webNotificationService.playAlertChime();
            setNotifTestStatus('⚠️ Notifications blocked in browser. Tap the 🔒 or ⚙️ icon in the Chrome URL bar (next to vercel.app), tap Permissions, and set Notifications to Allow.');
            return;
          }
        }
        webNotificationService.sendDepartureReminderAlert({
          trainNumber: '12952',
          trainName: 'Mumbai Rajdhani',
          stationName: 'New Delhi (NDLS)',
          platform: '3',
          scheduledTime: '05:15 AM',
          expectedTime: '05:15 AM (On-Time)',
          delayMinutes: 0,
          advanceMinutes: 30,
          pnr: '4521849021'
        });
      }
      setNotifTestStatus('✅ Test notification sent! Check your notification bar and lock-screen.');
      setTimeout(() => setNotifTestStatus(null), 5000);
    } catch (err: any) {
      setNotifTestStatus('❌ Failed: ' + (err.message || 'Permission denied. Check device settings.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Alarm Center & Audio Settings</span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage custom MP3 ringtones, test lock-screen timers, and preview alarms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 shrink-0">
          {[
            { id: 'sounds' as const, label: '🎵 MP3 & Ringtones', icon: Music },
            { id: 'lockTest' as const, label: '⏰ Lock-Screen Test (2m)', icon: Smartphone },
            { id: 'instantTest' as const, label: '🔔 Instant Test', icon: Volume2 }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Tab Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* TAB 1: MP3 SOUNDS & RINGTONES */}
          {activeTab === 'sounds' && (
            <div className="space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Currently Selected Default Audio */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Alarm Sound</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span>{selectedCustomSoundId ? `🎵 ${selectedSoundName}` : selectedSoundName}</span>
                    {selectedCustomSoundId && (
                      <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                        CUSTOM
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (selectedCustomSoundId) {
                      const url = await customAlarmSoundService.getSoundBlobUrl(selectedCustomSoundId);
                      if (url) {
                        alarmAudioService.previewCustomSound(url);
                        return;
                      }
                    }
                    alarmAudioService.previewTone(alarmTone);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Preview</span>
                </button>
              </div>

              {/* Upload Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-amber-500/50 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{isUploading ? 'Uploading Audio...' : 'Upload MP3 / WAV Audio File (up to 20MB)'}</span>
                </button>
              </div>

              {/* Custom Uploaded Sounds List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Your Audio Library ({customSounds.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Saved in IndexedDB</span>
                </div>

                {customSounds.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center bg-slate-950/40 text-xs text-slate-500">
                    No custom audio uploaded yet. Click above to upload an MP3 track.
                  </div>
                ) : (
                  customSounds.map((sound) => {
                    const isSelected = selectedCustomSoundId === sound.id;
                    const isPlaying = isPlayingId === sound.id;
                    const sizeMb = (sound.sizeBytes / (1024 * 1024)).toFixed(1);

                    return (
                      <div
                        key={sound.id}
                        onClick={() => handleSelectSound(alarmTone, sound.id, sound.name)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-500/70 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{sound.name}</span>
                              {sound.isDefault && (
                                <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{sizeMb} MB</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCustomSound(sound);
                            }}
                            className={`p-2 rounded-lg border transition cursor-pointer ${
                              isPlaying ? 'bg-amber-500 text-black border-amber-400 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          </button>

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await customAlarmSoundService.toggleFavorite(sound.id);
                              loadSounds();
                            }}
                            className={`p-2 rounded-lg border transition cursor-pointer ${
                              sound.isFavorite ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-850 text-slate-500'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${sound.isFavorite ? 'fill-current' : ''}`} />
                          </button>

                          {!sound.isDefault && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await customAlarmSoundService.setDefault(sound.id);
                                handleSelectSound(alarmTone, sound.id, sound.name);
                                loadSounds();
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-850 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                            >
                              Default
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await customAlarmSoundService.deleteSound(sound.id);
                              if (selectedCustomSoundId === sound.id) {
                                setSelectedCustomSoundId(undefined);
                                setSelectedSoundName('Classic Travel Alarm');
                              }
                              loadSounds();
                            }}
                            className="p-2 rounded-lg bg-slate-850 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Built-in Tones */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Built-in Synthesizers</div>
                {[
                  { type: 'digital_clock' as AlarmToneType, name: 'Classic Travel Alarm Clock', desc: 'Dual-beep classic clock' },
                  { type: 'emergency_siren' as AlarmToneType, name: 'Emergency Warning Siren', desc: 'Urgent sawtooth frequency oscillation' },
                  { type: 'train_horn' as AlarmToneType, name: 'Indian Railways Train Horn', desc: 'Harmonized brass horn' }
                ].map((item) => {
                  const isSelected = !selectedCustomSoundId && alarmTone === item.type;
                  const isPlaying = isPlayingId === item.type;

                  return (
                    <div
                      key={item.type}
                      onClick={() => handleSelectSound(item.type, undefined, item.name)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/70 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayTone(item.type);
                        }}
                        className={`p-2 rounded-lg border transition cursor-pointer shrink-0 ${
                          isPlaying ? 'bg-amber-500 text-black border-amber-400 animate-pulse' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LOCK-SCREEN TEST (2 MINS) */}
          {activeTab === 'lockTest' && (
            <div className="space-y-4">
              {isNativeApp() ? (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span>Android Native Alarm Engine Active</span>
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-200">Capacitor Native</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Uses Android&apos;s system <strong>AlarmManager.setExactAndAllowWhileIdle()</strong> to bypass Android Doze mode and ring reliably even when your phone is locked or deep-sleeping!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>Lock-Screen Background Keep-Alive Audio Anchor:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mobile browsers normally freeze JavaScript timers when you lock your screen. Our <strong>background audio anchor</strong> registers an active media session so your phone does NOT suspend the timer!
                  </p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-3">
                <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-white">Test Alarm with Phone Locked</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                    Arm the countdown, press your phone&apos;s power button to lock the screen, and wait. The lock-screen notification and continuous alarm will ring automatically!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLockTestModalOpen(true)}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    ⏰ Open Lock-Screen Countdown Timer (2 Mins)
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Instant Notification Test</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INSTANT TEST & EMAIL PREVIEW */}
          {activeTab === 'instantTest' && (
            <div className="space-y-4">
              {/* Notification Push Test Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Instant Push Notification Test</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fires a high-priority system notification to verify lock-screen alert delivery.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Test Notification</span>
                  </button>
                </div>

                {notifTestStatus && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium border ${
                    notifTestStatus.includes('✅') 
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : notifTestStatus.includes('❌') || notifTestStatus.includes('⚠️')
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 animate-pulse'
                  }`}>
                    {notifTestStatus}
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Immediate Device Siren & Vibration Test</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rings loud audio, vibrates phone, and posts lock-screen notification.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAlarmTest}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isAlarmSounding
                        ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isAlarmSounding ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>🛑 Stop Alarm</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Play Loud Siren Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Email Dispatcher */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Test Early-Morning Wake-Up Email via Brevo</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sends an authentic golden morning journey briefing with live telemetry to your inbox.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Send Email
                  </button>
                </div>

                {emailStatus && (
                  <div className="text-[11px] text-amber-300 font-medium">
                    {emailStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 shrink-0 flex items-center justify-between text-xs text-slate-500">
          <span>Active Sound: <strong className="text-slate-300">{selectedSoundName}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Lock Screen Countdown Modal child */}
      <LockScreenTestAlarmModal
        isOpen={isLockTestModalOpen}
        onClose={() => setIsLockTestModalOpen(false)}
        trainNumber="12952"
        trainName="Mumbai Rajdhani"
        stationName="New Delhi (NDLS)"
        selectedToneType={alarmTone}
        selectedCustomSoundId={selectedCustomSoundId}
      />
    </div>
  );
}

