"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ChevronsUpDown, PackageOpen } from "lucide-react";
import { Badge, Button, Price } from "@ufo/ui";
import type { ProductListRow, ProductQuery } from "@/lib/admin-product-query";
function ProductThumbnail({ src }: { src: string }) {
  const [failed, setFailed] = useState("");
  const source =
    !src || failed === src
      ? "/images/ufo-hero.png"
      : src.replace(/^(\/api\/product-images\/asset\/[0-9a-f-]+\/)detail$/i, "$1card");
  return (
    <Image
      src={source}
      alt=""
      width={48}
      height={56}
      sizes="48px"
      loading="lazy"
      className="h-14 w-12 shrink-0 rounded-md border bg-slate-50 object-contain"
      unoptimized={source.startsWith("/api/") || /^https?:/.test(source)}
      onError={() => setFailed(src)}
    />
  );
}
function SelectAll({
  checked,
  mixed,
  onChange,
}: {
  checked: boolean;
  mixed: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="انتخاب محصولات همین صفحه"
      checked={checked}
      onChange={onChange}
    />
  );
}
export function ProductTable({
  rows,
  busy,
  selected,
  onSelect,
  onSelectAll,
  onEdit,
  sort,
  direction,
  onSort,
  error,
  onRetry,
}: {
  rows: ProductListRow[];
  busy: boolean;
  selected: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (row: ProductListRow) => void;
  sort: ProductQuery["sort"];
  direction: "asc" | "desc";
  onSort: (sort: ProductQuery["sort"]) => void;
  error: string;
  onRetry: () => void;
}) {
  const columns: Array<{ label: string; key: ProductQuery["sort"] }> = [
    { label: "محصول", key: "nameFa" },
    { label: "برند", key: "brand" },
    { label: "دسته‌بندی", key: "category" },
    { label: "قیمت تکی", key: "price" },
    { label: "قیمت عمده", key: "wholesale" },
    { label: "موجودی", key: "stock" },
    { label: "وضعیت", key: "status" },
  ];
  return (
    <div className="max-h-[65vh] overflow-auto [color-scheme:light]" aria-busy={busy}>
      <table className="w-full min-w-[1050px] text-right text-sm">
        <caption className="sr-only">
          فهرست محصولات؛ قیمت هر عدد به تومان و موجودی قابل فروشِ مدل اصلی
        </caption>
        <thead className="sticky top-0 z-10 border-b bg-slate-50 text-xs text-slate-600">
          <tr>
            <th className="w-12 px-4 py-4">
              {!busy && rows.length > 0 && (
                <SelectAll
                  checked={rows.every((r) => selected.includes(r.product.id))}
                  mixed={selected.length > 0 && !rows.every((r) => selected.includes(r.product.id))}
                  onChange={onSelectAll}
                />
              )}
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                aria-sort={
                  sort === c.key ? (direction === "asc" ? "ascending" : "descending") : "none"
                }
                className="px-3 py-4"
              >
                <button
                  className="flex items-center gap-1 whitespace-nowrap"
                  onClick={() => onSort(c.key)}
                  disabled={busy}
                >
                  {c.label}
                  {sort === c.key ? (
                    direction === "asc" ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )
                  ) : (
                    <ChevronsUpDown size={13} />
                  )}
                </button>
              </th>
            ))}
            <th className="sticky left-0 bg-slate-50 px-4">عملیات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {busy
            ? Array.from({ length: 8 }, (_, i) => (
                <tr key={i} aria-hidden="true">
                  {Array.from({ length: 9 }, (_, j) => (
                    <td key={j} className="p-4">
                      <div className="h-8 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                    </td>
                  ))}
                </tr>
              ))
            : !error &&
              rows.map((row) => {
                const stock = Math.max(0, row.inventory.onHand - row.inventory.reserved);
                return (
                  <tr
                    key={row.product.id}
                    className={
                      selected.includes(row.product.id) ? "bg-blue-50" : "hover:bg-slate-50/70"
                    }
                  >
                    <td className="px-4">
                      <input
                        type="checkbox"
                        aria-label={`انتخاب ${row.product.nameFa}`}
                        checked={selected.includes(row.product.id)}
                        onChange={() => onSelect(row.product.id)}
                      />
                    </td>
                    <td className="max-w-80 p-3">
                      <button
                        onClick={() => onEdit(row)}
                        className="flex items-center gap-3 text-right"
                      >
                        <ProductThumbnail src={row.product.image} />
                        <span>
                          <span className="line-clamp-2 font-bold leading-6">
                            {row.product.nameFa}
                          </span>
                          <span dir="ltr" className="mt-1 block text-right text-xs text-slate-500">
                            {row.variant.sku}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3">{row.brandNameFa}</td>
                    <td className="px-3 text-slate-600">{row.categoryNameFa}</td>
                    <td className="whitespace-nowrap px-3">
                      <Price valueRial={row.variant.retailPriceRial} />
                    </td>
                    <td className="whitespace-nowrap px-3">
                      {row.variant.wholesaleEnabled ? (
                        <Price valueRial={row.variant.wholesalePriceRial} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3">
                      <span
                        className={
                          stock === 0
                            ? "font-bold text-rose-600"
                            : stock <= row.inventory.restockThreshold
                              ? "font-bold text-amber-700"
                              : "font-bold text-slate-800"
                        }
                      >
                        {stock.toLocaleString("fa-IR")}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {stock === 0
                          ? "ناموجود"
                          : stock <= row.inventory.restockThreshold
                            ? "رو به اتمام"
                            : "قابل فروش"}
                      </span>
                    </td>
                    <td className="px-3">
                      <Badge tone={row.product.isActive ? "success" : "neutral"}>
                        {row.product.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="sticky left-0 bg-white px-3 shadow-[2px_0_4px_-3px_#94a3b8]">
                      <Button variant="secondary" onClick={() => onEdit(row)}>
                        ویرایش
                      </Button>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
      {!busy && (error || !rows.length) && (
        <div className="grid justify-items-center gap-3 px-6 py-16 text-center">
          <PackageOpen className="text-slate-400" size={36} />
          <p className="font-bold">{error || "محصولی با این مشخصات پیدا نشد"}</p>
          <p className="text-sm text-slate-500">
            {error
              ? "اتصال را بررسی و دوباره تلاش کنید."
              : "فیلترها را تغییر دهید یا محصول جدید بسازید."}
          </p>
          {error && (
            <Button variant="secondary" onClick={onRetry}>
              تلاش دوباره
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
