import type { Request, Response } from "express";
import type { PayloadType, ResponseType } from "@perpex/types";
import { orderSchema } from "@perpex/schemas";
import { publishToStream } from "@perpex/redis";
import { registerResolver } from "../services/listener";
import { config } from "@perpex/config";
import { number } from "zod";

export const createOrder = async (req: Request, res: Response) => {
  const orderInput = orderSchema.parse(req.body);

  const correlationId = crypto.randomUUID();
  const basePayload = {
    // userId: req.user.id,
    userId: "u1",
    market: orderInput.market,
    side: orderInput.side,
    quantity: orderInput.quantity,
    leverage: orderInput.leverage,
  };

  const payload: PayloadType =
    orderInput.type === "LIMIT"
      ? { ...basePayload, type: "LIMIT", price: orderInput.price }
      : {
          ...basePayload,
          type: "MARKET",
          slippageTolerance: orderInput.slippageTolerance,
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
