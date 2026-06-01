import z from "zod";

export const orderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("LIMIT"),
    side: z.enum(["LONG", "SHORT"]),
    market: z.string(),
    price: z.number().positive("limit orders require a positive price"),
    quantity: z.number().positive("quantity must be a positive number"),
    leverage: z.number().default(10),
  }),
  z.object({
    type: z.literal("MARKET"),
    side: z.enum(["LONG", "SHORT"]),
    market: z.string(),
    price: z.null().optional(),
    quantity: z.number().positive("quantity must be a positive number"),
    leverage: z.number().default(10),
  }),
]);

export const marketSchema = z.object({
  newMarket: z
    .string()
    .min(7, "Market name must be at least 6 characters")
    .max(10, "Market must be at least 10 characters"),
  marketImg: z.string(),
});
