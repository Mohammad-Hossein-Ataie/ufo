"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button, IconButton, Input } from "@ufo/ui";

interface StoredFileView {
  key: string;
  size?: number;
  contentType?: string;
  lastModified?: string;
}

export function StorageManager() {
  const [files, setFiles] = useState<StoredFileView[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("آماده");
  const [loading, setLoading] = useState(false);

  async function fetchFiles() {
    setLoading(true);
    const response = await fetch("/api/admin/storage/list-files", { cache: "no-store" });
    const data = (await response.json()) as { files?: StoredFileView[]; error?: string };
    setFiles(data.files ?? []);
    setMessage(data.error ?? "لیست فایل‌ها به‌روز شد.");
    setLoading(false);
  }

  async function uploadFile() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/storage/upload", { method: "POST", body: formData });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message ?? data.error ?? "پاسخ نامشخص");
    await fetchFiles();
  }

  async function deleteFile(key: string) {
    setLoading(true);
    const response = await fetch("/api/admin/storage/delete", {
      method: "DELETE",
      body: JSON.stringify({ key }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message ?? data.error ?? "پاسخ نامشخص");
    await fetchFiles();
  }

  async function downloadFile(key: string) {
    const response = await fetch("/api/admin/storage/presigned", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
    const data = (await response.json()) as { url?: string; error?: string };
    if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    setMessage(data.error ?? "لینک موقت ساخته شد.");
  }

  useEffect(() => {
    void fetchFiles();
  }, []);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-md border border-[#D7DDE4] bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <Button type="button" onClick={uploadFile} disabled={!file || loading}>
            <Upload size={17} />
            آپلود
          </Button>
          <IconButton
            label="به‌روزرسانی"
            className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]"
            onClick={() => void fetchFiles()}
          >
            <RefreshCw size={17} />
          </IconButton>
        </div>
        <p className="text-sm text-[#5F6C79]" role="status">
          {message}
        </p>
      </div>
      <div className="overflow-x-auto rounded-md border border-[#D7DDE4] bg-white">
        <table className="min-w-[620px] w-full text-sm">
          <thead className="bg-[#EEF3F8] text-[#4C5A67]">
            <tr>
              <th className="px-4 py-3 text-right">Key</th>
              <th className="px-4 py-3 text-right">حجم</th>
              <th className="px-4 py-3 text-right">آخرین تغییر</th>
              <th className="px-4 py-3 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {files.map((entry) => (
              <tr key={entry.key} className="border-t border-[#E2E7ED]">
                <td className="px-4 py-3" dir="ltr">
                  {entry.key}
                </td>
                <td className="px-4 py-3">
                  {entry.size ? new Intl.NumberFormat("fa-IR").format(entry.size) : "-"}
                </td>
                <td className="px-4 py-3">{entry.lastModified ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <IconButton
                      label="دانلود"
                      className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]"
                      onClick={() => void downloadFile(entry.key)}
                    >
                      <Download size={17} />
                    </IconButton>
                    <IconButton
                      label="حذف"
                      className="border-rose-200 bg-rose-50 text-rose-700"
                      onClick={() => void deleteFile(entry.key)}
                    >
                      <Trash2 size={17} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
