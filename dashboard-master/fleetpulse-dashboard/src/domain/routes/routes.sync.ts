import type { Route } from './routes.types';

export function buildTruckRouteAssignments(routes: Route[]) {
  return routes.map((route) => ({
    truckId: route.truckId,
    routeId: route.id,
  }));
}