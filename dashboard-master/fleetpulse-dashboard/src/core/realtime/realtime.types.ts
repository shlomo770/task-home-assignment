import type { ID, ISODateString } from '../../shared/types/common';

export interface TelemetryEventDto {
  truckId: ID;
  lat: number;
  lng: number;
  speedKmh: number;
  fuelPercent: number;
  engineTempC: number;
  mileageKm: number;
  timestamp: ISODateString;
}

export interface TelemetryBatchEventDto {
  truckId: ID;
  points: TelemetryEventDto[];
}

export interface DispatcherSnapshotItem {
  id: ID;
  name: string;
  isOnline: boolean;
  viewingTruckId: ID | null;
  lastSeenAt: ISODateString | null;
}

export type IncomingWsMessage =
  | {
    type: 'registered';
    dispatcherId: ID;
    name: string;
  }
  | {
    type: 'dispatchers_snapshot';
    dispatchers: Array<{
      id: ID;
      name: string;
      isOnline: boolean;
      viewingTruckId: ID | null;
      lastSeenAt: ISODateString | null;
    }>;
  }
  | {
    type: 'dispatchers_snapshot';
    dispatchers: DispatcherSnapshotItem[];
  }
  | {
    type: 'dispatcher_joined';
    dispatcherId: ID;
    name: string;
    joinedAt: ISODateString;
  }
  | {
    type: 'dispatcher_left';
    dispatcherId: ID;
    leftAt: ISODateString;
  }
  | {
    type: 'dispatcher_viewing';
    dispatcherId: ID;
    truckId: ID | null;
    timestamp: ISODateString;
  }
  | {
    type: 'route_assigned';
    routeId: ID;
    truckId: ID;
    updatedByDispatcherId: ID | null;
    timestamp: ISODateString;
  }
  | {
    type: 'route_updated';
    routeId: ID;
    updatedByDispatcherId: ID | null;
    timestamp: ISODateString;
  }
  | {
    type: 'route_reassigned';
    routeId: ID;
    truckId: ID;
    updatedByDispatcherId: ID | null;
    timestamp: ISODateString;
  }
  | {
    type: 'truck_alert';
    truckId: ID;
    message: string;
    updatedByDispatcherId?: ID | null;
    timestamp: ISODateString;
  }
  | {
    type: 'fleet_reset';
    timestamp: ISODateString;
  }
  | {
    type: 'pong';
    timestamp: ISODateString;
  }
  | {
    type: 'dispatchers_snapshot';
    dispatchers: Array<{
      id: ID;
      name: string;
      isOnline: boolean;
      viewingTruckId: ID | null;
      lastSeenAt: ISODateString | null;
    }>;
  };

export type OutgoingWsMessage =
  | {
    type: 'register_dispatcher';
    name: string;
  }
  | {
    type: 'viewing_truck';
    truckId: ID | null;
  }
  | {
    type: 'ping';
    timestamp: ISODateString;
  };