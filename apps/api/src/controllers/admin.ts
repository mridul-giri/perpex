import type { Request, Response } from "express";
import { marketSchema } from "@perpex/schemas";
import { requestEngine } from "../utils/request-engine";
import { ApiError } from "../utils/api-error";

export const createMarket = async (req: Request, res: Response) => {
  const input = marketSchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    marketSlug: input.newMarket,
    imageUrl: input.marketImg,
    messageType: "create-market",
  });

  if (!result.ok) {
    throw new ApiError(400, result.error ?? "Market creation failed");
  }

  res.status(201).json(result.data);
};
