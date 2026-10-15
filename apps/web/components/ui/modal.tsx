"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, meta, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-md bg-panel p-5 shadow-float"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>

        <header className="px-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {meta && <div className="mt-2 text-xs text-ink-muted">{meta}</div>}
        </header>

        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}
