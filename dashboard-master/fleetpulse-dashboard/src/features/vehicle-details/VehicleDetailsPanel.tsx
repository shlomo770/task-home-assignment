import { selectSelectedTruck } from '../../domain/fleet/fleet.selectors';
import { selectAllRoutes } from '../../domain/routes/routes.selectors';
import { useAppSelector } from '../../shared/hooks/useAppSelector';
import { useEffect, useState } from 'react';
import { getTelemetryHistory, type TelemetryHistoryDto } from '../../core/api/telemetry.api';
import { TelemetryCharts } from './TelemetryCharts';
import { TruckAlert } from './TruckAlert';


function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function VehicleDetailsPanel() {
  const [history, setHistory] = useState<TelemetryHistoryDto[]>([]);
  const truck = useAppSelector(selectSelectedTruck);
  const routes = useAppSelector(selectAllRoutes);

  useEffect(() => {
    if (!truck) return;

    getTelemetryHistory(truck.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [truck]);

  const assignedRoute = truck?.assignedRouteId
    ? routes.find((route) => route.id === truck.assignedRouteId) ?? null
    : null;

  if (!truck) {
    return (
      <section className="rounded-[22px] border border-slate-200/70 bg-white/80 p-3">
        <div className="text-[14px] font-semibold text-slate-900">Vehicle details</div>
        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
          No truck selected
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[22px] border border-slate-200/70 bg-white/80 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Vehicle Details
          </div>
          <div className="mt-1 truncate text-[16px] font-semibold text-slate-900">
            {truck.name}
          </div>
          <div className="mt-1 truncate text-[10.5px] text-slate-500">{truck.id}</div>
        </div>

        <div className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-cyan-700">
          {truck.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Speed" value={`${truck.telemetry.speedKmh ?? '-'} km/h`} />
        <StatCard label="Fuel" value={`${truck.telemetry.fuelPercent ?? '-'}%`} />
        <StatCard
          label="Engine Temp"
          value={
            truck.telemetry.engineTempC != null
              ? `${truck.telemetry.engineTempC.toFixed(1)}°C`
              : '-'
          }
        />
        <StatCard label="Mileage" value={`${truck.telemetry.mileageKm ?? '-'} km`} />
      </div>

      <div className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
        <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
          Position
        </div>
        <div className="mt-1.5 text-[12px] text-slate-700">
          {truck.position
            ? `${truck.position.lat.toFixed(5)}, ${truck.position.lng.toFixed(5)}`
            : 'No position'}
        </div>

        <div className="mt-3 text-[9px] uppercase tracking-[0.16em] text-slate-500">
          Last Telemetry
        </div>
        <div className="mt-1.5 text-[12px] text-slate-700">{truck.lastTelemetryAt ?? 'N/A'}</div>
      </div>

      <div className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
        <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
          Assigned Route
        </div>
        <div className="mt-1.5 text-[12px] text-slate-900">
          {assignedRoute
            ? `${assignedRoute.id} · ${assignedRoute.origin} → ${assignedRoute.destination}`
            : 'No assigned route'}
        </div>
        {assignedRoute && (
          <div className="mt-1.5 text-[10.5px] text-slate-500">
            Status: {assignedRoute.status} · Version: {assignedRoute.version}
          </div>
        )}
      </div>

      <div className="mt-1">

      </div>
      <div className="mt-1">
        <TelemetryCharts data={history} />
      </div>

      <div className="mt-1">
        <TruckAlert truckId={truck.id} />
      </div>

      <div className="mb-1.5 text-[9px] uppercase tracking-[0.16em] text-slate-500">
        Anomalies
      </div>

      {truck.anomalies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
          No anomalies detected
        </div>
      ) : (
        <div className="space-y-1.5">
          {truck.anomalies.slice(0, 4).map((anomaly, index) => (
            <div
              key={`${anomaly.type}-${anomaly.detectedAt}-${index}`}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-amber-900">
                    {anomaly.type.replaceAll('_', ' ')}
                  </div>
                  <div className="mt-1 text-[10.5px] text-amber-800">
                    {anomaly.message}
                  </div>
                </div>

                <div className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-amber-800">
                  {anomaly.severity}
                </div>
              </div>

              <div className="mt-1.5 text-[9.5px] text-amber-700/80">
                {anomaly.detectedAt}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}