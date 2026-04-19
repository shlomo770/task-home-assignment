import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { TelemetryHistoryDto } from '../../core/api/telemetry.api';

interface Props {
  data: TelemetryHistoryDto[];
}

export function TelemetryCharts({ data }: Props) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Telemetry History
      </div>

      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120}>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />

            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10 }}
              stroke="#64748b"
            />

            <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="speedKmh"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="fuelPercent"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="engineTempC"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}