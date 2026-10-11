import type { Request, Response } from "express";
import { orderSchema, cancelOrderBodySchema, orderIdParamSchema } from "@perpex/schemas";
import { requestEngine } from "../utils/request-engine";
import { ApiError } from "../utils/api-error";

export const createOrder = async (req: Request, res: Response) => {
  const orderInput = orderSchema.parse(req.body);

  const base = {
    userId: req.user.id,
    market: orderInput.market,
    side: orderInput.side,
    quantity: orderInput.quantity,
    leverage: orderInput.leverage,
  };

  const command =
    orderInput.type === "LIMIT"
      ? {
          ...base,
          type: "LIMIT",
          price: orderInput.price,
          messageType: "create-order",
        }
      : {
          ...base,
          type: "MARKET",
          slippageTolerance: orderInput.slippageTolerance,
          messageType: "create-order",
        };

  const result = await requestEngine(command);

  if (!result.ok) {
    throw new ApiError(400, result.error ?? "Order rejected");
  }

  res.status(201).json(result.data);
};

export const cancelOrder = async (req: Request, res: Response) => {
  const { orderId } = orderIdParamSchema.parse(req.params);
  const { market } = cancelOrderBodySchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    market,
    orderId,
    messageType: "cancel-order",
  });

  if (!result.ok) {
    throw new ApiError(404, result.error ?? "Cancel failed");
  }

  res.json(result.data);
};
