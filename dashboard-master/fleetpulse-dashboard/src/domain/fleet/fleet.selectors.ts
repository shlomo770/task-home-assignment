import type { RootState } from '../../app/store';
import { createSelector } from '@reduxjs/toolkit';

export const selectFleetState = (state: RootState) => state.fleet;

export const selectAllTrucks = createSelector([selectFleetState], (fleet) =>
  fleet.allIds.map((id: string) => fleet.byId[id])
);

export const selectSelectedTruckId = (state: RootState) =>
  state.fleet.selectedTruckId;

export const selectSelectedTruck = (state: RootState) => {
  const id = state.fleet.selectedTruckId;
  return id ? state.fleet.byId[id] ?? null : null;
};