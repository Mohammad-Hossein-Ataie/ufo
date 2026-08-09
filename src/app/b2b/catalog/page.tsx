import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Filter,
  PackagePlus,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import { CatalogPagination } from "@/components/catalog-pagination";
import { CatalogPriceRangeFilter } from "@/components/catalog-price-range-filter";
import { canonical } from "@ufo/seo";
import { Button, EmptyState, Price, ProductCard } from "@ufo/ui";
import {
  brands,
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getProductColorOptions,
  products,
  productColorPalette,
  searchProducts,
  variants,
} from "@ufo/domain";
import type { Product, ProductKind, ProductVariant } from "@ufo/types";

const PAGE_SIZE = 12;

type B2BCatalogSearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  kind?: ProductKind;
  color?: string;
  stock?: "available" | "low" | "preorder";
  minPrice?: string;
  maxPrice?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "stock-desc" | "carton-size";
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

export const metadata: Metadata = {
  title: "کاتالوگ عمده یوفوپاف",
  description:
    "کاتالوگ داخلی قیمت همکاری یوفوپاف UFO Puff برای سفارش عمده با فیلتر برند، قیمت کارتن، دسته و موجودی.",
  alternates: { canonical: canonical("/b2b/catalog") },
  robots: { index: false, follow: false },
};

function parseToman(value?: string) {
  const normalized = value
    ?.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const parsed = Number(normalized?.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 10 : undefined;
}

function getWholesaleVariant(product: Product): ProductVariant | undefined {
  return variants.find((item) => item.productId === product.id && item.wholesaleEnabled !== false);
}

function getWholesaleStock(product: Product) {
  const variant = getWholesaleVariant(product);
  if (!variant) return 0;
  const inventory = getInventoryByVariant(variant.id);
  return inventory ? getAvailableStock(inventory) : 0;
}

function getWholesalePrice(product: Product) {
  return getWholesaleVariant(product)?.wholesalePriceRial ?? 0;
}

function getWholesalePriceBoundsToman(items: Product[]) {
  const prices = items
    .map((product) => Math.round(getWholesalePrice(product) / 10))
    .filter((price) => price > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
    return { min: 0, max: 25_000_000 };
  }
  if (minPrice === maxPrice) return { min: Math.max(0, minPrice - 50_000), max: maxPrice + 50_000 };
  return { min: Math.max(0, minPrice), max: maxPrice };
}

function makeHref(params: B2BCatalogSearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || !value) continue;
    query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return `/b2b/catalog${suffix ? `?${suffix}` : ""}`;
}

function filterWholesaleProducts(params: B2BCatalogSearchParams, includePriceFilter = true) {
  const minPrice = parseToman(params.minPrice);
  const maxPrice = parseToman(params.maxPrice);

  return searchProducts(params.q ?? "")
    .filter((product) => product.isActive)
    .filter((product) => product.salesChannels?.includes("wholesale") ?? true)
    .filter((product) => Boolean(getWholesaleVariant(product)))
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
      if (!includePriceFilter) return true;
      const price = getWholesalePrice(product);
      return (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);
    })
    .filter((product) => {
      const stock = getWholesaleStock(product);
      if (params.stock === "available") return stock > 0;
      if (params.stock === "low") return stock > 0 && stock < 10;
      if (params.stock === "preorder") return stock <= 0;
      return true;
    })
    .sort((left, right) => {
      const leftVariant = getWholesaleVariant(left);
      const rightVariant = getWholesaleVariant(right);
      if (params.sort === "price-asc") return getWholesalePrice(left) - getWholesalePrice(right);
      if (params.sort === "price-desc") return getWholesalePrice(right) - getWholesalePrice(left);
      if (params.sort === "stock-desc") return getWholesaleStock(right) - getWholesaleStock(left);
      if (params.sort === "carton-size")
        return (rightVariant?.cartonSize ?? 0) - (leftVariant?.cartonSize ?? 0);
      return left.nameFa.localeCompare(right.nameFa, "fa");
    });
}

export default async function B2BCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<B2BCatalogSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const priceScope = filterWholesaleProducts(params, false);
  const priceBounds = getWholesalePriceBoundsToman(priceScope);
  const filtered = filterWholesaleProducts(params);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number(params.page ?? 1) || 1, 1), totalPages);
  const pagedProducts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const wholesaleProducts = products.filter(
    (product) => product.salesChannels?.includes("wholesale") ?? true,
  );
  const wholesaleVariants = variants.filter((item) => item.wholesaleEnabled !== false);

  return (
    <main id="main-content" className="bg-[#F7F7F2] text-[#14201B]">
      <section className="relative overflow-hidden border-b border-[#D5D9C9] bg-[#F7F7F2]">
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(20,32,27,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,32,27,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_24rem] lg:py-14">
          <div className="reveal-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C8D6C7] bg-white px-3 py-1 text-xs font-bold text-[#405148] shadow-sm">
              <Boxes size={14} className="text-[#1F8A5B]" aria-hidden="true" />
              کاتالوگ همکاری یوفوپاف
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] sm:text-4xl">
              خرید عمده با فیلتر قیمت کارتن، موجودی و حداقل سفارش
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-[#596B61]">
              برای تصمیم سریع همکاران، محصولات عمده صفحه‌بندی شده‌اند و می‌توانید مثل مارکت‌پلیس‌های
              حرفه‌ای بر اساس برند، دسته، موجودی و بازه قیمت همکاری فیلتر کنید.
            </p>
          </div>
          <aside className="reveal-up-delay-1 rounded-md border border-[#D5D9C9] bg-white p-5 shadow-[0_16px_40px_rgba(20,32,27,0.10)]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { value: wholesaleProducts.length, label: "محصول عمده" },
                { value: wholesaleVariants.length, label: "واریانت فعال" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-[#D5D9C9] bg-[#F7F7F2] p-4"
                >
                  <div className="text-2xl font-black tabular-nums">
                    {new Intl.NumberFormat("fa-IR").format(item.value)}
                  </div>
                  <div className="mt-1 text-sm text-[#596B61]">{item.label}</div>
                </div>
              ))}
            </div>
            <Link href="/b2b/quick-order" className="mt-4 block">
              <Button className="w-full border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
                سفارش سریع
                <ArrowLeft size={18} aria-hidden="true" />
              </Button>
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#D5D9C9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 md:grid-cols-3">
          {[
            {
              icon: PackagePlus,
              title: "قیمت هر کارتن",
              text: "قیمت عمده روی کارت، قیمت کل هر کارتن است؛ قیمت هر عدد از اندازه کارتن محاسبه می‌شود.",
            },
            {
              icon: Truck,
              title: "رزرو موجودی",
              text: "موجودی قابل فروش و وضعیت پیش‌سفارش قبل از ثبت نهایی دوباره بررسی می‌شود.",
            },
            {
              icon: BadgeCheck,
              title: "فیلتر همکاری",
              text: "دسته، برند، قیمت و موجودی بدون ورود به صفحه محصول قابل محدودسازی است.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-md border border-[#D5D9C9] bg-[#F7F7F2] p-4"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9FBF1] text-[#1F8A5B]">
                <item.icon size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#596B61]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[20rem_1fr] lg:py-10">
        <aside className="h-fit rounded-md border border-[#D5D9C9] bg-white p-4 shadow-[0_16px_40px_rgba(20,32,27,0.08)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
          <div className="flex items-center gap-2 border-b border-[#D5D9C9] pb-4">
            <SlidersHorizontal size={18} className="text-[#1F8A5B]" aria-hidden="true" />
            <h2 className="font-black">فیلتر کاتالوگ عمده</h2>
          </div>
          <form action="/b2b/catalog" className="mt-4 grid gap-3 pb-2">
            <label className="grid gap-2 text-sm font-bold text-[#405148]">
              جستجو
              <span className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8A80]"
                  aria-hidden="true"
                />
                <input
                  name="q"
                  defaultValue={params.q}
                  className="min-h-11 w-full rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 pe-9 outline-none transition placeholder:text-[#7A8A80] focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
                  placeholder="نام محصول، برند یا SKU"
                />
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-2 text-sm font-bold text-[#405148]">
                دسته‌بندی
                <select
                  name="category"
                  defaultValue={params.category ?? ""}
                  className="min-h-11 rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 outline-none focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
                >
                  <option value="">همه دسته‌ها</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.nameFa}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#405148]">
                برند
                <select
                  name="brand"
                  defaultValue={params.brand ?? ""}
                  className="min-h-11 rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 outline-none focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
                >
                  <option value="">همه برندها</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameFa}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#405148]">
                نوع محصول
                <select
                  name="kind"
                  defaultValue={params.kind ?? ""}
                  className="min-h-11 rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 outline-none focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
                >
                  <option value="">همه نوع‌ها</option>
                  {Object.entries(productKindLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#405148]">
                موجودی
                <select
                  name="stock"
                  defaultValue={params.stock ?? ""}
                  className="min-h-11 rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 outline-none focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="available">قابل سفارش</option>
                  <option value="low">نزدیک به اتمام</option>
                  <option value="preorder">نیازمند هماهنگی</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#405148]">
                رنگ
                <select
                  name="color"
                  defaultValue={params.color ?? ""}
                  className="min-h-11 rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 outline-none focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
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
              min={priceBounds.min}
              max={priceBounds.max}
              tone="light"
            />

            <label className="grid gap-2 text-sm font-bold text-[#405148]">
              مرتب‌سازی
              <select
                name="sort"
                defaultValue={params.sort ?? "featured"}
                className="min-h-11 rounded-md border border-[#C8D6C7] bg-[#F7F7F2] px-3 outline-none focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
              >
                <option value="featured">پیشنهادی</option>
                <option value="price-asc">ارزان‌ترین کارتن</option>
                <option value="price-desc">گران‌ترین کارتن</option>
                <option value="stock-desc">بیشترین موجودی</option>
                <option value="carton-size">بزرگ‌ترین کارتن</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#1F8A5B] bg-[#1F8A5B] px-4 text-sm font-bold text-white transition hover:bg-[#176D48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]">
                <Filter size={16} aria-hidden="true" />
                اعمال
              </button>
              <Link
                href="/b2b/catalog"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#C8D6C7] bg-white px-4 text-sm font-bold transition hover:bg-[#F7F7F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"
              >
                <X size={16} aria-hidden="true" />
                پاک کردن
              </Link>
            </div>
          </form>
        </aside>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">محصولات قابل سفارش عمده</h2>
              <p className="mt-2 text-sm text-[#596B61]">
                صفحه {new Intl.NumberFormat("fa-IR").format(currentPage)} از{" "}
                {new Intl.NumberFormat("fa-IR").format(totalPages)}، نمایش{" "}
                {new Intl.NumberFormat("fa-IR").format(pagedProducts.length)} محصول
              </p>
            </div>
            <Link
              href="/b2b"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-[#1F8A5B] transition hover:text-[#176D48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"
            >
              صفحه همکاری
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </div>

          {pagedProducts.length === 0 ? (
            <EmptyState title="محصول عمده‌ای با این فیلتر پیدا نشد">
              بازه قیمت، برند یا وضعیت موجودی را تغییر دهید تا گزینه‌های بیشتری ببینید.
            </EmptyState>
          ) : (
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {pagedProducts.map((product) => {
                const variant = getWholesaleVariant(product);
                if (!variant) return null;
                const available = getWholesaleStock(product);
                const unitToman = Math.round(variant.wholesalePriceRial / variant.cartonSize / 10);
                const colors = getProductColorOptions(product);
                return (
                  <div
                    key={product.id}
                    className="h-full rounded-md transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <ProductCard
                      title={product.nameFa}
                      description={`حداقل ${new Intl.NumberFormat("fa-IR").format(variant.minWholesaleCartonCount)} کارتن، هر کارتن ${new Intl.NumberFormat("fa-IR").format(variant.cartonSize)} عدد؛ هر عدد حدود ${new Intl.NumberFormat("fa-IR").format(unitToman)} تومان`}
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
                      badge={
                        <span className="inline-flex min-h-7 shrink-0 items-center rounded-md border border-[#A8E6C0] bg-[#E9FBF1] px-2 text-xs font-bold text-[#176D48]">
                          {available > 0 ? "موجود" : "نیازمند هماهنگی"}
                        </span>
                      }
                      price={
                        <Price key={`price-${product.id}`} valueRial={variant.wholesalePriceRial} />
                      }
                      actions={
                        <div key={`quick-${product.id}`} className="grid w-full gap-2">
                          <div className="flex min-h-6 items-center gap-2 text-xs text-[#596B61]">
                            <BadgeCheck size={15} className="text-[#1F8A5B]" aria-hidden="true" />
                            SKU: <span dir="ltr">{variant.sku}</span>
                          </div>
                          {colors.length > 0 ? (
                            <div className="flex min-h-6 flex-wrap items-center gap-1 text-xs text-[#596B61]">
                              {colors.slice(0, 5).map((color) => (
                                <span
                                  key={color.id}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#D5D9C9] bg-white px-2 py-1"
                                >
                                  <span
                                    className="h-3 w-3 rounded-full border border-slate-300"
                                    style={{ backgroundColor: color.hex }}
                                    aria-hidden="true"
                                  />
                                  {color.labelFa}
                                </span>
                              ))}
                              {colors.length > 5 ? <span>+{colors.length - 5}</span> : null}
                            </div>
                          ) : null}
                          <Link href="/b2b/quick-order">
                            <Button
                              size="sm"
                              className="w-full border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
                            >
                              افزودن کارتن
                              <ArrowLeft size={16} aria-hidden="true" />
                            </Button>
                          </Link>
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
            tone="light"
          />
        </section>
      </div>
    </main>
  );
}
