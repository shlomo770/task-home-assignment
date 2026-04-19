import { useEffect } from 'react';
import { appConstants } from '../../config/appConstants';
import { refreshStaleTelemetry } from './fleetSlice';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';

export function useFleetStaleMonitor() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const interval = window.setInterval(() => {
      dispatch(refreshStaleTelemetry());
    }, appConstants.fleetStaleMonitor.pollIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [dispatch]);
}