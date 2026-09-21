"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button, Input } from "@ufo/ui";
import type { Brand, Category } from "@ufo/types";
import { SearchableSelect } from "./searchable-select";
export interface FilterState {
  q: string;
  category: string;
  brand: string;
  kind: string;
  channel: string;
  status: string;
  stock: string;
}
export const emptyFilters: FilterState = {
  q: "",
  category: "",
  brand: "",
  kind: "",
  channel: "",
  status: "",
  stock: "",
};
export const productKinds = [
  { value: "disposable", label: "یکبارمصرف" },
  { value: "pod-device", label: "پاد دائمی" },
  { value: "vape-device", label: "ویپ" },
  { value: "salt-nicotine", label: "سالت نیکوتین" },
  { value: "e-liquid", label: "جویس" },
  { value: "cartridge", label: "کارتریج" },
  { value: "coil", label: "کویل" },
  { value: "accessory", label: "اکسسوری" },
];
export function ProductFilters({
  value,
  onChange,
  brands,
  categories,
}: {
  value: FilterState;
  onChange: (value: FilterState) => void;
  brands: Brand[];
  categories: Category[];
}) {
  const fields = [
    {
      key: "category",
      label: "دسته‌بندی",
      options: categories.map((c) => ({ value: c.id, label: c.nameFa })),
    },
    { key: "brand", label: "برند", options: brands.map((b) => ({ value: b.id, label: b.nameFa })) },
    { key: "kind", label: "نوع محصول", options: productKinds },
    {
      key: "channel",
      label: "کانال فروش",
      options: [
        { value: "retail", label: "تکی" },
        { value: "wholesale", label: "عمده" },
      ],
    },
    {
      key: "status",
      label: "وضعیت انتشار",
      options: [
        { value: "active", label: "فعال" },
        { value: "inactive", label: "غیرفعال" },
      ],
    },
    {
      key: "stock",
      label: "وضعیت موجودی",
      options: [
        { value: "in", label: "موجود" },
        { value: "low", label: "رو به اتمام" },
        { value: "out", label: "ناموجود" },
      ],
    },
  ] as const;
  return (
    <section
      aria-label="جست‌وجو و فیلتر محصولات"
      className="grid gap-4 rounded-md border border-[#D7DDE4] bg-white p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={18} className="absolute right-3 top-3 text-slate-400" />
          <Input
            aria-label="جست‌وجوی محصولات"
            className="pr-10"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder="نام محصول، SKU، اسلاگ یا برند…"
          />
        </div>
        <SlidersHorizontal size={18} aria-hidden="true" />
        <Button
          variant="secondary"
          disabled={!Object.values(value).some(Boolean)}
          onClick={() => onChange(emptyFilters)}
        >
          پاک کردن فیلترها
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {fields.map((field) => (
          <div key={field.key} className="grid min-w-0 gap-2 text-xs font-bold text-slate-600">
            <span>{field.label}</span>
            <SearchableSelect
              label={field.label}
              value={value[field.key]}
              options={[{ value: "", label: "همه" }, ...field.options]}
              onChange={(next) => onChange({ ...value, [field.key]: next })}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
