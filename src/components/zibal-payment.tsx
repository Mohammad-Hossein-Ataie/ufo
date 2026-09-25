"use client";

import { useState } from "react";
import { CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button, Price } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import type { SalesChannel } from "@ufo/types";
import { authHeaders } from "@/lib/customer-client";

export function ZibalPayment({ order, channel }: { order: SubmittedOrder; channel: SalesChannel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const verified = order.gatewayPayments?.find((attempt) => attempt.state === "verified");
  const failed = order.gatewayPayments?.at(-1)?.state === "failed";

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/payments/zibal/${order.id}`, {
        method: "POST",
        headers: authHeaders(channel),
      });
      const payload = (await response.json()) as {
        paymentUrl?: string;
        paid?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "شروع پرداخت انجام نشد.");
      if (payload.paid) {
        window.location.reload();
        return;
      }
      if (!payload.paymentUrl) throw new Error("نشانی درگاه دریافت نشد.");
      window.location.assign(payload.paymentUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ارتباط با درگاه برقرار نشد.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-cyan-400/25 bg-[#101923] p-5 text-white sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <CreditCard className="text-cyan-300" /> پرداخت آنلاین با زیبال
      </h2>
      {order.paymentStatus === "approved" ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p className="flex items-center gap-2 font-bold text-emerald-200">
            <ShieldCheck size={20} /> پرداخت این سفارش تأیید شد.
          </p>
          {verified?.refNumber ? (
            <p className="mt-2 text-sm text-slate-200" dir="ltr">
              شماره پیگیری: {verified.refNumber}
            </p>
          ) : null}
        </div>
      ) : order.status === "awaiting_payment" ? (
        <>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            مبلغ قابل پرداخت <Price valueRial={order.totalRial} className="font-bold text-white" />{" "}
            است. پس از بازگشت از درگاه، وضعیت پرداخت روی سرور بررسی می‌شود.
          </p>
          {failed ? (
            <p className="mt-3 text-sm text-amber-200">
              پرداخت قبلی تکمیل نشد؛ می‌توانید دوباره تلاش کنید.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-rose-300">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            onClick={() => void pay()}
            disabled={busy}
            className="mt-5 min-h-12 w-full sm:w-auto"
          >
            {busy ? <LoaderCircle size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            {busy ? "در حال اتصال..." : "پرداخت امن با زیبال"}
          </Button>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-300">
          پرداخت آنلاین برای وضعیت فعلی این سفارش در دسترس نیست.
        </p>
      )}
    </section>
  );
}
