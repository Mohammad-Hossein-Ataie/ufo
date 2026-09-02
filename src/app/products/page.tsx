import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Filter,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CatalogColorFilter } from "@/components/catalog-color-filter";
import { CatalogFlavorFilter } from "@/components/catalog-flavor-filter";
import { CatalogOptionFilter } from "@/components/catalog-option-filter";
import { CatalogPagination } from "@/components/catalog-pagination";
import { CatalogPriceRangeFilter } from "@/components/catalog-price-range-filter";
import { ProductVariantSummary } from "@/components/product-variant-visuals";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { getCatalogRowStock, listCatalogRows, searchCatalogRows } from "@/lib/catalog-data";
import { listAdminColors } from "@/lib/admin-colors";
import { listAdminFlavors } from "@/lib/admin-flavors";
import {
  aggregateProductResistanceOptions,
  getProductResistanceOptions,
} from "@/lib/catalog-technical-filters";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import {
  aggregateStorefrontVariantOptions,
  getStorefrontVariantOptions,
} from "@/lib/storefront-variants";
import type { AdminProductRecord } from "@/lib/admin-products";
import { canonical, itemListJsonLd, jsonLdScriptProps } from "@ufo/seo";
import { Badge, Button, EmptyState, Price, ProductCard, StockStatus } from "@ufo/ui";
import { brands, categories } from "@ufo/domain";
import type { ProductFlavor, ProductKind } from "@ufo/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type ProductSearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  kind?: ProductKind;
  color?: string;
  flavor?: string;
  resistance?: string;
  stock?: "available" | "low" | "preorder";
  minPrice?: string;
  maxPrice?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "stock-desc" | "name";
  page?: string;
};

const productKindLabels: Record<ProductKind, string> = {
  disposable: "پاد یکبارمصرف",
  "pod-device": "پاد سیستم",
  "vape-device": "ویپ",
  "salt-nicotine": "سالت نیکوتین",
  "e-liquid": "جویس",
  coil: "کویل",
  cartridge: "کارتریج",
  accessory: "لوازم جانبی",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<ProductSearchParams>;
}): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const hasQuery = Object.values(params).some(Boolean);
  return {
    title: "کاتالوگ محصولات یوفوپاف",
    description:
      "کاتالوگ پاد، ویپ، سالت نیکوتین، جویس، کویل و کارتریج با فیلتر قیمت، برند، دسته و موجودی.",
    alternates: { canonical: canonical("/products") },
    robots: hasQuery ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "کاتالوگ محصولات یوفوپاف | UFO Puff",
      description: "مشاهده قیمت و موجودی محصولات پاد، ویپ و لوازم جانبی با امکان خرید چندتایی.",
      url: canonical("/products"),
      locale: "fa_IR",
      siteName: "UFO Puff",
    },
  };
}

function parseToman(value?: string) {
  const normalized = value
    ?.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const parsed = Number(normalized?.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 10 : undefined;
}

function getRetailPrice(row: AdminProductRecord) {
  return row.variant.retailPriceRial;
}

function makeHref(params: ProductSearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || !value) continue;
    query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return `/products${suffix ? `?${suffix}` : ""}`;
}

function getPriceBoundsToman(items: AdminProductRecord[]) {
  const prices = items.map((row) => Math.round(getRetailPrice(row) / 10));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
    return { min: 0, max: 25_000_000 };
  }
  if (minPrice === maxPrice) return { min: Math.max(0, minPrice - 50_000), max: maxPrice + 50_000 };
  return { min: Math.max(0, minPrice), max: maxPrice };
}

function filterProducts(
  rows: AdminProductRecord[],
  params: ProductSearchParams,
  flavors: ProductFlavor[],
  colors: Awaited<ReturnType<typeof listAdminColors>>,
  includePriceFilter = true,
) {
  const minPrice = parseToman(params.minPrice);
  const maxPrice = parseToman(params.maxPrice);

  return searchCatalogRows(rows, params.q ?? "")
    .filter((row) => row.product.isActive)
    .filter((row) => row.product.salesChannels?.includes("retail") ?? true)
    .filter((row) => {
      if (!params.category) return true;
      const category = categories.find((item) => item.id === row.product.categoryId);
      return category?.slug === params.category;
    })
    .filter((row) => !params.brand || row.product.brandId === params.brand)
    .filter((row) => !params.kind || row.product.productKind === params.kind)
    .filter(
      (row) =>
        !params.color ||
        getStorefrontVariantOptions(row.product, flavors, colors).some(
          (option) => option.type === "color" && option.id === params.color,
        ),
    )
    .filter(
      (row) =>
        !params.flavor ||
        getStorefrontVariantOptions(row.product, flavors).some(
          (option) => option.type === "flavor" && option.id === params.flavor,
        ),
    )
    .filter(
      (row) =>
        !params.resistance ||
        getProductResistanceOptions(row.product).some((option) => option.id === params.resistance),
    )
    .filter((row) => {
      if (!includePriceFilter) return true;
      const price = getRetailPrice(row);
      return (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);
    })
    .filter((row) => {
      const stock = getCatalogRowStock(row);
      if (params.stock === "available") return stock > 0;
      if (params.stock === "low") return stock > 0 && stock < 10;
      if (params.stock === "preorder") return stock <= 0;
      return true;
    })
    .sort((left, right) => {
      if (params.sort === "price-asc") return getRetailPrice(left) - getRetailPrice(right);
      if (params.sort === "price-desc") return getRetailPrice(right) - getRetailPrice(left);
      if (params.sort === "stock-desc") return getCatalogRowStock(right) - getCatalogRowStock(left);
      if (params.sort === "name")
        return left.product.nameFa.localeCompare(right.product.nameFa, "fa");
      return Number(right.product.isActive) - Number(left.product.isActive);
    });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<ProductSearchParams>;
}) {
  const rawParams = (await searchParams) ?? {};
  const rows = await listCatalogRows();
  const flavors = await listAdminFlavors();
  const colors = await listAdminColors();
  const activeCategory = categories.find((item) => item.slug === rawParams.category);
  const specialFilterScope = activeCategory
    ? rows.filter((row) => row.product.isActive && row.product.categoryId === activeCategory.id)
    : [];
  const colorFilterOptions = activeCategory
    ? aggregateStorefrontVariantOptions(specialFilterScope, flavors, "color", colors)
    : [];
  const flavorFilterOptions = activeCategory
    ? aggregateStorefrontVariantOptions(specialFilterScope, flavors, "flavor")
    : [];
  const resistanceFilterOptions = activeCategory
    ? aggregateProductResistanceOptions(specialFilterScope)
    : [];
  const colorFilterPalette = colorFilterOptions.map((option) => ({
    id: option.id,
    labelFa: option.labelFa,
    hex: option.swatch ?? "",
  }));
  const params: ProductSearchParams = { ...rawParams };
  if (!colorFilterOptions.some((option) => option.id === rawParams.color)) delete params.color;
  if (!flavorFilterOptions.some((option) => option.id === rawParams.flavor)) delete params.flavor;
  if (!resistanceFilterOptions.some((option) => option.id === rawParams.resistance)) {
    delete params.resistance;
  }
  const priceScope = filterProducts(rows, params, flavors, colors, false);
  const priceBounds = getPriceBoundsToman(priceScope);
  const filtered = filterProducts(rows, params, flavors, colors);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number(params.page ?? 1) || 1, 1), totalPages);
  const pagedProducts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeBrand = brands.find((item) => item.id === params.brand);
  const jsonLd = itemListJsonLd(
    filtered
      .slice(0, PAGE_SIZE)
      .map((row) => ({ name: row.product.nameFa, url: `/products/${row.product.slug}` })),
    "کاتالوگ محصولات یوفوپاف",
  );

  return (
    <main id="main-content" className="bg-retail-bg text-retail-primary">
      <script {...jsonLdScriptProps(jsonLd)} />

      <section className="showcase-grid border-b border-retail-border bg-retail-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_22rem] lg:py-14">
          <div className="reveal-up">
            <span className="inline-flex select-none items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary">
              <Sparkles size={14} className="text-retail-accent-2" aria-hidden="true" />
              کاتالوگ خرده‌فروشی یوفوپاف
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] text-white sm:text-4xl">
              انتخاب سریع پاد، ویپ و لوازم مصرفی با فیلتر دقیق
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-retail-secondary">
              محصول را بر اساس برند، دسته، طعم، رنگ، موجودی و بازه قیمت محدود کنید.
            </p>
          </div>
          <div className="reveal-up-delay-1 grid gap-3 rounded-retail border border-retail-border bg-retail-bg/70 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 select-none items-center justify-center rounded-full bg-retail-accent/10 text-retail-accent">
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-retail-secondary">نتیجه فعلی</p>
                <p className="text-2xl font-black tabular-nums text-white">
                  {new Intl.NumberFormat("fa-IR").format(filtered.length)} محصول
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCategory ? <Badge tone="info">{activeCategory.nameFa}</Badge> : null}
              {activeBrand ? <Badge tone="success">{activeBrand.nameFa}</Badge> : null}
              {params.flavor ? <Badge tone="info">فیلتر طعم فعال</Badge> : null}
              {params.color ? <Badge tone="info">فیلتر رنگ فعال</Badge> : null}
              {params.resistance ? <Badge tone="info">فیلتر اهم فعال</Badge> : null}
              {params.stock ? <Badge tone="warning">فیلتر موجودی فعال</Badge> : null}
              {!activeCategory &&
              !activeBrand &&
              !params.stock &&
              !params.flavor &&
              !params.color &&
              !params.resistance ? (
                <Badge tone="success">همه محصولات</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[20rem_1fr] lg:py-10">
        <aside className="h-fit rounded-retail border border-retail-border bg-retail-surface p-4 shadow-retail-lg lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
          <div className="flex items-center gap-2 border-b border-retail-border pb-4">
            <SlidersHorizontal size={18} className="text-retail-accent" aria-hidden="true" />
            <h2 className="font-black text-white">فیلتر محصولات</h2>
          </div>
          <form action="/products" className="mt-4 grid gap-3 pb-2">
            <label className="grid gap-2 text-sm text-retail-secondary">
              جستجو
              <span className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-retail-muted"
                  aria-hidden="true"
                />
                <input
                  name="q"
                  defaultValue={params.q}
                  className="min-h-11 w-full rounded-md border border-retail-border bg-retail-bg px-3 pe-9 text-white outline-none transition placeholder:text-retail-muted focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                  placeholder="نام محصول، برند یا SKU"
                />
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-2 text-sm text-retail-secondary">
                دسته‌بندی
                <select
                  name="category"
                  defaultValue={params.category ?? ""}
                  className="min-h-11 rounded-md border border-retail-border bg-retail-bg px-3 text-white outline-none focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                >
                  <option value="">همه دسته‌ها</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.nameFa}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-retail-secondary">
                برند
                <select
                  name="brand"
                  defaultValue={params.brand ?? ""}
                  className="min-h-11 rounded-md border border-retail-border bg-retail-bg px-3 text-white outline-none focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                >
                  <option value="">همه برندها</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameFa}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-retail-secondary">
                نوع محصول
                <select
                  name="kind"
                  defaultValue={params.kind ?? ""}
                  className="min-h-11 rounded-md border border-retail-border bg-retail-bg px-3 text-white outline-none focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                >
                  <option value="">همه نوع‌ها</option>
                  {Object.entries(productKindLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-retail-secondary">
                موجودی
                <select
                  name="stock"
                  defaultValue={params.stock ?? ""}
                  className="min-h-11 rounded-md border border-retail-border bg-retail-bg px-3 text-white outline-none focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="available">فقط موجود</option>
                  <option value="low">موجودی محدود</option>
                  <option value="preorder">پیش‌سفارش</option>
                </select>
              </label>
              {flavorFilterOptions.length > 0 ? (
                <label className="grid gap-2 text-sm text-retail-secondary">
                  طعم
                  <CatalogFlavorFilter
                    defaultValue={params.flavor}
                    options={flavorFilterOptions}
                    tone="dark"
                  />
                </label>
              ) : null}
              {colorFilterPalette.length > 0 ? (
                <label className="grid gap-2 text-sm text-retail-secondary">
                  رنگ
                  <CatalogColorFilter
                    defaultValue={params.color}
                    options={colorFilterPalette}
                    tone="dark"
                  />
                </label>
              ) : null}
              {resistanceFilterOptions.length > 0 ? (
                <label className="grid gap-2 text-sm text-retail-secondary">
                  مقاومت
                  <CatalogOptionFilter
                    name="resistance"
                    defaultValue={params.resistance}
                    options={resistanceFilterOptions}
                    allLabel="همه اهم‌ها"
                    tone="dark"
                  />
                </label>
              ) : null}
            </div>

            <CatalogPriceRangeFilter
              defaultMin={params.minPrice}
              defaultMax={params.maxPrice}
              min={priceBounds.min}
              max={priceBounds.max}
              tone="dark"
            />

            <label className="grid gap-2 text-sm text-retail-secondary">
              مرتب‌سازی
              <select
                name="sort"
                defaultValue={params.sort ?? "featured"}
                className="min-h-11 rounded-md border border-retail-border bg-retail-bg px-3 text-white outline-none focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
              >
                <option value="featured">پیشنهادی</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
                <option value="stock-desc">بیشترین موجودی</option>
                <option value="name">نام محصول</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button className="inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md border border-retail-accent bg-retail-accent px-4 text-sm font-bold text-retail-bg transition hover:bg-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent">
                <Filter size={16} aria-hidden="true" />
                اعمال
              </button>
              <Link
                href="/products"
                className="inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md border border-retail-border px-4 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
              >
                <X size={16} aria-hidden="true" />
                پاک کردن
              </Link>
            </div>
          </form>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                {activeCategory ? activeCategory.nameFa : "همه محصولات"}
              </h2>
              <p className="mt-1 text-sm text-retail-secondary">
                صفحه {new Intl.NumberFormat("fa-IR").format(currentPage)} از{" "}
                {new Intl.NumberFormat("fa-IR").format(totalPages)}، نمایش{" "}
                {new Intl.NumberFormat("fa-IR").format(pagedProducts.length)} محصول
              </p>
            </div>
            <Badge tone="info">قیمت‌ها به تومان نمایش داده می‌شوند</Badge>
          </div>

          {pagedProducts.length === 0 ? (
            <EmptyState title="محصولی با این فیلتر پیدا نشد">
              بازه قیمت، برند، طعم، رنگ یا دسته‌بندی را تغییر دهید تا نتایج بیشتری ببینید.
            </EmptyState>
          ) : (
            <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {pagedProducts.map((row) => {
                const product = row.product;
                const variant = row.variant;
                const available = getCatalogRowStock(row);
                const variantOptions = getStorefrontVariantOptions(product, flavors, colors);
                return (
                  <ProductCard
                    key={product.id}
                    title={product.nameFa}
                    description={product.shortDescriptionFa}
                    mediaClassName="bg-white"
                    media={
                      <StorefrontProductImage
                        key={`media-${product.id}`}
                        src={getProductImage(product)}
                        fallbackSrc={
                          getCategoryImage(product.categoryId) ?? "/images/categories/lighter.png"
                        }
                        alt={product.nameFa}
                        className="h-full w-full object-contain p-4 transition duration-200 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    }
                    badge={<StockStatus key={`stock-${product.id}`} available={available} />}
                    price={
                      <Price key={`price-${product.id}`} valueRial={variant.retailPriceRial} />
                    }
                    actions={
                      <div key={`actions-${product.id}`} className="grid w-full gap-3">
                        <ProductVariantSummary options={variantOptions} />
                        <Link href={`/products/${product.slug}`} className="w-full">
                          <Button size="sm" variant="ghost" className="w-full">
                            جزئیات
                            <ArrowLeft size={16} aria-hidden="true" />
                          </Button>
                        </Link>
                        {variantOptions.length === 0 ? (
                          <AddToCartButton
                            variantId={variant.id}
                            label="افزودن به سبد خرید"
                            enableQuantity
                            maxQuantity={available > 0 ? available : undefined}
                          />
                        ) : null}
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}

          <CatalogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            makeHref={(page) => makeHref(params, page)}
            tone="dark"
          />
        </section>
      </div>
    </main>
  );
}
