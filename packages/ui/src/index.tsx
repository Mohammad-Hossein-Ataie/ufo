"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { clsx, type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { X } from "lucide-react";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md border px-4 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-cyan-300 bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:outline-cyan-200",
        variant === "secondary" &&
          "border-slate-300 bg-white text-slate-950 hover:bg-slate-100 focus-visible:outline-slate-300",
        variant === "ghost" &&
          "border-transparent bg-transparent text-current hover:bg-white/10 focus-visible:outline-current",
        variant === "danger" &&
          "border-rose-400 bg-rose-500 text-white hover:bg-rose-400 focus-visible:outline-rose-300",
        size === "sm" && "min-h-10 px-3 text-sm",
        size === "md" && "text-sm",
        size === "lg" && "min-h-12 px-5 text-base",
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 select-none items-center justify-center rounded-md border border-white/15 bg-white/5 text-current transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 select-none items-center rounded-md border px-2 text-xs font-medium",
        tone === "neutral" && "border-slate-300 bg-slate-100 text-slate-700",
        tone === "success" && "border-emerald-300 bg-emerald-50 text-emerald-800",
        tone === "warning" && "border-amber-300 bg-amber-50 text-amber-800",
        tone === "danger" && "border-rose-300 bg-rose-50 text-rose-800",
        tone === "info" && "border-cyan-300 bg-cyan-50 text-cyan-800",
      )}
    >
      {children}
    </span>
  );
}

export function Price({ valueRial, className }: { valueRial: number; className?: string }) {
  const toman = Math.round(valueRial / 10);
  return (
    <span className={cn("tabular-nums", className)}>
      {new Intl.NumberFormat("fa-IR").format(toman)} تومان
    </span>
  );
}

export function Alert({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning" | "danger" | "success";
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border p-4 text-sm",
        tone === "info" && "border-cyan-200 bg-cyan-50 text-cyan-950",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-950",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-950",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
      )}
    >
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-current/80">{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-current/10", className)} />;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-current/25 p-6 text-center">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 max-w-md text-sm text-current/70">{children}</div>
    </div>
  );
}

export function ErrorState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-950">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

export function ProductCard({
  title,
  description,
  media,
  price,
  badge,
  actions,
  mediaClassName,
}: {
  title: string;
  description: string;
  media: ReactNode;
  price: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  mediaClassName?: string;
}) {
  return (
    <article className="group grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-current/10 bg-current/[0.028] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-current/20 hover:bg-current/[0.045] hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className={cn("aspect-[4/3] overflow-hidden bg-black/10", mediaClassName)}>
        {media}
      </div>
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-3 p-4 sm:p-5">
        <div className="flex min-h-14 items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-black leading-7">{title}</h3>
          {badge}
        </div>
        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-current/65">{description}</p>
        <div className="mt-auto grid gap-3 border-t border-current/10 pt-4">
          <div className="text-lg font-black">{price}</div>
          {actions}
        </div>
      </div>
    </article>
  );
}

export function StockStatus({ available }: { available: number }) {
  if (available <= 0) return <Badge tone="warning">پیش‌سفارش</Badge>;
  if (available < 10) return <Badge tone="warning">موجودی محدود</Badge>;
  return <Badge tone="success">موجود</Badge>;
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return <Badge tone={tone}>{children}</Badge>;
}

export const Dialog = {
  Root: DialogPrimitive.Root,
  Trigger: DialogPrimitive.Trigger,
  Close: DialogPrimitive.Close,
  Content({ children, title }: { children: ReactNode; title: string }) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-5 text-slate-950 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <DialogPrimitive.Title className="text-lg font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <IconButton label="بستن" className="border-slate-200 bg-slate-100 text-slate-950">
                <X size={18} />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
};

export const Tabs = {
  Root: TabsPrimitive.Root,
  List: TabsPrimitive.List,
  Trigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
    return (
      <TabsPrimitive.Trigger
        className={cn(
          "min-h-11 rounded-md px-4 text-sm font-medium data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-950",
          className,
        )}
        {...props}
      />
    );
  },
  Content: TabsPrimitive.Content,
};

export const Tooltip = {
  Provider: TooltipPrimitive.Provider,
  Root: TooltipPrimitive.Root,
  Trigger: TooltipPrimitive.Trigger,
  Content({ children }: { children: ReactNode }) {
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content className="z-50 rounded-md bg-slate-950 px-2 py-1 text-xs text-white shadow">
          {children}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  },
};
