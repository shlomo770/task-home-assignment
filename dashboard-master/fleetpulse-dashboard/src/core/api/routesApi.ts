import { httpFetch } from './httpClient';
import type {
  RouteDto,
  CreateRouteRequestDto,
  UpdateRouteRequestDto,
  ReassignRouteRequestDto,
} from './api.types';

export function getRoutes() {
  return httpFetch<RouteDto[]>('/routes');
}

export function createRoute(data: CreateRouteRequestDto) {
  return httpFetch<RouteDto>('/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRoute(
  routeId: string,
  version: string,
  data: UpdateRouteRequestDto
) {
  return httpFetch<RouteDto>(`/routes/${routeId}`, {
    method: 'PATCH',
    headers: {
      'If-Match': version,
    },
    body: JSON.stringify(data),
  });
}

export function reassignRoute(
  routeId: string,
  version: string,
  data: ReassignRouteRequestDto
) {
  return httpFetch<RouteDto>(`/routes/${routeId}/reassign`, {
    method: 'PUT',
    headers: {
      'If-Match': version,
    },
    body: JSON.stringify(data),
  });
}