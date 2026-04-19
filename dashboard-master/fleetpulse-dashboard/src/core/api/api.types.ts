import type { ID, ISODateString } from '../../shared/types/common';

export interface FleetTruckDto {
  id: ID;
  name: string;
  status: 'active' | 'idle' | 'maintenance';
  lat: number;
  lng: number;
  speedKmh: number;
  fuelPercent: number;
  engineTempC: number;
  mileageKm: number;
  assignedRouteId: ID | null;
  updatedAt: ISODateString;
}

export interface RouteDto {
  id: ID;
  truckId: ID;
  origin: string;
  destination: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  version: string;
  updatedAt: ISODateString;
  updatedByDispatcherId: ID | null;
}

export interface CreateRouteRequestDto {
  truckId: ID;
  origin: string;
  destination: string;
}

export interface UpdateRouteRequestDto {
  status?: 'assigned' | 'in-progress' | 'completed' | 'cancelled';
}

export interface ReassignRouteRequestDto {
  truckId: ID;
}