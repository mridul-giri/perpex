import type { Candle } from "@/lib/types";

const STEP = 10;
const BODY_WIDTH = 6;
const HEIGHT = 80;
const PADDING = 6;

export function MarketCandles({ candles }: { candles: Candle[] }) {
  const highs = candles.map((candle) => Number(candle.high));
  const lows = candles.map((candle) => Number(candle.low));
  const top = Math.max(...highs);
  const bottom = Math.min(...lows);
  const range = top - bottom || 1;

  const toY = (price: string) =>
    PADDING + ((top - Number(price)) / range) * (HEIGHT - PADDING * 2);

  const width = candles.length * STEP;

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="block h-full w-full"
      aria-hidden
    >
      {candles.map((candle, index) => {
        const isUp = Number(candle.close) >= Number(candle.open);
        const color = isUp ? "var(--color-up)" : "var(--color-down)";
        const bodyTop = toY(isUp ? candle.close : candle.open);
        const bodyBottom = toY(isUp ? candle.open : candle.close);
        const left = index * STEP + (STEP - BODY_WIDTH) / 2;
        const centerX = index * STEP + STEP / 2;

        return (
          <g key={candle.timestamp}>
            <line
              x1={centerX}
              x2={centerX}
              y1={toY(candle.high)}
              y2={toY(candle.low)}
              stroke={color}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={left}
              y={bodyTop}
              width={BODY_WIDTH}
              height={Math.max(bodyBottom - bodyTop, 1)}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}
