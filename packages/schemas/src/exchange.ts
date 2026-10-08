import z from "zod";

const moneyString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "must be a positive number")
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
