import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
    createRoute as createRouteApi,
    getRoutes,
    reassignRoute as reassignRouteApi,
    updateRoute as updateRouteApi,
} from '../../core/api/routesApi';
import type {
    CreateRouteRequestDto,
    ReassignRouteRequestDto,
    RouteDto,
    UpdateRouteRequestDto,
} from '../../core/api/api.types';
import type { LoadingState, ID } from '../../shared/types/common';
import type { Route, RouteConflict, RouteHistoryItem } from '../../domain/routes/routes.types';
import { mapRouteDtoToRoute } from '../../domain/routes/routes.normalizers';
import { syncAssignedRoutes } from '../fleet-overview/fleetSlice';
import { buildTruckRouteAssignments } from '../../domain/routes/routes.sync';
import type { AppDispatch } from '../../app/store';
import type { AppError } from '../../shared/types/common';

interface RoutesState {
    byId: Record<string, Route>;
    allIds: string[];
    selectedRouteId: ID | null;
    loading: LoadingState;
    mutationLoading: LoadingState;
    error: string | null;
    conflict: RouteConflict | null;
    lastLoadedAt: string | null;
    routeHistoryById: Record<string, RouteHistoryItem[]>;
}

const initialState: RoutesState = {
    byId: {},
    allIds: [],
    selectedRouteId: null,
    loading: 'idle',
    mutationLoading: 'idle',
    error: null,
    conflict: null,
    lastLoadedAt: null,
    routeHistoryById: {}
};

export const fetchRoutes = createAsyncThunk<
    Route[],
    void,
    { dispatch: AppDispatch }
>('routes/fetchRoutes', async (_, thunkApi) => {
    const data: RouteDto[] = await getRoutes();
    const routes = data.map(mapRouteDtoToRoute);

    thunkApi.dispatch(syncAssignedRoutes(buildTruckRouteAssignments(routes)));

    return routes;
});

const upsertRoute = (state: RoutesState, route: Route) => {
    const exists = Boolean(state.byId[route.id]);
    state.byId[route.id] = route;

    if (!exists) {
        state.allIds.push(route.id);
    }
}

const pushRouteHistory = (
    state: RoutesState,
    routeId: string,
    item: RouteHistoryItem
) => {
    const current = state.routeHistoryById[routeId] ?? [];
    state.routeHistoryById[routeId] = [item, ...current].slice(0, 20);
}

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as AppError).message;
        if (typeof message === 'string' && message.trim()) {
            return message;
        }
    }
    return fallback;
}

export const createRouteThunk = createAsyncThunk<
    Route,
    CreateRouteRequestDto,
    { rejectValue: string; dispatch: AppDispatch }
>('routes/createRoute', async (payload, thunkApi) => {
    try {
        const data = await createRouteApi(payload);
        const route = mapRouteDtoToRoute(data);
        thunkApi.dispatch(fetchRoutes());
        return route;
    } catch (error: unknown) {
        return thunkApi.rejectWithValue(getErrorMessage(error, 'Failed to create route'));
    }
});


export const updateRouteStatusThunk = createAsyncThunk<
    Route,
    { routeId: string; version: string; data: UpdateRouteRequestDto },
    { rejectValue: { message: string; conflictRoute?: Route }; dispatch: AppDispatch }
>('routes/updateRouteStatus', async ({ routeId, version, data }, thunkApi) => {
    try {
        const result = await updateRouteApi(routeId, version, data);
        const route = mapRouteDtoToRoute(result);
        thunkApi.dispatch(fetchRoutes());
        return route;
    } catch (error: unknown) {
        const maybeServerRoute = (error as AppError | undefined)?.details && typeof (error as AppError).details === 'object'
            ? ((error as AppError).details as { currentRoute?: RouteDto }).currentRoute
            : undefined;
        return thunkApi.rejectWithValue({
            message: getErrorMessage(error, 'Failed to update route'),
            conflictRoute: maybeServerRoute ? mapRouteDtoToRoute(maybeServerRoute) : undefined,
        });
    }
});

export const reassignRouteThunk = createAsyncThunk<
    Route,
    { routeId: string; version: string; data: ReassignRouteRequestDto },
    { rejectValue: { message: string; conflictRoute?: Route }; dispatch: AppDispatch }
>('routes/reassignRoute', async ({ routeId, version, data }, thunkApi) => {
    try {
        const result = await reassignRouteApi(routeId, version, data);
        const route = mapRouteDtoToRoute(result);
        thunkApi.dispatch(fetchRoutes());
        return route;
    } catch (error: unknown) {
        const maybeServerRoute = (error as AppError | undefined)?.details && typeof (error as AppError).details === 'object'
            ? ((error as AppError).details as { currentRoute?: RouteDto }).currentRoute
            : undefined;
        return thunkApi.rejectWithValue({
            message: getErrorMessage(error, 'Failed to reassign route'),
            conflictRoute: maybeServerRoute ? mapRouteDtoToRoute(maybeServerRoute) : undefined,
        });
    }
});

const routesSlice = createSlice({
    name: 'routes',
    initialState,
    reducers: {
        selectRoute(state, action: PayloadAction<ID | null>) {
            state.selectedRouteId = action.payload;
        },
        clearRouteError(state) {
            state.error = null;
        },
        clearRouteConflict(state) {
            state.conflict = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoutes.pending, (state) => {
                state.loading = 'loading';
                state.error = null;
            })
            .addCase(fetchRoutes.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.byId = {};
                state.allIds = [];

                for (const route of action.payload) {
                    upsertRoute(state, route);
                }

                state.lastLoadedAt = new Date().toISOString();

                if (!state.selectedRouteId && state.allIds.length > 0) {
                    state.selectedRouteId = state.allIds[0];
                }
            })
            .addCase(fetchRoutes.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.error.message ?? 'Failed to load routes';
            })

            .addCase(createRouteThunk.pending, (state) => {
                state.mutationLoading = 'loading';
                state.error = null;
            })
            .addCase(createRouteThunk.fulfilled, (state, action) => {
                state.mutationLoading = 'succeeded';
                upsertRoute(state, action.payload);
                state.selectedRouteId = action.payload.id;

                pushRouteHistory(state, action.payload.id, {
                    action: 'created',
                    by: action.payload.updatedByDispatcherId ?? null,
                    at: action.payload.updatedAt,
                    details: `${action.payload.origin} → ${action.payload.destination}`,
                });
            })
            .addCase(createRouteThunk.rejected, (state, action) => {
                state.mutationLoading = 'failed';
                state.error = action.payload ?? action.error.message ?? 'Failed to create route';
            })

            .addCase(updateRouteStatusThunk.pending, (state) => {
                state.mutationLoading = 'loading';
                state.error = null;
                state.conflict = null;
            })
            .addCase(updateRouteStatusThunk.fulfilled, (state, action) => {
                state.mutationLoading = 'succeeded';
                const previous = state.byId[action.payload.id];
                upsertRoute(state, action.payload);
                state.selectedRouteId = action.payload.id;
                if (previous && previous.status !== action.payload.status) {
                    pushRouteHistory(state, action.payload.id, {
                        action: 'status_updated',
                        by: action.payload.updatedByDispatcherId ?? null,
                        at: action.payload.updatedAt,
                        details: `${previous.status} → ${action.payload.status}`,
                    });
                }
            })
            .addCase(updateRouteStatusThunk.rejected, (state, action) => {
                state.mutationLoading = 'failed';
                state.error = action.payload?.message ?? action.error.message ?? 'Failed to update route';

                if (action.payload?.conflictRoute) {
                    state.conflict = {
                        routeId: action.payload.conflictRoute.id,
                        localAttempt: {},
                        serverVersion: action.payload.conflictRoute,
                        conflictDetectedAt: new Date().toISOString(),
                    };
                }
            })

            .addCase(reassignRouteThunk.pending, (state) => {
                state.mutationLoading = 'loading';
                state.error = null;
                state.conflict = null;
            })
            .addCase(reassignRouteThunk.fulfilled, (state, action) => {
                state.mutationLoading = 'succeeded';
                const previous = state.byId[action.payload.id];
                upsertRoute(state, action.payload);
                state.selectedRouteId = action.payload.id;
                if (previous && previous.truckId !== action.payload.truckId) {
                    pushRouteHistory(state, action.payload.id, {
                        action: 'reassigned',
                        by: action.payload.updatedByDispatcherId ?? null,
                        at: action.payload.updatedAt,
                        details: `${previous.truckId} → ${action.payload.truckId}`,
                    });
                }
            })
            .addCase(reassignRouteThunk.rejected, (state, action) => {
                state.mutationLoading = 'failed';
                state.error = action.payload?.message ?? action.error.message ?? 'Failed to reassign route';

                if (action.payload?.conflictRoute) {
                    state.conflict = {
                        routeId: action.payload.conflictRoute.id,
                        localAttempt: {},
                        serverVersion: action.payload.conflictRoute,
                        conflictDetectedAt: new Date().toISOString(),
                    };
                }
            });
    },
});

export const { selectRoute, clearRouteError, clearRouteConflict } =
    routesSlice.actions;

export const routesReducer = routesSlice.reducer;