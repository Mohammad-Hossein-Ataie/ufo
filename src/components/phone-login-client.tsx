"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";
import type { Customer } from "@ufo/types";
import { clearGuestCart, readGuestCart, saveCustomerSession } from "@/lib/customer-client";

export function PhoneLoginClient() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = phone.replace(/[\s-]/g, "");
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError("شماره همراه معتبر وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    if (!challengeId) {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, customerType: "retail" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        challengeId?: string;
        code?: string;
        error?: string;
      };
      setIsSubmitting(false);
      if (!response.ok || !payload.challengeId) {
        setError(payload.error ?? "ارسال کد ورود انجام نشد.");
        return;
      }
      setChallengeId(payload.challengeId);
      setMockCode(payload.code ?? "");
      return;
    }

    const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/).filter(Boolean);
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId,
        code,
        customerType: "retail",
        fullName,
        firstName,
        lastName: lastNameParts.join(" "),
        guestCart: readGuestCart("retail"),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      customer?: Customer;
      token?: string;
      error?: string;
    };
    setIsSubmitting(false);
    if (!response.ok || !payload.customer || !payload.token) {
      setError(payload.error ?? "ورود انجام نشد.");
      return;
    }

    saveCustomerSession({
      channel: "retail",
      token: payload.token,
      customer: payload.customer,
      fullName: `${payload.customer.firstName} ${payload.customer.lastName}`.trim(),
      phone: payload.customer.mobileNumber,
      loggedInAt: new Date().toISOString(),
    });
    clearGuestCart("retail");
    window.location.href = searchParams.get("next") || "/account";
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-md border border-[#22303D] bg-[#0D1117] p-5"
    >
      {error ? (
        <Alert title="خطا در ورود" tone="danger">
          {error}
        </Alert>
      ) : null}
      <label className="grid gap-2">
        نام
        <Input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="نام و نام خانوادگی"
        />
      </label>
      <label className="grid gap-2">
        موبایل
        <Input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          inputMode="tel"
          dir="ltr"
          placeholder="09xxxxxxxxx"
          required
        />
      </label>
      {challengeId ? (
        <label className="grid gap-2">
          کد پیامکی
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            dir="ltr"
            required
          />
          {mockCode ? <span className="text-xs text-[#9BA7B4]">کد تست: {mockCode}</span> : null}
        </label>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        <LogIn size={18} />
        {isSubmitting ? "در حال بررسی..." : challengeId ? "تایید و ورود" : "دریافت کد ورود"}
      </Button>
    </form>
  );
}
