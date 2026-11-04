import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeAlarmPermissions {
  notifications: boolean;
  overlay: boolean;
  exactAlarm: boolean;
}

export interface NativeAlarmPluginInterface {
  scheduleExactAlarm(options: { seconds: number; title?: string; body?: string }): Promise<{
    scheduled: boolean;
    triggerAtMillis: number;
    seconds: number;
  }>;
  cancelAlarm(): Promise<{ cancelled: boolean }>;
  setCustomAlarmAudio(options: { base64: string }): Promise<{ saved: boolean; path: string; size: number }>;
  clearCustomAlarmAudio(): Promise<{ cleared: boolean }>;
  stopAlarm(): Promise<{ stopped: boolean }>;
  isAlarmPlaying(): Promise<{ isPlaying: boolean }>;
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
  body: string = 'Your train departure alarm is ringing now! Tap to open.'
) => {
  if (isNativeApp()) {
    return await callNative<{ scheduled: boolean; triggerAtMillis: number; seconds: number }>(
      'scheduleExactAlarm',
      { seconds, title, body }
    );
  }
  return null;
};

export const cancelNativeAlarm = async () => {
  if (isNativeApp()) {
    try {
      return await callNative<{ cancelled: boolean }>('cancelAlarm');
    } catch (e) {
      console.warn('Could not cancel native alarm:', e);
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

export const syncCustomAudioToNative = async (blob: Blob): Promise<boolean> => {
  if (!isNativeApp()) return false;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const resultStr = reader.result as string;
        const base64data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
        await callNative('setCustomAlarmAudio', { base64: base64data });
        console.log('Successfully synced custom audio to Android native storage');
        resolve(true);
      } catch (err) {
        console.warn('Failed to sync custom audio to native:', err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(blob);
  });
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
