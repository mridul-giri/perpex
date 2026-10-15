import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-[#062018] hover:brightness-110 active:brightness-95",
  ghost:
    "text-ink-muted bg-transparent hover:bg-panel-raised hover:text-ink active:bg-panel",
  danger:
    "text-down bg-[rgb(253_75_78_/_0.16)] hover:bg-[rgb(253_75_78_/_0.26)]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-[filter,background-color,color] duration-150 disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
