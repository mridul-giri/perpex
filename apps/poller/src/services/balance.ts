import { prisma } from "@perpex/db";

export const updateBalance = async (data: {
  userId: string;
  available: string;
  locked: string;
}) => {
  await prisma.balance.upsert({
    where: { userId: data.userId },
    create: {
      userId: data.userId,
      available: data.available,
      locked: data.locked,
    },
    update: {
      available: data.available,
      locked: data.locked,
    },
  });
};
