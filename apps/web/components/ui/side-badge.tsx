import { cn } from "@/lib/cn";
import type { Side } from "@/lib/types";

export function SideBadge({ side }: { side: Side }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        side === "LONG"
          ? "bg-[rgb(0_194_120_/_0.15)] text-up"
          : "bg-[rgb(253_75_78_/_0.15)] text-down",
      )}
    >
      {side}
    </span>
  );
}
