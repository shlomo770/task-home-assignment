/**
 * ערכי התאמה מרכזיים — מעדיף לשנות כאן מאשר מספרים קשיחים ב־slices / hooks.
 */
export const appConstants = {
  fleet: {
    /** מספר נקודות מקסימלי בשביל GPS לכל משאית */
    maxTrailPoints: 30,
    /** מספר חריגות מקסימלי לשמירה (חיתוך מ־התחלה) */
    maxAnomaliesPerTruck: 10,
    /** ללא טלמטריה מעל חלון זה — נחשב stale ב־refreshStaleTelemetry */
    staleTelemetryThresholdMs: 15_000,
  },
  fleetStaleMonitor: {
    /** תדירות בדיקת stale (מילישניות) */
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
    /** מהירות מעל או שווה לערך — נחשבת חריגת חיישן */
    speedAnomalyThresholdKmh: 999,
    /** דלק קודם מעל אחוז זה + 0% חדש בזמן תנועה — glitch */
    fuelGlitchMinPrevPercent: 5,
    /** ברירת מחדל ל־isStaleTelemetry (אותו סף כמו fleet.staleTelemetryThresholdMs) */
    defaultStaleAfterMs: 15_000,
  },
  http: {
    maxServiceUnavailableRetries: 3,
  },
} as const;
