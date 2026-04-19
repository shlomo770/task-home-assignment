import type { Coordinates, ID, ISODateString } from '../../shared/types/common';

export interface TelemetryPoint {
  truckId: ID;
  position: Coordinates | null;
  speedKmh: number | null;
  fuelPercent: number | null;
  engineTempC: number | null;
  mileageKm: number | null;
  timestamp: ISODateString;
}

export interface TelemetryHistoryPoint {
  timestamp: ISODateString;
  speedKmh: number | null;
  fuelPercent: number | null;
  engineTempC: number | null;
  mileageKm: number | null;
}