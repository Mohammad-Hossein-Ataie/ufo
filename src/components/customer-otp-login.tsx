"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, LoaderCircle, LogIn, Pencil, RotateCw, Smartphone } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";
import type { Customer, SalesChannel } from "@ufo/types";
import { normalizeIranPhone, toEnglishDigits } from "@ufo/validation";
import { clearGuestCart, readGuestCart, saveCustomerSession } from "@/lib/customer-client";
import { customerLoginDestination, needsProfileCompletion } from "@/lib/customer-onboarding";

export function CustomerOtpLogin({
  channel,
  nextPath,
  onComplete,
}: {
  channel: SalesChannel;
  nextPath?: string;
  onComplete?: () => void;
}) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"phone" | "code" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const wholesale = channel === "wholesale";

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  function persist(customer: Customer, sessionToken: string) {
    const name = `${customer.firstName} ${customer.lastName}`.trim();
    saveCustomerSession({
      channel,
      token: sessionToken,
      customer,
      fullName: name,
      managerName: name,
      businessName: customer.companyName ?? "",
      phone: customer.mobileNumber,
      loggedInAt: new Date().toISOString(),
    });
  }

  async function perform(action: "send" | "verify" | "profile") {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const normalizedPhone = normalizeIranPhone(phone);
      const path =
        action === "profile"
          ? "/api/customer/profile"
          : `/api/auth/${action === "send" ? "send" : "verify"}-otp`;
      const body =
        action === "send"
          ? { phone: normalizedPhone, customerType: channel }
          : action === "verify"
            ? { challengeId, code, customerType: channel, guestCart: readGuestCart(channel) }
            : {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                ...(wholesale ? { companyName: companyName.trim() } : {}),
              };
      const response = await fetch(path, {
        method: action === "profile" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(action === "profile" ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        challengeId?: string;
        code?: string;
        customer?: Customer;
        token?: string;
      };
      if (!response.ok) {
        if (response.status === 429 && action === "send") {
          const delay = Number(response.headers.get("Retry-After"));
          setResendAt(Date.now() + (Number.isFinite(delay) && delay > 0 ? delay : 60) * 1000);
        }
        throw new Error(payload.error ?? "درخواست انجام نشد. دوباره تلاش کنید.");
      }
      if (action === "send") {
        if (!payload.challengeId) throw new Error("ارسال کد انجام نشد.");
        setPhone(normalizedPhone);
        setChallengeId(payload.challengeId);
        setCode("");
        setMockCode(payload.code ?? "");
        setResendAt(Date.now() + 60000);
        setStep("code");
        return;
      }
      const sessionToken = action === "verify" ? payload.token : token;
      if (!payload.customer || !sessionToken) throw new Error("پاسخ ورود معتبر نیست.");
      persist(payload.customer, sessionToken);
      if (action === "verify") {
        clearGuestCart(channel);
        setToken(sessionToken);
      }
      if (needsProfileCompletion(payload.customer)) {
        setFirstName(payload.customer.firstName);
        setLastName(payload.customer.lastName);
        setCompanyName(payload.customer.companyName ?? "");
        setStep("profile");
        return;
      }
      onComplete?.();
      window.location.assign(
        customerLoginDestination(nextPath ?? searchParams.get("next"), channel),
      );
    } catch (err) {
      setError(
        err instanceof Error && err.name !== "TypeError" && err.name !== "TimeoutError"
          ? err.message
          : "ارتباط برقرار نشد. دوباره تلاش کنید.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void perform(step === "phone" ? "send" : step === "code" ? "verify" : "profile");
  }

  return (
    <form
      onSubmit={submit}
      className={`grid min-w-0 gap-5 border p-5 sm:p-7 ${wholesale ? "mt-6 rounded-md border-[#D5D9C9] bg-white" : "rounded-[24px] border-white/10 bg-white/[0.055] shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl"}`}
      aria-busy={busy}
    >
      <div className="flex items-center gap-3">
        {!wholesale ? (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${step === "code" ? "otp-icon-pulse bg-retail-accent/15 text-retail-accent" : step === "profile" ? "bg-retail-accent-2/15 text-retail-accent-2" : "bg-white/8 text-white"}`}
          >
            {step === "profile" ? <Check size={21} /> : <Smartphone size={21} />}
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-black">
            {step === "phone"
              ? "ورود یا ثبت‌نام"
              : step === "code"
                ? "کد تأیید را وارد کنید"
                : "فقط یک قدم دیگر"}
          </h2>
          {!wholesale ? (
            <p className="mt-1 text-xs leading-5 text-retail-secondary">
              {step === "phone"
                ? "بدون رمز عبور، با شماره موبایل"
                : step === "code"
                  ? "کد ۶ رقمی برای شما پیامک شد"
                  : "اطلاعات لازم برای ارسال سفارش"}
            </p>
          ) : null}
        </div>
      </div>
      {error ? (
        <Alert title="خطا" tone="danger">
          {error}
        </Alert>
      ) : null}
      {step === "phone" ? (
        <label className="grid gap-2 text-sm font-bold">
          شماره موبایل
          <Input
            autoFocus
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="09xxxxxxxxx"
            required
            disabled={busy}
            className={
              !wholesale
                ? "min-h-14 rounded-xl !border-white/10 !bg-[#090d13] px-4 text-center text-lg font-bold tracking-wider !text-white caret-retail-accent !shadow-none placeholder:!text-retail-muted focus:!border-retail-accent focus:!ring-retail-accent/20"
                : ""
            }
          />
        </label>
      ) : step === "code" ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span dir="ltr">{phone}</span>
            <button
              type="button"
              title="تغییر شماره موبایل"
              aria-label="تغییر شماره موبایل"
              className="flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                setStep("phone");
                setChallengeId("");
                setCode("");
                setError("");
              }}
            >
              <Pencil size={18} />
            </button>
          </div>
          <label className="grid gap-2 text-sm font-bold">
            کد پیامکی
            <Input
              key={challengeId}
              autoFocus
              value={code}
              onChange={(e) =>
                setCode(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              dir="ltr"
              required
              disabled={busy}
              className={
                !wholesale
                  ? "min-h-14 rounded-xl !border-retail-accent/25 !bg-[#07141a] px-4 text-center text-xl font-black tracking-[0.4em] !text-white caret-retail-accent !shadow-none focus:!border-retail-accent focus:!ring-retail-accent/20"
                  : ""
              }
            />
          </label>
          {mockCode ? <span className="text-xs">کد تست: {mockCode}</span> : null}
          <button
            type="button"
            className="flex min-h-10 items-center justify-center gap-2 text-sm disabled:opacity-50"
            disabled={busy || remaining > 0}
            onClick={() => void perform("send")}
          >
            <RotateCw size={16} />
            {remaining > 0 ? `ارسال مجدد (${remaining} ثانیه)` : "ارسال مجدد کد"}
          </button>
        </>
      ) : (
        <>
          <label className="grid gap-2 text-sm font-bold">
            نام
            <Input
              autoFocus
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={100}
              disabled={busy}
              className={
                !wholesale
                  ? "min-h-[52px] rounded-xl !border-white/10 !bg-[#090d13] !text-white caret-retail-accent !shadow-none focus:!border-retail-accent focus:!ring-retail-accent/20"
                  : ""
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            نام خانوادگی
            <Input
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={100}
              disabled={busy}
              className={
                !wholesale
                  ? "min-h-[52px] rounded-xl !border-white/10 !bg-[#090d13] !text-white caret-retail-accent !shadow-none focus:!border-retail-accent focus:!ring-retail-accent/20"
                  : ""
              }
            />
          </label>
          {wholesale ? (
            <label className="grid gap-2">
              نام فروشگاه یا شرکت
              <Input
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                maxLength={100}
                disabled={busy}
              />
            </label>
          ) : null}
        </>
      )}
      <Button
        type="submit"
        disabled={
          busy || (step === "phone" && remaining > 0) || (step === "code" && code.length !== 6)
        }
        className={
          wholesale
            ? "!border-[#1F8A5B] !bg-[#1F8A5B] !text-white hover:!bg-[#176D48]"
            : "min-h-14 rounded-xl text-base font-black shadow-[0_14px_38px_rgba(0,217,255,.2)]"
        }
      >
        {busy ? (
          <LoaderCircle className="animate-spin" size={19} />
        ) : step === "profile" ? (
          <Check size={19} />
        ) : (
          <LogIn size={19} />
        )}
        {busy
          ? "در حال بررسی..."
          : step === "phone"
            ? remaining > 0
              ? `دریافت کد (${remaining} ثانیه)`
              : "دریافت کد ورود"
            : step === "code"
              ? "تأیید و ورود"
              : "ثبت اطلاعات و ادامه"}
      </Button>
      {!wholesale ? (
        <p className="text-center text-xs leading-6 text-retail-muted">
          با ادامه، قوانین و حریم خصوصی یوفوپاف را می‌پذیرید.
        </p>
      ) : null}
    </form>
  );
}
