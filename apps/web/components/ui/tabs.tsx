"use client";

import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = {
  sm: {
    container: "gap-0.5 rounded-md p-0.5",
    button: "h-7 rounded-md px-3 text-xs font-medium",
    count: "text-[11px]",
  },
  md: {
    container: "gap-1 rounded-md p-1",
    button: "h-8 rounded-md px-3.5 text-sm font-medium",
    count: "text-xs",
  },
} as const;

export function Tabs({
  items,
  value,
  onValueChange,
  size = "sm",
  className,
}: TabsProps) {
  const styles = SIZES[size];

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center border border-hairline bg-panel-raised",
        styles.container,
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 transition-colors",
              styles.button,
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "tabular",
                  styles.count,
                  active ? "text-accent" : "text-ink-dim",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
