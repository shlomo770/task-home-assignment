function normalizeBasePath(path: string) {
  if (!path.startsWith('/')) return `/${path}`;
  return path;
}

function buildDefaultWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:3000/ws`;
}

export const runtimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  ssePath:
    import.meta.env.VITE_TELEMETRY_STREAM_PATH || '/api/telemetry/stream',
  wsUrl: import.meta.env.VITE_WS_URL || buildDefaultWsUrl(),
};

export function withApiBase(path: string) {
  const normalized = normalizeBasePath(path);
  const base = runtimeConfig.apiBaseUrl.replace(/\/$/, '');
  return `${base}${normalized}`;
}
