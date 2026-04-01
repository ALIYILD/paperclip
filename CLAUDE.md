# Paperclip — AI Agent Orchestration Board

## What This Is
Forked Paperclip board serving as the strategic control plane for PerfFlux's 23-agent AI company. Node.js/TypeScript server with Express, Drizzle ORM, PostgreSQL, and WebSocket.

## Architecture
- **Server**: `server/src/` — Express API, heartbeat scheduler, adapter system, WebSocket
- **UI**: `ui/src/` — React + Vite + Tailwind dashboard
- **DB**: `packages/db/` — Drizzle ORM schemas, 40+ tables
- **Shared**: `packages/shared/` — Types, validators, constants
- **Adapters**: `packages/adapters/` — claude_local, openclaw_gateway, codex, process, http, etc.

## Key Files (server)
- `server/src/services/heartbeat.ts` — Core execution engine (~2500 lines). Budget gate, timeout watchdog, retry logic, priority queue
- `server/src/services/live-events.ts` — Event persistence + ring buffer
- `server/src/services/handoff-tracker.ts` — Cross-agent handoff tracking
- `server/src/services/task-dependencies.ts` — Issue dependency graph
- `server/src/routes/observability.ts` — Run stats, agent health, events API
- `server/src/routes/coordination.ts` — Handoff + dependency endpoints

## Recent Upgrades (P0/P1/P2)
- P0: Budget enforcement, timeout watchdog, event persistence, 5 new DB tables
- P1: Retry with backoff, priority queue, event reconnect buffer, observability API
- P2: Handoff tracking, approval gates, task dependencies, coordination API

## Database
- Local: embedded Postgres on port 54329 (`~/.paperclip/instances/default/db`)
- Remote (Fly): `paperclip-board-db` Postgres
- Schema files: `packages/db/src/schema/`
- Migrations: `packages/db/src/migrations/`

## Commands
```bash
pnpm dev:server     # Start local server on port 3100
pnpm dev:ui         # Start UI dev server on port 5173
pnpm build:ui       # Build UI for production
```

## Conventions
- DB columns: snake_case
- TS interfaces: camelCase
- Routes: Express Router pattern in server/src/routes/
- Services: singleton pattern in server/src/services/
- Adapters: packages/adapters/{type}/src/

## Do NOT
- Modify the heartbeat service without understanding the full execution flow
- Change adapter interfaces without checking all 9 adapter implementations
- Add new npm dependencies without justification
- Skip TypeScript compilation check: `pnpm --filter server exec tsc --noEmit`
