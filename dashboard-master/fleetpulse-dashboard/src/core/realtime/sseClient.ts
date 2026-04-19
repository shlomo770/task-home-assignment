import type {
  TelemetryBatchEventDto,
  TelemetryEventDto,
} from './realtime.types';
import { runtimeConfig } from '../../config/runtime';

type TelemetryHandler = (event: TelemetryEventDto) => void;
type BatchHandler = (event: TelemetryBatchEventDto) => void;

export class SseClient {
  private eventSource: EventSource | null = null;

  connect(
    onTelemetry: TelemetryHandler,
    onBatch: BatchHandler,
    onError?: (err: unknown) => void
  ) {
    this.eventSource = new EventSource(runtimeConfig.ssePath);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'telemetry') {
          onTelemetry(data.payload);
          return;
        }

        if (data.type === 'telemetry_batch') {
          onBatch(data.payload);
        }
      } catch (error) {
        console.error('SSE parse error', error);
      }
    };

    this.eventSource.onerror = (err) => {
      onError?.(err);
    };
  }

  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
  }
}