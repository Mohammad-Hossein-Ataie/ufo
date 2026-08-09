import type { Metadata } from "next";
import Image from "next/image";
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
import { CatalogPagination } from "@/components/catalog-pagination";
import { CatalogPriceRangeFilter } from "@/components/catalog-price-range-filter";
import { canonical, itemListJsonLd, jsonLdScriptProps } from "@ufo/seo";
import { Badge, Button, EmptyState, Price, ProductCard, StockStatus } from "@ufo/ui";
import {
  brands,
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  getProductColorOptions,
  productColorPalette,
  searchProducts,
} from "@ufo/domain";
import type { Product, ProductKind } from "@ufo/types";

const PAGE_SIZE = 12;

type ProductSearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  kind?: ProductKind;
  color?: string;
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
  const parsed = Number(value?.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 10 : undefined;
}

function getProductStock(product: Product) {
  const variant = getPrimaryVariant(product.id);
  const inventory = getInventoryByVariant(variant.id);
  return inventory ? getAvailableStock(inventory) : 0;
}

function getRetailPrice(product: Product) {
  return getPrimaryVariant(product.id).retailPriceRial;
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

function filterProducts(params: ProductSearchParams) {
  const minPrice = parseToman(params.minPrice);
  const maxPrice = parseToman(params.maxPrice);

  return searchProducts(params.q ?? "")
    .filter((product) => product.isActive)
    .filter((product) => product.salesChannels?.includes("retail") ?? true)
    .filter((product) => {
      if (!params.category) return true;
      const category = categories.find((item) => item.id === product.categoryId);
      return category?.slug === params.category;
    })
    .filter((product) => !params.brand || product.brandId === params.brand)
    .filter((product) => !params.kind || product.productKind === params.kind)
    .filter(
      (product) =>
        !params.color || getProductColorOptions(product).some((color) => color.id === params.color),
    )
    .filter((product) => {
      const price = getRetailPrice(product);
      return (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);
    })
    .filter((product) => {
      const stock = getProductStock(product);
      if (params.stock === "available") return stock > 0;
      if (params.stock === "low") return stock > 0 && stock < 10;
      if (params.stock === "preorder") return stock <= 0;
      return true;
    })
    .sort((left, right) => {
      if (params.sort === "price-asc") return getRetailPrice(left) - getRetailPrice(right);
      if (params.sort === "price-desc") return getRetailPrice(right) - getRetailPrice(left);
      if (params.sort === "stock-desc") return getProductStock(right) - getProductStock(left);
      if (params.sort === "name") return left.nameFa.localeCompare(right.nameFa, "fa");
      return Number(right.isActive) - Number(left.isActive);
    });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<ProductSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const filtered = filterProducts(params);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number(params.page ?? 1) || 1, 1), totalPages);
  const pagedProducts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCategory = categories.find((item) => item.slug === params.category);
  const activeBrand = brands.find((item) => item.id === params.brand);
  const jsonLd = itemListJsonLd(
    filtered
      .slice(0, PAGE_SIZE)
      .map((product) => ({ name: product.nameFa, url: `/products/${product.slug}` })),
    "کاتالوگ محصولات یوفوپاف",
  );

  return (
    <main id="main-content" className="bg-retail-bg text-retail-primary">
      <script {...jsonLdScriptProps(jsonLd)} />

      <section className="showcase-grid border-b border-retail-border bg-retail-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_22rem] lg:py-14">
          <div className="reveal-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary">
              <Sparkles size={14} className="text-retail-accent-2" aria-hidden="true" />
              کاتالوگ خرده‌فروشی یوفوپاف
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] text-white sm:text-4xl">
              انتخاب سریع پاد، ویپ و لوازم مصرفی با فیلتر دقیق
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-retail-secondary">
              محصول را بر اساس برند، دسته، موجودی و بازه قیمت محدود کنید؛ هر صفحه فقط تعداد مشخصی
              کارت نشان می‌دهد تا خرید بدون اسکرول طولانی انجام شود.
            </p>
          </div>
          <div className="reveal-up-delay-1 grid gap-3 rounded-retail border border-retail-border bg-retail-bg/70 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-retail-accent/10 text-retail-accent">
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
              {params.stock ? <Badge tone="warning">فیلتر موجودی فعال</Badge> : null}
              {!activeCategory && !activeBrand && !params.stock ? (
                <Badge tone="success">همه محصولات</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[20rem_1fr] lg:py-10">
        <aside className="h-fit rounded-retail border border-retail-border bg-retail-surface p-4 shadow-retail-lg lg:sticky lg:top-24">
          <div className="flex items-center gap-2 border-b border-retail-border pb-4">
            <SlidersHorizontal size={18} className="text-retail-accent" aria-hidden="true" />
            <h2 className="font-black text-white">فیلتر محصولات</h2>
          </div>
          <form action="/products" className="mt-4 grid gap-3">
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
              <label className="grid gap-2 text-sm text-retail-secondary">
                رنگ
                <select
                  name="color"
                  defaultValue={params.color ?? ""}
                  className="min-h-11 rounded-md border border-retail-border bg-retail-bg px-3 text-white outline-none focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                >
                  <option value="">همه رنگ‌ها</option>
                  {productColorPalette.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.labelFa}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <CatalogPriceRangeFilter
              defaultMin={params.minPrice}
              defaultMax={params.maxPrice}
              max={25_000_000}
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
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-retail-accent bg-retail-accent px-4 text-sm font-bold text-retail-bg transition hover:bg-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent">
                <Filter size={16} aria-hidden="true" />
                اعمال
              </button>
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-retail-border px-4 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
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
              بازه قیمت، برند یا دسته‌بندی را تغییر دهید تا نتایج بیشتری ببینید.
            </EmptyState>
          ) : (
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pagedProducts.map((product) => {
                const variant = getPrimaryVariant(product.id);
                const available = getProductStock(product);
                const colors = getProductColorOptions(product);
                return (
                  <div
                    key={product.id}
                    className="h-full rounded-retail transition-shadow hover:shadow-retail-lg"
                  >
                    <ProductCard
                      title={product.nameFa}
                      description={product.shortDescriptionFa}
                      media={
                        <Image
                          key={`media-${product.id}`}
                          src={product.image}
                          alt={product.nameFa}
                          width={520}
                          height={390}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                        />
                      }
                      badge={<StockStatus key={`stock-${product.id}`} available={available} />}
                      price={
                        <Price key={`price-${product.id}`} valueRial={variant.retailPriceRial} />
                      }
                      actions={
                        <div key={`actions-${product.id}`} className="grid w-full gap-2">
                          {colors.length > 0 ? (
                            <div className="flex min-h-6 flex-wrap items-center gap-1 text-xs text-[#9BA7B4]">
                              {colors.slice(0, 5).map((color) => (
                                <span
                                  key={color.id}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#22303D] bg-white/5 px-2 py-1"
                                >
                                  <span
                                    className="h-3 w-3 rounded-full border border-white/30"
                                    style={{ backgroundColor: color.hex }}
                                    aria-hidden="true"
                                  />
                                  {color.labelFa}
                                </span>
                              ))}
                              {colors.length > 5 ? <span>+{colors.length - 5}</span> : null}
                            </div>
                          ) : null}
                          <Link href={`/products/${product.slug}`} className="w-full">
                            <Button size="sm" variant="ghost" className="w-full">
                              جزئیات
                              <ArrowLeft size={16} aria-hidden="true" />
                            </Button>
                          </Link>
                          <AddToCartButton
                            variantId={variant.id}
                            label="خرید سریع"
                            maxQuantity={available > 0 ? available : undefined}
                          />
                        </div>
                      }
                    />
                  </div>
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
