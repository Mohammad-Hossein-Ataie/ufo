"use client";
import { useEffect, useState } from "react";
import { Button, Input } from "@ufo/ui";
import type { BankAccount } from "@/lib/payment-settings";
export function AdminPaymentSettings() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/admin/payment-accounts", { cache: "no-store" })
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error);
        setAccounts(p.accounts);
      })
      .catch(() => setMessage("دریافت حساب‌ها انجام نشد."));
  }, []);
  function edit(index: number, patch: Partial<BankAccount>) {
    setAccounts((current) => current.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/payment-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p.error);
      setAccounts(p.accounts);
      setMessage("حساب‌ها ذخیره شدند.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "ذخیره انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="my-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-black">حساب‌های کارت به کارت</h2>
      <p className="text-sm leading-7 text-slate-600">
        سه حساب برای هر دو فروشگاه. نمونه‌ها غیرقابل واریز هستند؛ فقط پس از جایگزینی شماره‌ها و
        اطمینان از مالکیت حساب، آن را فعال کنید. اعتبارسنجی شماره‌ها مالکیت حساب را تأیید نمی‌کند.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {accounts.map((a, i) => (
          <fieldset
            key={a.id}
            disabled={busy}
            className="grid gap-3 rounded-xl border border-slate-200 p-4"
          >
            <legend className="px-2 font-bold">حساب {i + 1}</legend>
            {(
              [
                ["bankName", "نام بانک"],
                ["holderName", "نام صاحب حساب"],
                ["cardNumber", "شماره کارت"],
                ["iban", "شماره شبا"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm">
                {label}
                <Input
                  value={a[key]}
                  onChange={(e) => edit(i, { [key]: e.target.value })}
                  dir={key === "cardNumber" || key === "iban" ? "ltr" : "rtl"}
                  maxLength={key === "cardNumber" ? 24 : 100}
                />
              </label>
            ))}
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={a.enabled}
                onChange={(e) => edit(i, { enabled: e.target.checked })}
              />
              حساب واقعی و فعال است
            </label>
          </fieldset>
        ))}
      </div>
      <Button type="button" onClick={() => void save()} disabled={busy || accounts.length !== 3}>
        {busy ? "در حال ذخیره..." : "ذخیره حساب‌ها"}
      </Button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </section>
  );
}
