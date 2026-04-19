import { httpFetch } from './httpClient';
import type { FleetTruckDto } from './api.types';

export function getFleet() {
  return httpFetch<FleetTruckDto[]>('/fleet');
}

export function getTruck(truckId: string) {
  return httpFetch<FleetTruckDto>(`/fleet/${truckId}`);
}