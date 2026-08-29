import type { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:py-8", className)}>
      {children}
    </main>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          {eyebrow ? <p className="text-sm font-bold text-cyan-700">{eyebrow}</p> : null}
          <h1 className="mt-2 text-2xl font-black leading-[1.35] text-slate-950 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  meta,
  icon,
  tone = "info",
  className,
}: {
  label: string;
  value: ReactNode;
  meta?: string;
  icon?: ReactNode;
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}) {
  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-black tabular-nums text-slate-950">{value}</div>
        </div>
        {icon ? (
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
              tone === "info" && "bg-cyan-50 text-cyan-700",
              tone === "success" && "bg-emerald-50 text-emerald-700",
              tone === "warning" && "bg-amber-50 text-amber-700",
              tone === "danger" && "bg-rose-50 text-rose-700",
              tone === "neutral" && "bg-slate-100 text-slate-600",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      {meta ? <p className="mt-3 text-xs leading-6 text-slate-500">{meta}</p> : null}
    </article>
  );
}

export function AdminPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </section>
  );
}
