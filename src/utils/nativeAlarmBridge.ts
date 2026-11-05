import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeAlarmPermissions {
  notifications: boolean;
  overlay: boolean;
  exactAlarm: boolean;
}

export interface NativeAlarmPluginInterface {
  scheduleExactAlarm(options: {
    seconds: number;
    title?: string;
    body?: string;
    trainNumber?: string;
    trainName?: string;
    stationName?: string;
    stationCode?: string;
    platform?: string;
  }): Promise<{
    scheduled: boolean;
    triggerAtMillis: number;
    seconds: number;
  }>;
  cancelAlarm(options?: { trainNumber?: string; stationCode?: string }): Promise<{ cancelled: boolean }>;
  cancelAdaptiveStationAlarm(options: { trainNumber: string; stationCode: string }): Promise<{ cancelled: boolean }>;
  getActiveAlarms(): Promise<{ alarms: any[] }>;
  armAdaptiveStationAlarm(options: {
    trainNumber: string;
    stationCode: string;
    stationName?: string;
    triggerMinutes?: number;
    expectedArrival?: string;
    trainName?: string;
    journeyDate?: string;
    backendUrl?: string;
    backupEmail?: string;
  }): Promise<{
    armed: boolean;
    trainNumber: string;
    stationCode: string;
    triggerMinutes: number;
  }>;
  setCustomAlarmAudio(options: { base64: string }): Promise<{ saved: boolean; path: string; size: number }>;
  startCustomAudioUpload(): Promise<{ ready: boolean }>;
  appendCustomAudioChunk(options: { chunk: string; isLast: boolean }): Promise<{ saved: boolean; isComplete: boolean; size?: number; currentSize?: number }>;
  clearCustomAlarmAudio(): Promise<{ cleared: boolean }>;
  startAlarm(options?: {
    title?: string;
    body?: string;
    trainNumber?: string;
    trainName?: string;
    stationName?: string;
    stationCode?: string;
    platform?: string;
    triggerMinutes?: number;
    backupEmail?: string;
  }): Promise<{ started: boolean }>;
  stopAlarm(): Promise<{ stopped: boolean }>;
  isAlarmPlaying(): Promise<{ isPlaying: boolean }>;
  isAlarmRinging(): Promise<{
    isRinging: boolean;
    alarmId?: string;
    trainNumber?: string;
    trainName?: string;
    stationName?: string;
    stationCode?: string;
    triggerMinutes?: number;
    expectedArrival?: string;
  }>;
  snoozeAlarm(options?: { minutes?: number; trainNumber?: string; stationCode?: string }): Promise<{
    snoozed: boolean;
    snoozeMinutes: number;
    nextTriggerMillis: number;
  }>;
  checkPermissions(): Promise<NativeAlarmPermissions>;
  requestOverlayPermission(): Promise<{ openedSettings?: boolean; alreadyGranted?: boolean }>;
  requestNotificationPermission(): Promise<{ requested: boolean }>;
  openNotificationSettings(): Promise<{ opened: boolean }>;
  sendTestNotification(options: { title?: string; body?: string }): Promise<{ sent: boolean }>;
}

const NativeAlarm = registerPlugin<NativeAlarmPluginInterface>('NativeAlarm');

/**
 * Universal Native Invoker:
 * Directly calls Capacitor's native bridge (cap.nativePromise), bypassing
 * any PluginHeaders registration desync or reflection delays on Android.
 */
const callNative = async <T = any>(methodName: string, options: any = {}): Promise<T> => {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  const cap = win?.Capacitor;

  // 1. Direct native bridge call via nativePromise (Primary JNI channel)
  if (cap && typeof cap.nativePromise === 'function') {
    return await cap.nativePromise('NativeAlarm', methodName, options);
  }

  // 2. Direct plugin instance from window.Capacitor.Plugins
  if (cap?.Plugins?.NativeAlarm && typeof cap.Plugins.NativeAlarm[methodName] === 'function') {
    return await cap.Plugins.NativeAlarm[methodName](options);
  }

  // 3. Registered plugin proxy fallback
  if (NativeAlarm && typeof (NativeAlarm as any)[methodName] === 'function') {
    return await (NativeAlarm as any)[methodName](options);
  }

  throw new Error(`NativeAlarm.${methodName} is not available on this platform.`);
};

export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const scheduleNativeAlarm = async (
  seconds: number,
  title: string = '🌅 RailTrack Wake-Up Alarm!',
  body: string = 'Your train departure alarm is ringing now! Tap to open.',
  extra?: {
    trainNumber?: string;
    trainName?: string;
    stationName?: string;
    stationCode?: string;
    platform?: string;
  }
) => {
  if (isNativeApp()) {
    return await callNative<{ scheduled: boolean; triggerAtMillis: number; seconds: number }>(
      'scheduleExactAlarm',
      { seconds, title, body, ...(extra || {}) }
    );
  }
  return null;
};

export const cancelNativeAlarm = async (options?: { trainNumber?: string; stationCode?: string }) => {
  if (isNativeApp()) {
    try {
      return await callNative<{ cancelled: boolean }>('cancelAlarm', options || {});
    } catch (e) {
      console.warn('Could not cancel native alarm:', e);
    }
  }
  return null;
};

export const cancelAdaptiveStationAlarm = async (trainNumber: string, stationCode: string) => {
  if (isNativeApp()) {
    try {
      return await callNative<{ cancelled: boolean }>('cancelAdaptiveStationAlarm', { trainNumber, stationCode });
    } catch (e) {
      console.warn('Could not cancel adaptive station alarm:', e);
    }
  }
  return null;
};

export const getNativeActiveAlarms = async () => {
  if (isNativeApp()) {
    try {
      const res = await callNative<{ alarms: any[] }>('getActiveAlarms');
      return res?.alarms || [];
    } catch (e) {
      console.warn('Could not retrieve active native alarms:', e);
    }
  }
  return [];
};

export const armAdaptiveNativeAlarm = async (options: {
  trainNumber: string;
  stationCode: string;
  stationName?: string;
  platform?: string;
  triggerMinutes?: number;
  expectedArrival?: string;
  trainName?: string;
  journeyDate?: string;
  backendUrl?: string;
  backupEmail?: string;
}) => {
  if (isNativeApp()) {
    try {
      const defaultBackend = import.meta.env.VITE_API_BASE_URL || 'https://railway-tracking-backend-gwa2.onrender.com';
      return await callNative('armAdaptiveStationAlarm', {
        ...options,
        backendUrl: options.backendUrl || defaultBackend
      });
    } catch (e) {
      console.warn('Could not arm adaptive native alarm:', e);
    }
  }
  return null;
};

export const startNativeAlarm = async (options?: {
  title?: string;
  body?: string;
  trainNumber?: string;
  trainName?: string;
  stationName?: string;
  stationCode?: string;
  platform?: string;
  triggerMinutes?: number;
  backupEmail?: string;
}) => {
  if (isNativeApp()) {
    try {
      return await callNative<{ started: boolean }>('startAlarm', options || {});
    } catch (e) {
      console.warn('Could not start native alarm:', e);
    }
  }
  return null;
};

export const stopNativeAlarm = async () => {
  if (isNativeApp()) {
    try {
      return await callNative<{ stopped: boolean }>('stopAlarm');
    } catch (e) {
      console.warn('Could not stop native alarm:', e);
    }
  }
  return null;
};

export const checkNativeAlarmRinging = async () => {
  if (isNativeApp()) {
    try {
      return await callNative<{
        isRinging: boolean;
        trainNumber?: string;
        trainName?: string;
        stationName?: string;
        stationCode?: string;
        platform?: string;
        triggerMinutes?: number;
        expectedArrival?: string;
      }>('isAlarmRinging');
    } catch (e) {
      console.warn('Could not check native alarm ringing state:', e);
    }
  }
  return { isRinging: false };
};

export const snoozeNativeAlarm = async (minutes: number = 5, options?: { trainNumber?: string; stationCode?: string }) => {
  if (isNativeApp()) {
    try {
      return await callNative<{
        snoozed: boolean;
        snoozeMinutes: number;
        nextTriggerMillis: number;
      }>('snoozeAlarm', { minutes, ...options });
    } catch (e) {
      console.warn('Could not snooze native alarm:', e);
    }
  }
  return null;
};

export const syncCustomAudioToNative = async (blob: Blob): Promise<boolean> => {
  if (!isNativeApp()) return false;
  try {
    // 1. Initialize fresh temp file on native Android storage
    await callNative('startCustomAudioUpload');

    // 2. Stream chunk-by-chunk using native browser Blob.slice & FileReader (C++ hardware encoding)
    const totalBytes = blob.size;
    const CHUNK_SIZE = 128 * 1024; // 128 KB chunks
    let offset = 0;

    while (offset < totalBytes) {
      const end = Math.min(offset + CHUNK_SIZE, totalBytes);
      const chunkBlob = blob.slice(offset, end);
      const isLast = end >= totalBytes;

      const chunkBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = (reader.result as string) || '';
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = () => reject(new Error('FileReader slice read error'));
        reader.readAsDataURL(chunkBlob);
      });

      await callNative('appendCustomAudioChunk', {
        chunk: chunkBase64,
        isLast
      });

      offset = end;
    }

    console.log(`[NativeAlarmBridge] Successfully streamed full ${totalBytes} bytes (${(totalBytes / 1024).toFixed(1)} KB) of custom alarm audio to Android native storage!`);
    return true;
  } catch (err) {
    console.warn('[NativeAlarmBridge] Failed streaming chunked custom audio to native:', err);
    return false;
  }
};

export const clearNativeCustomAudio = async () => {
  if (isNativeApp()) {
    try {
      await callNative('clearCustomAlarmAudio');
    } catch (err) {
      console.warn('Failed to clear native custom audio:', err);
    }
  }
};

export const checkNativeAlarmPermissions = async (): Promise<NativeAlarmPermissions | null> => {
  if (isNativeApp()) {
    try {
      return await callNative<NativeAlarmPermissions>('checkPermissions');
    } catch (e) {
      console.warn('Error checking native permissions:', e);
    }
  }
  return null;
};

export const requestNativeOverlayPermission = async () => {
  if (isNativeApp()) {
    try {
      return await callNative<{ openedSettings?: boolean; alreadyGranted?: boolean }>(
        'requestOverlayPermission'
      );
    } catch (e) {
      console.warn('Error requesting overlay permission:', e);
    }
  }
  return null;
};

export const requestNativeNotificationPermission = async () => {
  if (isNativeApp()) {
    try {
      return await callNative<{ requested: boolean }>('requestNotificationPermission');
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }
  return null;
};

export const openNativeNotificationSettings = async () => {
  if (isNativeApp()) {
    try {
      return await callNative<{ opened: boolean }>('openNotificationSettings');
    } catch (e) {
      console.warn('Error opening notification settings:', e);
    }
  }
  return null;
};

export const triggerTestNotification = async (title?: string, body?: string): Promise<boolean> => {
  if (isNativeApp()) {
    try {
      await callNative<{ sent: boolean }>('sendTestNotification', {
        title: title || '🔔 RailTrack Notification Test',
        body: body || 'Real-time train delay alerts and departure alarms are operational on your device!'
      });
      return true;
    } catch (e) {
      console.warn('Native test notification error:', e);
      throw e;
    }
  }
  return false;
};
