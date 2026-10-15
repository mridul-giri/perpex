"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useBalance } from "@/components/balance/balance-context";
import { CroppedButton } from "@/components/ui/cropped";
import { clearAuthData, getToken, getUserName } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmt, fmtCompact } from "@/lib/format";

const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

const LABEL = "text-xs text-ink-muted";

export function AccountMenu() {
  const mounted = useMounted();
  const router = useRouter();
  const { availableNum, lockedNum, openDeposit, openWithdraw } = useBalance();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted) return null;

  const token = getToken();
  if (!token) {
    return (
      <div className="flex w-full items-stretch overflow-hidden rounded-md border border-hairline bg-panel">
        <Link
          href="/signin"
          className="flex w-full items-center justify-center bg-accent px-4 text-sm font-medium text-[#062018] transition-[filter] hover:brightness-110"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const name = getUserName();
  const total = availableNum + lockedNum;
  const totalLabel = `$${
    total >= 1_000_000 ? fmtCompact(total) : fmt(total, 2)
  }`;

  const logout = () => {
    clearAuthData();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="flex w-full items-stretch rounded-md border border-hairline bg-panel">
      <button
        type="button"
        onClick={openDeposit}
        className="hidden flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-l-md bg-panel-raised px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:flex"
      >
        <ArrowDownToLine className="size-4" strokeWidth={1.75} />
        Deposit
      </button>
      <button
        type="button"
        onClick={openWithdraw}
        className="hidden flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap border-l border-hairline bg-panel-raised px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:flex"
      >
        <ArrowUpFromLine className="size-4" strokeWidth={1.75} />
        Withdraw
      </button>

      <div className="relative flex w-full min-w-0 sm:w-auto" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border-l border-hairline bg-panel-raised px-3 text-sm text-ink transition-colors hover:bg-white/[0.03] sm:w-auto sm:rounded-l-none sm:rounded-r-md"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ground text-ink-muted">
            <User className="size-3.5" strokeWidth={1.75} />
          </span>
          <span className="tabular hidden min-w-0 truncate text-sm font-medium sm:inline">
            {totalLabel}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-ink-muted transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={2}
          />
        </button>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-hairline bg-panel shadow-float"
          >
            <div className="border-b border-hairline px-4 pb-4 pt-4">
              <div className={LABEL}>
                {name ? `Account · ${name}` : "Account"}
              </div>

              <div className={cn(LABEL, "mt-3")}>Total balance</div>
              <div className="tabular mt-1.5 text-2xl font-semibold leading-none text-ink">
                ${fmt(total, 2)}{" "}
                <span className="text-xs font-normal text-ink-dim">USDC</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className={LABEL}>Available</dt>
                  <dd className="tabular mt-1 text-sm font-medium text-up">
                    ${fmt(availableNum, 2)}
                  </dd>
                </div>
                <div>
                  <dt className={LABEL}>In orders</dt>
                  <dd className="tabular mt-1 text-sm font-medium text-ink">
                    ${fmt(lockedNum, 2)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                <CroppedButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    openDeposit();
                  }}
                >
                  Deposit
                </CroppedButton>
                <CroppedButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    openWithdraw();
                  }}
                >
                  Withdraw
                </CroppedButton>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full cursor-pointer px-4 py-3 text-left text-sm text-down transition-colors hover:bg-[rgb(253_75_78_/_0.1)]"
            >
              Log out
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
