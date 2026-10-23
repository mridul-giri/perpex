import { cn } from "@/lib/cn";

export function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full min-w-[620px] border-collapse">
      <thead className="sticky top-0 bg-panel">
        <tr>
          {head.map((label, index) => (
            <th
              key={`${label}-${index}`}
              className={cn(
                "h-9 px-4 text-xs font-medium text-ink-muted",
                index > 1 ? "text-right" : "text-left",
              )}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-hairline/60">{children}</tr>;
}

export function Cell({
  children,
  right,
  muted,
  tone,
}: {
  children: React.ReactNode;
  right?: boolean;
  muted?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <td
      className={cn(
        "h-10 px-4",
        right && "tabular text-right",
        muted && "text-ink-muted",
        tone === "up" && "text-up",
        tone === "down" && "text-down",
      )}
    >
      {children}
    </td>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-ink-dim">
      {text}
    </div>
  );
}
