import type { TelemetryEventDto } from '../../core/realtime/realtime.types';
import type { Truck, TruckAnomaly } from '../fleet/fleet.types';
import {
  createTruckAnomaly,
  isFuelGlitch,
  isOutOfOrderTelemetry,
  isSpeedAnomaly,
  isValidCoordinates,
} from './telemetry.rules';

export type TelemetryEvaluationResult = {
  shouldApply: boolean;
  nextTelemetry: {
    lat: number;
    lng: number;
    speedKmh: number;
    fuelPercent: number;
    engineTempC: number;
    mileageKm: number;
    timestamp: string;
  } | null;
  anomaliesToAdd: TruckAnomaly[];
};

export function evaluateTelemetryEvent(
  truck: Truck,
  event: TelemetryEventDto
): TelemetryEvaluationResult {
  const anomaliesToAdd: TruckAnomaly[] = [];

  if (!isValidCoordinates(event.lat, event.lng)) {
    anomaliesToAdd.push(
      createTruckAnomaly(
        'telemetry_invalid',
        'warning',
        'Invalid GPS coordinates ignored',
        event.timestamp
      )
    );

    return {
      shouldApply: false,
      nextTelemetry: null,
      anomaliesToAdd,
    };
  }

  if (isOutOfOrderTelemetry(truck, event)) {
    anomaliesToAdd.push(
      createTruckAnomaly(
        'out_of_order',
        'warning',
        'Ignored out-of-order telemetry event',
        event.timestamp
      )
    );

    return {
      shouldApply: false,
      nextTelemetry: null,
      anomaliesToAdd,
    };
  }

  const speedKmh = isSpeedAnomaly(event)
    ? (truck.telemetry.speedKmh ?? 0)
    : event.speedKmh;

  if (isSpeedAnomaly(event)) {
    anomaliesToAdd.push(
      createTruckAnomaly(
        'speed_sensor_stuck',
        'warning',
        'Speed anomaly detected and filtered',
        event.timestamp
      )
    );
  }

  const fuelPercent = isFuelGlitch(truck, event)
    ? (truck.telemetry.fuelPercent ?? event.fuelPercent)
    : event.fuelPercent;

  if (isFuelGlitch(truck, event)) {
    anomaliesToAdd.push(
      createTruckAnomaly(
        'fuel_glitch',
        'warning',
        'Fuel glitch detected and ignored',
        event.timestamp
      )
    );
  }

  return {
    shouldApply: true,
    nextTelemetry: {
      lat: event.lat,
      lng: event.lng,
      speedKmh,
      fuelPercent,
      engineTempC: event.engineTempC,
      mileageKm: event.mileageKm,
      timestamp: event.timestamp,
    },
    anomaliesToAdd,
  };
}