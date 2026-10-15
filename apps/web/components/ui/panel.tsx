import { cn } from "@/lib/cn";

export interface PanelProps extends React.ComponentProps<"section"> {
  flush?: boolean;
}

export function Panel({ flush, className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-hairline bg-panel",
        !flush && "p-4",
        className,
      )}
      {...props}
    />
  );
}
