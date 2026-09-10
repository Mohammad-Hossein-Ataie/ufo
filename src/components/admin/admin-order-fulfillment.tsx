"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackageCheck, Store, Truck } from "lucide-react";
import type { SubmittedOrder } from "@ufo/orders";
import type { OrderStatus } from "@ufo/types";

export function AdminOrderFulfillment({ initialOrder }: { initialOrder: SubmittedOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const pickup = order.shippingScope === "pickup" || order.shippingMethod === "pickup";
  const ready = pickup ? order.status === "ready_for_pickup" : order.status === "shipped";
  const next: { status: OrderStatus; label: string } | undefined =
    order.status === "confirmed"
      ? { status: "processing", label: "شروع آماده‌سازی سفارش" }
      : order.status === "processing" || (!pickup && order.status === "ready_for_pickup")
        ? {
            status: pickup ? "ready_for_pickup" : "shipped",
            label: pickup ? "سفارش آماده دریافت از مغازه است" : "ثبت ارسال سفارش",
          }
        : undefined;
  async function update(status: OrderStatus) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, deliveryConfirmed: status === "delivered" && confirmed }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ثبت وضعیت انجام نشد.");
      setOrder(payload.order);
      setConfirmed(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارتباط برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
        {pickup ? (
          <Store size={20} className="text-cyan-700" />
        ) : (
          <Truck size={20} className="text-cyan-700" />
        )}
        {pickup ? "تحویل حضوری از مغازه" : "ارسال و تحویل به مشتری"}
      </h2>
      <p className="mt-2 text-xs leading-7 text-slate-500">
        {pickup
          ? `محل دریافت: ${order.shippingAddress.line1}`
          : "ارسال بسته و تحویل نهایی به مشتری را در این بخش ثبت کنید."}
      </p>
      {order.status === "delivered" ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 size={22} />
          <div>
            <p className="text-sm font-bold">سفارش به مشتری تحویل داده شد</p>
            <p className="mt-2 text-xs">
              {order.deliveredAt
                ? new Date(order.deliveredAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })
                : "ثبت‌شده در تاریخچه سفارش"}
            </p>
          </div>
        </div>
      ) : order.paymentStatus !== "approved" ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          پس از تأیید پرداخت، مراحل آماده‌سازی و تحویل فعال می‌شود.
        </p>
      ) : (
        <>
          {next && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void update(next.status)}
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-bold text-white disabled:opacity-40"
            >
              <PackageCheck size={18} />
              {busy ? "در حال ثبت..." : next.label}
            </button>
          )}
          {ready && (
            <div className="mt-4 grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-7 text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1.5 h-4 w-4 shrink-0 accent-emerald-700"
                />
                {pickup
                  ? "سفارش در مغازه به مشتری تحویل داده شد."
                  : "تحویل بسته به دست مشتری تأیید شده است."}
              </label>
              <p className="text-xs leading-6 text-slate-500">
                با ثبت نهایی، سفارش تکمیل می‌شود و زمان تحویل در حساب مشتری نمایش داده می‌شود.
              </p>
              <button
                type="button"
                disabled={busy || !confirmed}
                onClick={() => void update("delivered")}
                className="min-h-12 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
              >
                {busy ? "در حال ثبت..." : "ثبت نهایی تحویل به مشتری"}
              </button>
            </div>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}
    </section>
  );
}
