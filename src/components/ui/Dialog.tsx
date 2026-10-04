"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/format";

/** Accessible modal built on the native <dialog>: focus trapping, Esc to close, inert background. */
export function Dialog({ open, onClose, title, children, wide, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const id = labelledBy ?? `dlg-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cx(
        "m-0 mt-auto w-full max-w-none rounded-t-sheet bg-canvas p-0 text-body shadow-float backdrop:bg-ink/40 sm:m-auto sm:rounded-sheet",
        wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        "max-h-[92dvh]",
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <h2 id={id} className="text-[1.05rem] font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-soft hover:bg-paper hover:text-ink" aria-label="Close">
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}
