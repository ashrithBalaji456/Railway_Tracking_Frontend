// Fast local station search and alphabetical directory helper
// Built over 10,794 Indian Railway stations with instant (<3ms) relevance scoring

import allStationsMeta from '../data/allStationsMeta.json';

export interface StationSearchItem {
  stationCode: string;
  stationName: string;
  state?: string;
  zone?: string;
  category?: string;
  district?: string;
}

const metaMap = (allStationsMeta as unknown) as Record<string, [string, string, string, string, string]>;

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

// All 10,794 stations pre-indexed for fast search
export const ALL_STATIONS: StationSearchItem[] = Object.entries(metaMap).map(([code, meta]) => {
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
});

// Major stations (NSG1-NSG4 + SG1) sorted strictly Alphabetically (A to Z)
export const ALPHABETICAL_MAJOR_STATIONS: StationSearchItem[] = ALL_STATIONS
  .filter((s) => ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'SG1'].includes(s.category || ''))
  .sort((a, b) => a.stationName.localeCompare(b.stationName));

/**
 * Searches stations locally with instant relevance ranking.
 * If query is empty, returns the major stations sorted alphabetically (A to Z).
 */
export function searchStationsFast(query?: string, limit = 40): StationSearchItem[] {
  const q = (query || '').trim().toLowerCase();

  // Empty query -> Return alphabetical major stations
  if (!q) {
    return ALPHABETICAL_MAJOR_STATIONS.slice(0, limit);
  }

  const matches: Array<{ item: StationSearchItem; score: number }> = [];

  for (const item of ALL_STATIONS) {
    const code = item.stationCode.toLowerCase();
    const name = item.stationName.toLowerCase();
    let score = 0;

    // 1. Exact match on station code (Highest priority)
    if (code === q) {
      score += 1500;
    }
    // 2. Exact match on station name
    else if (name === q) {
      score += 1200;
    }
    // 3. Station code starts with query (e.g. typing 'MC' -> MCI)
    else if (code.startsWith(q)) {
      score += 900 - (code.length - q.length) * 10;
    }
    // 4. Station name starts with query (e.g. typing 'manch' -> Manchiryal)
    else if (name.startsWith(q)) {
      score += 800;
    }
    // 5. Station code contains query
    else if (code.includes(q)) {
      score += 400;
    }
    // 6. Station name contains query as a distinct word
    else if (name.includes(' ' + q)) {
      score += 350;
    }
    // 7. Station name contains query
    else if (name.includes(q)) {
      score += 200;
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

// Curated prominent trains across India sorted alphabetically (A to Z)
export interface PopularTrainItem {
  trainNumber: string;
  trainName: string;
  trainType: string;
  sourceStation?: string;
  destinationStation?: string;
}

export const ALPHABETICAL_POPULAR_TRAINS: PopularTrainItem[] = [
  { trainNumber: '12708', trainName: 'Andhra Pradesh Sampark Kranti Express', trainType: 'Superfast', sourceStation: 'NZM', destinationStation: 'KCG' },
  { trainNumber: '12724', trainName: 'Telangana Express', trainType: 'Superfast', sourceStation: 'NDLS', destinationStation: 'HYB' },
  { trainNumber: '12760', trainName: 'Charminar Express', trainType: 'Superfast', sourceStation: 'HYB', destinationStation: 'TBM' },
  { trainNumber: '12722', trainName: 'Dakshin Superfast Express', trainType: 'Superfast', sourceStation: 'NZM', destinationStation: 'SC' },
  { trainNumber: '12842', trainName: 'Coromandel Express', trainType: 'Superfast', sourceStation: 'HWH', destinationStation: 'MAS' },
  { trainNumber: '12124', trainName: 'Deccan Queen', trainType: 'Superfast', sourceStation: 'PUNE', destinationStation: 'CSMT' },
  { trainNumber: '12285', trainName: 'Secunderabad - Hazrat Nizamuddin Duronto', trainType: 'Duronto', sourceStation: 'SC', destinationStation: 'NZM' },
  { trainNumber: '12704', trainName: 'Falaknuma Express', trainType: 'Superfast', sourceStation: 'SC', destinationStation: 'HWH' },
  { trainNumber: '12727', trainName: 'Godavari Superfast Express', trainType: 'Superfast', sourceStation: 'VSKP', destinationStation: 'HYB' },
  { trainNumber: '12616', trainName: 'Grand Trunk Express', trainType: 'Superfast', sourceStation: 'NDLS', destinationStation: 'MAS' },
  { trainNumber: '12810', trainName: 'Howrah Mail', trainType: 'Mail', sourceStation: 'CSMT', destinationStation: 'HWH' },
  { trainNumber: '12628', trainName: 'Karnataka Express', trainType: 'Superfast', sourceStation: 'NDLS', destinationStation: 'SBC' },
  { trainNumber: '12626', trainName: 'Kerala Express', trainType: 'Superfast', sourceStation: 'NDLS', destinationStation: 'TVC' },
  { trainNumber: '11020', trainName: 'Konark Express', trainType: 'Express', sourceStation: 'BBS', destinationStation: 'CSMT' },
  { trainNumber: '12618', trainName: 'Mangala Lakshadweep Express', trainType: 'Superfast', sourceStation: 'NZM', destinationStation: 'ERS' },
  { trainNumber: '20101', trainName: 'Nagpur - Secunderabad Vande Bharat Express', trainType: 'Vande Bharat', sourceStation: 'NGP', destinationStation: 'SC' },
  { trainNumber: '20833', trainName: 'Visakhapatnam - Secunderabad Vande Bharat Express', trainType: 'Vande Bharat', sourceStation: 'VSKP', destinationStation: 'SC' },
  { trainNumber: '12431', trainName: 'Trivandrum Rajdhani Express', trainType: 'Rajdhani', sourceStation: 'TVC', destinationStation: 'NZM' },
  { trainNumber: '12951', trainName: 'Mumbai Tejas Rajdhani Express', trainType: 'Rajdhani', sourceStation: 'MMCT', destinationStation: 'NDLS' },
  { trainNumber: '20608', trainName: 'Mysuru - Chennai Central Vande Bharat Express', trainType: 'Vande Bharat', sourceStation: 'MYS', destinationStation: 'MAS' },
  { trainNumber: '17234', trainName: 'Bhagyanagar Express', trainType: 'Express', sourceStation: 'BPQ', destinationStation: 'SC' },
  { trainNumber: '12758', trainName: 'Kaghaznagar Superfast Express', trainType: 'Superfast', sourceStation: 'SKZR', destinationStation: 'SC' },
  { trainNumber: '12792', trainName: 'Secunderabad Superfast Express', trainType: 'Superfast', sourceStation: 'DNR', destinationStation: 'SC' },
  { trainNumber: '17012', trainName: 'Bidar Intercity Express', trainType: 'Express', sourceStation: 'SKZR', destinationStation: 'BIDR' },
  { trainNumber: '12763', trainName: 'Padmavathi Superfast Express', trainType: 'Superfast', sourceStation: 'TPTY', destinationStation: 'SC' },
  { trainNumber: '17406', trainName: 'Krishna Express', trainType: 'Express', sourceStation: 'ADB', destinationStation: 'TPTY' },
  { trainNumber: '17202', trainName: 'Golconda Express', trainType: 'Express', sourceStation: 'SC', destinationStation: 'GNT' },
  { trainNumber: '12714', trainName: 'Satavahana Superfast Express', trainType: 'Superfast', sourceStation: 'BZA', destinationStation: 'SC' },
  { trainNumber: '12622', trainName: 'Tamil Nadu Express', trainType: 'Superfast', sourceStation: 'NDLS', destinationStation: 'MAS' },
  { trainNumber: '12780', trainName: 'Goa Express', trainType: 'Superfast', sourceStation: 'NZM', destinationStation: 'VSG' },
].sort((a, b) => a.trainName.localeCompare(b.trainName));
