import { 
  armAdaptiveNativeAlarm, 
  cancelAdaptiveStationAlarm, 
  cancelNativeAlarm, 
  snoozeNativeAlarm,
  isNativeApp,
  syncCustomAudioToNative
} from './nativeAlarmBridge';
import alarmAudioService, { type AlarmToneType } from './alarmAudioService';
import customAlarmSoundService from './customAlarmSoundService';

export interface WakeUpAlarmConfig {
  id?: string; // trainNumber_stationCode
  trainNumber: string;
  trainName?: string;
  stationCode: string;
  stationName: string;
  platform?: string;
  triggerMinutes: number;
  toneType: AlarmToneType | 'custom';
  customSoundId?: string;
  customSoundName?: string;
  backupEmail?: string;
  expectedArrival?: string;
  journeyDate?: string;
  armedAt: string;
}

const STORAGE_KEY_LIST = 'rail_armed_alarms';
const STORAGE_KEY_LEGACY = 'rail_armed_alarm';

class MultiAlarmManager {
  private buildId(trainNumber: string, stationCode: string): string {
    return `${(trainNumber || '').trim()}_${(stationCode || '').trim().toUpperCase()}`;
  }

  public getArmedAlarms(): WakeUpAlarmConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIST);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list;
        }
      }
      // Migrate from single legacy alarm if present
      const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && legacy.stationCode) {
          const id = this.buildId(legacy.trainNumber || '', legacy.stationCode);
          const migrated = [{ ...legacy, id }];
          localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (e) {
      console.warn('Error reading armed alarms from storage:', e);
    }
    return [];
  }

  public getArmedAlarm(trainNumber: string, stationCode: string): WakeUpAlarmConfig | null {
    const list = this.getArmedAlarms();
    const id = this.buildId(trainNumber, stationCode);
    return list.find(a => (a.id === id) || (a.trainNumber === trainNumber && a.stationCode?.toUpperCase() === stationCode?.toUpperCase())) || null;
  }

  public getArmedAlarmsForTrain(trainNumber: string): WakeUpAlarmConfig[] {
    const list = this.getArmedAlarms();
    return list.filter(a => a.trainNumber === trainNumber);
  }

  public isStationArmed(trainNumber: string, stationCode: string): boolean {
    return Boolean(this.getArmedAlarm(trainNumber, stationCode));
  }

  public async armAlarm(
    config: WakeUpAlarmConfig,
    liveContext?: { expectedArrival?: string; journeyDate?: string; trainName?: string; platform?: string }
  ): Promise<void> {
    const id = this.buildId(config.trainNumber, config.stationCode);
    const fullConfig: WakeUpAlarmConfig = {
      ...config,
      id,
      trainName: config.trainName || liveContext?.trainName,
      platform: config.platform || liveContext?.platform,
      expectedArrival: config.expectedArrival || liveContext?.expectedArrival,
      journeyDate: config.journeyDate || liveContext?.journeyDate,
      armedAt: config.armedAt || new Date().toISOString()
    };

    const currentList = this.getArmedAlarms();
    const filtered = currentList.filter(a => a.id !== id);
    const updated = [fullConfig, ...filtered];

    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(fullConfig));

    // Ensure custom MP3 is synced to native storage if configured
    try {
      const sounds = await customAlarmSoundService.getAllSounds();
      let targetSound = fullConfig.customSoundId
        ? sounds.find((s: any) => s.id === fullConfig.customSoundId)
        : await customAlarmSoundService.getDefaultSound();

      if (targetSound?.blob && isNativeApp()) {
        await syncCustomAudioToNative(targetSound.blob);
      }
    } catch (e) {
      console.warn('Could not sync custom alarm sound to native in armAlarm:', e);
    }

    // Arm native Android AlarmClock and Adaptive Sync
    await armAdaptiveNativeAlarm({
      trainNumber: fullConfig.trainNumber,
      trainName: fullConfig.trainName,
      stationCode: fullConfig.stationCode,
      stationName: fullConfig.stationName,
      platform: fullConfig.platform,
      triggerMinutes: fullConfig.triggerMinutes,
      expectedArrival: fullConfig.expectedArrival,
      journeyDate: fullConfig.journeyDate
    });

    this.notifyUpdate();
  }

  public async disarmAlarm(trainNumber: string, stationCode: string): Promise<void> {
    const id = this.buildId(trainNumber, stationCode);
    const currentList = this.getArmedAlarms();
    const updated = currentList.filter(a => a.id !== id && !(a.trainNumber === trainNumber && a.stationCode?.toUpperCase() === stationCode?.toUpperCase()));

    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updated));

    if (updated.length > 0) {
      localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(updated[0]));
    } else {
      localStorage.removeItem(STORAGE_KEY_LEGACY);
    }

    // Cancel specific native alarm
    await cancelAdaptiveStationAlarm(trainNumber, stationCode);
    alarmAudioService.stopAlarm();

    this.notifyUpdate();
  }

  public async disarmAllAlarms(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_LIST);
    localStorage.removeItem(STORAGE_KEY_LEGACY);

    await cancelNativeAlarm();
    alarmAudioService.stopAlarm();

    this.notifyUpdate();
  }

  public async snoozeAlarm(trainNumber: string, stationCode: string, minutes: number = 5): Promise<void> {
    const alarm = this.getArmedAlarm(trainNumber, stationCode);
    alarmAudioService.stopAlarm();

    await snoozeNativeAlarm(minutes, { trainNumber, stationCode });

    if (alarm) {
      const snoozed: WakeUpAlarmConfig = {
        ...alarm,
        triggerMinutes: minutes,
        armedAt: new Date().toISOString()
      };
      await this.armAlarm(snoozed);
    } else {
      this.notifyUpdate();
    }
  }

  private notifyUpdate() {
    window.dispatchEvent(new CustomEvent('rail-alarms-updated', { detail: { alarms: this.getArmedAlarms() } }));
  }
}

export const multiAlarmManager = new MultiAlarmManager();
export default multiAlarmManager;

