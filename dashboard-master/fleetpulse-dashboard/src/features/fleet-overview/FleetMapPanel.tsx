import { useEffect, useMemo, useRef } from 'react';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  Source,
  Layer,
} from 'react-map-gl/maplibre';
import type {
  Feature,
  FeatureCollection,
  LineString,
  GeoJsonProperties,
} from 'geojson';
import type { LineLayerSpecification } from 'maplibre-gl';
import type { MapRef, ViewState } from 'react-map-gl/maplibre';
import { selectAllTrucks, selectSelectedTruckId } from '../../domain/fleet/fleet.selectors';
import { selectAllRoutes } from '../../domain/routes/routes.selectors';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';
import { useAppSelector } from '../../shared/hooks/useAppSelector';
import { selectTruck } from './fleetSlice';
import 'maplibre-gl/dist/maplibre-gl.css';

type TruckTrailProperties = GeoJsonProperties & {
  truckId: string;
  selected: boolean;
};

export function FleetMapPanel() {
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapRef | null>(null);
  const trucks = useAppSelector(selectAllTrucks);
  const selectedTruckId = useAppSelector(selectSelectedTruckId);
  const routes = useAppSelector(selectAllRoutes);

  const trucksWithPosition = useMemo(
    () => trucks.filter((truck) => truck.position),
    [trucks]
  );

  const initialViewState = useMemo(
    (): Pick<ViewState, 'longitude' | 'latitude' | 'zoom'> => ({
      longitude: trucksWithPosition[0]?.position?.lng ?? 34.7818,
      latitude: trucksWithPosition[0]?.position?.lat ?? 32.0853,
      zoom: 11.5,
    }),
    [trucksWithPosition]
  );

  const selectedTruck = useMemo(
    () => trucksWithPosition.find((truck) => truck.id === selectedTruckId),
    [trucksWithPosition, selectedTruckId]
  );

  useEffect(() => {
    if (!selectedTruck?.position) return;

    mapRef.current?.flyTo({
      center: [selectedTruck.position.lng, selectedTruck.position.lat],
      zoom: 15,
      duration: 700,
    });
  }, [selectedTruck]);

  const assignedRoute = useMemo(
    () =>
      selectedTruck
        ? routes.find((route) => route.id === selectedTruck.assignedRouteId)
        : undefined,
    [selectedTruck, routes]
  );

  const trailsGeoJson = useMemo<FeatureCollection<LineString, TruckTrailProperties>>(() => {
    const features: Feature<LineString, TruckTrailProperties>[] = trucksWithPosition
      .filter((truck) => Array.isArray(truck.trail) && truck.trail.length > 1)
      .map((truck) => ({
        type: 'Feature',
        properties: {
          truckId: truck.id,
          selected: truck.id === selectedTruckId,
        },
        geometry: {
          type: 'LineString',
          coordinates: truck.trail.map((point) => [point.lng, point.lat]),
        },
      }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [trucksWithPosition, selectedTruckId]);

  const trailGlowLayer: LineLayerSpecification = {
    id: 'truck-trails-glow',
    type: 'line',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'selected'], true],
        '#22d3ee',
        '#94a3b8',
      ],
      'line-width': [
        'case',
        ['==', ['get', 'selected'], true],
        9,
        6,
      ],
      'line-opacity': [
        'case',
        ['==', ['get', 'selected'], true],
        0.16,
        0.1,
      ],
      'line-blur': 1.2,
    },
    source: ''
  };

  const trailMainLayer: LineLayerSpecification = {
    id: 'truck-trails-main',
    type: 'line',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'selected'], true],
        '#06b6d4',
        '#64748b',
      ],
      'line-width': [
        'case',
        ['==', ['get', 'selected'], true],
        4,
        2.5,
      ],
      'line-opacity': [
        'case',
        ['==', ['get', 'selected'], true],
        0.95,
        0.65,
      ],
      'line-dasharray': [
        'case',
        ['==', ['get', 'selected'], true],
        ['literal', [2.2, 2]],
        ['literal', [1.6, 2.4]],
      ],
    },
    source: ''
  };

  const trailAccentLayer: LineLayerSpecification = {
    id: 'truck-trails-accent',
    type: 'line',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    filter: ['==', ['get', 'selected'], true],
    paint: {
      'line-color': '#cffafe',
      'line-width': 1.2,
      'line-opacity': 0.75,
      'line-dasharray': ['literal', [0.01, 2.8]],
    },
    source: ''
  };

  return (
    <section className="rounded-[22px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Tactical View
          </div>
          <div className="mt-1 text-[15px] font-semibold text-slate-900">
            Live fleet map
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
          {trucksWithPosition.length} vehicles
        </div>
      </div>

      <div className="relative h-[400px] overflow-hidden rounded-[20px] border border-slate-200/80 bg-slate-100">
        <Map
          ref={mapRef}
          initialViewState={initialViewState}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
          dragRotate={false}
          touchZoomRotate={false}
          doubleClickZoom={false}
          scrollZoom={false}
          onClick={() => dispatch(selectTruck(null))}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" showCompass={false} />

          <Source id="truck-trails" type="geojson" data={trailsGeoJson}>
            <Layer {...trailGlowLayer} />
            <Layer {...trailMainLayer} />
            <Layer {...trailAccentLayer} />
          </Source>

          {trucksWithPosition.map((truck) => {
            const isSelected = truck.id === selectedTruckId;

            return (
              <Marker
                key={truck.id}
                longitude={truck.position!.lng}
                latitude={truck.position!.lat}
                anchor="center"
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch(selectTruck(truck.id));
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl border text-[18px] shadow-sm transition ${
                    isSelected
                      ? 'border-cyan-300 bg-cyan-50 ring-2 ring-cyan-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                  title={truck.name}
                >
                  🚚
                </button>
              </Marker>
            );
          })}

          {selectedTruck?.position && (
            <Popup
              longitude={selectedTruck.position.lng}
              latitude={selectedTruck.position.lat}
              anchor="top"
              closeButton={false}
              closeOnClick={false}
              offset={14}
              className="fleet-map-popup"
            >
              <div className="min-w-[130px]">
                <div className="text-[12px] font-semibold text-slate-900">
                  {selectedTruck.name}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {selectedTruck.id}
                </div>

                <div className="mt-2 space-y-1 text-[11px] text-slate-700">
                  <div>Speed: {selectedTruck.telemetry.speedKmh ?? '-'} km/h</div>
                  <div>Fuel: {selectedTruck.telemetry.fuelPercent ?? '-'}%</div>
                  <div>
                    Temp:{' '}
                    {selectedTruck.telemetry.engineTempC != null
                      ? `${selectedTruck.telemetry.engineTempC.toFixed(1)}°C`
                      : '-'}
                  </div>
                  <div>
                    Route:{' '}
                    {assignedRoute
                      ? `${assignedRoute.origin} → ${assignedRoute.destination}`
                      : 'None'}
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        <div className="pointer-events-none absolute left-3 top-3 rounded-2xl border border-white/80 bg-white/85 px-3 py-2 text-[11px] text-slate-600 shadow-sm backdrop-blur">
          Clean light basemap · compact markers · styled dashed trails
        </div>
      </div>

      <style>
        {`
          .maplibregl-popup-content {
            border-radius: 12px;
            padding: 8px 10px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
          }

          .maplibregl-popup-tip {
            border-top-color: white !important;
          }

          .maplibregl-ctrl-group {
            border-radius: 14px !important;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(15,23,42,0.08) !important;
          }
        `}
      </style>
    </section>
  );
}