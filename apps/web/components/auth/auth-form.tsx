import { cn } from "@/lib/cn";

export interface AuthFieldProps extends React.ComponentProps<"input"> {
  label: string;
  hint?: string;
}

export function AuthField({
  label,
  hint,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <input
        className={cn(
          "h-11 w-full rounded-[3px] border border-white/[0.1] bg-white/[0.02] px-3 text-sm text-ink transition-colors placeholder:text-ink-dim hover:border-white/[0.18] focus:border-white/[0.35] focus:outline-none disabled:cursor-not-allowed disabled:opacity-45",
          className,
        )}
        {...props}
      />
      {hint && <span className="text-xs text-ink-dim">{hint}</span>}
    </label>
  );
}

type AuthButtonVariant = "primary" | "secondary";

const AUTH_BUTTON_VARIANTS: Record<AuthButtonVariant, string> = {
  primary: "bg-ink text-ground hover:bg-white active:bg-ink-muted",
  secondary:
    "border border-dashed border-white/[0.18] text-ink-muted hover:border-white/[0.3] hover:text-ink",
};

export interface AuthButtonProps extends React.ComponentProps<"button"> {
  variant?: AuthButtonVariant;
}

export function AuthButton({
  variant = "primary",
  type = "button",
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[3px] text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45",
        AUTH_BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
