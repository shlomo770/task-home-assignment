import type { RootState } from '../../app/store';

export const selectConnectionState = (state: RootState) => state.connection;
export const selectSseConnection = (state: RootState) => state.connection.sse;
export const selectWsConnection = (state: RootState) => state.connection.ws;