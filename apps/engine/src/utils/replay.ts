import { getGroupOffset, readStreamRange } from "@perpex/redis";

export const replayMissed = async (
  streamKey: string,
  group: string,
  fromOffset: string | null,
  handler: (data: unknown, id: string) => Promise<void>,
): Promise<number> => {
  if (!fromOffset) return 0;

  const groupOffset = await getGroupOffset(streamKey, group);
  if (!groupOffset) return 0;

  const missed = await readStreamRange(streamKey, fromOffset, groupOffset);
  if (missed.length === 0) return 0;

  console.log(`replaying ${missed.length} missed messages`);

  for (const entry of missed) {
    await handler(entry.data, entry.id);
  }

  return missed.length;
};
