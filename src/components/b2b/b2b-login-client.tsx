"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";

export function B2BLoginClient() {
  const searchParams = useSearchParams();
  const [businessName, setBusinessName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = phone.replace(/[\s-]/g, "");
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError("شماره همراه معتبر وارد کنید.");
      return;
    }
    window.localStorage.setItem(
      "ufo-b2b-session",
      JSON.stringify({
        channel: "wholesale",
        businessName: businessName.trim() || "همکار عمده",
        managerName: managerName.trim() || "مسئول خرید",
        phone: normalizedPhone,
        loggedInAt: new Date().toISOString(),
      }),
    );
    window.location.href = searchParams.get("next") || "/b2b/quick-order";
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-md border border-[#D5D9C9] bg-white p-5"
    >
      {error ? (
        <Alert title="شماره نامعتبر" tone="danger">
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
      <Button type="submit" className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
        <LogIn size={18} />
        ورود همکاری
      </Button>
      <p className="flex items-center gap-2 text-xs leading-6 text-[#596B61]">
        <Building2 size={16} />
        این session فقط در سایت عمده ذخیره می‌شود.
      </p>
    </form>
  );
}
