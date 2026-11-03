import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Upload, 
  Trash2, 
  Star, 
  Check, 
  Play, 
  Square, 
  X, 
  AlertCircle
} from 'lucide-react';
import customAlarmSoundService, { type CustomAlarmSound } from '../utils/customAlarmSoundService';
import alarmAudioService, { type AlarmToneType } from '../utils/alarmAudioService';

interface CustomSoundManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedToneType: AlarmToneType;
  selectedCustomSoundId?: string;
  onSelectTone: (toneType: AlarmToneType, customSoundId?: string) => void;
}

export default function CustomSoundManagerModal({
  isOpen,
  onClose,
  selectedToneType,
  selectedCustomSoundId,
  onSelectTone
}: CustomSoundManagerModalProps) {
  const [customSounds, setCustomSounds] = useState<CustomAlarmSound[]>([]);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSounds = async () => {
    try {
      const list = await customAlarmSoundService.getAllSounds();
      setCustomSounds(list);
    } catch (e) {
      console.warn('Failed to load sounds:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSounds();
    } else {
      alarmAudioService.stopAlarm();
      setIsPlayingId(null);
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

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Audio file is too large (maximum size is 20MB).');
      return;
    }

    try {
      setIsUploading(true);
      const saved = await customAlarmSoundService.saveSound(file);
      await loadSounds();
      // Automatically select the newly uploaded sound
      onSelectTone(selectedToneType, saved.id);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save audio file to IndexedDB.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePlayTone = (tone: AlarmToneType) => {
    if (isPlayingId === tone) {
      alarmAudioService.stopAlarm();
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
      alarmAudioService.stopAlarm();
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

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await customAlarmSoundService.toggleFavorite(id);
    await loadSounds();
  };

  const handleSetDefault = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await customAlarmSoundService.setDefault(id);
    await loadSounds();
    onSelectTone(selectedToneType, id);
  };

  const handleDeleteSound = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isPlayingId === id) {
      alarmAudioService.stopAlarm();
      setIsPlayingId(null);
    }
    await customAlarmSoundService.deleteSound(id);
    if (selectedCustomSoundId === id) {
      onSelectTone(selectedToneType, undefined);
    }
    await loadSounds();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Music className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Alarm Ringtones & Custom Audio</span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose built-in tones or upload your favorite MP3 track
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

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Scrollable Sound Options List */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Section 1: Built-in Alarm Synthesizers */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Built-in System Alarm Tones
            </h4>
            <div className="space-y-2">
              {[
                { type: 'digital_clock' as AlarmToneType, name: 'Classic Travel Alarm Clock', desc: 'High-frequency dual beeps (C6 & E6)' },
                { type: 'emergency_siren' as AlarmToneType, name: 'Emergency Warning Siren', desc: 'Urgent sawtooth frequency oscillation' },
                { type: 'train_horn' as AlarmToneType, name: 'Indian Railways WAP-7 Horn', desc: 'Harmonized dual brass horns' }
              ].map((item) => {
                const isSelected = !selectedCustomSoundId && selectedToneType === item.type;
                const isPlaying = isPlayingId === item.type;

                return (
                  <div
                    key={item.type}
                    onClick={() => onSelectTone(item.type, undefined)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/70 text-white shadow-md shadow-indigo-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
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
                        isPlaying
                          ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title={isPlaying ? 'Stop' : 'Preview sound'}
                    >
                      {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Uploaded Custom MP3 Audio Files */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>Your Uploaded Audio Tracks ({customSounds.length})</span>
              </h4>
              <span className="text-[10px] text-slate-500">Saved in browser IndexedDB</span>
            </div>

            {customSounds.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center bg-slate-950/40 space-y-1">
                <Music className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-400 font-semibold">No custom sounds uploaded yet</p>
                <p className="text-[11px] text-slate-500">Upload your favorite song, chime, or ringtone below.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customSounds.map((sound) => {
                  const isSelected = selectedCustomSoundId === sound.id;
                  const isPlaying = isPlayingId === sound.id;
                  const sizeMb = (sound.sizeBytes / (1024 * 1024)).toFixed(1);

                  return (
                    <div
                      key={sound.id}
                      onClick={() => onSelectTone(selectedToneType, sound.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/70 text-white shadow-md shadow-indigo-950/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span>{sound.name}</span>
                            {sound.isDefault && (
                              <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {sizeMb} MB &bull; Uploaded {new Date(sound.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Play/Stop Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayCustomSound(sound);
                          }}
                          className={`p-2 rounded-lg border transition cursor-pointer ${
                            isPlaying
                              ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title={isPlaying ? 'Stop audio' : 'Preview audio'}
                        >
                          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>

                        {/* Favorite / Star Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, sound.id)}
                          className={`p-2 rounded-lg border transition cursor-pointer ${
                            sound.isFavorite
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-850 hover:bg-slate-800 text-slate-500 hover:text-slate-300 border-slate-800'
                          }`}
                          title={sound.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star className={`w-3.5 h-3.5 ${sound.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        {/* Set as Default Button */}
                        {!sound.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleSetDefault(e, sound.id)}
                            className="px-2 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer hidden sm:inline"
                            title="Set as system default alarm sound"
                          >
                            Set Default
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSound(e, sound.id)}
                          className="p-2 rounded-lg bg-slate-850 hover:bg-rose-950/70 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer"
                          title="Delete audio file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upload Audio Dropzone / Input Button */}
        <div className="border-t border-slate-800 pt-3 shrink-0 space-y-2">
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
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>{isUploading ? 'Saving Audio to Device...' : 'Upload Audio (MP3 / WAV / M4A)'}</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Supports up to 20MB audio files</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
