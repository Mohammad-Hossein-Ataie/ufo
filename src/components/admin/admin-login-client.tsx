"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";

export function AdminLoginClient() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "ورود انجام نشد. تنظیمات سرور یا اطلاعات ورود را بررسی کنید.");
        return;
      }

      window.location.href = searchParams.get("next") || "/admin";
    } catch {
      setError("ارتباط با سرور برقرار نشد. اتصال اینترنت یا وضعیت سرویس را بررسی کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      {error ? (
        <Alert title="خطا در ورود" tone="danger">
          {error}
        </Alert>
      ) : null}

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        نام کاربری
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          dir="ltr"
          autoComplete="username"
          placeholder="نام کاربری"
          className="min-h-12 border-slate-300 bg-white text-base shadow-sm focus:border-cyan-500 focus:ring-cyan-100"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        رمز عبور
        <span className="relative">
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="current-password"
            placeholder="••••••••"
            className="min-h-12 border-slate-300 bg-white pe-12 pl-14 text-base shadow-sm focus:border-cyan-500 focus:ring-cyan-100"
            required
          />
          <button
            type="button"
            className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
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
        className="mt-1 w-full border-cyan-500 bg-cyan-400 text-slate-950 shadow-sm hover:bg-cyan-300 focus-visible:outline-cyan-500"
      >
        {isSubmitting ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <LogIn size={18} aria-hidden="true" />
        )}
        {isSubmitting ? "در حال ورود..." : "ورود به پنل"}
      </Button>

      <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600">
        <AlertCircle size={16} className="mt-1 shrink-0 text-cyan-600" aria-hidden="true" />
        <p>اگر مسیر محافظت‌شده‌ای باز کرده باشید، بعد از ورود به همان صفحه برمی‌گردید.</p>
      </div>
    </form>
  );
}
