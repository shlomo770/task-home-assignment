import type { ISODateString } from '../../shared/types/common';

export type RealtimeConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface ChannelConnectionState {
  status: RealtimeConnectionStatus;
  lastConnectedAt: ISODateString | null;
  lastDisconnectedAt: ISODateString | null;
  reconnectAttempts: number;
  lastErrorMessage: string | null;
}

export interface ConnectionState {
  sse: ChannelConnectionState;
  ws: ChannelConnectionState;
  degradedMode: boolean;
}