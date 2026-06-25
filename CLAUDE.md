# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Perpex is a perpetual futures trading platform. It's a Bun + Turborepo monorepo. The core system is a matching engine that talks to an HTTP API and a DB-writer process over Redis Streams using a request/reply pattern. There is no frontend yet.

## Commands

Package manager is **bun** (`bun@1.3.10`, set in `packageManager`). Run all commands from the repo root unless noted.

```bash
bun install                 # install all workspaces
bun run dev                 # turbo run dev (persistent, no cache)
bun run build                # turbo run build
bun run lint                  # turbo run lint
bun run check-types            # turbo run check-types
bun run format                  # prettier --write on **/*.{ts,tsx,md}
```

Important gotcha: only `packages/ui` actually defines `lint`/`check-types`/`build` scripts. `apps/api`, `apps/engine`, `apps/poller`, and most `packages/*` have no such scripts, so `turbo run lint`/`check-types` silently no-ops for them. There is no test runner configured anywhere (`apps/tests` exists but is empty) — don't assume a `bun test` command exists unless you add one.

### Running the services individually

Only `apps/api` defines `dev`/`start` scripts (`bun --hot run src/index.ts`). `apps/engine` and `apps/poller` have no scripts in their `package.json` — run them directly:

```bash
cd apps/api && bun run dev
cd apps/engine && bun --hot run src/index.ts
cd apps/poller && bun --hot run src/index.ts
```

All three need Redis and Postgres reachable (see `docker/compose.yaml` — `docker compose -f docker/compose.yaml up -d` starts redis on 6379 and postgres on 5432) and a populated `.env` per app (`DATABASE_URL`, `PORT`, `AUTH_SECRET`, `ORDERS_CREATE`, `ORDERS_ACK`, `RES_TIMEOUT`). `@perpex/config` (`packages/config/src/index.ts`) throws at import time if any required var is missing.

### Database (`packages/db`)

Prisma schema lives at `packages/db/prisma/schema.prisma`, generated client output is checked into `packages/db/src/generated/prisma`. There are no prisma scripts wired into `package.json`; run prisma directly from `packages/db`, e.g. `bunx prisma migrate dev`. `prisma.config.ts` reads `DATABASE_URL` and points at `prisma/migrations`.

## Architecture

### The three runtime processes

1. **`apps/api`** — Express HTTP server (port from `.env`, default 3001 in `src/index.ts`). Validates input with `@perpex/schemas` (Zod), publishes order commands onto the `ORDERS_CREATE` Redis stream, and awaits the matching result.
2. **`apps/engine`** — long-running loop that reads `ORDERS_CREATE`, runs orders through an **in-memory** matching engine, and publishes results onto `ORDERS_ACK`.
3. **`apps/poller`** — long-running loop that reads `ORDERS_ACK` and persists orders/fills to Postgres via `@perpex/db` (Prisma).

### Request/reply over Redis Streams

This is not fire-and-forget pub/sub — the API blocks on a promise per request:

- `createOrder` (`apps/api/src/controllers/exchange.ts`) generates a `correlationId`, calls `registerResolver` (`apps/api/src/services/listener.ts`) to stash a `{resolve, reject, timer}` in `pendingResolver`, then publishes to `ORDERS_CREATE`.
- `readAckStream` (same file) is started fire-and-forget at boot (`void readAckStream()` in `apps/api/src/index.ts`) and continuously reads `ORDERS_ACK`; when a message's `correlationId` matches a pending entry, it resolves/rejects that promise.
- `RES_TIMEOUT` (default 30000ms) bounds how long the API waits before rejecting with "Engine timeout".
- The poller (`apps/poller`) is a _second, independent_ consumer of the same `ORDERS_ACK` stream — it doesn't interact with `pendingResolver` at all, it just persists.

`packages/redis/src/stream.ts` wraps this: `publishToStream` does `XADD key * data=<json>`, `readFromStream` does a blocking `XREAD` (`BLOCK: 0, COUNT: 1`) starting from `$` (only new messages — no consumer groups yet, see `notes.md`).

### Matching engine (`apps/engine`)

All engine state is **in-memory and lost on restart** (`apps/engine/src/store/store.ts` has a `Users` map and hardcoded `maintenanceMarginRate`/`totalSlippageTolerance` constants — there's no snapshot/recovery loop yet, that's tracked as a to-do in `notes.md`).

Call chain for an order: `apps/engine/src/index.ts` (stream loop) → `EngineManager.get(payload)` → `Engine.process(payload)` → `OrderBook.addOrder` → `handleLimitOrder`/`handleMarketOrder`, which call into `MatchingEngine` (price-time matching against the opposite side of the book) and `PositionManager` (open/update/partially-close/close position, PnL, liquidation price).

- `EngineManager` (`services/engine-manager.ts`) lazily creates one `Engine` per market string, **but** shares a single `UserService`/`MathchingEngine`/`PositionManager` instance across all markets — flagged in the code itself as a likely-wrong pattern to revisit ("will comeback after watching multithreading video").
- `BookManager` (`services/book-manager.ts`) stores each side as `Map<price, {openOrders}>` plus a separately-maintained sorted `number[]` of prices for best-bid/ask lookup; inserts/removals are O(n) array splices. `addSeedData()` seeds a fake book for manual testing — don't remove without checking who relies on it.
- Margin/liquidation math (`services/position-manager.ts`): `lockedCollateral = price * quantity / leverage`; liquidation price uses a flat `maintenanceMarginRate` (0.005) for every position — tiered MMR by position size is a known TODO (see `notes.md`).
- Market orders apply slippage tolerance against best bid/ask to compute a `worstCasePrice` before locking collateral (`OrderBook.handleMarketOrder`).
- `EngineError` (`apps/engine/src/utils/engine-error.ts`) carries an HTTP-style status + message; engine loop catches it and republishes the failure onto `ORDERS_ACK` keyed by `correlationId` so the API's pending promise rejects/resolves with that error.

### Auth

JWT stored in an httpOnly `token` cookie (`apps/api/src/utils/add-cookie.ts`, `authMiddleware` in `apps/api/src/middlewares/auth.ts`), signed/verified with `AUTH_SECRET`. Passwords hashed with bcrypt (cost factor 4). Note `exchangeRouter`'s `/order` route has `authMiddleware` commented out and `createOrder` hardcodes `userId: "u1"` — auth is not yet wired through to order placement end-to-end (tracked in `notes.md` as "complete admin part" / general auth follow-up).

### Shared packages

- `@perpex/types` (`packages/types`) — all cross-service TypeScript types (`PayloadType`, `Order`, `Position`, `Fill`, stream message shapes). This is the contract between api/engine/poller; changing a shape here usually means updating all three.
- `@perpex/schemas` (`packages/schemas`) — Zod schemas for HTTP input validation (`orderSchema` is a discriminated union on `type: "LIMIT" | "MARKET"`).
- `@perpex/redis` (`packages/redis`) — two raw `redis` clients (`publisher`/`subscriber`) plus the stream helpers described above.
- `@perpex/db` (`packages/db`) — Prisma client (`prisma-client` generator, `@prisma/adapter-pg`), schema models `User`, `Order`, `Fills`, `Market`. Note `price`/`quantity` are `Int` columns (no decimals) — keep that in mind when changing precision-sensitive math.
- `@perpex/config` (`packages/config`) — single source of required env vars; throws eagerly on missing vars, so a service that doesn't need a var still won't import this module if it's unset elsewhere in the same `.env`.
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — Turborepo-generated shared frontend/lint/tsconfig scaffolding. Not consumed by any app yet (no frontend exists); `apps/ws` and `apps/tests` are likewise empty placeholder directories.

## Known rough edges (don't "fix" these reflexively — they're tracked WIP)

`notes.md` is the running TODO list (maintenance margin tiers, cross/isolated margin modes, insurance fund, trading fees, Redis consumer groups, crash-recovery replay from the stream, order cancellation). Expect `console.log` debugging statements throughout `apps/engine`, and inline `// TODO` comments marking spots the author already knows are incomplete or possibly wrong (e.g. shared engine sub-services across markets, single-order matching break-on-self-trade behavior in `MatchingEngine`).
