
export const appConstants = {
  fleet: {
    maxTrailPoints: 30,
    maxAnomaliesPerTruck: 10,
    staleTelemetryThresholdMs: 15_000,
  },
  fleetStaleMonitor: {
    pollIntervalMs: 5_000,
  },
  dispatcherHeartbeat: {
    intervalMs: 12_000,
  },
  dispatcherPresenceCleanup: {
    intervalMs: 10_000,
    maxAgeMs: 30_000,
  },
  telemetryRules: {
    speedAnomalyThresholdKmh: 999,
    fuelGlitchMinPrevPercent: 5,
    defaultStaleAfterMs: 15_000,
  },
  http: {
    maxServiceUnavailableRetries: 3,
  },
} as const;
