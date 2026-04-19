import { useState } from 'react';
import { httpFetch } from '../../core/api/httpClient';

type AlertType = 'info' | 'warning' | 'emergency';

export function TruckAlert({ truckId }: { truckId: string }) {
  const [type, setType] = useState<AlertType>('info');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = message.trim().length >= 3;

  const sendAlert = async () => {
    if (!isValid || sending) return;

    setSending(true);
    setSent(false);
    setError(null);

    try {
      await httpFetch(`/fleet/${truckId}/alert`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          message: message.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      setSent(true);
      setMessage('');
    } catch (e) {
      console.error(e);
      setError('Failed to send alert');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Send Alert
        </div>

        <div className="text-[10px] text-slate-500">
          Truck: {truckId}
        </div>
      </div>

      {/* Alert Type */}
      <div className="mb-3">
        <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
          Alert Type
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value as AlertType)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
          Message
        </label>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter alert message..."
          className="min-h-[90px] w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
        />
      </div>

      {/* Validation */}
      {!isValid && message.length > 0 && (
        <div className="mt-2 text-xs text-amber-400">
          Message must be at least 3 characters
        </div>
      )}

      {/* Button */}
      <button
        onClick={sendAlert}
        disabled={!isValid || sending}
        className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
          sending
            ? 'bg-slate-700'
            : type === 'emergency'
            ? 'bg-rose-600 hover:bg-rose-500'
            : type === 'warning'
            ? 'bg-amber-600 hover:bg-amber-500'
            : 'bg-cyan-600 hover:bg-cyan-500'
        } disabled:opacity-50`}
      >
        {sending ? 'Sending...' : 'Send Alert'}
      </button>

      {/* Success */}
      {sent && (
        <div className="mt-2 text-xs text-emerald-400">
          Alert sent successfully
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 text-xs text-rose-400">
          {error}
        </div>
      )}
    </div>
  );
}