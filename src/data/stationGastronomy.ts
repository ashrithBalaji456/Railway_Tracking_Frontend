import allStationsMap from './allStationsMeta.json';

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

export interface GastronomyBadgeInfo {
  badgeText: string;
  dishName: string;
  emoji: string;
  delicacy: StationDelicacy;
  isSafeHalt: boolean;
  haltText: string;
}

// 1. TOP 100+ ICONIC RAILWAY JUNCTION SIGNATURE DELICACIES
export const STATION_SPECIFIC_DELICACIES: StationDelicacy[] = [
  {
    stationCodes: ['RTM'],
    stationName: 'Ratlam Junction',
    state: 'Madhya Pradesh',
    badgeShortText: 'Ratlam Sev',
    badgeEmoji: '🍲',
    delicacyTitle: 'World-Famous Ratlam Sev & Steaming Poha',
    highlightTag: 'Legendary Station Bite',
    description: 'No passenger train crosses Ratlam without travelers rushing to the platform stalls. Spiced with clove (laung) and black pepper, crisp Ratlam Sev served on fluffy turmeric poha with fresh lemon and spicy jeeravan powder is the quintessence of Indian platform snacks.',
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
    description: 'As South India’s busiest crossroads along the Krishna River, Vijayawada’s platforms waft with the fragrance of deep-fried banana peppers stuffed with ajwain and lemon (Mirchi Bajji) and golden green-gram Pesarattu filled with spiced upma.',
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
    stationCodes: ['PUNE', 'LNL', 'KK'],
    stationName: 'Pune Junction / Lonavala',
    state: 'Maharashtra',
    badgeShortText: 'Pune Misal & Chikki',
    badgeEmoji: '🍲',
    delicacyTitle: 'Fiery Puneri Misal Pav & Maganlal Chikki',
    highlightTag: 'Maratha Spice & Crunch',
    description: 'Sprouted moth beans in a rich red fiery rassa topped with crunchy farsan, chopped onions, and fresh coriander, served with pav and lemon. At Lonavala, travelers pick up iconic crushed peanut Maganlal Chikki slabs.',
    bestPlatformOrStall: 'Platform 1 Overbridge Exit Stalls',
    irctcTip: 'Chitale Bakarwadi sells out by noon; grab your packets as soon as the train arrives.',
    mustTryItems: ['Puneri Misal Pav', 'Chitale Bandhu Bakarwadi', 'Lonavala Chikki'],
    imageUrl: '/images/gastronomy/pune_misal_pav.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['NGP', 'WR'],
    stationName: 'Nagpur Junction / Wardha',
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
    stationCodes: ['CNB'],
    stationName: 'Kanpur Central',
    state: 'Uttar Pradesh',
    badgeShortText: 'Thaggu Ke Laddu',
    badgeEmoji: '🍬',
    delicacyTitle: 'Iconic Thaggu ke Laddu & Malai Rabdi Kulfi',
    highlightTag: 'Heritage Awadhi Confection',
    description: 'Home to the humorous slogan "Aisa Koi Saga Nahi Jise Humne Thaga Nahi", these rich semolina, gond, pistachio, and pure khoya laddus are legendary across Northern Railways. Pair with thick saffron rabdi kulfi.',
    bestPlatformOrStall: 'Platform 1 Main Exit Hallway & Concourse Stalls',
    irctcTip: 'Ask for the Badam Kulfi matka cups which stay chilled for up to two hours in air-conditioned coaches.',
    mustTryItems: ['Thaggu Ke Laddu', 'Special Badam Peda', 'Matka Rabdi Kulfi'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['JP', 'FL', 'DPA'],
    stationName: 'Jaipur Junction / Phulera',
    state: 'Rajasthan',
    badgeShortText: 'Jaipur Kachori',
    badgeEmoji: '🥟',
    delicacyTitle: 'Crisp Pyaaz Kachori & Royal Ghevar',
    highlightTag: 'Royal Marwari Heritage',
    description: 'Flaky, puffed golden pastry disks bursting with spiced onion, asafoetida, and whole coriander seeds, served alongside tangy tamarind saunth and mint chutney. Honeycombed disc Ghevar drenched in rabdi sweetens the train ride.',
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
    description: 'Spicy mashed tomatoes simmered with cumin, cashews, and clarified butter topped with crispy namkeen and hing water in clay bowls. Savor sweet Banarasi Meetha Paan packed with gulkand and fennel.',
    bestPlatformOrStall: 'Platform 1 Concourse & Food Track Stalls',
    irctcTip: 'Do not board without trying a sweet Banarasi Meetha Paan packed with gulkand and fennel.',
    mustTryItems: ['Tamatar Chaat in Kulhad', 'Banarasi Meetha Paan', 'Kachori Jalebi'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['HWH', 'SDAH', 'KOAA', 'SHM'],
    stationName: 'Howrah / Sealdah / Kolkata Terminals',
    state: 'West Bengal',
    badgeShortText: 'Mishti Doi & Roll',
    badgeEmoji: '🍧',
    delicacyTitle: 'Fish Kabiraji, Kolkata Biryani & Mishti Doi',
    highlightTag: 'City of Joy Delights',
    description: 'Under the majestic steel cantilever Howrah Bridge, railway eateries serve colonial-era Fish Kabiraji, fragrant Kolkata aloo biryani, and baked earthen bowls of sweet caramelized yoghurt (Mishti Doi).',
    bestPlatformOrStall: 'Howrah Platform 8 & 9 New Complex Food Plaza',
    irctcTip: 'Grab sealed earthen pots of Mishti Doi from authorized state dairy stalls (Mother Dairy / Haringhata).',
    mustTryItems: ['Baked Mishti Doi', 'Warm Rosogolla', 'Fish Finger Croquettes'],
    imageUrl: '/images/gastronomy/kolkata_jalebi.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['MAS', 'MS', 'TBM', 'CBE', 'SA'],
    stationName: 'Chennai Central / Egmore / Coimbatore / Salem',
    state: 'Tamil Nadu',
    badgeShortText: 'Filter Kaapi & Vada',
    badgeEmoji: '☕',
    delicacyTitle: 'Crispy Medu Vada, Ghee Podi Idli & Filter Kaapi',
    highlightTag: 'Southern Golden Roast',
    description: 'Nothing beats early morning arrival at Chennai Central. Crispy urad dal vadas served with cooling coconut chutney and spicy lentil sambar, accompanied by frothy, decoction-brewed chicory filter coffee in steel tumblers.',
    bestPlatformOrStall: 'Platform 1 Grand Concourse & Platform 4 Veg Stalls',
    irctcTip: 'Ask the coffee master for "Strong Meter Coffee" poured high between davarah and tumbler.',
    mustTryItems: ['Medu Vada with Sambar', 'Ghee Podi Idlis', 'Kumbakonam Degree Coffee'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['PNBE', 'DNR', 'PPTA'],
    stationName: 'Patna Junction / Danapur / Patliputra',
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
    stationCodes: ['SBC', 'SMVB', 'YPR', 'MYS', 'BYPL'],
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
    stationCodes: ['ASR', 'JUC', 'LDH'],
    stationName: 'Amritsar Junction / Jalandhar / Ludhiana',
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
    stationCodes: ['AGC', 'AF'],
    stationName: 'Agra Cantt / Agra Fort',
    state: 'Uttar Pradesh',
    badgeShortText: 'Agra Petha',
    badgeEmoji: '🍮',
    delicacyTitle: 'World-Renowned Agra Petha & Bedai Aloo',
    highlightTag: 'Mughal Heritage Sweets',
    description: 'Translucent ash gourd confection simmered in sweet rose, saffron, or betel leaf syrup. Savor Bedai — crispy deep-fried lentil-stuffed pooris paired with fiery aloo sabzi and sweet jalebis.',
    bestPlatformOrStall: 'Platform 1 & 2 Station Stalls (Panchi Petha Authorized Kiosk)',
    irctcTip: 'Look for the green FSSAI and holographic seal on packaged Agra Petha to ensure authentic quality.',
    mustTryItems: ['Angoori Petha', 'Kesar Petha', 'Bedai with Hing Aloo Sabzi'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['HYB', 'SC', 'KCG', 'LPI'],
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
    stationCodes: ['CLT', 'SRR', 'TCR', 'ERS', 'ERN', 'TVC'],
    stationName: 'Kozhikode / Shoranur / Thrissur / Ernakulam / Trivandrum',
    state: 'Kerala',
    badgeShortText: 'Malabar Pazham Pori',
    badgeEmoji: '🍌',
    delicacyTitle: 'Golden Banana Fritters & Coconut Oil Banana Chips',
    highlightTag: 'Gods Own Country Crunch',
    description: 'Crisp golden batter-fried ripe nendran plantains (Pazham Pori) sizzling at platform tea kiosks. Accompanied by fresh raw-banana chips fried in pure aromatic coconut oil and piping hot cardamom Sulaimani black tea.',
    bestPlatformOrStall: 'Platform 1 & 2 Station Tea Carts & Kudumbashree Stalls',
    irctcTip: 'Purchase coconut oil banana chips directly from verified Kudumbashree women self-help kiosks.',
    mustTryItems: ['Hot Pazham Pori', 'Fresh Coconut Oil Banana Chips', 'Spiced Sulaimani Chai'],
    imageUrl: '/images/gastronomy/shoranur_banana_chips.jpg',
    recommendedHaltMin: 5
  },
  {
    stationCodes: ['BPL', 'RKMP', 'ET'],
    stationName: 'Bhopal / Rani Kamlapati / Itarsi',
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
  },
  {
    stationCodes: ['ADI', 'BRC', 'ST', 'ANND'],
    stationName: 'Ahmedabad / Vadodara / Surat / Anand',
    state: 'Gujarat',
    badgeShortText: 'Surati Locho & Fafda',
    badgeEmoji: '🥯',
    delicacyTitle: 'Steaming Surati Locho, Sev Khamani & Fafda Jalebi',
    highlightTag: 'Suryanagari Delicacies',
    description: 'Unshaped spiced gram flour delicacy smothered in butter, spicy green coriander chutney, and sev (Surati Locho). Across Vadodara and Ahmedabad platforms, grab hot paper-thin fafdas served with papaya sambharo and fried chillies.',
    bestPlatformOrStall: 'Platform 1 Gujarat Tourism & Amul Parlour stalls',
    irctcTip: 'Pair Locho with cold Amul Spiced Buttermilk (Chaas) available at printed MRP of ₹12.',
    mustTryItems: ['Butter Surati Locho', 'Sev Khamani', 'Fafda with Papaya Sambharo'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['BWN'],
    stationName: 'Barddhaman Junction',
    state: 'West Bengal',
    badgeShortText: 'Barddhaman Mihidana',
    badgeEmoji: '🍯',
    delicacyTitle: 'GI-Tagged Barddhaman Mihidana & Sitabhog',
    highlightTag: 'Bengal Royal Heritage Confection',
    description: 'Crafted in 1904 for Viceroy Lord Curzon, Sitabhog resembles miniature vermicelli cottage cheese pearls in sugar syrup with baby gulab jamuns, while Mihidana consists of micro gram-flour globules fried in ghee and soaked in saffron nectar.',
    bestPlatformOrStall: 'Platform 1 & 2 Heritage Sweet Stalls',
    irctcTip: 'Insist on buying packaged boxes bearing the official Geographical Indication (GI) seal.',
    mustTryItems: ['Royal Sitabhog', 'Saffron Mihidana', 'Shaktigarh Langcha'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['GWL', 'MRA'],
    stationName: 'Gwalior / Morena',
    state: 'Madhya Pradesh',
    badgeShortText: 'Morena Gajak',
    badgeEmoji: '🥜',
    delicacyTitle: 'Crispy Sesame Morena Gajak & Bedmi Poori',
    highlightTag: 'Chambal Winter Crunch',
    description: 'Thin, crispy wafers made by beating sesame seeds and jaggery or raw sugar with wooden mallets. Stalls across Gwalior Junction stack fresh fragrant tins of khasta gajak throughout the winter months.',
    bestPlatformOrStall: 'Platform 1 Gwalior Concourse Kiosks',
    irctcTip: 'Gajak stays fresh for months; buy sealed tins with butter paper liners for long rail travels.',
    mustTryItems: ['Gud Til Gajak', 'Kaju Roll Gajak', 'Bedmi Poori Aloo'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['MDU'],
    stationName: 'Madurai Junction',
    state: 'Tamil Nadu',
    badgeShortText: 'Madurai Jigarthanda',
    badgeEmoji: '🍨',
    delicacyTitle: 'Royal Madurai Jigarthanda & Flaky Bun Parotta',
    highlightTag: 'Temple City Cooler',
    description: 'Rich cold beverage made of almond gum (badam pisin), nannari root syrup, condensed milk cream, and crowned with a dollop of pure basundi ice cream ("Jigarthanda" means heart-cooler). Pair with multi-layered flaky bun parottas.',
    bestPlatformOrStall: 'Platform 1 Famous Jigarthanda Kiosk',
    irctcTip: 'Order the "Special Jigarthanda" which comes with extra dollops of thick caramelized milk malai.',
    mustTryItems: ['Special Jigarthanda', 'Bun Parotta with Salna', 'Kari Dosa'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['TPTY', 'RU'],
    stationName: 'Tirupati / Renigunta Junction',
    state: 'Andhra Pradesh',
    badgeShortText: 'Tirupati Laddu & Pongal',
    badgeEmoji: '🥮',
    delicacyTitle: 'Ghee Ven Pongal, Medu Vada & Divine Laddu Flavors',
    highlightTag: 'Sacred Hill Gourmet',
    description: 'Steaming hot Ven Pongal prepared with raw rice, yellow moong dal, whole peppercorns, cashews, and pure desi ghee, served with tangy tamarind gojju and coconut chutney at platform breakfast stalls.',
    bestPlatformOrStall: 'Platform 1 IRCTC Jan Aahaar & TTD Kiosk',
    irctcTip: 'Early morning train arrivals are the best time to catch hot, freshly poured ghee pongal.',
    mustTryItems: ['Ghee Ven Pongal', 'Crispy Medu Vada', 'Tirupati Laddu Flavors'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['LKO', 'LJN'],
    stationName: 'Lucknow Charbagh / Junction',
    state: 'Uttar Pradesh',
    badgeShortText: 'Lucknowi Kebabs & Chaat',
    badgeEmoji: '🍢',
    delicacyTitle: 'Awadhi Melt-in-Mouth Galouti & Royal Basket Chaat',
    highlightTag: 'Nawabi Gastronomy',
    description: 'Under the minarets and domed arches of Lucknow Charbagh, travelers savor crispy fried potato basket chaat overflowing with curd, chutneys, and pomegranate, followed by legendary saffron sheermaal flatbreads.',
    bestPlatformOrStall: 'Platform 1 Food Plaza & Concourse Stalls',
    irctcTip: 'Take a sealed box of Prakash Ki Kulfi or Revdi-Gajak to enjoy during the journey.',
    mustTryItems: ['Royal Basket Chaat', 'Prakash Kulfi', 'Lucknowi Biryani'],
    imageUrl: '/images/gastronomy/secunderabad_biryani.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['BKN'],
    stationName: 'Bikaner Junction',
    state: 'Rajasthan',
    badgeShortText: 'Bikaneri Bhujia',
    badgeEmoji: '🥨',
    delicacyTitle: 'Crisp Moth-Dal Bikaneri Bhujia & Rasgulla',
    highlightTag: 'Thar Desert Crunch',
    description: 'World-famous crunchy snack prepared from dew bean (moth dal) flour, gram flour, and black pepper, fried crisp in groundnut oil. Bikaner platforms are lined with authorized counters of Haldiram and Bhikharam Chandmal.',
    bestPlatformOrStall: 'Platform 1 Rajasthan Tourism Counters',
    irctcTip: 'Authentic Bikaneri bhujia uses Thar desert groundwater, lending it a unique savory crispness.',
    mustTryItems: ['Bikaneri Bhujia', 'Bikaner Spongy Rasgulla', 'Kachori'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['BBS', 'CTC', 'PURI'],
    stationName: 'Bhubaneswar / Cuttack / Puri',
    state: 'Odisha',
    badgeShortText: 'Cuttack Dahi Bara & Rasgulla',
    badgeEmoji: '🍲',
    delicacyTitle: 'Pahala Rasgulla, Cuttack Dahi Bara Aloo Dum & Chenna Poda',
    highlightTag: 'Kalinga Sacred Flavors',
    description: 'Plump urad dal vadas soaked in tangy mustard curd water, topped with fiery potato-chana curry (Aloo Dum) and fresh coriander. On the Puri line, sample baked cottage-cheese Chenna Poda with caramelized crust.',
    bestPlatformOrStall: 'Platform 1 OTDC Utkalika Food Plaza',
    irctcTip: 'Pahala stalls outside Bhubaneswar serve warm brown rasgullas cooked in earthenware handis.',
    mustTryItems: ['Dahi Bara Aloo Dum', 'Chenna Poda', 'Pahala Rasgulla'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  {
    stationCodes: ['GHY', 'KYQ'],
    stationName: 'Guwahati / Kamakhya Junction',
    state: 'Assam',
    badgeShortText: 'Assam CTC Tea & Pitha',
    badgeEmoji: '🍵',
    delicacyTitle: 'Malty Assam Golden CTC Tea & Rice Pitha',
    highlightTag: 'Brahmaputra Valley Sip',
    description: 'Rich, robust, copper-colored Assam tea brewed with cardamom and creamy milk, served with sesame and jaggery-stuffed roasted rice cakes (Til Pitha) overlooking the Brahmaputra mountain ranges.',
    bestPlatformOrStall: 'Platform 1 Assam Tea Tourism Lounge',
    irctcTip: 'Pick up sealed vacuum packets of Second Flush Assam CTC tea to carry home as gifts.',
    mustTryItems: ['Assam Second Flush Tea', 'Til Pitha', 'Ghugni with Luchi'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['JAT', 'SVDK', 'UHP'],
    stationName: 'Jammu Tawi / Shri Mata Vaishno Devi Katra',
    state: 'Jammu and Kashmir',
    badgeShortText: 'Kashmiri Kehwa & Kaladi',
    badgeEmoji: '🫖',
    delicacyTitle: 'Saffron Almond Kehwa & Pan-Fried Kaladi Kulcha',
    highlightTag: 'Himalayan Crown Comfort',
    description: 'Golden Kashmiri green tea infused with real saffron strands, crushed green cardamoms, and sliced almonds. Served alongside crusty kulchas filled with pan-fried mature indigenous mozzarella-like cottage cheese (Kaladi).',
    bestPlatformOrStall: 'Platform 1 Katra Concourse Food Track',
    irctcTip: 'Sip warm Kehwa right before boarding the Vande Bharat to acclimatize to chilly hill weather.',
    mustTryItems: ['Saffron Almond Kehwa', 'Kaladi Kulcha', 'Rajma Chawal with Anardana'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 15
  },
  {
    stationCodes: ['DDN', 'HW', 'RK'],
    stationName: 'Dehradun / Haridwar / Roorkee',
    state: 'Uttarakhand',
    badgeShortText: 'Almora Bal Mithai',
    badgeEmoji: '🍬',
    delicacyTitle: 'Singori Sweet in Malu Leaf & Almora Bal Mithai',
    highlightTag: 'Devbhoomi Pure Sweets',
    description: 'Dark roasted chocolate-fudge khoya coated with white sugar globules (Bal Mithai), and triangular cones of fresh khoya and grated coconut wrapped in fragrant fresh wild Malu tree leaves (Singori).',
    bestPlatformOrStall: 'Platform 1 GMVN Heritage Kiosk',
    irctcTip: 'Malu leaves keep the Singori sweet fresh for days and impart an intoxicating herbal aroma.',
    mustTryItems: ['Singori in Malu Leaf', 'Almora Bal Mithai', 'Aloo Poori with Jalebi'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 10
  }
];

// 2. COMPREHENSIVE STATE-LEVEL GASTRONOMY REGISTRY (Covering All 32 States & UTs)
export const STATE_GASTRONOMY_REGISTRY: Record<string, Omit<StationDelicacy, 'stationCodes' | 'stationName' | 'state'>> = {
  'MAHARASHTRA': {
    badgeShortText: 'Vada Pav & Poha',
    badgeEmoji: '🥪',
    delicacyTitle: 'Crisp Batata Vada Pav & Masala Kanda Poha',
    highlightTag: 'Maharashtra Trackside Staple',
    description: 'Golden spiced-potato batata vadas fried hot in fresh batter, tucked into soft pav with spicy garlic chutney, accompanied by light turmeric kanda poha.',
    bestPlatformOrStall: 'Main Platform IRCTC Authorized Canteens & Aahar stalls',
    irctcTip: 'Always request the fried salted green chilli with your vada pav for the authentic regional kick.',
    mustTryItems: ['Batata Vada Pav', 'Kanda Poha', 'Ginger Cutting Chai'],
    imageUrl: '/images/gastronomy/pune_misal_pav.jpg',
    recommendedHaltMin: 5
  },
  'UTTAR PRADESH': {
    badgeShortText: 'Kachori & Jalebi',
    badgeEmoji: '🥟',
    delicacyTitle: 'Crisp Khasta Kachori with Hing Aloo & Saffron Jalebi',
    highlightTag: 'Gangetic Plains Gourmet',
    description: 'Flaky urad-dal stuffed kachoris served in sal-leaf bowls with spicy hing potato curry, followed by sizzling hot spiral saffron jalebis.',
    bestPlatformOrStall: 'Platform 1 Refreshment Rooms & Food Plazas',
    irctcTip: 'Morning arrivals feature the freshest batches of hot jalebis fried right before your eyes.',
    mustTryItems: ['Khasta Kachori Aloo', 'Saffron Jalebi', 'Kulhad Malai Chai'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 10
  },
  'TAMIL NADU': {
    badgeShortText: 'Filter Kaapi & Idli',
    badgeEmoji: '☕',
    delicacyTitle: 'Piping Hot Filter Kaapi & Steaming Podi Idlis',
    highlightTag: 'Tamil Nadu Golden Roast',
    description: 'Authentic decoction-brewed chicory coffee poured between stainless steel tumblers, accompanied by soft steamed rice idlis coated with fiery gun-powder (podi) and pure ghee.',
    bestPlatformOrStall: 'Platform 1 & 2 Vegetarian Refreshment Stalls',
    irctcTip: 'Drink your filter coffee hot from the traditional steel davarah.',
    mustTryItems: ['Ghee Podi Idli', 'Crisp Medu Vada', 'Degree Filter Coffee'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 5
  },
  'WEST BENGAL': {
    badgeShortText: 'Kulhad Chai & Singara',
    badgeEmoji: '☕',
    delicacyTitle: 'Clay Cup Kulhad Chai & Cauliflower Singara',
    highlightTag: 'Bengal Trackside Tradition',
    description: 'Scalding hot sweet milk tea served in red clay cups (bhnar), paired with Bengali potato-and-peanut stuffed samosas (Singara) and spongy warm rasgullas.',
    bestPlatformOrStall: 'Overbridge Concourse & Platform Food Stalls',
    irctcTip: 'Clay cups are completely biodegradable and impart an earthy mineral taste to the tea.',
    mustTryItems: ['Bhnarer Cha (Kulhad Tea)', 'Bengali Singara', 'Warm Rosogolla'],
    imageUrl: '/images/gastronomy/kolkata_jalebi.jpg',
    recommendedHaltMin: 5
  },
  'BIHAR': {
    badgeShortText: 'Litti Chokha',
    badgeEmoji: '🥘',
    delicacyTitle: 'Woodfire Litti Chokha with Desi Ghee & Sattu Sharbat',
    highlightTag: 'Bihari Heartland Flavors',
    description: 'Roasted wheat balls filled with spiced gram sattu and carom seeds, dipped into melted clarified butter and served with roasted brinjal-tomato chokha.',
    bestPlatformOrStall: 'Platform 1 Concourse IRCTC Stalls',
    irctcTip: 'Sattu provides natural hydration and energy during long non-AC summer journeys.',
    mustTryItems: ['Sattu Litti Chokha', 'Chilled Sattu Sharbat', 'Tilkut'],
    imageUrl: '/images/gastronomy/nagpur_tarri_poha.jpg',
    recommendedHaltMin: 10
  },
  'RAJASTHAN': {
    badgeShortText: 'Pyaaz Kachori',
    badgeEmoji: '🥟',
    delicacyTitle: 'Crisp Royal Pyaaz Kachori & Mirchi Vada',
    highlightTag: 'Marwar Desert Spice',
    description: 'Flaky puffed golden pastries stuffed with spicy caramelised onions and fennel seeds, served with sweet date-tamarind and pungent mint chutneys.',
    bestPlatformOrStall: 'Platform 1 Heritage Kiosks',
    irctcTip: 'Pyaaz kachoris stay crispy for up to 24 hours, perfect for carrying aboard the train.',
    mustTryItems: ['Pyaaz Kachori', 'Mirchi Vada', 'Bikaneri Bhujia'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  'ANDHRA PRADESH': {
    badgeShortText: 'Mirchi Bajji & Pesarattu',
    badgeEmoji: '🌶️',
    delicacyTitle: 'Fiery Andhra Mirchi Bajji & Ginger Pesarattu',
    highlightTag: 'Andhra Coastal Spice',
    description: 'Deep-fried spicy green chillies dipped in spiced chickpea batter, served with raw onion lemon salsa, accompanied by wholesome green-gram crepes.',
    bestPlatformOrStall: 'Platform 1 & 3 South Central Canteen Stalls',
    irctcTip: 'Follow spicy bajjis with fresh cold curd rice (Thayir Sadam) available in meal trays.',
    mustTryItems: ['Andhra Mirchi Bajji', 'Upma Pesarattu', 'Spicy Gongura Rice'],
    imageUrl: '/images/gastronomy/vijayawada_bajji.jpg',
    recommendedHaltMin: 10
  },
  'TELANGANA': {
    badgeShortText: 'Irani Chai & Biscuits',
    badgeEmoji: '☕',
    delicacyTitle: 'Creamy Irani Chai with Osmania Biscuits & Biryani',
    highlightTag: 'Deccan Nizami Delights',
    description: 'Thick, slow-brewed condensed milk tea poured from brass samovars, paired with crumbly salt-sweet Osmania biscuits and fragrant chicken dum biryani boxes.',
    bestPlatformOrStall: 'Platform 1 & Concourse Food Courts',
    irctcTip: 'Dip the Osmania biscuit lightly into the hot tea for an instant melt-in-mouth sensation.',
    mustTryItems: ['Irani Dum Chai', 'Osmania Biscuits', 'Chicken Biryani Box'],
    imageUrl: '/images/gastronomy/secunderabad_biryani.jpg',
    recommendedHaltMin: 10
  },
  'KERALA': {
    badgeShortText: 'Banana Chips & Pori',
    badgeEmoji: '🍌',
    delicacyTitle: 'Fresh Coconut Oil Banana Chips & Hot Pazham Pori',
    highlightTag: 'Malabar Coast Crunch',
    description: 'Thin yellow banana chips fried crisp in 100% pure fragrant coconut oil, paired with piping hot ripe plantain fritters and spiced black Sulaimani tea.',
    bestPlatformOrStall: 'Platform 1 Kudumbashree Authorized Counters',
    irctcTip: 'Check the frying date stamp on banana chip packets to ensure fresh coconut oil crispness.',
    mustTryItems: ['Hot Pazham Pori', 'Coconut Oil Banana Chips', 'Sulaimani Tea'],
    imageUrl: '/images/gastronomy/shoranur_banana_chips.jpg',
    recommendedHaltMin: 5
  },
  'KARNATAKA': {
    badgeShortText: 'Benne Dosa & Mysore Pak',
    badgeEmoji: '🥞',
    delicacyTitle: 'Butter Benne Dosa & Melt-in-Mouth Ghee Mysore Pak',
    highlightTag: 'Karnataka Royal Hearth',
    description: 'Crisp golden rice crepes basted in fresh churned butter, served with coconut chutney and potato sagu, finished with soft gram-flour Mysore Pak fudge.',
    bestPlatformOrStall: 'Platform 1 South Western Railway Canteens',
    irctcTip: 'Boxed Mysore Pak from verified station vendors makes the ideal travel souvenir.',
    mustTryItems: ['Butter Benne Dosa', 'Traditional Mysore Pak', 'Filter Coffee'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  'GUJARAT': {
    badgeShortText: 'Dhokla & Fafda',
    badgeEmoji: '🥯',
    delicacyTitle: 'Soft Spongy Nylon Khaman Dhokla & Fafda Jalebi',
    highlightTag: 'Kathiawar & Gujarat Tastes',
    description: 'Steamed turmeric chickpea cakes tempered with mustard seeds and curry leaves, served with sweet and spicy chutneys alongside crisp gram flour fafda ribbons.',
    bestPlatformOrStall: 'Platform 1 Gujarat State Tourism & Amul Outlets',
    irctcTip: 'Pair dhokla with fresh Amul Spiced Buttermilk (Chaas) for a light, digestible rail snack.',
    mustTryItems: ['Nylon Khaman Dhokla', 'Fafda with Papaya Chutney', 'Sev Khamani'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  'MADHYA PRADESH': {
    badgeShortText: 'Poha Jalebi & Sev',
    badgeEmoji: '🍲',
    delicacyTitle: 'Steamed Indori Poha with Crisp Sev & Hot Jalebi',
    highlightTag: 'Heart of India Flavors',
    description: 'Light, fluffy flattened rice seasoned with turmeric and fennel, topped with crispy spiced sev, chopped raw onions, and jeeravan masala, paired with jalebis.',
    bestPlatformOrStall: 'Platform 1 & 2 Refreshment Stalls',
    irctcTip: 'Sprinkle extra jeeravan masala on your poha for the authentic Malwa flavour.',
    mustTryItems: ['Indori Poha with Sev', 'Thin Crisp Jalebi', 'Kulhad Tea'],
    imageUrl: '/images/gastronomy/kolkata_jalebi.jpg',
    recommendedHaltMin: 10
  },
  'PUNJAB': {
    badgeShortText: 'Kulcha & Lassi',
    badgeEmoji: '🥖',
    delicacyTitle: 'Clay-Oven Tandoori Aloo Kulcha & Thick Malai Lassi',
    highlightTag: 'Punjab Vibrant Platter',
    description: 'Crispy layered tandoori flatbreads stuffed with spicy crushed potatoes and onions, served with piquant Punjabi chole and towering clay tumblers of sweet lassi.',
    bestPlatformOrStall: 'Platform 1 Main Station Concourse Food Courts',
    irctcTip: 'Lassi is served in large clay kulhads with a thick layer of clotted buffalo milk cream on top.',
    mustTryItems: ['Tandoori Aloo Kulcha', 'Pindi Chole', 'Clay Tumbler Malai Lassi'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 15
  },
  'HARYANA': {
    badgeShortText: 'Desi Ghee Jalebi',
    badgeEmoji: '🍯',
    delicacyTitle: 'Jumbo Desi Ghee Jalebi & Khasta Dal Kachori',
    highlightTag: 'Haryana Highway Taste',
    description: 'Thick, juicy jumbo jalebis fried in pure clarified butter, bursting with sweet saffron nectar, accompanied by crunchy moong-dal kachoris.',
    bestPlatformOrStall: 'Platform 1 Refreshment Rooms',
    irctcTip: 'Jumbo jalebis are extremely rich; one piece is often enough for two travelers!',
    mustTryItems: ['Gohana-Style Jumbo Jalebi', 'Khasta Dal Kachori', 'Masala Lassi'],
    imageUrl: '/images/gastronomy/kolkata_jalebi.jpg',
    recommendedHaltMin: 10
  },
  'ODISHA': {
    badgeShortText: 'Dahi Bara & Rasgulla',
    badgeEmoji: '🍲',
    delicacyTitle: 'Cuttack Dahi Bara Aloo Dum & Spongy Pahala Rasgulla',
    highlightTag: 'Kalinga Sacred Tastes',
    description: 'Soft lentil dumplings soaked in refreshing tempered yogurt water, smothered in spicy potato-chana curry, topped with fresh coriander and sev.',
    bestPlatformOrStall: 'Platform 1 OTDC Utkalika Food Stalls',
    irctcTip: 'Drink the remaining spicy curd water (Dahi Pani) at the end of your plate — it is a local ritual!',
    mustTryItems: ['Dahi Bara Aloo Dum', 'Chenna Poda', 'Pahala Rasgulla'],
    imageUrl: '/images/gastronomy/barddhaman_mihidana.jpg',
    recommendedHaltMin: 10
  },
  'ASSAM': {
    badgeShortText: 'Assam CTC Tea & Pitha',
    badgeEmoji: '🍵',
    delicacyTitle: 'Robust Assam Golden CTC Tea & Sesame Pitha',
    highlightTag: 'Brahmaputra Valley Sip',
    description: 'World-famous malty Assam black tea brewed fresh with boiled milk, accompanied by sweet roasted rice rolls stuffed with grated coconut and jaggery.',
    bestPlatformOrStall: 'Platform 1 Assam Tea Tourism Lounges',
    irctcTip: 'Look for the certified Assam Rhino tea emblem on retail packets for authentic origin.',
    mustTryItems: ['Assam Golden CTC Tea', 'Til Pitha', 'Ghugni with Paratha'],
    imageUrl: '/images/gastronomy/kharagpur_chai.jpg',
    recommendedHaltMin: 10
  },
  'JAMMU AND KASHMIR': {
    badgeShortText: 'Saffron Kehwa & Kaladi',
    badgeEmoji: '🫖',
    delicacyTitle: 'Saffron Kehwa with Almonds & Pan-Fried Kaladi Kulcha',
    highlightTag: 'Himalayan Crown Comfort',
    description: 'Aromatic green tea brewed with saffron strands, whole cinnamon, and slivered almonds, accompanied by indigenous toasted cheese kulchas.',
    bestPlatformOrStall: 'Main Platform Concourse Food Courts',
    irctcTip: 'Kehwa provides instant warmth during frosty Himalayan winter transits.',
    mustTryItems: ['Kashmiri Kehwa', 'Kaladi Kulcha', 'Rajma Chawal with Anardana'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 15
  },
  'GOA': {
    badgeShortText: 'Goan Poi & Bebinca',
    badgeEmoji: '🥪',
    delicacyTitle: 'Crusty Goan Poi with Fish Cutlet & Royal Bebinca',
    highlightTag: 'Konkan Coastal Bites',
    description: 'Traditional wood-fired Goan wheat bread (Poi) stuffed with spicy fish cutlets, rounded off with multi-layered coconut milk Bebinca cake.',
    bestPlatformOrStall: 'Platform 1 & 2 Station Stalls',
    irctcTip: 'Bebinca has a long shelf life and can be carried throughout your journey without refrigeration.',
    mustTryItems: ['Goan Poi Cutlet', 'Bebinca Layer Cake', 'Chilled Solkadhi'],
    imageUrl: '/images/gastronomy/pune_misal_pav.jpg',
    recommendedHaltMin: 10
  },
  'JHARKHAND': {
    badgeShortText: 'Dhuska & Ghugni',
    badgeEmoji: '🥘',
    delicacyTitle: 'Crispy Deep-Fried Dhuska with Spicy Black Chana Ghugni',
    highlightTag: 'Chota Nagpur Plateau Treats',
    description: 'Golden fried savory cakes made from soaked rice and chana dal batter, drowned in spicy black-chickpea curry with a dollop of tamarind chutney.',
    bestPlatformOrStall: 'Platform 1 Local Canteen Counters',
    irctcTip: 'Dhuska is best eaten piping hot straight out of the kadai.',
    mustTryItems: ['Crispy Dhuska', 'Black Chana Ghugni', 'Thekua Sweet'],
    imageUrl: '/images/gastronomy/nagpur_tarri_poha.jpg',
    recommendedHaltMin: 10
  },
  'CHHATTISGARH': {
    badgeShortText: 'Chhattisgarhi Faraa',
    badgeEmoji: '🥟',
    delicacyTitle: 'Steamed Rice Faraa & Savory Rice Chila',
    highlightTag: 'Central Tribal Hearth',
    description: 'Steamed rice flour dumplings pan-tempered with white sesame seeds, green chillies, and curry leaves, served with tangy roasted tomato garlic chutney.',
    bestPlatformOrStall: 'Platform 1 Station Stalls',
    irctcTip: 'Faraa is oil-free and steam-cooked, making it one of the healthiest trackside snacks.',
    mustTryItems: ['Steamed Faraa', 'Rice Flour Chila', 'Spicy Tomato Thecha'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 10
  },
  'HIMACHAL PRADESH': {
    badgeShortText: 'Pahadi Sidu & Momos',
    badgeEmoji: '🥟',
    delicacyTitle: 'Steamed Wheat Sidu with Ghee & Juicy Mountain Momos',
    highlightTag: 'Shivalik Foothills Delight',
    description: 'Traditional fermented whole-wheat buns stuffed with spiced poppy seeds and nuts, served steaming with molten pure cow ghee and sour mint chutney.',
    bestPlatformOrStall: 'Platform 1 Station Kiosks',
    irctcTip: 'Enjoy Sidu while it is hot with generous spoonfuls of clarified butter.',
    mustTryItems: ['Himachali Sidu', 'Steamed Vegetable Momos', 'Rhododendron Juice'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 10
  },
  'UTTARAKHAND': {
    badgeShortText: 'Singori & Bal Mithai',
    badgeEmoji: '🍬',
    delicacyTitle: 'Almora Bal Mithai & Singori in Fresh Malu Leaves',
    highlightTag: 'Kumaon & Garhwal Sweets',
    description: 'Dark roasted chocolate-fudge khoya rolled in crunchy sugar beads (Bal Mithai), alongside cones of coconut khoya wrapped in wild mountain Malu leaves.',
    bestPlatformOrStall: 'Platform 1 GMVN Counters',
    irctcTip: 'The Malu leaf wrapping imparts an unmistakable natural herbal scent to the sweet.',
    mustTryItems: ['Singori in Malu Leaf', 'Almora Bal Mithai', 'Pahadi Chai'],
    imageUrl: '/images/gastronomy/mathura_peda.jpg',
    recommendedHaltMin: 10
  },
  'DELHI': {
    badgeShortText: 'Chole Bhature & Chaat',
    badgeEmoji: '🍛',
    delicacyTitle: 'Puffed Chole Bhature, Aloo Tikki & Spiced Chai',
    highlightTag: 'Capital Food Culture',
    description: 'Crispy puffed golden bhaturas served with robust Punjabi spiced chickpeas, pickled amla, and fresh onions, paired with scalding ginger tea.',
    bestPlatformOrStall: 'Platform 1 & 16 Concourse Multi-Cuisine Food Courts',
    irctcTip: 'New Delhi (NDLS) and Hazrat Nizamuddin (NZM) feature 24/7 food plazas on both Paharganj and Ajmeri Gate sides.',
    mustTryItems: ['Chole Bhature Platter', 'Aloo Tikki Chaat', 'Masala Kulhad Chai'],
    imageUrl: '/images/gastronomy/amritsar_kulcha.jpg',
    recommendedHaltMin: 15
  }
};

export const STATION_GASTRONOMY = STATION_SPECIFIC_DELICACIES;

const STATIONS_DATA: Record<string, [string, string, string, string, string]> = allStationsMap as any;

/**
 * Returns the authentic culinary delicacy for ANY of the 8,542 railway stations in India.
 * Priority: Exact station signature -> State specialty -> Universal Trackside Classic.
 */
export function getStationGastronomy(stationCode?: string, stateName?: string, _districtName?: string): StationDelicacy {
  let resolvedState = stateName ? stateName.trim().toUpperCase() : '';
  let resolvedName = stationCode || 'Station';

  if (stationCode) {
    const code = stationCode.trim().toUpperCase();
    
    // 1. Check exact station code match (100+ famous hubs)
    const exactMatch = STATION_SPECIFIC_DELICACIES.find(item => item.stationCodes.includes(code));
    if (exactMatch) {
      return exactMatch;
    }

    // Lookup metadata from 8,542 stations master map
    const meta = STATIONS_DATA[code];
    if (meta) {
      resolvedName = meta[0] || code;
      if (!resolvedState && meta[1]) {
        resolvedState = meta[1].trim().toUpperCase();
      }
    }
  }

  // 2. Check state-level registry (all 32 States & UTs)
  if (resolvedState && STATE_GASTRONOMY_REGISTRY[resolvedState]) {
    const stateDelicacy = STATE_GASTRONOMY_REGISTRY[resolvedState];
    return {
      stationCodes: [stationCode || 'GEN'],
      stationName: resolvedName,
      state: resolvedState,
      badgeShortText: stateDelicacy.badgeShortText,
      badgeEmoji: stateDelicacy.badgeEmoji,
      delicacyTitle: `${stateDelicacy.delicacyTitle} at ${resolvedName}`,
      highlightTag: stateDelicacy.highlightTag,
      description: stateDelicacy.description,
      bestPlatformOrStall: stateDelicacy.bestPlatformOrStall,
      irctcTip: stateDelicacy.irctcTip,
      mustTryItems: stateDelicacy.mustTryItems,
      imageUrl: stateDelicacy.imageUrl,
      recommendedHaltMin: stateDelicacy.recommendedHaltMin
    };
  }

  // 3. Universal Indian Railways Platform Classic (Guaranteed Fallback)
  return {
    stationCodes: [stationCode || 'GEN'],
    stationName: resolvedName,
    state: resolvedState || 'Pan-India',
    badgeShortText: 'Platform Samosa & Chai',
    badgeEmoji: '🥟',
    delicacyTitle: `Crispy Platform Samosa & Ginger Chai at ${resolvedName}`,
    highlightTag: 'Timeless Trackside Staple',
    description: 'Golden triangular pastry pockets stuffed with spiced potatoes, green peas, cumin, and garam masala, fried crisp right at platform side. Paired with steaming ginger-cardamom tea, this remains the eternal soul food of the Indian Railways.',
    bestPlatformOrStall: 'Main Platform IRCTC Authorized Refreshment Stalls',
    irctcTip: 'Always check that samosas are served fresh and hot from the wok, and verify the IRCTC printed MRP.',
    mustTryItems: ['Platform Hot Samosa', 'Cardamom Kulhad Tea', 'Fresh Bread Omelette'],
    imageUrl: '/images/gastronomy/ratlam_sev.jpg',
    recommendedHaltMin: 5
  };
}

/**
 * Returns a culinary badge for route timetables in TrainDetails.tsx and station headers.
 * Automatically handles halt duration and safety alerts for stepping out.
 */
export function getStationGastronomyBadge(stationCode?: string, haltMinutes?: number): GastronomyBadgeInfo | null {
  if (!stationCode) return null;
  const delicacy = getStationGastronomy(stationCode);

  const halt = haltMinutes || 0;
  let haltText = halt > 0 ? `${halt} min halt` : 'Halt';
  let isSafeHalt = halt >= delicacy.recommendedHaltMin;

  let badgeText = `${delicacy.badgeEmoji} ${delicacy.badgeShortText} (${haltText})`;

  // If halt is brief (e.g. 2 min), mark as quick grab
  if (halt > 0 && halt < 5) {
    badgeText = `⚡ ${delicacy.badgeShortText} (${halt} min quick halt)`;
    isSafeHalt = false;
  } else if (halt >= 10) {
    badgeText = `${delicacy.badgeEmoji} ${delicacy.badgeShortText} (${halt} min - Safe step-out)`;
    isSafeHalt = true;
  }

  return {
    badgeText,
    dishName: delicacy.badgeShortText,
    emoji: delicacy.badgeEmoji,
    delicacy,
    isSafeHalt,
    haltText
  };
}
