import { useMemo, useState } from 'react';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';
import { useAppSelector } from '../../shared/hooks/useAppSelector';
import { selectAllRoutes, selectSelectedRoute, selectSelectedRouteHistory } from '../../domain/routes/routes.selectors';
import { selectAllTrucks } from '../../domain/fleet/fleet.selectors';
import {
  clearRouteConflict,
  clearRouteError,
  createRouteThunk,
  fetchRoutes,
  reassignRouteThunk,
  selectRoute,
  updateRouteStatusThunk,
} from './routesSlice';

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </div>
      <div className="mt-1 text-[15px] font-semibold text-slate-900">{title}</div>
    </div>
  );
}

function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
    />
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
    >
      {children}
    </select>
  );
}

function ActionButton({
  children,
  tone = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'violet' | 'ghost';
}) {
  const styles =
    tone === 'primary'
      ? 'border border-cyan-300 bg-cyan-500 text-white hover:bg-cyan-600'
      : tone === 'secondary'
        ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
        : tone === 'violet'
          ? 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-[12px] font-medium transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

function RouteChip({
  status,
}: {
  status: string;
}) {
  const cls =
    status === 'completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'in-progress'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : status === 'cancelled'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${cls}`}>
      {status}
    </div>
  );
}

export function RouteManagementPanel() {
  const dispatch = useAppDispatch();
  const routes = useAppSelector(selectAllRoutes);
  const selectedRoute = useAppSelector(selectSelectedRoute);
  const trucks = useAppSelector(selectAllTrucks);
  const routesState = useAppSelector((state) => state.routes);
  const selectedRouteHistory = useAppSelector(selectSelectedRouteHistory);

  const [createTruckId, setCreateTruckId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [nextStatus, setNextStatus] = useState<'assigned' | 'in-progress' | 'completed' | 'cancelled'>('assigned');
  const [reassignTruckId, setReassignTruckId] = useState('');

  const availableTruckOptions = useMemo(
    () => trucks.map((truck) => ({ id: truck.id, label: `${truck.name} (${truck.id})` })),
    [trucks]
  );

  const onCreateRoute = () => {
    if (!createTruckId || !origin.trim() || !destination.trim()) return;

    dispatch(
      createRouteThunk({
        truckId: createTruckId,
        origin: origin.trim(),
        destination: destination.trim(),
      })
    );

    setOrigin('');
    setDestination('');
  };

  const onUpdateStatus = () => {
    if (!selectedRoute) return;

    dispatch(
      updateRouteStatusThunk({
        routeId: selectedRoute.id,
        version: selectedRoute.version,
        data: { status: nextStatus },
      })
    );
  };

  const onReassignRoute = () => {
    if (!selectedRoute || !reassignTruckId) return;

    dispatch(
      reassignRouteThunk({
        routeId: selectedRoute.id,
        version: selectedRoute.version,
        data: { truckId: reassignTruckId },
      })
    );
  };

  return (
    <section className="rounded-[22px] border border-slate-200/70 bg-white/80 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle eyebrow="Route Operations" title="Assignment workflow" />

        <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
          {routes.length} routes
        </div>
      </div>

      {routesState.error && (
        <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] text-rose-700">
          <div>{routesState.error}</div>
          <div className="mt-2">
            <ActionButton tone="ghost" onClick={() => dispatch(clearRouteError())}>
              Clear
            </ActionButton>
          </div>
        </div>
      )}

      {routesState.conflict && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
          <div className="font-semibold">Route conflict detected</div>
          <div className="mt-1 text-[11px] text-amber-700">
            Another dispatcher updated this route before your latest action.
          </div>

          <div className="mt-2 rounded-xl border border-amber-200/80 bg-white/70 px-3 py-2 text-[11px]">
            <div>Route ID: {routesState.conflict.serverVersion.id}</div>
            <div>Truck: {routesState.conflict.serverVersion.truckId}</div>
            <div>Status: {routesState.conflict.serverVersion.status}</div>
            <div>Version: {routesState.conflict.serverVersion.version}</div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <ActionButton tone="secondary" onClick={() => dispatch(fetchRoutes())}>
              Refresh routes
            </ActionButton>
            <ActionButton tone="ghost" onClick={() => dispatch(clearRouteConflict())}>
              Dismiss
            </ActionButton>
          </div>
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-1.5">
          {routes.map((route) => {
            const selected = selectedRoute?.id === route.id;

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => dispatch(selectRoute(route.id))}
                className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${selected
                  ? 'border-cyan-300 bg-cyan-50 shadow-[0_4px_18px_rgba(34,211,238,0.10)]'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-slate-900">
                      {route.id}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-slate-600">
                      {route.origin} → {route.destination}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <RouteChip status={route.status} />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px] text-slate-500">
                  <span className="truncate">Truck: {route.truckId}</span>
                  <span>v{route.version}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="mb-2 text-[13px] font-semibold text-slate-900">Create route</div>

            <div className="space-y-2">
              <Select
                value={createTruckId}
                onChange={(e) => setCreateTruckId(e.target.value)}
              >
                <option value="">Select truck</option>
                {availableTruckOptions.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.label}
                  </option>
                ))}
              </Select>

              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin"
              />

              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
              />

              <ActionButton tone="primary" onClick={onCreateRoute} className="w-full">
                Create route
              </ActionButton>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="mb-2 text-[13px] font-semibold text-slate-900">Selected route</div>

            {!selectedRoute ? (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-[12px] text-slate-500">
                No route selected
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-700">
                  <div className="font-semibold text-slate-900">{selectedRoute.id}</div>

                  <div className="mt-2">
                    <span className="text-slate-500">From:</span> {selectedRoute.origin}
                  </div>

                  <div className="mt-1">
                    <span className="text-slate-500">To:</span> {selectedRoute.destination}
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500">
                    Truck: {selectedRoute.truckId}
                  </div>

                  <div className="mt-1 text-[11px] text-slate-500">
                    Status: {selectedRoute.status} · Version: {selectedRoute.version}
                  </div>

                  <div className="mt-1 text-[11px] text-slate-500">
                    Updated: {selectedRoute.updatedAt}
                  </div>
                </div>

                <div className="space-y-2">
                  <Select
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(
                        e.target.value as 'assigned' | 'in-progress' | 'completed' | 'cancelled'
                      )
                    }
                  >
                    <option value="assigned">assigned</option>
                    <option value="in-progress">in-progress</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </Select>

                  <ActionButton tone="secondary" onClick={onUpdateStatus} className="w-full">
                    Update status
                  </ActionButton>

                  <Select
                    value={reassignTruckId}
                    onChange={(e) => setReassignTruckId(e.target.value)}
                  >
                    <option value="">Select truck</option>
                    {availableTruckOptions.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.label}
                      </option>
                    ))}
                  </Select>

                  <ActionButton
                    tone="violet"
                    onClick={onReassignRoute}
                    className="w-full"
                    disabled={
                      !selectedRoute ||
                      !reassignTruckId ||
                      reassignTruckId === selectedRoute.truckId ||
                      routesState.mutationLoading === 'loading'
                    }
                  >
                    Reassign route
                  </ActionButton>
                  {selectedRoute && reassignTruckId === selectedRoute.truckId && (
                    <div className="text-[11px] text-amber-600">
                      Select a different truck for reassignment
                    </div>
                  )}

                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Route History
                  </div>

                
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Route History
                    </div>

                    {selectedRouteHistory.length === 0 ? (
                      <div className="text-[11px] text-slate-500">No history yet</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedRouteHistory.slice(0, 6).map((item, index) => (
                          <div
                            key={`${item.action}-${item.at}-${index}`}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div className="text-[11px] font-medium text-slate-800">
                              {item.action.replaceAll('_', ' ')}
                            </div>

                            {item.details && (
                              <div className="mt-1 text-[11px] text-slate-600">
                                {item.details}
                              </div>
                            )}

                            <div className="mt-1 text-[10.5px] text-slate-500">
                              {item.by ?? 'system'} · {item.at}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {routesState.mutationLoading === 'loading' && (
                  <div className="text-[11px] text-slate-500">Saving changes...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}