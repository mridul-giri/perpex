# Perpex — Perpetual Futures Exchange

A perpetual-futures exchange backend built as a **Bun + Turborepo** monorepo. An
in-memory matching engine is the single source of truth; every other process talks
to it over **Redis Streams**. No frontend — backend only.

## Architecture

```
                  orders:create                    orders:ack
  apps/api    ─┐                              ┌──▶ apps/api     (matches the reply by correlationId)
               ├──▶  apps/engine  ────────────┤
  price-feed  ─┘     (in-memory truth)        ├──▶ apps/poller  ──▶ Postgres
                                              └──▶ apps/ws      ──▶ WebSocket clients
                                 │
                                 └──▶ S3 snapshots (periodic + on shutdown)
```

Two rules everything follows:

1. **The engine is the only writer.** It owns order books, balances and positions;
   everyone else asks it over a stream.
2. **Engine memory is the truth; Postgres is the record; S3 snapshots are recovery**
   (restore + replay on boot).

## Services

| App               | Port   | What it does                                                                                                    |
| ----------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `apps/api`        | `3001` | REST gateway: auth, on-ramp/withdraw/balance, place/cancel orders. Publishes a command and waits for the reply. |
| `apps/engine`     | –      | Matching + risk: books, balances, positions, funding, liquidation. The only writer.                             |
| `apps/poller`     | –      | Persists engine results (markets, orders, fills, balances, closed positions, liquidations) to Postgres.         |
| `apps/price-feed` | –      | Streams Binance mark/index price into the engine and schedules funding settlements.                             |
| `apps/ws`         | `3002` | Read-only WebSocket feed of live `depth` and `trade`.                                                           |

## How they talk

Everything is a message on one of two Redis Streams:

| Stream          | From → To                  | Carries                                                                                     |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| `orders:create` | api / price-feed → engine  | commands (`create-order`, `cancel-order`, `on-ramp`, `mark-price`, `funding-settlement`, …) |
| `orders:ack`    | engine → api / poller / ws | results (order/fill/position updates, depth, balances, errors)                              |

- **Request/reply:** the api stamps a `correlationId`, publishes, and blocks until
  the engine echoes that id back (bounded by `RES_TIMEOUT`).
- **Consumer groups:** the engine (`engine`), poller (`poller`) and ws (`ws`) each
  read their stream through their own group, acking after handling — a restart
  doesn't lose in-flight messages. Idempotency keys protect the api's write routes.

## Money & data

- Money is **`bigint`** internally with `PRECISION = 8`; Postgres stores
  `String`/`Decimal`.
- Durable stores: **Postgres** (permanent record) and **S3** (snapshots for crash
  recovery). Redis is transport only.

## Getting started

**Prereqs:** Bun, Docker.

```bash
bun install
docker compose -f docker/compose.yaml up -d          # redis :6379, postgres :5432

# env (one root .env; .env.example is the template)
cp .env.example .env                                  # then fill AUTH_SECRET

# DB (the generated Prisma client is not checked in)
cd packages/db && bunx prisma generate
cd packages/db && bunx prisma migrate dev
```

Run the services (each loads the root `.env`):

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
`RES_TIMEOUT`; S3 snapshots need `S3_BUCKET`, `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (skipped with a warning when unset).

## HTTP API

Base path `/api`. Write routes require auth and (for money/order routes) an
`Idempotency-Key` header.

| Method | Route                              | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| POST   | `/auth/signup` `/signin` `/logout` | Auth (JWT httpOnly cookie)    |
| POST   | `/exchange/create-market`          | Register a tradable market    |
| POST   | `/exchange/onramp`                 | Deposit collateral            |
| POST   | `/exchange/withdraw`               | Withdraw collateral           |
| GET    | `/exchange/balance`                | Read balance                  |
| POST   | `/exchange/order`                  | Place a LIMIT or MARKET order |
| DELETE | `/exchange/order`                  | Cancel an order               |

## WebSocket (read-only)

Connect to `ws://localhost:3002` and subscribe:
`{ "operation": "subscribe", "channel": "depth" | "trade", "symbol": "BTC_PERP" }`.
Updates arrive as `{ "channel", "market", "data", "timestamp" }`.
