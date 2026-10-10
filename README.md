# Perpex — Perpetual Futures Exchange

Perpex is a centralized **perpetual-futures exchange** backend. Traders deposit
collateral, place leveraged long/short orders, hold positions that are settled
against a live mark price, and pay or receive funding — all tracked by an
in-memory matching engine and streamed to clients in real time.

It's built as a **Bun + Turborepo** monorepo of independent processes that talk to
each other only over **Redis Streams**. There is no frontend; this is the backend.

## What it does

- **Accounts** — signup/signin, deposit and withdraw collateral, read balances.
- **Orders** — limit and market orders with leverage, min-qty / min-notional
  validation, margin locking, and cancel.
- **Matching** — price-time priority on an in-memory order book, one book per
  market.
- **Positions** — open / increase / reduce / close / flip, weighted-average price,
  margin and realized + unrealized PnL.
- **Risk** — a live mark price from an external feed; underwater positions are
  liquidated through the normal order path, with an insurance fund absorbing bad
  debt.
- **Funding** — a periodic index-vs-mark premium paid between longs and shorts.
- **Realtime** — a read-only WebSocket feed of live order-book depth and trades.
- **Durability** — engine state is snapshotted to S3 and rebuilt on restart;
  trade history is persisted to PostgreSQL.

## Architecture

The design follows two rules:

1. **The matching engine is the only writer** of trading state. It owns the order
   books, balances and positions; every other process asks it over a stream.
2. **Engine memory is the truth; PostgreSQL is the record; S3 snapshots are
   recovery.** State lives in RAM while running, is journalled to Postgres for
   history, and is snapshotted to S3 so a restart can restore and catch up.

```
                  orders:create                    orders:ack
  apps/api    ─┐                              ┌──▶ apps/api     (matches the reply by correlationId)
               ├──▶  apps/engine  ────────────┤
  price-feed  ─┘     (in-memory truth)        ├──▶ apps/poller  ──▶ Postgres
                                              └──▶ apps/ws      ──▶ WebSocket clients
                                 │
                                 └──▶ S3 snapshots (periodic + on shutdown)
```

Nothing calls anything over HTTP. Every command and result is a message:

| Stream          | From → To                  | Carries                                                                         |
| --------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `orders:create` | api / price-feed → engine  | commands: place/cancel order, on-ramp, withdraw, mark-price, funding-settlement |
| `orders:ack`    | engine → api / poller / ws | results: order/fill/position updates, depth, balances, errors                   |

- **Request/reply:** a client request gets a `correlationId`; the api waits for the
  engine to echo it back on `orders:ack` before answering the HTTP request.
- **Consumer groups:** the engine, poller and ws each read their stream through
  their own group and ack after handling, so a restart doesn't lose messages.

### Services

| App               | Port   | Role                                                                                      |
| ----------------- | ------ | ----------------------------------------------------------------------------------------- |
| `apps/api`        | `3001` | REST gateway: auth, deposits/withdrawals, balances, place/cancel orders.                  |
| `apps/engine`     | –      | Matching + risk: books, positions, funding, liquidation. The single source of truth.      |
| `apps/poller`     | –      | Persists markets, orders, fills, balances, closed positions and liquidations to Postgres. |
| `apps/price-feed` | –      | Streams the Binance mark/index price into the engine and schedules funding settlements.   |
| `apps/ws`         | `3002` | Read-only WebSocket feed of live `depth` and `trade`.                                     |

### Money & data

- Money is **`bigint`** internally with `PRECISION = 8`; PostgreSQL stores
  `String`/`Decimal`.
- Where data lives: **engine memory** (trading truth), **PostgreSQL** (history),
  **S3** (snapshots), **Redis** (transport only, safe to lose).

## Tech stack

Bun · Turborepo · TypeScript · Redis Streams · PostgreSQL (Prisma) · Express (Zod
validation) · JWT/bcrypt · `ws` for WebSockets.

## Running it

**Prereqs:** Bun, Docker.

```bash
bun install
docker compose -f docker/compose.yaml up -d          # redis :6379, postgres :5432

cp .env.example .env                                  # then fill AUTH_SECRET

# the generated Prisma client is not checked in
cd packages/db && bunx prisma generate
cd packages/db && bunx prisma migrate dev
```

Start the services (each loads the root `.env`):

```bash
cd apps/api        && bun run dev                    # :3001
cd apps/engine     && bun run dev
cd apps/poller     && bun run dev
cd apps/price-feed && bun run dev
cd apps/ws         && bun run dev                    # :3002

# seed a market + a crossing trade (engine must be running)
cd apps/engine && bun run seed
```

Optional env: `WS_PORT`, `SNAPSHOT_INTERVAL`, `FUNDING_INTERVAL_SECONDS`,
`RES_TIMEOUT`. S3 snapshots need `S3_BUCKET`, `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (skipped with a warning when unset).

## HTTP API

Base path `/api`. Auth routes are public; exchange write routes require a JWT and
an `Idempotency-Key` header.

| Method | Route                              | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| POST   | `/auth/signup` `/signin` `/logout` | Auth (JWT httpOnly cookie)    |
| POST   | `/exchange/create-market`          | Register a tradable market    |
| POST   | `/exchange/onramp`                 | Deposit collateral            |
| POST   | `/exchange/withdraw`               | Withdraw collateral           |
| GET    | `/exchange/balance`                | Read balance                  |
| POST   | `/exchange/order`                  | Place a LIMIT or MARKET order |
| DELETE | `/exchange/order`                  | Cancel an order               |

## WebSocket

Connect to `ws://localhost:3002` and subscribe:

```json
{ "operation": "subscribe", "channel": "depth", "symbol": "BTC_PERP" }
```

Updates arrive as `{ "channel", "market", "data", "timestamp" }` on the `depth`
and `trade` channels.
