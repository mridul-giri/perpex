"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useBalance } from "@/components/balance/balance-provider";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useIsClient } from "@/hooks/use-is-client";
import { signOut } from "@/lib/api/auth";
import { cn } from "@/lib/cn";
import { formatCompact, formatNumber } from "@/lib/format";
import { getUserName, isSignedIn } from "@/lib/session";

const LABEL = "text-xs text-ink-muted";

export function AccountMenu() {
  const isClient = useIsClient();
  const router = useRouter();
  const { available, locked, openDeposit, openWithdraw } = useBalance();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  if (!isClient) return null;
  if (!isSignedIn()) return <SignInLink />;

  const name = getUserName();
  const total = available + locked;
  const totalLabel = `$${
    total >= 1_000_000 ? formatCompact(total) : formatNumber(total, 2)
  }`;

  const closeThen = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const logOut = () => {
    signOut();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="flex w-full items-stretch">
      <button
        type="button"
        onClick={openDeposit}
        className="hidden flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-white/[0.03] hover:text-ink sm:flex"
      >
        <ArrowDownToLine className="size-4" strokeWidth={1.75} />
        Deposit
      </button>
      <button
        type="button"
        onClick={openWithdraw}
        className="hidden flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap border-l border-dashed border-white/[0.1] px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-white/[0.03] hover:text-ink sm:flex"
      >
        <ArrowUpFromLine className="size-4" strokeWidth={1.75} />
        Withdraw
      </button>

      <div className="relative flex w-full min-w-0 sm:w-auto" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap px-3 text-sm text-ink transition-colors hover:bg-white/[0.03] sm:w-auto sm:border-l sm:border-dashed sm:border-white/[0.1]"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-panel-raised text-ink-muted">
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
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-dashed border-white/[0.14] bg-ground shadow-float"
          >
            <div className="border-b border-hairline px-4 pb-4 pt-4">
              <div className={LABEL}>
                {name ? `Account · ${name}` : "Account"}
              </div>

              <div className={cn(LABEL, "mt-3")}>Total balance</div>
              <div className="tabular mt-1.5 text-2xl font-semibold leading-none text-ink">
                ${formatNumber(total, 2)}{" "}
                <span className="text-xs font-normal text-ink-dim">USDC</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className={LABEL}>Available</dt>
                  <dd className="tabular mt-1 text-sm font-medium text-up">
                    ${formatNumber(available, 2)}
                  </dd>
                </div>
                <div>
                  <dt className={LABEL}>In orders</dt>
                  <dd className="tabular mt-1 text-sm font-medium text-ink">
                    ${formatNumber(locked, 2)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={closeThen(openDeposit)}
                >
                  Deposit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={closeThen(openWithdraw)}
                >
                  Withdraw
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={logOut}
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

function SignInLink() {
  return (
    <div className="flex w-full items-stretch p-3">
      <Link
        href="/signin"
        className="flex w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-ground transition-colors hover:bg-white"
      >
        Sign in
      </Link>
    </div>
  );
}
