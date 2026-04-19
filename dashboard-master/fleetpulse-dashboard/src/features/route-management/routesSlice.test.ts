import { describe, expect, it } from 'vitest';
import { routesReducer } from './routesSlice';

describe('routesSlice', () => {
  it('stores conflict state on rejected route update with conflict route', () => {
    const initialState = routesReducer(undefined, { type: '@@INIT' });

    const nextState = routesReducer(initialState, {
      type: 'routes/updateRouteStatus/rejected',
      payload: {
        message: 'HTTP 409',
        conflictRoute: {
          id: 'route-1',
          truckId: 'truck-2',
          origin: 'Warehouse A',
          destination: 'Downtown',
          status: 'in-progress',
          version: '3',
          updatedAt: '2026-04-16T10:00:00.000Z',
          updatedByDispatcherId: 'dispatcher-1',
        },
      },
      error: {
        message: 'Rejected',
      },
    });

    expect(nextState.mutationLoading).toBe('failed');
    expect(nextState.error).toBe('HTTP 409');
    expect(nextState.conflict?.routeId).toBe('route-1');
    expect(nextState.conflict?.serverVersion.version).toBe('3');
  });
});