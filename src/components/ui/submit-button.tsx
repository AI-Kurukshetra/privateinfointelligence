"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  /** Shown when form is submitting (default: same as children if short, else "Saving...") */
  loadingText?: string;
  className?: string;
  /** Match ui-btn variants: primary (default) or secondary */
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function SubmitButton({
  children,
  loadingText,
  className = "",
  variant = "primary",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  const btnClass =
    variant === "secondary"
      ? "ui-btn ui-btn-secondary"
      : "ui-btn ui-btn-primary";

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`${btnClass} inline-flex min-w-[6rem] items-center justify-center gap-2 ${className}`}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{loadingText ?? "Saving…"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
