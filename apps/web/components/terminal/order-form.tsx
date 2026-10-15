"use client";

import { useState } from "react";
import { useBalance } from "@/components/balance/balance-context";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/format";
import type { Side } from "@/lib/market/types";
import { PerpexTrading } from "@/lib/trading";

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50];
const SLIDER_STOPS = [0, 25, 50, 75, 100];
const DECIMAL_INPUT = /^\d*\.?\d{0,8}$/;

type OrderType = "LIMIT" | "MARKET";

export interface OrderFormProps {
  market: string;
  base: string;
  dp: number;
  markPrice: string | null;
  live: boolean;
}

export function OrderForm({
  market,
  base,
  dp,
  markPrice,
  live,
}: OrderFormProps) {
  const trading = new PerpexTrading();

  const [side, setSide] = useState<Side>("LONG");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [percent, setPercent] = useState(0);
  const [slippage, setSlippage] = useState("0.02");
  const [status, setStatus] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    availableNum: available,
    openDeposit,
    openWithdraw,
    refresh,
  } = useBalance();

  const isLong = side === "LONG";
  const effectivePrice =
    type === "MARKET" ? Number(markPrice ?? 0) : Number(price || 0);
  const qty = Number(quantity || 0);
  const notional = qty * effectivePrice;
  const margin = leverage > 0 ? notional / leverage : 0;
  const liqEstimate =
    effectivePrice > 0
      ? isLong
        ? effectivePrice * (1 - 1 / leverage)
        : effectivePrice * (1 + 1 / leverage)
      : 0;

  const applyPercent = (value: number) => {
    setPercent(value);
    if (available > 0 && effectivePrice > 0) {
      const marginToUse = available * (value / 100);
      const buyingPower = marginToUse * leverage;
      const computed = Math.floor((buyingPower / effectivePrice) * 1e4) / 1e4;
      setQuantity(computed > 0 ? computed.toFixed(4) : "0");
    } else {
      setQuantity("0");
    }
  };

  const onSubmit = async () => {
    setStatus(null);

    if (!live) {
      setStatus({
        text: "Backend offline — order entry is disabled.",
        isError: true,
      });
      return;
    }
    if (!(qty > 0)) {
      setStatus({ text: "Enter a size greater than zero.", isError: true });
      return;
    }
    if (type === "LIMIT" && !(Number(price) > 0)) {
      setStatus({ text: "Enter a valid limit price.", isError: true });
      return;
    }
    if (margin > available + 1e-6) {
      setStatus({
        text: `Insufficient margin: need $${margin.toFixed(2)}, available $${available.toFixed(2)}.`,
        isError: true,
      });
      return;
    }

    setLoading(true);
    try {
      await trading.placeOrder({
        type,
        side,
        market,
        quantity: quantity.replace(/\.$/, ""),
        leverage,
        price: type === "LIMIT" ? price.replace(/\.$/, "") : undefined,
        slippageTolerance: type === "MARKET" ? Number(slippage) : undefined,
      });
      setStatus({ text: "Order placed.", isError: false });
      setQuantity("");
      setPercent(0);
      refresh();
    } catch (err) {
      setStatus({
        text: err instanceof Error ? err.message : "Order failed.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-panel-raised p-1">
        <button
          type="button"
          onClick={() => setSide("LONG")}
          className={cn(
            "h-9 cursor-pointer rounded-md text-sm font-semibold transition-colors",
            isLong
              ? "bg-[rgb(0_194_120_/_0.16)] text-up"
              : "text-ink-muted hover:text-ink",
          )}
        >
          Buy / Long
        </button>
        <button
          type="button"
          onClick={() => setSide("SHORT")}
          className={cn(
            "h-9 cursor-pointer rounded-md text-sm font-semibold transition-colors",
            !isLong
              ? "bg-[rgb(253_75_78_/_0.16)] text-down"
              : "text-ink-muted hover:text-ink",
          )}
        >
          Sell / Short
        </button>
      </div>

      <div className="mt-4 flex gap-5 border-b border-hairline text-sm">
        {(["LIMIT", "MARKET"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "cursor-pointer pb-2 font-medium capitalize transition-colors",
              type === t ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {t.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-ink-muted">Leverage</span>
          <span className="tabular font-semibold text-ink">{leverage}x</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {LEVERAGE_OPTIONS.map((lev) => (
            <button
              key={lev}
              type="button"
              onClick={() => setLeverage(lev)}
              className={cn(
                "tabular h-7 cursor-pointer rounded-md text-xs font-medium transition-colors",
                leverage === lev
                  ? "bg-accent-soft text-ink"
                  : "bg-panel-raised text-ink-muted hover:text-ink",
              )}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-ink-muted">Available</span>
        <span className="flex items-center gap-3">
          <span className="tabular font-semibold text-ink">
            ${fmt(available, 2)}
          </span>
          <button
            type="button"
            onClick={openDeposit}
            className="cursor-pointer font-medium text-accent transition-[filter] hover:brightness-110"
          >
            Deposit
          </button>
          <button
            type="button"
            onClick={openWithdraw}
            className="cursor-pointer font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Withdraw
          </button>
        </span>
      </div>

      <FieldBox label="Price" unit="USD" className="mt-3">
        {type === "MARKET" ? (
          <span className="flex-1 text-right text-lg text-ink-muted">
            Market price
          </span>
        ) : (
          <>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) =>
                DECIMAL_INPUT.test(e.target.value) && setPrice(e.target.value)
              }
              placeholder={markPrice ? fmt(markPrice, dp) : "0.00"}
              className="tabular min-w-0 flex-1 bg-transparent text-right text-lg font-medium text-ink placeholder:text-ink-dim focus:outline-none"
            />
            {markPrice && (
              <button
                type="button"
                onClick={() => setPrice(Number(markPrice).toFixed(dp))}
                className="cursor-pointer rounded-md bg-panel-raised px-2 py-1 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                Last
              </button>
            )}
          </>
        )}
      </FieldBox>

      <FieldBox label="Size" unit={base} className="mt-2">
        <input
          type="text"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => {
            if (!DECIMAL_INPUT.test(e.target.value)) return;
            setQuantity(e.target.value);
            setPercent(0);
          }}
          placeholder="0.00"
          className="tabular min-w-0 flex-1 bg-transparent text-right text-lg font-medium text-ink placeholder:text-ink-dim focus:outline-none"
        />
      </FieldBox>

      {type === "MARKET" && (
        <FieldBox label="Slippage" unit="%" className="mt-2">
          <input
            type="text"
            inputMode="decimal"
            value={slippage}
            onChange={(e) =>
              DECIMAL_INPUT.test(e.target.value) && setSlippage(e.target.value)
            }
            className="tabular min-w-0 flex-1 bg-transparent text-right text-lg font-medium text-ink focus:outline-none"
          />
        </FieldBox>
      )}

      <PercentSlider
        value={percent}
        onChange={applyPercent}
        color={isLong ? "#00c278" : "#fd4b4e"}
      />

      <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-xs">
        <SummaryRow label="Order value" value={`$${fmt(notional, 2)}`} />
        <SummaryRow label="Margin required" value={`$${fmt(margin, 2)}`} />
        <SummaryRow
          label="Est. liquidation price"
          value={liqEstimate > 0 ? fmt(liqEstimate, dp) : "—"}
        />
      </dl>

      <div className="mt-auto pt-4 pb-4">
        {status && (
          <p
            className={cn(
              "mb-3 text-xs",
              status.isError ? "text-down" : "text-up",
            )}
          >
            {status.text}
          </p>
        )}
        <button
          type="button"
          disabled={loading || !live}
          onClick={onSubmit}
          className={cn(
            "h-11 w-full cursor-pointer rounded-md text-sm font-semibold transition-[filter] disabled:cursor-not-allowed disabled:opacity-45",
            isLong
              ? "bg-up-deep text-ink hover:brightness-110"
              : "bg-down-deep text-ink hover:brightness-110",
          )}
        >
          {loading
            ? "Submitting…"
            : `${isLong ? "Buy / Long" : "Sell / Short"} ${base}`}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular font-medium text-ink">{value}</dd>
    </div>
  );
}

function FieldBox({
  label,
  unit,
  className,
  children,
}: {
  label: string;
  unit: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex h-14 items-center gap-3 rounded-md bg-panel-raised px-4 transition-colors",
        className,
      )}
    >
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
      <span className="w-12 text-right text-sm text-ink-dim">{unit}</span>
    </label>
  );
}

function PercentSlider({
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
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Size as percentage of available balance"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-md bg-panel-raised"
        style={{ accentColor: color }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-ink-dim">
        {SLIDER_STOPS.map((stop) => (
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
