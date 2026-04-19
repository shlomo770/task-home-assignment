import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ChannelConnectionState,
  ConnectionState,
  RealtimeConnectionStatus,
} from '../../domain/connection/connection.types';

function createChannelInitialState(): ChannelConnectionState {
  return {
    status: 'idle',
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    reconnectAttempts: 0,
    lastErrorMessage: null,
  };
}

const initialState: ConnectionState = {
  sse: createChannelInitialState(),
  ws: createChannelInitialState(),
  degradedMode: false,
};

type UpdateChannelPayload = {
  channel: 'sse' | 'ws';
  status: RealtimeConnectionStatus;
  errorMessage?: string | null;
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setChannelStatus(state, action: PayloadAction<UpdateChannelPayload>) {
      const { channel, status, errorMessage } = action.payload;
      const target = state[channel];

      target.status = status;
      target.lastErrorMessage = errorMessage ?? null;

      if (status === 'connected') {
        target.lastConnectedAt = new Date().toISOString();
      }

      if (status === 'disconnected' || status === 'error') {
        target.lastDisconnectedAt = new Date().toISOString();
      }

      if (status === 'reconnecting') {
        target.reconnectAttempts += 1;
      }
    },
    setDegradedMode(state, action: PayloadAction<boolean>) {
      state.degradedMode = action.payload;
    },
    resetConnectionState() {
      return initialState;
    },
  },
});

export const { setChannelStatus, setDegradedMode, resetConnectionState } =
  connectionSlice.actions;

export const connectionReducer = connectionSlice.reducer;