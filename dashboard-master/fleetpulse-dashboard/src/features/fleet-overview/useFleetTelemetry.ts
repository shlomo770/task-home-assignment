import { useEffect } from 'react';
import { SseClient } from '../../core/realtime/sseClient';
import {
  setChannelStatus,
} from '../observability/connectionSlice';
import {
  upsertTelemetryBatch,
  upsertTelemetryUpdate,
} from './fleetSlice';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';

export function useFleetTelemetry() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const client = new SseClient();

    dispatch(
      setChannelStatus({
        channel: 'sse',
        status: 'connecting',
      })
    );

    client.connect(
      (event) => {
        dispatch(
          setChannelStatus({
            channel: 'sse',
            status: 'connected',
          })
        );

        dispatch(
          upsertTelemetryUpdate({
            truckId: event.truckId,
            lat: event.lat,
            lng: event.lng,
            speedKmh: event.speedKmh,
            fuelPercent: event.fuelPercent,
            engineTempC: event.engineTempC,
            mileageKm: event.mileageKm,
            timestamp: event.timestamp,
          })
        );
      },
      (batch) => {
        dispatch(
          setChannelStatus({
            channel: 'sse',
            status: 'connected',
          })
        );

        dispatch(
          upsertTelemetryBatch({
            truckId: batch.truckId,
            points: batch.points.map((point) => ({
              lat: point.lat,
              lng: point.lng,
              speedKmh: point.speedKmh,
              fuelPercent: point.fuelPercent,
              engineTempC: point.engineTempC,
              mileageKm: point.mileageKm,
              timestamp: point.timestamp,
            })),
          })
        );
      },
      () => {
        dispatch(
          setChannelStatus({
            channel: 'sse',
            status: 'error',
            errorMessage: 'SSE connection error',
          })
        );
      }
    );

    return () => {
      client.disconnect();

      dispatch(
        setChannelStatus({
          channel: 'sse',
          status: 'disconnected',
        })
      );
    };
  }, [dispatch]);
}