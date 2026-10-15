"use client";

import { useState } from "react";
import { useBalance } from "@/components/balance/balance-context";
import { AmountField, Chip, StatusText } from "@/components/modals/modal-parts";
import { Modal } from "@/components/ui/modal";
import { fmt } from "@/lib/format";
import { PerpexTrading } from "@/lib/trading";

const PRESETS = ["100", "500", "1000", "5000"];
const trading = new PerpexTrading();

export function DepositModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { availableNum, refresh } = useBalance();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const amountNum = Number(amount);
  const valid = amountNum > 0;

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
      await trading.deposit(amount.replace(/\.$/, ""));
      setSuccess(`Deposited $${fmt(amountNum, 2)}.`);
      refresh();
      setTimeout(close, 900);
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
              ? `Deposit $${fmt(amountNum, 2)}`
              : "Deposit"}
        </button>
      </form>
    </Modal>
  );
}
