export type QuotaType = 'GNWL' | 'RLWL' | 'PQWL' | 'TQWL' | 'RAC';
export type TrainClassType = '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | '2S';

export interface ProbabilityResult {
  probability: number; // 0 - 100
  tier: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';
  headline: string;
  clearedSoFar: number;
  insight: string;
  advice: string;
  color: 'emerald' | 'amber' | 'rose' | 'indigo';
}

export interface ChartingTimelineResult {
  departureDateTime: Date;
  chart1DateTime: Date;
  chart2DateTime: Date;
  ruleApplied: string;
  currentPhase: 'BOOKING' | 'CHART1_PREPARED' | 'CURRENT_BOOKING' | 'CHART2_FINALIZED';
  phaseTitle: string;
  nextMilestone: string;
  nextMilestoneTime: Date;
  countdownMs: number;
  countdownFormatted: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    text: string;
  };
  isChart1Ready: boolean;
  isChart2Ready: boolean;
}

class PnrPredictorService {
  /**
   * Calculates confirmation probability based on Indian Railways quotas,
   * clearance velocities, passenger cancellation rates, and coach capacities.
   */
  calculateProbability(params: {
    quota: QuotaType;
    travelClass: TrainClassType;
    bookingStatus: number;
    currentStatus: number;
    travelDate?: string;
  }): ProbabilityResult {
    const { quota, travelClass, bookingStatus, currentStatus, travelDate } = params;

    // Handle RAC explicitly
    if (quota === 'RAC') {
      const racNum = Math.max(1, currentStatus);
      const prob = Math.min(99, Math.max(90, 100 - racNum * 0.4));
      return {
        probability: Math.round(prob),
        tier: 'VERY_HIGH',
        headline: 'Guaranteed Journey (RAC • Seat Allocated)',
        clearedSoFar: Math.max(0, bookingStatus - currentStatus),
        insight: `You have an assured sitting seat. With RAC #${currentStatus}, there is a ~${Math.round(prob)}% probability of conversion into a full sleeping berth upon Chart 1 finalization.`,
        advice: 'You are permitted to board the reserved coach. Look for the TTE or the station chart board to check if you have received a full berth.',
        color: 'emerald'
      };
    }

    // 1. Quota Base Confidence
    // GNWL has access to the full primary quota and general cancellations pool
    // RLWL has intermediate remote quotas
    // PQWL has very restricted intermediate pooling
    // TQWL has zero cancellation refund, so almost no one cancels Tatkal
    let baseConfidence = 78;
    if (quota === 'GNWL') baseConfidence = 80;
    else if (quota === 'RLWL') baseConfidence = 52;
    else if (quota === 'PQWL') baseConfidence = 32;
    else if (quota === 'TQWL') baseConfidence = 18;

    // 2. Class Capacity & Seat Turnover Multiplier
    // SL has ~400+ berths across 6-8 coaches (high clearance)
    // 3A has ~380 berths across 6 coaches
    // 2A has ~100 berths (limited movement)
    // 1A has only 18-24 berths total (tiny movement, WL > 4 rarely clears)
    let classMultiplier = 1.0;
    let maxRealisticClearance = 45;

    switch (travelClass) {
      case 'SL':
        classMultiplier = 1.15;
        maxRealisticClearance = 85;
        break;
      case '3A':
      case '3E':
        classMultiplier = 1.0;
        maxRealisticClearance = 55;
        break;
      case '2A':
        classMultiplier = 0.78;
        maxRealisticClearance = 20;
        break;
      case '1A':
        classMultiplier = 0.45;
        maxRealisticClearance = 6;
        break;
      case 'CC':
        classMultiplier = 0.88;
        maxRealisticClearance = 30;
        break;
      case '2S':
        classMultiplier = 1.1;
        maxRealisticClearance = 70;
        break;
    }

    // 3. Movement / Clearance Velocity
    const cleared = Math.max(0, bookingStatus - currentStatus);
    const velocityBonus = Math.min(18, cleared * 1.2);

    // 4. Days until travel
    let daysToTravel = 3;
    if (travelDate) {
      const now = new Date();
      const target = new Date(travelDate);
      const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysToTravel = Math.max(0, diffDays);
    }

    // Clearance spikes in the last 48 hours prior to Chart 1
    const urgencyFactor = daysToTravel <= 1 ? 1.15 : daysToTravel <= 3 ? 1.05 : 0.95;

    // 5. Final Probability Computation
    const effectiveTarget = maxRealisticClearance * classMultiplier * (baseConfidence / 75);
    const relativePosition = currentStatus / Math.max(1, effectiveTarget);

    let rawScore = (1 - Math.min(1.2, relativePosition * 0.85)) * 100;
    rawScore = (rawScore * 0.7 + baseConfidence * 0.3) + velocityBonus;
    rawScore *= urgencyFactor;

    // Boundary constraints
    let finalProb = Math.min(97, Math.max(5, Math.round(rawScore)));

    // Specific domain caps
    if (quota === 'TQWL' && currentStatus > 10) finalProb = Math.min(25, finalProb);
    if (travelClass === '1A' && currentStatus > 5) finalProb = Math.min(22, finalProb);
    if (quota === 'PQWL' && currentStatus > 25) finalProb = Math.min(30, finalProb);

    // Categorization
    if (finalProb >= 78) {
      return {
        probability: finalProb,
        tier: 'VERY_HIGH',
        headline: 'High Chance of Confirmation',
        clearedSoFar: cleared,
        insight: `Your current status ${quota} #${currentStatus} is well within the typical historical clearing limit for ${travelClass} class on this route.`,
        advice: 'Very high likelihood of berth allocation upon Chart 1 finalization. Prepare your luggage and stay tuned for the chart lock alert.',
        color: 'emerald'
      };
    } else if (finalProb >= 55) {
      return {
        probability: finalProb,
        tier: 'MODERATE',
        headline: 'Moderate Chance of Confirmation',
        clearedSoFar: cleared,
        insight: `Cleared ${cleared} spots so far. Movement accelerates rapidly in the final 24 hours as passengers with unconfirmed plans cancel.`,
        advice: 'Keep an eye on Tatkal options (opens 1 day prior: 10:00 AM AC, 11:00 AM Non-AC) as a backup if you require guaranteed travel.',
        color: 'amber'
      };
    } else {
      return {
        probability: finalProb,
        tier: 'LOW',
        headline: 'Low Chance of Confirmation',
        clearedSoFar: cleared,
        insight: `Status ${quota} #${currentStatus} is high relative to the coach quota for ${travelClass}. Intermediate/Tatkal quotas have minimal turnover.`,
        advice: 'Strongly recommended: Book alternative trains on this route or book Tatkal tomorrow morning at 10:00 AM (AC) / 11:00 AM (Non-AC). Unconfirmed e-tickets are auto-cancelled after Chart 2.',
        color: 'rose'
      };
    }
  }

  /**
   * Evaluates the official Indian Railways Chart Preparation timeline:
   * 1. Morning Trains (05:00 to 14:00): Prepared at 8:00 PM on previous night.
   * 2. Other Trains (after 14:00 or before 05:00): Prepared 10 hours before departure.
   * 3. Final Chart (Chart 2): Prepared 30 minutes before departure.
   */
  calculateChartTimeline(
    travelDateStr: string, // YYYY-MM-DD
    departureTimeStr: string = '16:00' // HH:mm
  ): ChartingTimelineResult {
    const [hours, minutes] = departureTimeStr.split(':').map(Number);
    const [year, month, day] = travelDateStr.split('-').map(Number);

    const departureDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);

    let chart1DateTime: Date;
    let ruleApplied: string;

    const depMinutesOfDay = (hours || 0) * 60 + (minutes || 0);
    const fiveAmMinutes = 5 * 60;
    const twoPmMinutes = 14 * 60;

    // Check if morning train between 05:00 and 14:00
    if (depMinutesOfDay >= fiveAmMinutes && depMinutesOfDay <= twoPmMinutes) {
      // 8:00 PM on previous night
      chart1DateTime = new Date(departureDateTime);
      chart1DateTime.setDate(chart1DateTime.getDate() - 1);
      chart1DateTime.setHours(20, 0, 0, 0); // 8:00 PM
      ruleApplied = 'Morning Departure (05:00–14:00) • Finalized at 08:00 PM on the previous evening';
    } else {
      // 10 hours before departure
      chart1DateTime = new Date(departureDateTime.getTime() - 10 * 60 * 60 * 1000);
      ruleApplied = 'Afternoon / Night Departure • Finalized exactly 10 hours before origin departure';
    }

    // Chart 2 is always 30 minutes before departure
    const chart2DateTime = new Date(departureDateTime.getTime() - 30 * 60 * 1000);

    const now = new Date();
    const isChart1Ready = now.getTime() >= chart1DateTime.getTime();
    const isChart2Ready = now.getTime() >= chart2DateTime.getTime();

    let currentPhase: 'BOOKING' | 'CHART1_PREPARED' | 'CURRENT_BOOKING' | 'CHART2_FINALIZED';
    let phaseTitle: string;
    let nextMilestone: string;
    let nextMilestoneTime: Date;
    let countdownMs: number;

    if (!isChart1Ready) {
      currentPhase = 'BOOKING';
      phaseTitle = 'Standard Booking Phase (Waitlist Clearance Active)';
      nextMilestone = 'Chart 1 Preparation';
      nextMilestoneTime = chart1DateTime;
      countdownMs = Math.max(0, chart1DateTime.getTime() - now.getTime());
    } else if (!isChart2Ready) {
      currentPhase = 'CHART1_PREPARED';
      phaseTitle = 'Chart 1 Finalized • Current Counter Booking Open';
      nextMilestone = 'Final Chart 2 Lock';
      nextMilestoneTime = chart2DateTime;
      countdownMs = Math.max(0, chart2DateTime.getTime() - now.getTime());
    } else {
      currentPhase = 'CHART2_FINALIZED';
      phaseTitle = 'Final Chart 2 Finalized • Train Ready for Boarding';
      nextMilestone = 'Train Departure';
      nextMilestoneTime = departureDateTime;
      countdownMs = Math.max(0, departureDateTime.getTime() - now.getTime());
    }

    // Format countdown
    const totalSecs = Math.floor(countdownMs / 1000);
    const d = Math.floor(totalSecs / (3600 * 24));
    const h = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const text = d > 0 ? `${d}d ${pad(h)}h : ${pad(m)}m : ${pad(s)}s` : `${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;

    return {
      departureDateTime,
      chart1DateTime,
      chart2DateTime,
      ruleApplied,
      currentPhase,
      phaseTitle,
      nextMilestone,
      nextMilestoneTime,
      countdownMs,
      countdownFormatted: {
        days: d,
        hours: h,
        minutes: m,
        seconds: s,
        text
      },
      isChart1Ready,
      isChart2Ready
    };
  }

  /**
   * Plays an authentic pleasant synthesized notification audio chime (880Hz -> 1320Hz)
   * using Web Audio API to preview chart countdown alarms without external sound files.
   */
  playNotificationChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // Note A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.25); // Note E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.linearRampToValueAtTime(660, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio chime playback not supported:', e);
    }
  }
}

export const pnrPredictorService = new PnrPredictorService();
export default pnrPredictorService;

