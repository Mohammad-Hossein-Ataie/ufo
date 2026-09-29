"use client";

import { useEffect, useState } from "react";
import { BellRing, Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@ufo/ui";
import type {
  AnnouncementIcon,
  AnnouncementStyle,
  SiteAnnouncement,
} from "@/lib/site-announcements";

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function newAnnouncement(): SiteAnnouncement {
  return {
    id: `announcement_${crypto.randomUUID()}`,
    enabled: false,
    text: "",
    icon: "info",
    priority: 0,
    style: "info",
  };
}

export function AdminAnnouncementSettings() {
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("در حال دریافت اعلان‌ها…");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/announcements", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          announcements?: SiteAnnouncement[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? "دریافت اعلان‌ها انجام نشد.");
        setAnnouncements(payload.announcements ?? []);
        setMessage("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "دریافت اعلان‌ها انجام نشد.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function update(id: string, patch: Partial<SiteAnnouncement>) {
    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === id ? { ...announcement, ...patch } : announcement,
      ),
    );
  }

  function updateOptional(
    id: string,
    key: "link" | "startsAt" | "endsAt",
    value: string | undefined,
  ) {
    setAnnouncements((current) =>
      current.map((announcement) => {
        if (announcement.id !== id) return announcement;
        const next = { ...announcement };
        if (value) next[key] = value;
        else delete next[key];
        return next;
      }),
    );
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcements }),
      });
      const payload = (await response.json()) as {
        announcements?: SiteAnnouncement[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "ذخیره اعلان‌ها انجام نشد.");
      setAnnouncements(payload.announcements ?? []);
      setMessage("اعلان‌ها ذخیره شدند و در بازدید بعدی سایت نمایش داده می‌شوند.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ذخیره اعلان‌ها انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="my-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-xl font-black">
            <BellRing size={21} className="text-cyan-700" aria-hidden="true" />
            اعلان‌های بالای سایت
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            پیام‌های عملیاتی، ارسال، نگهداری یا کمپین را زمان‌بندی کنید. اعلان فعال با اولویت بالاتر
            زودتر نمایش داده می‌شود.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setAnnouncements((current) => [...current, newAnnouncement()])}
          disabled={loading || saving || announcements.length >= 12}
        >
          <Plus size={17} aria-hidden="true" />
          اعلان جدید
        </Button>
      </div>

      {announcements.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          هنوز اعلانی ساخته نشده است.
        </div>
      ) : null}

      <div className="grid gap-4">
        {announcements.map((announcement, index) => (
          <fieldset
            key={announcement.id}
            disabled={saving}
            className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <legend className="px-2 text-sm font-black">اعلان {index + 1}</legend>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex min-h-11 items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(event) => update(announcement.id, { enabled: event.target.checked })}
                />
                فعال
              </label>
              <button
                type="button"
                onClick={() =>
                  setAnnouncements((current) =>
                    current.filter((item) => item.id !== announcement.id),
                  )
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
                aria-label={`حذف اعلان ${index + 1}`}
              >
                <Trash2 size={16} aria-hidden="true" />
                حذف
              </button>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              متن اعلان
              <Input
                value={announcement.text}
                maxLength={240}
                required
                onChange={(event) => update(announcement.id, { text: event.target.value })}
                placeholder="مثلاً: ارسال سفارش‌های امروز از ساعت ۱۶ انجام می‌شود."
              />
              <span className="text-xs font-normal text-slate-500">
                {new Intl.NumberFormat("fa-IR").format(announcement.text.length)} از ۲۴۰ کاراکتر
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2 text-sm font-bold">
                آیکن
                <select
                  value={announcement.icon}
                  onChange={(event) =>
                    update(announcement.id, { icon: event.target.value as AnnouncementIcon })
                  }
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
                >
                  <option value="none">بدون آیکن</option>
                  <option value="info">اطلاعات</option>
                  <option value="truck">ارسال</option>
                  <option value="sparkles">کمپین</option>
                  <option value="alert">هشدار</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                سبک نمایش
                <select
                  value={announcement.style}
                  onChange={(event) =>
                    update(announcement.id, { style: event.target.value as AnnouncementStyle })
                  }
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
                >
                  <option value="neutral">خنثی</option>
                  <option value="info">اطلاع‌رسانی</option>
                  <option value="success">مثبت</option>
                  <option value="warning">هشدار</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                اولویت
                <Input
                  type="number"
                  min={-1000}
                  max={1000}
                  value={announcement.priority}
                  onChange={(event) =>
                    update(announcement.id, { priority: Number(event.target.value) })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                لینک اختیاری
                <Input
                  dir="ltr"
                  value={announcement.link ?? ""}
                  maxLength={500}
                  onChange={(event) =>
                    updateOptional(announcement.id, "link", event.target.value || undefined)
                  }
                  placeholder="/products یا https://…"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                شروع اختیاری
                <Input
                  type="datetime-local"
                  value={toLocalDateTime(announcement.startsAt)}
                  onChange={(event) =>
                    updateOptional(announcement.id, "startsAt", toIso(event.target.value))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                پایان اختیاری
                <Input
                  type="datetime-local"
                  value={toLocalDateTime(announcement.endsAt)}
                  onChange={(event) =>
                    updateOptional(announcement.id, "endsAt", toIso(event.target.value))
                  }
                />
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => void save()}
        disabled={loading || saving || announcements.some((item) => !item.text.trim())}
      >
        {saving ? "در حال ذخیره…" : "ذخیره اعلان‌ها"}
      </Button>
      <p role="status" className="min-h-6 text-sm text-slate-600">
        {message}
      </p>
    </section>
  );
}
