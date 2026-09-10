"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Price } from "@ufo/ui";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  ReceiptText,
  ShieldCheck,
  Truck,
  MessageSquare,
  RefreshCw,
  Clock3,
} from "lucide-react";
import { JalaliDateTimePicker } from "@/components/admin/jalali-date-time-picker";
import { tehranDateTimeToIso } from "@/lib/jalali-calendar";
import type { SubmittedOrder } from "@ufo/orders";
export function AdminPaymentReview({ initialOrder }: { initialOrder: SubmittedOrder }) {
  const [order, setOrder] = useState(initialOrder),
    [date, setDate] = useState(""),
    [reason, setReason] = useState(""),
    [checked, setChecked] = useState(false),
    [sendSms, setSendSms] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function act(action: "approve" | "reject" | "retry_sms") {
    setBusy(true);
    setMessage("");
    try {
      const estimatedDispatchAt =
        action === "approve" && date ? tehranDateTimeToIso(date) : undefined;
      const response = await fetch(`/api/admin/orders/${order.id}/receipt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, estimatedDispatchAt, sendSms }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setOrder(payload.order);
      setMessage(
        action === "approve"
          ? "پرداخت تأیید و زمان ارسال ذخیره شد."
          : action === "reject"
            ? "رسید رد شد؛ مشتری می‌تواند رسید جدید بفرستد."
            : "وضعیت پیامک به‌روز شد.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "عملیات انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm [color-scheme:light]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <ShieldCheck size={21} />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">بررسی واریز و رسید</h2>
            <p className="mt-1 text-xs text-slate-500">
              تطبیق واریز، تأیید پرداخت و برنامه‌ریزی ارسال
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${order.paymentStatus === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {order.paymentStatus === "approved"
            ? "پرداخت تأیید شده"
            : order.status === "payment_under_review"
              ? "نیازمند بررسی"
              : "در انتظار رسید"}
        </span>
      </div>
      <div className="grid items-start gap-5 p-4 sm:p-5 2xl:grid-cols-2">
        <div className="grid min-w-0 gap-3">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-4">
            <span className="text-xs text-slate-500">مبلغ قابل تطبیق</span>
            <Price
              valueRial={order.totalRial}
              className="text-base font-extrabold text-slate-900"
            />
          </div>
          {!order.receipts?.length && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <ReceiptText className="mx-auto mb-3 text-slate-300" size={30} />
              <p className="text-sm text-slate-500">هنوز رسیدی ارسال نشده است.</p>
            </div>
          )}
          {order.receipts?.map((r, i) => (
            <article key={r.id} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ReceiptText size={15} /> رسید {(i + 1).toLocaleString("fa-IR")}
                </span>
                <time className="text-[11px] text-slate-400">
                  {new Date(r.submittedAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}
                </time>
              </div>
              <div className="grid gap-3 p-4">
                {r.note && (
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {r.note}
                  </p>
                )}
                {r.imageKey && (
                  <a
                    href={`/api/admin/orders/${order.id}/receipt?id=${r.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group"
                  >
                    <Image
                      unoptimized
                      width={600}
                      height={800}
                      src={`/api/admin/orders/${order.id}/receipt?id=${r.id}`}
                      alt={`تصویر رسید ${i + 1}`}
                      className="max-h-72 w-full rounded-lg bg-slate-50 object-contain"
                    />
                    <span className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-cyan-700">
                      <ExternalLink size={14} /> مشاهده تصویر کامل
                    </span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {order.status === "payment_under_review" && !!order.receipts?.length && (
          <fieldset
            disabled={busy}
            className="grid min-w-0 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                <Truck size={17} className="text-cyan-700" /> برنامه ارسال سفارش
              </h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                تاریخ شمسی و ساعت ارسال را انتخاب کنید؛ این زمان پس از تأیید به مشتری اعلام می‌شود.
              </p>
            </div>
            <JalaliDateTimePicker value={date} onChange={setDate} disabled={busy} />
            {(order.shippingScope === "pickup" || order.shippingMethod === "pickup") && (
              <p className="text-xs leading-6 text-cyan-800">
                برای این سفارش، تاریخ انتخاب‌شده زمان آماده‌شدن برای دریافت حضوری است.
              </p>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-7 text-slate-600">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1.5 h-4 w-4 shrink-0 accent-cyan-700"
              />
              واریز مبلغ را در حساب بانکی بررسی کرده‌ام و شماره پیگیری تکراری نیست.
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-7 text-slate-600">
              <input
                type="checkbox"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="mt-1.5 h-4 w-4 shrink-0 accent-cyan-700"
              />
              پیامک تأیید پرداخت و زمان تقریبی{" "}
              {order.shippingScope === "pickup" || order.shippingMethod === "pickup"
                ? "دریافت حضوری"
                : "ارسال"}{" "}
              برای مشتری ارسال شود.
            </label>
            <Button
              type="button"
              disabled={busy || !checked || !date}
              onClick={() => void act("approve")}
              className="min-h-12 w-full rounded-xl !border-cyan-700 !bg-cyan-700 !text-white hover:!bg-cyan-800 disabled:!bg-slate-200 disabled:!border-slate-200 disabled:!text-slate-400"
            >
              <CheckCircle2 size={18} />
              {busy ? "در حال ثبت..." : "تأیید پرداخت و اعلام زمان ارسال"}
            </Button>
            <details className="group border-t border-slate-200 pt-3">
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between text-xs font-bold text-rose-700">
                رسید نیاز به اصلاح دارد؟
                <ChevronDown size={15} className="transition group-open:rotate-180" />
              </summary>
              <div className="mt-3 grid gap-3">
                <label className="grid gap-2 text-xs text-slate-600">
                  دلیل رد رسید
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="دلیل را برای مشتری بنویسید..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-400"
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || !reason.trim()}
                  onClick={() => void act("reject")}
                  className="w-full rounded-xl !border-rose-200 !bg-rose-50 !text-rose-700"
                >
                  رد رسید و درخواست اصلاح
                </Button>
              </div>
            </details>
          </fieldset>
        )}
        {order.estimatedDispatchAt && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
            <CheckCircle2 size={24} className="mb-3 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-800">پرداخت تأیید شد</p>
            <p className="mt-2 text-xs leading-7 text-emerald-700">
              {order.shippingScope === "pickup" || order.shippingMethod === "pickup"
                ? "زمان تقریبی آماده‌شدن برای دریافت حضوری:"
                : "زمان تقریبی ارسال:"}{" "}
              {new Date(order.estimatedDispatchAt).toLocaleString("fa-IR", {
                timeZone: "Asia/Tehran",
              })}
            </p>
          </div>
        )}
      </div>
      {!!order.notifications?.length && (
        <div className="grid gap-3 border-t border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <MessageSquare size={15} /> اطلاع‌رسانی به مشتری
            </h3>
            {order.notifications.some((n) => n.status === "failed" || n.status === "pending") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void act("retry_sms")}
                className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-cyan-700 disabled:opacity-40"
              >
                <RefreshCw size={13} /> ارسال پیامک‌های در انتظار / ناموفق
              </button>
            )}
          </div>
          <div className="grid gap-2">
            {order.notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-2 text-[11px] leading-6 text-slate-500"
              >
                <Clock3 size={13} className="mt-1.5 shrink-0" />
                <p>
                  <span className="font-bold text-slate-600">
                    {n.kind === "receipt" ? "دریافت رسید" : "تأیید پرداخت"}:{" "}
                  </span>
                  {
                    {
                      pending: "منتظر ارسال",
                      sending: "در حال ارسال؛ در صورت توقف، وضعیت را در پنل پیامک بررسی کنید",
                      sent: "پذیرفته‌شده توسط سرویس پیامک",
                      failed: "ارسال ناموفق؛ تنظیمات و اعتبار پیامک بررسی شود",
                      mock: "آزمایشی؛ پیامک واقعی ارسال نشده",
                    }[n.status]
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {message && (
        <p
          role="status"
          className="mx-5 mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 text-slate-700"
        >
          {message}
        </p>
      )}
    </section>
  );
}
