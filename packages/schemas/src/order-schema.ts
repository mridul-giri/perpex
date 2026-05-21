import z from "zod";

export const orderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("limit"),
    side: z.enum(["bids", "asks"]),
    symbol: z.string().trim().min(1, "symbol is required"),
    price: z.number().positive("limit orders require a positive price"),
    quantity: z.number().positive("quantity must be a positive number"),
  }),
  z.object({
    type: z.literal("market"),
    side: z.enum(["bids", "asks"]),
    symbol: z.string().trim().min(1, "symbol is required"),
    price: z.null().optional(),
    quantity: z.number().positive("quantity must be a positive number"),
  }),
]);
