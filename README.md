# Perpex — Perpetual Futures Trading Platform

Perpex is a centralized perpetual-futures exchange built as a **Bun + Turborepo monorepo**. At its core is an in-memory matching engine that communicates with an HTTP API and a database-writer process over **Redis Streams**, using a request/reply pattern. There is no frontend yet — the platform is backend-only today.

> ⚠️ This is a work in progress. The trade lifecycle (auth → order → match → position → persist) is wired end to end, but several exchange primitives — liquidation, funding rates, and state snapshotting — are not yet implemented. See [Roadmap](#roadmap).

---

## Tech Stack

| Layer            | Choice                                                        |
| ---------------- | ------------------------------------------------------------- |
| Runtime / PM     | [Bun](https://bun.sh) `1.3.10`                                |
| Monorepo         | Turborepo                                                     |
| API              | Express + Zod validation                                      |
| Messaging        | Redis Streams (`XADD` / blocking `XREAD`)                     |
| Database         | PostgreSQL via Prisma (`@prisma/adapter-pg`)                  |
| Auth             | JWT in an httpOnly cookie + bcrypt                            |
| Language         | TypeScript                                                    |

---

## Architecture

Perpex is split into **three independent runtime processes** plus a set of shared workspace packages. The processes never call each other directly — they communicate only through two Redis streams.

```
                            ┌──────────────────────────────────────────────┐
   HTTP client              │                  REDIS STREAMS                 │
       │                    │                                                │
       ▼                    │   ORDERS_CREATE ───────►  ORDERS_ACK           │
 ┌───────────┐  publish     │        │                      ▲    │           │
 │  apps/api │──────────────┼────────┘                      │    │           │
 │ (Express) │◄─────────────┼───────────────────────────────┘    │           │
 └───────────┘  read ack    │                                     │           │
       ▲                    └─────────────────────────────────────┼──────────┘
       │                                  ▲                        │
       │ block on promise                 │ publish results        │ read
       │ (correlationId)                  │                        ▼
       │                            ┌───────────┐           ┌────────────┐
       └────────────────────────────│apps/engine│           │apps/poller │──► Postgres
                                     │ (matching)│           │ (persist)  │
                                     └───────────┘           └────────────┘
```

### The three processes

**1. `apps/api` — Express HTTP server** (port `3001`)
Validates request input with Zod schemas, then publishes order commands onto the `ORDERS_CREATE` stream and **awaits the matching result**. It also runs a background reader (`readAckStream`, started fire-and-forget at boot) that consumes `ORDERS_ACK` and resolves the pending request promises.

**2. `apps/engine` — Matching engine**
A long-running loop that reads `ORDERS_CREATE`, runs each order through an **in-memory** order book + matching engine, mutates user collateral and positions, and publishes results (orders, fills, status updates, errors) onto `ORDERS_ACK`. **All engine state lives in memory and is lost on restart.**

**3. `apps/poller` — Database writer**
A second, independent consumer of `ORDERS_ACK`. It does not touch the API's pending-request map — it simply persists order/fill records into Postgres via Prisma.

### Request/Reply over Redis Streams

This is **not** fire-and-forget pub/sub — the API blocks on a per-request promise:

1. `createOrder` generates a `correlationId`, calls `registerResolver` to stash a `{ resolve, reject, timer }` in an in-memory `pendingResolver` map, then `XADD`s the payload to `ORDERS_CREATE`.
2. The engine processes the order and publishes an ack keyed by the same `correlationId`.
3. `readAckStream` (running continuously since boot) matches the `correlationId`, clears the timeout, and resolves/rejects the waiting promise.
4. `RES_TIMEOUT` (default **30s**) bounds the wait — on expiry the request rejects with `"Engine timeout"`.

The streams are read with a blocking `XREAD` starting from `$` (new messages only). **No consumer groups yet** — each process is a single solo reader.

---

## The Matching Engine in Detail

Call chain for an order:

```
index.ts (stream loop)
  └─ EngineManager.get(payload)        // one Engine per market
       └─ Engine.process(payload)
            └─ OrderBook.addOrder(payload)
                 ├─ handleLimitOrder   ─┐
                 └─ handleMarketOrder  ─┴─► MatchingEngine  (price-time matching)
                                          └► PositionManager (open/update/close, PnL, liq. price)
```

**`EngineManager`** lazily creates one `Engine` per market string. It currently shares a *single* `UserService` / `MatchingEngine` / `PositionManager` instance across all markets (flagged in-code as a likely-wrong pattern to revisit).

**`BookManager`** holds each side of the book as a `Map<price, { openOrders[] }>` plus a separately-maintained **sorted `number[]` of prices** for best-bid/ask lookup. Inserts/removals are O(n) array splices. `addSeedData()` seeds a fake book (bids at 95/100, asks at 100/101/104) for manual testing.

**`MatchingEngine`** walks the opposite side of the book from the best price inward:
- **Limit orders** match while `bestPrice ≤ entryPrice` (LONG) / `bestPrice ≥ entryPrice` (SHORT); any unfilled remainder rests on the book. Final status → `Filled` / `PartiallyFilled` / `Open`.
- **Market orders** match against best prices up to a pre-computed `worstCasePrice` (best price ± slippage tolerance). Anything unfilled is `Cancelled` — nothing rests.
- Self-trades currently `break` the loop (a known TODO).

**Collateral & margin** (`PositionManager` + `OrderBook`):
- `lockedCollateral = price × quantity / leverage` — locked up front, surplus released after matching.
- `actualCollateralUsed = totalFilledValue / leverage`.
- **Liquidation price** (flat `maintenanceMarginRate = 0.005` for every position):
  - LONG:  `avgPrice × (1 − 1/leverage + MMR)`
  - SHORT: `avgPrice × (1 + 1/leverage − MMR)`
- **PnL** on close: `(fillPrice − avgPrice) × qty` for LONG, inverted for SHORT.

**Position lifecycle** when a fill arrives (`OrderBook.handlePosition`):
- No position → **create**.
- Same side → **add** (recompute weighted average price, margin, liq. price).
- Opposite side → **close** (full) or **partially close** (release margin + realize PnL). The "flip" case (fill larger than position → close then open opposite) is stubbed with a TODO.

**Errors** are thrown as `EngineError` (HTTP-style status + message). The engine loop catches them and republishes a failure onto `ORDERS_ACK` keyed by `correlationId`, so the API's pending promise rejects with that message.

---

## Data Model (Prisma / Postgres)

```
User ──< Order ──< Fills >── Market
  └──────< Fills (maker / taker relations)
```

- **User** — `id, name, email (unique), password (bcrypt)`.
- **Order** — `type, side, price?, quantity, filledQuantity, status`, linked to user + market.
- **Fills** — maker/taker user + order references, `price, quantity`, market.
- **Market** — `marketSlug (unique), imageUrl`.
- Enums: `OrderType (LIMIT|MARKET)`, `OrderSide (LONG|SHORT)`, `OrderStatus (Open|Filled|PartiallyFilled|Cancelled)`.

> ⚠️ `price` and `quantity` are **`Int`** columns (no decimals). Keep that in mind for precision-sensitive math. Positions are **not** persisted — they live only in the engine's memory.

---

## Shared Packages

| Package             | Responsibility                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| `@perpex/types`     | Cross-service TS types (`PayloadType`, `Order`, `Position`, `Fill`, stream shapes). The contract between api/engine/poller. |
| `@perpex/schemas`   | Zod HTTP-input schemas (`orderSchema` is a discriminated union on `type`).      |
| `@perpex/redis`     | Two `redis` clients (`publisher`/`subscriber`) + the `publishToStream` / `readFromStream` helpers. |
| `@perpex/db`        | Prisma client + schema (generated client checked into `src/generated/prisma`). |
| `@perpex/config`    | Single source of required env vars; **throws eagerly at import** on any missing var. |
| `packages/ui`, `eslint-config`, `typescript-config` | Turborepo scaffolding, not consumed by any app yet.        |

`apps/ws` and `apps/tests` are empty placeholder directories.

---

## HTTP API

Base path: `/api`

| Method | Route                       | Auth      | Description                          |
| ------ | --------------------------- | --------- | ------------------------------------ |
| POST   | `/auth/signup`              | —         | Create user, set JWT cookie          |
| POST   | `/auth/signin`              | —         | Authenticate, set JWT cookie         |
| POST   | `/auth/logout`              | —         | Clear cookie                         |
| POST   | `/exchange/create-market`   | ✅ JWT    | Register a tradable market           |
| POST   | `/exchange/order`           | ⚠️ *off*  | Place a LIMIT or MARKET order        |

> ⚠️ `authMiddleware` on `/exchange/order` is **commented out** and `createOrder` hardcodes `userId: "u1"` — auth is not yet wired through to order placement end to end.

---

## Getting Started

**Prerequisites:** Bun `1.3.10`, Docker (for Redis + Postgres).

```bash
# 1. Install all workspaces
bun install

# 2. Start Redis (6379) + Postgres (5432)
docker compose -f docker/compose.yaml up -d

# 3. Configure env per app (see below), then run migrations
cd packages/db && bunx prisma migrate dev
```

Each app needs a populated `.env` with: `DATABASE_URL`, `PORT`, `AUTH_SECRET`, `ORDERS_CREATE`, `ORDERS_ACK`, `RES_TIMEOUT`. `@perpex/config` throws at import time if any required var is missing.

### Running the services

Only `apps/api` defines `dev`/`start` scripts. The engine and poller have no scripts — run them directly:

```bash
cd apps/api    && bun run dev
cd apps/engine && bun --hot run src/index.ts
cd apps/poller && bun --hot run src/index.ts
```

### Root commands

```bash
bun run dev          # turbo run dev (persistent)
bun run build        # turbo run build
bun run lint         # turbo run lint
bun run check-types  # turbo run check-types
bun run format       # prettier --write
```

> **Gotcha:** only `packages/ui` actually defines `lint`/`check-types`/`build` scripts, so `turbo run lint`/`check-types` silently no-ops for the apps. **There is no test runner configured** (`apps/tests` is empty) — don't assume `bun test` exists.

---

## Roadmap

### ✅ Built

- Monorepo, shared packages, Docker dev stack
- Auth: signup / signin / logout (JWT cookie + bcrypt)
- Market creation
- Redis-Streams request/reply transport with per-request timeout
- In-memory order book with price-time matching
- LIMIT and MARKET order handling (with slippage on market orders)
- Collateral locking/release, leverage, margin
- Position open / increase / partial-close / full-close with realized PnL
- Liquidation-price calculation (flat MMR)
- Order/fill persistence via the poller

### 🚧 Remaining / Known Rough Edges

- **Liquidation** — liq. price is *computed* but there's no engine that monitors mark price and force-closes positions.
- **Funding rate** — not implemented at all.
- **Snapshotting / crash recovery** — engine state is purely in-memory; no snapshot or stream-replay on restart.
- **Position persistence** — positions live only in engine memory, never written to the DB.
- **End-to-end auth on orders** — `/exchange/order` runs with a hardcoded `userId` and auth middleware disabled.
- **Redis consumer groups** — single solo reader per stream, no acks/redelivery.
- **Order cancellation** — `cancel-order` / `on-ramp` message types are stubbed.
- **Opposite-side flip** — fill larger than an opposing position (close-then-reopen) is a TODO.
- **Tiered maintenance margin**, cross/isolated margin modes, insurance fund, trading fees.
- **Self-trade handling** — currently breaks the matching loop instead of skipping.
- **Decimal precision** — DB stores `price`/`quantity` as integers.
- Debug `console.log` statements remain throughout the engine.
- No frontend (`apps/ws`, `apps/tests`, `packages/ui` are unused scaffolding).
