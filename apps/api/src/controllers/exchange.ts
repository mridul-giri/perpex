import type { Request, Response } from "express";
import type {
  MarketSymbol,
  OrderSide,
  OrderType,
  PayloadType,
  ResponseType,
} from "@perpex/types";
import { orderSchema } from "@perpex/schemas";
import { ordersCreate, publishToStream } from "@perpex/redis";
import { registerResolver } from "../services/listener";

const markPrice = 100;

export const createOrder = async (req: Request, res: Response) => {
  const orderInput = orderSchema.parse(req.body);

  const price = orderInput.type === "limit" ? orderInput.price : markPrice;

  const correlationId = crypto.randomUUID();
  const payload: PayloadType = {
    userId: "1",
    messageType: "create-order",
    symbol: orderInput.symbol as MarketSymbol,
    type: orderInput.type as OrderType,
    side: orderInput.side as OrderSide,
    quantity: orderInput.quantity,
    price,
  };

  const result: ResponseType = await new Promise(async (resolve) => {
    registerResolver(correlationId, resolve);
    publishToStream(ordersCreate, { ...payload, correlationId });
  });

  console.log("result", result);

  res
    .status(result.ok ? 200 : 400)
    .json(result.ok ? result.data : { error: result.error });
};
