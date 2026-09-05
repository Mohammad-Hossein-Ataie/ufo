"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, Pencil, RotateCw } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";
import type { Customer, SalesChannel } from "@ufo/types";
import { normalizeIranPhone, toEnglishDigits } from "@ufo/validation";
import { clearGuestCart, readGuestCart, saveCustomerSession } from "@/lib/customer-client";
import { customerLoginDestination, needsProfileCompletion } from "@/lib/customer-onboarding";

export function CustomerOtpLogin({ channel }: { channel: SalesChannel }) {
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
      window.location.assign(customerLoginDestination(searchParams.get("next"), channel));
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
      className={`mt-6 grid min-w-0 gap-4 rounded-md border p-5 ${wholesale ? "border-[#D5D9C9] bg-white" : "border-[#22303D] bg-[#0D1117]"}`}
      aria-busy={busy}
    >
      <h2 className="text-lg font-semibold">
        {step === "phone"
          ? "ورود یا ثبت‌نام"
          : step === "code"
            ? "تأیید شماره موبایل"
            : "تکمیل حساب کاربری"}
      </h2>
      {error ? (
        <Alert title="خطا" tone="danger">
          {error}
        </Alert>
      ) : null}
      {step === "phone" ? (
        <label className="grid gap-2">
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
          <label className="grid gap-2">
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
          <label className="grid gap-2">
            نام
            <Input
              autoFocus
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={100}
              disabled={busy}
            />
          </label>
          <label className="grid gap-2">
            نام خانوادگی
            <Input
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={100}
              disabled={busy}
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
          wholesale ? "!border-[#1F8A5B] !bg-[#1F8A5B] !text-white hover:!bg-[#176D48]" : ""
        }
      >
        <LogIn size={18} />
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
    </form>
  );
}
