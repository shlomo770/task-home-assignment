import type { RootState } from '../../app/store';
import { createSelector } from '@reduxjs/toolkit';

export const selectDispatchersState = (state: RootState) => state.dispatchers;

export const selectAllDispatchers = createSelector(
  [selectDispatchersState],
  (dispatchers) => dispatchers.allIds.map((id) => dispatchers.byId[id])
);

export const selectOnlineDispatchers = createSelector(
  [selectAllDispatchers],
  (dispatchers) => dispatchers.filter((dispatcher) => dispatcher?.isOnline)
);

export const selectCurrentDispatcherId = (state: RootState) =>
  state.dispatchers.currentDispatcherId;

export const selectCurrentDispatcher = (state: RootState) => {
  const id = state.dispatchers.currentDispatcherId;
  return id ? state.dispatchers.byId[id] ?? null : null;
};