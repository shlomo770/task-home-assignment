import type { FleetTruckDto } from '../../core/api/api.types';
import type { Truck } from './fleet.types';

export function mapFleetTruckDtoToTruck(dto: FleetTruckDto): Truck {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    position: {
      lat: dto.lat,
      lng: dto.lng,
    },
    telemetry: {
      speedKmh: dto.speedKmh ?? null,
      fuelPercent: dto.fuelPercent ?? null,
      engineTempC: dto.engineTempC ?? null,
      mileageKm: dto.mileageKm ?? null,
      timestamp: dto.updatedAt ?? null,
    },
    assignedRouteId: dto.assignedRouteId ?? null,
    anomalies: [],
    lastTelemetryAt: dto.updatedAt ?? null,
    trail:
      dto.lat != null && dto.lng != null && dto.updatedAt
        ? [{ lat: dto.lat, lng: dto.lng, timestamp: dto.updatedAt }]
        : [],
  };
}