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
  checkPermissions(): Promise<NativeAlarmPermissions>;
  requestOverlayPermission(): Promise<{ openedSettings?: boolean; alreadyGranted?: boolean }>;
  requestNotificationPermission(): Promise<{ requested: boolean }>;
}

const NativeAlarm = registerPlugin<NativeAlarmPluginInterface>('NativeAlarm');

export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const scheduleNativeAlarm = async (
  seconds: number,
  title: string = '🌅 RailTrack Wake-Up Alarm!',
  body: string = 'Your train departure alarm is ringing now! Tap to open.'
) => {
  if (isNativeApp()) {
    return await NativeAlarm.scheduleExactAlarm({ seconds, title, body });
  }
  return null;
};

export const cancelNativeAlarm = async () => {
  if (isNativeApp()) {
    try {
      return await NativeAlarm.cancelAlarm();
    } catch (e) {
      console.warn('Could not cancel native alarm:', e);
    }
  }
  return null;
};

export const checkNativeAlarmPermissions = async (): Promise<NativeAlarmPermissions | null> => {
  if (isNativeApp()) {
    try {
      return await NativeAlarm.checkPermissions();
    } catch (e) {
      console.warn('Error checking native permissions:', e);
    }
  }
  return null;
};

export const requestNativeOverlayPermission = async () => {
  if (isNativeApp()) {
    try {
      return await NativeAlarm.requestOverlayPermission();
    } catch (e) {
      console.warn('Error requesting overlay permission:', e);
    }
  }
  return null;
};

export const requestNativeNotificationPermission = async () => {
  if (isNativeApp()) {
    try {
      return await NativeAlarm.requestNotificationPermission();
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }
  return null;
};
