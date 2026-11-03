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
}

export const whatsappShareService = new WhatsAppShareService();
export default whatsappShareService;
