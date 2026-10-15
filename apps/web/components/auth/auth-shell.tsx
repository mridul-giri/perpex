import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ground p-4">
      <div className="w-full max-w-[400px] rounded-md border border-hairline bg-panel p-8">
        <Link
          href="/"
          aria-label="perpex home"
          className="mb-6 flex justify-center"
        >
          <span className="font-pixel text-3xl leading-none tracking-[0.06em] text-ink">
            PERPEX
          </span>
        </Link>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-xs text-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}
