import type { Request, Response } from "express";
import { marketSchema } from "@perpex/schemas";
import { requestEngine } from "../utils/request-engine";

export const createMarket = async (req: Request, res: Response) => {
  const input = marketSchema.parse(req.body);

  const data = await requestEngine({
    userId: req.user.id,
    marketSlug: input.newMarket,
    imageUrl: input.marketImg,
    messageType: "create-market",
  });

  res.status(201).json(data);
};
