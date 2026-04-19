import type { Coordinates, ISODateString } from '../../shared/types/common';

export type TruckStatus = 'active' | 'idle' | 'maintenance';

export type TruckAnomalySeverity = 'info' | 'warning' | 'critical';

export type TruckAnomalyType =
  | 'fuel_glitch'
  | 'speed_sensor_stuck'
  | 'out_of_order'
  | 'gps_batch'
  | 'stale_telemetry'
  | 'telemetry_invalid';

export interface TruckAnomaly {
  type: TruckAnomalyType;
  severity: TruckAnomalySeverity;
  message: string;
  detectedAt: ISODateString;
}

export interface TruckTelemetrySnapshot {
  speedKmh: number | null;
  fuelPercent: number | null;
  engineTempC: number | null;
  mileageKm: number | null;
  timestamp: ISODateString | null;
}

export interface TruckTrailPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface Truck {
  id: string;
  name: string;
  status: TruckStatus;
  position: Coordinates | null;
  telemetry: TruckTelemetrySnapshot;
  assignedRouteId: string | null;
  anomalies: TruckAnomaly[];
  lastTelemetryAt: string | null;
  trail: TruckTrailPoint[];
}
