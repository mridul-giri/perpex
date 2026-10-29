import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BoxCorners, ScreenRule } from "@/components/landing/rules";
import { cn } from "@/lib/cn";

interface Step {
  title: string;
  body: string;
  preview: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Create your account",
    body: "Sign up with a name, email and password. No extra forms, no waiting list.",
    preview: <SignupPreview />,
  },
  {
    title: "Add USDC",
    body: "Deposit from the account menu in the terminal, and withdraw the same way whenever you want.",
    preview: <DepositPreview />,
  },
  {
    title: "Open your first position",
    body: "Pick a market, go long or short and set leverage from 1x to 50x. You see the margin and estimated liquidation price before you place it.",
    preview: <OrderPreview />,
  },
];

export function GetStartedSection() {
  return (
    <section aria-labelledby="get-started-heading" className="mt-20 sm:mt-28">
      <div className="flex flex-col gap-3 px-5 pb-8 text-left sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-10">
        <div>
          <h2
            id="get-started-heading"
            className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink"
          >
            Start trading in three steps
          </h2>
          <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-ink-muted">
            From sign-up to your first position, everything happens in one
            terminal.
          </p>
        </div>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:self-auto"
        >
          Create account
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>

      <div className="relative">
        <ScreenRule className="top-0" />
        <ScreenRule className="bottom-0" />
        <BoxCorners />
        <ol className="grid divide-y divide-dashed divide-white/[0.1] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col px-5 py-7 text-left sm:px-8 sm:py-8"
            >
              <span className="tabular text-sm text-ink-dim">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
              <div className="mt-auto pt-8">
                <PreviewFrame>{step.preview}</PreviewFrame>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="relative flex h-[184px] select-none flex-col justify-end rounded-md bg-panel p-4"
    >
      <span className="absolute right-3 top-3 text-[10px] uppercase tracking-[0.08em] text-ink-dim">
        Preview
      </span>
      {children}
    </div>
  );
}

function FakeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-9 items-center justify-between rounded-sm bg-panel-raised px-3 text-xs">
      <span className="text-ink-dim">{label}</span>
      <span className="tabular text-ink-muted">{value}</span>
    </div>
  );
}

function SignupPreview() {
  return (
    <div className="flex flex-col gap-2 pt-5">
      <FakeField label="Email" value="you@example.com" />
      <FakeField label="Password" value="••••••••" />
      <div className="mt-1 flex h-9 items-center justify-center rounded-sm bg-ink text-xs font-semibold text-ground">
        Create account
      </div>
    </div>
  );
}

function DepositPreview() {
  return (
    <div className="flex flex-col gap-2 pt-5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-dim">Available</span>
        <span className="tabular text-ink">$2,500.00</span>
      </div>
      <FakeField label="Amount" value="1,000.00 USDC" />
      <div className="mt-1 flex h-9 items-center justify-center rounded-sm bg-accent text-xs font-semibold text-[#062018]">
        Deposit $1,000.00
      </div>
    </div>
  );
}

const PREVIEW_LEVERAGE = ["1x", "5x", "10x", "20x", "50x"];

function OrderPreview() {
  return (
    <div className="flex flex-col gap-2 pt-5">
      <div className="grid grid-cols-2 gap-1 rounded-sm bg-panel-raised p-1 text-xs font-medium">
        <span className="rounded-[3px] bg-accent-soft py-1.5 text-center text-up">
          Buy / Long
        </span>
        <span className="py-1.5 text-center text-ink-muted">Sell / Short</span>
      </div>
      <div className="grid grid-cols-5 gap-1 text-xs">
        {PREVIEW_LEVERAGE.map((leverage) => (
          <span
            key={leverage}
            className={cn(
              "tabular rounded-sm py-1.5 text-center",
              leverage === "10x"
                ? "bg-accent-soft text-up"
                : "bg-panel-raised text-ink-muted",
            )}
          >
            {leverage}
          </span>
        ))}
      </div>
      <div className="mt-1 flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-dim">Margin required</span>
          <span className="tabular text-ink">$100.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-dim">Est. liquidation price</span>
          <span className="tabular text-ink">73,120.4</span>
        </div>
      </div>
    </div>
  );
}
