// Fast local station and train search directory helper
// Built over 10,794 Indian Railway stations and 10,768 Indian Railway trains
// Provides instant (<5ms) client-side search, alphabetical A-Z browsing, and relevance scoring

import allStationsMeta from '../data/allStationsMeta.json';
import allTrainsMeta from '../data/allTrainsMeta.json';

export interface StationSearchItem {
  stationCode: string;
  stationName: string;
  state?: string;
  zone?: string;
  category?: string;
  district?: string;
}

export interface TrainSearchItem {
  trainNumber: string;
  trainName: string;
  trainType: string;
  sourceStation?: string;
  destinationStation?: string;
}

const stationMetaMap = (allStationsMeta as unknown) as Record<string, [string, string, string, string, string]>;
const trainsRawList = (allTrainsMeta as unknown) as Array<[string, string, string, string, string]>;

const CATEGORY_SCORES: Record<string, number> = {
  NSG1: 35,
  NSG2: 30,
  NSG3: 25,
  NSG4: 20,
  NSG5: 15,
  NSG6: 10,
  SG1: 15,
  SG2: 12,
  SG3: 10,
};

// All 10,794 stations indexed and sorted Alphabetically (A to Z)
export const ALL_STATIONS: StationSearchItem[] = Object.entries(stationMetaMap)
  .map(([code, meta]) => {
    const rawName = meta[0] || code;
    // Format to clean title case for presentation
    const formattedName = rawName
      .toLowerCase()
      .replace(/(?:^|\s|\/|-|\.)\S/g, (char) => char.toUpperCase());

    return {
      stationCode: code.toUpperCase(),
      stationName: formattedName,
      state: meta[1] || '',
      zone: meta[2] || '',
      category: meta[3] || 'UNKNOWN',
      district: meta[4] || '',
    };
  })
  .sort((a, b) => a.stationName.localeCompare(b.stationName));

export const TOTAL_STATIONS_COUNT = ALL_STATIONS.length;

// All 10,768 trains indexed and sorted Alphabetically (A to Z)
export const ALL_TRAINS: TrainSearchItem[] = trainsRawList
  .map(([trainNumber, trainName, trainType, sourceStation, destinationStation]) => ({
    trainNumber,
    trainName: trainName || `Train ${trainNumber}`,
    trainType: trainType || 'Express',
    sourceStation: sourceStation || '',
    destinationStation: destinationStation || '',
  }))
  .sort((a, b) => a.trainName.localeCompare(b.trainName));

export const TOTAL_TRAINS_COUNT = ALL_TRAINS.length;

// Backward-compatible alias for existing imports
export const ALPHABETICAL_MAJOR_STATIONS = ALL_STATIONS;
export const ALPHABETICAL_POPULAR_TRAINS = ALL_TRAINS;

/**
 * Searches all 10,794 stations locally with instant relevance ranking.
 * If query is empty, returns all stations sorted alphabetically (A to Z).
 */
export function searchStationsFast(query?: string, limit = 100): StationSearchItem[] {
  const q = (query || '').trim().toLowerCase();

  // Empty query -> Return alphabetical A-Z list
  if (!q) {
    return ALL_STATIONS.slice(0, limit);
  }

  const matches: Array<{ item: StationSearchItem; score: number }> = [];

  for (const item of ALL_STATIONS) {
    const code = item.stationCode.toLowerCase();
    const name = item.stationName.toLowerCase();
    let score = 0;

    // 1. Exact match on station code (Highest priority)
    if (code === q) {
      score += 2000;
    }
    // 2. Exact match on station name
    else if (name === q) {
      score += 1500;
    }
    // 3. Station code starts with query (e.g. typing 'MC' -> MCI)
    else if (code.startsWith(q)) {
      score += 1000 - (code.length - q.length) * 10;
    }
    // 4. Station name starts with query (e.g. typing 'manch' -> Mancherial)
    else if (name.startsWith(q)) {
      score += 900;
    }
    // 5. Word in station name starts with query
    else if (name.includes(' ' + q) || name.includes('-' + q) || name.includes('/' + q)) {
      score += 600;
    }
    // 6. Station code contains query
    else if (code.includes(q)) {
      score += 400;
    }
    // 7. Station name contains query
    else if (name.includes(q)) {
      score += 250;
    } else {
      continue;
    }

    // Add passenger hub category weight
    const catBonus = CATEGORY_SCORES[item.category || ''] || 0;
    score += catBonus;

    matches.push({ item, score });
  }

  // Sort by score descending; break ties alphabetically by name
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.stationName.localeCompare(b.item.stationName);
  });

  return matches.slice(0, limit).map((m) => m.item);
}

/**
 * Searches all 10,768 trains locally with instant relevance ranking.
 * If query is empty, returns all trains sorted alphabetically (A to Z).
 */
export function searchTrainsFast(query?: string, limit = 100): TrainSearchItem[] {
  const q = (query || '').trim().toLowerCase();

  // Empty query -> Return alphabetical A-Z list of all 10,768 trains
  if (!q) {
    return ALL_TRAINS.slice(0, limit);
  }

  const matches: Array<{ item: TrainSearchItem; score: number }> = [];

  for (const item of ALL_TRAINS) {
    const num = item.trainNumber.toLowerCase();
    const name = item.trainName.toLowerCase();
    let score = 0;

    // 1. Exact match on train number
    if (num === q) {
      score += 2500;
    }
    // 2. Train number starts with query (e.g. typing '127' -> 12760, 12724, 12708)
    else if (num.startsWith(q)) {
      score += 1800 - (num.length - q.length) * 10;
    }
    // 3. Exact match on train name
    else if (name === q) {
      score += 1500;
    }
    // 4. Train name starts with query (e.g. typing 'char' -> Charminar Express)
    else if (name.startsWith(q)) {
      score += 1200;
    }
    // 5. Word in train name starts with query (e.g. typing 'express' or 'sf')
    else if (name.includes(' ' + q) || name.includes('-' + q)) {
      score += 700;
    }
    // 6. Train number contains query
    else if (num.includes(q)) {
      score += 500;
    }
    // 7. Train name contains query anywhere
    else if (name.includes(q)) {
      score += 300;
    } else {
      continue;
    }

    matches.push({ item, score });
  }

  // Sort by score descending; break ties alphabetically by train name
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.trainName.localeCompare(b.item.trainName);
  });

  return matches.slice(0, limit).map((m) => m.item);
}
