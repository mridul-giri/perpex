const formatters = new Map<number, Intl.NumberFormat>();

const formatterFor = (decimals: number) => {
  let formatter = formatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(decimals, formatter);
  }
  return formatter;
};

export const formatNumber = (value: string | number, decimals = 2) =>
  formatterFor(decimals).format(Number(value));

export const formatSigned = (value: string | number, decimals = 2) => {
  const number = Number(value);
  return `${number >= 0 ? "+" : ""}${formatterFor(decimals).format(number)}`;
};

export const formatCompact = (value: string | number) => {
  const number = Number(value);
  const size = Math.abs(number);
  if (size >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
  if (size >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
  if (size >= 1e3) return `${(number / 1e3).toFixed(2)}K`;
  return number.toFixed(2);
};

export const formatTime = (timestamp: number) =>
  new Date(timestamp * 1000).toTimeString().slice(0, 8);

export const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isDecimalDraft = (text: string) => /^\d*\.?\d{0,8}$/.test(text);

export const cleanDecimal = (text: string) => text.replace(/\.$/, "");
