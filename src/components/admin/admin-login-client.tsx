"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";

export function AdminLoginClient() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin@ufopuff.local");
  const [password, setPassword] = useState("");
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
    <form onSubmit={submit} className="grid gap-4 rounded-md border border-[#D7DDE4] bg-white p-5">
      {error ? (
        <Alert title="خطا در ورود" tone="danger">
          {error}
        </Alert>
      ) : null}
      <label className="grid gap-2">
        نام کاربری
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          dir="ltr"
          required
        />
      </label>
      <label className="grid gap-2">
        رمز عبور
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          dir="ltr"
          required
        />
      </label>
      <Button type="submit" disabled={isSubmitting}>
        <LogIn size={18} />
        {isSubmitting ? "در حال ورود..." : "ورود به پنل"}
      </Button>
    </form>
  );
}
