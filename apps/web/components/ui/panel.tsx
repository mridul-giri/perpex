import { cn } from "@/lib/cn";

export interface PanelProps extends React.ComponentProps<"section"> {
  flush?: boolean;
}

export function Panel({ flush, className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "border-b border-r border-dashed border-white/[0.1] bg-ground",
        !flush && "p-4",
        className,
      )}
      {...props}
    />
  );
}
