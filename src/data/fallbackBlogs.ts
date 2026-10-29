import type { BlogArticle } from '../types';

export const FALLBACK_BLOGS: BlogArticle[] = [
  // 1. Konkan Railway & Dudhsagar
  {
    id: '1',
    slug: 'konkan-railway-scenic-odyssey',
    title: 'The Konkan Railway Odyssey: Waterfalls, Tunnels, and Coastal Horizons',
    subtitle: 'A triumph of modern civil engineering winding through 2,000 bridges, 91 tunnels, and the roaring Dudhsagar Falls in the Western Ghats.',
    category: 'Scenic Routes',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Dudhsagar_Falls_Triplet.jpg/960px-Dudhsagar_Falls_Triplet.jpg',
    author: 'Antigravity Rail Bureau',
    authorRole: 'Railway Historian & Travel Journalist',
    readTimeMinutes: 6,
    publishedDate: 'Oct 24, 2026',
    featured: true,
    tags: ['Konkan', 'Western Ghats', 'Dudhsagar', 'Goa', 'Scenic Rail'],
    quickFacts: [
      { label: 'Length', value: '741 Kilometers', icon: 'route' },
      { label: 'Key Feature', value: 'Dudhsagar Falls & Panval Viaduct', icon: 'bridge' },
      { label: 'Best Season', value: 'July to October (Monsoon)', icon: 'calendar' },
      { label: 'Tunnels', value: '91 Tunnels (Longest: 6.5 km)', icon: 'tunnel' }
    ],
    relatedTrains: [
      { trainNumber: '10103', trainName: 'Mandovi Express', route: 'CSMT Mumbai → Madgaon Jn (Goa)' },
      { trainNumber: '12051', trainName: 'Madgaon Jan Shatabdi', route: 'CSMT Mumbai → Madgaon Jn' },
      { trainNumber: '22229', trainName: 'Goa Vande Bharat Express', route: 'CSMT Mumbai → Madgaon Jn' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'Carving a railway line through the treacherous basalt cliffs, unforgiving rivers, and soft clay soil of the Konkan coast was long deemed impossible by British colonial engineers. It wasn’t until late 1990 under visionary engineer Dr. E. Sreedharan that the Konkan Railway Corporation Limited (KRCL) accomplished one of independent India’s most ambitious infrastructure projects.'
      },
      {
        type: 'image',
        title: 'The Iconic Dudhsagar Falls Rail Crossing',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Dudhsagar_Falls_triplet%2C_2009.JPG/960px-Dudhsagar_Falls_triplet%2C_2009.JPG',
        imageCaption: 'Indian Railways triplet diesel locomotives hauling passenger coaches across the bridge directly before the thundering Dudhsagar Falls.',
        altText: 'Indian Railways train passing Dudhsagar Falls'
      },
      {
        type: 'heading',
        title: 'Engineering Marvels: Panval Nadi & Karbude Tunnel',
        content: 'The route features the legendary Panval Nadi Viaduct near Ratnagiri, which stands at an awe-inspiring height of 64 meters above the riverbed — taller than the Qutub Minar. Furthermore, the 6.5-kilometer Karbude Tunnel was the longest railway tunnel in India for over a decade, requiring specialized rock-blasting shields and ventilation shafts.'
      },
      {
        type: 'tip',
        title: "Traveler's Seating Hack",
        content: 'When travelling south from Mumbai to Goa, book window seats on the RIGHT side (seats facing West) for breathtaking glimpses of the Arabian Sea and setting sun. In monsoon, the left side offers cascading mountain streams.'
      },
      {
        type: 'paragraph',
        content: 'During the monsoons (July to September), the Konkan route transforms into an emerald paradise. Waterfalls cascade right next to the tracks, mist clings to the viaducts, and the aroma of wet earth fills the coaches. Indian Railways enforces a special "Monsoon Timetable" with reduced speeds for safety, making it a leisurely, unforgettable retreat.'
      },
      {
        type: 'trivia',
        title: 'Did You Know?',
        content: 'Konkan Railway pioneered the Roll-on/Roll-off (RORO) service in India, allowing loaded freight trucks to be driven directly onto open flat wagons, drastically saving fuel and reducing highway carbon emissions.'
      }
    ]
  },

  // 2. Vande Bharat Express
  {
    id: '2',
    slug: 'vande-bharat-evolution-future-sleeper',
    title: 'Vande Bharat 2.0 & Beyond: Inside India’s High-Speed Rail Revolution',
    subtitle: 'From indigenous Kavach collision protection to aerodynamic nose-cones: how Train 18 changed the face of Indian mobility.',
    category: 'Train Tech',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Vande_Bharat_Express_train.jpg/960px-Vande_Bharat_Express_train.jpg',
    author: 'AeroRail Engineering Desk',
    authorRole: 'Senior Rolling-Stock Specialist',
    readTimeMinutes: 7,
    publishedDate: 'Oct 26, 2026',
    featured: true,
    tags: ['Vande Bharat', 'Train 18', 'Kavach', 'Make In India', 'High Speed'],
    quickFacts: [
      { label: 'Top Test Speed', value: '180 km/h (In-Service: 130-160 km/h)', icon: 'gauge' },
      { label: 'Acceleration', value: '0 to 100 km/h in 52 seconds', icon: 'zap' },
      { label: 'Safety System', value: 'Kavach (SIL-4 Certified ATP)', icon: 'shield' },
      { label: 'Braking', value: 'Regenerative Electro-Pneumatic', icon: 'battery' }
    ],
    relatedTrains: [
      { trainNumber: '20607', trainName: 'MAS MYS Vande Bharat', route: 'MGR Chennai Central → Mysuru Jn' },
      { trainNumber: '22436', trainName: 'Vande Bharat Express', route: 'New Delhi → Varanasi Jn' },
      { trainNumber: '20641', trainName: 'Bengaluru - Coimbatore VB', route: 'KSR Bengaluru → Coimbatore Jn' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'In October 2018, when Integral Coach Factory (ICF) in Chennai rolled out prototype "Train 18", few expected it would ignite a renaissance in domestic rail manufacturing. Designed and built completely in India under the "Make in India" initiative in just 18 months at nearly half the cost of imported trainsets, Vande Bharat proved that Indian engineering could rival global benchmarks.'
      },
      {
        type: 'heading',
        title: 'Distributed Power: The Secret Behind Rapid Acceleration',
        content: 'Unlike traditional trains with a heavy locomotive hauling passive coaches, Vande Bharat uses a Distributed Traction Power system. Alternating motorized coaches along the rake deliver uniform propulsion, cutting 0-100 km/h acceleration time to just 52 seconds — faster than a standard bullet train.'
      },
      {
        type: 'image',
        title: 'Vande Bharat Express at an Indian Station',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Howrah_Puri_Vande_Bharat_Express_standing_at_Bhadrak.jpg/960px-Howrah_Puri_Vande_Bharat_Express_standing_at_Bhadrak.jpg',
        imageCaption: 'The aerodynamic Howrah-Puri Vande Bharat Express standing along the platform at Bhadrak railway station.',
        altText: 'Howrah Puri Vande Bharat Express at station platform'
      },
      {
        type: 'trivia',
        title: 'Kavach Safety Armor',
        content: 'Vande Bharat trainsets are equipped with Kavach, India’s indigenous Automatic Train Protection (ATP) system. If the loco pilot fails to brake at a red signal or if another train enters the same block section, Kavach automatically commands the brakes to prevent collision.'
      },
      {
        type: 'heading',
        title: 'The Upcoming Vande Bharat Sleeper: Redefining Overnight Journeys',
        content: 'Designed for long-haul routes spanning 800 to 1,500 km, the upcoming Vande Bharat Sleeper trains will feature whisper-quiet sealed vestibules, superior suspension damping, USB-C and inductive charging at every berth, and ergonomic modular toilets, bringing Rajdhani luxury into a new era of speed.'
      }
    ]
  },

  // 3. Pamban Sea Bridge (NEW)
  {
    id: '3',
    slug: 'pamban-sea-bridge-rameswaram',
    title: 'The Engineering Marvel Across The Sea: The Legendary Pamban Rail Bridge',
    subtitle: 'India’s historic 2-kilometer cantilever sea bridge braving the roaring waves of the Palk Strait to holy Rameswaram Island.',
    category: 'Scenic Routes',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Train_on_the_Pamban_rail_bridge.jpg/960px-Train_on_the_Pamban_rail_bridge.jpg',
    author: 'Maritime & Coastal Rail Desk',
    authorRole: 'Infrastructure & Coastal Rail Specialist',
    readTimeMinutes: 7,
    publishedDate: 'Oct 28, 2026',
    featured: true,
    tags: ['Pamban Bridge', 'Rameswaram', 'Sea Bridge', 'Tamil Nadu', 'Historic Rail'],
    quickFacts: [
      { label: 'Length', value: '2.06 Kilometers (143 Spans)', icon: 'route' },
      { label: 'Opened', value: 'February 24, 1914', icon: 'calendar' },
      { label: 'Lift Type', value: 'Scherzer Rolling Lift Cantilever', icon: 'bridge' },
      { label: 'Location', value: 'Palk Strait (Mandapam to Pamban)', icon: 'compass' }
    ],
    relatedTrains: [
      { trainNumber: '16851', trainName: 'Rameswaram Boat Mail Express', route: 'Chennai Egmore → Rameswaram' },
      { trainNumber: '22661', trainName: 'Sethu Superfast Express', route: 'Chennai Egmore → Rameswaram' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'Opened in 1914, the Pamban Rail Bridge was India’s first sea bridge and remained its longest until the Bandra-Worli Sea Link opened in 2010. Connecting the Indian mainland town of Mandapam with the sacred island of Rameswaram across the turbulent Palk Strait, this 2.06-kilometer structure is one of the most breathtaking railway journeys on Earth.'
      },
      {
        type: 'image',
        title: 'Train Gliding Over Ocean Waves',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Pamban_Bridge_Train_Passing.jpg/960px-Pamban_Bridge_Train_Passing.jpg',
        imageCaption: 'A passenger train slowly traversing the open ocean waters over the Pamban cantilever spans.',
        altText: 'Indian Railways train crossing Pamban Sea Bridge'
      },
      {
        type: 'heading',
        title: 'The Genius of the Scherzer Rolling Lift Span',
        content: 'To allow ships and cargo vessels to pass through the strait, German engineer William Scherzer designed a central double-leaf bascule section. Weighing hundreds of tons, the two massive iron arms could be manually cranked open to create a wide navigational channel for boats.'
      },
      {
        type: 'tip',
        title: 'Window Watching Tip',
        content: 'As the train crawls onto the Pamban Bridge at a cautious 10-15 km/h, keep your camera ready. The sea stretches endlessly on both sides, with fishing trawlers bobbing below and sea salt mist entering the coach windows.'
      },
      {
        type: 'trivia',
        title: 'The New Vertical-Lift Pamban Bridge',
        content: 'Indian Railways has constructed a modern state-of-the-art replacement bridge featuring India’s first automated vertical lift span, designed to clear ships 22 meters above sea level while supporting electrified high-speed express trains.'
      }
    ]
  },

  // 4. CSMT Mumbai (NEW)
  {
    id: '4',
    slug: 'csmt-mumbai-unesco-gothic-wonder',
    title: 'Crown Jewel of Victorian Gothic: The Living Legend of CSMT Mumbai',
    subtitle: 'Stepping inside the bustling heart of Central Railway — a UNESCO World Heritage palace handling 3 million commuters daily.',
    category: 'Heritage & History',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Chhatrapati_Shivaji_Maharaj_Terminus_2.jpg/960px-Chhatrapati_Shivaji_Maharaj_Terminus_2.jpg',
    author: 'Urban Heritage Directorate',
    authorRole: 'Architectural Historian',
    readTimeMinutes: 6,
    publishedDate: 'Oct 29, 2026',
    featured: false,
    tags: ['CSMT', 'Mumbai', 'UNESCO', 'Victorian Gothic', 'Heritage'],
    quickFacts: [
      { label: 'Built', value: '1878 to 1887 (10 Years)', icon: 'calendar' },
      { label: 'Architect', value: 'Frederick William Stevens', icon: 'award' },
      { label: 'UNESCO Status', value: 'Inscribed in 2004', icon: 'shield' },
      { label: 'Platforms', value: '18 Platforms (Suburban & Mail)', icon: 'layers' }
    ],
    relatedTrains: [
      { trainNumber: '12138', trainName: 'Punjab Mail', route: 'Firozpur Cantt → CSMT Mumbai' },
      { trainNumber: '12322', trainName: 'Kolkata Mail', route: 'CSMT Mumbai → Howrah Jn' },
      { trainNumber: '22221', trainName: 'CSMT NZM Rajdhani', route: 'CSMT Mumbai → Hazrat Nizamuddin' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'Originally named Victoria Terminus to honor Queen Victoria’s Golden Jubilee in 1887, Chhatrapati Shivaji Maharaj Terminus (CSMT) is an extraordinary fusion of High Victorian Gothic Revival architecture and traditional Indian palace design. Its ribbed stone vaults, stained glass windows, and grand central dome make it one of the most photographed railway stations in the world.'
      },
      {
        type: 'image',
        title: 'CSMT Illuminated in Tricolor Glory',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Chhatrapati_Shivaji_Maharaj_Terminus_at_night%2C_Mumbai%2C_Maharashtra%2C_India_%282018%29.jpg/960px-Chhatrapati_Shivaji_Maharaj_Terminus_at_night%2C_Mumbai%2C_Maharashtra%2C_India_%282018%29.jpg',
        imageCaption: 'The majestic exterior of CSMT lit in the Indian tricolor during evening hours in South Mumbai.',
        altText: 'CSMT illuminated at night in Mumbai'
      },
      {
        type: 'heading',
        title: 'Gargoyles, Peacocks, and Stone Lions',
        content: 'Look closely at the stone facades and arches: alongside traditional European gargoyles, master Indian craftsmen carved indigenous peacocks, monkeys, cobra serpents, and elephants into the stone capitals, blending Indian flora and fauna into Victorian buttresses.'
      },
      {
        type: 'trivia',
        title: 'Platform 1 to 18: Suburban vs Long-Distance',
        content: 'CSMT operates as a dual-hub: Platforms 1 to 7 are dedicated exclusively to Mumbai’s lifeline suburban local trains, while Platforms 8 to 18 handle iconic long-distance express trains connecting Mumbai to every corner of India.'
      }
    ]
  },

  // 5. Kalka-Shimla Mountain Railway
  {
    id: '5',
    slug: 'kalka-shimla-unesco-toy-train',
    title: 'Whispers of the Himalayas: The Historic Kalka-Shimla Mountain Railway',
    subtitle: 'Traversing 102 tunnels and 869 bridges into Himachal’s pine-scented hills on a century-old UNESCO World Heritage track.',
    category: 'Heritage & History',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Shimla%2C_India%2C_Shimla_train.jpg/960px-Shimla%2C_India%2C_Shimla_train.jpg',
    author: 'Heritage & Culture Wing',
    authorRole: 'Mountain Railway Historian',
    readTimeMinutes: 8,
    publishedDate: 'Oct 28, 2026',
    featured: true,
    tags: ['Kalka-Shimla', 'Toy Train', 'UNESCO', 'Himalayas', 'Himachal'],
    quickFacts: [
      { label: 'Track Gauge', value: 'Narrow Gauge (2 ft 6 in / 762 mm)', icon: 'layers' },
      { label: 'Elevation Gain', value: '656m to 2,076m (1,420m rise)', icon: 'trending-up' },
      { label: 'Tunnels', value: '102 Tunnels (Barog: 1,143m)', icon: 'maximize' },
      { label: 'UNESCO Status', value: 'Inscribed in July 2008', icon: 'award' }
    ],
    relatedTrains: [
      { trainNumber: '52457', trainName: 'Kalka Shimla Passenger', route: 'Kalka (KLK) → Shimla (SML)' },
      { trainNumber: '52453', trainName: 'Kalka Shimla Express', route: 'Kalka (KLK) → Shimla (SML)' },
      { trainNumber: '52459', trainName: 'Him Darshan Express', route: 'Kalka (KLK) → Shimla (SML)' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'Opened in November 1903 during the British Raj to connect the summer capital of India with the plains, the 96-kilometer Kalka-Shimla Railway is an enduring testament to human grit and railway romance. As the little red diesel locomotive chugs uphill, pine valleys and snow-dusted peaks unfold like poetry.'
      },
      {
        type: 'image',
        title: 'Historic Shimla Railway Station',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/Shimla_Railway_Station%2C_Himachal_Pradesh.jpg/960px-Shimla_Railway_Station%2C_Himachal_Pradesh.jpg',
        imageCaption: 'The heritage Shimla railway station nestled under the deodar-covered slopes of Himachal Pradesh.',
        altText: 'Shimla Railway Station Himachal Pradesh'
      },
      {
        type: 'heading',
        title: 'The Ghost and Glory of Barog Tunnel (Tunnel No. 33)',
        content: 'The longest tunnel on the route is the Barog Tunnel (1,143 meters). Legend has it that British engineer Colonel Barog began digging from both ends of the mountain, but miscalculations led to the two headings failing to meet. Distraught, he committed suicide near the tunnel. The project was subsequently completed by Chief Engineer H.S. Harington with the guidance of a local shepherd named Bhalku, who accurately tapped the rock walls with his wooden staff.'
      },
      {
        type: 'tip',
        title: 'Experience Him Darshan Vistadome',
        content: 'For panoramic 360-degree views of the cedar forests, book the Him Darshan Express (Train No. 52459). The coaches have glass ceilings, plush swivel chairs, and window blinds for bright sunny stretches.'
      }
    ]
  },

  // 6. Nilgiri Mountain Railway (NEW)
  {
    id: '6',
    slug: 'nilgiri-mountain-railway-rack-pinion',
    title: 'The Steam Queens of the Nilgiris: Blue Mountain Rack-and-Pinion Railway',
    subtitle: 'Ascending the steepest railway gradient in Asia through eucalyptus hills and tea gardens to Udhagamandalam (Ooty).',
    category: 'Scenic Routes',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Nilgiri_Mountain_Railway_on_Bridge%2C_May_2010.JPG/960px-Nilgiri_Mountain_Railway_on_Bridge%2C_May_2010.JPG',
    author: 'Nilgiri Heritage Trust',
    authorRole: 'Heritage Locomotion Archivist',
    readTimeMinutes: 7,
    publishedDate: 'Oct 29, 2026',
    featured: false,
    tags: ['Nilgiri', 'Ooty', 'Toy Train', 'Steam Train', 'UNESCO'],
    quickFacts: [
      { label: 'System', value: 'Abt Rack and Pinion Cogwheel', icon: 'settings' },
      { label: 'Steepest Grade', value: '1 in 12.5 (8.88% incline)', icon: 'trending-up' },
      { label: 'Elevation', value: 'Mettupalayam (326m) → Ooty (2,203m)', icon: 'route' },
      { label: 'UNESCO Status', value: 'Inscribed in 2005', icon: 'award' }
    ],
    relatedTrains: [
      { trainNumber: '06136', trainName: 'MTP UAM Special', route: 'Mettupalayam → Udhagamandalam (Ooty)' },
      { trainNumber: '06137', trainName: 'UAM MTP Special', route: 'Udhagamandalam (Ooty) → Mettupalayam' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'The Nilgiri Mountain Railway (NMR) in Tamil Nadu is the only rack railway in India and operates on the steepest gradient in Asia. To climb from Mettupalayam in the plains up to Ooty in the clouds (an altitude leap of over 1,800 meters), the train engages a center toothed rack rail with locomotive cogwheels, pushing coaches safely uphill.'
      },
      {
        type: 'image',
        title: 'Classic Blue Rake on Heritage Tracks',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Nilgiri_Mountain_Train.jpg',
        imageCaption: 'The historic blue-and-cream coaches of Nilgiri Mountain Railway chugging past tea plantations near Coonoor.',
        altText: 'Nilgiri Mountain Railway train in Coonoor'
      },
      {
        type: 'heading',
        title: 'The Locomotive Pushes From Behind!',
        content: 'Unlike normal trains where the locomotive pulls from the front, on the uphill journey from Mettupalayam to Coonoor, the steam locomotive pushes the train from behind! This is a fail-safe safety measure: if a coach ever uncouples, the heavy engine prevents it from rolling backwards down the mountain.'
      },
      {
        type: 'tip',
        title: 'Booking Advice for Ooty Toy Train',
        content: 'With only one or two toy train departures each day, First Class (FC) and Second Class (2S) tickets sell out months in advance on IRCTC. Set an alarm for 120 days before your travel date to secure your seats.'
      }
    ]
  },

  // 7. Tatkal Rules & Hacks
  {
    id: '7',
    slug: 'mastering-irctc-tatkal-booking-rules',
    title: 'Mastering the Tatkal Rush: Timings, Quotas & Pro Booking Strategies',
    subtitle: 'Decode IRCTC opening bells, master passenger pre-filling, and understand cancellation charges to secure confirmed berths every time.',
    category: 'Travel Tips',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Train_on_Platform_3_of_Patna_Junction.jpg/960px-Train_on_Platform_3_of_Patna_Junction.jpg',
    author: 'Ticket Intelligence Unit',
    authorRole: 'Ticketing & Fares Analyst',
    readTimeMinutes: 5,
    publishedDate: 'Oct 27, 2026',
    featured: false,
    tags: ['Tatkal', 'IRCTC', 'Ticket Booking', 'Travel Tips', 'Fare Rules'],
    quickFacts: [
      { label: 'AC Tatkal Window', value: '10:00 AM (1 Day Prior)', icon: 'clock' },
      { label: 'Non-AC Tatkal Window', value: '11:00 AM (1 Day Prior)', icon: 'clock' },
      { label: 'Charge Surcharge', value: '10% to 30% of Base Fare', icon: 'credit-card' },
      { label: 'Confirmed Refund', value: '₹0 (Zero Refund on Confirmed)', icon: 'alert-triangle' }
    ],
    relatedTrains: [
      { trainNumber: '12723', trainName: 'Telangana Superfast', route: 'Hyderabad Deccan → New Delhi' },
      { trainNumber: '12791', trainName: 'SC DNR SF Express', route: 'Secunderabad Jn → Danapur' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'Every day at 10:00 AM sharp, thousands of travelers across India log into IRCTC for the ultimate test of digital dexterity: booking a Tatkal ticket. Understanding the nuances of Indian Railways Tatkal quota can be the difference between a confirmed berth and a stranded travel plan.'
      },
      {
        type: 'image',
        title: 'Bustling Indian Railway Platform',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/A_Passenger_train_standing_on_PF_3_of_Patna_Junction.jpg/960px-A_Passenger_train_standing_on_PF_3_of_Patna_Junction.jpg',
        imageCaption: 'A passenger train at platform 3 of Patna Junction as travelers board with their confirmed reservation tickets.',
        altText: 'Passenger train standing on platform at Indian railway station'
      },
      {
        type: 'heading',
        title: 'The Two Golden Windows: 10:00 AM vs 11:00 AM',
        content: 'Tatkal quota opens exactly one day in advance of the train’s departure date from its originating station:\n• AC Classes (2A, 3A, 3E, CC, EC): Opens at 10:00 AM IST.\n• Non-AC Classes (Sleeper SL, Second Sitting 2S): Opens at 11:00 AM IST.'
      },
      {
        type: 'tip',
        title: 'The Master List Strategy',
        content: 'Never enter passenger names and ID details manually at 10:00 AM! Pre-save all passengers in your IRCTC "Master Passenger List" before 9:50 AM. During checkout, you can auto-fill all names with a single click.'
      },
      {
        type: 'paragraph',
        content: 'Payment method selection is crucial. Net-banking or complex OTP cards often time out during peak server load. UPI AutoPay, QR-code scan, or IRCTC eWallet frequently process within seconds without waiting for third-party bank gateways.'
      },
      {
        type: 'trivia',
        title: 'Tatkal Cancellation Rule',
        content: 'Important to remember: Indian Railways offers NO refund for cancellation of confirmed Tatkal tickets. However, if your Tatkal ticket is waitlisted (WL) after final chart preparation, it gets automatically cancelled and refunded.'
      }
    ]
  },

  // 8. Trackside Gastronomy
  {
    id: '8',
    slug: 'iconic-station-food-indian-railways',
    title: 'Flavors on Track: The Culinary Pilgrimage of Indian Railways',
    subtitle: 'From Ratlam’s fiery Sev to Kharagpur’s spiced Chai and Guntakal’s Mirchi Bajji — a foodie’s trackside guide.',
    category: 'Food & Culture',
    coverImage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Indian_samosa.jpg/960px-Indian_samosa.jpg',
    author: 'Rail Culinary Society',
    authorRole: 'Food & Travel Chronicler',
    readTimeMinutes: 6,
    publishedDate: 'Oct 29, 2026',
    featured: false,
    tags: ['Food On Track', 'Station Food', 'Samosa', 'Chai', 'Pantry Car'],
    quickFacts: [
      { label: 'Famous Chai', value: 'Kharagpur & Varanasi Kulhad Chai', icon: 'coffee' },
      { label: 'Crispy Snack', value: 'Ratlam Sev & Platform Samosa', icon: 'utensils' },
      { label: 'South Specialty', value: 'Idli Vada at Vijayawada & Jolarpettai', icon: 'heart' },
      { label: 'Sweet Treat', value: 'Maddur Vada & Bardhaman Mihidana', icon: 'gift' }
    ],
    relatedTrains: [
      { trainNumber: '12138', trainName: 'Punjab Mail', route: 'Firozpur Cantt → CSMT Mumbai' },
      { trainNumber: '12840', trainName: 'Howrah Mail', route: 'MGR Chennai Central → Howrah Jn' }
    ],
    sections: [
      {
        type: 'paragraph',
        content: 'To travel on Indian Railways is to undertake a multi-course culinary journey through the subcontinent. Long before modern app delivery, passengers judged the quality of their voyage by the vendor cries echoing across station platforms: "Garam Chai!", "Ratlam ki Mashhoor Sev!", and "Garma Garam Samosa!"'
      },
      {
        type: 'image',
        title: 'Freshly Fried Platform Snacks',
        imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Indian_Street_Food.JPG/960px-Indian_Street_Food.JPG',
        imageCaption: 'Authentic Indian street food and hot snacks prepared fresh along station concourses and food stalls.',
        altText: 'Indian street food hot snacks'
      },
      {
        type: 'heading',
        title: 'The Legendary Station Halt Delicacies',
        content: '• Ratlam Junction (Madhya Pradesh): World-famous clove-infused Ratlam Sev and steaming yellow Poha topped with fresh pomegranate seeds.\n• Kharagpur & Bardhaman (West Bengal): Sitaram bhog and golden Sitabhog sweets along with clay-pot malai chai.\n• Guntakal & Vijayawada (Andhra Pradesh): Spicy Mirchi Bajjis accompanied by sweet cut mangoes and filter coffee.\n• Maddur (Karnataka): Maddur Vada, a crispy onion-semolina fritter born at Maddur station in 1917.'
      },
      {
        type: 'tip',
        title: 'E-Catering Delivery to Berth',
        content: 'Did you know you can order fresh meals from top city restaurants directly to your seat? Use the IRCTC e-Catering portal or WhatsApp service with your PNR number, and delivery partners deliver hot food right at your intermediate station halt.'
      }
    ]
  }
];

export const BLOG_CATEGORIES = [
  'All',
  'Scenic Routes',
  'Train Tech',
  'Heritage & History',
  'Travel Tips',
  'Food & Culture'
];
