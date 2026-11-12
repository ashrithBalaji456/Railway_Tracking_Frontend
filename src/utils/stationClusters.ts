// Station clusters for Indian Railway major city / twin-station hubs
// Enables "Search nearby stations" (All Stations) feature

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

/**
 * Returns list of station codes in the cluster for the given station code.
 * If no cluster is known, returns just [stationCode].
 */
export function getStationCluster(stationCode?: string): string[] {
  if (!stationCode) return [];
  const upper = stationCode.trim().toUpperCase();
  return STATION_CLUSTERS[upper]?.stations || [upper];
}

/**
 * Returns the cluster city name if known.
 */
export function getClusterCityName(stationCode?: string): string | null {
  if (!stationCode) return null;
  const upper = stationCode.trim().toUpperCase();
  return STATION_CLUSTERS[upper]?.city || null;
}

