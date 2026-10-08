export const PRECISION = 8;

export const SCALE = 10n ** BigInt(PRECISION);

export function toBigInt(value: string, precision: number = PRECISION): bigint {
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > precision) throw new Error("Precision is too high");
  const padded = fraction.padEnd(precision, "0");
  return BigInt(whole + padded);
}

export function toString(input: bigint): string {
  const negative = input < 0n;
  const abs = negative ? -input : input;
  const whole = abs / SCALE;
  const fraction = abs % SCALE;
  const fractionStr = fraction
    .toString()
    .padStart(PRECISION, "0")
    .replace(/0+$/, "");
  const result =
    fractionStr.length > 0 ? `${whole}.${fractionStr}` : whole.toString();
  return negative ? `-${result}` : result;
}
