"use client";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = {
  sm: {
    container: "gap-0.5 rounded-md p-0.5",
    button: "h-7 rounded-md px-3 text-xs font-medium",
  },
  md: {
    container: "gap-1 rounded-md p-1",
    button: "h-8 rounded-md px-3.5 text-sm font-medium",
  },
} as const;

export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  size = "sm",
  className,
}: TabsProps<T>) {
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
          </button>
        );
      })}
    </div>
  );
}
