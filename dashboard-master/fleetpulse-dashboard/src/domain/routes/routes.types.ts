import type { ID, ISODateString } from '../../shared/types/common';

export type RouteStatus = 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface RouteHistoryItem {
  action: 'created' | 'status_updated' | 'reassigned';
  by: ID | null;
  at: ISODateString;
  details?: string;
}

export interface Route {
  id: ID;
  truckId: ID;
  origin: string;
  destination: string;
  status: RouteStatus;
  version: string;
  updatedAt: ISODateString;
  updatedByDispatcherId: ID | null;
}

export interface RouteConflict {
  routeId: ID;
  localAttempt: Partial<Route>;
  serverVersion: Route;
  conflictDetectedAt: ISODateString;
}