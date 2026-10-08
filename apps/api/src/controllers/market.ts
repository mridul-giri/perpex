import { marketSchema } from "@perpex/schemas";
import type { Request, Response } from "express";
import { requestEngine } from "../utils/request-engine";

export const createMarket = async (req: Request, res: Response) => {
  const marketInput = marketSchema.parse(req.body);

  const result = await requestEngine({
    userId: req.user.id,
    marketSlug: marketInput.newMarket,
    imageUrl: marketInput.marketImg,
    messageType: "create-market",
  });

  res
    .status(result.ok ? 201 : 400)
    .json(result.ok ? result.data : { error: result.error });
};
