"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Check, CreditCard, Upload, Clock3, ImagePlus, X } from "lucide-react";
import { Button, Price } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import type { SalesChannel } from "@ufo/types";
import type { BankAccount } from "@/lib/payment-settings";
import { CopyValue } from "@/components/copy-value";
import { PaymentBankAccounts } from "@/components/payment-bank-accounts";
import { authHeaders } from "@/lib/customer-client";

export function ManualPayment({
  order,
  channel,
  onUpdate,
}: {
  order: SubmittedOrder;
  channel: SalesChannel;
  onUpdate: (order: SubmittedOrder) => void;
}) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadId = useId();
  useEffect(() => {
    fetch("/api/payment-accounts", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const p = await r.json();
        setAccounts(p.accounts ?? []);
        setLoaded(true);
      })
      .catch(() => setMessage("دریافت اطلاعات حساب انجام نشد؛ صفحه را تازه کنید."));
  }, []);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("note", note);
      if (file) form.set("image", file);
      const response = await fetch(`/api/orders/${order.id}/receipt`, {
        method: "POST",
        headers: authHeaders(channel),
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ارسال رسید انجام نشد.");
      onUpdate(payload.order);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setNote("");
      setMessage("رسید ثبت شد. پس از بررسی ادمین نتیجه اعلام می‌شود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ارتباط برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }
  const awaiting = order.status === "awaiting_receipt";
  const demo = loaded && !accounts.length;
  const displayAccounts = demo
    ? [1, 2, 3].map((n) => ({
        id: String(n),
        bankName: `بانک نمونه ${n}`,
        holderName: "امیرحسین محمودی",
        cardNumber: `000000000000000${n}`,
        iban: `IR00000000000000000000000${n}`,
        enabled: false,
      }))
    : accounts;
  return (
    <section className="grid min-w-0 gap-5 rounded-3xl border border-cyan-400/20 bg-[#101923] p-4 text-white sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black">
          <CreditCard className="text-cyan-300" /> پرداخت کارت به کارت
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          ۱. واریز مبلغ دقیق به یکی از حساب‌ها · ۲. ارسال تصویر یا متن رسید · ۳. تأیید فروشگاه
        </p>
      </div>
      {awaiting && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cyan-300/10 p-4">
            <div>
              <p className="text-xs text-slate-300">مبلغ قابل واریز</p>
              <Price
                valueRial={order.totalRial}
                className="mt-1 block text-2xl font-black text-cyan-200"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyValue value={String(order.totalRial / 10)} label="مبلغ تومان" />
              <CopyValue value={String(order.totalRial)} label="مبلغ ریال" />
            </div>
          </div>
          {demo && (
            <p
              role="status"
              className="rounded-xl border border-amber-400/30 bg-amber-300/10 p-3 text-sm leading-7 text-amber-200"
            >
              حساب‌ها آزمایشی و غیرقابل واریز هستند. اطلاعات حساب واقعی هنوز توسط فروشگاه تنظیم نشده
              است.
            </p>
          )}
          <PaymentBankAccounts accounts={displayAccounts} />
          {order.rejectionReason && (
            <p className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">
              رسید قبلی تأیید نشد: {order.rejectionReason}. لطفاً رسید صحیح را ارسال کنید.
            </p>
          )}
          <div className="grid gap-3 border-t border-white/10 pt-4">
            <h3 className="font-bold">ارسال رسید پرداخت</h3>
            <p className="text-xs leading-6 text-slate-300">
              تصویر رسید یا متن شامل مبلغ، زمان و شماره پیگیری را بفرستید. ثبت رسید به معنی تأیید
              واریز نیست؛ ادمین واریز را بررسی می‌کند.
            </p>
            <div className="min-w-0">
              <p id={`${uploadId}-label`} className="mb-2 text-sm">
                تصویر رسید
              </p>
              <label
                className={`relative flex min-h-28 min-w-0 items-center gap-3 rounded-2xl border border-dashed p-4 transition focus-within:ring-2 focus-within:ring-cyan-300 ${busy || !accounts.length ? "cursor-not-allowed border-white/10 opacity-40" : "cursor-pointer border-cyan-300/30 bg-cyan-300/[.035] hover:border-cyan-300/60 hover:bg-cyan-300/[.07]"}`}
              >
                <input
                  ref={fileInput}
                  type="file"
                  aria-labelledby={`${uploadId}-label`}
                  aria-describedby={`${uploadId}-hint`}
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || !accounts.length}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (
                      selected &&
                      (selected.size > 5 * 1024 * 1024 ||
                        !["image/jpeg", "image/png", "image/webp"].includes(selected.type))
                    ) {
                      setMessage("تصویر معتبر با حجم حداکثر ۵ مگابایت انتخاب کنید.");
                      e.target.value = "";
                      setFile(null);
                      return;
                    }
                    setFile(selected ?? null);
                    setMessage("");
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"
                >
                  <ImagePlus size={22} />
                </span>
                <span className="grid min-w-0 gap-1.5">
                  <span className="text-sm font-bold text-cyan-100">
                    {file ? "تغییر تصویر رسید" : "انتخاب تصویر رسید"}
                  </span>
                  <span className="break-all text-xs leading-6 text-slate-300" aria-live="polite">
                    {file ? file.name : "از گالری یا فایل‌های دستگاه انتخاب کنید"}
                  </span>
                  {file && (
                    <span className="text-[11px] text-slate-400">
                      {Math.max(1, Math.round(file.size / 1024)).toLocaleString("fa-IR")} کیلوبایت ·
                      آماده ارسال
                    </span>
                  )}
                </span>
              </label>
              <p id={`${uploadId}-hint`} className="mt-2 text-[11px] leading-6 text-slate-400">
                فرمت JPG، PNG یا WebP · حداکثر ۵ مگابایت
              </p>
            </div>
            {preview && (
              <div>
                <Image
                  src={preview}
                  alt="پیش‌نمایش رسید انتخاب‌شده"
                  width={480}
                  height={256}
                  unoptimized
                  className="h-auto max-h-64 w-auto max-w-full rounded-xl object-contain"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-rose-200 hover:bg-rose-300/10 disabled:opacity-40"
                >
                  <X size={15} /> حذف تصویر انتخاب‌شده
                </button>
              </div>
            )}
            <label className="grid gap-2 text-sm">
              متن رسید یا شماره پیگیری
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                rows={4}
                disabled={busy || !accounts.length}
                className="min-w-0 w-full rounded-xl border border-white/15 bg-black/20 p-3 text-white"
              />
            </label>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={busy || !accounts.length || (!note.trim() && !file)}
              className="min-h-12"
            >
              <Upload size={18} />
              {busy ? "در حال ارسال رسید..." : "ارسال رسید برای بررسی"}
            </Button>
          </div>
        </>
      )}
      {order.status === "payment_under_review" && (
        <div className="flex gap-3 rounded-2xl bg-amber-400/10 p-4 text-amber-100">
          <Clock3 className="shrink-0" />
          <p className="text-sm leading-7">
            رسید شما دریافت شد و در انتظار بررسی ادمین است. به محض تأیید، نتیجه و زمان تقریبی ارسال
            پیامک می‌شود. نیازی به پرداخت دوباره نیست.
          </p>
        </div>
      )}
      {order.paymentStatus === "approved" && (
        <div className="rounded-2xl bg-emerald-400/10 p-4 text-emerald-200">
          <p className="flex items-center gap-2 font-bold">
            <Check size={20} /> پرداخت تأیید شد
          </p>
          <p className="mt-3 text-sm leading-7">
            {order.shippingScope === "pickup" || order.shippingMethod === "pickup"
              ? "زمان تقریبی آماده‌شدن برای دریافت حضوری:"
              : "زمان تقریبی ارسال:"}{" "}
            {order.estimatedDispatchAt
              ? new Date(order.estimatedDispatchAt).toLocaleString("fa-IR", {
                  timeZone: "Asia/Tehran",
                })
              : "در انتظار تعیین فروشگاه"}
          </p>
        </div>
      )}
      {!!order.receipts?.length && (
        <p className="text-xs text-slate-300">
          آخرین رسید ثبت‌شده: {new Date(order.receipts.at(-1)!.submittedAt).toLocaleString("fa-IR")}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm leading-7">
          {message}
        </p>
      )}
    </section>
  );
}
