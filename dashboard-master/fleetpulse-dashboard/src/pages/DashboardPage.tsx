import { useEffect } from 'react';
import { fetchFleet } from '../features/fleet-overview/fleetSlice';
import { TruckList } from '../features/fleet-overview/TruckList';
import { VehicleDetailsPanel } from '../features/vehicle-details/VehicleDetailsPanel';
import { useAppDispatch } from '../shared/hooks/useAppDispatch';
import { useAppSelector } from '../shared/hooks/useAppSelector';
import { selectFleetState } from '../domain/fleet/fleet.selectors';
import { useFleetTelemetry } from '../features/fleet-overview/useFleetTelemetry';
import {
  selectSseConnection,
  selectWsConnection,
} from '../features/observability/connection.selectors';
import { useFleetStaleMonitor } from '../features/fleet-overview/useFleetStaleMonitor';
import { PresencePanel } from '../features/dispatcher-presence/PresencePanel';
import { useDispatcherPresence } from '../features/dispatcher-presence/useDispatcherPresence';
import { useDispatcherViewingSync } from '../features/dispatcher-presence/useDispatcherViewingSync';
import { fetchRoutes } from '../features/route-management/routesSlice';
import { RouteManagementPanel } from '../features/route-management/RouteManagementPanel';
import { SystemStatusPanel } from '../features/observability/SystemStatusPanel';
import { FleetMapPanel } from '../features/fleet-overview/FleetMapPanel';
import { useDispatcherPresenceCleanup } from '../features/dispatcher-presence/useDispatcherPresenceCleanup';
import { useDispatcherHeartbeat } from '../features/dispatcher-presence/useDispatcherHeartbeat';

function TopStatusPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'warn';
}) {
  const toneClass =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <div className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 ${toneClass}`}>
      <span className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="text-[12px] font-semibold">{value}</span>
    </div>
  );
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const fleetState = useAppSelector(selectFleetState);
  const sseConnection = useAppSelector(selectSseConnection);
  const wsConnection = useAppSelector(selectWsConnection);

  useEffect(() => {
    dispatch(fetchFleet());
    dispatch(fetchRoutes());
  }, [dispatch]);

  useFleetTelemetry();
  useFleetStaleMonitor();

  const wsClientRef = useDispatcherPresence();
  useDispatcherViewingSync(wsClientRef);
  useDispatcherHeartbeat(wsClientRef);
  useDispatcherPresenceCleanup();
  const fleetCount = fleetState.allIds.length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef5fb_0%,#f8fbff_42%,#edf4fa_100%)] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-4 py-4 md:px-5 xl:px-6">
        <div className="rounded-[26px] border border-slate-200/70 bg-white/78 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:p-4">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/15" />
                <div>
                  <h1 className="text-[23px] font-semibold tracking-tight text-slate-900">
                    FleetPulse Control
                  </h1>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Real-time fleet operations and dispatcher coordination
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:min-w-[620px]">
              <TopStatusPill
                label="SSE"
                value={sseConnection.status}
                tone={sseConnection.status === 'connected' ? 'good' : 'warn'}
              />
              <TopStatusPill
                label="WebSocket"
                value={wsConnection.status}
                tone={wsConnection.status === 'connected' ? 'good' : 'warn'}
              />
              <TopStatusPill label="Fleet" value={`${fleetCount} trucks`} />
              <TopStatusPill
                label="Load"
                value={fleetState.loading}
                tone={fleetState.loading === 'failed' ? 'warn' : 'default'}
              />
            </div>
          </div>

          {fleetState.error && (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
              {fleetState.error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[310px_minmax(0,1fr)_310px]">
            <div className="min-h-[620px]">
              <TruckList />
            </div>

            <div className="flex min-h-[620px] flex-col gap-3">
              <FleetMapPanel />
              <RouteManagementPanel />
            </div>

            <div className="flex min-h-[620px] flex-col gap-3">
              <VehicleDetailsPanel />
              <PresencePanel />
              <SystemStatusPanel />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}