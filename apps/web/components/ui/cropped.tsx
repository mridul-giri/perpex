import { cn } from "@/lib/cn";

type CroppedVariant = "primary" | "subtle" | "outline" | "danger";
type CroppedSize = "sm" | "md";

const VARIANTS: Record<CroppedVariant, string> = {
  primary: "bg-accent text-[#062018] hover:brightness-110 active:brightness-95",
  subtle: "bg-panel-raised text-ink-muted hover:text-ink hover:bg-white/[0.08]",
  outline: "bg-panel-raised text-ink-muted hover:text-ink",
  danger:
    "bg-[rgb(253_75_78_/_0.16)] text-down hover:bg-[rgb(253_75_78_/_0.26)]",
};

const SIZES: Record<CroppedSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
};

export interface CroppedButtonProps extends React.ComponentProps<"button"> {
  variant?: CroppedVariant;
  size?: CroppedSize;
}

export function CroppedButton({
  variant = "subtle",
  size = "md",
  className,
  type = "button",
  ...props
}: CroppedButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
