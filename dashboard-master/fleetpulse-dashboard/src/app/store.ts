import { configureStore } from '@reduxjs/toolkit';
import { fleetReducer } from '../features/fleet-overview/fleetSlice';
import { connectionReducer } from '../features/observability/connectionSlice';
import { dispatchersReducer } from '../features/dispatcher-presence/dispatchersSlice';
import { routesReducer } from '../features/route-management/routesSlice';


export const store = configureStore({
  reducer: {
    fleet: fleetReducer,
    connection: connectionReducer,
    dispatchers: dispatchersReducer,
    routes: routesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;