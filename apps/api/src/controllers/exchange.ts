import type { Request, Response } from "express";
import { onrampSchema, orderSchema, withdrawSchema } from "@perpex/schemas";
import { requestEngine } from "../utils/request-engine";

export const createOrder = async (req: Request, res: Response) => {
  const orderInput = orderSchema.parse(req.body);

  const basePayload = {
    userId: req.user.id,
    market: orderInput.market,
    side: orderInput.side,
    quantity: orderInput.quantity,
    leverage: orderInput.leverage,
  };

  const command =
    orderInput.type === "LIMIT"
      ? {
          ...basePayload,
          type: "LIMIT",
          price: orderInput.price,
          messageType: "create-order",
        }
      : {
          ...basePayload,
          type: "MARKET",
          slippageTolerance: orderInput.slippageTolerance,
          messageType: "create-order",
        };

  const result = await requestEngine(command);

  res
    .status(result.ok ? 200 : 400)
    .json(result.ok ? result.data : { error: result.error });
};

export const onRamp = async (req: Request, res: Response) => {
  const { amount } = onrampSchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    amount,
    messageType: "on-ramp",
  });

  res
    .status(result.ok ? 200 : 400)
    .json(result.ok ? result.data : { error: result.error });
};

export const withdraw = async (req: Request, res: Response) => {
  const { amount } = withdrawSchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    amount,
    messageType: "withdraw",
  });

  res
    .status(result.ok ? 200 : 400)
    .json(result.ok ? result.data : { error: result.error });
};

export const getBalance = async (req: Request, res: Response) => {
  const result = await requestEngine({
    userId: req.user.id,
    messageType: "get-balance",
  });

  res
    .status(result.ok ? 200 : 400)
    .json(result.ok ? result.data : { error: result.error });
};
