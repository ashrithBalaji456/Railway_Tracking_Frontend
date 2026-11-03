/**
 * WhatsApp 1-Tap Sharing Service
 * Generates formatted WhatsApp messages and opens official WhatsApp Web / Mobile deep links.
 * Works 100% free with zero API keys or external dependencies.
 */

export interface WhatsAppShareOptions {
  phoneNumber?: string; // Optional: 10-digit or E.164 phone number
}

class WhatsAppShareService {
  /**
   * Cleans phone number by removing non-digits and ensuring country code (default India +91 if 10 digits)
   */
  private cleanPhoneNumber(phone?: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  }

  /**
   * Opens WhatsApp with formatted text
   */
  openWhatsApp(text: string, phoneNumber?: string): void {
    const cleanPhone = this.cleanPhoneNumber(phoneNumber);
    const encodedText = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Generates formatted text for Station Live Board Snapshot
   */
  shareStationLiveBoard(station: {
    stationCode: string;
    stationName: string;
    windowHours: number;
    trains: any[];
  }, phoneNumber?: string): void {
    const { stationCode, stationName, windowHours, trains } = station;
    const count = trains ? Math.min(trains.length, 10) : 0;

    let msg = `🚆 *RailTrack India • Live Station Board*\n`;
    msg += `🚉 *Station:* ${stationName} (${stationCode})\n`;
    msg += `⏱️ *Window:* Next ${windowHours} Hours\n\n`;

    if (count === 0) {
      msg += `_No upcoming trains scheduled in this window._\n\n`;
    } else {
      msg += `📋 *Upcoming Trains (${count}):*\n`;
      for (let i = 0; i < count; i++) {
        const t = trains[i];
        const num = t.trainNumber || '---';
        const name = t.trainName || 'Express';
        const src = t.source?.code || t.source || '';
        const dest = t.destination?.code || t.destination || '';
        const route = (src && dest) ? `${src} ➔ ${dest}` : '';
        const sch = t.scheduledArrival || t.scheduledDeparture || '--:--';
        const exp = t.expectedArrival || t.expectedDeparture || sch;
        const delay = t.delayMinutes != null ? t.delayMinutes : 0;
        const delayStr = delay <= 0 ? '✅ On Time' : `⚠️ +${delay}m Late`;
        const pf = t.platform ? `PF #${t.platform}` : 'PF TBD';

        msg += `\n*${i + 1}. ${num} - ${name}* (${pf})\n`;
        if (route) msg += `   Route: ${route}\n`;
        msg += `   Exp: ${exp} (${delayStr})\n`;
      }
    }

    const host = window.location.origin;
    msg += `\n🔗 *Track live station updates:*\n${host}/stations?code=${stationCode}\n`;

    this.openWhatsApp(msg, phoneNumber);
  }

  /**
   * Generates formatted text for Live Train Status
   */
  shareLiveTrainStatus(train: {
    trainNumber: string;
    trainName?: string;
    currentLocation?: string;
    speed?: number;
    delayMinutes?: number;
    nextStation?: string;
  }, phoneNumber?: string): void {
    const { trainNumber, trainName, currentLocation, speed, delayMinutes, nextStation } = train;
    const delay = delayMinutes != null ? delayMinutes : 0;
    const delayStr = delay <= 0 ? '✅ Running On Time' : `⚠️ Running +${delay} mins Late`;

    let msg = `🚆 *RailTrack India • Live Train Status*\n`;
    msg += `🚄 *Train:* ${trainNumber} ${trainName ? `- ${trainName}` : ''}\n`;
    msg += `📊 *Status:* ${delayStr}\n`;
    if (currentLocation) msg += `📍 *Current Position:* ${currentLocation}\n`;
    if (nextStation) msg += `🚉 *Next Halt:* ${nextStation}\n`;
    if (speed != null && speed > 0) msg += `⚡ *Speed:* ${speed} km/h\n`;

    const host = window.location.origin;
    msg += `\n🔗 *View live GPS coordinates & platform:*\n${host}/trains/${trainNumber}\n`;

    this.openWhatsApp(msg, phoneNumber);
  }

  /**
   * Generates formatted text for Travel Day Reminder / PNR
   */
  sharePnrTravelReminder(pnrData: {
    pnr: string;
    trainNumber: string;
    trainName?: string;
    travelDate: string;
  }, phoneNumber?: string): void {
    const { pnr, trainNumber, trainName, travelDate } = pnrData;

    let msg = `🚆 *RailTrack India • Journey Memo*\n`;
    msg += `🎫 *PNR Number:* ${pnr}\n`;
    msg += `🚄 *Train:* ${trainNumber} ${trainName ? `- ${trainName}` : ''}\n`;
    msg += `📅 *Travel Date:* ${travelDate}\n`;

    const host = window.location.origin;
    msg += `\n🔗 *Check live status & platform:*\n${host}/trains/${trainNumber}\n`;

    this.openWhatsApp(msg, phoneNumber);
  }

  /**
   * Generates formatted text for PNR Waitlist Confirmation Forecast
   */
  sharePnrConfirmationPrediction(data: {
    pnr: string;
    trainNumber: string;
    travelDate: string;
    quota: string;
    travelClass: string;
    currentStatus: number;
    probability: number;
    headline: string;
  }, phoneNumber?: string): void {
    const { pnr, trainNumber, travelDate, quota, travelClass, currentStatus, probability, headline } = data;

    let msg = `🎫 *RailTrack India • PNR Confirmation Forecast*\n`;
    msg += `🔢 *PNR:* ${pnr} • *Train:* ${trainNumber}\n`;
    msg += `📅 *Date:* ${travelDate} • *Class:* ${travelClass}\n`;
    msg += `📊 *Status:* ${quota} #${currentStatus}\n`;
    msg += `🎯 *Confirmation Chance:* ${probability}% (${headline})\n`;

    const host = window.location.origin;
    msg += `\n🔗 *Track live status & chart countdown:*\n${host}/pnr?pnr=${pnr}\n`;

    this.openWhatsApp(msg, phoneNumber);
  }

  /**
   * Generates formatted text for IRCTC Chart Preparation Countdown
   */
  shareChartPreparationCountdown(data: {
    trainNumber: string;
    trainName?: string;
    travelDate: string;
    departureTime: string;
    phaseTitle: string;
    countdownText: string;
    ruleApplied: string;
  }, phoneNumber?: string): void {
    const { trainNumber, trainName, travelDate, departureTime, phaseTitle, countdownText, ruleApplied } = data;

    let msg = `⏳ *IRCTC Chart Preparation Clock • RailTrack India*\n`;
    msg += `🚄 *Train:* ${trainNumber} ${trainName ? `- ${trainName}` : ''}\n`;
    msg += `🕒 *Departure:* ${travelDate} at ${departureTime}\n`;
    msg += `📊 *Phase:* ${phaseTitle}\n`;
    msg += `⏱️ *Time Remaining:* ${countdownText}\n`;
    msg += `📋 *Rule:* ${ruleApplied}\n`;

    const host = window.location.origin;
    msg += `\n🔗 *Check live chart countdown & platform:*\n${host}/pnr?pnr=4521849021\n`;

    this.openWhatsApp(msg, phoneNumber);
  }
}

export const whatsappShareService = new WhatsAppShareService();
export default whatsappShareService;

