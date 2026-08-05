"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";

export function PhoneLoginClient() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
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
      "ufo-retail-session",
      JSON.stringify({
        channel: "retail",
        fullName: fullName.trim() || "مشتری تکی",
        phone: normalizedPhone,
        loggedInAt: new Date().toISOString()
      }),
    );
    window.location.href = searchParams.get("next") || "/checkout";
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 rounded-md border border-[#22303D] bg-[#0D1117] p-5">
      {error ? (
        <Alert title="شماره نامعتبر" tone="danger">
          {error}
        </Alert>
      ) : null}
      <label className="grid gap-2">
        نام
        <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="نام و نام خانوادگی" />
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
      <Button type="submit">
        <LogIn size={18} />
        ورود و ادامه خرید
      </Button>
    </form>
  );
}
