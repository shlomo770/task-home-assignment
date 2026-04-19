import { describe, expect, it } from 'vitest';
import { appConstants } from '../../config/appConstants';
import {
  cleanupGhostDispatchers,
  dispatchersReducer,
  registerCurrentDispatcher,
} from './dispatchersSlice';

describe('dispatchersSlice ghost cleanup', () => {
  it('marks stale remote dispatcher as offline', () => {
    const baseState = dispatchersReducer(undefined, { type: '@@INIT' });

    const withCurrent = dispatchersReducer(
      baseState,
      registerCurrentDispatcher({
        id: 'dispatcher-local',
        name: 'Local Dispatcher',
      })
    );

    const stateWithRemote = {
      ...withCurrent,
      byId: {
        ...withCurrent.byId,
        'dispatcher-remote': {
          id: 'dispatcher-remote',
          name: 'Remote Dispatcher',
          isOnline: true,
          viewingTruckId: 'truck-2',
          lastSeenAt: '2026-04-16T10:00:00.000Z',
        },
      },
      allIds: [...withCurrent.allIds, 'dispatcher-remote'],
    };

    const nextState = dispatchersReducer(
      stateWithRemote,
      cleanupGhostDispatchers({
        now: '2026-04-16T10:01:00.000Z',
        maxAgeMs: appConstants.dispatcherPresenceCleanup.maxAgeMs,
      })
    );

    expect(nextState.byId['dispatcher-remote'].isOnline).toBe(false);
    expect(nextState.byId['dispatcher-remote'].viewingTruckId).toBeNull();
  });

  it('does not expire current dispatcher automatically', () => {
    const baseState = dispatchersReducer(undefined, { type: '@@INIT' });

    const withCurrent = dispatchersReducer(
      baseState,
      registerCurrentDispatcher({
        id: 'dispatcher-local',
        name: 'Local Dispatcher',
      })
    );

    const manuallyOldState = {
      ...withCurrent,
      byId: {
        ...withCurrent.byId,
        'dispatcher-local': {
          ...withCurrent.byId['dispatcher-local'],
          lastSeenAt: '2026-04-16T10:00:00.000Z',
        },
      },
    };

    const nextState = dispatchersReducer(
      manuallyOldState,
      cleanupGhostDispatchers({
        now: '2026-04-16T10:01:00.000Z',
        maxAgeMs: appConstants.dispatcherPresenceCleanup.maxAgeMs,
      })
    );

    expect(nextState.byId['dispatcher-local'].isOnline).toBe(true);
  });
});