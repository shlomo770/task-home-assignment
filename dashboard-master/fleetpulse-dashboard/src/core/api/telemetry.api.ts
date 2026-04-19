import { httpFetch } from './httpClient';

export interface TelemetryHistoryDto {
  timestamp: string;
  speedKmh: number;
  fuelPercent: number;
  engineTempC: number;
  mileageKm?: number;
  lat?: number;
  lng?: number;
}

export function getTelemetryHistory(truckId: string) {
  return httpFetch<TelemetryHistoryDto[]>(`/telemetry/history/${truckId}`);
}