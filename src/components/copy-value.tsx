"use client";
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyValue({
  value,
  label,
  disabled = false,
  compact = false,
}: {
  value: string;
  label: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <span className="relative inline-flex shrink-0 flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setError("");
          } catch {
            setError("کپی خودکار ممکن نیست؛ شماره را انتخاب و کپی کنید.");
          }
        }}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-current/20 text-xs transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-30 ${compact ? "px-2 text-cyan-200" : "px-3"}`}
        aria-label={`کپی ${label}`}
        title={copied ? "کپی شد" : `کپی ${label}`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        <span className={compact ? "sr-only" : ""} aria-live="polite">
          {copied ? "کپی شد" : `کپی ${label}`}
        </span>
      </button>
      {error && (
        <span
          role="status"
          className={
            compact
              ? "absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-white/20 bg-slate-800 p-3 text-xs leading-6 text-white shadow-xl"
              : "text-xs"
          }
        >
          {error}
        </span>
      )}
    </span>
  );
}
