"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  Check,
  Copy,
  Download,
  File,
  FileImage,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Badge, Button, IconButton, Input } from "@ufo/ui";
import { AdminPanel, AdminStatCard } from "./admin-ui";

interface StoredFileView {
  key: string;
  size?: number;
  contentType?: string;
  lastModified?: string;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatBytes(value?: number) {
  if (!value) return "-";
  if (value < 1024) return `${formatNumber(value)} بایت`;
  if (value < 1024 * 1024) return `${formatNumber(Math.round(value / 1024))} کیلوبایت`;
  return `${formatNumber(Math.round(value / 1024 / 1024))} مگابایت`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function fileName(key: string) {
  return key.split("/").pop() || key;
}

function isImage(entry: StoredFileView) {
  return entry.contentType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(entry.key);
}

export function StorageManager() {
  const [files, setFiles] = useState<StoredFileView[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("آماده");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StoredFileView | null>(null);

  async function fetchFiles() {
    setLoading(true);
    const response = await fetch("/api/admin/storage/list-files", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as {
      files?: StoredFileView[];
      error?: string;
    };
    setFiles(data.files ?? []);
    setMessage(data.error ?? "لیست فایل‌ها به‌روز شد.");
    setLoading(false);
  }

  async function uploadSelectedFile(nextFile = file) {
    if (!nextFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", nextFile);
    const response = await fetch("/api/admin/storage/upload", { method: "POST", body: formData });
    const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    setMessage(data.message ?? data.error ?? "پاسخ نامشخص");
    setFile(null);
    await fetchFiles();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setLoading(true);
    const response = await fetch("/api/admin/storage/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: pendingDelete.key }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    setMessage(data.message ?? data.error ?? "پاسخ نامشخص");
    setPendingDelete(null);
    await fetchFiles();
  }

  async function getTemporaryUrl(key: string) {
    const response = await fetch("/api/admin/storage/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    return (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  }

  async function downloadFile(key: string) {
    const data = await getTemporaryUrl(key);
    if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    setMessage(data.error ?? "لینک موقت دانلود ساخته شد.");
  }

  async function copyTemporaryUrl(key: string) {
    const data = await getTemporaryUrl(key);
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      setMessage("لینک موقت فایل کپی شد.");
      return;
    }
    setMessage(data.error ?? "ساخت لینک موقت ناموفق بود.");
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setMessage("کلید فایل کپی شد.");
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) {
      setFile(nextFile);
      void uploadSelectedFile(nextFile);
    }
  }

  useEffect(() => {
    void fetchFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;
    return files.filter((entry) =>
      [entry.key, entry.contentType].filter(Boolean).join(" ").toLowerCase().includes(normalized),
    );
  }, [files, query]);

  const summary = useMemo(() => {
    const images = files.filter(isImage).length;
    const totalSize = files.reduce((sum, entry) => sum + (entry.size ?? 0), 0);
    const latest = files
      .map((entry) => entry.lastModified)
      .filter(Boolean)
      .sort()
      .at(-1);
    return { images, totalSize, latest };
  }, [files]);

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 md:grid-cols-3">
        <AdminStatCard
          label="کل فایل‌ها"
          value={formatNumber(files.length)}
          meta={`${formatNumber(filteredFiles.length)} نتیجه در نمای فعلی`}
          icon={<File size={21} aria-hidden="true" />}
          tone="info"
        />
        <AdminStatCard
          label="تصاویر"
          value={formatNumber(summary.images)}
          meta="بر اساس نوع فایل یا پسوند تصویر"
          icon={<FileImage size={21} aria-hidden="true" />}
          tone="success"
        />
        <AdminStatCard
          label="حجم تقریبی"
          value={formatBytes(summary.totalSize)}
          meta={
            summary.latest ? `آخرین تغییر: ${formatDate(summary.latest)}` : "هنوز فایلی ثبت نشده"
          }
          icon={<Upload size={21} aria-hidden="true" />}
          tone="neutral"
        />
      </section>

      <AdminPanel className="p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(18rem,1fr)_minmax(20rem,0.9fr)]">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`grid min-h-32 cursor-pointer place-items-center rounded-md border border-dashed p-5 text-center transition ${
              dragging
                ? "border-cyan-500 bg-cyan-50"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <input
              className="sr-only"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <span className="grid place-items-center gap-2">
              <Upload size={28} className="text-cyan-700" aria-hidden="true" />
              <span className="font-black">فایل را رها کنید یا انتخاب کنید</span>
              <span className="text-xs text-slate-500">حداکثر حجم هر فایل ۸ مگابایت است.</span>
              {file ? (
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-700">
                  {file.name}
                </span>
              ) : null}
            </span>
          </label>

          <div className="grid content-between gap-3">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pr-10"
                placeholder="جست‌وجو در نام فایل یا نوع"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => uploadSelectedFile()}
                disabled={!file || loading}
              >
                <Upload size={17} aria-hidden="true" />
                آپلود فایل
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fetchFiles()}
                disabled={loading}
              >
                <RefreshCw size={17} aria-hidden="true" />
                تازه‌سازی
              </Button>
            </div>
            <p className="text-sm leading-7 text-slate-600" role="status">
              {loading ? "در حال انجام عملیات..." : message}
            </p>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-right">فایل</th>
                <th className="px-4 py-3 text-right">نوع</th>
                <th className="px-4 py-3 text-right">حجم</th>
                <th className="px-4 py-3 text-right">آخرین تغییر</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((entry) => (
                <tr
                  key={entry.key}
                  className="border-t border-slate-200 align-middle hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        {isImage(entry) ? (
                          <FileImage size={18} aria-hidden="true" />
                        ) : (
                          <File size={18} aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-950">{fileName(entry.key)}</p>
                        <p className="mt-1 max-w-[24rem] truncate text-xs text-slate-500" dir="ltr">
                          {entry.key}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={isImage(entry) ? "success" : "neutral"}>
                      {entry.contentType ?? (isImage(entry) ? "image" : "file")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatBytes(entry.size)}</td>
                  <td className="px-4 py-3">{formatDate(entry.lastModified)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <IconButton
                        label="کپی کلید"
                        className="border-slate-200 bg-white text-slate-700"
                        onClick={() => void copyKey(entry.key)}
                      >
                        <Copy size={16} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label="کپی لینک موقت"
                        className="border-slate-200 bg-white text-slate-700"
                        onClick={() => void copyTemporaryUrl(entry.key)}
                      >
                        <Check size={16} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label="دانلود"
                        className="border-slate-200 bg-white text-slate-700"
                        onClick={() => void downloadFile(entry.key)}
                      >
                        <Download size={16} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        label="حذف فایل"
                        className="border-rose-200 bg-rose-50 text-rose-700"
                        onClick={() => setPendingDelete(entry)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredFiles.length === 0 ? (
          <div className="grid min-h-44 place-items-center p-6 text-center text-sm text-slate-500">
            فایلی با این جست‌وجو پیدا نشد.
          </div>
        ) : null}
      </AdminPanel>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-md bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">حذف فایل</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  این عملیات فایل را از storage حذف می‌کند و ممکن است تصاویر استفاده‌شده در محصولات
                  دیگر نمایش داده نشوند.
                </p>
              </div>
              <IconButton
                label="بستن"
                className="border-slate-200 bg-slate-50 text-slate-700"
                onClick={() => setPendingDelete(null)}
              >
                <X size={17} aria-hidden="true" />
              </IconButton>
            </div>
            <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600" dir="ltr">
              {pendingDelete.key}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>
                انصراف
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => void confirmDelete()}
                disabled={loading}
              >
                حذف فایل
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
