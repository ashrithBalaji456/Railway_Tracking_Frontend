import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type LanguageType = 'en' | 'hi' | 'te' | 'bn';

interface LanguageContextProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageType, Record<string, string>> = {
  en: {
    navHome: "Home",
    navStations: "Stations",
    navLiveMap: "Live Map",
    navPlanner: "Planner",
    navFavorites: "Favorites",
    navLogout: "Logout",
    navLogin: "Login",
    navRegister: "Register",
    
    // Home Page
    heroTitle: "Indian Railway Live Tracker",
    heroSubtitle: "Track live train coordinates, explore station arrivals board, and set delay alerts contextually.",
    searchPlaceholder: "Search by Train Number or Name...",
    recentSearches: "Recent Searches",
    activeLiveMap: "Active Live Map Tracker",
    exploreDepartures: "Explore Departures Board",
    noTrainFound: "No matching trains found.",
    
    // Stations page
    selectStation: "Select Station to Explore",
    stationPlaceholder: "Search by Station Code or Name (e.g. BZA, NDLS)",
    allTrains: "All Departures",
    stoppingTrains: "Stopping Trains",
    nonStoppingTrains: "Pass-Through Trains",
    departingTrains: "Departing Trains",
    noDepartures: "No departing train schedule mappings.",
    halt: "Halt",
    pass: "Pass",
    
    // Train Details
    profileTitle: "Train Profile Schedule",
    trackLive: "Track Live Status",
    stopTracking: "Stop Tracking",
    locating: "Locating...",
    origin: "Origin",
    destination: "Destination",
    distance: "Total Distance",
    duration: "Duration",
    liveTelemetry: "Live tracking coordinates verified",
    liveStream: "Live Stream",
    syncing: "Syncing...",
    polling: "Polling Fallback",
    currentPos: "Current Position",
    nextStop: "Next Station",
    delay: "Delay",
    speedBearing: "Speed / Bearing",
    onTime: "On Time",
    lateMins: "mins late",
    routeTimetable: "Route Schedule & Timetable",
    seq: "Seq",
    station: "Station",
    timings: "Scheduled Timings",
    haltMins: "mins",
    liveStatusLabel: "Live Status",
    passesThrough: "Passes through (No Halt)",
    
    // Alerts modal
    delayAlerts: "Delay Alert Settings",
    alertDesc: "Receive warning badge when delay exceeds:",
    saveAlert: "Save Alert",
    removeAlert: "Remove Alert",
    cancel: "Cancel",
    
    // Dashboard / Favorites
    dashboardTitle: "Your Dashboard",
    dashboardDesc: "Manage your bookmarked routes and configured delay alarms.",
    bookmarksTab: "Bookmarks",
    alertsTab: "Delay Alerts",
    bookmarkedTrains: "Bookmarked Trains",
    bookmarkedStations: "Bookmarked Stations",
    noBookmarkedTrains: "No bookmarked trains found.",
    noBookmarkedStations: "No bookmarked stations found.",
    delayAlarms: "Configured Delay Alarms",
    delayThresholdLabel: "Delay Threshold:",
    currentDelayLabel: "Current delay:",
    delayWarningBadge: "⚠️ DELAY WARNING",
    normalRunBadge: "✅ Normal Run",
    noActiveAlarms: "No active delay alerts configured.",
    noActiveAlarmsDesc: "Click the bell icon next to any train route timetable page to get real-time warning badges.",
    
    // Journey Planner
    journeyPlannerTitle: "Journey Planner",
    journeyPlannerDesc: "Find direct connections and multi-train routes between station pairs.",
    findTravelRoutes: "Find Travel Routes",
    originStationLabel: "Origin Station",
    destinationStationLabel: "Destination Station",
    originPlaceholder: "Enter origin station (e.g. BZA, Vijayawada)",
    destinationPlaceholder: "Enter destination station (e.g. NDLS, Delhi)",
    availableJourneys: "Available Journeys",
    directTrain: "Direct Train",
    connectingTrain: "1 Transfer Connection",
    transferAt: "Transfer at",
    layover: "Layover:",
    tightConnection: "Tight Connection Layover!",
    longLayover: "Long Layover Duration",
    noJourneysFound: "No Journey Routes Found",
    noJourneysFoundDesc: "There are no direct or single-connection runs found between these stations."
  },
  hi: {
    navHome: "होम",
    navStations: "स्टेशन",
    navLiveMap: "लाइव मैप",
    navPlanner: "यात्रा योजना",
    navFavorites: "पसंदीदा",
    navLogout: "लॉगआउट",
    navLogin: "लॉगिन",
    navRegister: "रजिस्टर",
    
    heroTitle: "भारतीय रेलवे लाइव ट्रैकर",
    heroSubtitle: "ट्रेन के लाइव स्थान को ट्रैक करें, स्टेशन आगमन बोर्ड का पता लगाएं, और देरी के अलर्ट सेट करें।",
    searchPlaceholder: "ट्रेन नंबर या नाम से खोजें...",
    recentSearches: "हाल की खोजें",
    activeLiveMap: "सक्रिय लाइव मैप ट्रैकर",
    exploreDepartures: "प्रस्थान बोर्ड खोजें",
    noTrainFound: "कोई मेल खाती ट्रेन नहीं मिली।",
    
    selectStation: "खोजने के लिए स्टेशन चुनें",
    stationPlaceholder: "स्टेशन कोड या नाम दर्ज करें (जैसे BZA, NDLS)",
    allTrains: "सभी प्रस्थान",
    stoppingTrains: "रुकने वाली ट्रेनें",
    nonStoppingTrains: "बिना रुके निकलने वाली ट्रेनें",
    departingTrains: "प्रस्थान करने वाली ट्रेनें",
    noDepartures: "कोई प्रस्थान समय तालिका उपलब्ध नहीं है।",
    halt: "ठहराव",
    pass: "पास",
    
    profileTitle: "ट्रेन प्रोफाइल शेड्यूल",
    trackLive: "लाइव स्थिति ट्रैक करें",
    stopTracking: "ट्रैकिंग रोकें",
    locating: "ढूँढ रहा है...",
    origin: "प्रारंभिक",
    destination: "गंतव्य",
    distance: "कुल दूरी",
    duration: "अवधि",
    liveTelemetry: "लाइव ट्रैकिंग निर्देशांक सत्यापित",
    liveStream: "लाइव स्ट्रीम",
    syncing: "सिंक्रनाइज़ हो रहा है...",
    polling: "पोलिंग फॉलबैक",
    currentPos: "वर्तमान स्थिति",
    nextStop: "अगला स्टेशन",
    delay: "देरी",
    speedBearing: "गति / दिशा",
    onTime: "समय पर",
    lateMins: "मिनट देरी",
    routeTimetable: "मार्ग अनुसूची और समय सारणी",
    seq: "क्र.",
    station: "स्टेशन",
    timings: "निर्धारित समय",
    haltMins: "मिनट",
    liveStatusLabel: "लाइव स्थिति",
    passesThrough: "सीधे निकलती है (कोई ठहराव नहीं)",
    
    delayAlerts: "देरी चेतावनी सेटिंग्स",
    alertDesc: "चेतावनी प्राप्त करें जब देरी इससे अधिक हो:",
    saveAlert: "अलर्ट सहेजें",
    removeAlert: "अलर्ट हटाएं",
    cancel: "रद्द करें",
    
    dashboardTitle: "आपका डैशबोर्ड",
    dashboardDesc: "अपनी बुकमार्क की गई ट्रेनों और कॉन्फ़िगर किए गए देरी अलर्ट का प्रबंधन करें।",
    bookmarksTab: "बुकमार्क",
    alertsTab: "देरी अलर्ट",
    bookmarkedTrains: "बुकमार्क की गई ट्रेनें",
    bookmarkedStations: "बुकमार्क किए गए स्टेशन",
    noBookmarkedTrains: "कोई बुकमार्क की गई ट्रेन नहीं मिली।",
    noBookmarkedStations: "कोई बुकमार्क किया गया स्टेशन नहीं मिला।",
    delayAlarms: "कॉन्फ़िगर की गई देरी अलार्म",
    delayThresholdLabel: "देरी सीमा:",
    currentDelayLabel: "वर्तमान देरी:",
    delayWarningBadge: "⚠️ देरी चेतावनी",
    normalRunBadge: "✅ सामान्य समय",
    noActiveAlarms: "कोई सक्रिय देरी अलर्ट कॉन्फ़िगर नहीं है।",
    noActiveAlarmsDesc: "वास्तविक समय चेतावनी प्राप्त करने के लिए किसी भी ट्रेन विवरण पृष्ठ पर घंटी आइकन पर क्लिक करें।",
    
    journeyPlannerTitle: "यात्रा योजना",
    journeyPlannerDesc: "स्टेशनों के बीच सीधे ट्रेन मार्ग और 1-स्थानांतरण कनेक्शन खोजें।",
    findTravelRoutes: "यात्रा मार्ग खोजें",
    originStationLabel: "प्रारंभिक स्टेशन",
    destinationStationLabel: "गंतव्य स्टेशन",
    originPlaceholder: "प्रारंभिक स्टेशन दर्ज करें (जैसे BZA, विजयवाड़ा)",
    destinationPlaceholder: "गंतव्य स्टेशन दर्ज करें (जैसे NDLS, दिल्ली)",
    availableJourneys: "उपलब्ध यात्राएं",
    directTrain: "सीधी ट्रेन",
    connectingTrain: "1 स्थानांतरण कनेक्शन",
    transferAt: "स्थानांतरण स्टेशन:",
    layover: "यात्रा अंतराल:",
    tightConnection: "संवेदनशील अंतराल चेतावनी!",
    longLayover: "लंबा यात्रा अंतराल",
    noJourneysFound: "कोई यात्रा मार्ग नहीं मिला",
    noJourneysFoundDesc: "इन स्टेशनों के बीच कोई सीधा या एकल-कनेक्शन मार्ग नहीं मिला।"
  },
  te: {
    navHome: "హోమ్",
    navStations: "స్టేషన్లు",
    navLiveMap: "లైవ్ మ్యాప్",
    navPlanner: "ప్రయాణ ప్రణాళిక",
    navFavorites: "ఇష్టమైనవి",
    navLogout: "లాగ్అవుట్",
    navLogin: "లాగిన్",
    navRegister: "రిజిస్టర్",
    
    heroTitle: "భారతీయ రైల్వే లైవ్ ట్రాకర్",
    heroSubtitle: "రైళ్ల ప్రత్యక్ష స్థానాన్ని ట్రాక్ చేయండి, స్టేషన్ రాకపోకల బోర్డును అన్వేషించండి మరియు ఆలస్యం హెచ్చరికలను సెట్ చేయండి.",
    searchPlaceholder: "ట్రైన్ నంబర్ లేదా పేరుతో వెతకండి...",
    recentSearches: "ఇటీవలి శోధనలు",
    activeLiveMap: "యాక్టివ్ లైవ్ మ్యాప్ ట్రాకర్",
    exploreDepartures: "ప్రస్థాన బోర్డుని కనుగొనండి",
    noTrainFound: "సరిపోలే రైళ్లు కనుగొనబడలేదు.",
    
    selectStation: "శోధించడానికి స్టేషన్ ఎంచుకోండి",
    stationPlaceholder: "స్టేషన్ కోడ్ లేదా పేరు నమోదు చేయండి (उदा. BZA, NDLS)",
    allTrains: "అన్ని నిష్క్రమణలు",
    stoppingTrains: "ఆగే రైళ్లు",
    nonStoppingTrains: "ఆగకుండా వెళ్లే రైళ్లు",
    departingTrains: "బయలుదేరే రైళ్లు",
    noDepartures: "నిష్క్రమణ సమయాలు అందుబాటులో లేవు.",
    halt: "విరామం",
    pass: "పాస్",
    
    profileTitle: "రైలు ప్రొఫైల్ షెడ్యూల్",
    trackLive: "లైవ్ ట్రాక్ చేయి",
    stopTracking: "ట్రాకింగ్ నిలిపివేయి",
    locating: "శోధిస్తోంది...",
    origin: "ప్రారంభం",
    destination: "గమ్యస్థానం",
    distance: "మొత్తం దూరం",
    duration: "సమయం",
    liveTelemetry: "లైవ్ ట్రాకింగ్ కోఆర్డినేట్స్ ధృవీకరించబడ్డాయి",
    liveStream: "లైవ్ స్ట్రీమ్",
    syncing: "సింక్ అవుతోంది...",
    polling: "పోలింగ్ ఫాల్‌బ్యాక్",
    currentPos: "ప్రస్తుత స్థానం",
    nextStop: "తదుపరి స్టేషన్",
    delay: "ఆలస్యం",
    speedBearing: "వేగం / దిశ",
    onTime: "సమయానికి",
    lateMins: "నిమిషాలు ఆలస్యం",
    routeTimetable: "మార్గం షెడ్యూల్ & టైమ్ టేబుల్",
    seq: "క్రమసంఖ్య",
    station: "స్టేషన్",
    timings: "షెడ్యూల్ సమయాలు",
    haltMins: "నిమిషాలు",
    liveStatusLabel: "లైవ్ స్థితి",
    passesThrough: "ఆగకుండా వెళుతుంది",
    
    delayAlerts: "ఆలస్యం హెచ్చరిక సెట్టింగ్లు",
    alertDesc: "ఆలస్యం దీనికంటే ఎక్కువ ఉన్నప్పుడు హెచ్చరించు:",
    saveAlert: "అలర్ట్ సేవ్ చేయి",
    removeAlert: "అలర్ట్ తీసివేయి",
    cancel: "రద్దు చేయి",
    
    dashboardTitle: "మీ డాష్‌బోర్డ్",
    dashboardDesc: "మీరు బుక్‌మార్క్ చేసిన రైళ్లు మరియు ఆలస్య అలారాలను నిర్వహించండి.",
    bookmarksTab: "బుక్‌మార్క్‌లు",
    alertsTab: "ఆలస్యం అలర్ట్‌లు",
    bookmarkedTrains: "బుక్‌మార్క్ చేసిన రైళ్లు",
    bookmarkedStations: "బుక్‌మార్క్ చేసిన స్టేషన్లు",
    noBookmarkedTrains: "బుక్‌మార్క్ చేసిన రైళ్లు లేవు.",
    noBookmarkedStations: "బుక్‌మార్క్ చేసిన స్టేషన్లు లేవు.",
    delayAlarms: "నిర్వచించిన ఆలస్యం అలారాలు",
    delayThresholdLabel: "ఆలస్యం పరిమితి:",
    currentDelayLabel: "ప్రస్తుత ఆలస్యం:",
    delayWarningBadge: "⚠️ ఆలస్యం హెచ్చరిక",
    normalRunBadge: "✅ సమయానికి",
    noActiveAlarms: "ఎటువంటి ఆలస్యం అలర్ట్‌లు అమర్చబడలేదు.",
    noActiveAlarmsDesc: "రైలు వివరాల పేజీలో గంట గుర్తును నొక్కడం ద్వారా ఆలస్యం అలర్ట్‌లను సెట్ చేసుకోండి.",
    
    journeyPlannerTitle: "ప్రయాణ ప్రణాళిక",
    journeyPlannerDesc: "స్టేషన్ల మధ్య ప్రత్యక్ష మార్గాలు మరియు బదిలీ కనెక్షన్లను కనుగొనండి.",
    findTravelRoutes: "ప్రయాణ మార్గాలు కనుగొనండి",
    originStationLabel: "ప్రారంభ స్టేషన్",
    destinationStationLabel: "గమ్యస్థాన స్టేషన్",
    originPlaceholder: "ప్రారంభ స్టేషన్ నమోదు చేయండి (ఉదా: BZA, విజయవాడ)",
    destinationPlaceholder: "గమ్యస్థాన స్టేషన్ నమోదు చేయండి (ఉదా: NDLS, ఢిల్లీ)",
    availableJourneys: "అందుబాటులో ఉన్న ప్రయాణాలు",
    directTrain: "డైరెక్ట్ ట్రైన్",
    connectingTrain: "1 బదిలీ కనెక్షన్",
    transferAt: "బదిలీ స్టేషన్:",
    layover: "విరామ సమయం:",
    tightConnection: "తక్కువ వ్యవధి హెచ్చరిక!",
    longLayover: "ఎక్కువ విరామ సమయం",
    noJourneysFound: "ప్రయాణ మార్గాలు కనుగొనబడలేదు",
    noJourneysFoundDesc: "ఈ స్టేషన్ల మధ్య ఎటువంటి మార్గాలు లభ్యం కాలేదు."
  },
  bn: {
    navHome: "হোম",
    navStations: "স্টেশন",
    navLiveMap: "লাইভ ম্যাপ",
    navPlanner: "যাত্রার পরিকল্পনা",
    navFavorites: "পছন্দসই",
    navLogout: "লগআউট",
    navLogin: "লগইন",
    navRegister: "নিবন্ধন",
    
    heroTitle: "ভারতীয় রেল লাইভ ট্র্যাকার",
    heroSubtitle: "ট্রেনের লাইভ অবস্থান ট্র্যাক করুন, স্টেশন আগমন বোর্ডটি দেখুন এবং বিলম্ব সতর্কতা সেট করুন।",
    searchPlaceholder: "ট্রেন নম্বর বা নাম দিয়ে খুঁজুন...",
    recentSearches: "সাম্প্রতিক অনুসন্ধান",
    activeLiveMap: "সক্রিয় লাইভ ম্যাপ ট্র্যাকার",
    exploreDepartures: "প্রস্থান বোর্ড দেখুন",
    noTrainFound: "কোন মেলানো ট্রেন পাওয়া যায়নি।",
    
    selectStation: "অনুসন্ধানের জন্য স্টেশন নির্বাচন করুন",
    stationPlaceholder: "স্টেশন কোড বা নাম লিখুন (যেমন BZA, NDLS)",
    allTrains: "সমস্ত প্রস্থান",
    stoppingTrains: "থামানো ট্রেন",
    nonStoppingTrains: "অ-স্টপ ট্রেন",
    departingTrains: "প্রস্থানকারী ট্রেন",
    noDepartures: "কোন প্রস্থান সময়সূচী উপলব্ধ নেই।",
    halt: "যাত্রাবিরতি",
    pass: "পাস",
    
    profileTitle: "ট্রেন প্রোফাইল সময়সূচী",
    trackLive: "লাইভ ট্র্যাক করুন",
    stopTracking: "ট্র্যাকিং বন্ধ করুন",
    locating: "সন্ধান করা হচ্ছে...",
    origin: "উৎস",
    destination: "গন্তব্য",
    distance: "মোট দূরত্ব",
    duration: "সময়কাল",
    liveTelemetry: "লাইভ ট্র্যাকিং স্থানাঙ্ক যাচাই করা হয়েছে",
    liveStream: "লাইভ স্ট্রিম",
    syncing: "সিঙ্ক হচ্ছে...",
    polling: "পোলিং ফলব্যাক",
    currentPos: "বর্তমান অবস্থান",
    nextStop: "পরবর্তী স্টেশন",
    delay: "বিলম্ব",
    speedBearing: "গতি / অভিমুখ",
    onTime: "ঠিক সময়",
    lateMins: "মিনিট বিলম্ব",
    routeTimetable: "যাত্রাপথ এবং সময়সূচী",
    seq: "ক্রম",
    station: "স্টেশন",
    timings: "নির্ধারিত সময়",
    haltMins: "মিনিট",
    liveStatusLabel: "লাইভ স্থিতি",
    passesThrough: "থামেনা (অ-স্টপ)",
    
    delayAlerts: "বিলম্ব সতর্কতা সেটিংস",
    alertDesc: "বিলম্ব এর বেশি হলে সতর্কতা দিন:",
    saveAlert: "সতর্কতা সংরক্ষণ করুন",
    removeAlert: "সতর্কতা মুছুন",
    cancel: "বাতিল করুন",
    
    dashboardTitle: "আপনার ড্যাশবোর্ড",
    dashboardDesc: "পছন্দসই রুট এবং আপনার কনফিগার করা বিলম্ব সতর্কতা পরিচালনা করুন।",
    bookmarksTab: "বুকমার্ক",
    alertsTab: "বিলম্ব সতর্কতা",
    bookmarkedTrains: "বুকমার্ক করা ট্রেন",
    bookmarkedStations: "বুকমার্ক করা স্টেশন",
    noBookmarkedTrains: "কোন বুকমার্ক করা ট্রেন পাওয়া যায়নি।",
    noBookmarkedStations: "কোন বুকমার্ক করা স্টেশন পাওয়া যায়নি।",
    delayAlarms: "কনফিগার করা বিলম্ব অ্যালার্ম",
    delayThresholdLabel: "বিলম্বের সীমা:",
    currentDelayLabel: "বর্তমান বিলম্ব:",
    delayWarningBadge: "⚠️ বিলম্ব সতর্কতা",
    normalRunBadge: "✅ সাধারণ গতি",
    noActiveAlarms: "কোন বিলম্ব সতর্কতা সেট করা নেই।",
    noActiveAlarmsDesc: "বাস্তব সময়ের সতর্কতা পেতে ট্রেনের বিশদ পৃষ্ঠায় বেল আইকনে ক্লিক করুন।",
    
    journeyPlannerTitle: "যাত্রার পরিকল্পনা",
    journeyPlannerDesc: "স্টেশনগুলির মধ্যে সরাসরি রুট এবং ১টি সংযোগকারী স্টেশনের মাধ্যমে যাত্রা খুঁজুন।",
    findTravelRoutes: "যাত্রার পথ খুঁজুন",
    originStationLabel: "উৎস স্টেশন",
    destinationStationLabel: "গন্তব্য স্টেশন",
    originPlaceholder: "উৎস স্টেশন লিখুন (যেমন BZA, বিজয়ওয়াড়া)",
    destinationPlaceholder: "গন্তব্য স্টেশন লিখুন (যেমন NDLS, দিল্লী)",
    availableJourneys: "উপলব্ধ যাত্রা",
    directTrain: "সরাসরি ট্রেন",
    connectingTrain: "১টি সংযোগকারী স্টেশন",
    transferAt: "সংযোগকারী স্টেশন:",
    layover: "যাত্রাবিরতির সময়:",
    tightConnection: "কম ব্যবধান সতর্কতা!",
    longLayover: "দীর্ঘ যাত্রাবিরতি",
    noJourneysFound: "কোন যাত্রাপথ পাওয়া যায়নি",
    noJourneysFoundDesc: "এই স্টেশনগুলির মধ্যে সরাসরি বা সংযোগকারী কোন ট্রেন পাওয়া যায়নি।"
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved as LanguageType) || 'en';
  });

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
