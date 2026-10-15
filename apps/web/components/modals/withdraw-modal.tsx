"use client";

import { useState } from "react";
import { useBalance } from "@/components/balance/balance-context";
import { AmountField, Chip, StatusText } from "@/components/modals/modal-parts";
import { Modal } from "@/components/ui/modal";
import { fmt } from "@/lib/format";
import { PerpexTrading } from "@/lib/trading";

const PERCENTS = [25, 50, 75, 100];
const trading = new PerpexTrading();

export function WithdrawModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { balance, availableNum, refresh } = useBalance();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const amountNum = Number(amount);
  const exceeds = amountNum > availableNum;
  const valid = amountNum > 0 && !exceeds;

  const close = () => {
    setAmount("");
    setError("");
    setSuccess("");
    onClose();
  };

  const setPercent = (percent: number) => {
    setError("");
    if (percent === 100) {
      setAmount(balance.availableBalance);
      return;
    }
    const value = Math.floor(availableNum * (percent / 100) * 1e8) / 1e8;
    setAmount(value > 0 ? String(value) : "");
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!valid) {
      setError(
        exceeds
          ? "Amount exceeds your available balance."
          : "Enter an amount greater than 0.",
      );
      return;
    }
    setLoading(true);
    try {
      await trading.withdraw(amount.replace(/\.$/, ""));
      setSuccess(`Withdrew $${fmt(amountNum, 2)}.`);
      refresh();
      setTimeout(close, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Withdraw USDC"
      meta={
        <>
          Available ·{" "}
          <span className="tabular text-ink/70">${fmt(availableNum, 2)}</span>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <AmountField
          label="Amount"
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setError("");
          }}
          invalid={!!error || exceeds}
          autoFocus
          action={
            <button
              type="button"
              onClick={() => setPercent(100)}
              className="h-7 shrink-0 cursor-pointer rounded-md bg-panel-raised px-3 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Max
            </button>
          }
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {PERCENTS.map((percent) => (
            <Chip
              key={percent}
              active={
                availableNum > 0 &&
                amount !== "" &&
                Math.abs(amountNum - availableNum * (percent / 100)) < 1e-8
              }
              onClick={() => setPercent(percent)}
            >
              {percent}%
            </Chip>
          ))}
        </div>
        <StatusText
          error={
            error || (exceeds ? "Amount exceeds your available balance." : "")
          }
          success={success}
        />
        <button
          type="submit"
          disabled={loading || !!success}
          className="mt-5 h-11 w-full cursor-pointer rounded-md bg-down-deep text-sm font-semibold text-ink transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Withdrawing…"
            : valid
              ? `Withdraw $${fmt(amountNum, 2)}`
              : "Withdraw"}
        </button>
      </form>
    </Modal>
  );
}
