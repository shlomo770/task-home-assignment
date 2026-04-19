import { useEffect } from 'react';
import { appConstants } from '../../config/appConstants';
import { cleanupGhostDispatchers } from './dispatchersSlice';
import { useAppDispatch } from '../../shared/hooks/useAppDispatch';

export function useDispatcherPresenceCleanup() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const interval = window.setInterval(() => {
      dispatch(
        cleanupGhostDispatchers({
          now: new Date().toISOString(),
          maxAgeMs: appConstants.dispatcherPresenceCleanup.maxAgeMs,
        })
      );
    }, appConstants.dispatcherPresenceCleanup.intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [dispatch]);
}