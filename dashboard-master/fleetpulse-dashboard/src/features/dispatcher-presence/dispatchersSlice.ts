import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Dispatcher } from '../../domain/dispatchers/dispatchers.types';
import type { ID } from '../../shared/types/common';

interface DispatchersState {
    byId: Record<string, Dispatcher>;
    allIds: string[];
    currentDispatcherId: ID | null;
}

const initialState: DispatchersState = {
    byId: {},
    allIds: [],
    currentDispatcherId: null,
};

const upsertDispatcher = (
    state: DispatchersState,
    dispatcher: Dispatcher
) => {
    const exists = Boolean(state.byId[dispatcher.id]);
    state.byId[dispatcher.id] = dispatcher;

    if (!exists) {
        state.allIds.push(dispatcher.id);
    }
}


const isOlderThan = (timestamp: string | null, maxAgeMs: number, now: number) => {
    if (!timestamp) return true;

    const value = new Date(timestamp).getTime();
    if (Number.isNaN(value)) return true;

    return now - value > maxAgeMs;
}


const dispatchersSlice = createSlice({
    name: 'dispatchers',
    initialState,
    reducers: {
        setCurrentDispatcherId(state, action: PayloadAction<ID | null>) {
            state.currentDispatcherId = action.payload;
        },

        registerCurrentDispatcher(
            state,
            action: PayloadAction<{ id: ID; name: string }>
        ) {
            const { id, name } = action.payload;

            upsertDispatcher(state, {
                id,
                name,
                isOnline: true,
                viewingTruckId: null,
                lastSeenAt: new Date().toISOString(),
            });

            state.currentDispatcherId = id;
        },

        dispatcherJoined(
            state,
            action: PayloadAction<{ id: ID; name: string; joinedAt: string }>
        ) {
            const { id, name, joinedAt } = action.payload;

            upsertDispatcher(state, {
                id,
                name,
                isOnline: true,
                viewingTruckId: null,
                lastSeenAt: joinedAt,
            });
        },

        dispatcherLeft(
            state,
            action: PayloadAction<{ id: ID; leftAt: string }>
        ) {
            const dispatcher = state.byId[action.payload.id];
            if (!dispatcher) return;

            dispatcher.isOnline = false;
            dispatcher.lastSeenAt = action.payload.leftAt;
            dispatcher.viewingTruckId = null;
        },

        dispatcherViewingTruck(
            state,
            action: PayloadAction<{
                id: ID;
                truckId: ID | null;
                timestamp: string;
            }>
        ) {
            const dispatcher = state.byId[action.payload.id];
            if (!dispatcher) return;

            dispatcher.viewingTruckId = action.payload.truckId;
            dispatcher.lastSeenAt = action.payload.timestamp;
            dispatcher.isOnline = true;
        },

        dispatcherHeartbeat(
            state,
            action: PayloadAction<{ id: ID; timestamp: string }>
        ) {
            const dispatcher = state.byId[action.payload.id];
            if (!dispatcher) return;

            dispatcher.lastSeenAt = action.payload.timestamp;
            dispatcher.isOnline = true;
        },

        cleanupGhostDispatchers(
            state,
            action: PayloadAction<{ now: string; maxAgeMs: number }>
        ) {
            const nowMs = new Date(action.payload.now).getTime();

            for (const id of state.allIds) {
                const dispatcher = state.byId[id];
                if (!dispatcher) continue;

                // לא מנקים את המשתמש המקומי אוטומטית
                if (id === state.currentDispatcherId) continue;

                const shouldExpire = isOlderThan(
                    dispatcher.lastSeenAt,
                    action.payload.maxAgeMs,
                    nowMs
                );

                if (shouldExpire) {
                    dispatcher.isOnline = false;
                    dispatcher.viewingTruckId = null;
                }
            }
        },

        resetDispatchersState() {
            return initialState;
        },

        setDispatchersSnapshot(
            state,
            action: PayloadAction<
                Array<{
                    id: ID;
                    name: string;
                    isOnline: boolean;
                    viewingTruckId: ID | null;
                    lastSeenAt: string | null;
                }>
            >
        ) {
            for (const dispatcher of action.payload) {
                const exists = Boolean(state.byId[dispatcher.id]);

                state.byId[dispatcher.id] = {
                    id: dispatcher.id,
                    name: dispatcher.name,
                    isOnline: dispatcher.isOnline,
                    viewingTruckId: dispatcher.viewingTruckId,
                    lastSeenAt: dispatcher.lastSeenAt,
                };

                if (!exists) {
                    state.allIds.push(dispatcher.id);
                }
            }
        },
    },
});

export const {
    setCurrentDispatcherId,
    registerCurrentDispatcher,
    dispatcherJoined,
    dispatcherLeft,
    dispatcherViewingTruck,
    dispatcherHeartbeat,
    resetDispatchersState,
    cleanupGhostDispatchers,
    setDispatchersSnapshot,
} = dispatchersSlice.actions;

export const dispatchersReducer = dispatchersSlice.reducer;