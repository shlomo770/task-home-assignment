import { selectAllTrucks, selectSelectedTruckId } from '../../domain/fleet/fleet.selectors';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';
import { useAppSelector } from '../../shared/hooks/useAppSelector';
import { selectTruck } from './fleetSlice';

function getStatusTone(status: string) {
  if (status === 'active') return 'bg-emerald-500';
  if (status === 'maintenance') return 'bg-amber-500';
  return 'bg-slate-400';
}

function formatTemp(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${value.toFixed(1)}°`;
}

export function TruckList() {
  const dispatch = useAppDispatch();
  const trucks = useAppSelector(selectAllTrucks);
  const selectedTruckId = useAppSelector(selectSelectedTruckId);

  return (
    <section className="flex h-full flex-col rounded-[18px] border border-slate-200/70 bg-white/80 p-2.5 shadow-sm">
      {/* HEADER */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="text-[12px] font-semibold text-slate-800">
          Fleet
        </div>
        <div className="text-[11px] text-slate-500">{trucks.length}</div>
      </div>

      {/* LIST */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {trucks.map((truck) => {
          const selected = truck.id === selectedTruckId;

          return (
            <button
              key={truck.id}
              onClick={() => dispatch(selectTruck(truck.id))}
              className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${
                selected
                  ? 'border-cyan-300 bg-cyan-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* LEFT */}
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getStatusTone(truck.status)}`} />

                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-slate-900">
                      {truck.name}
                    </div>
                    <div className="truncate text-[10px] text-slate-500">
                      {truck.id}
                    </div>
                  </div>
                </div>

                {/* RIGHT STATS */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span>{truck.telemetry.speedKmh ?? '-'} km</span>
                  <span className="text-slate-300">•</span>
                  <span>{truck.telemetry.fuelPercent ?? '-'}%</span>
                  <span className="text-slate-300">•</span>
                  <span>{formatTemp(truck.telemetry.engineTempC)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}