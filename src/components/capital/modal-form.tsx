"use client";

import { useEffect, type ReactNode } from "react";

type ModalFormProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function ModalForm({ open, onClose, title, children }: ModalFormProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="capital-modal" role="dialog" aria-modal="true">
      <div className="capital-modal-backdrop" onClick={onClose} />
      <div className="capital-modal-panel">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
