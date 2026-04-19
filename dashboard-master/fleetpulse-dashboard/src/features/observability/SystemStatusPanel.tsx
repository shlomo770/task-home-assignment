import { useAppSelector } from '../../shared/hooks/useAppSelector';
import { selectSystemHealthSummary } from './observability.selectors';

function StatusTile({
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
                : 'border-slate-200/80 bg-white text-slate-900';

    return (
        <div className={`rounded-2xl border px-3 py-2 ${toneClass}`}>
            <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
                {label}
            </div>
            <div className="mt-1 text-[13px] font-semibold">{value}</div>
        </div>
    );
}

export function SystemStatusPanel() {
    const summary = useAppSelector(selectSystemHealthSummary);

    return (
        <section className="rounded-[22px] border border-slate-200/70 bg-white/80 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Observability
                </div>
                <div className="mt-1 text-[14px] font-semibold text-slate-900">System status</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <StatusTile
                    label="SSE"
                    value={summary.sseStatus}
                    tone={summary.sseStatus === 'connected' ? 'good' : 'warn'}
                />
                <StatusTile
                    label="WS"
                    value={summary.wsStatus}
                    tone={summary.wsStatus === 'connected' ? 'good' : 'warn'}
                />
                <StatusTile label="Dispatchers" value={String(summary.onlineDispatchers)} />
                <StatusTile label="Fleet" value={String(summary.totalTrucks)} />
                <StatusTile label="Stale" value={String(summary.staleTrucks)} tone={summary.staleTrucks > 0 ? 'warn' : 'default'} />
                <StatusTile label="Warnings" value={String(summary.trucksWithWarnings)} tone={summary.trucksWithWarnings > 0 ? 'warn' : 'default'} />
            </div>

            <div className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Degraded mode</span>
                    <span className="font-medium text-slate-900">
                        {summary.degradedMode ? 'Enabled' : 'Disabled'}
                    </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-500">Fleet last loaded</span>
                    <span className="truncate font-medium text-slate-900">
                        {summary.fleetLastLoadedAt ?? 'N/A'}
                    </span>
                </div>
            </div>
        </section>
    );
}