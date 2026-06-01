import { prisma } from "@perpex/db";
import { marketSchema } from "@perpex/schemas";
import type { Request, Response } from "express";

export const createMarket = async (req: Request, res: Response) => {
  const marketInput = marketSchema.parse(req.body);

  await prisma.market.create({
    data: {
      marketSlug: marketInput.newMarket,
      imageUrl: marketInput.marketImg,
    },
  });

  res.status(201).json({ message: "market created" });
};
