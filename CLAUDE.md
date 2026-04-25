# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo with two independently-deployed apps that talk to each other across the Cloudflare network:

- `worker/` — Hono API on Cloudflare Workers backed by D1 (single file: `worker/src/index.ts`, ~1300 lines).
- `frontend/` — Vue 3 SPA built with Vite. Single entry `index.html`; `/admin.html` is **legacy** — current routing is handled by `vue-router` (`/` → `StatusPage`, `/admin` → `AdminPage`).
- `frontend/public/_worker.js` — Cloudflare Pages "advanced mode" edge function that proxies `/api/*` to the Worker. **This is required**; without it the Pages site cannot reach the Worker (and `workers.dev` is blocked in mainland China).
- `.github/workflows/deploy.yml` — Generates `worker/wrangler.toml` from secrets at deploy time, then deploys Worker + Pages.

## Common Commands

Both `worker/` and `frontend/` are independent npm projects — `cd` into the right one before running scripts.

```bash
# Backend (worker/)
npm install
npm run dev           # wrangler dev on http://127.0.0.1:8787 (uses local SQLite)
npm run dev:remote    # wrangler dev against the real remote D1
npx wrangler deploy   # manual deploy

# Frontend (frontend/)
npm install
npm run dev           # vite --host on http://localhost:5173
npm run build         # outputs to frontend/dist
npx wrangler pages deploy dist --project-name=uptime-monitor

# D1 database (run from repo root)
npx wrangler d1 create uptime-db
npx wrangler d1 execute uptime-db --remote --file=worker/schema.sql   # initial seed
npx wrangler d1 execute uptime-db --remote --command="SELECT ..."     # ad-hoc query

# Manually trigger the cron handler (useful for SSL/domain refresh)
curl "https://<worker-host>/cdn-cgi/handler/scheduled"
```

There is no test suite, no linter, and no type-checking script — `tsc` is only present transitively for `@cloudflare/workers-types`. Don't fabricate `npm test` / `npm run lint` commands.

## Architecture

### Request flow

```
Browser ──> *.pages.dev ──(_worker.js)──> /api/* stripped ──> uptime-worker.*.workers.dev (Hono)
                                                                       │
                                                                       └── env.DB (D1)
```

`_worker.js` strips the `/api` prefix before forwarding (`/api/monitors/public` → `/monitors/public`). The Hono routes in `worker/src/index.ts` are therefore defined **without** the `/api` prefix. In local dev, Vite's proxy in `vite.config.js` does the same rewrite to `http://127.0.0.1:8787`.

### Worker entrypoint

`worker/src/index.ts` exports both `fetch` (the Hono app) and `scheduled` (cron). The cron is configured `* * * * *` — fires every minute. `runScheduledTasks` always runs `checkSites`; at UTC hour 2 it additionally runs `cleanupLogs`, `checkExpiryAlerts`, and `aggregateDailyUptime`. Per-monitor `interval` (default 300s) is enforced inside `isTimeToCheck` rather than via separate cron triggers, so changing the cron cadence affects retry granularity, not check frequency.

### Auth

A single global middleware in `worker/src/index.ts` gates everything except a hardcoded list of public paths (`/monitors/public`, `/monitors/public/details`, `GET /incidents`, `GET /settings`). When adding new public endpoints, update the exemption list — `PROTECTED_ROUTES` is a positive-match list and the OPTIONS short-circuit lives in the same middleware. Auth accepts either `ADMIN_API_KEY` or `ADMIN_PASSWORD` as a `Bearer` token; API key wins if both are set.

### Database schema

`worker/schema.sql` is **destructive on first lines** (`DROP TABLE IF EXISTS ...`). Never run it against a populated production DB. For incremental changes, append `ALTER TABLE` / `CREATE TABLE IF NOT EXISTS` snippets at the bottom of the file (the existing commented-out `P2 增量迁移` block is the convention) and apply them via `wrangler d1 execute --command=`.

Key tables: `monitors`, `logs`, `notification_channels`, `incidents` (also serves scheduled `maintenance` windows), `settings` (key/value), `daily_uptime` (90-day uptime bar aggregation; populated by the 02:00 UTC cron).

### Frontend structure

- `src/views/StatusPage.vue` — public status page, composed of `components/status/*`.
- `src/views/AdminPage.vue` — admin dashboard, composed of `components/admin/*` (modals for monitors, channels, incidents, logs, settings).
- `src/composables/{useAuth,useTheme,useToast}.js` — auth token storage, dark-mode toggle, toast notifications. Prefer extending these over wiring new singletons.
- `src/utils/api.js` — `API_BASE = '/api'` plus a `fetchT` (timeout) and `withRetry` helper. All API calls should go through these so the proxy contract stays consistent.

## Deployment Gotchas

These are the failure modes mentioned in the README that surface as opaque 500s if missed:

1. **`binding = "DB"` is not configurable.** The Worker code reads `env.DB` directly. Pasting the `wrangler d1 create` output verbatim (which uses a different binding name) breaks every DB call.
2. **`WORKER_URL` must be set on the Pages project**, not the Worker. It's read by `_worker.js` to know where to forward `/api/*`. After setting it in the Cloudflare dashboard, the Pages project must be re-deployed for the variable to take effect.
3. **GitHub Actions generates `wrangler.toml` from secrets** (`D1_DATABASE_ID`, `ADMIN_API_KEY`) — `wrangler.toml` is gitignored and the example file is `worker/wrangler.example.toml`. Don't commit a real `wrangler.toml`.
4. The `_worker.js` SPA fallback re-fetches `/` for any 404, so adding a new top-level static asset that doesn't exist will silently return `index.html`.
