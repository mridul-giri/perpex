import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "tabular h-9 w-full rounded-md border border-hairline bg-panel-raised px-3 text-sm text-ink transition-colors placeholder:text-ink-dim focus:border-hairline-strong focus:outline-none disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}
