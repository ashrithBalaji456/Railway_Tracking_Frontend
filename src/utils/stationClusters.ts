// Station clusters for Indian Railway major city / twin-station hubs
// Enables "Search nearby stations" (All Stations) feature with dynamic GPS radius discovery

import stationCoordinates from '../data/stationCoordinates.json';
import allStationsMeta from '../data/allStationsMeta.json';

const coordsMap = stationCoordinates as Record<string, [number, number]>;
const metaMap = allStationsMeta as Record<string, [string, string, string, string, string]>;

// Official Indian Railways PRS City Cluster Hubs
export const STATION_CLUSTERS: Record<string, { city: string; stations: string[] }> = {
  // Warangal / Kazipet
  WL: { city: 'Warangal', stations: ['WL', 'KZJ'] },
  KZJ: { city: 'Warangal', stations: ['WL', 'KZJ'] },

  // Tirupati / Renigunta
  TPTY: { city: 'Tirupati', stations: ['TPTY', 'RU'] },
  RU: { city: 'Tirupati', stations: ['TPTY', 'RU'] },

  // Hyderabad / Secunderabad
  SC: { city: 'Hyderabad', stations: ['SC', 'HYB', 'KCG', 'LPI', 'CHZ'] },
  HYB: { city: 'Hyderabad', stations: ['SC', 'HYB', 'KCG', 'LPI', 'CHZ'] },
  KCG: { city: 'Hyderabad', stations: ['SC', 'HYB', 'KCG', 'LPI', 'CHZ'] },
  LPI: { city: 'Hyderabad', stations: ['SC', 'HYB', 'KCG', 'LPI', 'CHZ'] },
  CHZ: { city: 'Hyderabad', stations: ['SC', 'HYB', 'KCG', 'LPI', 'CHZ'] },

  // Delhi NCR
  NDLS: { city: 'Delhi', stations: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'GZB'] },
  DLI: { city: 'Delhi', stations: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'GZB'] },
  NZM: { city: 'Delhi', stations: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'GZB'] },
  ANVT: { city: 'Delhi', stations: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'GZB'] },
  DEC: { city: 'Delhi', stations: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'GZB'] },
  GZB: { city: 'Delhi', stations: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'GZB'] },

  // Mumbai
  CSMT: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  MMCT: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  BDTS: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  BVI: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  LTT: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  DR: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  KYN: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },
  TNA: { city: 'Mumbai', stations: ['CSMT', 'MMCT', 'BDTS', 'BVI', 'LTT', 'DR', 'KYN', 'TNA'] },

  // Kolkata
  HWH: { city: 'Kolkata', stations: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'] },
  SDAH: { city: 'Kolkata', stations: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'] },
  KOAA: { city: 'Kolkata', stations: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'] },
  SHM: { city: 'Kolkata', stations: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'] },
  SRC: { city: 'Kolkata', stations: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'] },

  // Chennai
  MAS: { city: 'Chennai', stations: ['MAS', 'MS', 'PER', 'TBM'] },
  MS: { city: 'Chennai', stations: ['MAS', 'MS', 'PER', 'TBM'] },
  PER: { city: 'Chennai', stations: ['MAS', 'MS', 'PER', 'TBM'] },
  TBM: { city: 'Chennai', stations: ['MAS', 'MS', 'PER', 'TBM'] },

  // Bengaluru
  SBC: { city: 'Bengaluru', stations: ['SBC', 'YPR', 'SMVB', 'BNC', 'KJM'] },
  YPR: { city: 'Bengaluru', stations: ['SBC', 'YPR', 'SMVB', 'BNC', 'KJM'] },
  SMVB: { city: 'Bengaluru', stations: ['SBC', 'YPR', 'SMVB', 'BNC', 'KJM'] },
  BNC: { city: 'Bengaluru', stations: ['SBC', 'YPR', 'SMVB', 'BNC', 'KJM'] },
  KJM: { city: 'Bengaluru', stations: ['SBC', 'YPR', 'SMVB', 'BNC', 'KJM'] },

  // Ahmedabad
  ADI: { city: 'Ahmedabad', stations: ['ADI', 'SBT', 'CLDY', 'MAN'] },
  SBT: { city: 'Ahmedabad', stations: ['ADI', 'SBT', 'CLDY', 'MAN'] },
  CLDY: { city: 'Ahmedabad', stations: ['ADI', 'SBT', 'CLDY', 'MAN'] },
  MAN: { city: 'Ahmedabad', stations: ['ADI', 'SBT', 'CLDY', 'MAN'] },

  // Pune
  PUNE: { city: 'Pune', stations: ['PUNE', 'SVJR', 'CCH', 'PMP'] },
  SVJR: { city: 'Pune', stations: ['PUNE', 'SVJR', 'CCH', 'PMP'] },
  CCH: { city: 'Pune', stations: ['PUNE', 'SVJR', 'CCH', 'PMP'] },
  PMP: { city: 'Pune', stations: ['PUNE', 'SVJR', 'CCH', 'PMP'] },

  // Vijayawada
  BZA: { city: 'Vijayawada', stations: ['BZA', 'RYP'] },
  RYP: { city: 'Vijayawada', stations: ['BZA', 'RYP'] },

  // Visakhapatnam
  VSKP: { city: 'Visakhapatnam', stations: ['VSKP', 'DVD'] },
  DVD: { city: 'Visakhapatnam', stations: ['VSKP', 'DVD'] },

  // Bhopal
  BPL: { city: 'Bhopal', stations: ['BPL', 'RKMP'] },
  RKMP: { city: 'Bhopal', stations: ['BPL', 'RKMP'] },

  // Jaipur
  JP: { city: 'Jaipur', stations: ['JP', 'GADJ', 'DKBJ'] },
  GADJ: { city: 'Jaipur', stations: ['JP', 'GADJ', 'DKBJ'] },
  DKBJ: { city: 'Jaipur', stations: ['JP', 'GADJ', 'DKBJ'] },

  // Patna
  PNBE: { city: 'Patna', stations: ['PNBE', 'PPTA', 'DNR', 'RJPB'] },
  PPTA: { city: 'Patna', stations: ['PNBE', 'PPTA', 'DNR', 'RJPB'] },
  DNR: { city: 'Patna', stations: ['PNBE', 'PPTA', 'DNR', 'RJPB'] },
  RJPB: { city: 'Patna', stations: ['PNBE', 'PPTA', 'DNR', 'RJPB'] },

  // Varanasi
  BSB: { city: 'Varanasi', stations: ['BSB', 'BSBS', 'DDU'] },
  BSBS: { city: 'Varanasi', stations: ['BSB', 'BSBS', 'DDU'] },
  DDU: { city: 'Varanasi', stations: ['BSB', 'BSBS', 'DDU'] },

  // Lucknow
  LKO: { city: 'Lucknow', stations: ['LKO', 'LJN', 'ASH', 'BNZ'] },
  LJN: { city: 'Lucknow', stations: ['LKO', 'LJN', 'ASH', 'BNZ'] },
  ASH: { city: 'Lucknow', stations: ['LKO', 'LJN', 'ASH', 'BNZ'] },
  BNZ: { city: 'Lucknow', stations: ['LKO', 'LJN', 'ASH', 'BNZ'] },

  // Coimbatore
  CBE: { city: 'Coimbatore', stations: ['CBE', 'CBF', 'PTJ'] },
  CBF: { city: 'Coimbatore', stations: ['CBE', 'CBF', 'PTJ'] },
  PTJ: { city: 'Coimbatore', stations: ['CBE', 'CBF', 'PTJ'] },

  // Kochi / Ernakulam
  ERS: { city: 'Kochi', stations: ['ERS', 'ERN', 'AWY'] },
  ERN: { city: 'Kochi', stations: ['ERS', 'ERN', 'AWY'] },
  AWY: { city: 'Kochi', stations: ['ERS', 'ERN', 'AWY'] },

  // Thiruvananthapuram
  TVC: { city: 'Thiruvananthapuram', stations: ['TVC', 'KCVL'] },
  KCVL: { city: 'Thiruvananthapuram', stations: ['TVC', 'KCVL'] },

  // Bhubaneswar / Cuttack
  BBS: { city: 'Bhubaneswar', stations: ['BBS', 'BBSN', 'CTC'] },
  BBSN: { city: 'Bhubaneswar', stations: ['BBS', 'BBSN', 'CTC'] },
  CTC: { city: 'Bhubaneswar', stations: ['BBS', 'BBSN', 'CTC'] },

  // Guwahati
  GHY: { city: 'Guwahati', stations: ['GHY', 'KYQ'] },
  KYQ: { city: 'Guwahati', stations: ['GHY', 'KYQ'] },
};

// Station importance ranking for nearby station selection
const CATEGORY_WEIGHTS: Record<string, number> = {
  NSG1: 1,
  NSG2: 2,
  NSG3: 3,
  NSG4: 4,
  NSG5: 5,
  NSG6: 6,
  SG1: 7,
  SG2: 8,
  SG3: 9,
  HG1: 10,
  HG2: 11,
  HG3: 12,
};

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns list of station codes in the cluster for the given station code.
 * Dynamically resolves passenger stations within maxRadiusKm (default 30 km)
 * using GPS coordinates, while also incorporating official PRS city clusters.
 * The primary searched station is ALWAYS first in the returned array.
 */
export function getStationCluster(stationCode?: string, maxRadiusKm = 30): string[] {
  if (!stationCode) return [];
  const upper = stationCode.trim().toUpperCase();

  const result = new Set<string>();
  result.add(upper);

  // 1. Add predefined official PRS cluster stations if available
  const predefined = STATION_CLUSTERS[upper]?.stations;
  if (predefined) {
    for (const s of predefined) {
      result.add(s);
    }
  }

  // 2. Dynamic geospatial discovery (<= maxRadiusKm)
  const originCoords = coordsMap[upper];
  if (originCoords && originCoords.length === 2) {
    const [lat1, lon1] = originCoords;
    const nearbyCandidates: Array<{ code: string; distance: number; weight: number }> = [];

    for (const [candCode, coords] of Object.entries(coordsMap)) {
      if (candCode === upper || result.has(candCode)) continue;
      const [lat2, lon2] = coords;

      // Fast bounding box pre-filter (~0.35 deg ~= 38 km)
      if (Math.abs(lat1 - lat2) > 0.35 || Math.abs(lon1 - lon2) > 0.35) {
        continue;
      }

      const dist = haversineDistanceKm(lat1, lon1, lat2, lon2);
      if (dist <= maxRadiusKm) {
        const meta = metaMap[candCode];
        // Only include recognized passenger stations
        if (!meta) continue;
        const cat = meta[3] || 'UNKNOWN';
        const weight = CATEGORY_WEIGHTS[cat] ?? 15;
        nearbyCandidates.push({ code: candCode, distance: dist, weight });
      }
    }

    // Sort: prioritize major passenger stations (NSG1-NSG4) and closer distance
    nearbyCandidates.sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.distance - b.distance;
    });

    // Add top nearby stations (limit to 3-4 so queries stay fast and relevant)
    for (const c of nearbyCandidates.slice(0, 4)) {
      result.add(c.code);
    }
  }

  return Array.from(result);
}

/**
 * Returns the cluster city or district name if known.
 */
export function getClusterCityName(stationCode?: string): string | null {
  if (!stationCode) return null;
  const upper = stationCode.trim().toUpperCase();
  if (STATION_CLUSTERS[upper]?.city) {
    return STATION_CLUSTERS[upper].city;
  }
  const meta = metaMap[upper];
  if (meta) {
    // meta format: [name, state, zone, category, district]
    return meta[4] || meta[0] || null;
  }
  return null;
}

/**
 * Checks whether a connecting route via `transferCode` is backtracking
 * (i.e. moving in the opposite direction, further away from destination than origin).
 */
export function isBacktrackingRoute(srcCode?: string, transferCode?: string, dstCode?: string): boolean {
  if (!srcCode || !transferCode || !dstCode) return false;
  const s = srcCode.trim().toUpperCase();
  const t = transferCode.trim().toUpperCase();
  const d = dstCode.trim().toUpperCase();

  const sCoords = coordsMap[s];
  const tCoords = coordsMap[t];
  const dCoords = coordsMap[d];

  if (!sCoords || !tCoords || !dCoords) return false;

  const distSrcDst = haversineDistanceKm(sCoords[0], sCoords[1], dCoords[0], dCoords[1]);
  const distTransDst = haversineDistanceKm(tCoords[0], tCoords[1], dCoords[0], dCoords[1]);

  // If transfer station is further from destination than origin by more than 30 km,
  // the journey is backtracking (traveling backwards away from destination).
  return distTransDst > distSrcDst + 30.0;
}
