"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";
import type { Customer } from "@ufo/types";
import { clearGuestCart, readGuestCart, saveCustomerSession } from "@/lib/customer-client";

export function B2BLoginClient() {
  const searchParams = useSearchParams();
  const [businessName, setBusinessName] = useState("");
  const [managerName, setManagerName] = useState("");
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
        body: JSON.stringify({ phone: normalizedPhone, customerType: "wholesale" }),
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

    const [firstName = "", ...lastNameParts] = managerName.trim().split(/\s+/).filter(Boolean);
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId,
        code,
        customerType: "wholesale",
        fullName: managerName || businessName,
        firstName,
        lastName: lastNameParts.join(" "),
        companyName: businessName,
        businessType: "retailer",
        guestCart: readGuestCart("wholesale"),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      customer?: Customer;
      token?: string;
      error?: string;
    };
    setIsSubmitting(false);
    if (!response.ok || !payload.customer || !payload.token) {
      setError(payload.error ?? "ورود همکاری انجام نشد.");
      return;
    }

    saveCustomerSession({
      channel: "wholesale",
      token: payload.token,
      customer: payload.customer,
      businessName: payload.customer.companyName ?? businessName,
      managerName: `${payload.customer.firstName} ${payload.customer.lastName}`.trim(),
      phone: payload.customer.mobileNumber,
      loggedInAt: new Date().toISOString(),
    });
    clearGuestCart("wholesale");
    window.location.href = searchParams.get("next") || "/b2b/account";
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-md border border-[#D5D9C9] bg-white p-5"
    >
      {error ? (
        <Alert title="خطا در ورود" tone="danger">
          {error}
        </Alert>
      ) : null}
      <label className="grid gap-2">
        نام فروشگاه
        <Input
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          required
        />
      </label>
      <label className="grid gap-2">
        نام مسئول خرید
        <Input value={managerName} onChange={(event) => setManagerName(event.target.value)} />
      </label>
      <label className="grid gap-2">
        موبایل هماهنگی
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
          {mockCode ? <span className="text-xs text-[#596B61]">کد تست: {mockCode}</span> : null}
        </label>
      ) : null}
      <Button
        type="submit"
        className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
        disabled={isSubmitting}
      >
        <LogIn size={18} />
        {isSubmitting ? "در حال بررسی..." : challengeId ? "تایید و ورود" : "دریافت کد ورود"}
      </Button>
      <p className="flex items-center gap-2 text-xs leading-6 text-[#596B61]">
        <Building2 size={16} />
        بعد از ورود، سبد مهمان با حساب عمده شما ادغام می‌شود.
      </p>
    </form>
  );
}
