import { useEffect } from 'react';
import type { WsClient } from '../../core/realtime/wsClient';
import { useAppSelector } from '../../shared/hooks/useAppSelector';
import { selectSelectedTruckId } from '../../domain/fleet/fleet.selectors';
import type { RefObject } from 'react';


export function useDispatcherViewingSync(wsClientRef: RefObject<WsClient | null>) {
  const selectedTruckId = useAppSelector(selectSelectedTruckId);

  useEffect(() => {
    const wsClient = wsClientRef.current;
    if (!wsClient) return;

    wsClient.send({
      type: 'viewing_truck',
      truckId: selectedTruckId,
    });
  }, [wsClientRef, selectedTruckId]);
}