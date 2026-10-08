import { prisma } from "@perpex/db";

export const upsertMarket = async (data: {
  marketSlug: string;
  imageUrl?: string;
}) => {
  await prisma.market.upsert({
    where: { marketSlug: data.marketSlug },
    create: { marketSlug: data.marketSlug, imageUrl: data.imageUrl },
    update: { imageUrl: data.imageUrl },
  });
};
