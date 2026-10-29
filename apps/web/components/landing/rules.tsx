import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export const DASHED_RULE = "border-dashed border-white/[0.1]";

export function CrossMark({ className }: { className: string }) {
  return (
    <Plus
      aria-hidden
      strokeWidth={1.25}
      className={cn("absolute z-10 size-4 text-white/40", className)}
    />
  );
}

export function ScreenRule({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 z-10 w-screen -translate-x-1/2 border-t",
        DASHED_RULE,
        className,
      )}
    />
  );
}

export function BoxCorners() {
  return (
    <>
      <CrossMark className="left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
      <CrossMark className="right-0 top-0 translate-x-1/2 -translate-y-1/2" />
      <CrossMark className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <CrossMark className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
    </>
  );
}
