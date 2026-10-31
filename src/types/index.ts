export interface TrainException {
  trainNumber: string;
  trainName: string;
  trainType?: string;
  startDate?: string;
  endDate?: string;
  sourceStationCode?: string;
  sourceStationName?: string;
  destinationStationCode?: string;
  destinationStationName?: string;
  status?: string;
  primaryType?: string;
  type?: string; // CANCELLED, DIVERTED, RESCHEDULED, PARTIALLY_CANCELLED
  message?: string;
  description?: string;
  stationsAffected?: string[];
  originalRoute?: string;
  alternativeRoute?: string;
  runningDays?: string;
  distance?: number;
  duration?: number;
  lastUpdatedAt?: string;
}

export interface TrainExceptionSummary {
  total: number;
  cancelled: number;
  diverted: number;
  rescheduled: number;
  partiallyCancelled: number;
}

export interface TrainDelayReport {
  trainNumber: string;
  trainName: string;
  historicalAverageDelayMinutes?: number;
  avgArrivalDelayMinutes?: number;
  avgDepartureDelayMinutes?: number;
  onTimePercentage?: number;
  ontimePercentage?: number;
  punctualityGrade: string; // 'A', 'B', 'C', 'D'
  totalRunsAnalyzed?: number;
  totalRunsSampled?: number;
  delayDistribution?: Record<string, number>;
  remarks?: string;
}

export interface ClassFare {
  classCode: string;
  className: string;
  baseFare?: number;
  totalFare: number;
}

export interface TrainFare {
  trainNumber: string;
  trainName?: string;
  sourceStation?: string;
  destinationStation?: string;
  distanceKm?: number;
  fares?: ClassFare[];
  classFares?: ClassFare[];
}

export interface JourneyLegDelay {
  train: string;
  station: string;
  dayOfWeek?: number;
  arrivalDelayMinutes?: number;
  departureDelayMinutes?: number;
  samples?: number;
  maxDelayMinutes?: number;
  ontimeCount?: number;
}

export interface JourneyOverlay {
  delays: JourneyLegDelay[];
}

export interface TrainBetweenStations {
  trainNumber: string;
  trainName: string;
  trainType: string;
  fromStationCode: string;
  toStationCode: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  runningDays: string;
  fromSequence?: number;
  toSequence?: number;
}

export interface QuickFact {
  label: string;
  value: string;
  icon?: string;
}

export interface RelatedTrain {
  trainNumber: string;
  trainName: string;
  route: string;
}

export interface ArticleSection {
  type: 'heading' | 'paragraph' | 'image' | 'tip' | 'trivia' | 'quote';
  title?: string;
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  caption?: string;
  altText?: string;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  coverImage: string;
  author: string;
  authorRole: string;
  readTimeMinutes: number;
  publishedDate: string;
  featured: boolean;
  tags: string[];
  quickFacts: QuickFact[];
  relatedTrains: RelatedTrain[];
  sections: ArticleSection[];
}

export interface StationLiveStatus {
  stationCode: string;
  stationName: string;
  sequenceNumber?: number;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutes?: number;
  status?: string; // ARRIVED, DEPARTED, SKIPPED, UPCOMING, SCHEDULED
  isHalt?: boolean;
  platform?: string;
}

export interface TrainLiveStatus {
  trainNumber: string;
  trainName: string;
  runStatus?: string;
  currentStationCode?: string;
  currentStationName?: string;
  nextStationCode?: string;
  nextStationName?: string;
  delayMinutes?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  bearing?: number;
  routeProgress?: number;
  lastLocationInfo?: string;
  lastUpdatedAt?: string;
  stations?: StationLiveStatus[];
  isCancelled?: boolean;
  isDiverted?: boolean;
  isRescheduled?: boolean;
  disruptionMessage?: string;
  skippedStations?: string[];
}


