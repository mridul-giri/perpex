"use client";

import { useState } from "react";
import { AmountField, Chip, StatusText } from "@/components/modals/modal-parts";
import { Modal } from "@/components/ui/modal";
import { withdraw } from "@/lib/api/account";
import { cleanDecimal, formatNumber } from "@/lib/format";

const PERCENTS = [25, 50, 75, 100];
const CLOSE_AFTER_SUCCESS_MS = 900;

const percentOf = (available: number, percent: number) =>
  Math.floor(available * (percent / 100) * 1e8) / 1e8;

export function WithdrawModal({
  open,
  onClose,
  availableText,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  availableText: string;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const available = Number(availableText);
  const amountNumber = Number(amount);
  const exceeds = amountNumber > available;
  const valid = amountNumber > 0 && !exceeds;

  const close = () => {
    setAmount("");
    setError("");
    setSuccess("");
    onClose();
  };

  const choosePercent = (percent: number) => {
    setError("");
    if (percent === 100) {
      setAmount(availableText);
      return;
    }
    const value = percentOf(available, percent);
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
      await withdraw(cleanDecimal(amount));
      setSuccess(`Withdrew $${formatNumber(amountNumber, 2)}.`);
      onDone();
      setTimeout(close, CLOSE_AFTER_SUCCESS_MS);
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
          <span className="tabular text-ink/70">
            ${formatNumber(available, 2)}
          </span>
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
              onClick={() => choosePercent(100)}
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
                available > 0 &&
                amount !== "" &&
                amountNumber === percentOf(available, percent)
              }
              onClick={() => choosePercent(percent)}
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
              ? `Withdraw $${formatNumber(amountNumber, 2)}`
              : "Withdraw"}
        </button>
      </form>
    </Modal>
  );
}
