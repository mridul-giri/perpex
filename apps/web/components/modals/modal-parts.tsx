"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { isDecimalDraft } from "@/lib/format";

export function AmountField({
  label,
  value,
  onChange,
  action,
  invalid,
  autoFocus,
  unit = "USDC",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  action?: React.ReactNode;
  invalid?: boolean;
  autoFocus?: boolean;
  unit?: string;
}) {
  return (
    <div>
      <span className="text-xs text-ink-muted">{label}</span>
      <div
        aria-invalid={invalid || undefined}
        className={cn(
          "mt-1.5 flex h-16 items-center gap-2 rounded-md bg-panel-raised px-4 transition-colors",
          invalid && "ring-1 ring-down/50",
        )}
      >
        <span className="text-2xl font-light leading-none text-ink-dim">$</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0.00"
          value={value}
          onChange={(event) => {
            if (isDecimalDraft(event.target.value))
              onChange(event.target.value);
          }}
          className="tabular min-w-0 flex-1 bg-transparent text-2xl font-semibold leading-none tracking-tight text-ink placeholder:text-ink-dim focus:outline-none"
        />
        {action}
        <span className="text-xs text-ink-muted">{unit}</span>
      </div>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tabular h-9 cursor-pointer rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-accent/15 text-ink"
          : "bg-panel-raised text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function StatusText({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs text-down">
        <TriangleAlert className="size-3.5 shrink-0" strokeWidth={1.75} />
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs text-up">
        <CircleCheck className="size-3.5 shrink-0" strokeWidth={1.75} />
        {success}
      </p>
    );
  }
  return null;
}
