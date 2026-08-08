"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  CheckCircle2,
  Edit3,
  Filter,
  PackageCheck,
  PackageOpen,
  Save,
  Search,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";
import { Badge, Button, IconButton, Input, Price } from "@ufo/ui";
import type {
  Brand,
  Category,
  InventoryItem,
  Product,
  ProductVariant,
  SalesChannel,
} from "@ufo/types";

interface AdminProductRecord {
  product: Product;
  variant: ProductVariant;
  inventory: InventoryItem;
  brandNameFa: string;
  categoryNameFa: string;
}

interface InventoryEditorState {
  onHand: number;
  reserved: number;
  restockThreshold: number;
  adjustment: number;
  note: string;
}

type StockFilter = "all" | "stockout" | "low" | "stable" | "preorder";
type SortKey = "product" | "available" | "onHand" | "reserved" | "threshold" | "value";
type SortDirection = "asc" | "desc";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function rialToToman(value: number) {
  return Math.round(value / 10);
}

function availableStock(row: AdminProductRecord) {
  return row.inventory.onHand - row.inventory.reserved;
}

function inventoryValue(row: AdminProductRecord) {
  return Math.max(0, availableStock(row)) * row.variant.wholesalePriceRial;
}

function stockState(row: AdminProductRecord) {
  const available = availableStock(row);
  if (available <= 0) {
    return {
      key: "stockout" as const,
      label: row.inventory.preorderEnabled ? "اتمام موجودی، پیش‌سفارش" : "اتمام موجودی",
      tone: "danger" as const,
    };
  }
  if (available <= row.inventory.restockThreshold) {
    return { key: "low" as const, label: "نیازمند شارژ", tone: "warning" as const };
  }
  return { key: "stable" as const, label: "پایدار", tone: "success" as const };
}

function stockProgress(row: AdminProductRecord) {
  const available = Math.max(0, availableStock(row));
  const threshold = Math.max(1, row.inventory.restockThreshold);
  return Math.min(100, Math.round((available / (threshold * 3)) * 100));
}

function channelLabel(channel: SalesChannel) {
  return channel === "wholesale" ? "عمده" : "تکی";
}

function productChannels(row: AdminProductRecord) {
  return row.product.salesChannels ?? ["retail", "wholesale"];
}

function compareRows(left: AdminProductRecord, right: AdminProductRecord, sortKey: SortKey) {
  if (sortKey === "product") return left.product.nameFa.localeCompare(right.product.nameFa, "fa");
  if (sortKey === "available") return availableStock(left) - availableStock(right);
  if (sortKey === "onHand") return left.inventory.onHand - right.inventory.onHand;
  if (sortKey === "reserved") return left.inventory.reserved - right.inventory.reserved;
  if (sortKey === "threshold")
    return left.inventory.restockThreshold - right.inventory.restockThreshold;
  return inventoryValue(left) - inventoryValue(right);
}

function rowToEditor(row: AdminProductRecord): InventoryEditorState {
  return {
    onHand: row.inventory.onHand,
    reserved: row.inventory.reserved,
    restockThreshold: row.inventory.restockThreshold,
    adjustment: 0,
    note: "",
  };
}

function SortButton({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === activeKey;
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-right font-bold transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF]"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowDownUp
        size={14}
        className={active ? "text-[#168BFF]" : "text-[#7A8794]"}
        aria-label={active ? `مرتب‌سازی ${direction === "asc" ? "صعودی" : "نزولی"}` : undefined}
      />
    </button>
  );
}

export function InventoryTable() {
  const [rows, setRows] = useState<AdminProductRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<"all" | SalesChannel>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("available");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedRow, setSelectedRow] = useState<AdminProductRecord | null>(null);
  const [editor, setEditor] = useState<InventoryEditorState>(rowToEditorFallback);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("در حال بارگذاری موجودی...");

  async function fetchRows() {
    setLoading(true);
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = (await response.json()) as {
      rows?: AdminProductRecord[];
      categories?: Category[];
      brands?: Brand[];
      error?: string;
    };
    setRows(data.rows ?? []);
    setCategories(data.categories ?? []);
    setBrands(data.brands ?? []);
    setStatus(data.error ?? "موجودی‌ها به‌روز شد.");
    setLoading(false);
  }

  useEffect(() => {
    void fetchRows();
  }, []);

  const summary = useMemo(() => {
    const totalAvailable = rows.reduce((sum, row) => sum + Math.max(0, availableStock(row)), 0);
    const reserved = rows.reduce((sum, row) => sum + row.inventory.reserved, 0);
    const low = rows.filter((row) => stockState(row).key === "low").length;
    const stockout = rows.filter((row) => stockState(row).key === "stockout").length;
    const valueRial = rows.reduce((sum, row) => sum + inventoryValue(row), 0);
    return { totalAvailable, reserved, low, stockout, valueRial };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        const haystack = [
          row.product.nameFa,
          row.product.nameEn,
          row.product.slug,
          row.variant.sku,
          row.variant.nameFa,
          row.brandNameFa,
          row.categoryNameFa,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesQuery = !normalized || haystack.includes(normalized);
        const matchesCategory =
          categoryFilter === "all" || row.product.categoryId === categoryFilter;
        const channels = productChannels(row);
        const matchesChannel = channelFilter === "all" || channels.includes(channelFilter);
        const state = stockState(row);
        const matchesStock =
          stockFilter === "all" ||
          state.key === stockFilter ||
          (stockFilter === "preorder" && row.inventory.preorderEnabled);
        return matchesQuery && matchesCategory && matchesChannel && matchesStock;
      })
      .sort((left, right) => {
        const result = compareRows(left, right, sortKey);
        return sortDirection === "asc" ? result : -result;
      });
  }, [categoryFilter, channelFilter, query, rows, sortDirection, sortKey, stockFilter]);

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDirection(nextKey === "product" ? "asc" : "desc");
    }
  }

  function openEditor(row: AdminProductRecord) {
    setSelectedRow(row);
    setEditor(rowToEditor(row));
  }

  function applyAdjustment() {
    setEditor((current) => ({
      ...current,
      onHand: Math.max(0, current.onHand + current.adjustment),
      adjustment: 0,
    }));
  }

  async function saveInventory() {
    if (!selectedRow) return;
    setLoading(true);
    const product = selectedRow.product;
    const variant = selectedRow.variant;
    const images = product.images?.length ? product.images : [product.image];
    const payload = {
      id: product.id,
      variantId: variant.id,
      inventoryId: selectedRow.inventory.id,
      nameFa: product.nameFa,
      nameEn: product.nameEn,
      slug: product.slug,
      brandId: product.brandId,
      categoryId: product.categoryId,
      productKind: product.productKind ?? "disposable",
      salesChannels: productChannels(selectedRow),
      shortDescriptionFa: product.shortDescriptionFa,
      descriptionFa: product.descriptionFa,
      image: product.image,
      images,
      tags: product.tags,
      specs: product.specs ?? [],
      retailPriceRial: variant.retailPriceRial,
      wholesalePriceRial: variant.wholesalePriceRial,
      wholesaleEnabled:
        variant.wholesaleEnabled ?? productChannels(selectedRow).includes("wholesale"),
      cartonSize: variant.cartonSize,
      minWholesaleCartonCount: variant.minWholesaleCartonCount,
      onHand: Math.max(0, Math.round(editor.onHand)),
      reserved: Math.max(0, Math.round(editor.reserved)),
      restockThreshold: Math.max(0, Math.round(editor.restockThreshold)),
      isActive: product.isActive,
    };
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setStatus(
      data.message ??
        data.error ??
        (editor.note ? `موجودی با یادداشت «${editor.note}» ذخیره شد.` : "موجودی ذخیره شد."),
    );
    if (response.ok) {
      setSelectedRow(null);
      await fetchRows();
    }
    setLoading(false);
  }

  const selectedAvailable = selectedRow
    ? Math.max(0, editor.onHand - editor.reserved)
    : Math.max(0, editor.onHand - editor.reserved);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "قابل فروش",
              value: formatNumber(summary.totalAvailable),
              meta: "عدد آماده فروش",
              icon: PackageCheck,
            },
            {
              label: "رزرو سفارش",
              value: formatNumber(summary.reserved),
              meta: "در سبد یا سفارش باز",
              icon: Boxes,
            },
            {
              label: "نیازمند شارژ",
              value: formatNumber(summary.low),
              meta: "زیر نقطه هشدار",
              icon: AlertTriangle,
            },
            {
              label: "اتمام موجودی",
              value: formatNumber(summary.stockout),
              meta: "نیازمند تصمیم سریع",
              icon: TrendingDown,
            },
            {
              label: "ارزش موجودی عمده",
              value: (
                <Price
                  valueRial={summary.valueRial}
                  className="whitespace-normal break-words leading-10"
                />
              ),
              meta: "بر اساس قیمت عمده هر عدد",
              icon: Warehouse,
              featured: true,
            },
          ].map((item) => (
            <article
              key={item.label}
              className={`min-w-0 overflow-hidden rounded-md border border-[#D7DDE4] bg-white p-4 shadow-sm ${
                item.featured ? "md:col-span-2 xl:col-span-2" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#5F6C79]">{item.label}</p>
                  <div
                    className={`mt-2 font-black tabular-nums ${
                      item.featured ? "text-2xl sm:text-3xl" : "text-2xl"
                    }`}
                  >
                    {item.value}
                  </div>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EEF3F8] text-[#168BFF]">
                  <item.icon size={22} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-xs text-[#5F6C79]">{item.meta}</p>
            </article>
          ))}
        </div>

        <div className="rounded-md border border-[#D7DDE4] bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,12rem))]">
            <label className="relative">
              <span className="sr-only">جستجو در موجودی</span>
              <Search
                className="pointer-events-none absolute right-3 top-3 text-[#5F6C79]"
                size={18}
              />
              <Input
                className="pr-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجو در محصول، SKU، برند"
              />
            </label>
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value as StockFilter)}
              aria-label="فیلتر وضعیت موجودی"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="stockout">اتمام موجودی</option>
              <option value="low">نیازمند شارژ</option>
              <option value="stable">پایدار</option>
              <option value="preorder">پیش‌سفارش فعال</option>
            </select>
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="فیلتر دسته"
            >
              <option value="all">همه دسته‌ها</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameFa}
                </option>
              ))}
            </select>
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value as "all" | SalesChannel)}
              aria-label="فیلتر کانال"
            >
              <option value="all">همه کانال‌ها</option>
              <option value="retail">تکی</option>
              <option value="wholesale">عمده</option>
            </select>
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={`${sortKey}:${sortDirection}`}
              onChange={(event) => {
                const [key, direction] = event.target.value.split(":") as [SortKey, SortDirection];
                setSortKey(key);
                setSortDirection(direction);
              }}
              aria-label="مرتب‌سازی"
            >
              <option value="available:asc">کمترین موجودی قابل فروش</option>
              <option value="available:desc">بیشترین موجودی قابل فروش</option>
              <option value="reserved:desc">بیشترین رزرو</option>
              <option value="value:desc">بیشترین ارزش موجودی</option>
              <option value="product:asc">نام محصول</option>
            </select>
          </div>
          <div
            className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#5F6C79]"
            role="status"
          >
            <Filter size={16} aria-hidden="true" />
            {formatNumber(filteredRows.length)} ردیف از {formatNumber(rows.length)} موجودی
            {brands.length > 0 ? <span>· {formatNumber(brands.length)} برند فعال</span> : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#D7DDE4] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-[#EEF3F8] text-[#4C5A67]">
              <tr>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="محصول"
                    sortKey="product"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">کانال و دسته</th>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="قابل فروش"
                    sortKey="available"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="موجودی کل"
                    sortKey="onHand"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="رزرو"
                    sortKey="reserved"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="نقطه شارژ"
                    sortKey="threshold"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="ارزش"
                    sortKey="value"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">ویرایش</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 180).map((row) => {
                const state = stockState(row);
                const progress = stockProgress(row);
                return (
                  <tr key={row.inventory.id} className="border-t border-[#E2E7ED] align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[#D7DDE4] bg-[#EEF3F8]">
                          <Image
                            src={row.product.image}
                            alt={row.product.nameFa}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{row.product.nameFa}</p>
                          <p className="truncate text-xs text-[#5F6C79]" dir="ltr">
                            {row.variant.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{row.categoryNameFa}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {productChannels(row).map((channel) => (
                          <Badge key={channel} tone={channel === "wholesale" ? "info" : "success"}>
                            {channelLabel(channel)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-lg font-black tabular-nums">
                        {formatNumber(availableStock(row))}
                      </p>
                      <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-[#EEF3F8]">
                        <div
                          className={`h-full rounded-full ${
                            state.key === "stockout"
                              ? "bg-rose-500"
                              : state.key === "low"
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums">
                      {formatNumber(row.inventory.onHand)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatNumber(row.inventory.reserved)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatNumber(row.inventory.restockThreshold)}
                    </td>
                    <td className="px-4 py-3">
                      <Price valueRial={inventoryValue(row)} />
                      <p className="mt-1 text-xs text-[#5F6C79]">
                        عمده هر عدد: {formatNumber(rialToToman(row.variant.wholesalePriceRial))}{" "}
                        تومان
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="grid gap-1">
                        <Badge tone={state.tone}>{state.label}</Badge>
                        {row.inventory.preorderEnabled ? (
                          <Badge tone="info">پیش‌سفارش فعال</Badge>
                        ) : null}
                        <span className="text-xs text-[#5F6C79]">
                          بروزرسانی: {formatDate(row.inventory.updatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <IconButton
                        label="ویرایش موجودی"
                        className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]"
                        onClick={() => openEditor(row)}
                      >
                        <Edit3 size={17} aria-hidden="true" />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredRows.length === 0 ? (
          <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-[#5F6C79]">
            <div>
              <PackageOpen className="mx-auto mb-3 text-[#7A8794]" size={34} aria-hidden="true" />
              موجودی‌ای با این فیلتر پیدا نشد.
            </div>
          </div>
        ) : null}
      </section>

      <p className="text-sm text-[#5F6C79]" role="status">
        {status}
      </p>

      <DialogPrimitive.Root
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,42rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md bg-white text-[#17202A] shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-3 border-b border-[#D7DDE4] px-5 py-4">
              <div>
                <DialogPrimitive.Title className="text-xl font-black">
                  ویرایش موجودی
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-[#5F6C79]">
                  موجودی کل، رزرو و نقطه هشدار را برای پایش دقیق فروش تکی و عمده تنظیم کنید.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <IconButton label="بستن" className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]">
                  <X size={18} aria-hidden="true" />
                </IconButton>
              </DialogPrimitive.Close>
            </div>

            {selectedRow ? (
              <div className="max-h-[calc(92vh-8rem)] overflow-y-auto p-5">
                <div className="flex items-center gap-3 rounded-md border border-[#D7DDE4] bg-[#F8FAFC] p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#EEF3F8]">
                    <Image
                      src={selectedRow.product.image}
                      alt={selectedRow.product.nameFa}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{selectedRow.product.nameFa}</p>
                    <p className="mt-1 text-xs text-[#5F6C79]" dir="ltr">
                      {selectedRow.variant.sku}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm">
                    موجودی کل
                    <Input
                      type="number"
                      min={0}
                      value={editor.onHand}
                      onChange={(event) =>
                        setEditor((current) => ({ ...current, onHand: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    رزرو شده
                    <Input
                      type="number"
                      min={0}
                      value={editor.reserved}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          reserved: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    هشدار شارژ
                    <Input
                      type="number"
                      min={0}
                      value={editor.restockThreshold}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          restockThreshold: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                    <div>
                      <p className="font-bold">
                        موجودی قابل فروش: {formatNumber(selectedAvailable)} عدد
                      </p>
                      <p className="mt-1 leading-6">
                        برای فروش عمده، هر کارتن {formatNumber(selectedRow.variant.cartonSize)} عدد
                        دارد؛ یعنی حدود{" "}
                        {formatNumber(
                          Math.floor(selectedAvailable / selectedRow.variant.cartonSize),
                        )}{" "}
                        کارتن کامل قابل فروش است.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 rounded-md border border-[#D7DDE4] p-4">
                  <h3 className="font-black">ثبت سریع ورود/خروج انبار</h3>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      type="number"
                      value={editor.adjustment}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          adjustment: Number(event.target.value),
                        }))
                      }
                      placeholder="مثلا ۲۴ یا -۶"
                    />
                    <Button type="button" variant="secondary" onClick={applyAdjustment}>
                      اعمال روی موجودی کل
                    </Button>
                  </div>
                  <Input
                    value={editor.note}
                    onChange={(event) =>
                      setEditor((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="یادداشت داخلی: شارژ از پخش، اصلاح شمارش، مرجوعی..."
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D7DDE4] bg-[#F8FAFC] px-5 py-4">
              <p className="text-sm text-[#5F6C79]">{loading ? "در حال ذخیره..." : status}</p>
              <div className="flex gap-2">
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="secondary">
                    انصراف
                  </Button>
                </DialogPrimitive.Close>
                <Button type="button" onClick={saveInventory} disabled={loading || !selectedRow}>
                  <Save size={17} aria-hidden="true" />
                  ذخیره موجودی
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

const rowToEditorFallback: InventoryEditorState = {
  onHand: 0,
  reserved: 0,
  restockThreshold: 5,
  adjustment: 0,
  note: "",
};
