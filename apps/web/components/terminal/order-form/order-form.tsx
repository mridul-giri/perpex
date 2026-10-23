"use client";

import { useState } from "react";
import { useBalance } from "@/components/balance/balance-provider";
import { placeOrder } from "@/lib/api/account";
import { cn } from "@/lib/cn";
import { cleanDecimal, formatNumber } from "@/lib/format";
import type { MarketConfig } from "@/lib/markets";
import {
  liquidationPriceEstimate,
  marginRequired,
  orderValue,
  sizeForPercent,
} from "@/lib/order-math";
import type { OrderType, Side } from "@/lib/types";
import {
  DecimalField,
  LeveragePicker,
  OrderTypeTabs,
  PercentSlider,
  SideToggle,
  SummaryRow,
} from "./form-parts";

interface Status {
  text: string;
  isError: boolean;
}

export function OrderForm({
  market,
  markPrice,
}: {
  market: MarketConfig;
  markPrice: string | null;
}) {
  const { available, openDeposit, openWithdraw, refresh } = useBalance();

  const [side, setSide] = useState<Side>("LONG");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [percent, setPercent] = useState(0);
  const [slippage, setSlippage] = useState("2");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  const estimatePrice =
    type === "MARKET" ? Number(markPrice ?? 0) : Number(price || 0);
  const sizeNumber = Number(size || 0);
  const value = orderValue(estimatePrice, sizeNumber);
  const margin = marginRequired(value, leverage);
  const liquidationPrice = liquidationPriceEstimate(
    side,
    estimatePrice,
    leverage,
  );

  const choosePercent = (nextPercent: number) => {
    setPercent(nextPercent);
    const nextSize = sizeForPercent(
      available,
      nextPercent,
      leverage,
      estimatePrice,
    );
    setSize(nextSize > 0 ? nextSize.toFixed(4) : "0");
  };

  const onSubmit = async () => {
    const problem = orderProblem({
      type,
      size: sizeNumber,
      price: Number(price),
      margin,
      available,
    });
    if (problem) {
      setStatus({ text: problem, isError: true });
      return;
    }

    setStatus(null);
    setLoading(true);
    try {
      const common = {
        side,
        market: market.slug,
        quantity: cleanDecimal(size),
        leverage,
      };
      await placeOrder(
        type === "LIMIT"
          ? { ...common, type, price: cleanDecimal(price) }
          : { ...common, type, slippageTolerance: Number(slippage) / 100 },
      );
      setStatus({ text: "Order placed.", isError: false });
      setSize("");
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

  const isLong = side === "LONG";

  return (
    <div className="flex h-full flex-col p-4">
      <SideToggle side={side} onChange={setSide} />
      <OrderTypeTabs type={type} onChange={setType} />
      <LeveragePicker leverage={leverage} onChange={setLeverage} />

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-ink-muted">Available</span>
        <span className="flex items-center gap-3">
          <span className="tabular font-semibold text-ink">
            ${formatNumber(available, 2)}
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

      {type === "LIMIT" ? (
        <DecimalField
          label="Price"
          unit="USD"
          className="mt-3"
          value={price}
          onChange={setPrice}
          placeholder={
            markPrice ? formatNumber(markPrice, market.priceDecimals) : "0.00"
          }
          action={
            markPrice && (
              <button
                type="button"
                onClick={() =>
                  setPrice(Number(markPrice).toFixed(market.priceDecimals))
                }
                className="cursor-pointer rounded-md bg-panel-raised px-2 py-1 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                Mark
              </button>
            )
          }
        />
      ) : (
        <label className="mt-3 flex h-14 items-center gap-3 rounded-md bg-panel-raised px-4">
          <span className="text-sm text-ink-muted">Price</span>
          <span className="flex-1 text-right text-lg text-ink-muted">
            Market price
          </span>
          <span className="w-12 text-right text-sm text-ink-dim">USD</span>
        </label>
      )}

      <DecimalField
        label="Size"
        unit={market.symbol}
        className="mt-2"
        value={size}
        onChange={(next) => {
          setSize(next);
          setPercent(0);
        }}
        placeholder="0.00"
      />

      {type === "MARKET" && (
        <DecimalField
          label="Slippage"
          unit="%"
          className="mt-2"
          value={slippage}
          onChange={setSlippage}
        />
      )}

      <PercentSlider
        value={percent}
        onChange={choosePercent}
        color={isLong ? "#00c278" : "#fd4b4e"}
      />

      <dl className="mt-4 space-y-2 border-t border-hairline pt-4 text-xs">
        <SummaryRow label="Order value" value={`$${formatNumber(value, 2)}`} />
        <SummaryRow
          label="Margin required"
          value={`$${formatNumber(margin, 2)}`}
        />
        <SummaryRow
          label="Est. liquidation price"
          value={
            sizeNumber > 0 && liquidationPrice > 0
              ? formatNumber(liquidationPrice, market.priceDecimals)
              : "—"
          }
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
          disabled={loading}
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
            : `${isLong ? "Buy / Long" : "Sell / Short"} ${market.symbol}`}
        </button>
      </div>
    </div>
  );
}

function orderProblem(order: {
  type: OrderType;
  size: number;
  price: number;
  margin: number;
  available: number;
}) {
  if (!(order.size > 0)) return "Enter a size greater than zero.";
  if (order.type === "LIMIT" && !(order.price > 0)) {
    return "Enter a valid limit price.";
  }
  if (order.margin > order.available + 1e-6) {
    return `Insufficient margin: need $${order.margin.toFixed(2)}, available $${order.available.toFixed(2)}.`;
  }
  return null;
}
