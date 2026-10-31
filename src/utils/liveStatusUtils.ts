/**
 * Utility functions for reliable railway live status and departure window tracking.
 */

export interface DepartedWindowResult {
  isWithinWindow: boolean;
  elapsedMinutes: number | null;
  formattedElapsed?: string;
}

/**
 * Checks whether an actual departure occurred within the specified window (default 7 minutes).
 * Handles ISO timestamps with timezone, UTC/local formats, and HH:mm with midnight crossings.
 *
 * Rules:
 * 1. Requires a confirmed actual departure timestamp/time string.
 * 2. Computes the elapsed minutes between the current time and actual departure.
 * 3. Returns isWithinWindow = true ONLY when elapsedMinutes is between 0 and windowMinutes (inclusive).
 * 4. After the window passes, isWithinWindow becomes false.
 */
export function getDepartedWindowInfo(
  actualDepartureStr?: string | null,
  windowMinutes: number = 7
): DepartedWindowResult {
  if (!actualDepartureStr || typeof actualDepartureStr !== 'string') {
    return { isWithinWindow: false, elapsedMinutes: null };
  }

  const clean = actualDepartureStr.trim();
  if (!clean || clean.toLowerCase() === 'null') {
    return { isWithinWindow: false, elapsedMinutes: null };
  }

  const now = new Date();
  let depTimeMs: number | null = null;

  // Case 1: Full ISO string with date & time (e.g. 2026-10-31T14:00:00+05:30 or 2026-10-31 14:00:00)
  if (clean.includes('T') || (clean.includes('-') && clean.includes(':'))) {
    const isoNorm = clean.includes(' ') && !clean.includes('T') ? clean.replace(' ', 'T') : clean;
    const parsed = new Date(isoNorm);
    if (!isNaN(parsed.getTime())) {
      depTimeMs = parsed.getTime();
    }
  }

  // Case 2: Time-only string (e.g. "14:00", "14:00:00", "02:00 PM", "2:00 pm")
  if (depTimeMs === null && clean.includes(':')) {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    const isPm = /pm/i.test(clean);
    const isAm = /am/i.test(clean);
    const timeOnly = clean.replace(/(am|pm)/i, '').trim();
    const parts = timeOnly.split(':').map((p) => parseInt(p, 10));

    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      hours = parts[0];
      minutes = parts[1];
      if (parts.length >= 3 && !isNaN(parts[2])) {
        seconds = parts[2];
      }

      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;

      // Construct a Date object for today in user's local timezone (IST)
      const candidateDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);

      // Handle midnight crossings:
      // If candidateDate is in the future compared to now (e.g., now is 00:04, departure was 23:59),
      // candidateDate must have been yesterday.
      if (candidateDate.getTime() > now.getTime() + 60000) {
        candidateDate.setDate(candidateDate.getDate() - 1);
      }
      depTimeMs = candidateDate.getTime();
    }
  }

  if (depTimeMs === null) {
    return { isWithinWindow: false, elapsedMinutes: null };
  }

  const diffMs = now.getTime() - depTimeMs;
  const elapsedMinutes = Math.floor(diffMs / 60000);

  // Active within window (e.g. 0 to 7 minutes inclusive)
  const isWithinWindow = elapsedMinutes >= 0 && elapsedMinutes <= windowMinutes;

  return {
    isWithinWindow,
    elapsedMinutes: elapsedMinutes >= 0 ? elapsedMinutes : null,
    formattedElapsed: elapsedMinutes >= 0 ? `${elapsedMinutes}m ago` : undefined
  };
}

/**
 * Extracts a clean HH:mm representation for display from ISO timestamps or time strings.
 */
export function formatTimeForDisplay(tStr?: string | null): string {
  if (!tStr) return '';
  const clean = tStr.trim();
  if (clean.includes('T')) {
    const idx = clean.indexOf('T');
    return clean.substring(idx + 1, idx + 6);
  }
  if (clean.includes('-') && clean.includes(':')) {
    const parts = clean.split(' ');
    if (parts.length > 1 && parts[1].includes(':')) {
      return parts[1].substring(0, 5);
    }
  }
  if (clean.length > 5 && clean.includes(':') && !clean.toLowerCase().includes('m')) {
    return clean.substring(0, 5);
  }
  return clean;
}

