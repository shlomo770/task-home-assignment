# FleetPulse Dashboard

Real-time fleet operations dashboard built for the Senior Frontend assignment.

## Tech Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- Tailwind CSS
- Native SSE (EventSource)
- Native WebSocket
- Vitest
- React Testing Library

## Setup

### Frontend
```bash
npm install
npm run dev
```

## Environment Configuration

Create `.env` from `.env.example` and adjust values as needed:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` - API base path used by the app client.
- `VITE_TELEMETRY_STREAM_PATH` - SSE telemetry endpoint.
- `VITE_WS_URL` - full WebSocket URL used by the app.
- `VITE_API_PROXY_TARGET` - Vite dev proxy target for `/api`.
- `VITE_WS_PROXY_TARGET` - Vite dev proxy target for `/ws`.