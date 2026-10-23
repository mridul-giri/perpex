import { SCALE } from "./conversion";

export const marginFor = (price: bigint, quantity: bigint, leverage: number) =>
  (price * quantity) / (SCALE * BigInt(leverage));
