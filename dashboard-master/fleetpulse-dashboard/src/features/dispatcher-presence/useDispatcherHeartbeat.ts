import { useEffect } from 'react';
import type { RefObject } from 'react';
import { appConstants } from '../../config/appConstants';
import type { WsClient } from '../../core/realtime/wsClient';

export function useDispatcherHeartbeat(wsClientRef: RefObject<WsClient | null>) {
  useEffect(() => {
    const wsClient = wsClientRef.current;
    if (!wsClient) return;

    const interval = window.setInterval(() => {
      wsClient.send({
        type: 'ping',
        timestamp: new Date().toISOString(),
      });
    }, appConstants.dispatcherHeartbeat.intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [wsClientRef]);
}