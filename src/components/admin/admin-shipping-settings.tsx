"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Plus, Save, ShieldCheck, Trash2, Truck } from "lucide-react";
import { Alert, Button, Input } from "@ufo/ui";
import type { ShippingMethodConfig } from "@ufo/types";
import { AdminPanel } from "./admin-ui";

const emptyMethod = {
  code: "",
  titleFa: "",
  descriptionFa: "",
  costToman: "",
  etaFa: "",
  scope: "nationwide" as ShippingMethodConfig["scope"],
  isActive: true,
  sortOrder: 100,
};

export function AdminShippingSettings() {
  const [methods, setMethods] = useState<ShippingMethodConfig[]>([]);
  const [draft, setDraft] = useState(emptyMethod);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/shipping-methods", { cache: "no-store" });
      const payload = (await response.json()) as {
        methods?: ShippingMethodConfig[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "دریافت روش‌ها انجام نشد.");
      setMethods(payload.methods ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت روش‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateLocal(id: string, patch: Partial<ShippingMethodConfig>) {
    setMethods((current) =>
      current.map((method) => (method.id === id ? { ...method, ...patch } : method)),
    );
  }

  async function persist(method: ShippingMethodConfig) {
    setBusyId(method.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/shipping-methods/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method),
      });
      const payload = (await response.json()) as { method?: ShippingMethodConfig; error?: string };
      if (!response.ok || !payload.method) throw new Error(payload.error ?? "ذخیره انجام نشد.");
      setMethods((current) =>
        current.map((item) => (item.id === method.id ? payload.method! : item)),
      );
      setMessage(`روش «${payload.method.titleFa}» ذخیره شد.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ذخیره انجام نشد.");
    } finally {
      setBusyId("");
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("new");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/shipping-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          costRial: Math.round(Number(draft.costToman) * 10),
        }),
      });
      const payload = (await response.json()) as { method?: ShippingMethodConfig; error?: string };
      if (!response.ok || !payload.method) throw new Error(payload.error ?? "افزودن انجام نشد.");
      setMethods((current) => [...current, payload.method!]);
      setDraft(emptyMethod);
      setMessage(`روش «${payload.method.titleFa}» اضافه شد.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "افزودن انجام نشد.");
    } finally {
      setBusyId("");
    }
  }

  async function remove(method: ShippingMethodConfig) {
    if (!window.confirm(`روش «${method.titleFa}» حذف شود؟`)) return;
    setBusyId(method.id);
    try {
      const response = await fetch(`/api/admin/shipping-methods/${method.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "حذف انجام نشد.");
      setMethods((current) => current.filter((item) => item.id !== method.id));
      setMessage("روش ارسال حذف شد.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "حذف انجام نشد.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid gap-5">
      {error ? (
        <Alert title="خطا" tone="danger">
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert title="انجام شد" tone="success">
          {message}
        </Alert>
      ) : null}
      <AdminPanel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Truck size={21} />
            </span>
            <div>
              <h2 className="font-black text-slate-950">روش‌های ارسال</h2>
              <p className="mt-1 text-xs text-slate-500">قیمت، محدوده و وضعیت نمایش در checkout</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <ShieldCheck size={15} />
            محاسبه نهایی سمت سرور
          </span>
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={19} />
            در حال دریافت تنظیمات...
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5">
            {methods.map((method) => (
              <article
                key={method.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{method.titleFa || "بدون عنوان"}</p>
                    <code className="mt-1 block text-xs text-slate-500">{method.code}</code>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={method.isActive}
                      onChange={(event) =>
                        updateLocal(method.id, { isActive: event.target.checked })
                      }
                      className="h-5 w-5 accent-cyan-500"
                    />
                    {method.isActive ? "فعال" : "غیرفعال"}
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                    عنوان
                    <Input
                      value={method.titleFa}
                      onChange={(event) => updateLocal(method.id, { titleFa: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                    هزینه (تومان)
                    <Input
                      type="number"
                      min="0"
                      value={Math.round(method.costRial / 10)}
                      onChange={(event) =>
                        updateLocal(method.id, {
                          costRial: Math.round(Number(event.target.value) * 10),
                        })
                      }
                      dir="ltr"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                    زمان تحویل
                    <Input
                      value={method.etaFa}
                      onChange={(event) => updateLocal(method.id, { etaFa: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                    محدوده
                    <select
                      value={method.scope}
                      onChange={(event) =>
                        updateLocal(method.id, {
                          scope: event.target.value as ShippingMethodConfig["scope"],
                        })
                      }
                      className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="nationwide">سراسر کشور</option>
                      <option value="tehran">فقط شهر تهران</option>
                      <option value="pickup">تحویل حضوری</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-slate-600 md:col-span-2 xl:col-span-3">
                    توضیح
                    <Input
                      value={method.descriptionFa}
                      onChange={(event) =>
                        updateLocal(method.id, { descriptionFa: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                    ترتیب
                    <Input
                      type="number"
                      min="0"
                      value={method.sortOrder}
                      onChange={(event) =>
                        updateLocal(method.id, { sortOrder: Number(event.target.value) })
                      }
                    />
                  </label>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => void remove(method)}
                    disabled={busyId === method.id}
                  >
                    <Trash2 size={16} />
                    حذف
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void persist(method)}
                    disabled={busyId === method.id}
                  >
                    {busyId === method.id ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    ذخیره
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminPanel>

      <AdminPanel className="p-5">
        <div className="mb-4">
          <h2 className="font-black text-slate-950">افزودن روش جدید</h2>
          <p className="mt-1 text-sm text-slate-500">
            برای نمونه پست ملی، باربری یا پیک اختصاصی را تعریف کنید.
          </p>
        </div>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            کد انگلیسی
            <Input
              value={draft.code}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  code: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                })
              }
              dir="ltr"
              placeholder="iran_post"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            عنوان
            <Input
              value={draft.titleFa}
              onChange={(event) => setDraft({ ...draft, titleFa: event.target.value })}
              placeholder="پست ملی ایران"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            هزینه (تومان)
            <Input
              type="number"
              min="0"
              value={draft.costToman}
              onChange={(event) => setDraft({ ...draft, costToman: event.target.value })}
              dir="ltr"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            زمان تحویل
            <Input
              value={draft.etaFa}
              onChange={(event) => setDraft({ ...draft, etaFa: event.target.value })}
              placeholder="۳ تا ۷ روز کاری"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-600 md:col-span-2">
            توضیح
            <Input
              value={draft.descriptionFa}
              onChange={(event) => setDraft({ ...draft, descriptionFa: event.target.value })}
              placeholder="ارسال به سراسر کشور"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            محدوده
            <select
              value={draft.scope}
              onChange={(event) =>
                setDraft({ ...draft, scope: event.target.value as ShippingMethodConfig["scope"] })
              }
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="nationwide">سراسر کشور</option>
              <option value="tehran">فقط شهر تهران</option>
              <option value="pickup">تحویل حضوری</option>
            </select>
          </label>
          <Button type="submit" className="self-end" disabled={busyId === "new"}>
            {busyId === "new" ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Plus size={17} />
            )}
            افزودن روش ارسال
          </Button>
        </form>
      </AdminPanel>
    </div>
  );
}
