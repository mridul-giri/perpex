import { cn } from "@/lib/cn";
import { seededRandom } from "@/lib/seeded-random";

const WIDTH = 1200;
const HEIGHT = 480;
const CANDLE_COUNT = 52;
const STEP = 25;
const BODY_WIDTH = 13;
const FIRST_X = -30;
const SEED = 7;

interface DrawnCandle {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
}

function trendAt(progress: number) {
  const rise = progress ** 2.4;
  const wave = Math.sin(progress * Math.PI * 2) * 0.06;
  return 0.2 + rise * 0.58 + wave;
}

function buildCandles() {
  const random = seededRandom(SEED);
  const candles: DrawnCandle[] = [];
  let open = trendAt(0);

  for (let index = 0; index < CANDLE_COUNT; index++) {
    const progress = index / (CANDLE_COUNT - 1);
    const noise = (random() - 0.5) * 0.26;
    const close = trendAt(progress) + noise;
    const high = Math.max(open, close) + random() * 0.06;
    const low = Math.min(open, close) - random() * 0.06;
    candles.push({ x: FIRST_X + index * STEP, open, close, high, low });
    open = close;
  }

  return candles;
}

const toY = (value: number) => HEIGHT - value * HEIGHT;

const candles = buildCandles();

export function RisingCandles({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn("block", className)}
      aria-hidden
    >
      {candles.map((candle, index) => {
        const isUp = candle.close >= candle.open;
        const color = isUp ? "var(--color-up)" : "var(--color-down)";
        const bodyTop = toY(Math.max(candle.open, candle.close));
        const bodyHeight = Math.max(
          Math.abs(candle.close - candle.open) * HEIGHT,
          2,
        );
        const centerX = candle.x + BODY_WIDTH / 2;

        return (
          <g
            key={index}
            className="candle-rise"
            style={{ animationDelay: `${index * 18}ms` }}
          >
            <line
              x1={centerX}
              x2={centerX}
              y1={toY(candle.high)}
              y2={toY(candle.low)}
              stroke={color}
              strokeWidth={2}
            />
            <rect
              x={candle.x}
              y={bodyTop}
              width={BODY_WIDTH}
              height={bodyHeight}
              rx={2}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}
