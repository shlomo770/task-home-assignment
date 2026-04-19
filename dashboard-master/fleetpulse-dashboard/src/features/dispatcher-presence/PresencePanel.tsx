import { selectCurrentDispatcher, selectOnlineDispatchers } from '../../domain/dispatchers/dispatchers.selectors';
import { useAppSelector } from '../../shared/hooks/useAppSelector';

function PresenceRow({
  name,
  id,
  viewingTruckId,
  lastSeenAt,
  isCurrent = false,
}: {
  name: string;
  id: string;
  viewingTruckId?: string | null;
  lastSeenAt?: string | null;
  isCurrent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 ${
        isCurrent
          ? 'border-cyan-200 bg-cyan-50/80'
          : 'border-slate-200/80 bg-white/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium text-slate-900">{name}</div>
            <div className="truncate text-[10.5px] text-slate-500">{id}</div>
          </div>
        </div>

        <div
          className={`rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] ${
            isCurrent
              ? 'border-cyan-200 bg-cyan-100 text-cyan-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isCurrent ? 'You' : 'Online'}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
        <span>Viewing: {viewingTruckId ?? 'None'}</span>
        <span className="text-slate-300">•</span>
        <span>Last seen: {lastSeenAt ?? '-'}</span>
      </div>
    </div>
  );
}

export function PresencePanel() {
  const currentDispatcher = useAppSelector(selectCurrentDispatcher);
  const onlineDispatchers = useAppSelector(selectOnlineDispatchers);

  return (
    <section className="rounded-[22px] border border-slate-200/70 bg-white/80 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Dispatcher Presence
          </div>
          <div className="mt-1 text-[14px] font-semibold text-slate-900">
            Live collaboration
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] text-slate-600">
          {onlineDispatchers.length} online
        </div>
      </div>

      {currentDispatcher && (
        <div className="mb-2">
          <PresenceRow
            name={currentDispatcher.name}
            id={currentDispatcher.id}
            viewingTruckId={currentDispatcher.viewingTruckId}
            lastSeenAt={currentDispatcher.lastSeenAt}
            isCurrent
          />
        </div>
      )}

      <div className="space-y-1.5">
        {onlineDispatchers
          .filter((dispatcher) => dispatcher.id !== currentDispatcher?.id)
          .map((dispatcher) => (
            <PresenceRow
              key={dispatcher.id}
              name={dispatcher.name}
              id={dispatcher.id}
              viewingTruckId={dispatcher.viewingTruckId}
              lastSeenAt={dispatcher.lastSeenAt}
            />
          ))}
      </div>
    </section>
  );
}