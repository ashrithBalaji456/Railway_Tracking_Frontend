export interface StationDelicacy {
  stationCodes: string[];
  stationName: string;
  state: string;
  badgeShortText: string;
  badgeEmoji: string;
  delicacyTitle: string;
  highlightTag: string;
  description: string;
  bestPlatformOrStall: string;
  irctcTip: string;
  mustTryItems: string[];
  imageUrl: string;
  recommendedHaltMin: number;
}

export const STATION_GASTRONOMY: StationDelicacy[] = [
  {
    stationCodes: ['RTM'],
    stationName: 'Ratlam Junction',
    state: 'Madhya Pradesh',
    badgeShortText: 'Ratlam Sev',
    badgeEmoji: '🍲',
    delicacyTitle: 'World-Famous Ratlam Sev & Steaming Poha',
    highlightTag: 'Legendary Station Bite',
    description: 'No passenger train crosses Ratlam without travelers rushing to the platform stalls. Spiced with clove (laung) and black pepper, crisp Ratlam Sev served on fluffy turmeric poha with a squeeze of fresh lemon and spicy jeeravan powder is the quintessence of Indian platform snacks.',
    bestPlatformOrStall: 'Platforms 1 & 4 Refreshment Kiosks',
    irctcTip: 'Ask for the extra hot "Laung Sev" sample packet before buying bulk boxes to carry home.',
    mustTryItems: ['Laung Sev Poha', 'Garadu (seasonal)', 'Ratlam Sev Packets'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['KGP'],
    stationName: 'Kharagpur Junction',
    state: 'West Bengal',
    badgeShortText: 'Kharagpur Chai',
    badgeEmoji: '☕',
    delicacyTitle: 'World-Longest Platform Kulhad Chai & Dim-er Devil',
    highlightTag: 'South Eastern Rail Heritage',
    description: 'Kharagpur boasts one of the longest railway platforms in the world. Sipping scalding clay-cup (kulhad) milk tea while savoring spicy Bengali egg chops (Dim-er Devil) and vegetable croquettes as long-distance trains refuel is an unforgettable ritual.',
    bestPlatformOrStall: 'Platform 1 & 2 Center Overbridge Concourse',
    irctcTip: 'Discard clay kulhads into dedicated dry bins — they are 100% biodegradable and eco-friendly.',
    mustTryItems: ['Earthen Kulhad Milk Tea', 'Dim-er Devil (Egg Chop)', 'Singara'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['BZA'],
    stationName: 'Vijayawada Junction',
    state: 'Andhra Pradesh',
    badgeShortText: 'Vijayawada Bajji',
    badgeEmoji: '🌶️',
    delicacyTitle: 'Crunchy Mirchi Bajji & Steaming Idli-Pesarattu',
    highlightTag: 'Fiery Andhra Flavors',
    description: 'As South India’s busiest crossroads along the Krishna River, Vijayawada’s platforms waft with the irresistible fragrance of deep-fried banana peppers stuffed with ajwain and lemon (Mirchi Bajji) and golden green-gram Pesarattu filled with spiced upma.',
    bestPlatformOrStall: 'Platform 1, 6 & 7 IRCTC Jan Aahaar & Balaji Fast Food',
    irctcTip: 'Grab a bottle of cool Guntur buttermilk right after the mirchi bajji to tame the fiery spice.',
    mustTryItems: ['Guntur Mirchi Bajji', 'Pesarattu Upma', 'Piping Hot Filter Coffee'],
    imageUrl: '/images/gastronomy/vijayawada_bajji.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['CSMT', 'MMCT', 'BDTS', 'PNVL', 'DR', 'TNA', 'KYN'],
    stationName: 'Mumbai Terminals (CSMT / Central / Dadar / Kalyan)',
    state: 'Maharashtra',
    badgeShortText: 'Mumbai Vada Pav',
    badgeEmoji: '🥪',
    delicacyTitle: 'Piping Hot Batata Vada Pav & Cutting Chai',
    highlightTag: 'The Mumbai Pulse',
    description: 'Crisp golden spiced-potato fritters enclosed in soft pav buns with fiery red garlic chutney and salted green chillies. Paired with aromatic ginger cutting chai, it has powered millions of commuters across suburban and mainline platforms for over a century.',
    bestPlatformOrStall: 'Aahar Stall / Platform 1 near suburban concourse',
    irctcTip: 'Pair it with authentic Solkadhi or Masala Chaas during humid coastal runs.',
    mustTryItems: ['Batata Vada Pav', 'Misal Pav', 'Cutting Ginger Chai'],
    imageUrl: '/images/gastronomy/pune_misal_pav.jpg',
    recommendedHaltMin: 5
  },
  {
    stationCodes: ['CNB'],
    stationName: 'Kanpur Central',
    state: 'Uttar Pradesh',
    badgeShortText: 'Thaggu Ke Laddu',
    badgeEmoji: '🍬',
    delicacyTitle: 'Iconic Thaggu ke Laddu & Malai Rabdi Kulfi',
    highlightTag: 'Heritage Awadhi Confection',
    description: 'Home to the humorous slogan "Aisa Koi Saga Nahi Jise Humne Thaga Nahi" (No relative left un-conned!), these rich semolina, gond, pistachio, and pure khoya laddus are legendary across Northern Railways. Pair with thick saffron rabdi kulfi.',
    bestPlatformOrStall: 'Platform 1 Main Exit Hallway & Concourse Stalls',
    irctcTip: 'Ask for the Badam Kulfi matka cups which stay chilled for up to two hours in air-conditioned coaches.',
    mustTryItems: ['Thaggu Ke Laddu', 'Special Badam Peda', 'Matka Rabdi Kulfi'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['JP'],
    stationName: 'Jaipur Junction',
    state: 'Rajasthan',
    badgeShortText: 'Jaipur Kachori',
    badgeEmoji: '🥟',
    delicacyTitle: 'Crisp Pyaaz Kachori & Royal Ghevar',
    highlightTag: 'Royal Marwari Heritage',
    description: 'Flaky, puffed golden pastry disks bursting with spiced onion, asafoetida, and whole coriander seeds, served alongside tangy tamarind saunth and mint chutney. In festive months, honeycombed disc Ghevar drenched in rabdi sweetens the train ride.',
    bestPlatformOrStall: 'Platform 1 Rawat / Heritage Sweets Kiosk',
    irctcTip: 'The kachoris are extremely hot inside; poke a hole and let the aromatic steam release before taking your first bite.',
    mustTryItems: ['Pyaaz Kachori', 'Mawa Kachori', 'Dal Baati Churma Meal Tray'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['BSB', 'BSBS', 'DDU'],
    stationName: 'Varanasi / Banaras / Pt. Deen Dayal Upadhyaya',
    state: 'Uttar Pradesh',
    badgeShortText: 'Banarasi Chaat',
    badgeEmoji: '🍅',
    delicacyTitle: 'Banarasi Tamatar Chaat & Winter Malaiyyo',
    highlightTag: 'Holy Ganga Gourmet',
    description: 'Spicy mashed tomatoes simmered with cumin, cashews, and aromatic clarified butter (ghee) topped with crispy namkeen and hing water in clay bowls. In winter mornings, sample cloud-light frothy saffron milk foam known as Malaiyyo.',
    bestPlatformOrStall: 'Platform 1 Concourse & Food Track Stalls',
    irctcTip: 'Don’t board without trying a sweet Banarasi Meetha Paan packed with gulkand and fennel.',
    mustTryItems: ['Tamatar Chaat in Kulhad', 'Banarasi Meetha Paan', 'Kachori Jalebi'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['HWH', 'SDAH', 'KOAA'],
    stationName: 'Howrah / Sealdah / Kolkata Terminals',
    state: 'West Bengal',
    badgeShortText: 'Mishti Doi & Roll',
    badgeEmoji: '🍧',
    delicacyTitle: 'Fish Kabiraji, Kolkata Biryani & Mishti Doi',
    highlightTag: 'City of Joy Delights',
    description: 'Under the majestic steel cantilever Howrah Bridge, railway eateries serve colonial-era Fish Kabiraji (crisp filleted bhetki cloaked in a gossamer egg net), fragrant Kolkata aloo biryani, and baked earthen bowls of sweet caramelized yoghurt (Mishti Doi).',
    bestPlatformOrStall: 'Howrah Platform 8 & 9 New Complex Food Plaza',
    irctcTip: 'Grab sealed earthen pots of Mishti Doi from authorized state dairy stalls (Mother Dairy / Haringhata).',
    mustTryItems: ['Baked Mishti Doi', 'Warm Rosogolla', 'Fish Finger Croquettes'],
    imageUrl: '/images/gastronomy/kolkata_jalebi.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['MAS', 'MS', 'TBM', 'CBE'],
    stationName: 'Chennai Central / Egmore / Coimbatore',
    state: 'Tamil Nadu',
    badgeShortText: 'Filter Kaapi & Vada',
    badgeEmoji: '☕',
    delicacyTitle: 'Crispy Medu Vada, Ghee Podi Idli & Filter Kaapi',
    highlightTag: 'Southern Golden Roast',
    description: 'Nothing beats early morning arrival at Puratchi Thalaivar Dr. M.G. Ramachandran Central. Crispy urad dal vadas served with cooling coconut chutney and spicy lentil sambar, accompanied by frothy, decoction-brewed chicory filter coffee in steel tumblers.',
    bestPlatformOrStall: 'Platform 1 Grand Concourse & Platform 4 Veg Stalls',
    irctcTip: 'Ask the coffee master for "Strong Meter Coffee" poured high between davarah and tumbler.',
    mustTryItems: ['Medu Vada with Sambar', 'Ghee Podi Idlis', 'Kumbakonam Degree Coffee'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['PNBE', 'DNR'],
    stationName: 'Patna Junction / Danapur',
    state: 'Bihar',
    badgeShortText: 'Litti Chokha',
    badgeEmoji: '🥘',
    delicacyTitle: 'Charcoal-Baked Litti Chokha with Desi Ghee',
    highlightTag: 'Heartland Sustenance',
    description: 'Crusty whole-wheat dough balls stuffed with roasted gram flour (sattu), carom seeds, green chillies, and mustard oil, roasted slowly over coal embers and drowned in molten clarified butter. Served with smoky roasted eggplant and tomato chokha.',
    bestPlatformOrStall: 'Platform 1 IRCTC Food Plaza & Jan Aahaar',
    irctcTip: 'Litti stays fresh without refrigeration for over 48 hours, making it the ideal long-haul travel meal.',
    mustTryItems: ['Sattu Litti with Baingan Chokha', 'Tilkut Sweets', 'Khaja of Silao'],
    imageUrl: '/images/gastronomy/nagpur_tarri_poha.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['SBC', 'SMVB', 'YPR', 'MYS'],
    stationName: 'Bengaluru / Yesvantpur / Mysuru',
    state: 'Karnataka',
    badgeShortText: 'Benne Dosa',
    badgeEmoji: '🥞',
    delicacyTitle: 'Butter Benne Dosa & Melt-in-Mouth Mysore Pak',
    highlightTag: 'Deccan Royal Flavors',
    description: 'Thick, golden, blistered rice crêpes roasted with dollops of white country butter, served with potato palya and spicy coconut chutney. Conclude your meal with warm, crumbly gram flour Mysore Pak that dissolves instantly on the palate.',
    bestPlatformOrStall: 'Platform 1 Main Entry Concourse & Refreshment Rooms',
    irctcTip: 'Pick up authentic boxed Mysore Pak certified by traditional sweet houses near Platform 1.',
    mustTryItems: ['Crispy Benne Dosa', 'Traditional Ghee Mysore Pak', 'Filter Coffee'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['AGC', 'AF'],
    stationName: 'Agra Cantt / Agra Fort',
    state: 'Uttar Pradesh',
    badgeShortText: 'Agra Petha',
    badgeEmoji: '🍮',
    delicacyTitle: 'World-Renowned Agra Petha & Bedai Aloo',
    highlightTag: 'Mughal Heritage Sweets',
    description: 'Translucent ash gourd confection simmered in sweet rose, saffron, or betel leaf syrup. For breakfast, savor Bedai — crispy deep-fried lentil-stuffed pooris paired with fiery aloo sabzi and sweet jalebis.',
    bestPlatformOrStall: 'Platform 1 & 2 Station Stalls (Panchi Petha Authorized Kiosk)',
    irctcTip: 'Look for the green FSSAI and holographic seal on packaged Agra Petha to ensure authentic quality.',
    mustTryItems: ['Angoori Petha', 'Kesar Petha', 'Bedai with Hing Aloo Sabzi'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['HYB', 'SC', 'KCG'],
    stationName: 'Hyderabad / Secunderabad / Kacheguda',
    state: 'Telangana',
    badgeShortText: 'Hyderabadi Biryani',
    badgeEmoji: '🍗',
    delicacyTitle: 'Kachhi Dum Biryani & Irani Chai with Osmania Biscuits',
    highlightTag: 'Nizami Epicurean Glory',
    description: 'Fragrant long-grain Basmati rice slow-cooked under dough seal with tender spiced meat, saffron, and fried onions. At the platform stalls, wash it down with creamy Irani chai and melt-in-mouth sweet-salty Osmania biscuits.',
    bestPlatformOrStall: 'Platform 1 & 10 IRCTC Concourse & Alpha Hotel kiosk',
    irctcTip: 'Pre-order via IRCTC e-catering for freshly packed handi biryani delivered to your coach seat.',
    mustTryItems: ['Chicken Dum Biryani', 'Irani Kadak Chai', 'Osmania Biscuits'],
    imageUrl: '/images/gastronomy/secunderabad_biryani.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['PUNE'],
    stationName: 'Pune Junction',
    state: 'Maharashtra',
    badgeShortText: 'Pune Misal & Bakarwadi',
    badgeEmoji: '🍲',
    delicacyTitle: 'Fiery Puneri Misal Pav & Chitale Bakarwadi',
    highlightTag: 'Maratha Spice & Crunch',
    description: 'Sprouted moth beans in a rich red fiery rassa topped with crunchy farsan, chopped onions, and fresh coriander, served with pav and lemon. Don’t depart Pune without boxes of crisp spiral Bakarwadi stuffed with spicy coconut.',
    bestPlatformOrStall: 'Platform 1 Overbridge Exit Stalls',
    irctcTip: 'Chitale Bakarwadi sells out by noon; grab your packets as soon as the train arrives.',
    mustTryItems: ['Puneri Misal Pav', 'Chitale Bandhu Bakarwadi', 'Mango Mastani'],
    imageUrl: '/images/gastronomy/pune_misal_pav.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['ASR'],
    stationName: 'Amritsar Junction',
    state: 'Punjab',
    badgeShortText: 'Amritsari Kulcha',
    badgeEmoji: '🥖',
    delicacyTitle: 'Tandoori Amritsari Kulcha with Chole & Malai Lassi',
    highlightTag: 'Golden Temple Heartland',
    description: 'Layered crusty flatbread stuffed with spiced potatoes and pomegranates, baked in clay tandoors and crushed with generous country butter. Served with tangy Punjabi chole and towering glasses of sweet yogurt lassi.',
    bestPlatformOrStall: 'Platform 1 Main Station Front & Concourse',
    irctcTip: 'Crush the hot kulcha between your palms before adding butter for optimal flaky crunch.',
    mustTryItems: ['Aloo Pyaaz Kulcha', 'Pindi Chole', 'Thick Malai Lassi'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['CLT', 'SRR', 'TCR', 'ERS'],
    stationName: 'Kozhikode / Shoranur / Thrissur / Ernakulam',
    state: 'Kerala',
    badgeShortText: 'Malabar Pazham Pori',
    badgeEmoji: '🍌',
    delicacyTitle: 'Golden Banana Fritters & Coconut Oil Banana Chips',
    highlightTag: 'Gods Own Country Crunch',
    description: 'Crisp golden batter-fried ripe nendran plantains (Pazham Pori) sizzling at platform tea kiosks. Accompanied by fresh raw-banana chips fried in pure aromatic coconut oil and piping hot cardamon Sulaimani black tea.',
    bestPlatformOrStall: 'Platform 1 & 2 Station Tea Carts & Kudumbashree Stalls',
    irctcTip: 'Purchase coconut oil banana chips directly from verified Kudumbashree women self-help kiosks.',
    mustTryItems: ['Hot Pazham Pori', 'Fresh Coconut Oil Banana Chips', 'Spiced Sulaimani Chai'],
    imageUrl: '/images/gastronomy/shoranur_banana_chips.jpg',
    recommendedHaltMin: 5
  },
  {
    stationCodes: ['NGP'],
    stationName: 'Nagpur Junction',
    state: 'Maharashtra',
    badgeShortText: 'Nagpur Tarri Poha',
    badgeEmoji: '🍊',
    delicacyTitle: 'Spicy Tarri Poha & Tangy Santra Burfi',
    highlightTag: 'Orange City Specialty',
    description: 'Soft flattened rice drenched in boiling, spicy black-chana curry (Tarri) garnished with raw onions and crispy sev. Complete the meal with bright orange sweets (Santra Burfi) infused with juicy Nagpur orange pulp.',
    bestPlatformOrStall: 'Platform 1 Refreshment Rooms & Food Plaza',
    irctcTip: 'Ask the vendor for "Kam Teekha" (mild spice) if you are sensitive to black-pepper heat.',
    mustTryItems: ['Nagpur Tarri Poha', 'Santra Burfi', 'Roasted Chana'],
    imageUrl: '/images/gastronomy/nagpur_tarri_poha.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['BPL', 'RKMP'],
    stationName: 'Bhopal / Rani Kamlapati',
    state: 'Madhya Pradesh',
    badgeShortText: 'Bhopali Poha Jalebi',
    badgeEmoji: '🍲',
    delicacyTitle: 'Indori Poha with Crisp Jalebi & Sulemani Chai',
    highlightTag: 'Central Indian Classic',
    description: 'Steam-cooked light poha topped with spicy sev, diced onions, and special jeeravan spice mix, paired with sizzling crisp spiral jalebis dripping with sugar syrup.',
    bestPlatformOrStall: 'Platform 1 & Rani Kamlapati World-Class Concourse',
    irctcTip: 'Rani Kamlapati station features airport-style air-conditioned food plazas on the departure air concourse.',
    mustTryItems: ['Poha Jalebi Combo', 'Sulemani Salted Chai', 'Bhopali Biryani'],
    imageUrl: '/images/gastronomy/kolkata_jalebi.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['MTJ'],
    stationName: 'Mathura Junction',
    state: 'Uttar Pradesh',
    badgeShortText: 'Mathura Peda',
    badgeEmoji: '🥛',
    delicacyTitle: 'Caramelized Mathura Ke Pede & Makhan Mishri',
    highlightTag: 'Brij Bhoomi Heritage Sweet',
    description: 'Dark brown roasted mawa fudge delicately rolled in sugar crystals and cardamom powder. Platform hawkers carry authentic boxes stamped with traditional Brij dairy certification.',
    bestPlatformOrStall: 'Platform 1 Brijwasi Sweets Authorized Counter',
    irctcTip: 'Check the seal on Brijwasi boxes; authentic pedas stay fresh for up to 15 days without refrigeration.',
    mustTryItems: ['Kesar Mathura Peda', 'Makhan Mishri in Clay Cup', 'Bedmi Puri Aloo'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 5
  }
];

export interface GastronomyBadgeInfo {
  badgeText: string;
  dishName: string;
  emoji: string;
  delicacy: StationDelicacy;
  isSafeHalt: boolean;
  haltText: string;
}

export function getStationGastronomyBadge(stationCode?: string, haltMinutes?: number): GastronomyBadgeInfo | null {
  if (!stationCode) return null;
  const code = stationCode.toUpperCase();
  const delicacy = STATION_GASTRONOMY.find(item => item.stationCodes.includes(code));
  if (!delicacy) return null;

  const halt = haltMinutes || 0;
  const haltText = halt > 0 ? `${halt} min halt` : 'Halt station';
  const badgeText = `${delicacy.badgeEmoji} ${delicacy.badgeShortText} (${haltText})`;
  const isSafeHalt = halt >= delicacy.recommendedHaltMin;

  return {
    badgeText,
    dishName: delicacy.badgeShortText,
    emoji: delicacy.badgeEmoji,
    delicacy,
    isSafeHalt,
    haltText
  };
}

export function getStationGastronomy(stationCode?: string, stateName?: string): StationDelicacy {
  if (stationCode) {
    const code = stationCode.toUpperCase();
    const match = STATION_GASTRONOMY.find(item => item.stationCodes.includes(code));
    if (match) return match;
  }

  // Fallback by state if code not explicitly mapped
  if (stateName) {
    const stateMatch = STATION_GASTRONOMY.find(
      item => item.state.toLowerCase() === stateName.toLowerCase()
    );
    if (stateMatch) return stateMatch;
  }

  // Universal Indian Railways Platform Classic
  return {
    stationCodes: [stationCode || 'GEN'],
    stationName: stationCode || 'Indian Railways Platform',
    state: stateName || 'Pan-India',
    badgeShortText: 'Platform Samosa',
    badgeEmoji: '🥟',
    delicacyTitle: 'Crispy Platform Samosa & Masala Chai',
    highlightTag: 'Timeless Trackside Staple',
    description: 'Golden triangular pastry pockets stuffed with spiced potatoes, green peas, cumin, and garam masala, fried crisp right at platform side. Paired with steaming ginger-cardamom tea, this remains the eternal soul food of the Indian Railways.',
    bestPlatformOrStall: 'Main Platform IRCTC Authorized Refreshment Stalls',
    irctcTip: 'Always check that samosas are served fresh and hot from the wok, and verify the IRCTC printed MRP.',
    mustTryItems: ['Platform Hot Samosa', 'Cardamom Kulhad Tea', 'Fresh Bread Omelette'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 5
  };
}
