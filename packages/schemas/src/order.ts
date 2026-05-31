import z from "zod";

export const orderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("limit"),
    side: z.enum(["long", "short"]),
    symbol: z.enum(["BTCUSDT", "SOLUSDT", "ETHUSDT"]),
    price: z.number().positive("limit orders require a positive price"),
    quantity: z.number().positive("quantity must be a positive number"),
    leverage: z.number().default(10),
  }),
  z.object({
    type: z.literal("market"),
    side: z.enum(["long", "short"]),
    symbol: z.enum(["BTCUSDT", "SOLUSDT", "ETHUSDT"]),
    price: z.null().optional(),
    quantity: z.number().positive("quantity must be a positive number"),
    leverage: z.number().default(10),
  }),
]);
