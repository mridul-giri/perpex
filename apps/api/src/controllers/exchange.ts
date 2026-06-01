import type { Request, Response } from "express";
import type { PayloadType, ResponseType } from "@perpex/types";
import { orderSchema } from "@perpex/schemas";
import { publishToStream } from "@perpex/redis";
import { registerResolver } from "../services/listener";
import { config } from "@perpex/config";

const markPrice = 100;

export const createOrder = async (req: Request, res: Response) => {
  const orderInput = orderSchema.parse(req.body);

  const price = orderInput.type === "LIMIT" ? orderInput.price : markPrice;

  const correlationId = crypto.randomUUID();
  const payload: PayloadType = {
    userId: req.user.id,
    market: orderInput.market,
    type: orderInput.type,
    side: orderInput.side,
    quantity: orderInput.quantity,
    price,
    leverage: orderInput.leverage,
  };

  const result: ResponseType = await new Promise(async (resolve, reject) => {
    registerResolver(correlationId, resolve, reject, config.RES_TIMEOUT);
    publishToStream(config.ORDERS_CREATE, {
      ...payload,
      messageType: "create-order",
      correlationId,
    });
  });

  console.log("result", result);

  res
    .status(result.ok ? 200 : 400)
    .json(result.ok ? result.data : { error: result.error });
};
