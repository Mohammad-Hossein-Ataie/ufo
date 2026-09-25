"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Check, type LucideProps } from "lucide-react";

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Clipboard copy failed");
  }
}

export function FooterCopyContact({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: ComponentType<LucideProps>;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!copied && !error) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
      setError(false);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [copied, error]);

  return (
    <button
      type="button"
      dir="rtl"
      data-footer-contact={label}
      aria-label={`کپی ${label}: ${value}`}
      title={`کپی ${label}`}
      className="inline-flex min-h-11 w-full min-w-0 items-center justify-start gap-2 rounded-md text-start text-sm text-[#9BA7B4] transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
      onClick={async () => {
        try {
          await copyToClipboard(value);
          setCopied(true);
          setError(false);
        } catch {
          setCopied(false);
          setError(true);
        }
      }}
    >
      {copied ? (
        <Check size={17} aria-hidden="true" className="shrink-0 text-emerald-300" />
      ) : (
        <Icon size={17} aria-hidden="true" className="shrink-0" />
      )}
      <span dir="ltr" className="min-w-0 break-all text-left">
        {value}
      </span>
      <span
        role="status"
        aria-live="polite"
        className={`shrink-0 text-xs font-bold ${copied ? "text-emerald-300" : error ? "text-rose-300" : "sr-only"}`}
      >
        {copied ? "کپی شد!" : error ? "کپی نشد" : ""}
      </span>
    </button>
  );
}
