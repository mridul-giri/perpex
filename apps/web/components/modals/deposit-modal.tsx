"use client";

import { useState } from "react";
import { AmountField, Chip, StatusText } from "@/components/modals/modal-parts";
import { Modal } from "@/components/ui/modal";
import { deposit } from "@/lib/api/account";
import { cleanDecimal, formatNumber } from "@/lib/format";

const PRESETS = ["100", "500", "1000", "5000"];
const CLOSE_AFTER_SUCCESS_MS = 900;

export function DepositModal({
  open,
  onClose,
  available,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  available: number;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const amountNumber = Number(amount);
  const valid = amountNumber > 0;

  const close = () => {
    setAmount("");
    setError("");
    setSuccess("");
    onClose();
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!valid) {
      setError("Enter an amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      await deposit(cleanDecimal(amount));
      setSuccess(`Deposited $${formatNumber(amountNumber, 2)}.`);
      onDone();
      setTimeout(close, CLOSE_AFTER_SUCCESS_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Deposit USDC"
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
          invalid={!!error}
          autoFocus
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <Chip
              key={preset}
              active={amount === preset}
              onClick={() => setAmount(preset)}
            >
              {Number(preset).toLocaleString("en-US")}
            </Chip>
          ))}
        </div>
        <StatusText error={error} success={success} />
        <button
          type="submit"
          disabled={loading || !!success}
          className="mt-5 h-11 w-full cursor-pointer rounded-md bg-accent text-sm font-semibold text-[#062018] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Depositing…"
            : valid
              ? `Deposit $${formatNumber(amountNumber, 2)}`
              : "Deposit"}
        </button>
      </form>
    </Modal>
  );
}
