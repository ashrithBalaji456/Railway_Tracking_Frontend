/**
 * Web Notification Service for RailTrack India
 * Provides native OS browser push notifications and in-app alert toasts
 * with Web Audio API chime synthesis for high-priority railway alerts.
 */

import { isNativeApp, triggerTestNotification } from './nativeAlarmBridge';

export interface RailNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
  playChime?: boolean;
}

class WebNotificationService {
  private lastAlertTimes: Map<string, number> = new Map();
  private audioCtx: AudioContext | null = null;

  /**
   * Check if the browser supports native desktop/mobile push notifications
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current notification permission ('default' | 'granted' | 'denied')
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Prompt user to grant browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Synthesize a subtle, pleasant 3-tone railway delay alert chime
   * (C5 -> E5 -> G5, 523Hz -> 659Hz -> 784Hz)
   */
  playAlertChime(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      const noteDuration = 0.14;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * noteDuration);

        // Envelope
        const startTime = ctx.currentTime + idx * noteDuration;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Send a notification to the user via OS notification + In-App Toast
   */
  sendNotification(payload: RailNotificationPayload): void {
    const { title, body, icon = '/app-icon.png', tag, url, playChime = true } = payload;

    // 1. Play soft audio chime
    if (playChime) {
      this.playAlertChime();
    }

    // 2. Dispatch custom event for In-App Toast banner
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rail-notification', {
          detail: { title, body, url, tag, timestamp: Date.now() }
        })
      );
    }

    // 3. Dispatch Native Android System Notification when running inside Android App
    if (isNativeApp()) {
      triggerTestNotification(title, body).catch((e) => {
        console.warn('Native notification dispatch failed:', e);
      });
      return;
    }

    // 4. Fire Native OS / Browser Notification if permission granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon,
          badge: icon,
          tag: tag || 'railtrack-alert',
          silent: !playChime
        } as any);

        notification.onclick = () => {
          window.focus();
          notification.close();
          if (url && typeof window !== 'undefined') {
            window.location.href = url;
          }
        };
      } catch (err) {
        console.warn('Native browser notification dispatch failed:', err);
      }
    }
  }

  /**
   * High-Impact Live Train Delay Alert Dispatcher
   * Formats: "⚠️ RailTrack Alert: 12952 Mumbai Rajdhani is Delayed by 48 mins"
   * "Current location: Passing Kota Jn. Estimated arrival shifted from 08:30 to 09:18."
   */
  sendDelayAlert(params: {
    trainNumber: string;
    trainName?: string;
    delayMinutes: number;
    currentStation?: string;
    scheduledArrival?: string;
    estimatedArrival?: string;
    thresholdMinutes?: number;
    force?: boolean;
  }): boolean {
    const {
      trainNumber,
      trainName = '',
      delayMinutes,
      currentStation,
      scheduledArrival,
      estimatedArrival,
      thresholdMinutes = 15,
      force = false
    } = params;

    if (!force && delayMinutes < thresholdMinutes) {
      return false; // Under threshold
    }

    // Cooldown check (do not spam the exact same train delay within 15 minutes)
    const alertKey = `delay_${trainNumber}_${delayMinutes}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTimes.get(alertKey);

    if (!force && lastAlert && now - lastAlert < 15 * 60 * 1000) {
      return false; // Already alerted for this delay magnitude recently
    }

    this.lastAlertTimes.set(alertKey, now);

    const displayName = trainName ? `${trainNumber} ${trainName}` : trainNumber;
    const title = `⚠️ RailTrack Alert: ${displayName} is Delayed by ${delayMinutes} mins`;

    const locText = currentStation ? `Current location: Passing ${currentStation}.` : 'Current status: Running delayed.';
    const timeShiftText =
      scheduledArrival && estimatedArrival
        ? ` Estimated arrival shifted from ${scheduledArrival} to ${estimatedArrival}.`
        : ` Train is currently ${delayMinutes} mins behind scheduled timetable.`;

    const body = `${locText}${timeShiftText}`;
    const targetUrl = `/trains/${trainNumber}`;

    this.sendNotification({
      title,
      body,
      tag: `delay-${trainNumber}`,
      url: targetUrl,
      playChime: true
    });

    return true;
  }

  /**
   * Trigger an instant live demo / test delay alert
   */
  sendSampleDelayAlert(trainNumber = '12952', trainName = 'Mumbai Rajdhani', delayMinutes = 48): void {
    this.sendDelayAlert({
      trainNumber,
      trainName,
      delayMinutes,
      currentStation: 'Kota Jn (KOTA)',
      scheduledArrival: '08:30 AM',
      estimatedArrival: '09:18 AM',
      force: true
    });
  }

  /**
   * High-Priority IRCTC Chart Preparation Alert Dispatcher
   * Includes 20-minute upload buffer to guarantee the chart is live on IRCTC servers.
   */
  sendChartPreparedAlert(params: {
    trainNumber: string;
    trainName?: string;
    chartType?: string;
    pnr?: string;
    bufferMinutes?: number;
  }): void {
    const { trainNumber, trainName = '', chartType = 'Chart 1', pnr, bufferMinutes = 20 } = params;
    const displayName = trainName ? `${trainNumber} ${trainName}` : trainNumber;
    const title = `🎫 IRCTC ${chartType} Prepared: ${displayName}`;
    const pnrText = pnr ? ` for PNR ${pnr}` : '';
    const body = `The reservation chart is finalized and live on IRCTC (+${bufferMinutes}m upload buffer)! Tap to check your confirmed coach & berth.${pnrText}`;
    const url = 'https://www.irctc.co.in/online-charts/';

    this.sendNotification({
      title,
      body,
      tag: `chart-${trainNumber}`,
      url,
      playChime: true
    });
  }

  /**
   * Trigger an instant live demo / test chart preparation alert (+20m buffer)
   */
  sendSampleChartAlert(trainNumber = '12952', trainName = 'Mumbai Rajdhani', pnr = '4521098741'): void {
    this.sendChartPreparedAlert({
      trainNumber,
      trainName,
      chartType: 'Chart 1',
      pnr,
      bufferMinutes: 20
    });
  }

  /**
   * Route Disruption & Weather Safety Advisory Alert Dispatcher
   */
  sendDisruptionAlert(params: {
    trainNumber: string;
    trainName?: string;
    disruptionType?: string;
    affectedSection?: string;
    reason?: string;
  }): void {
    const {
      trainNumber,
      trainName = '',
      disruptionType = 'DIVERTED',
      affectedSection,
      reason
    } = params;
    const displayName = trainName ? `${trainNumber} ${trainName}` : trainNumber;
    const cleanType = disruptionType.toUpperCase().includes('CANCEL')
      ? 'Cancelled'
      : disruptionType.toUpperCase().includes('DIVERT')
      ? 'Diverted'
      : 'Rescheduled';

    const title = `🚨 Route Advisory: Train ${displayName} is ${cleanType}`;
    const sectionText = affectedSection ? ` on ${affectedSection}.` : '.';
    const reasonText = reason ? ` (${reason})` : '';
    const body = `Service exception reported${sectionText}${reasonText} Tap to view alternate routes & 100% IRCTC TDR refund guidelines.`;
    const url = `/disruptions?train=${trainNumber}`;

    this.sendNotification({
      title,
      body,
      tag: `disruption-${trainNumber}`,
      url,
      playChime: true
    });
  }

  /**
   * Trigger an instant live demo / test disruption alert
   */
  sendSampleDisruptionAlert(trainNumber = '12626', trainName = 'Kerala Express'): void {
    this.sendDisruptionAlert({
      trainNumber,
      trainName,
      disruptionType: 'DIVERTED',
      affectedSection: 'Bhopal Jn (BPL) - Itarsi Jn (ET)',
      reason: 'Track maintenance & fog speed restrictions'
    });
  }

  /**
   * High-Priority Travel Day Departure & Wake-Up Alarm Dispatcher
   * Fires prior to scheduled/expected departure at the passenger's specific boarding station.
   */
  sendDepartureReminderAlert(params: {
    trainNumber: string;
    trainName?: string;
    stationName?: string;
    platform?: string | number;
    scheduledTime?: string;
    expectedTime?: string;
    delayMinutes?: number;
    advanceMinutes?: number;
    pnr?: string;
  }): void {
    const {
      trainNumber,
      trainName = '',
      stationName = 'Boarding Station',
      platform,
      scheduledTime,
      expectedTime,
      delayMinutes = 0,
      advanceMinutes = 150,
      pnr
    } = params;

    const displayName = trainName ? trainNumber + ' ' + trainName : trainNumber;
    const hours = (advanceMinutes / 60).toFixed(1).replace(/\.0$/, '');
    const title = '🌅 Wake-Up Alert: ' + displayName + ' Departing in ' + hours + 'h!';

    const platText = platform && platform !== 'TBA' ? ' (Platform ' + platform + ')' : '';
    const delayInfo =
      delayMinutes > 0
        ? 'Running ' + delayMinutes + 'm late (Expected: ' + (expectedTime || 'Updated Time') + ')'
        : 'On Time (Scheduled: ' + (scheduledTime || 'On Schedule') + ')';

    const pnrText = pnr ? ' [PNR: ' + pnr + ']' : '';
    const body = 'Boarding at ' + stationName + platText + '. ' + delayInfo + '. Time to get ready & head to station!' + pnrText;
    const url = '/trains/' + trainNumber;

    this.sendNotification({
      title,
      body,
      tag: 'departure-' + trainNumber,
      url,
      playChime: true
    });
  }

  /**
   * Trigger an instant live demo / test wake-up departure alert
   */
  sendSampleDepartureAlert(
    trainNumber = '12952',
    trainName = 'Mumbai Rajdhani',
    stationName = 'New Delhi (NDLS)',
    platform = '3',
    delayMinutes = 180,
    advanceMinutes = 150
  ): void {
    this.sendDepartureReminderAlert({
      trainNumber,
      trainName,
      stationName,
      platform,
      scheduledTime: '05:00 AM',
      expectedTime: '08:00 AM',
      delayMinutes,
      advanceMinutes,
      pnr: '4521849021'
    });
  }
}

export const webNotificationService = new WebNotificationService();
export default webNotificationService;

