"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleOff,
  FileImage,
  Gauge,
  ImagePlus,
  LayoutGrid,
  Palette,
  Plus,
  Save,
  Search,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { Button, IconButton, Input, Textarea } from "@ufo/ui";
import {
  getDefaultProductVariantType,
  getProductColorOptions,
  getProductFlavorOptions,
  getSuggestedProductVariantValueIds,
  productColorPalette,
  productFlavorCatalog,
  type ProductColorOption,
} from "@ufo/domain";
import type {
  Brand,
  Category,
  InventoryItem,
  Product,
  ProductFlavor,
  ProductKind,
  ProductSpec,
  ProductVariant,
  ProductVariantType,
  SalesChannel,
} from "@ufo/types";

import dynamic from "next/dynamic";
import { ProductFilters, emptyFilters, type FilterState } from "./products/product-filters";
import { ProductTable } from "./products/product-table";
import { Pagination } from "./products/pagination";
import { BulkActions, ConfirmationDialog } from "./products/bulk-actions";
import { ProductTabs, type ProductTab } from "./products/product-tabs";
import { SearchableSelect } from "./products/searchable-select";
import { PriceInput } from "./products/price-input";
import type { ProductListRow, ProductQuery } from "@/lib/admin-product-query";
import type { BulkProductInput } from "@/lib/admin-product-bulk";
const ImageManager = dynamic(() => import("./products/image-manager"), {
  loading: () => <p role="status">در حال آماده‌سازی تصاویر…</p>,
});

interface AdminProductRecord {
  product: Product;
  variant: ProductVariant;
  inventory: InventoryItem;
  brandNameFa: string;
  categoryNameFa: string;
}

interface FormState {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
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
  variantType: ProductVariantType;
  variantValueIds: string[];
  variantImages: Record<string, string>;
  tagsText: string;
  specsText: string;
  shortDescriptionFa: string;
  descriptionFa: string;
  isActive: boolean;
}

interface PendingImageUpload {
  id: string;
  name: string;
  previewUrl: string;
  failed: boolean;
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
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
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
  image: "/images/ufo-hero.webp",
  images: ["/images/ufo-hero.webp"],
  variantType: "flavor",
  variantValueIds: [],
  variantImages: {},
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

function summarizeFileLike(value: unknown) {
  if (typeof File !== "undefined" && value instanceof File) {
    return { name: value.name, size: value.size, type: value.type };
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : undefined,
      size: typeof record.size === "number" ? record.size : undefined,
      type: typeof record.type === "string" ? record.type : undefined,
    };
  }
  return value;
}

function summarizeImageField(value: unknown) {
  if (typeof value === "string") return value;
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof File !== "undefined" && value instanceof File) return summarizeFileLike(value);
  if (typeof value === "object") return { type: "object", keys: Object.keys(value) };
  return { type: typeof value, value };
}

function getImageCandidateDebug(value: unknown, index?: number) {
  if (typeof File !== "undefined" && value instanceof File) {
    return {
      index,
      type: "file",
      file: summarizeFileLike(value),
    };
  }
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  return {
    index,
    type: value === null ? "null" : typeof value,
    value: typeof value === "string" ? value : undefined,
    url: record ? summarizeImageField(record.url) : undefined,
    id: record ? summarizeImageField(record.id) : undefined,
    file: record ? summarizeFileLike(record.file) : undefined,
    previewUrl: record ? summarizeImageField(record.previewUrl) : undefined,
  };
}

function normalizeImageUrl(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.url === "string") return record.url.trim();
    if (typeof record.previewUrl === "string") return record.previewUrl.trim();
  }
  return "";
}

function logImageDebug(stage: string, payload: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[ProductManager:image] ${stage}`, payload);
  }
}

function getModalLayoutDebug() {
  if (typeof document === "undefined") return null;
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  const scroller = dialog?.querySelector<HTMLElement>(".min-h-0.flex-1.overflow-y-auto");
  const footer = dialog?.lastElementChild;
  const dialogRect = dialog?.getBoundingClientRect();
  const scrollerRect = scroller?.getBoundingClientRect();
  const footerRect = footer?.getBoundingClientRect();
  return {
    activeElement: document.activeElement
      ? {
          tag: document.activeElement.tagName.toLowerCase(),
          className: document.activeElement.getAttribute("class"),
          ariaLabel: document.activeElement.getAttribute("aria-label"),
        }
      : null,
    body: {
      scrollTop: document.documentElement.scrollTop,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
    },
    dialog: dialogRect
      ? {
          top: dialogRect.top,
          bottom: dialogRect.bottom,
          height: dialogRect.height,
          clientHeight: dialog?.clientHeight,
          scrollHeight: dialog?.scrollHeight,
          overflowY: dialog ? window.getComputedStyle(dialog).overflowY : undefined,
        }
      : null,
    scroller: scrollerRect
      ? {
          top: scrollerRect.top,
          bottom: scrollerRect.bottom,
          height: scrollerRect.height,
          scrollTop: scroller?.scrollTop,
          clientHeight: scroller?.clientHeight,
          scrollHeight: scroller?.scrollHeight,
          overflowY: scroller ? window.getComputedStyle(scroller).overflowY : undefined,
        }
      : null,
    footer: footerRect
      ? {
          top: footerRect.top,
          bottom: footerRect.bottom,
          height: footerRect.height,
          insideDialog: dialogRect
            ? footerRect.top >= dialogRect.top && footerRect.bottom <= dialogRect.bottom
            : false,
        }
      : null,
  };
}

function logModalLayoutDebug(stage: string) {
  logImageDebug(stage, getModalLayoutDebug());
}

function uniqueImages(images: unknown[]) {
  return images
    .map((item, index) => {
      const url = normalizeImageUrl(item);
      if (!url) {
        logImageDebug("invalid image filtered", getImageCandidateDebug(item, index));
      }
      return url;
    })
    .filter((item, index, list) => item && list.indexOf(item) === index);
}

function getInitialVariantImages(
  valueIds: string[],
  images: string[],
  existing: Record<string, string> | undefined,
) {
  return Object.fromEntries(
    valueIds
      .map((valueId, index) => [valueId, existing?.[valueId] ?? images[index]] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
}

function getLockedVariantType(categoryId: string, productKind: ProductKind) {
  return getDefaultProductVariantType({ categoryId, productKind });
}

function getVariantTypeLabel(variantType: ProductVariantType) {
  if (variantType === "flavor") return "طعم";
  if (variantType === "color") return "رنگ";
  if (variantType === "resistance") return "اهم";
  if (variantType === "capacity") return "ظرفیت";
  return "";
}

function getVariantTypeHelp(variantType: ProductVariantType) {
  if (variantType === "flavor") return "برای این نوع محصول فقط طعم ذخیره می‌شود.";
  if (variantType === "color") return "برای این نوع محصول فقط رنگ ذخیره می‌شود.";
  if (variantType === "resistance") return "برای کویل فقط اهم ذخیره می‌شود.";
  if (variantType === "capacity") return "برای کارتریج فقط ظرفیت ذخیره می‌شود.";
  return "برای این نوع محصول تنوع انتخابی ذخیره نمی‌شود.";
}

function rowToForm(row: AdminProductRecord): FormState {
  const images = uniqueImages([row.product.image, ...(row.product.images ?? [])]);
  const variantType = getLockedVariantType(
    row.product.categoryId,
    row.product.productKind ?? "disposable",
  );
  const variantValueIds = row.product.variantValueIds?.length
    ? row.product.variantValueIds
    : variantType === "flavor"
      ? getProductFlavorOptions(row.product).map((flavor) => flavor.id)
      : variantType === "color"
        ? getProductColorOptions(row.product).map((color) => color.id)
        : [];
  return {
    seoTitle: row.product.seoTitle,
    seoDescription: row.product.seoDescription,
    seoKeywords: (row.product.seoKeywords ?? []).join("، "),
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
    variantType,
    variantValueIds,
    variantImages: getInitialVariantImages(
      variantValueIds,
      images,
      row.product.variantImages ?? row.product.colorImages,
    ),
    tagsText: row.product.tags.join("، "),
    specsText: specsToText(row.product.specs),
    shortDescriptionFa: row.product.shortDescriptionFa,
    descriptionFa: row.product.descriptionFa,
    isActive: row.product.isActive,
  };
}

function imageMarkup(url: string) {
  return `\n\n![تصویر محصول](${url})\n\n`;
}

function videoMarkup(url: string) {
  return `\n\n[ویدیو محصول](${url})\n\n`;
}

export function ProductManager() {
  const [rows, setRows] = useState<ProductListRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [flavors, setFlavors] = useState<ProductFlavor[]>(productFlavorCatalog);
  const [colors, setColors] = useState<ProductColorOption[]>(productColorPalette);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [flavorQuery, setFlavorQuery] = useState("");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetchingRows, setIsFetchingRows] = useState(true);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [pendingImageUploads, setPendingImageUploads] = useState<PendingImageUpload[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFlavorDialogOpen, setIsFlavorDialogOpen] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ nameFa: "", slug: "" });
  const [brandError, setBrandError] = useState("");
  const [newFlavor, setNewFlavor] = useState({ nameFa: "", nameEn: "", slug: "", iconKey: "" });
  const [newColor, setNewColor] = useState({ labelFa: "", id: "", hex: "#168BFF" });

  const [videoUrl, setVideoUrl] = useState("");
  const [customVariantValue, setCustomVariantValue] = useState("");

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<ProductQuery["sort"]>("updatedAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [reload, setReload] = useState(0);
  const [activeTab, setActiveTab] = useState<ProductTab>("basic");
  const [baseline, setBaseline] = useState(JSON.stringify(emptyForm));
  const [discardOpen, setDiscardOpen] = useState(false);
  const [bulkFailures, setBulkFailures] = useState<Array<{ id: string; error: string }>>([]);
  const [editorFetching, setEditorFetching] = useState(false);
  const fetchSequence = useRef(0);
  const dirty = isEditorOpen && JSON.stringify(form) !== baseline;

  function changeFilters(next: FilterState) {
    setFilters(next);
    setPage(1);
    setSelected([]);
  }
  const fetchRows = useCallback(() => {
    setReload((value) => value + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++fetchSequence.current;
    setIsFetchingRows(true);
    setFetchError("");
    setSelected([]);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          ...filters,
          page: String(page),
          pageSize: String(pageSize),
          sort,
          direction,
        });
        const response = await fetch(`/api/admin/products?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "دریافت محصولات ناموفق بود.");
        if (sequence !== fetchSequence.current || controller.signal.aborted) return;
        setRows(data.rows);
        setTotal(data.total);
        setPage(data.page);
        setCategories(data.categories);
        setBrands(data.brands);
      } catch (error) {
        if (!controller.signal.aborted && sequence === fetchSequence.current) {
          setRows([]);
          setTotal(0);
          setFetchError(error instanceof Error ? error.message : "دریافت محصولات ناموفق بود.");
        }
      } finally {
        if (!controller.signal.aborted && sequence === fetchSequence.current)
          setIsFetchingRows(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [filters, page, pageSize, sort, direction, reload]);
  useEffect(() => {
    if (!isEditorOpen) return;
    const controller = new AbortController();
    Promise.all([
      fetch("/api/admin/flavors", { signal: controller.signal }),
      fetch("/api/admin/colors", { signal: controller.signal }),
    ])
      .then(async ([a, b]) => {
        if (!a.ok || !b.ok) throw new Error();
        const [fa, co] = await Promise.all([a.json(), b.json()]);
        if (!controller.signal.aborted) {
          setFlavors(fa.flavors);
          setColors(co.colors);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStatus("دریافت فهرست تنوع‌ها ناموفق بود؛ پیش از ذخیره دوباره تلاش کنید.");
      });
    return () => controller.abort();
  }, [isEditorOpen]);
  useEffect(() => {
    if (!dirty && !isUploadingImages) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, isUploadingImages]);
  function closeEditor() {
    if (loading || isUploadingImages) {
      setStatus("تا پایان عملیات صبر کنید.");
      return;
    }
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    clearPendingImageUploads();
    setIsEditorOpen(false);
  }
  async function applyBulk(input: BulkProductInput) {
    setLoading(true);
    setBulkFailures([]);
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "عملیات ناموفق بود.");
      setStatus(
        `${data.succeeded.length.toLocaleString("fa-IR")} محصول تغییر کرد؛ ${data.failed.length.toLocaleString("fa-IR")} مورد ناموفق.`,
      );
      setBulkFailures(data.failed);
      setSelected([]);
      fetchRows();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "عملیات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateProductKind(productKind: ProductKind) {
    setForm((current) => {
      const variantType = getLockedVariantType(current.categoryId, productKind);
      return {
        ...current,
        productKind,
        variantType,
        variantValueIds: current.variantType === variantType ? current.variantValueIds : [],
        variantImages: current.variantType === variantType ? current.variantImages : {},
      };
    });
    setCustomVariantValue("");
  }

  function updateCategory(categoryId: string) {
    setForm((current) => {
      const variantType = getLockedVariantType(categoryId, current.productKind);
      return {
        ...current,
        categoryId,
        variantType,
        variantValueIds: current.variantType === variantType ? current.variantValueIds : [],
        variantImages: current.variantType === variantType ? current.variantImages : {},
      };
    });
    setCustomVariantValue("");
  }

  function setVariantType(variantType: ProductVariantType) {
    setForm((current) => {
      if (current.variantType === variantType) return current;
      const hasVariantData =
        current.variantValueIds.length > 0 || Object.keys(current.variantImages).length > 0;
      if (
        hasVariantData &&
        !window.confirm(
          "با تغییر نوع تنوع محصول، انتخاب‌ها و ارتباط فعلی تصاویر با گزینه‌های قبلی دیگر استفاده نخواهد شد. ادامه می‌دهید؟",
        )
      ) {
        return current;
      }
      return {
        ...current,
        variantType,
        variantValueIds: [],
        variantImages: {},
      };
    });
  }

  function toggleVariantValue(valueId: string) {
    setForm((current) => {
      const exists = current.variantValueIds.includes(valueId);
      const variantImages = { ...current.variantImages };
      if (exists) delete variantImages[valueId];
      if (!exists && current.images.length > 0) {
        const assignedImages = new Set(Object.values(variantImages));
        const fallbackImage =
          current.images.find((image) => !assignedImages.has(image)) ?? current.images[0];
        if (fallbackImage) variantImages[valueId] = fallbackImage;
      }
      return {
        ...current,
        variantValueIds: exists
          ? current.variantValueIds.filter((item) => item !== valueId)
          : [...current.variantValueIds, valueId],
        variantImages,
      };
    });
  }

  function addCustomVariantValue() {
    const valueId = customVariantValue.trim();
    if (!valueId || (form.variantType !== "resistance" && form.variantType !== "capacity")) return;
    setForm((current) => {
      const fallbackImage = current.images[0];
      return {
        ...current,
        variantValueIds: current.variantValueIds.includes(valueId)
          ? current.variantValueIds
          : [...current.variantValueIds, valueId],
        variantImages: {
          ...current.variantImages,
          ...(current.variantImages[valueId] || !fallbackImage ? {} : { [valueId]: fallbackImage }),
        },
      };
    });
    setCustomVariantValue("");
  }

  function applySuggestedVariantValues() {
    const pseudoProduct = {
      id: form.id ?? "draft",
      slug: form.slug,
      nameFa: form.nameFa,
      brandId: form.brandId,
      categoryId: form.categoryId,
      productKind: form.productKind,
      variantType: form.variantType,
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
    const variantValueIds = getSuggestedProductVariantValueIds(pseudoProduct);
    setForm((current) => ({
      ...current,
      variantValueIds,
      variantImages: getInitialVariantImages(
        variantValueIds,
        current.images,
        current.variantImages,
      ),
    }));
  }

  function openCreate() {
    clearPendingImageUploads();
    setForm({
      ...emptyForm,
      variantType: getDefaultProductVariantType({
        categoryId: emptyForm.categoryId,
        productKind: emptyForm.productKind,
      }),
    });
    setFlavorQuery("");

    setVideoUrl("");
    setCustomVariantValue("");
    setNewColor({ labelFa: "", id: "", hex: "#168BFF" });
    setBaseline(JSON.stringify(emptyForm));
    setActiveTab("basic");
    setStatus("");
    setIsEditorOpen(true);
  }

  async function openEdit(row: ProductListRow) {
    if (editorFetching || loading) return;
    setEditorFetching(true);
    setStatus("در حال دریافت محصول…");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(row.product.id)}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "دریافت محصول ناموفق بود.");
      const next = rowToForm(data.row);
      clearPendingImageUploads();
      setForm(next);
      setBaseline(JSON.stringify(next));
      setFlavorQuery("");
      setVideoUrl("");
      setCustomVariantValue("");
      setActiveTab("basic");
      setStatus("");
      setIsEditorOpen(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "دریافت محصول ناموفق بود.");
    } finally {
      setEditorFetching(false);
    }
  }

  function clearPendingImageUploads() {
    setPendingImageUploads((current) => {
      current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
      return [];
    });
  }

  function setImages(images: string[] | ((currentImages: string[]) => string[])) {
    setForm((current) => {
      const requestedImages = typeof images === "function" ? images(current.images) : images;
      logImageDebug("before image state update", {
        currentPrimary: getImageCandidateDebug(current.image),
        currentImages: current.images.map((image, index) => getImageCandidateDebug(image, index)),
        requestedImages: requestedImages.map((image, index) =>
          getImageCandidateDebug(image, index),
        ),
      });
      const nextImages = uniqueImages(requestedImages);
      logImageDebug("after image state update", {
        nextPrimary: nextImages[0] ?? normalizeImageUrl(current.image),
        nextImages: nextImages.map((image, index) => getImageCandidateDebug(image, index)),
      });
      return {
        ...current,
        images: nextImages,
        image: nextImages[0] ?? "",
        variantImages: Object.fromEntries(
          Object.entries(current.variantImages).filter(
            ([valueId, imageValue]) =>
              current.variantValueIds.includes(valueId) && nextImages.includes(imageValue),
          ),
        ),
      };
    });
  }

  function assignImageToVariantValue(image: string, valueId: string) {
    setForm((current) => {
      const variantImages = Object.fromEntries(
        Object.entries(current.variantImages).filter(
          ([assignedValueId, assignedImage]) =>
            assignedValueId !== valueId && assignedImage !== image,
        ),
      );
      return {
        ...current,
        variantImages: valueId ? { ...variantImages, [valueId]: image } : variantImages,
      };
    });
  }

  function getImageVariantValueId(image: string) {
    return (
      Object.entries(form.variantImages).find(([, imageValue]) => imageValue === image)?.[0] ?? ""
    );
  }

  function appendToDescription(fragment: string) {
    update("descriptionFa", `${form.descriptionFa.trim()}${fragment}`.trim());
  }

  async function saveProduct() {
    if (variantValidationMessage) {
      setStatus(variantValidationMessage);
      setActiveTab("variants");
      return;
    }
    setLoading(true);
    const salesChannels: SalesChannel[] = [
      ...(form.retailEnabled ? ["retail" as const] : []),
      ...(form.wholesaleEnabled ? ["wholesale" as const] : []),
    ];
    const images = uniqueImages([form.image, ...form.images]);
    const variantImages = Object.fromEntries(
      Object.entries(form.variantImages).filter(
        ([valueId, imageValue]) =>
          form.variantValueIds.includes(valueId) && images.includes(imageValue),
      ),
    );
    const payload = {
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      seoKeywords: form.seoKeywords
        .split(/[،,]/)
        .map((v) => v.trim())
        .filter(Boolean),
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
      variantType: form.variantType,
      variantValueIds: form.variantType === "none" ? [] : form.variantValueIds,
      variantImages,
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
    try {
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
    } catch {
      setStatus("ذخیره ناموفق بود؛ اتصال را بررسی و دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImages(files: FileList | File[]) {
    logModalLayoutDebug("uploadImages entry layout");
    logImageDebug("before file selection handler", {
      files: Array.from(files).map((file, index) => getImageCandidateDebug(file, index)),
    });
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/"));
    logImageDebug("after file selection handler", {
      accepted: accepted.map((file, index) => getImageCandidateDebug(file, index)),
    });
    logModalLayoutDebug("uploadImages after accepted files layout");
    if (accepted.length === 0) return;
    const pendingUploads = accepted.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      failed: false,
    }));
    logImageDebug("before pending upload state", {
      pendingUploads: pendingUploads.map((upload, index) => getImageCandidateDebug(upload, index)),
    });
    setPendingImageUploads((current) => [...pendingUploads, ...current]);
    setIsUploadingImages(true);
    setStatus(`${formatNumber(accepted.length)} تصویر در حال آپلود است...`);
    requestAnimationFrame(() => logModalLayoutDebug("after pending upload render layout"));
    const uploadedUrls: string[] = [];
    try {
      for (const [index, file] of accepted.entries()) {
        const pendingUpload = pendingUploads[index];
        if (!pendingUpload) continue;
        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/admin/storage/upload", {
            method: "POST",
            body: formData,
          });
          const data = (await response.json().catch(() => ({}))) as {
            file?: Record<string, unknown>;
            error?: string;
            message?: string;
          };
          const mappedUrl = normalizeImageUrl(data.file?.url);
          logImageDebug("upload response mapping", {
            responseOk: response.ok,
            status: response.status,
            pendingUpload: getImageCandidateDebug(pendingUpload),
            responseFile: getImageCandidateDebug(data.file),
            mappedUrl,
          });
          if (mappedUrl) uploadedUrls.push(mappedUrl);
          if (!response.ok) {
            setStatus(data.error ?? "آپلود یکی از تصاویر ناموفق بود.");
            setPendingImageUploads((current) =>
              current.map((upload) =>
                upload.id === pendingUpload.id ? { ...upload, failed: true } : upload,
              ),
            );
          } else {
            setPendingImageUploads((current) =>
              current.filter((upload) => upload.id !== pendingUpload.id),
            );
            URL.revokeObjectURL(pendingUpload.previewUrl);
          }
        } catch {
          setStatus("آپلود یکی از تصاویر ناموفق بود.");
          setPendingImageUploads((current) =>
            current.map((upload) =>
              upload.id === pendingUpload.id ? { ...upload, failed: true } : upload,
            ),
          );
        }
      }
      if (uploadedUrls.length > 0) {
        setImages((currentImages) => [...currentImages, ...uploadedUrls]);
        setStatus(`${formatNumber(uploadedUrls.length)} تصویر به گالری محصول اضافه شد.`);
      }
    } finally {
      setIsUploadingImages(false);
      requestAnimationFrame(() => logModalLayoutDebug("after upload settled render layout"));
    }
  }

  async function createFlavor() {
    if (!newFlavor.nameFa.trim()) {
      setStatus("نام فارسی طعم الزامی است.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/admin/flavors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFlavor),
    });
    const data = (await response.json().catch(() => ({}))) as {
      flavor?: ProductFlavor;
      message?: string;
      error?: string;
    };
    if (response.ok && data.flavor) {
      setFlavors((current) => {
        const exists = current.some((flavor) => flavor.id === data.flavor!.id);
        return exists
          ? current.map((flavor) => (flavor.id === data.flavor!.id ? data.flavor! : flavor))
          : [...current, data.flavor!];
      });
      setForm((current) => ({
        ...current,
        variantType: "flavor",
        variantValueIds: current.variantValueIds.includes(data.flavor!.id)
          ? current.variantValueIds
          : [...current.variantValueIds, data.flavor!.id],
      }));
      setNewFlavor({ nameFa: "", nameEn: "", slug: "", iconKey: "" });
      setIsFlavorDialogOpen(false);
    }
    setStatus(data.message ?? data.error ?? "پاسخ نامشخص");
    setLoading(false);
  }

  async function createColor() {
    if (!newColor.labelFa.trim()) {
      setStatus("نام فارسی رنگ الزامی است.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/admin/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newColor),
    });
    const data = (await response.json().catch(() => ({}))) as {
      color?: ProductColorOption;
      message?: string;
      error?: string;
    };
    if (response.ok && data.color) {
      setColors((current) => {
        const exists = current.some((color) => color.id === data.color!.id);
        return exists
          ? current.map((color) => (color.id === data.color!.id ? data.color! : color))
          : [...current, data.color!];
      });
      setForm((current) => ({
        ...current,
        variantType: "color",
        variantValueIds: current.variantValueIds.includes(data.color!.id)
          ? current.variantValueIds
          : [...current.variantValueIds, data.color!.id],
      }));
      setNewColor({ labelFa: "", id: "", hex: "#168BFF" });
      setIsColorDialogOpen(false);
    }
    setStatus(data.message ?? data.error ?? "پاسخ نامشخص");
    setLoading(false);
  }

  async function createBrand() {
    if (!newBrand.nameFa.trim()) {
      setBrandError("نام برند را وارد کنید.");
      return;
    }
    setLoading(true);
    setBrandError("");
    try {
      const response = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBrand),
      });
      const data = (await response.json()) as { brand?: Brand; error?: string };
      if (!response.ok || !data.brand) throw new Error(data.error || "ثبت برند ناموفق بود.");
      setBrands((current) => [...current, data.brand!]);
      update("brandId", data.brand.id);
      setNewBrand({ nameFa: "", slug: "" });
      setIsBrandDialogOpen(false);
      setStatus("برند اضافه و برای این محصول انتخاب شد.");
    } catch (error) {
      setBrandError(error instanceof Error ? error.message : "ثبت برند ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  const wholesaleCartonToman = form.wholesalePriceToman * Math.max(1, form.cartonSize);
  const minimumWholesaleToman = wholesaleCartonToman * Math.max(1, form.minWholesaleCartonCount);
  const variantValueOptions =
    form.variantType === "flavor"
      ? flavors.map((flavor) => ({
          id: flavor.id,
          labelFa: flavor.nameFa,
          description: flavor.nameEn ?? flavor.slug,
          swatch: undefined,
          iconKey: flavor.iconKey,
        }))
      : form.variantType === "color"
        ? colors.map((color) => ({
            id: color.id,
            labelFa: color.labelFa,
            description: color.id,
            swatch: color.hex,
            iconKey: undefined,
          }))
        : form.variantValueIds.map((valueId) => ({
            id: valueId,
            labelFa: valueId,
            description: form.variantType === "resistance" ? "ohm" : "capacity",
            swatch: undefined,
            iconKey: undefined,
          }));
  const activeVariantOptions = variantValueOptions.filter((option) =>
    form.variantValueIds.includes(option.id),
  );
  const normalizedFlavorQuery = flavorQuery.trim().toLowerCase();
  const filteredVariantOptions =
    form.variantType === "flavor" && normalizedFlavorQuery
      ? variantValueOptions.filter((option) =>
          [option.labelFa, option.description, option.iconKey]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedFlavorQuery),
        )
      : variantValueOptions;
  const missingVariantImageIds =
    form.variantType === "flavor"
      ? form.variantValueIds.filter((valueId) => !form.variantImages[valueId])
      : [];
  const variantValidationMessage =
    form.variantType === "flavor" && form.variantValueIds.length === 0
      ? "برای محصول طعم‌دار، حداقل یک طعم انتخاب کنید."
      : missingVariantImageIds.length > 0
        ? `برای ${formatNumber(missingVariantImageIds.length)} طعم، عکس مرتبط انتخاب نشده است.`
        : form.variantType === "color" && form.variantValueIds.length === 0
          ? "برای محصول رنگ‌دار، حداقل یک رنگ انتخاب کنید."
          : form.variantType === "resistance" && form.variantValueIds.length === 0
            ? "برای محصول کویل، حداقل یک اهم وارد کنید."
            : form.variantType === "capacity" && form.variantValueIds.length === 0
              ? "برای محصول کارتریج، حداقل یک ظرفیت وارد کنید."
              : "";
  const variantTypeLabel = getVariantTypeLabel(form.variantType);
  const galleryImages = useMemo(
    () => uniqueImages([form.image, ...form.images]),
    [form.image, form.images],
  );
  const visiblePendingImageUploads = pendingImageUploads.filter((upload, index) => {
    const previewUrl = normalizeImageUrl(upload.previewUrl);
    if (!previewUrl) {
      logImageDebug("invalid pending upload filtered", getImageCandidateDebug(upload, index));
    }
    return Boolean(previewUrl);
  });

  useEffect(() => {
    logImageDebug("gallery render", {
      primary: getImageCandidateDebug(form.image),
      rawImages: form.images.map((image, index) => getImageCandidateDebug(image, index)),
      galleryImages: galleryImages.map((image, index) => getImageCandidateDebug(image, index)),
      pending: pendingImageUploads.map((upload, index) => getImageCandidateDebug(upload, index)),
    });
  }, [form.image, form.images, galleryImages, pendingImageUploads]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">
            کاتالوگ محصولات{" "}
            <span className="mr-2 rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-700">
              {formatNumber(total)}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">جست‌وجو، ویرایش و مدیریت گروهی محصولات</p>
        </div>
        <Button onClick={openCreate} disabled={loading || editorFetching}>
          <Plus size={18} />
          افزودن محصول
        </Button>
      </div>
      <ProductFilters
        value={filters}
        onChange={changeFilters}
        brands={brands}
        categories={categories}
      />
      <BulkActions
        ids={selected}
        brands={brands}
        categories={categories}
        disabled={loading || isFetchingRows}
        onApply={applyBulk}
        onClear={() => setSelected([])}
      />
      {bulkFailures.length > 0 && (
        <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-bold">موارد انجام‌نشده</p>
          <ul className="mt-2 list-inside list-disc">
            {bulkFailures.map((failure) => (
              <li key={failure.id}>
                {rows.find((row) => row.product.id === failure.id)?.product.nameFa ?? failure.id}:{" "}
                {failure.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <section className="overflow-hidden rounded-md border border-[#D7DDE4] bg-white shadow-sm">
        <ProductTable
          rows={rows}
          busy={isFetchingRows}
          selected={selected}
          onSelect={(id) =>
            setSelected((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onSelectAll={() =>
            setSelected(selected.length === rows.length ? [] : rows.map((row) => row.product.id))
          }
          onEdit={openEdit}
          sort={sort}
          direction={direction}
          onSort={(next) => {
            setSort(next);
            setDirection(next === sort && direction === "asc" ? "desc" : "asc");
            setPage(1);
          }}
          error={fetchError}
          onRetry={fetchRows}
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          busy={isFetchingRows || loading}
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>
      {status && !isEditorOpen && (
        <div
          role="status"
          className="pointer-events-none fixed top-20 left-5 z-40 flex max-w-[90vw] items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-xl"
        >
          <span>{status}</span>
          <button
            className="pointer-events-auto"
            aria-label="بستن اعلان"
            onClick={() => setStatus("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <ConfirmationDialog
        open={discardOpen}
        title="تغییرات ذخیره نشده‌اند"
        description="با بستن فرم، تغییرات این محصول کنار گذاشته می‌شوند."
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          clearPendingImageUploads();
          setIsEditorOpen(false);
        }}
      />
      <DialogPrimitive.Root
        open={isEditorOpen}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(96vw,76rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md bg-white text-[#17202A] shadow-2xl focus:outline-none">
            <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[#D7DDE4] px-5 py-4">
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

            <ProductTabs active={activeTab} onChange={setActiveTab} />
            <div
              id="product-tab-panel"
              role="tabpanel"
              aria-labelledby={`product-tab-${activeTab}`}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
              key={activeTab}
            >
              {activeTab === "basic" && (
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
                      <div className="grid gap-1 text-sm">
                        <span>نوع محصول</span>
                        <SearchableSelect
                          label="نوع محصول"
                          value={form.productKind}
                          options={productKindOptions}
                          onChange={(value) => updateProductKind(value as ProductKind)}
                        />
                      </div>
                      <div className="grid gap-1 text-sm">
                        <span>دسته</span>
                        <SearchableSelect
                          label="دسته"
                          value={form.categoryId}
                          options={categories.map((category) => ({
                            value: category.id,
                            label: category.nameFa,
                          }))}
                          onChange={updateCategory}
                        />
                      </div>
                      <div className="grid gap-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span>برند</span>
                          <button type="button" onClick={() => { setBrandError(""); setIsBrandDialogOpen(true); }} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                            <Plus size={14} aria-hidden="true" /> افزودن برند
                          </button>
                        </div>
                        <SearchableSelect
                          label="برند"
                          value={form.brandId}
                          options={brands.map((brand) => ({
                            value: brand.id,
                            label: brand.nameFa,
                          }))}
                          onChange={(value) => update("brandId", value)}
                        />
                      </div>
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
              )}
              {activeTab === "variants" && (
                <div className="grid gap-5">
                  <section className="rounded-md border border-[#D7DDE4] bg-[#F8FAFC] p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Palette size={18} className="text-[#168BFF]" aria-hidden="true" />
                      <h3 className="font-black">نوع تنوع محصول</h3>
                    </div>
                    <div
                      className="grid gap-2 md:grid-cols-5"
                      role="radiogroup"
                      aria-label="نوع تنوع محصول"
                    >
                      {[
                        { value: "none" as const, label: "بدون تنوع", icon: CircleOff },
                        { value: "flavor" as const, label: "طعم", icon: Sparkles },
                        { value: "color" as const, label: "رنگ", icon: Palette },
                        { value: "resistance" as const, label: "اهم", icon: Gauge },
                        { value: "capacity" as const, label: "ظرفیت", icon: Gauge },
                      ].map((option) => {
                        const Icon = option.icon;
                        const active = form.variantType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={!active}
                            onClick={() => {
                              if (active) setVariantType(option.value);
                            }}
                            className={`flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${
                              active
                                ? "border-[#168BFF] bg-white text-[#0B5CAD] shadow-sm ring-2 ring-[#168BFF]/15"
                                : "border-[#D7DDE4] bg-white text-[#5F6C79] opacity-60"
                            }`}
                            role="radio"
                            aria-checked={active}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Icon size={18} aria-hidden="true" />
                              {option.label}
                            </span>
                            {active ? <Check size={16} aria-hidden="true" /> : null}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs font-bold text-[#5F6C79]">
                      {getVariantTypeHelp(form.variantType)}
                    </p>
                    {variantValidationMessage ? (
                      <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                        {variantValidationMessage}
                      </p>
                    ) : null}
                  </section>
                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {form.variantType === "flavor" ? (
                          <Sparkles size={18} className="text-[#168BFF]" aria-hidden="true" />
                        ) : form.variantType === "color" ? (
                          <Palette size={18} className="text-[#168BFF]" aria-hidden="true" />
                        ) : (
                          <Gauge size={18} className="text-[#168BFF]" aria-hidden="true" />
                        )}
                        <div>
                          <h3 className="font-black">
                            {variantTypeLabel ? `${variantTypeLabel}‌های محصول` : "تنوع محصول"}
                          </h3>
                          <p className="mt-1 text-xs text-[#5F6C79]">
                            {form.variantType === "flavor"
                              ? "طعم‌های قابل انتخاب را از رکوردهای طعم ذخیره‌شده انتخاب کنید."
                              : form.variantType === "color"
                                ? "رنگ‌های واقعی محصول را با سواچ رنگ انتخاب کنید."
                                : "مقدارهای قابل سفارش را وارد کنید و در گالری به عکس مرتبط وصل کنید."}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.variantType === "flavor" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsFlavorDialogOpen(true)}
                          >
                            <Plus size={16} aria-hidden="true" />
                            افزودن طعم جدید
                          </Button>
                        ) : null}
                        {form.variantType === "color" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsColorDialogOpen(true)}
                          >
                            <Plus size={16} aria-hidden="true" />
                            افزودن رنگ جدید
                          </Button>
                        ) : null}
                        {form.variantType === "flavor" || form.variantType === "color" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={applySuggestedVariantValues}
                          >
                            پیشنهاد بر اساس نوع
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-[#D7DDE4] text-[#17202A] hover:bg-[#EEF3F8]"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              variantValueIds: [],
                              variantImages: {},
                            }))
                          }
                        >
                          پاک کردن انتخاب‌ها
                        </Button>
                      </div>
                    </div>

                    {form.variantType === "flavor" ? (
                      <label className="relative mb-3 block">
                        <span className="sr-only">جستجوی طعم</span>
                        <Search
                          className="pointer-events-none absolute right-3 top-3 text-[#5F6C79]"
                          size={18}
                          aria-hidden="true"
                        />
                        <Input
                          className="pr-10"
                          value={flavorQuery}
                          onChange={(event) => setFlavorQuery(event.target.value)}
                          placeholder="جستجوی طعم..."
                        />
                      </label>
                    ) : null}

                    {form.variantType === "resistance" || form.variantType === "capacity" ? (
                      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input
                          dir="ltr"
                          value={customVariantValue}
                          onChange={(event) => setCustomVariantValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addCustomVariantValue();
                            }
                          }}
                          placeholder={form.variantType === "resistance" ? "0.8ohm" : "3ml"}
                        />
                        <Button type="button" variant="secondary" onClick={addCustomVariantValue}>
                          <Plus size={16} aria-hidden="true" />
                          افزودن {variantTypeLabel}
                        </Button>
                      </div>
                    ) : null}

                    {activeVariantOptions.length > 0 ? (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {activeVariantOptions.map((option) => (
                          <span
                            key={option.id}
                            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#B8C4D2] bg-white px-2 text-xs font-bold text-[#17202A]"
                          >
                            {option.swatch ? (
                              <span
                                className="h-4 w-4 rounded-full border border-slate-300"
                                style={
                                  option.swatch.startsWith("linear-gradient")
                                    ? { backgroundImage: option.swatch }
                                    : { backgroundColor: option.swatch }
                                }
                                aria-hidden="true"
                              />
                            ) : (
                              <Sparkles size={14} className="text-[#168BFF]" aria-hidden="true" />
                            )}
                            {option.labelFa}
                            <button
                              type="button"
                              className="rounded p-1 text-[#5F6C79] hover:bg-[#EEF3F8] hover:text-[#17202A]"
                              onClick={() => toggleVariantValue(option.id)}
                              aria-label={`حذف ${option.labelFa}`}
                            >
                              <X size={13} aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="grid gap-2 pr-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredVariantOptions.map((option) => {
                        const active = form.variantValueIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleVariantValue(option.id)}
                            className={`flex min-h-12 items-center justify-between gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${
                              active
                                ? "border-cyan-500 bg-cyan-50 text-cyan-950"
                                : "border-[#D7DDE4] bg-white text-[#17202A] hover:bg-[#F4F6F8]"
                            }`}
                            aria-pressed={active}
                          >
                            <span className="min-w-0 inline-flex items-center gap-2">
                              {option.swatch ? (
                                <span
                                  className="h-5 w-5 shrink-0 rounded-full border border-slate-300"
                                  style={
                                    option.swatch.startsWith("linear-gradient")
                                      ? { backgroundImage: option.swatch }
                                      : { backgroundColor: option.swatch }
                                  }
                                  aria-hidden="true"
                                />
                              ) : (
                                <Sparkles
                                  size={16}
                                  className="shrink-0 text-[#168BFF]"
                                  aria-hidden="true"
                                />
                              )}
                              <span className="truncate">{option.labelFa}</span>
                            </span>
                            {active ? (
                              <Check size={16} className="shrink-0" aria-hidden="true" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}
              {activeTab === "pricing" && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-md border border-[#D7DDE4] p-4">
                    <h3 className="font-black">قیمت و بسته‌بندی</h3>
                    <div className="mt-3 grid gap-3">
                      <label className="grid gap-1 text-sm">
                        قیمت فروش تکی هر عدد (تومان)
                        <PriceInput
                          value={form.retailPriceToman}
                          onValueChange={(value) => update("retailPriceToman", Number(value))}
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        قیمت عمده هر عدد داخل کارتن (تومان)
                        <PriceInput
                          value={form.wholesalePriceToman}
                          onValueChange={(value) => update("wholesalePriceToman", Number(value))}
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
                  <section className="rounded-md border p-4">
                    <h3 className="font-black">موجودی انبار</h3>
                    <div className="mt-4 grid gap-4">
                      <label className="grid gap-2 text-sm">
                        موجودی کل
                        <Input
                          type="number"
                          min={0}
                          value={form.onHand}
                          onChange={(e) => update("onHand", Number(e.target.value))}
                        />
                      </label>
                      <label className="grid gap-2 text-sm">
                        هشدار شارژ
                        <Input
                          type="number"
                          min={0}
                          value={form.restockThreshold}
                          onChange={(e) => update("restockThreshold", Number(e.target.value))}
                        />
                      </label>
                      <p className="text-xs leading-6 text-slate-500">
                        موجودی قابل فروش پس از کسر رزرو سفارش‌ها محاسبه می‌شود. قیمت و موجودی این
                        فرم مربوط به مدل اصلی است.
                      </p>
                    </div>
                  </section>
                </div>
              )}
              {activeTab === "images" && (
                <ImageManager
                  images={galleryImages}
                  busy={isUploadingImages || loading}
                  onUpload={uploadImages}
                  onChange={setImages}
                  pending={visiblePendingImageUploads}
                  renderAssignment={(url) =>
                    activeVariantOptions.length > 0 ? (
                      <label className="grid gap-2 border-t p-3 text-xs">
                        {variantTypeLabel} مرتبط
                        <select
                          className="h-10 rounded-md border px-2 text-sm"
                          value={getImageVariantValueId(url)}
                          onChange={(e) => assignImageToVariantValue(url, e.target.value)}
                        >
                          <option value="">بدون تنوع اختصاصی</option>
                          {activeVariantOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.labelFa}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null
                  }
                />
              )}
              {activeTab === "seo" && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="grid gap-4 rounded-md border p-4">
                    <h3 className="font-black">بهینه‌سازی برای جست‌وجو</h3>
                    <label className="grid gap-2 text-sm">
                      عنوان متا
                      <Input
                        value={form.seoTitle}
                        maxLength={160}
                        onChange={(e) => update("seoTitle", e.target.value)}
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      توضیحات متا
                      <Textarea
                        value={form.seoDescription}
                        maxLength={500}
                        onChange={(e) => update("seoDescription", e.target.value)}
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      کلمات کلیدی
                      <Input
                        value={form.seoKeywords}
                        onChange={(e) => update("seoKeywords", e.target.value)}
                        placeholder="با ویرگول جدا کنید"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      برچسب‌های محصول
                      <Input
                        value={form.tagsText}
                        onChange={(e) => update("tagsText", e.target.value)}
                      />
                    </label>
                  </section>
                  <aside className="h-fit rounded-md border bg-slate-50 p-5">
                    <p className="mb-4 text-xs text-slate-500">پیش‌نمایش نتیجهٔ جست‌وجو</p>
                    <p className="text-lg text-blue-700">{form.seoTitle || form.nameFa}</p>
                    <p dir="ltr" className="my-2 break-all text-xs text-green-700">
                      ufopuff.com/products/{form.slug}
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      {form.seoDescription || form.shortDescriptionFa}
                    </p>
                  </aside>
                </div>
              )}
              {activeTab === "specs" && (
                <details open className="rounded-md border p-4">
                  <summary className="cursor-pointer font-black">مشخصات فنی محصول</summary>
                  <label className="mt-4 grid gap-2 text-sm">
                    هر مشخصه در یک خط، به شکل عنوان: مقدار
                    <Textarea
                      className="min-h-64"
                      value={form.specsText}
                      onChange={(e) => update("specsText", e.target.value)}
                      placeholder="باتری: ۸۰۰mAh"
                    />
                  </label>
                </details>
              )}
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#D7DDE4] bg-[#F8FAFC] px-5 py-4">
              <p className="text-sm text-[#5F6C79]" role="status">
                {loading
                  ? "در حال ذخیره..."
                  : isUploadingImages
                    ? "در حال آپلود تصویر..."
                    : status || (dirty ? "تغییرات ذخیره نشده" : "همهٔ تغییرات ذخیره شده‌اند")}
              </p>
              <div className="flex gap-2">
                <DialogPrimitive.Close asChild>
                  <Button type="button" variant="secondary">
                    انصراف
                  </Button>
                </DialogPrimitive.Close>
                <Button type="button" onClick={saveProduct} disabled={loading || isUploadingImages}>
                  <Save size={17} aria-hidden="true" />
                  ذخیره محصول
                </Button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[100] grid w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md border border-[#D7DDE4] bg-white p-5 text-[#17202A] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-black">افزودن برند</DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-[#5F6C79]">
                  برند پس از ذخیره به فهرست اضافه و برای همین محصول انتخاب می‌شود.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <IconButton label="بستن" className="h-9 w-9 border-[#D7DDE4] bg-white text-[#17202A]"><X size={16} aria-hidden="true" /></IconButton>
              </DialogPrimitive.Close>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              نام برند
              <Input autoFocus value={newBrand.nameFa} onChange={(event) => setNewBrand((current) => ({ ...current, nameFa: event.target.value }))} placeholder="نام برند" />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              شناسه انگلیسی (اختیاری)
              <Input dir="ltr" value={newBrand.slug} onChange={(event) => setNewBrand((current) => ({ ...current, slug: event.target.value }))} placeholder="brand-name" />
            </label>
            {brandError ? <p role="alert" className="text-sm text-red-700">{brandError}</p> : null}
            <div className="flex justify-end gap-2 border-t border-[#D7DDE4] pt-4">
              <DialogPrimitive.Close asChild><Button type="button" variant="secondary">انصراف</Button></DialogPrimitive.Close>
              <Button type="button" onClick={createBrand} disabled={loading}><Plus size={17} aria-hidden="true" />ذخیره برند</Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root open={isFlavorDialogOpen} onOpenChange={setIsFlavorDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[80] grid w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md border border-[#D7DDE4] bg-white p-5 text-[#17202A] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-black">
                  افزودن طعم جدید
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-[#5F6C79]">
                  طعم ذخیره‌شده بلافاصله به همین محصول اضافه می‌شود.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <IconButton
                  label="بستن"
                  className="h-9 w-9 border-[#D7DDE4] bg-white text-[#17202A]"
                >
                  <X size={16} aria-hidden="true" />
                </IconButton>
              </DialogPrimitive.Close>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1 text-sm font-bold">
                نام فارسی
                <Input
                  value={newFlavor.nameFa}
                  onChange={(event) =>
                    setNewFlavor((current) => ({ ...current, nameFa: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                نام انگلیسی
                <Input
                  dir="ltr"
                  value={newFlavor.nameEn}
                  onChange={(event) =>
                    setNewFlavor((current) => ({ ...current, nameEn: event.target.value }))
                  }
                  placeholder="Watermelon Ice"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold">
                  slug
                  <Input
                    dir="ltr"
                    value={newFlavor.slug}
                    onChange={(event) =>
                      setNewFlavor((current) => ({ ...current, slug: event.target.value }))
                    }
                    placeholder="watermelon-ice"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  کلید یا ایموجی آیکن
                  <Input
                    dir="auto"
                    value={newFlavor.iconKey}
                    onChange={(event) =>
                      setNewFlavor((current) => ({ ...current, iconKey: event.target.value }))
                    }
                    placeholder="watermelon یا 🍉"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#D7DDE4] pt-4">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="secondary">
                  انصراف
                </Button>
              </DialogPrimitive.Close>
              <Button type="button" onClick={createFlavor} disabled={loading}>
                <Plus size={17} aria-hidden="true" />
                ذخیره طعم
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DialogPrimitive.Root open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[80] grid w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md border border-[#D7DDE4] bg-white p-5 text-[#17202A] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-black">
                  افزودن رنگ جدید
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm leading-6 text-[#5F6C79]">
                  رنگ ذخیره‌شده بلافاصله به همین محصول اضافه می‌شود.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <IconButton
                  label="بستن"
                  className="h-9 w-9 border-[#D7DDE4] bg-white text-[#17202A]"
                >
                  <X size={16} aria-hidden="true" />
                </IconButton>
              </DialogPrimitive.Close>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1 text-sm font-bold">
                نام فارسی رنگ
                <Input
                  value={newColor.labelFa}
                  onChange={(event) =>
                    setNewColor((current) => ({ ...current, labelFa: event.target.value }))
                  }
                  placeholder="آبی یخی"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
                <label className="grid gap-1 text-sm font-bold">
                  انتخاب رنگ
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(event) =>
                      setNewColor((current) => ({ ...current, hex: event.target.value }))
                    }
                    className="h-11 w-16 cursor-pointer rounded-md border border-[#D7DDE4] bg-white p-1"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  کد hex
                  <Input
                    dir="ltr"
                    value={newColor.hex}
                    onChange={(event) =>
                      setNewColor((current) => ({ ...current, hex: event.target.value }))
                    }
                    placeholder="#168BFF"
                  />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-bold">
                slug اختیاری
                <Input
                  dir="ltr"
                  value={newColor.id}
                  onChange={(event) =>
                    setNewColor((current) => ({ ...current, id: event.target.value }))
                  }
                  placeholder="ice-blue"
                />
              </label>
              <div className="flex min-h-12 items-center gap-3 rounded-md border border-[#D7DDE4] bg-[#F8FAFC] px-3">
                <span
                  className="h-7 w-7 rounded-full border border-slate-300"
                  style={{ backgroundColor: newColor.hex }}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold">{newColor.labelFa || "رنگ جدید"}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#D7DDE4] pt-4">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="secondary">
                  انصراف
                </Button>
              </DialogPrimitive.Close>
              <Button type="button" onClick={createColor} disabled={loading}>
                <Plus size={17} aria-hidden="true" />
                ذخیره رنگ
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
