"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Save, Search, UploadCloud } from "lucide-react";
import { Badge, Button, IconButton, Input, Price, Textarea } from "@ufo/ui";
import type {
  Brand,
  Category,
  InventoryItem,
  Product,
  ProductKind,
  ProductSpec,
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

interface FormState {
  id?: string;
  variantId?: string;
  inventoryId?: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  brandId: string;
  categoryId: string;
  productKind: ProductKind;
  retailPriceToman: number;
  wholesalePriceToman: number;
  retailEnabled: boolean;
  wholesaleEnabled: boolean;
  cartonSize: number;
  minWholesaleCartonCount: number;
  onHand: number;
  restockThreshold: number;
  image: string;
  tagsText: string;
  specsText: string;
  shortDescriptionFa: string;
  descriptionFa: string;
  isActive: boolean;
}

const productKindOptions: Array<{ value: ProductKind; label: string }> = [
  { value: "disposable", label: "یکبارمصرف" },
  { value: "pod-device", label: "پاد دائمی" },
  { value: "vape-device", label: "ویپ" },
  { value: "salt-nicotine", label: "سالت نیکوتین" },
  { value: "cartridge", label: "کارتریج" },
  { value: "coil", label: "کویل" },
  { value: "accessory", label: "اکسسوری" },
];

const emptyForm: FormState = {
  nameFa: "",
  nameEn: "",
  slug: "",
  brandId: "brand-ufo",
  categoryId: "cat-disposable",
  productKind: "disposable",
  retailPriceToman: 0,
  wholesalePriceToman: 0,
  retailEnabled: true,
  wholesaleEnabled: false,
  cartonSize: 10,
  minWholesaleCartonCount: 1,
  onHand: 0,
  restockThreshold: 5,
  image: "/images/ufo-hero.png",
  tagsText: "",
  specsText: "",
  shortDescriptionFa: "",
  descriptionFa: "",
  isActive: true,
};

function rialToToman(value: number) {
  return Math.round(value / 10);
}

function specsToText(specs: ProductSpec[] | undefined) {
  return (specs ?? []).map((spec) => `${spec.labelFa}: ${spec.valueFa}`).join("\n");
}

function textToSpecs(text: string): ProductSpec[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelFa, ...rest] = line.split(":");
      return { labelFa: (labelFa ?? "مشخصه").trim(), valueFa: rest.join(":").trim() || "-" };
    });
}

function rowToForm(row: AdminProductRecord): FormState {
  return {
    id: row.product.id,
    variantId: row.variant.id,
    inventoryId: row.inventory.id,
    nameFa: row.product.nameFa,
    nameEn: row.product.nameEn ?? "",
    slug: row.product.slug,
    brandId: row.product.brandId,
    categoryId: row.product.categoryId,
    productKind: row.product.productKind ?? "disposable",
    retailPriceToman: rialToToman(row.variant.retailPriceRial),
    wholesalePriceToman: rialToToman(row.variant.wholesalePriceRial),
    retailEnabled: row.product.salesChannels?.includes("retail") ?? true,
    wholesaleEnabled:
      row.variant.wholesaleEnabled ?? row.product.salesChannels?.includes("wholesale") ?? true,
    cartonSize: row.variant.cartonSize,
    minWholesaleCartonCount: row.variant.minWholesaleCartonCount,
    onHand: row.inventory.onHand,
    restockThreshold: row.inventory.restockThreshold,
    image: row.product.image,
    tagsText: row.product.tags.join("، "),
    specsText: specsToText(row.product.specs),
    shortDescriptionFa: row.product.shortDescriptionFa,
    descriptionFa: row.product.descriptionFa,
    isActive: row.product.isActive,
  };
}

export function ProductManager() {
  const [rows, setRows] = useState<AdminProductRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("در حال بارگذاری...");
  const [loading, setLoading] = useState(false);

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
    setStatus(data.error ?? "محصولات به‌روز شد.");
    setLoading(false);
  }

  useEffect(() => {
    void fetchRows();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      [
        row.product.nameFa,
        row.product.nameEn,
        row.product.slug,
        row.variant.sku,
        row.brandNameFa,
        row.categoryNameFa,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, rows]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProduct() {
    setLoading(true);
    const salesChannels: SalesChannel[] = [
      ...(form.retailEnabled ? ["retail" as const] : []),
      ...(form.wholesaleEnabled ? ["wholesale" as const] : []),
    ];
    const payload = {
      id: form.id,
      variantId: form.variantId,
      inventoryId: form.inventoryId,
      nameFa: form.nameFa,
      nameEn: form.nameEn,
      slug: form.slug,
      brandId: form.brandId,
      categoryId: form.categoryId,
      productKind: form.productKind,
      salesChannels,
      shortDescriptionFa: form.shortDescriptionFa,
      descriptionFa: form.descriptionFa,
      image: form.image,
      tags: form.tagsText
        .split(/[،,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      specs: textToSpecs(form.specsText),
      retailPriceRial: Math.round(form.retailPriceToman) * 10,
      wholesalePriceRial: Math.round(form.wholesalePriceToman) * 10,
      wholesaleEnabled: form.wholesaleEnabled,
      cartonSize: form.cartonSize,
      minWholesaleCartonCount: form.minWholesaleCartonCount,
      onHand: form.onHand,
      restockThreshold: form.restockThreshold,
      isActive: form.isActive,
    };
    const response = await fetch(
      form.id ? `/api/admin/products/${encodeURIComponent(form.id)}` : "/api/admin/products",
      {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = (await response.json()) as { message?: string; error?: string };
    setStatus(data.message ?? data.error ?? "پاسخ نامشخص");
    if (response.ok) {
      setForm(emptyForm);
      await fetchRows();
    }
    setLoading(false);
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/storage/upload", { method: "POST", body: formData });
    const data = (await response.json()) as {
      file?: { key: string; url?: string };
      error?: string;
      message?: string;
    };
    if (data.file?.url) {
      update("image", data.file.url);
      setStatus("تصویر آپلود و لینک عمومی در فرم قرار گرفت.");
    } else {
      setStatus(data.error ?? `فایل آپلود شد؛ کلید ذخیره‌سازی: ${data.file?.key ?? "-"}`);
    }
    setLoading(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative min-w-[18rem] flex-1">
            <Search
              className="pointer-events-none absolute right-3 top-3 text-[#5F6C79]"
              size={18}
            />
            <Input
              className="pr-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در نام، برند، SKU"
            />
          </label>
          <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
            <Plus size={17} />
            محصول جدید
          </Button>
        </div>
        <div className="overflow-x-auto rounded-md border border-[#D7DDE4] bg-white">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-[#EEF3F8] text-[#4C5A67]">
              <tr>
                <th className="px-4 py-3 text-right">محصول</th>
                <th className="px-4 py-3 text-right">دسته</th>
                <th className="px-4 py-3 text-right">خرده</th>
                <th className="px-4 py-3 text-right">عمده</th>
                <th className="px-4 py-3 text-right">موجودی</th>
                <th className="px-4 py-3 text-right">کانال</th>
                <th className="px-4 py-3 text-right">ویرایش</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 120).map((row) => (
                <tr key={row.product.id} className="border-t border-[#E2E7ED] align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold">{row.product.nameFa}</p>
                    <p className="text-xs text-[#5F6C79]" dir="ltr">
                      {row.product.nameEn ?? row.product.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.categoryNameFa}</td>
                  <td className="px-4 py-3">
                    <Price valueRial={row.variant.retailPriceRial} />
                  </td>
                  <td className="px-4 py-3">
                    {row.variant.wholesaleEnabled === false ? (
                      <Badge tone="warning">غیرفعال</Badge>
                    ) : (
                      <Price valueRial={row.variant.wholesalePriceRial} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat("fa-IR").format(row.inventory.onHand)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(row.product.salesChannels ?? ["retail", "wholesale"]).map((channel) => (
                        <Badge key={channel} tone={channel === "wholesale" ? "info" : "success"}>
                          {channel === "wholesale" ? "عمده" : "تک"}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <IconButton
                      label="ویرایش"
                      className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]"
                      onClick={() => setForm(rowToForm(row))}
                    >
                      <Edit3 size={17} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[#5F6C79]" role="status">
          {status}
        </p>
      </section>

      <aside className="h-fit rounded-md border border-[#D7DDE4] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{form.id ? "ویرایش محصول" : "ایجاد محصول"}</h2>
          <Badge tone={form.isActive ? "success" : "warning"}>
            {form.isActive ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            نام فارسی
            <Input value={form.nameFa} onChange={(event) => update("nameFa", event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            نام لاتین
            <Input
              dir="ltr"
              value={form.nameEn}
              onChange={(event) => update("nameEn", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Slug
            <Input
              dir="ltr"
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="grid gap-1 text-sm">
              دسته
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
                value={form.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameFa}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              برند
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
                value={form.brandId}
                onChange={(event) => update("brandId", event.target.value)}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.nameFa}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            نوع محصول
            <select
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
              value={form.productKind}
              onChange={(event) => update("productKind", event.target.value as ProductKind)}
            >
              {productKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              قیمت تک تومان
              <Input
                type="number"
                value={form.retailPriceToman}
                onChange={(event) => update("retailPriceToman", Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1 text-sm">
              قیمت عمده تومان
              <Input
                type="number"
                value={form.wholesalePriceToman}
                onChange={(event) => update("wholesalePriceToman", Number(event.target.value))}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              موجودی
              <Input
                type="number"
                value={form.onHand}
                onChange={(event) => update("onHand", Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1 text-sm">
              کارتن
              <Input
                type="number"
                value={form.cartonSize}
                onChange={(event) => update("cartonSize", Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1 text-sm">
              حداقل
              <Input
                type="number"
                value={form.minWholesaleCartonCount}
                onChange={(event) => update("minWholesaleCartonCount", Number(event.target.value))}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.retailEnabled}
                onChange={(event) => update("retailEnabled", event.target.checked)}
              />{" "}
              تک‌فروشی
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.wholesaleEnabled}
                onChange={(event) => update("wholesaleEnabled", event.target.checked)}
              />{" "}
              عمده
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
              />{" "}
              فعال
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            تصویر یا URL
            <Input
              dir="ltr"
              value={form.image}
              onChange={(event) => update("image", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            آپلود تصویر در Storage
            <span className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => void uploadImage(event.target.files?.[0] ?? null)}
              />
              <UploadCloud className="shrink-0 text-[#168BFF]" size={22} />
            </span>
          </label>
          <label className="grid gap-1 text-sm">
            تگ‌ها
            <Textarea
              value={form.tagsText}
              onChange={(event) => update("tagsText", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            مشخصات فنی
            <Textarea
              value={form.specsText}
              onChange={(event) => update("specsText", event.target.value)}
              placeholder="باتری: ۸۰۰mAh"
            />
          </label>
          <label className="grid gap-1 text-sm">
            توضیح کوتاه
            <Textarea
              value={form.shortDescriptionFa}
              onChange={(event) => update("shortDescriptionFa", event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            توضیحات کامل
            <Textarea
              value={form.descriptionFa}
              onChange={(event) => update("descriptionFa", event.target.value)}
            />
          </label>
          <Button type="button" onClick={saveProduct} disabled={loading}>
            <Save size={17} />
            ذخیره محصول
          </Button>
        </div>
      </aside>
    </div>
  );
}
