import { cn } from "@/lib/cn";
import { isDecimalDraft } from "@/lib/format";
import type { OrderType, Side } from "@/lib/types";

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50];
const PERCENT_STOPS = [0, 25, 50, 75, 100];

export function SideToggle({
  side,
  onChange,
}: {
  side: Side;
  onChange: (side: Side) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-md bg-panel-raised p-1">
      <button
        type="button"
        onClick={() => onChange("LONG")}
        className={cn(
          "h-9 cursor-pointer rounded-md text-sm font-semibold transition-colors",
          side === "LONG"
            ? "bg-[rgb(0_194_120_/_0.16)] text-up"
            : "text-ink-muted hover:text-ink",
        )}
      >
        Buy / Long
      </button>
      <button
        type="button"
        onClick={() => onChange("SHORT")}
        className={cn(
          "h-9 cursor-pointer rounded-md text-sm font-semibold transition-colors",
          side === "SHORT"
            ? "bg-[rgb(253_75_78_/_0.16)] text-down"
            : "text-ink-muted hover:text-ink",
        )}
      >
        Sell / Short
      </button>
    </div>
  );
}

export function OrderTypeTabs({
  type,
  onChange,
}: {
  type: OrderType;
  onChange: (type: OrderType) => void;
}) {
  return (
    <div className="mt-4 flex gap-5 border-b border-hairline text-sm">
      {(["LIMIT", "MARKET"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "cursor-pointer pb-2 font-medium capitalize transition-colors",
            type === option ? "text-ink" : "text-ink-muted hover:text-ink",
          )}
        >
          {option.toLowerCase()}
        </button>
      ))}
    </div>
  );
}

export function LeveragePicker({
  leverage,
  onChange,
}: {
  leverage: number;
  onChange: (leverage: number) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-ink-muted">Leverage</span>
        <span className="tabular font-semibold text-ink">{leverage}x</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {LEVERAGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "tabular h-7 cursor-pointer rounded-md text-xs font-medium transition-colors",
              leverage === option
                ? "bg-accent-soft text-ink"
                : "bg-panel-raised text-ink-muted hover:text-ink",
            )}
          >
            {option}x
          </button>
        ))}
      </div>
    </div>
  );
}

export function DecimalField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  action,
  className,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-14 items-center gap-3 rounded-md bg-panel-raised px-4 transition-colors",
        className,
      )}
    >
      <span className="text-sm text-ink-muted">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          if (isDecimalDraft(event.target.value)) onChange(event.target.value);
        }}
        placeholder={placeholder}
        className="tabular min-w-0 flex-1 bg-transparent text-right text-lg font-medium text-ink placeholder:text-ink-dim focus:outline-none"
      />
      {action}
      <span className="w-12 text-right text-sm text-ink-dim">{unit}</span>
    </label>
  );
}

export function PercentSlider({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-ink-muted">Size by balance</span>
        <span className="tabular font-semibold text-ink">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Size as percentage of available balance"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-md bg-panel-raised"
        style={{ accentColor: color }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-ink-dim">
        {PERCENT_STOPS.map((stop) => (
          <button
            key={stop}
            type="button"
            onClick={() => onChange(stop)}
            className={cn(
              "tabular cursor-pointer hover:text-ink",
              value === stop && "text-ink",
            )}
          >
            {stop}%
          </button>
        ))}
      </div>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular font-medium text-ink">{value}</dd>
    </div>
  );
}
