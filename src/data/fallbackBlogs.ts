import type { BlogArticle } from '../types';

export const FALLBACK_BLOGS: BlogArticle[] = [
  {
    id: '1',
    slug: 'konkan-railway-scenic-odyssey',
    title: 'The Konkan Railway Odyssey: Waterfalls, Tunnels, and Coastal Horizons',
    subtitle: 'A triumph of modern civil engineering winding through 2,000 bridges, 91 tunnels, and the lush mist of the Western Ghats.',
    category: 'Scenic Routes',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    author: 'Antigravity Rail Bureau',
    authorRole: 'Railway Historian & Travel Journalist',
    readTimeMinutes: 6,
    publishedDate: 'Oct 24, 2026',
    featured: true,
    tags: ['Konkan', 'Western Ghats', 'Scenic Rail', 'Monsoon Travel', 'Dudhsagar'],
    quickFacts: [
      { label: 'Length', value: '741 Kilometers', icon: 'route' },
      { label: 'Key Feature', value: 'Panval Nadi Viaduct (64m)', icon: 'bridge' },
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
        title: 'Through The Heart of Western Ghats',
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'A passenger train navigating the lush green valleys and serpentine curves of the Konkan terrain.',
        altText: 'Train traversing lush green mountains on Konkan Railway'
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
        type: 'image',
        title: 'Monsoon Cascades and Mist',
        imageUrl: 'https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Morning mist enshrouding the Konkan trackbed during peak monsoon season.',
        altText: 'Misty morning along the Konkan route'
      },
      {
        type: 'trivia',
        title: 'Did You Know?',
        content: 'Konkan Railway pioneered the Roll-on/Roll-off (RORO) service in India, allowing loaded freight trucks to be driven directly onto open flat wagons, drastically saving fuel and reducing highway carbon emissions.'
      }
    ]
  },
  {
    id: '2',
    slug: 'vande-bharat-evolution-future-sleeper',
    title: 'Vande Bharat 2.0 & Beyond: Inside India’s High-Speed Rail Revolution',
    subtitle: 'From indigenous Kavach collision protection to overnight sleeper rakes: how Train 18 changed the face of Indian mobility.',
    category: 'Train Tech',
    coverImage: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80',
    author: 'AeroRail Engineering Desk',
    authorRole: 'Senior Rolling-Stock Specialist',
    readTimeMinutes: 7,
    publishedDate: 'Oct 26, 2026',
    featured: true,
    tags: ['Vande Bharat', 'Train 18', 'Kavach', 'Sleeper', 'Innovation'],
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
        title: 'Aerodynamic Aesthetics & Ergonomics',
        imageUrl: 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'The modern cockpit and streamlined nose-cone engineered to minimize aerodynamic drag at 160 km/h.',
        altText: 'Vande Bharat aerodynamic cab'
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
  {
    id: '3',
    slug: 'mastering-irctc-tatkal-booking-rules',
    title: 'Mastering the Tatkal Rush: Timings, Quotas & Pro Booking Strategies',
    subtitle: 'Decode IRCTC opening bells, master passenger pre-filling, and understand cancellation charges to secure confirmed berths every time.',
    category: 'Travel Tips',
    coverImage: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=1200&q=80',
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
  {
    id: '4',
    slug: 'kalka-shimla-unesco-toy-train',
    title: 'Whispers of the Himalayas: The Historic Kalka-Shimla Mountain Railway',
    subtitle: 'Traversing 102 tunnels and 869 bridges into Himachal’s pine-scented hills on a century-old UNESCO World Heritage track.',
    category: 'Heritage & History',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    author: 'Heritage & Culture Wing',
    authorRole: 'Mountain Railway Historian',
    readTimeMinutes: 8,
    publishedDate: 'Oct 28, 2026',
    featured: true,
    tags: ['Kalka-Shimla', 'Toy Train', 'UNESCO', 'Himalayas', 'Heritage'],
    quickFacts: [
      { label: 'Track Gauge', value: 'Narrow Gauge (2 ft 6 in / 762 mm)', icon: 'layers' },
      { label: 'Elevation Gain', value: '656m to 2,076m (1,420m rise)', icon: 'trending-up' },
      { label: 'Tunnels', value: '102 Tunnels (Barog Tunnel: 1,143m)', icon: 'maximize' },
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
        title: 'Arch Bridges of Dharampur',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Multi-tier stone arch viaduct resembling Roman aqueducts winding around steep alpine slopes.',
        altText: 'Stone arch bridge in Himalayas'
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
  {
    id: '5',
    slug: 'iconic-station-food-indian-railways',
    title: 'Flavors on Track: The Culinary Pilgrimage of Indian Railways',
    subtitle: 'From Ratlam’s fiery Sev to Kharagpur’s spiced Chai and Guntakal’s Mirchi Bajji — a foodie’s trackside guide.',
    category: 'Food & Culture',
    coverImage: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80',
    author: 'Rail Culinary Society',
    authorRole: 'Food & Travel Chronicler',
    readTimeMinutes: 6,
    publishedDate: 'Oct 29, 2026',
    featured: false,
    tags: ['Food On Track', 'Station Food', 'Indian Cuisine', 'Chai', 'Pantry Car'],
    quickFacts: [
      { label: 'Famous Chai', value: 'Kharagpur & Varanasi Kulhad Chai', icon: 'coffee' },
      { label: 'Crispy Snack', value: 'Ratlam Sev & Poha', icon: 'utensils' },
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
        title: 'Clay Cup Chai on the Platform',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Steaming hot spiced milk tea served in an earthen clay kulhad on a bustling railway platform.',
        altText: 'Indian spiced chai in kulhad'
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
