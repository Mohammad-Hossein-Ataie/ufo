"use client";

import Link, { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "@ufo/ui";
import type { ReactNode } from "react";

function ProductNavigationContent({
  children,
  pendingLabel,
}: {
  children: ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span
        role="status"
        aria-live="polite"
        data-navigation-status="pending"
        className="inline-flex items-center justify-center gap-2"
      >
        <LoaderCircle size={17} aria-hidden="true" className="motion-safe:animate-spin" />
        <span>{pendingLabel}</span>
      </span>
    );
  }

  return <>{children}</>;
}

export function ProductNavigationLink({
  href,
  children,
  className,
  action,
  pendingLabel = "در حال باز کردن…",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  action: "details" | "select";
  pendingLabel?: string;
}) {
  return (
    <Link
      href={href}
      data-product-navigation={action}
      className={cn(
        "inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent",
        className,
      )}
    >
      <ProductNavigationContent pendingLabel={pendingLabel}>{children}</ProductNavigationContent>
    </Link>
  );
}
