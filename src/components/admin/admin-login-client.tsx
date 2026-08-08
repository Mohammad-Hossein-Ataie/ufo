"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";

export function AdminLoginClient() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin@ufopuff.local");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setIsSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "ورود انجام نشد.");
      return;
    }
    window.location.href = searchParams.get("next") || "/admin";
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? (
        <Alert title="خطا در ورود" tone="danger">
          {error}
        </Alert>
      ) : null}
      <label className="grid gap-2 text-sm font-bold text-[#334155]">
        نام کاربری
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          dir="ltr"
          autoComplete="username"
          placeholder="admin@ufopuff.local"
          className="border-[#CBD5E1] bg-[#F8FAFC] focus:border-[#2563EB] focus:ring-[#BFDBFE]"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[#334155]">
        رمز عبور
        <span className="relative">
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="current-password"
            placeholder="••••••••"
            className="border-[#CBD5E1] bg-[#F8FAFC] pe-12 focus:border-[#2563EB] focus:ring-[#BFDBFE]"
            required
          />
          <button
            type="button"
            className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#E2E8F0] hover:text-[#0F172A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </span>
      </label>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full border-[#2563EB] bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:outline-[#2563EB]"
      >
        <LogIn size={18} aria-hidden="true" />
        {isSubmitting ? "در حال ورود..." : "ورود به پنل"}
      </Button>
      <p className="text-center text-xs leading-6 text-[#64748B]">
        اگر مسیر محافظت‌شده‌ای باز کرده باشید، بعد از ورود به همان صفحه برمی‌گردید.
      </p>
    </form>
  );
}
