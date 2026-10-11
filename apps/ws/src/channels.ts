export type Channel = "depth" | "trade" | "markprice";

export const isChannel = (value: string): value is Channel =>
  value === "depth" || value === "trade" || value === "markprice";
