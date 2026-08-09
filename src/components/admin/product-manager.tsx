"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  Check,
  Edit3,
  FileImage,
  Filter,
  ImagePlus,
  LayoutGrid,
  Link2,
  Palette,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { Badge, Button, IconButton, Input, Price, Textarea } from "@ufo/ui";
import {
  getProductColorOptions,
  getSuggestedProductColorIds,
  productColorPalette,
} from "@ufo/domain";
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
  images: string[];
  colorIds: string[];
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
  { value: "e-liquid", label: "جویس" },
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
  images: ["/images/ufo-hero.png"],
  colorIds: [],
  tagsText: "",
  specsText: "",
  shortDescriptionFa: "",
  descriptionFa: "",
  isActive: true,
};

function rialToToman(value: number) {
  return Math.round(value / 10);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
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

function uniqueImages(images: string[]) {
  return images
    .map((item) => item.trim())
    .filter((item, index, list) => item && list.indexOf(item) === index);
}

function rowToForm(row: AdminProductRecord): FormState {
  const images = uniqueImages([row.product.image, ...(row.product.images ?? [])]);
  const colorIds = getProductColorOptions(row.product).map((color) => color.id);
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
    image: images[0] ?? row.product.image,
    images,
    colorIds,
    tagsText: row.product.tags.join("، "),
    specsText: specsToText(row.product.specs),
    shortDescriptionFa: row.product.shortDescriptionFa,
    descriptionFa: row.product.descriptionFa,
    isActive: row.product.isActive,
  };
}

function channelLabel(channel: SalesChannel) {
  return channel === "wholesale" ? "عمده" : "تکی";
}

function imageMarkup(url: string) {
  return `\n\n![تصویر محصول](${url})\n\n`;
}

function videoMarkup(url: string) {
  return `\n\n[ویدیو محصول](${url})\n\n`;
}

export function ProductManager() {
  const [rows, setRows] = useState<AdminProductRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<"all" | SalesChannel>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [status, setStatus] = useState("در حال بارگذاری...");
  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

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

  const summary = useMemo(() => {
    const active = rows.filter((row) => row.product.isActive).length;
    const retail = rows.filter((row) => row.product.salesChannels?.includes("retail")).length;
    const wholesale = rows.filter((row) => row.product.salesChannels?.includes("wholesale")).length;
    const lowStock = rows.filter(
      (row) => row.inventory.onHand - row.inventory.reserved <= row.inventory.restockThreshold,
    ).length;
    return { active, retail, wholesale, lowStock };
  }, [rows]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack = [
        row.product.nameFa,
        row.product.nameEn,
        row.product.slug,
        row.variant.sku,
        row.brandNameFa,
        row.categoryNameFa,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesCategory = categoryFilter === "all" || row.product.categoryId === categoryFilter;
      const channels = row.product.salesChannels ?? ["retail", "wholesale"];
      const matchesChannel = channelFilter === "all" || channels.includes(channelFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? row.product.isActive : !row.product.isActive);
      return matchesQuery && matchesCategory && matchesChannel && matchesStatus;
    });
  }, [categoryFilter, channelFilter, query, rows, statusFilter]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleColor(colorId: string) {
    setForm((current) => {
      const exists = current.colorIds.includes(colorId);
      return {
        ...current,
        colorIds: exists
          ? current.colorIds.filter((item) => item !== colorId)
          : [...current.colorIds, colorId],
      };
    });
  }

  function applySuggestedColors() {
    const pseudoProduct = {
      id: form.id ?? "draft",
      slug: form.slug,
      nameFa: form.nameFa,
      brandId: form.brandId,
      categoryId: form.categoryId,
      productKind: form.productKind,
      salesChannels: [],
      shortDescriptionFa: "",
      descriptionFa: "",
      image: form.image,
      images: form.images,
      tags: [],
      attributes: [],
      isActive: true,
      isAgeRestricted: true,
      seoTitle: "",
      seoDescription: "",
      createdAt: "",
      updatedAt: "",
    };
    update("colorIds", getSuggestedProductColorIds(pseudoProduct));
  }

  function openCreate() {
    setForm(emptyForm);
    setManualImageUrl("");
    setVideoUrl("");
    setIsEditorOpen(true);
  }

  function openEdit(row: AdminProductRecord) {
    setForm(rowToForm(row));
    setManualImageUrl("");
    setVideoUrl("");
    setIsEditorOpen(true);
  }

  function setImages(images: string[]) {
    const nextImages = uniqueImages(images);
    setForm((current) => ({
      ...current,
      images: nextImages,
      image: nextImages[0] ?? current.image,
    }));
  }

  function addManualImage() {
    if (!manualImageUrl.trim()) return;
    setImages([...form.images, manualImageUrl]);
    setManualImageUrl("");
  }

  function removeImage(url: string) {
    setImages(form.images.filter((item) => item !== url));
  }

  function makePrimaryImage(url: string) {
    setImages([url, ...form.images.filter((item) => item !== url)]);
  }

  function appendToDescription(fragment: string) {
    update("descriptionFa", `${form.descriptionFa.trim()}${fragment}`.trim());
  }

  async function saveProduct() {
    setLoading(true);
    const salesChannels: SalesChannel[] = [
      ...(form.retailEnabled ? ["retail" as const] : []),
      ...(form.wholesaleEnabled ? ["wholesale" as const] : []),
    ];
    const images = uniqueImages([form.image, ...form.images]);
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
      image: images[0] ?? form.image,
      images,
      tags: form.tagsText
        .split(/[،,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      specs: textToSpecs(form.specsText),
      colorIds: form.colorIds,
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
      setIsEditorOpen(false);
      await fetchRows();
    }
    setLoading(false);
  }

  async function uploadImages(files: FileList | File[]) {
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (accepted.length === 0) return;
    setLoading(true);
    const uploadedUrls: string[] = [];
    for (const file of accepted) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/storage/upload", { method: "POST", body: formData });
      const data = (await response.json()) as {
        file?: { key: string; url?: string };
        error?: string;
        message?: string;
      };
      if (data.file?.url) uploadedUrls.push(data.file.url);
      if (!response.ok) setStatus(data.error ?? "آپلود یکی از تصاویر ناموفق بود.");
    }
    if (uploadedUrls.length > 0) {
      setImages([...form.images, ...uploadedUrls]);
      setStatus(`${formatNumber(uploadedUrls.length)} تصویر به گالری محصول اضافه شد.`);
    }
    setLoading(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void uploadImages(event.dataTransfer.files);
  }

  const wholesaleCartonToman = form.wholesalePriceToman * Math.max(1, form.cartonSize);
  const minimumWholesaleToman = wholesaleCartonToman * Math.max(1, form.minWholesaleCartonCount);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-md border border-[#D7DDE4] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: "کل محصولات", value: rows.length },
              { label: "فعال", value: summary.active },
              { label: "کانال عمده", value: summary.wholesale },
              { label: "نیازمند شارژ", value: summary.lowStock },
            ].map((item) => (
              <div key={item.label} className="rounded-md bg-[#F4F6F8] p-3">
                <p className="text-xs text-[#5F6C79]">{item.label}</p>
                <p className="mt-1 text-xl font-black tabular-nums">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus size={17} aria-hidden="true" />
            محصول جدید
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(10rem,12rem))]">
          <label className="relative">
            <span className="sr-only">جستجو در محصولات</span>
            <Search
              className="pointer-events-none absolute right-3 top-3 text-[#5F6C79]"
              size={18}
              aria-hidden="true"
            />
            <Input
              className="pr-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در نام، برند، SKU"
            />
          </label>
          <label className="relative">
            <span className="sr-only">فیلتر دسته</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">همه دسته‌ها</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameFa}
                </option>
              ))}
            </select>
          </label>
          <label className="relative">
            <span className="sr-only">فیلتر کانال فروش</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value as "all" | SalesChannel)}
            >
              <option value="all">همه کانال‌ها</option>
              <option value="retail">فروش تکی</option>
              <option value="wholesale">فروش عمده</option>
            </select>
          </label>
          <label className="relative">
            <span className="sr-only">فیلتر وضعیت</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | "active" | "inactive")
              }
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#5F6C79]" role="status">
          <Filter size={16} aria-hidden="true" />
          {formatNumber(filtered.length)} نتیجه از {formatNumber(rows.length)} محصول
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#D7DDE4] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-[#EEF3F8] text-[#4C5A67]">
              <tr>
                <th className="px-4 py-3 text-right">محصول</th>
                <th className="px-4 py-3 text-right">دسته</th>
                <th className="px-4 py-3 text-right">قیمت تکی</th>
                <th className="px-4 py-3 text-right">قیمت عمده</th>
                <th className="px-4 py-3 text-right">موجودی</th>
                <th className="px-4 py-3 text-right">کانال</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">ویرایش</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 140).map((row) => {
                const channels = row.product.salesChannels ?? ["retail", "wholesale"];
                const available = row.inventory.onHand - row.inventory.reserved;
                const colors = getProductColorOptions(row.product);
                return (
                  <tr key={row.product.id} className="border-t border-[#E2E7ED] align-middle">
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
                          {colors.length > 0 ? (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                              {colors.slice(0, 5).map((color) => (
                                <span
                                  key={color.id}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#D7DDE4] bg-white px-2 py-1 text-[11px] text-[#4C5A67]"
                                  title={color.labelFa}
                                >
                                  <span
                                    className="h-3 w-3 rounded-full border border-slate-300"
                                    style={{ backgroundColor: color.hex }}
                                    aria-hidden="true"
                                  />
                                  {color.labelFa}
                                </span>
                              ))}
                              {colors.length > 5 ? (
                                <span className="text-[11px] text-[#5F6C79]">
                                  +{formatNumber(colors.length - 5)}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.categoryNameFa}</td>
                    <td className="px-4 py-3">
                      <Price valueRial={row.variant.retailPriceRial} />
                    </td>
                    <td className="px-4 py-3">
                      {row.variant.wholesaleEnabled === false ? (
                        <Badge tone="warning">غیرفعال</Badge>
                      ) : (
                        <div>
                          <Price valueRial={row.variant.wholesalePriceRial} />
                          <p className="mt-1 text-xs text-[#5F6C79]">
                            هر عدد در عمده، کارتن {formatNumber(row.variant.cartonSize)} عددی
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold tabular-nums">{formatNumber(available)}</span>
                      <span className="text-xs text-[#5F6C79]"> قابل فروش</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {channels.map((channel) => (
                          <Badge key={channel} tone={channel === "wholesale" ? "info" : "success"}>
                            {channelLabel(channel)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={row.product.isActive ? "success" : "warning"}>
                        {row.product.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <IconButton
                        label="ویرایش محصول"
                        className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]"
                        onClick={() => openEdit(row)}
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
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5F6C79]">
            محصولی با این فیلتر پیدا نشد.
          </div>
        ) : null}
      </section>

      <p className="text-sm text-[#5F6C79]" role="status">
        {status}
      </p>

      <DialogPrimitive.Root open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(96vw,76rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md bg-white text-[#17202A] shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-3 border-b border-[#D7DDE4] px-5 py-4">
              <div>
                <DialogPrimitive.Title className="text-xl font-black">
                  {form.id ? "ویرایش محصول" : "ایجاد محصول"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-[#5F6C79]">
                  اطلاعات فروش تکی و عمده، گالری محصول و محتوای توضیحات را یکجا مدیریت کنید.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <IconButton label="بستن" className="border-[#D7DDE4] bg-[#EEF3F8] text-[#17202A]">
                  <X size={18} aria-hidden="true" />
                </IconButton>
              </DialogPrimitive.Close>
            </div>

            <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-5 py-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="grid gap-5">
                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <LayoutGrid size={18} className="text-[#168BFF]" aria-hidden="true" />
                      <h3 className="font-black">اطلاعات پایه</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1 text-sm">
                        نام فارسی
                        <Input
                          value={form.nameFa}
                          onChange={(event) => update("nameFa", event.target.value)}
                        />
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
                      <label className="grid gap-1 text-sm">
                        نوع محصول
                        <select
                          className="min-h-11 rounded-md border border-slate-300 bg-white px-3"
                          value={form.productKind}
                          onChange={(event) =>
                            update("productKind", event.target.value as ProductKind)
                          }
                        >
                          {productKindOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
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
                    <label className="mt-3 grid gap-1 text-sm">
                      توضیح کوتاه
                      <Textarea
                        className="min-h-20"
                        value={form.shortDescriptionFa}
                        onChange={(event) => update("shortDescriptionFa", event.target.value)}
                      />
                    </label>
                  </section>

                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Palette size={18} className="text-[#168BFF]" aria-hidden="true" />
                        <div>
                          <h3 className="font-black">رنگ‌های قابل سفارش</h3>
                          <p className="mt-1 text-xs leading-5 text-[#5F6C79]">
                            فقط وقتی رنگی انتخاب شود، بخش رنگ در صفحه محصول و کارت‌های لیست نمایش
                            داده می‌شود. برای کویل و کارتریج می‌توانید این بخش را خالی بگذارید.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={applySuggestedColors}
                        >
                          پیشنهاد بر اساس نوع
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-[#D7DDE4] text-[#17202A] hover:bg-[#EEF3F8]"
                          onClick={() => update("colorIds", [])}
                        >
                          بدون رنگ
                        </Button>
                      </div>
                    </div>
                    <div
                      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                      role="group"
                      aria-label="رنگ‌های محصول"
                    >
                      {productColorPalette.map((color) => {
                        const active = form.colorIds.includes(color.id);
                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => toggleColor(color.id)}
                            className={`flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${
                              active
                                ? "border-cyan-500 bg-cyan-50 text-cyan-950"
                                : "border-[#D7DDE4] bg-white text-[#17202A] hover:bg-[#F4F6F8]"
                            }`}
                            aria-pressed={active}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-5 w-5 rounded-full border border-slate-300"
                                style={{ backgroundColor: color.hex }}
                                aria-hidden="true"
                              />
                              {color.labelFa}
                            </span>
                            {active ? <Check size={16} aria-hidden="true" /> : null}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-[#5F6C79]" role="status">
                      {form.colorIds.length > 0
                        ? `${formatNumber(form.colorIds.length)} رنگ برای این محصول فعال است.`
                        : "برای این محصول رنگی تعریف نشده است."}
                    </p>
                  </section>

                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ImagePlus size={18} className="text-[#168BFF]" aria-hidden="true" />
                      <h3 className="font-black">گالری تصاویر محصول</h3>
                    </div>
                    <label
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed p-5 text-center transition ${
                        isDragging
                          ? "border-[#168BFF] bg-[#E8F3FF]"
                          : "border-[#B8C4D2] bg-[#F8FAFC] hover:bg-[#F4F6F8]"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => void uploadImages(event.target.files ?? [])}
                      />
                      <span className="grid place-items-center gap-2">
                        <UploadCloud size={28} className="text-[#168BFF]" aria-hidden="true" />
                        <span className="font-bold">تصاویر را اینجا رها کنید یا انتخاب کنید</span>
                        <span className="text-xs text-[#5F6C79]">
                          امکان انتخاب چند تصویر برای محصول تکی و عمده
                        </span>
                      </span>
                    </label>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        dir="ltr"
                        value={manualImageUrl}
                        onChange={(event) => setManualImageUrl(event.target.value)}
                        placeholder="https://... یا /images/product.png"
                      />
                      <Button type="button" variant="secondary" onClick={addManualImage}>
                        <Link2 size={17} aria-hidden="true" />
                        افزودن URL
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {form.images.map((url) => (
                        <div
                          key={url}
                          className="overflow-hidden rounded-md border border-[#D7DDE4] bg-[#F8FAFC]"
                        >
                          <div className="relative aspect-[4/3]">
                            <Image
                              src={url}
                              alt="تصویر محصول"
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 p-2">
                            {url === form.image ? (
                              <Badge tone="success">تصویر اصلی</Badge>
                            ) : (
                              <span />
                            )}
                            <div className="flex gap-1">
                              <IconButton
                                label="انتخاب تصویر اصلی"
                                className="h-9 w-9 border-[#D7DDE4] bg-white text-[#17202A]"
                                onClick={() => makePrimaryImage(url)}
                              >
                                <Check size={15} aria-hidden="true" />
                              </IconButton>
                              <IconButton
                                label="حذف تصویر"
                                className="h-9 w-9 border-rose-200 bg-rose-50 text-rose-700"
                                onClick={() => removeImage(url)}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <FileImage size={18} className="text-[#168BFF]" aria-hidden="true" />
                      <h3 className="font-black">توضیحات ترکیبی</h3>
                    </div>
                    <div className="grid gap-3">
                      <Textarea
                        className="min-h-48"
                        value={form.descriptionFa}
                        onChange={(event) => update("descriptionFa", event.target.value)}
                        placeholder="متن توضیح، تصویر یا لینک ویدیو را به ترتیب محتوای صفحه محصول وارد کنید."
                      />
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                        <Input
                          dir="ltr"
                          value={videoUrl}
                          onChange={(event) => setVideoUrl(event.target.value)}
                          placeholder="لینک ویدیو یا تصویر برای درج در توضیحات"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            appendToDescription(imageMarkup(videoUrl || form.image));
                            setVideoUrl("");
                          }}
                        >
                          <ImagePlus size={17} aria-hidden="true" />
                          بلوک عکس
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (!videoUrl.trim()) return;
                            appendToDescription(videoMarkup(videoUrl));
                            setVideoUrl("");
                          }}
                        >
                          <Video size={17} aria-hidden="true" />
                          بلوک ویدیو
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="grid h-fit gap-5">
                  <section className="rounded-md border border-[#D7DDE4] bg-[#F8FAFC] p-4">
                    <h3 className="font-black">کانال فروش</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      <label className="flex min-h-11 items-center justify-between rounded-md border border-[#D7DDE4] bg-white px-3">
                        فروش تکی
                        <input
                          type="checkbox"
                          checked={form.retailEnabled}
                          onChange={(event) => update("retailEnabled", event.target.checked)}
                        />
                      </label>
                      <label className="flex min-h-11 items-center justify-between rounded-md border border-[#D7DDE4] bg-white px-3">
                        فروش عمده
                        <input
                          type="checkbox"
                          checked={form.wholesaleEnabled}
                          onChange={(event) => update("wholesaleEnabled", event.target.checked)}
                        />
                      </label>
                      <label className="flex min-h-11 items-center justify-between rounded-md border border-[#D7DDE4] bg-white px-3">
                        فعال در سایت
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(event) => update("isActive", event.target.checked)}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <h3 className="font-black">قیمت و بسته‌بندی</h3>
                    <div className="mt-3 grid gap-3">
                      <label className="grid gap-1 text-sm">
                        قیمت فروش تکی هر عدد (تومان)
                        <Input
                          type="number"
                          min={0}
                          value={form.retailPriceToman}
                          onChange={(event) =>
                            update("retailPriceToman", Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        قیمت عمده هر عدد داخل کارتن (تومان)
                        <Input
                          type="number"
                          min={0}
                          value={form.wholesalePriceToman}
                          onChange={(event) =>
                            update("wholesalePriceToman", Number(event.target.value))
                          }
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1 text-sm">
                          تعداد در کارتن
                          <Input
                            type="number"
                            min={1}
                            value={form.cartonSize}
                            onChange={(event) => update("cartonSize", Number(event.target.value))}
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          حداقل کارتن
                          <Input
                            type="number"
                            min={1}
                            value={form.minWholesaleCartonCount}
                            onChange={(event) =>
                              update("minWholesaleCartonCount", Number(event.target.value))
                            }
                          />
                        </label>
                      </div>
                      <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950">
                        <p className="font-bold">شفاف‌سازی قیمت عمده</p>
                        <p className="mt-1 leading-6">
                          قیمت واردشده برای هر عدد در خرید عمده است. قیمت هر کارتن:{" "}
                          {formatNumber(wholesaleCartonToman)} تومان. حداقل سفارش عمده:{" "}
                          {formatNumber(minimumWholesaleToman)} تومان.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <h3 className="font-black">موجودی و SEO</h3>
                    <div className="mt-3 grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1 text-sm">
                          موجودی کل
                          <Input
                            type="number"
                            min={0}
                            value={form.onHand}
                            onChange={(event) => update("onHand", Number(event.target.value))}
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          هشدار شارژ
                          <Input
                            type="number"
                            min={0}
                            value={form.restockThreshold}
                            onChange={(event) =>
                              update("restockThreshold", Number(event.target.value))
                            }
                          />
                        </label>
                      </div>
                      <label className="grid gap-1 text-sm">
                        تگ‌ها
                        <Textarea
                          className="min-h-20"
                          value={form.tagsText}
                          onChange={(event) => update("tagsText", event.target.value)}
                          placeholder="پاد، عمده، یوفوپاف"
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        مشخصات فنی
                        <Textarea
                          className="min-h-28"
                          value={form.specsText}
                          onChange={(event) => update("specsText", event.target.value)}
                          placeholder="باتری: ۸۰۰mAh"
                        />
                      </label>
                    </div>
                  </section>
                </aside>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D7DDE4] bg-[#F8FAFC] px-5 py-4">
              <p className="text-sm text-[#5F6C79]" role="status">
                {loading ? "در حال ذخیره..." : status}
              </p>
              <div className="flex gap-2">
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="secondary">
                    انصراف
                  </Button>
                </DialogPrimitive.Close>
                <Button type="button" onClick={saveProduct} disabled={loading}>
                  <Save size={17} aria-hidden="true" />
                  ذخیره محصول
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
