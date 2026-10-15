const cache = new Map<number, Intl.NumberFormat>();

const nf = (dp: number) => {
  let f = cache.get(dp);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
    cache.set(dp, f);
  }
  return f;
};

export const fmt = (value: string | number, dp = 2) =>
  nf(dp).format(Number(value));

export const fmtCompact = (value: string | number) => {
  const n = Number(value);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
};

export const fmtSigned = (value: string | number, dp = 2) => {
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${nf(dp).format(n)}`;
};

export const priceDp = (market: string) => {
  const base = market.split(/[-_/]/)[0]?.toUpperCase();
  if (base === "BTC") return 1;
  if (base === "ETH") return 2;
  if (base === "SOL") return 3;
  return 2;
};

export const fmtTime = (timestamp: number) =>
  new Date(timestamp * 1000).toTimeString().slice(0, 8);

export const fmtDateTime = (iso?: string) => {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
