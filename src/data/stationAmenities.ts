export interface StationAmenity {
  id: string;
  title: string;
  category: 'LOUNGE' | 'WAITING' | 'CLOAK' | 'ACCESSIBILITY' | 'WATER' | 'ELEVATOR' | 'WIFI';
  badge: string;
  emoji: string;
  shortDesc: string;
  detailedDesc: string;
  locationOnPlatform: string;
  tariffsAndRules: string;
  availability: string;
  imageUrl: string;
}

export const STATION_AMENITIES: StationAmenity[] = [
  {
    id: 'executive-lounge',
    title: 'IRCTC Executive Lounge',
    category: 'LOUNGE',
    badge: 'Executive Lounge',
    emoji: '🛋️',
    shortDesc: 'Airport-style air-conditioned luxury lounge with recliners, buffet dining & shower facilities.',
    detailedDesc: 'Experience luxury at railway stations. IRCTC Executive Lounges offer plush sofa seating, live train running information displays, high-speed Wi-Fi, hot buffet meals (breakfast/lunch/dinner), tea/coffee stations, luggage lockers, and sanitized bath and change facilities.',
    locationOnPlatform: 'Platform 1 / Main Departure Air Concourse',
    tariffsAndRules: '₹150 to ₹200 for initial 2-hour stay (includes complimentary welcome drink and Wi-Fi). Buffet meals available at printed IRCTC rates. Accessible by presenting confirmed ticket & photo ID.',
    availability: 'Major terminals & junction stations (NDLS, CSMT, BZA, HWH, SBC, ADI, AGC, PNBE, JAT, etc.)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Luxary_ICF_Train-_Maharajas_Express..jpg/960px-Luxary_ICF_Train-_Maharajas_Express..jpg'
  },
  {
    id: 'waiting-halls',
    title: 'AC & Upper Class Waiting Halls',
    category: 'WAITING',
    badge: 'Waiting Halls',
    emoji: '🏛️',
    shortDesc: 'Separate AC, Ladies, and Upper Class passenger resting halls with mobile charging hubs.',
    detailedDesc: 'Spacious resting lounges equipped with cushioned bench seating, digital train announcement monitors, mobile and laptop charging points, sanitized restrooms, and dedicated female attendants in Ladies Waiting Rooms.',
    locationOnPlatform: 'Platform 1 Main Entrance & Platform 2/3 Island Concourse',
    tariffsAndRules: 'Complimentary for all passengers holding valid confirmed, RAC, or waitlisted tickets matching the coach class (AC halls for AC ticket holders; General halls for Sleeper/General).',
    availability: 'Available 24/7 across all junction and NSG-1 to NSG-4 railway stations.',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Chhatrapati_Shivaji_Terminus_Building_20.jpg/960px-Chhatrapati_Shivaji_Terminus_Building_20.jpg'
  },
  {
    id: 'cloak-room',
    title: '24-Hour Cloak Room & Luggage Lockers',
    category: 'CLOAK',
    badge: 'Cloak Room',
    emoji: '🧳',
    shortDesc: 'Safe, guarded luggage depository allowing tourists to explore the city luggage-free.',
    detailedDesc: 'Indian Railways operated secure cloak rooms with CCTV monitoring. Deposit your heavy suitcases and rucksacks while waiting for connecting trains or during daytime city excursions.',
    locationOnPlatform: 'Station Concourse near Parcel Office / Platform 1 Exit',
    tariffsAndRules: 'Official Indian Railways tariff: ₹20 per bag for first 24 hours, ₹25 per bag for each subsequent 24 hours. IMPORTANT: Every piece of luggage must have its own secure padlock and key.',
    availability: '24/7 service (brief 30-min shift handovers at 06:00, 14:00, 22:00). Valid ticket & ID required.',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Bangalore-City-Stn.jpg/960px-Bangalore-City-Stn.jpg'
  },
  {
    id: 'escalators-elevators',
    title: 'Modern Escalators & Lifts (FOB)',
    category: 'ELEVATOR',
    badge: 'Escalators & Lifts',
    emoji: '⚡',
    shortDesc: 'Continuous bi-directional escalators and glass elevators across all platform foot over bridges.',
    detailedDesc: 'Under the Amrit Bharat Station Scheme, heavy-duty bi-directional escalators and 13-passenger stretcher-accessible elevators connect wide Foot Over Bridges (FOBs) directly down to every platform.',
    locationOnPlatform: 'Connecting all platform tracks (Center and ends of platforms)',
    tariffsAndRules: 'Free public amenity. Priority given to senior citizens, pregnant women, and passengers with heavy luggage.',
    availability: 'Operational 24/7 with dedicated railway electrical maintenance staff on-site.',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Platform_1%2C_Howrah_Junction_Railway_Station%2C_India.jpg/960px-Platform_1%2C_Howrah_Junction_Railway_Station%2C_India.jpg'
  },
  {
    id: 'water-vending',
    title: 'Water Vending Machines (Water ATMs)',
    category: 'WATER',
    badge: 'Water ATM (RO/UV)',
    emoji: '💧',
    shortDesc: 'Chilled RO + UV purified drinking water dispensed automatically at ₹1 to ₹5 per liter.',
    detailedDesc: 'Eco-friendly water vending machines certified by IRCTC and WHO standards. Promotes plastic waste reduction by encouraging passengers to refill their own reusable bottles with icy-cold purified drinking water.',
    locationOnPlatform: 'Installed every 100 meters on all passenger platforms',
    tariffsAndRules: '₹1 for 300ml glass refill, ₹3 for 500ml container, ₹5 for 1000ml (1 liter) refill, and ₹8 for fresh container + 1 liter water.',
    availability: '24/7 automated coin and QR UPI payment dispensing.',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/360_at_Secunderabad_Station%2C_Platform_1%2C_Dec_2025.jpg/960px-360_at_Secunderabad_Station%2C_Platform_1%2C_Dec_2025.jpg'
  },
  {
    id: 'accessibility',
    title: 'Wheelchair & Divyangjan Accessibility',
    category: 'ACCESSIBILITY',
    badge: 'Wheelchair & Accessibility',
    emoji: '♿',
    shortDesc: 'Free wheelchairs, battery-operated golf carts, tactile paving, and dedicated Sahayak porters.',
    detailedDesc: 'Comprehensive accessible infrastructure including gentle gradient platform ramps, tactile guide strips for visually challenged travelers, dedicated accessible toilets, and battery-operated buggy carts.',
    locationOnPlatform: 'Station Master / Deputy Station Superintendent Office on Platform 1',
    tariffsAndRules: 'Wheelchairs provided free of cost upon submitting a valid ID card or PNR. Battery carts available at nominal booking or complimentary for senior citizens/patients.',
    availability: 'Available 24/7. Advance booking available via Indian Railways 139 helpline or IRCTC portal.',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/360_at_Secunderabad_Station%2C_Platform_1%2C_Dec_2025.jpg/960px-360_at_Secunderabad_Station%2C_Platform_1%2C_Dec_2025.jpg'
  },
  {
    id: 'railwire-wifi',
    title: 'RailWire Free High-Speed Wi-Fi',
    category: 'WIFI',
    badge: 'RailWire Wi-Fi',
    emoji: '📶',
    shortDesc: 'Fast optical fiber Wi-Fi powered by RailTel offering 30 minutes complimentary access.',
    detailedDesc: 'World\u2019s largest public station Wi-Fi network deployed across 6,000+ stations. Stream journey movies, track live train status, or complete office work with speeds up to 40 Mbps.',
    locationOnPlatform: 'Seamless coverage across entire station concourse and all platforms',
    tariffsAndRules: 'First 30 minutes complimentary per mobile device per day (OTP login). High-speed extended packs available starting from ₹10.',
    availability: 'Available 24/7 at all Indian Railways stations.',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Platform_1%2C_Howrah_Junction_Railway_Station%2C_India.jpg/960px-Platform_1%2C_Howrah_Junction_Railway_Station%2C_India.jpg'
  }
];

export function getStationAmenities(category?: string): StationAmenity[] {
  if (!category || category === 'ALL') return STATION_AMENITIES;
  return STATION_AMENITIES.filter(a => a.category === category);
}
