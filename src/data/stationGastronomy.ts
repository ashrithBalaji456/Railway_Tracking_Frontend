export interface StationDelicacy {
  stationCodes: string[];
  stationName: string;
  state: string;
  delicacyTitle: string;
  highlightTag: string;
  description: string;
  bestPlatformOrStall: string;
  irctcTip: string;
  mustTryItems: string[];
  imageUrl: string;
}

export const STATION_GASTRONOMY: StationDelicacy[] = [
  {
    stationCodes: ['RTM'],
    stationName: 'Ratlam Junction',
    state: 'Madhya Pradesh',
    delicacyTitle: 'World-Famous Ratlam Sev & Steaming Poha',
    highlightTag: 'Legendary Station Bite',
    description: 'No passenger train crosses Ratlam without travelers rushing to the platform stalls. Spiced with clove (laung) and black pepper, crisp Ratlam Sev served on fluffy turmeric poha with a squeeze of fresh lemon and spicy jeeravan powder is the quintessence of Indian platform snacks.',
    bestPlatformOrStall: 'Platforms 1 & 4 Refreshment Kiosks',
    irctcTip: 'Ask for the extra hot "Laung Sev" sample packet before buying bulk boxes to carry home.',
    mustTryItems: ['Laung Sev Poha', 'Garadu (seasonal)', 'Ratlam Sev Packets'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Poha_with_sev_garnishing.jpg/960px-Poha_with_sev_garnishing.jpg'
  },
  {
    stationCodes: ['CSMT', 'MMCT', 'BDTS', 'PNVL', 'DR', 'TNA', 'KYN'],
    stationName: 'Mumbai Terminals (CSMT / Central / Dadar / Kalyan)',
    state: 'Maharashtra',
    delicacyTitle: 'Piping Hot Batata Vada Pav & Cutting Chai',
    highlightTag: 'The Mumbai Pulse',
    description: 'Crisp golden spiced-potato fritters enclosed in soft pav buns with fiery red garlic chutney and salted green chillies. Paired with aromatic ginger cutting chai, it has powered millions of commuters across suburban and mainline platforms for over a century.',
    bestPlatformOrStall: 'Aahar Stall / Platform 1 near suburban concourse',
    irctcTip: 'Pair it with authentic Solkadhi or Masala Chaas during humid coastal runs.',
    mustTryItems: ['Batata Vada Pav', 'Misal Pav', 'Cutting Ginger Chai'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Vada_Pav-Indian_street_food.JPG/960px-Vada_Pav-Indian_street_food.JPG'
  },
  {
    stationCodes: ['KGP'],
    stationName: 'Kharagpur Junction',
    state: 'West Bengal',
    delicacyTitle: 'World-Longest Platform Kulhad Chai & Dim-er Devil',
    highlightTag: 'South Eastern Rail Heritage',
    description: 'Kharagpur boasts one of the longest railway platforms in the world. Sipping scalding clay-cup (kulhad) milk tea while savoring spicy Bengali egg chops (Dim-er Devil) and vegetable croquettes as long-distance trains refuel is an unforgettable ritual.',
    bestPlatformOrStall: 'Platform 1 & 2 Center Overbridge Concourse',
    irctcTip: 'Discard clay kulhads into dedicated dry bins — they are 100% biodegradable and eco-friendly.',
    mustTryItems: ['Earthen Kulhad Milk Tea', 'Dim-er Devil (Egg Chop)', 'Singara'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Indian_tea_in_a_clay_pot.jpg/960px-Indian_tea_in_a_clay_pot.jpg'
  },
  {
    stationCodes: ['BZA'],
    stationName: 'Vijayawada Junction',
    state: 'Andhra Pradesh',
    delicacyTitle: 'Crunchy Mirchi Bajji & Steaming Idli-Pesarattu',
    highlightTag: 'Fiery Andhra Flavors',
    description: 'As South India’s busiest crossroads along the Krishna River, Vijayawada’s platforms waft with the irresistible fragrance of deep-fried banana peppers stuffed with ajwain and lemon (Mirchi Bajji) and golden green-gram Pesarattu filled with spiced upma.',
    bestPlatformOrStall: 'Platform 1, 6 & 7 IRCTC Jan Aahaar & Balaji Fast Food',
    irctcTip: 'Grab a bottle of cool Guntur buttermilk right after the mirchi bajji to tame the fiery spice.',
    mustTryItems: ['Guntur Mirchi Bajji', 'Pesarattu Upma', 'Piping Hot Filter Coffee'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Mirchi_bajji.jpg/960px-Mirchi_bajji.jpg'
  },
  {
    stationCodes: ['CNB'],
    stationName: 'Kanpur Central',
    state: 'Uttar Pradesh',
    delicacyTitle: 'Iconic Thaggu ke Laddu & Malai Rabdi Kulfi',
    highlightTag: 'Heritage Awadhi Confection',
    description: 'Home to the humorous slogan "Aisa Koi Saga Nahi Jise Humne Thaga Nahi" (No relative left un-conned!), these rich semolina, gond, pistachio, and pure khoya laddus are legendary across Northern Railways. Pair with thick saffron rabdi kulfi.',
    bestPlatformOrStall: 'Platform 1 Main Exit Hallway & Concourse Stalls',
    irctcTip: 'Ask for the Badam Kulfi matka cups which stay chilled for up to two hours in air-conditioned coaches.',
    mustTryItems: ['Thaggu Ke Laddu', 'Special Badam Peda', 'Matka Rabdi Kulfi'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Motichoor_Laddoo.jpg/960px-Motichoor_Laddoo.jpg'
  },
  {
    stationCodes: ['JP'],
    stationName: 'Jaipur Junction',
    state: 'Rajasthan',
    delicacyTitle: 'Crisp Pyaaz Kachori & Royal Ghevar',
    highlightTag: 'Royal Marwari Heritage',
    description: 'Flaky, puffed golden pastry disks bursting with spiced onion, asafoetida, and whole coriander seeds, served alongside tangy tamarind saunth and mint chutney. In festive months, honeycombed disc Ghevar drenched in rabdi sweetens the train ride.',
    bestPlatformOrStall: 'Platform 1 Rawat / Heritage Sweets Kiosk',
    irctcTip: 'The kachoris are extremely hot inside; poke a hole and let the aromatic steam release before taking your first bite.',
    mustTryItems: ['Pyaaz Kachori', 'Mawa Kachori', 'Dal Baati Churma Meal Tray'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Pyaaz_Kachori.jpg/960px-Pyaaz_Kachori.jpg'
  },
  {
    stationCodes: ['BSB', 'BSBS', 'DDU'],
    stationName: 'Varanasi / Banaras / Pt. Deen Dayal Upadhyaya',
    state: 'Uttar Pradesh',
    delicacyTitle: 'Banarasi Tamatar Chaat & Winter Malaiyyo',
    highlightTag: 'Holy Ganga Gourmet',
    description: 'Spicy mashed tomatoes simmered with cumin, cashews, and aromatic clarified butter (ghee) topped with crispy namkeen and hing water in clay bowls. In winter mornings, sample cloud-light frothy saffron milk foam known as Malaiyyo.',
    bestPlatformOrStall: 'Platform 1 Concourse & Food Track Stalls',
    irctcTip: 'Don’t board without trying a sweet Banarasi Meetha Paan packed with gulkand and fennel.',
    mustTryItems: ['Tamatar Chaat in Kulhad', 'Banarasi Meetha Paan', 'Kachori Jalebi'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Aloo_Tikki_Chaat_at_Varanasi.jpg/960px-Aloo_Tikki_Chaat_at_Varanasi.jpg'
  },
  {
    stationCodes: ['HWH', 'SDAH', 'KOAA'],
    stationName: 'Howrah / Sealdah / Kolkata Terminals',
    state: 'West Bengal',
    delicacyTitle: 'Fish Kabiraji, Kolkata Biryani & Mishti Doi',
    highlightTag: 'City of Joy Delights',
    description: 'Under the majestic steel cantilever Howrah Bridge, railway eateries serve colonial-era Fish Kabiraji (crisp filleted bhetki cloaked in a gossamer egg net), fragrant Kolkata aloo biryani, and baked earthen bowls of sweet caramelized yoghurt (Mishti Doi).',
    bestPlatformOrStall: 'Howrah Platform 8 & 9 New Complex Food Plaza',
    irctcTip: 'Grab sealed earthen pots of Mishti Doi from authorized state dairy stalls (Mother Dairy / Haringhata).',
    mustTryItems: ['Baked Mishti Doi', 'Warm Rosogolla', 'Fish Finger Croquettes'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Mishti_Doi_in_Earthen_Pot.jpg/960px-Mishti_Doi_in_Earthen_Pot.jpg'
  },
  {
    stationCodes: ['MAS', 'MS', 'TBM', 'CBE'],
    stationName: 'Chennai Central / Egmore / Coimbatore',
    state: 'Tamil Nadu',
    delicacyTitle: 'Crispy Medu Vada, Ghee Podi Idli & Filter Kaapi',
    highlightTag: 'Southern Golden Roast',
    description: 'Nothing beats early morning arrival at Puratchi Thalaivar Dr. M.G. Ramachandran Central. Crispy urad dal vadas served with cooling coconut chutney and spicy lentil sambar, accompanied by frothy, decoction-brewed chicory filter coffee in steel tumblers.',
    bestPlatformOrStall: 'Platform 1 Grand Concourse & Platform 4 Veg Stalls',
    irctcTip: 'Ask the coffee master for "Strong Meter Coffee" poured high between davarah and tumbler.',
    mustTryItems: ['Medu Vada with Sambar', 'Ghee Podi Idlis', 'Kumbakonam Degree Coffee'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Vada_with_Chutney_and_Sambar.jpg/960px-Vada_with_Chutney_and_Sambar.jpg'
  },
  {
    stationCodes: ['PNBE', 'DNR'],
    stationName: 'Patna Junction / Danapur',
    state: 'Bihar',
    delicacyTitle: 'Charcoal-Baked Litti Chokha with Desi Ghee',
    highlightTag: 'Heartland Sustenance',
    description: 'Crusty whole-wheat dough balls stuffed with roasted gram flour (sattu), carom seeds, green chillies, and mustard oil, roasted slowly over coal embers and drowned in molten clarified butter. Served with smoky roasted eggplant and tomato chokha.',
    bestPlatformOrStall: 'Platform 1 IRCTC Food Plaza & Jan Aahaar',
    irctcTip: 'Litti stays fresh without refrigeration for over 48 hours, making it the ideal long-haul travel meal.',
    mustTryItems: ['Sattu Litti with Baingan Chokha', 'Tilkut Sweets', 'Khaja of Silao'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Litti_Chokha_traditional.jpg/960px-Litti_Chokha_traditional.jpg'
  },
  {
    stationCodes: ['SBC', 'SMVB', 'YPR', 'MYS'],
    stationName: 'Bengaluru / Yesvantpur / Mysuru',
    state: 'Karnataka',
    delicacyTitle: 'Butter Benne Dosa & Melt-in-Mouth Mysore Pak',
    highlightTag: 'Deccan Royal Flavors',
    description: 'Thick, golden, blistered rice crêpes roasted with dollops of white country butter, served with potato palya and spicy coconut chutney. Conclude your meal with warm, crumbly gram flour Mysore Pak that dissolves instantly on the palate.',
    bestPlatformOrStall: 'Platform 1 Main Entry Concourse & Refreshment Rooms',
    irctcTip: 'Pick up authentic boxed Mysore Pak certified by traditional sweet houses near Platform 1.',
    mustTryItems: ['Crispy Benne Dosa', 'Traditional Ghee Mysore Pak', 'Filter Coffee'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Dosa_chutney_sambar.jpg/960px-Dosa_chutney_sambar.jpg'
  },
  {
    stationCodes: ['AGC', 'AF'],
    stationName: 'Agra Cantt / Agra Fort',
    state: 'Uttar Pradesh',
    delicacyTitle: 'World-Renowned Agra Petha & Bedai Aloo',
    highlightTag: 'Mughal Heritage Sweets',
    description: 'Translucent ash gourd confection simmered in sweet rose, saffron, or betel leaf syrup. For breakfast, savor Bedai — crispy deep-fried lentil-stuffed pooris paired with fiery aloo sabzi and sweet jalebis.',
    bestPlatformOrStall: 'Platform 1 & 2 Station Stalls (Panchi Petha Authorized Kiosk)',
    irctcTip: 'Look for the green FSSAI and holographic seal on packaged Agra Petha to ensure authentic quality.',
    mustTryItems: ['Angoori Petha', 'Kesar Petha', 'Bedai with Hing Aloo Sabzi'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Agra_Petha_Sweet.jpg/960px-Agra_Petha_Sweet.jpg'
  }
];

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
    delicacyTitle: 'Crispy Platform Samosa & Masala Chai',
    highlightTag: 'Timeless Trackside Staple',
    description: 'Golden triangular pastry pockets stuffed with spiced potatoes, green peas, cumin, and garam masala, fried crisp right at platform side. Paired with steaming ginger-cardamom tea, this remains the eternal soul food of the Indian Railways.',
    bestPlatformOrStall: 'Main Platform IRCTC Authorized Refreshment Stalls',
    irctcTip: 'Always check that samosas are served fresh and hot from the wok, and verify the IRCTC printed MRP.',
    mustTryItems: ['Platform Hot Samosa', 'Cardamom Kulhad Tea', 'Fresh Bread Omelette'],
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Samosa_on_plate.jpg/960px-Samosa_on_plate.jpg'
  };
}
