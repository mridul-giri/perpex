import { prisma } from "@perpex/db";
import type { InsuranceFundUpdate } from "@perpex/types";

export const upsertInsuranceFund = async (data: InsuranceFundUpdate) => {
  const market = await prisma.market.findUnique({
    where: { marketSlug: data.market },
  });

  if (!market) throw new Error("Market not found");

  await prisma.insuranceFund.upsert({
    where: { marketId: market.id },
    create: { marketId: market.id, balance: data.balance },
    update: { balance: data.balance },
  });
};
