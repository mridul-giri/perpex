import type { Request, Response } from "express";
import {
  orderSchema,
  cancelOrderBodySchema,
  orderIdParamSchema,
} from "@perpex/schemas";
import { requestEngine } from "../utils/request-engine";

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

  const data = await requestEngine(command);

  res.status(201).json(data);
};

export const cancelOrder = async (req: Request, res: Response) => {
  const { orderId } = orderIdParamSchema.parse(req.params);
  const { market } = cancelOrderBodySchema.parse(req.body);

  const data = await requestEngine({
    userId: req.user.id,
    market,
    orderId,
    messageType: "cancel-order",
  });

  res.json(data);
};
