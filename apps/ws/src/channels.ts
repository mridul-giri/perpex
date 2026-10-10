export type Channel = "depth" | "trade";

export const isChannel = (value: string): value is Channel =>
  value === "depth" || value === "trade";
