/**
 * Utility functions for Indian Railway station code-to-name lookup and formatting.
 * Ensures users always see human-readable station names instead of cryptic codes (e.g., 'SC -> R').
 */

export const STATION_NAMES: Record<string, string> = {
  // South Central Railway (SCR) & Telangana / Andhra Pradesh
  SC: 'Secunderabad Jn',
  HYB: 'Hyderabad Deccan',
  KCG: 'Kacheguda',
  LPI: 'Lingampalli',
  BZA: 'Vijayawada Jn',
  VSKP: 'Visakhapatnam Jn',
  COA: 'Kakinada Port',
  CCT: 'Kakinada Town',
  RJY: 'Rajahmundry',
  SLO: 'Samalkot Jn',
  EE: 'Eluru',
  TDD: 'Tadepalligudem',
  GNT: 'Guntur Jn',
  OGL: 'Ongole',
  NLR: 'Nellore',
  GDR: 'Gudur Jn',
  RU: 'Renigunta Jn',
  TPTY: 'Tirupati',
  KZJ: 'Kazipet Jn',
  WL: 'Warangal',
  MABD: 'Mahbubabad',
  KMT: 'Khammam',
  MDR: 'Madhira',
  SKZR: 'Sirpur Kaghaznagar',
  BPA: 'Bellampalli',
  RDM: 'Ramagundam',
  PDPL: 'Peddapalli Jn',
  MCI: 'Manchiryal',
  JMKT: 'Jammikunta',
  NZB: 'Nizamabad Jn',
  KMC: 'Kamareddi',
  MED: 'Medchal',
  MJF: 'Malkajgiri',
  CHZ: 'Charlapalli',
  SNF: 'Sanatnagar',
  HFZ: 'Hafizpet',
  VKB: 'Vikarabad Jn',
  TDU: 'Tandur',
  SEM: 'Sedam',
  WADI: 'Wadi Jn',
  RC: 'Raichur',
  MALM: 'Mantralayam Road',
  AD: 'Adoni',
  GTL: 'Guntakal Jn',
  DHNE: 'Dhone Jn',
  KRNT: 'Kurnool City',
  MBNR: 'Mahbubnagar',
  SHNR: 'Shadnagar',
  JCL: 'Jadcherla',
  NDKD: 'Nadikude Jn',
  MRGA: 'Miryalaguda',
  NLDA: 'Nalgonda',
  PGDP: 'Pagidipalli Jn',

  // South Eastern Central (SECR) & Central Railway (CR)
  R: 'Raipur Jn',
  DURG: 'Durg Jn',
  BSP: 'Bilaspur Jn',
  BYT: 'Bhatapara',
  TLD: 'Tilda Neora',
  G: 'Gondia Jn',
  TMR: 'Tumsar Road',
  BRD: 'Bhandara Road',
  NGP: 'Nagpur Jn',
  WR: 'Wardha Jn',
  BD: 'Badnera Jn',
  AK: 'Akola Jn',
  SEG: 'Shegaon',
  MKU: 'Malkapur',
  BSL: 'Bhusaval Jn',
  JL: 'Jalgaon Jn',
  CSN: 'Chalisgaon Jn',
  MMR: 'Manmad Jn',
  NK: 'Nashik Road',
  IGP: 'Igatpuri',
  KYN: 'Kalyan Jn',
  TNA: 'Thane',
  DR: 'Dadar',
  CSMT: 'Mumbai CSMT',
  CSTM: 'Mumbai CSMT',
  MMCT: 'Mumbai Central',
  BDTS: 'Bandra Terminus',
  LTT: 'Lokmanya Tilak Terminus',
  PNVL: 'Panvel',
  PUNE: 'Pune Jn',
  DD: 'Daund Jn',
  KWV: 'Kurduvadi Jn',
  SUR: 'Solapur',
  KLBG: 'Kalaburagi',
  BPQ: 'Balharshah',
  CD: 'Chandrapur',
  SEGM: 'Sewagram',

  // Northern & North Central (NR / NCR)
  NDLS: 'New Delhi',
  DLI: 'Old Delhi',
  NZM: 'Hazrat Nizamuddin',
  ANVT: 'Anand Vihar Terminal',
  GZB: 'Ghaziabad',
  MB: 'Moradabad',
  BE: 'Bareilly',
  SPN: 'Shahjahanpur',
  LKO: 'Lucknow Charbagh',
  CNB: 'Kanpur Central',
  FTP: 'Fatehpur',
  PRYJ: 'Prayagraj Jn',
  ALD: 'Prayagraj Jn',
  MZP: 'Mirzapur',
  DDU: 'Pt DD Upadhyaya Jn',
  MGS: 'Pt DD Upadhyaya Jn',
  BSB: 'Varanasi Jn',
  AGC: 'Agra Cantt',
  AF: 'Agra Fort',
  MTJ: 'Mathura Jn',
  FDB: 'Faridabad',
  GWL: 'Gwalior Jn',
  JHS: 'V Lakshmibai Jhansi',
  BPL: 'Bhopal Jn',
  RKMP: 'Rani Kamlapati',
  ET: 'Itarsi Jn',
  JBP: 'Jabalpur',
  STA: 'Satna',
  KTE: 'Katni Jn',

  // Eastern & North Eastern (ER / ECR / NER / NFR)
  HWH: 'Howrah Jn',
  SDAH: 'Sealdah',
  KOAA: 'Kolkata',
  SHM: 'Shalimar',
  ASN: 'Asansol Jn',
  BWN: 'Barddhaman Jn',
  DGR: 'Durgapur',
  DHN: 'Dhanbad Jn',
  PNBE: 'Patna Jn',
  DNR: 'Danapur',
  PPTA: 'Patliputra Jn',
  GAYA: 'Gaya Jn',
  KQR: 'Koderma Jn',
  GMO: 'Netaji SC Bose Gomoh',
  RNC: 'Ranchi',
  HTE: 'Hatia',
  TATA: 'Tatanagar Jn',
  CKP: 'Chakradharpur',
  ROU: 'Rourkela',
  JSG: 'Jharsuguda Jn',
  PURI: 'Puri',
  BBS: 'Bhubaneswar',
  CTC: 'Cuttack',
  BAM: 'Brahmapur',
  GKP: 'Gorakhpur Jn',
  CPR: 'Chhapra Jn',
  MFP: 'Muzaffarpur Jn',
  SPJ: 'Samastipur Jn',
  DBG: 'Darbhanga Jn',
  NJP: 'New Jalpaiguri',
  GHY: 'Guwahati',
  KYQ: 'Kamakhya Jn',
  DBRG: 'Dibrugarh',

  // Southern & South Western (SR / SWR)
  MAS: 'Chennai Central',
  MS: 'Chennai Egmore',
  TBM: 'Tambaram',
  CGL: 'Chengalpattu',
  AJJ: 'Arakkonam Jn',
  KPD: 'Katpadi Jn',
  JTJ: 'Jolarpettai Jn',
  SA: 'Salem Jn',
  ED: 'Erode Jn',
  TUP: 'Tiruppur',
  CBE: 'Coimbatore Jn',
  PGT: 'Palakkad Jn',
  TCR: 'Thrissur',
  AWY: 'Aluva',
  ERN: 'Ernakulam Town',
  ERS: 'Ernakulam Jn',
  ALLP: 'Alappuzha',
  KTYM: 'Kottayam',
  QLN: 'Kollam Jn',
  TVC: 'Thiruvananthapuram Central',
  NCJ: 'Nagercoil Jn',
  CAPE: 'Kanniyakumari',
  TPJ: 'Tiruchchirappalli Jn',
  MDU: 'Madurai Jn',
  TEN: 'Tirunelveli Jn',
  SBC: 'KSR Bengaluru',
  YPR: 'Yesvantpur Jn',
  SMVB: 'SMVT Bengaluru',
  BWT: 'Bangarapet',
  MYS: 'Mysuru Jn',
  UBL: 'SSS Hubballi Jn',
  DWR: 'Dharwad',
  BGM: 'Belagavi',
  BAY: 'Ballari Jn',
  HPT: 'Hosapete Jn',
  MRJ: 'Miraj Jn',
  KOP: 'Kolhapur CSMT',
  MAO: 'Madgaon Jn',
  MAQ: 'Mangaluru Central',
  MAJN: 'Mangaluru Jn',
  CAN: 'Kannur',
  CLT: 'Kozhikode',

  // Western & North Western (WR / NWR)
  ADI: 'Ahmedabad Jn',
  BRC: 'Vadodara Jn',
  ANND: 'Anand Jn',
  ND: 'Nadiad Jn',
  ST: 'Surat',
  BH: 'Bharuch Jn',
  BL: 'Valsad',
  VAPI: 'Vapi',
  RTM: 'Ratlam Jn',
  UJN: 'Ujjain Jn',
  INDB: 'Indore Jn',
  KOTA: 'Kota Jn',
  SWM: 'Sawai Madhopur',
  JP: 'Jaipur Jn',
  AII: 'Ajmer Jn',
  ABR: 'Abu Road',
  PNU: 'Palanpur Jn',
  MSH: 'Mahesana Jn',
  JU: 'Jodhpur Jn',
  BKN: 'Bikaner Jn',
  UDZ: 'Udaipur City',
  ASR: 'Amritsar Jn',
  JAT: 'Jammu Tawi',
  SVDK: 'SMVD Katra',
  CDG: 'Chandigarh',
  UMB: 'Ambala Cantt',
  LDH: 'Ludhiana Jn'
};

/**
 * Returns a human-friendly station display string.
 * Examples:
 *   "SC" -> "Secunderabad Jn (SC)"
 *   "R" -> "Raipur Jn (R)"
 *   "COA -> LPI" -> "Kakinada Port (COA) → Lingampalli (LPI)"
 *   "Secunderabad Jn (SC)" -> "Secunderabad Jn (SC)"
 */
export function getStationDisplayName(codeOrName?: string | null): string {
  if (!codeOrName || !codeOrName.trim()) return '';
  const clean = codeOrName.trim();

  // If already contains parenthesis with station code e.g. "Secunderabad Jn (SC)"
  if (/\([A-Za-z0-9]{1,6}\)$/i.test(clean)) {
    return clean;
  }

  // Handle route strings like "SC → R" or "SC -> R"
  if (clean.includes('→') || clean.includes('->')) {
    const separator = clean.includes('→') ? '→' : '->';
    const parts = clean.split(separator);
    return parts.map((p) => getStationDisplayName(p.trim())).join(' → ');
  }

  const upper = clean.toUpperCase();
  if (STATION_NAMES[upper]) {
    return `${STATION_NAMES[upper]} (${upper})`;
  }

  // If already a multi-word or full station name
  if (clean.length > 5 || clean.includes(' ')) {
    return clean;
  }

  // If it's a short 1-5 character station code not in the dictionary, return it uppercase
  return upper;
}

/**
 * Formats source and destination into a clean subtitle:
 * "Secunderabad Jn (SC) → Raipur Jn (R)"
 */
export function formatRouteSubtitle(source?: string | null, destination?: string | null): string {
  if (!source && !destination) return '';
  if (!source) return getStationDisplayName(destination);
  if (!destination) return getStationDisplayName(source);
  return `${getStationDisplayName(source)} → ${getStationDisplayName(destination)}`;
}

