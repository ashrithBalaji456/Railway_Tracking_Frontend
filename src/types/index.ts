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

