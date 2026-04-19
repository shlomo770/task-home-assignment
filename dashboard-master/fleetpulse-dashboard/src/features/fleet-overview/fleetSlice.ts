import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getFleet } from '../../core/api/fleetApi';
import type { FleetTruckDto } from '../../core/api/api.types';
import type { LoadingState, ID } from '../../shared/types/common';
import type { Truck } from '../../domain/fleet/fleet.types';
import { mapFleetTruckDtoToTruck } from '../../domain/fleet/fleet.normalizers';
import { evaluateTelemetryEvent } from '../../domain/telemetry/telemetry.pipeline';
import { appConstants } from '../../config/appConstants';

interface FleetState {
    byId: Record<string, Truck>;
    allIds: string[];
    selectedTruckId: ID | null;
    loading: LoadingState;
    error: string | null;
    lastLoadedAt: string | null;
}

const initialState: FleetState = {
    byId: {},
    allIds: [],
    selectedTruckId: null,
    loading: 'idle',
    error: null,
    lastLoadedAt: null,
};

export const fetchFleet = createAsyncThunk<Truck[]>(
    'fleet/fetchFleet',
    async () => {
        const data: FleetTruckDto[] = await getFleet();
        return data.map(mapFleetTruckDtoToTruck);
    }
);

type TelemetryUpdatePayload = {
    truckId: string;
    lat: number;
    lng: number;
    speedKmh: number;
    fuelPercent: number;
    engineTempC: number;
    mileageKm: number;
    timestamp: string;
};

const { maxAnomaliesPerTruck, maxTrailPoints, staleTelemetryThresholdMs } =
    appConstants.fleet;

const pushTruckAnomalies = (truck: Truck, anomalies: Truck['anomalies']) => {
    if (!anomalies.length) return;

    truck.anomalies.unshift(...anomalies);

    if (truck.anomalies.length > maxAnomaliesPerTruck) {
        truck.anomalies = truck.anomalies.slice(0, maxAnomaliesPerTruck);
    }
}

const pushTruckTrail = (
    truck: Truck,
    point: { lat: number; lng: number; timestamp: string }
) => {
    truck.trail.push(point);

    if (truck.trail.length > maxTrailPoints) {
        truck.trail = truck.trail.slice(-maxTrailPoints);
    }
}

const removeTruckAnomalyByType = (truck: Truck, type: Truck['anomalies'][number]['type']) => {
    truck.anomalies = truck.anomalies.filter((anomaly) => anomaly.type !== type);
}

const fleetSlice = createSlice({
    name: 'fleet',
    initialState,
    reducers: {
        selectTruck(state, action: PayloadAction<ID | null>) {
            state.selectedTruckId = action.payload;
        },
        upsertTelemetryUpdate(state, action: PayloadAction<TelemetryUpdatePayload>) {
            const {
                truckId,
                lat,
                lng,
                speedKmh,
                fuelPercent,
                engineTempC,
                mileageKm,
                timestamp,
            } = action.payload;

            const truck = state.byId[truckId];
            if (!truck) return;

            const result = evaluateTelemetryEvent(truck, {
                truckId,
                lat,
                lng,
                speedKmh,
                fuelPercent,
                engineTempC,
                mileageKm,
                timestamp,
            });

            pushTruckAnomalies(truck, result.anomaliesToAdd);

            if (!result.shouldApply || !result.nextTelemetry) {
                return;
            }

            removeTruckAnomalyByType(truck, 'stale_telemetry');

            pushTruckTrail(truck, {
                lat: result.nextTelemetry.lat,
                lng: result.nextTelemetry.lng,
                timestamp: result.nextTelemetry.timestamp,
            });

            truck.position = {
                lat: result.nextTelemetry.lat,
                lng: result.nextTelemetry.lng,
            };

            truck.telemetry = {
                speedKmh: result.nextTelemetry.speedKmh,
                fuelPercent: result.nextTelemetry.fuelPercent,
                engineTempC: result.nextTelemetry.engineTempC,
                mileageKm: result.nextTelemetry.mileageKm,
                timestamp: result.nextTelemetry.timestamp,
            };

            truck.lastTelemetryAt = result.nextTelemetry.timestamp;
        },

        upsertTelemetryBatch(
            state,
            action: PayloadAction<{
                truckId: string;
                points: Array<{
                    lat: number;
                    lng: number;
                    speedKmh: number;
                    fuelPercent: number;
                    engineTempC: number;
                    mileageKm: number;
                    timestamp: string;
                }>;
            }>
        ) {
            const { truckId, points } = action.payload;
            const truck = state.byId[truckId];
            if (!truck || points.length === 0) return;

            pushTruckAnomalies(truck, [
                {
                    type: 'gps_batch',
                    severity: 'info',
                    message: `Processed telemetry batch (${points.length} points)`,
                    detectedAt: new Date().toISOString(),
                },
            ]);

            for (const point of points) {
                const result = evaluateTelemetryEvent(truck, {
                    truckId,
                    lat: point.lat,
                    lng: point.lng,
                    speedKmh: point.speedKmh,
                    fuelPercent: point.fuelPercent,
                    engineTempC: point.engineTempC,
                    mileageKm: point.mileageKm,
                    timestamp: point.timestamp,
                });

                pushTruckAnomalies(truck, [
                    {
                        type: 'gps_batch',
                        severity: 'info',
                        message: `Processed GPS batch (${points.length} points), rendering latest position only`,
                        detectedAt: new Date().toISOString(),
                    },
                ]);
                
                if (!result.shouldApply || !result.nextTelemetry) {
                    continue;
                }

                removeTruckAnomalyByType(truck, 'stale_telemetry');

                pushTruckTrail(truck, {
                    lat: result.nextTelemetry.lat,
                    lng: result.nextTelemetry.lng,
                    timestamp: result.nextTelemetry.timestamp,
                });

                truck.position = {
                    lat: result.nextTelemetry.lat,
                    lng: result.nextTelemetry.lng,
                };

                truck.telemetry = {
                    speedKmh: result.nextTelemetry.speedKmh,
                    fuelPercent: result.nextTelemetry.fuelPercent,
                    engineTempC: result.nextTelemetry.engineTempC,
                    mileageKm: result.nextTelemetry.mileageKm,
                    timestamp: result.nextTelemetry.timestamp,
                };

                truck.lastTelemetryAt = result.nextTelemetry.timestamp;
            }
        },

        refreshStaleTelemetry(state) {
            const now = Date.now();

            for (const id of state.allIds) {
                const truck = state.byId[id];
                if (!truck) continue;

                const hasStaleAlready = truck.anomalies.some(
                    (a) => a.type === 'stale_telemetry'
                );

                const lastTs = truck.lastTelemetryAt
                    ? new Date(truck.lastTelemetryAt).getTime()
                    : null;

                const isStale =
                    lastTs === null ||
                    Number.isNaN(lastTs) ||
                    now - lastTs > staleTelemetryThresholdMs;

                if (isStale && !hasStaleAlready) {
                    truck.anomalies.unshift({
                        type: 'stale_telemetry',
                        severity: 'warning',
                        message: 'Telemetry is stale',
                        detectedAt: new Date().toISOString(),
                    });

                    if (truck.anomalies.length > maxAnomaliesPerTruck) {
                        truck.anomalies = truck.anomalies.slice(0, maxAnomaliesPerTruck);
                    }
                }
            }
        },

        assignRouteToTruck(
            state,
            action: PayloadAction<{ truckId: string; routeId: string | null }>
        ) {
            const { truckId, routeId } = action.payload;
            const truck = state.byId[truckId];
            if (!truck) return;

            truck.assignedRouteId = routeId;
        },

        syncAssignedRoutes(
            state,
            action: PayloadAction<Array<{ truckId: string; routeId: string | null }>>
        ) {
            for (const item of action.payload) {
                const truck = state.byId[item.truckId];
                if (!truck) continue;
                truck.assignedRouteId = item.routeId;
            }
        },

    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchFleet.pending, (state) => {
                state.loading = 'loading';
                state.error = null;
            })

            .addCase(fetchFleet.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.error = null;
                state.byId = {};
                state.allIds = [];

                for (const truck of action.payload) {
                    state.byId[truck.id] = truck;
                    state.allIds.push(truck.id);
                }

                state.lastLoadedAt = new Date().toISOString();

                if (!state.selectedTruckId && state.allIds.length > 0) {
                    state.selectedTruckId = state.allIds[0];
                }
            })
            .addCase(fetchFleet.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message ?? 'Failed to load fleet';
            });
    },
});

export const {
    selectTruck,
    upsertTelemetryUpdate,
    upsertTelemetryBatch,
    refreshStaleTelemetry,
    assignRouteToTruck,
    syncAssignedRoutes,
} = fleetSlice.actions;
export const fleetReducer = fleetSlice.reducer;