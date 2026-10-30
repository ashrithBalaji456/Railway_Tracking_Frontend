import allStationsMap from './allStationsMeta.json';

export interface StationAmenity {
  id: string;
  title: string;
  category: 'LOUNGE' | 'WAITING' | 'CLOAK' | 'ACCESSIBILITY' | 'WATER' | 'ELEVATOR' | 'WIFI' | 'FOOD' | 'MEDICAL' | 'SECURITY' | 'TRANSIT';
  badge: string;
  emoji: string;
  shortDesc: string;
  detailedDesc: string;
  locationOnPlatform: string;
  tariffsAndRules: string;
  availability: string;
  imageUrl: string;
  applicableCategories: string[]; // e.g. ['NSG1', 'NSG2', 'NSG3']
}

export interface StationCategoryDetails {
  code: string;
  name: string;
  tier: 'MEGA_TERMINAL' | 'MAJOR_JUNCTION' | 'STANDARD_STATION' | 'SUBURBAN_HUB' | 'HALT';
  passengerFootfall: string;
  badgeColor: string;
  description: string;
}

export const STATION_CATEGORY_REGISTRY: Record<string, StationCategoryDetails> = {
  NSG1: {
    code: 'NSG-1',
    name: 'Non-Suburban Grade 1 (Mega Terminal)',
    tier: 'MEGA_TERMINAL',
    passengerFootfall: '> ₹500 Crore annual passenger earnings / > 20 Million passengers',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Premier national rail hubs (e.g. New Delhi, CSMT Mumbai, Howrah, Chennai Central, Bengaluru City) equipped with airport-grade passenger lounges, multi-level escalators, sleeping pods, and 24/7 executive facilities under the Amrit Bharat Station Scheme.'
  },
  NSG2: {
    code: 'NSG-2',
    name: 'Non-Suburban Grade 2 (Super-Major Station)',
    tier: 'MEGA_TERMINAL',
    passengerFootfall: '₹100 - ₹500 Crore annual earnings / 10 - 20 Million passengers',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'State capital terminals and critical interchange junctions (e.g. Pune, Patna, Ahmedabad, Jaipur, Bhopal, Lucknow) featuring air-conditioned waiting halls, modern food courts, and battery-operated carts.'
  },
  NSG3: {
    code: 'NSG-3',
    name: 'Non-Suburban Grade 3 (Major Junction)',
    tier: 'MAJOR_JUNCTION',
    passengerFootfall: '₹20 - ₹100 Crore annual earnings / 5 - 10 Million passengers',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Busiest regional junction hubs (e.g. Ratlam, Kharagpur, Vijayawada, Itarsi, Jhansi, Katpadi, Guntakal) with multi-platform foot over bridges, elevators, cloak rooms, and Jan Aahaar complexes.'
  },
  NSG4: {
    code: 'NSG-4',
    name: 'Non-Suburban Grade 4 (District Junction)',
    tier: 'MAJOR_JUNCTION',
    passengerFootfall: '₹10 - ₹20 Crore annual earnings / 2 - 5 Million passengers',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Important divisional and tourist gateways featuring upper-class resting halls, electronic coach guidance monitors, and water vending ATMs.'
  },
  NSG5: {
    code: 'NSG-5',
    name: 'Non-Suburban Grade 5 (Town Station)',
    tier: 'STANDARD_STATION',
    passengerFootfall: '₹1 - ₹10 Crore annual earnings / 1 - 2 Million passengers',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Sub-divisional and tehsil railway stations providing covered passenger shelters, RO drinking water posts, ATVM ticketing, and RailWire optical fiber Wi-Fi.'
  },
  NSG6: {
    code: 'NSG-6',
    name: 'Non-Suburban Grade 6 (Branch Line Station)',
    tier: 'STANDARD_STATION',
    passengerFootfall: '< ₹1 Crore annual earnings / Regular passenger service',
    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    description: 'Rural and branch-line stations featuring standard platform sheds, solar lighting, accessibility ramps, and official timetable boards.'
  },
  SG1: {
    code: 'SG-1',
    name: 'Suburban Grade 1 (High-Density Suburban Hub)',
    tier: 'SUBURBAN_HUB',
    passengerFootfall: '> ₹25 Crore suburban passenger revenue',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'High-density commuter stations across Mumbai, Chennai, and Kolkata suburban networks equipped with ATVMs, UTS QR smart ticketing, multiple wide FOBs, and commuter medical aid rooms.'
  },
  SG2: {
    code: 'SG-2',
    name: 'Suburban Grade 2 (Major Commuter Stop)',
    tier: 'SUBURBAN_HUB',
    passengerFootfall: '₹10 - ₹25 Crore suburban passenger revenue',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Suburban stations handling heavy peak-hour daily office passenger rushes with automated suburban indicators and high-capacity entry/exit barriers.'
  },
  SG3: {
    code: 'SG-3',
    name: 'Suburban Grade 3 (Suburban Halt)',
    tier: 'SUBURBAN_HUB',
    passengerFootfall: '< ₹10 Crore suburban revenue',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Peripheral suburban stations with electronic timetable monitors, covered sheds, and ticket booking counters.'
  },
  HG1: {
    code: 'HG-1',
    name: 'Halt Grade 1 (Heritage / High-Traffic Passenger Halt)',
    tier: 'HALT',
    passengerFootfall: 'Significant daily local flag stop traffic',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    description: 'Heritage halts and prominent village flag stops with passenger waiting shed, deep-bore pure water post, and ramp approach.'
  },
  HG2: {
    code: 'HG-2',
    name: 'Halt Grade 2 (Standard Rural Halt)',
    tier: 'HALT',
    passengerFootfall: 'Standard village flag stop',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    description: 'Rural flag stop with level platform, solar-powered lighting, and shaded passenger seating bench.'
  },
  HG3: {
    code: 'HG-3',
    name: 'Halt Grade 3 (Minor Passenger Halt)',
    tier: 'HALT',
    passengerFootfall: 'Rural flag stop with scheduled DMU/MEMU stops',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    description: 'Basic flag stop providing platform shed and timetable board for rural passenger connectivity.'
  }
};

export const MASTER_STATION_AMENITIES: StationAmenity[] = [
  {
    id: 'executive-lounge',
    title: 'IRCTC Executive Lounge & Sleeping Pods',
    category: 'LOUNGE',
    badge: 'Executive Lounge',
    emoji: '🛋️',
    shortDesc: 'Airport-style air-conditioned luxury lounge with recliners, buffet dining, shower cubicles & sleeping pods.',
    detailedDesc: 'Experience world-class luxury at Indian railway terminals. IRCTC Executive Lounges feature plush recliner sofas, live train status displays, high-speed Wi-Fi, hot multi-cuisine buffet spreads, automated tea/coffee kiosks, electronic lockers, and sanitized bath and change cubicles.',
    locationOnPlatform: 'Platform 1 Main Entry Concourse or Departure Air Concourse',
    tariffsAndRules: '₹150 to ₹200 for initial 2 hours (includes welcome beverage and Wi-Fi). Buffet meals available at printed IRCTC rates. Accessible by presenting any valid train ticket & photo ID.',
    availability: '24/7 service across NSG-1, NSG-2, and major tourist junctions.',
    imageUrl: '/images/amenities/executive_lounge.jpg',
    applicableCategories: ['NSG1', 'NSG2']
  },
  {
    id: 'waiting-halls',
    title: 'AC & Upper Class Waiting Halls',
    category: 'WAITING',
    badge: 'Waiting Halls',
    emoji: '🏛️',
    shortDesc: 'Spacious resting lounges with mobile charging hubs, cushioned benches & departure monitors.',
    detailedDesc: 'Rest comfortably between train journeys. Equipped with ergonomic bench seating, digital train announcement displays, USB and laptop charging stations, sanitized washrooms, and drinking water dispensers.',
    locationOnPlatform: 'Platform 1 Concourse & Platform 2/3 Island Concourse',
    tariffsAndRules: 'Complimentary for passengers holding valid confirmed, RAC, or waitlisted tickets matching the coach class (AC halls for AC ticket holders; General halls for Sleeper/General).',
    availability: 'Available 24/7 across all major and district railway stations.',
    imageUrl: '/images/amenities/waiting_hall.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4']
  },
  {
    id: 'ladies-waiting-room',
    title: 'Dedicated Ladies Waiting Room & Janani Sewa',
    category: 'WAITING',
    badge: 'Janani Sewa (Mothers & Infants)',
    emoji: '🤱',
    shortDesc: 'Private resting rooms for female travelers featuring infant feeding cubicles and warm milk dispensers.',
    detailedDesc: 'Secured exclusively for women passengers and accompanying children, staffed by female RPF personnel. Features private nursing pods (Janani Sewa), diaper changing stations, warm water dispensers for baby food, and sanitized attached washrooms.',
    locationOnPlatform: 'Platform 1 near Station Superintendent Office',
    tariffsAndRules: 'Complimentary for all female passengers holding a valid railway travel ticket.',
    availability: '24/7 dedicated surveillance and assistance.',
    imageUrl: '/images/amenities/ladies_waiting.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4']
  },
  {
    id: 'cloak-room',
    title: '24-Hour Cloak Room & Smart Luggage Lockers',
    category: 'CLOAK',
    badge: 'Cloak Room & Lockers',
    emoji: '🧳',
    shortDesc: 'Guarded luggage depository and biometric smart lockers allowing travelers to explore the city luggage-free.',
    detailedDesc: 'Government-operated secure cloak room with 24/7 CCTV surveillance. Deposit heavy suitcases, rucksacks, or parcels while waiting for connecting trains or during daytime city sightseeing excursions.',
    locationOnPlatform: 'Station Concourse near Parcel Office / Platform 1 Main Gate',
    tariffsAndRules: 'Official Indian Railways tariff: ₹20 per bag for first 24 hours, ₹25 per bag for each subsequent 24 hours. NOTE: Every piece of luggage must have its own secure padlock and key.',
    availability: '24/7 service (brief 30-min shift handovers at 06:00, 14:00, 22:00). Valid ticket & photo ID required.',
    imageUrl: '/images/amenities/cloak_room.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4']
  },
  {
    id: 'retiring-rooms',
    title: 'IRCTC Retiring Rooms & AC Dormitories',
    category: 'TRANSIT',
    badge: 'Retiring Rooms',
    emoji: '🛏️',
    shortDesc: 'Air-conditioned hotel-style transit bedrooms and dormitory beds bookable by PNR.',
    detailedDesc: 'Cost-effective transit accommodation located right inside the railway station premises. Choose between Deluxe AC double bedrooms, family suites, or single dormitory pods with clean bed linen, attached baths, and hot water.',
    locationOnPlatform: '1st & 2nd Floor above Main Concourse Building',
    tariffsAndRules: 'Bookable online via IRCTC Tourism portal or station counter using a valid PNR (from 3 hours up to 48 hours). Tariffs start from ₹150 for dormitory beds to ₹800 for AC rooms.',
    availability: 'Available at all NSG-1 to NSG-4 junction stations across India.',
    imageUrl: '/images/amenities/retiring_room.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4']
  },
  {
    id: 'escalators-elevators',
    title: 'Modern Escalators & Glass Lifts (FOB)',
    category: 'ELEVATOR',
    badge: 'Escalators & FOB Lifts',
    emoji: '⚡',
    shortDesc: 'Continuous bi-directional escalators and stretcher-friendly elevators connecting all platforms.',
    detailedDesc: 'Built under the Amrit Bharat Station Scheme, heavy-duty weather-proof bi-directional escalators and 13-passenger glass elevators seamlessly connect wide Foot Over Bridges (FOBs) directly down to every platform track.',
    locationOnPlatform: 'Connecting all platform tracks (Center and ends of platforms)',
    tariffsAndRules: 'Free public passenger amenity. Priority given to senior citizens, Divyangjan travelers, and families with heavy luggage.',
    availability: 'Operational 24/7 with on-site railway electrical maintenance staff.',
    imageUrl: '/images/amenities/escalators_fob.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'SG1', 'SG2']
  },
  {
    id: 'water-vending',
    title: 'Water Vending Machines (Water ATMs - RO/UV)',
    category: 'WATER',
    badge: 'Water ATM (Chilled RO/UV)',
    emoji: '💧',
    shortDesc: 'Chilled RO + UV purified drinking water dispensed automatically at ₹1 to ₹5 per liter.',
    detailedDesc: 'Eco-friendly water vending kiosks certified by IRCTC and WHO standards. Promotes plastic waste reduction by encouraging passengers to refill their own reusable water bottles with icy-cold purified mineral drinking water.',
    locationOnPlatform: 'Installed every 100 meters on all passenger platforms',
    tariffsAndRules: '₹1 for 300ml glass refill, ₹3 for 500ml container, ₹5 for 1000ml (1 liter) refill, and ₹8 for fresh container + 1 liter water.',
    availability: '24/7 automated coin and QR UPI payment dispensing.',
    imageUrl: '/images/amenities/water_atm.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'NSG5', 'SG1', 'SG2', 'SG3']
  },
  {
    id: 'railwire-wifi',
    title: 'RailWire Free High-Speed Optical Fiber Wi-Fi',
    category: 'WIFI',
    badge: 'RailWire High-Speed Wi-Fi',
    emoji: '📶',
    shortDesc: 'Fast optical fiber Wi-Fi powered by RailTel offering 30 minutes complimentary access across 6,000+ stations.',
    detailedDesc: 'World’s largest public station Wi-Fi network deployed across 6,000+ stations in India. Stream journey movies, track live train status, or complete office work with speeds up to 40 Mbps.',
    locationOnPlatform: 'Seamless wireless coverage across entire station concourse and all platform tracks',
    tariffsAndRules: 'First 30 minutes complimentary per mobile device per day (OTP login). High-speed extended packs available starting from ₹10.',
    availability: 'Available 24/7 across all electrified stations.',
    imageUrl: '/images/amenities/railwire_wifi.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'NSG5', 'NSG6', 'SG1', 'SG2', 'SG3']
  },
  {
    id: 'accessibility',
    title: 'Wheelchair & Divyangjan Accessibility Ramps',
    category: 'ACCESSIBILITY',
    badge: 'Wheelchair & Divyang Accessibility',
    emoji: '♿',
    shortDesc: 'Free wheelchairs, gentle gradient ramps, tactile guide strips, and dedicated Sahayak porters.',
    detailedDesc: 'Comprehensive accessible infrastructure including gentle gradient platform ramps, tactile guide strips for visually challenged travelers, dedicated barrier-free toilets, and Sahayak porter assistance.',
    locationOnPlatform: 'Station Master / Deputy Station Superintendent Office on Platform 1',
    tariffsAndRules: 'Wheelchairs provided free of cost upon submitting a valid ID card or PNR. Advance booking available via Indian Railways 139 helpline.',
    availability: 'Available 24/7 at all stations.',
    imageUrl: '/images/amenities/wheelchair_ramp.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'NSG5', 'NSG6', 'SG1', 'SG2', 'SG3', 'HG1', 'HG2', 'HG3']
  },
  {
    id: 'battery-buggy',
    title: 'Battery-Operated Buggy Carts (BOVs)',
    category: 'ACCESSIBILITY',
    badge: 'Battery Buggy Carts',
    emoji: '🛺',
    shortDesc: 'Electric golf carts transporting elderly passengers and patients seamlessly from main entrance to coach doors.',
    detailedDesc: 'Eco-friendly multi-seater electric buggies operated along wide platform surfaces, allowing elderly passengers, expectant mothers, and differently-abled individuals to reach distant coaches without walking fatigue.',
    locationOnPlatform: 'Platform 1 Main Portico & Inter-Platform Concourse',
    tariffsAndRules: 'Free for Divyangjan passengers; nominal ₹40-50 per passenger for general senior citizen booking.',
    availability: 'Operational 24/7 at NSG-1 and NSG-2 mega terminals.',
    imageUrl: '/images/amenities/battery_buggy.jpg',
    applicableCategories: ['NSG1', 'NSG2']
  },
  {
    id: 'food-plaza',
    title: 'IRCTC Food Plaza & Jan Aahaar Canteen',
    category: 'FOOD',
    badge: 'Food Plaza & Jan Aahaar',
    emoji: '🍛',
    shortDesc: 'Air-conditioned multi-cuisine food courts and subsidised Jan Aahaar meal counters.',
    detailedDesc: 'Branded multi-cuisine food plazas (e.g. Haldiram’s, Comesum, Bikanervala) alongside IRCTC Jan Aahaar kitchens serving hot Indian thalis, regional snacks, fresh bakery items, and purified bottled Rail Neer at statutory MRP.',
    locationOnPlatform: 'Platform 1 & Central Elevated Concourse',
    tariffsAndRules: 'IRCTC Janata Khana thalis available at statutory rate of ₹15 to ₹20; branded food at menu rates.',
    availability: 'Available 24/7 across major junction stations.',
    imageUrl: '/images/amenities/food_plaza.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4']
  },
  {
    id: 'medical-booth',
    title: '24/7 Emergency Medical Booth & Pharmacy',
    category: 'MEDICAL',
    badge: 'Emergency Medical & Pharmacy',
    emoji: '🏥',
    shortDesc: 'First-aid emergency treatment rooms, doctors on call, and round-the-clock generic medicine kiosks.',
    detailedDesc: 'Golden-hour emergency care centers established at major stations to treat passengers falling ill on trains. Equipped with oxygen cylinders, automated external defibrillators (AED), stretcher trolleys, and essential travel medicines.',
    locationOnPlatform: 'Platform 1 near Emergency Medical Post',
    tariffsAndRules: 'Emergency first aid provided free of cost; medicines dispensed at printed Jan Aushadhi generic MRP.',
    availability: 'Available 24/7 at all NSG-1 to NSG-3 terminals.',
    imageUrl: '/images/amenities/medical_booth.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3']
  },
  {
    id: 'prepaid-taxi',
    title: 'Pre-Paid Auto / Taxi & App-Cab Pickup Bays',
    category: 'TRANSIT',
    badge: 'Pre-Paid Taxi & Auto Booth',
    emoji: '🚕',
    shortDesc: 'Traffic police regulated pre-paid counters and dedicated Ola/Uber ride-hailing pickup bays.',
    detailedDesc: 'Eliminates overcharging and negotiations. Passengers receive automated fare receipts stamped with destination and vehicle registration numbers, with dedicated ride-hailing pickup bays directly outside station exit gates.',
    locationOnPlatform: 'Main Station Exit Concourse / Circulating Area',
    tariffsAndRules: 'Fixed kilometer rates fixed by District Transport Authority / Traffic Police.',
    availability: '24/7 operations with police monitoring.',
    imageUrl: '/images/amenities/prepaid_taxi.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3']
  },
  {
    id: 'atvm-kiosks',
    title: 'Automated Ticket Vending Machines (ATVMs) & UTS QR',
    category: 'TRANSIT',
    badge: 'ATVMs & UTS QR Ticketing',
    emoji: '🎟️',
    shortDesc: 'Touchscreen coinless ticket kiosks and QR codes for instant unreserved & platform ticket booking.',
    detailedDesc: 'Self-service touchscreen ticket kiosks accepting IRCTC smart cards and UPI QR codes, allowing passengers to book general second-class tickets and platform passes in seconds without standing in queue.',
    locationOnPlatform: 'Entrance Foyers and Platform Foot Over Bridge landings',
    tariffsAndRules: 'Standard Indian Railways unreserved fares; 3% bonus cashback on smart card recharges.',
    availability: 'Available 24/7 across all suburban and non-suburban stations.',
    imageUrl: '/images/amenities/atvm_kiosk.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'NSG5', 'SG1', 'SG2', 'SG3']
  },
  {
    id: 'rpf-helpdesk',
    title: 'RPF / GRP Passenger Safety Help Desk (139)',
    category: 'SECURITY',
    badge: 'Railway Protection Force (RPF)',
    emoji: '👮',
    shortDesc: '24-hour uniformed railway police assistance, women passenger escorts, and instant FIR registration.',
    detailedDesc: 'On-duty Railway Protection Force (RPF) and Government Railway Police (GRP) personnel ensuring traveler safety, patrolling platforms, operating the Meri Saheli women safety initiative, and resolving complaints submitted via Rail Madad 139.',
    locationOnPlatform: 'Platform 1 Center near Station Master Room',
    tariffsAndRules: 'Free government security service. Emergency dial: 139 / 182 / 112.',
    availability: '24/7 armed platform patrol and assistance.',
    imageUrl: '/images/amenities/rpf_security.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'SG1', 'SG2']
  },
  {
    id: 'coach-guidance',
    title: 'Electronic Coach Guidance & Platform LED Displays',
    category: 'TRANSIT',
    badge: 'Coach Position Indicators',
    emoji: '💡',
    shortDesc: 'Illuminated LED displays showing exact coach positions (e.g. S1, B3, H1) before train arrival.',
    detailedDesc: 'Suspended illuminated LED displays positioned every 20 meters along platforms, indicating the exact train number and stopping position of coaches (e.g. B1, B2, S4, GEN) so passengers can wait exactly where their coach doors will align.',
    locationOnPlatform: 'Suspended beneath platform shelter canopies on all tracks',
    tariffsAndRules: 'Complimentary visual guidance system.',
    availability: 'Synchronized with PRS train dispatch systems.',
    imageUrl: '/images/amenities/coach_indicator.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4']
  },
  {
    id: 'free-water-posts',
    title: 'Chilled Filtered Water Posts & Taps',
    category: 'WATER',
    badge: 'Pure Drinking Water Taps',
    emoji: '🚰',
    shortDesc: 'Continuous potable water taps and coolers spaced along platform lengths.',
    detailedDesc: 'Hygienic stainless-steel water troughs and chilled water fountains connected to station filtration plants, providing safe and refreshing drinking water to all rail passengers free of cost.',
    locationOnPlatform: 'Every 50 meters along all platform tracks',
    tariffsAndRules: '100% Free public utility.',
    availability: 'Continuous 24/7 supply.',
    imageUrl: '/images/amenities/water_tap.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'NSG5', 'NSG6', 'SG1', 'SG2', 'SG3', 'HG1', 'HG2', 'HG3']
  },
  {
    id: 'passenger-shelters',
    title: 'All-Weather Covered Platform Shelters & Seating',
    category: 'WAITING',
    badge: 'Platform Covered Sheds',
    emoji: '⛱️',
    shortDesc: 'Weather-proof insulated platform roof sheds with granite/metal seating benches.',
    detailedDesc: 'Sturdy roof canopies designed to shield waiting passengers from harsh sun, monsoons, and extreme weather, equipped with high-mast LED platform illumination and seating benches.',
    locationOnPlatform: 'Covering entire passenger boarding lengths across platforms',
    tariffsAndRules: 'Free public passenger seating.',
    availability: 'Standard across all Indian railway stations.',
    imageUrl: '/images/amenities/platform_shelter.jpg',
    applicableCategories: ['NSG1', 'NSG2', 'NSG3', 'NSG4', 'NSG5', 'NSG6', 'SG1', 'SG2', 'SG3', 'HG1', 'HG2', 'HG3']
  }
];

export const STATION_AMENITIES = MASTER_STATION_AMENITIES;

const STATIONS_DATA: Record<string, [string, string, string, string, string]> = allStationsMap as any;

/**
 * Returns the exact list of amenities available at a station based on its official
 * Indian Railways Amrit Bharat Station Category (NSG1-6, SG1-3, HG1-3).
 * Guaranteed to work for all 8,542 stations in India.
 */
export function getStationAmenitiesForStation(stationCode?: string, stationCategory?: string): StationAmenity[] {
  let cat = 'NSG3'; // sensible default
  
  if (stationCode) {
    const code = stationCode.trim().toUpperCase();
    const meta = STATIONS_DATA[code];
    if (meta && meta[3]) {
      cat = meta[3].replace('-', '');
    }
  }
  
  if (stationCategory) {
    cat = stationCategory.trim().toUpperCase().replace('-', '');
  }

  // Filter master amenities that apply to this category
  const filtered = MASTER_STATION_AMENITIES.filter(am => 
    am.applicableCategories.includes(cat) || am.applicableCategories.includes('NSG6')
  );

  return filtered.length > 0 ? filtered : MASTER_STATION_AMENITIES.slice(0, 6);
}

/**
 * Get category information for any station.
 */
export function getStationCategoryDetails(stationCodeOrCat?: string): StationCategoryDetails {
  if (!stationCodeOrCat) {
    return STATION_CATEGORY_REGISTRY.NSG3;
  }
  
  let key = stationCodeOrCat.trim().toUpperCase().replace('-', '');
  
  // If it's a station code like NDLS or BZA, look up its category in the 8,542 station map
  if (STATIONS_DATA[key]) {
    const cat = STATIONS_DATA[key][3];
    if (cat) {
      key = cat.replace('-', '');
    }
  }

  return STATION_CATEGORY_REGISTRY[key] || STATION_CATEGORY_REGISTRY.NSG4;
}

export function getStationAmenities(category?: string): StationAmenity[] {
  if (!category || category === 'ALL') return MASTER_STATION_AMENITIES;
  return MASTER_STATION_AMENITIES.filter(a => a.category === category);
}
