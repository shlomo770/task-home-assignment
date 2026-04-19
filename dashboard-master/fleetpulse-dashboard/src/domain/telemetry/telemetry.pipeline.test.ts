import { describe, expect, it } from 'vitest';
import { appConstants } from '../../config/appConstants';
import { evaluateTelemetryEvent } from './telemetry.pipeline';
import type { Truck } from '../fleet/fleet.types';
import type { TelemetryEventDto } from '../../core/realtime/realtime.types';

function createTruck(overrides?: Partial<Truck>): Truck {
  return {
    id: 'truck-1',
    name: 'Truck 1',
    status: 'active',
    position: { lat: 32.1, lng: 34.8 },
    telemetry: {
      speedKmh: 55,
      fuelPercent: 60,
      engineTempC: 82,
      mileageKm: 15000,
      timestamp: '2026-04-16T10:00:00.000Z',
    },
    assignedRouteId: null,
    anomalies: [],
    lastTelemetryAt: '2026-04-16T10:00:00.000Z',
    trail: [],
    ...overrides,
  };
}

function createEvent(overrides?: Partial<TelemetryEventDto>): TelemetryEventDto {
  return {
    truckId: 'truck-1',
    lat: 32.11,
    lng: 34.81,
    speedKmh: 58,
    fuelPercent: 59,
    engineTempC: 83,
    mileageKm: 15001,
    timestamp: '2026-04-16T10:00:05.000Z',
    ...overrides,
  };
}

describe('telemetry.pipeline', () => {
  it('applies normal telemetry event', () => {
    const truck = createTruck();
    const event = createEvent();

    const result = evaluateTelemetryEvent(truck, event);

    expect(result.shouldApply).toBe(true);
    expect(result.nextTelemetry?.speedKmh).toBe(58);
    expect(result.anomaliesToAdd).toHaveLength(0);
  });

  it('ignores out-of-order telemetry event', () => {
    const truck = createTruck();
    const event = createEvent({
      timestamp: '2026-04-16T09:59:00.000Z',
    });

    const result = evaluateTelemetryEvent(truck, event);

    expect(result.shouldApply).toBe(false);
    expect(result.nextTelemetry).toBeNull();
    expect(result.anomaliesToAdd[0]?.type).toBe('out_of_order');
  });

  it('filters speed anomaly and keeps previous speed', () => {
    const truck = createTruck({
      telemetry: {
        speedKmh: 55,
        fuelPercent: 60,
        engineTempC: 82,
        mileageKm: 15000,
        timestamp: '2026-04-16T10:00:00.000Z',
      },
    });

    const event = createEvent({
      speedKmh: appConstants.telemetryRules.speedAnomalyThresholdKmh,
    });

    const result = evaluateTelemetryEvent(truck, event);

    expect(result.shouldApply).toBe(true);
    expect(result.nextTelemetry?.speedKmh).toBe(55);
    expect(result.anomaliesToAdd.some((a) => a.type === 'speed_sensor_stuck')).toBe(true);
  });

  it('filters fuel glitch and keeps previous fuel', () => {
    const truck = createTruck({
      telemetry: {
        speedKmh: 40,
        fuelPercent: 63,
        engineTempC: 82,
        mileageKm: 15000,
        timestamp: '2026-04-16T10:00:00.000Z',
      },
    });

    const event = createEvent({
      fuelPercent: 0,
      speedKmh: 25,
    });

    const result = evaluateTelemetryEvent(truck, event);

    expect(result.shouldApply).toBe(true);
    expect(result.nextTelemetry?.fuelPercent).toBe(63);
    expect(result.anomaliesToAdd.some((a) => a.type === 'fuel_glitch')).toBe(true);
  });
});