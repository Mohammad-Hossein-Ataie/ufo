"use client";
import { Button } from "@ufo/ui";
const number = (n: number) => n.toLocaleString("fa-IR");
export function Pagination({
  page,
  pageSize,
  total,
  busy,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  busy: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="صفحه‌بندی محصولات"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-[#D7DDE4] bg-slate-50 p-4 text-sm"
    >
      <p role="status">
        محصولات {number(total ? (page - 1) * pageSize + 1 : 0)}–
        {number(Math.min(page * pageSize, total))} از {number(total)}
      </p>
      <label className="flex items-center gap-2">
        تعداد در صفحه
        <select
          aria-label="تعداد در صفحه"
          disabled={busy}
          className="rounded-md border bg-white p-2"
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
        >
          {[20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {number(size)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <Button variant="secondary" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>
          قبلی
        </Button>
        <span>
          {number(page)} / {number(pages)}
        </span>
        <Button
          variant="secondary"
          disabled={busy || page >= pages}
          onClick={() => onPage(page + 1)}
        >
          بعدی
        </Button>
      </div>
    </nav>
  );
}
