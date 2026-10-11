import z from "zod";

const PRECISION = 8;

const moneyString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "must be a positive number")
  .refine(
    (value) => (value.split(".")[1]?.length ?? 0) <= PRECISION,
    `must have at most ${PRECISION} decimals`,
  )
  .refine((value) => Number(value) > 0, "must be greater than zero");

export const orderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("LIMIT"),
    side: z.enum(["LONG", "SHORT"]),
    market: z.string(),
    price: moneyString,
    quantity: moneyString,
    leverage: z.number().default(10),
  }),
  z.object({
    type: z.literal("MARKET"),
    side: z.enum(["LONG", "SHORT"]),
    market: z.string(),
    slippageTolerance: z.number().default(0.02),
    quantity: moneyString,
    leverage: z.number().default(10),
  }),
]);

export const marketSchema = z.object({
  newMarket: z
    .string()
    .min(7, "Market name must be at least 6 characters")
    .max(10, "Market must be at least 10 characters"),
  marketImg: z.string().optional(),
});

export const onrampSchema = z.object({
  amount: moneyString,
});

export const withdrawSchema = z.object({
  amount: moneyString,
});

export const CANDLE_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

export const candlesQuerySchema = z.object({
  interval: z.enum(CANDLE_INTERVALS).default("1m"),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  cursor: z.string().optional(),
});

export const ordersQuerySchema = paginationQuerySchema.extend({
  market: z.string().optional(),
  status: z.enum(["Open", "PartiallyFilled", "Filled", "Cancelled"]).optional(),
});

export const cancelOrderBodySchema = z.object({
  market: z.string().min(1, "Market is required"),
});

export const marketParamSchema = z.object({ market: z.string().min(1) });
export const orderIdParamSchema = z.object({ orderId: z.string().min(1) });
