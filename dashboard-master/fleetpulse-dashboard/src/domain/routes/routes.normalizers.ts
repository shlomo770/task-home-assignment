import type { RouteDto } from '../../core/api/api.types';
import type { Route } from './routes.types';

export function mapRouteDtoToRoute(dto: RouteDto): Route {
  return {
    id: dto.id,
    truckId: dto.truckId,
    origin: dto.origin,
    destination: dto.destination,
    status: dto.status,
    version: dto.version,
    updatedAt: dto.updatedAt,
    updatedByDispatcherId: dto.updatedByDispatcherId ?? null,
  };
}