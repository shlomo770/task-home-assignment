import type { RootState } from '../../app/store';
import { createSelector } from '@reduxjs/toolkit';

const selectFleet = (state: RootState) => state.fleet;
const selectConnection = (state: RootState) => state.connection;
const selectDispatchers = (state: RootState) => state.dispatchers;

export const selectSystemHealthSummary = createSelector(
  [selectFleet, selectConnection, selectDispatchers],
  (fleet, connection, dispatchers) => {
    const totalTrucks = fleet.allIds.length;
    const staleTrucks = fleet.allIds
      .map((id) => fleet.byId[id])
      .filter((truck) =>
        truck?.anomalies.some((anomaly) => anomaly.type === 'stale_telemetry')
      ).length;

    const trucksWithWarnings = fleet.allIds
      .map((id) => fleet.byId[id])
      .filter((truck) =>
        truck?.anomalies.some((anomaly) => anomaly.severity === 'warning')
      ).length;

    const onlineDispatchers = dispatchers.allIds
      .map((id) => dispatchers.byId[id])
      .filter((dispatcher) => dispatcher?.isOnline).length;

    return {
      totalTrucks,
      staleTrucks,
      trucksWithWarnings,
      onlineDispatchers,
      sseStatus: connection.sse.status,
      wsStatus: connection.ws.status,
      degradedMode: connection.degradedMode,
      fleetLastLoadedAt: fleet.lastLoadedAt,
    };
  }
);