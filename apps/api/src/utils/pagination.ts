import type { Paginated } from "@perpex/types";
import { ApiError } from "./api-error";

export const encodeCursor = (createdAt: Date, id: string): string =>
  Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64url");

export const decodeCursor = (
  cursor: string,
): { createdAt: Date; id: string } => {
  const raw = Buffer.from(cursor, "base64url").toString("utf8");
  const [iso, id] = raw.split("|");

  const createdAt = iso ? new Date(iso) : new Date(Number.NaN);
  if (!id || Number.isNaN(createdAt.getTime())) {
    throw new ApiError(400, "Invalid cursor");
  }

  return { createdAt, id };
};

export const page = <T>(
  rows: T[],
  limit: number,
  toCursor: (last: T) => string,
): Paginated<T> => {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return { items, nextCursor: hasMore && last ? toCursor(last) : null };
};

export const olderThanCursor = (cursor: string) => {
  const { createdAt, id } = decodeCursor(cursor);
  return {
    OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
  };
};
