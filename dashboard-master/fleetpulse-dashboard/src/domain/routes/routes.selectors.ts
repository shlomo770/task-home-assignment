import type { RootState } from '../../app/store';
import { createSelector } from '@reduxjs/toolkit';

export const selectRoutesState = (state: RootState) => state.routes;

export const selectAllRoutes = createSelector([selectRoutesState], (routes) =>
  routes.allIds.map((id) => routes.byId[id])
);

export const selectSelectedRouteId = (state: RootState) =>
  state.routes.selectedRouteId;

export const selectSelectedRoute = (state: RootState) => {
  const id = state.routes.selectedRouteId;
  return id ? state.routes.byId[id] ?? null : null;
};

export const selectRoutesByTruckId =
  (truckId: string) =>
    (state: RootState) =>
      state.routes.allIds
        .map((id) => state.routes.byId[id])
        .filter((route) => route?.truckId === truckId);

export const selectSelectedRouteHistory = createSelector(
  [selectRoutesState, selectSelectedRouteId],
  (routes, id) => (id ? routes.routeHistoryById[id] ?? [] : [])
);