import { describe, expect, it } from 'vitest';
import { appConstants } from '../../config/appConstants';
import {
    createTruckAnomaly,
    isFuelGlitch,
    isOutOfOrderTelemetry,
    isSpeedAnomaly,
    isStaleTelemetry,
} from './telemetry.rules';
import type { Truck } from '../fleet/fleet.types';

function createTruck(overrides?: Partial<Truck>): Truck {
    return {
        id: 'truck-1',
        name: 'Truck 1',
        status: 'active',
        position: { lat: 32.1, lng: 34.8 },
        telemetry: {
            speedKmh: 50,
            fuelPercent: 70,
            engineTempC: 80,
            mileageKm: 12000,
            timestamp: '2026-04-16T10:00:00.000Z',
        },
        assignedRouteId: null,
        anomalies: [],
        lastTelemetryAt: '2026-04-16T10:00:00.000Z',
        ...overrides,
        trail: [],
    };
}

describe('telemetry.rules', () => {
    it('detects out-of-order telemetry', () => {
        const truck = createTruck();
        const result = isOutOfOrderTelemetry(truck, {
            timestamp: '2026-04-16T09:59:59.000Z',
        });

        expect(result).toBe(true);
    });

    it('does not mark newer telemetry as out-of-order', () => {
        const truck = createTruck();
        const result = isOutOfOrderTelemetry(truck, {
            timestamp: '2026-04-16T10:00:05.000Z',
        });

        expect(result).toBe(false);
    });

    it('detects speed anomaly at threshold+', () => {
        const t = appConstants.telemetryRules.speedAnomalyThresholdKmh;
        expect(isSpeedAnomaly({ speedKmh: t })).toBe(true);
        expect(isSpeedAnomaly({ speedKmh: t + 1 })).toBe(true);
        expect(isSpeedAnomaly({ speedKmh: 120 })).toBe(false);
    });

    it('detects fuel glitch when fuel drops to zero while moving', () => {
        const truck = createTruck({
            telemetry: {
                speedKmh: 45,
                fuelPercent: 62,
                engineTempC: 80,
                mileageKm: 12000,
                timestamp: '2026-04-16T10:00:00.000Z',
            },
        });

        const result = isFuelGlitch(truck, {
            fuelPercent: 0,
            speedKmh: 30,
        });

        expect(result).toBe(true);
    });

    it('does not detect fuel glitch when previous fuel is already low', () => {
        const minPrev = appConstants.telemetryRules.fuelGlitchMinPrevPercent;
        const truck = createTruck({
            telemetry: {
                speedKmh: 20,
                fuelPercent: Math.max(0, minPrev - 1),
                engineTempC: 80,
                mileageKm: 12000,
                timestamp: '2026-04-16T10:00:00.000Z',
            },
        });

        const result = isFuelGlitch(truck, {
            fuelPercent: 0,
            speedKmh: 20,
        });

        expect(result).toBe(false);
    });

    it('detects stale telemetry after threshold', () => {
        const truck = createTruck({
            lastTelemetryAt: '2026-04-16T10:00:00.000Z',
        });

        const now = new Date('2026-04-16T10:00:20.000Z').getTime();

        expect(
            isStaleTelemetry(truck, now, appConstants.telemetryRules.defaultStaleAfterMs)
        ).toBe(true);
    });

    it('creates anomaly object correctly', () => {
        const anomaly = createTruckAnomaly(
            'stale_telemetry',
            'warning',
            'Telemetry is stale',
            '2026-04-16T10:00:20.000Z'
        );

        expect(anomaly).toEqual({
            type: 'stale_telemetry',
            severity: 'warning',
            message: 'Telemetry is stale',
            detectedAt: '2026-04-16T10:00:20.000Z',
        });
    });
});