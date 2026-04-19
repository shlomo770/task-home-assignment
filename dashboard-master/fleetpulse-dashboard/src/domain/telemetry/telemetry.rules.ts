import { appConstants } from '../../config/appConstants';
import type { TelemetryEventDto } from '../../core/realtime/realtime.types';
import type { Truck, TruckAnomaly } from '../fleet/fleet.types';

const { speedAnomalyThresholdKmh, fuelGlitchMinPrevPercent, defaultStaleAfterMs } =
  appConstants.telemetryRules;

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function isOutOfOrderTelemetry(
  truck: Truck,
  event: Pick<TelemetryEventDto, 'timestamp'>
): boolean {
  const currentTs = toTimestamp(truck.lastTelemetryAt);
  const incomingTs = toTimestamp(event.timestamp);

  if (currentTs === null || incomingTs === null) return false;
  return incomingTs < currentTs;
}

export function isSpeedAnomaly(
  event: Pick<TelemetryEventDto, 'speedKmh'>
): boolean {
  if (event.speedKmh == null) return false;
  return event.speedKmh >= speedAnomalyThresholdKmh;
}

export function isFuelGlitch(
  truck: Truck,
  event: Pick<TelemetryEventDto, 'fuelPercent' | 'speedKmh'>
): boolean {
  const prevFuel = truck.telemetry.fuelPercent;
  const nextFuel = event.fuelPercent;

  if (prevFuel == null || nextFuel == null) return false;

  // זיהוי קפיצה רגעית ל-0 למרות שהיה דלק קודם
  if (
    prevFuel > fuelGlitchMinPrevPercent &&
    nextFuel === 0 &&
    (event.speedKmh ?? 0) > 0
  ) {
    return true;
  }

  return false;
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

export function isStaleTelemetry(
  truck: Truck,
  now = Date.now(),
  staleMs = defaultStaleAfterMs
): boolean {
  const ts = toTimestamp(truck.lastTelemetryAt);
  if (ts === null) return true;
  return now - ts > staleMs;
}

export function createTruckAnomaly(
  type: TruckAnomaly['type'],
  severity: TruckAnomaly['severity'],
  message: string,
  detectedAt: string
): TruckAnomaly {
  return {
    type,
    severity,
    message,
    detectedAt,
  };
}