/**
 * Web Audio API & Device Hardware Alarm Service
 * Generates continuous synthetic loud alarms, device vibrations,
 * screen wake locks, and repeating speech synthesizers to reliably wake passengers.
 */

import { stopNativeAlarm } from './nativeAlarmBridge';

export type AlarmToneType = 'digital_clock' | 'emergency_siren' | 'train_horn';

export interface ActiveAlarmInfo {
  isPlaying: boolean;
  trainNumber?: string;
  stationName?: string;
  etaMinutes?: number;
  toneType?: AlarmToneType;
  customSoundName?: string;
  startedAt?: number;
}

class AlarmAudioService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private alarmInterval: any = null;
  private speechInterval: any = null;
  private vibrationInterval: any = null;
  private wakeLockSentinel: any = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private currentAlarmInfo: ActiveAlarmInfo | null = null;

  getActiveAlarmInfo(): ActiveAlarmInfo | null {
    return this.currentAlarmInfo;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Request screen wake lock so the mobile display doesn't sleep while armed
   */
  async acquireWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        return true;
      }
    } catch (e) {
      console.warn('WakeLock not supported or denied:', e);
    }
    return false;
  }

  releaseWakeLock(): void {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (e) {
      console.warn('Error releasing wake lock:', e);
    }
  }

  /**
   * Play a short sound pulse depending on the tone type
   */
  private playPulse(toneType: AlarmToneType = 'digital_clock', durationSeconds = 0.35) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      if (toneType === 'digital_clock') {
        // High-pitch dual beeps like a classic travel clock
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.setValueAtTime(1318.5, now + durationSeconds * 0.5); // E6

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + durationSeconds);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durationSeconds);

      } else if (toneType === 'emergency_siren') {
        // Oscillating siren pitch sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + durationSeconds * 0.5);
        osc.frequency.exponentialRampToValueAtTime(750, now + durationSeconds);

        gain.gain.setValueAtTime(0.75, now);
        gain.gain.linearRampToValueAtTime(0.05, now + durationSeconds);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durationSeconds);

      } else {
        // Train horn chord (two harmonized detuned brass-like sawtooth waves)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(311.13, now); // Eb4
        osc2.frequency.setValueAtTime(370.0, now);  // F#4

        gain.gain.setValueAtTime(0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + durationSeconds);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + durationSeconds);
        osc2.stop(now + durationSeconds);
      }
    } catch (e) {
      console.error('Error playing alarm pulse', e);
    }
  }

  /**
   * Preview a 2.5-second test sound so the user can test their volume
   */
  previewTone(toneType: AlarmToneType = 'digital_clock'): void {
    this.stopAlarm();
    let pulses = 0;
    const interval = setInterval(() => {
      this.playPulse(toneType, 0.28);
      pulses++;
      if (pulses >= 4) {
        clearInterval(interval);
      }
    }, 450);

    // Optional short test vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  /**
   * Preview a 3.5-second snippet of a custom uploaded sound file
   */
  previewCustomSound(soundUrl: string): void {
    this.stopAlarm();
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch((e) => console.warn('Preview custom audio failed:', e));
      this.customAudioElement = audio;
      setTimeout(() => {
        if (this.customAudioElement === audio) {
          audio.pause();
          audio.currentTime = 0;
          this.customAudioElement = null;
        }
      }, 3500);
    } catch (e) {
      console.warn('Error playing custom preview:', e);
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  /**
   * Start the continuous repeating alarm until dismissed
   */
  startContinuousAlarm(options: {
    toneType?: AlarmToneType;
    customSoundUrl?: string;
    customSoundName?: string;
    trainNumber?: string;
    stationName?: string;
    etaMinutes?: number;
  }): void {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    const tone = options.toneType || 'digital_clock';
    this.acquireWakeLock();

    // 1. Sound Playback (Custom MP3 or Synthetic Beeps)
    if (options.customSoundUrl) {
      try {
        const audio = new Audio(options.customSoundUrl);
        audio.loop = true;
        audio.volume = 1.0;
        audio.onended = () => {
          if (this.isAlarmPlaying) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        };
        audio.play().catch((e) => console.warn('Custom audio playback failed:', e));
        this.customAudioElement = audio;
      } catch (err) {
        console.warn('Custom audio start error, falling back to synthesizer:', err);
        this.playPulse(tone, 0.35);
        this.alarmInterval = setInterval(() => {
          if (!this.isAlarmPlaying) return;
          this.playPulse(tone, 0.35);
        }, 700);
      }
    } else {
      this.playPulse(tone, 0.35);
      this.alarmInterval = setInterval(() => {
        if (!this.isAlarmPlaying) return;
        this.playPulse(tone, 0.35);
      }, 700);
    }

    // 2. Continuous Device Vibration
    const triggerVibration = () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([600, 200, 600, 200, 1000, 400]);
      }
    };
    triggerVibration();
    this.vibrationInterval = setInterval(triggerVibration, 3000);

    // 3. Spoken Voice Wake-Up Announcement
    // ONLY run speech synthesis for synthetic beeps (digital_clock / emergency_siren / train_horn)
    // NEVER run speech synthesis when a custom song is playing, so Android OS audio focus does NOT kill the song after 2 seconds!
    if (!options.customSoundUrl) {
      const speakAnnouncement = () => {
        if (!('speechSynthesis' in window) || !this.isAlarmPlaying) return;
        try {
          const text = `Attention passenger! Wake up! Train ${options.trainNumber || ''} is approaching ${options.stationName || 'your destination station'} in approximately ${options.etaMinutes || 25} minutes. Please prepare your luggage!`;
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 1.1;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Speech synthesis error:', err);
        }
      };

      // First voice announcement after 2 seconds of synthetic alarm beeps
      setTimeout(() => {
        if (this.isAlarmPlaying) speakAnnouncement();
      }, 2000);

      this.speechInterval = setInterval(() => {
        if (this.isAlarmPlaying) speakAnnouncement();
      }, 14000);
    }

    this.currentAlarmInfo = {
      isPlaying: true,
      trainNumber: options.trainNumber,
      stationName: options.stationName,
      etaMinutes: options.etaMinutes,
      toneType: tone,
      customSoundName: options.customSoundName,
      startedAt: Date.now()
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rail-alarm-state', {
          detail: this.currentAlarmInfo
        })
      );
    }
  }

  /**
   * Stop all alarm audio, speech, vibration, and release wake lock
   */
  stopAlarm(): void {
    this.isAlarmPlaying = false;
    this.currentAlarmInfo = null;

    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
        this.customAudioElement.currentTime = 0;
      } catch (e) {}
      this.customAudioElement = null;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rail-alarm-state', {
          detail: { isPlaying: false }
        })
      );
    }

    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    if (this.speechInterval) {
      clearInterval(this.speechInterval);
      this.speechInterval = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }

    this.releaseWakeLock();

    // Silence native Android MediaPlayer and cancel persistent lock-screen notification
    stopNativeAlarm();
  }

  isPlaying(): boolean {
    return this.isAlarmPlaying;
  }
}

export const alarmAudioService = new AlarmAudioService();
export default alarmAudioService;

