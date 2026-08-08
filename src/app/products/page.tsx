import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Filter, Search, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { Badge, Button, Price, ProductCard, StockStatus } from "@ufo/ui";
import {
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  searchProducts,
} from "@ufo/domain";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { canonical, itemListJsonLd, jsonLdScriptProps } from "@ufo/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>;
}): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const hasQuery = Boolean(params.q || params.category);
  return {
    title: "کاتالوگ محصولات",
    description: "کاتالوگ پاد، ویپ، سالت نیکوتین، جویس، کویل و کارتریج با قیمت و موجودی.",
    alternates: { canonical: canonical("/products") },
    robots: hasQuery ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "کاتالوگ محصولات UFO Puff",
      description: "مشاهده قیمت و موجودی محصولات پاد، ویپ و لوازم جانبی.",
      url: canonical("/products"),
      locale: "fa_IR",
      siteName: "UFO Puff",
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const q = params.q ?? "";
  const category = params.category ?? "";
  const filtered = searchProducts(q).filter((product) => {
    if (!category) return true;
    const productCategory = categories.find((item) => item.id === product.categoryId);
    return productCategory?.slug === category;
  });
  const jsonLd = itemListJsonLd(
    filtered
      .slice(0, 24)
      .map((product) => ({ name: product.nameFa, url: `/products/${product.slug}` })),
    "کاتالوگ محصولات UFO Puff",
  );
  const activeCategory = categories.find((item) => item.slug === category);

  return (
    <main id="main-content" className="bg-retail-bg text-retail-primary">
      <script {...jsonLdScriptProps(jsonLd)} />

      <section className="showcase-grid border-b border-retail-border bg-retail-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_22rem] lg:py-14">
          <div className="reveal-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary">
              <Sparkles size={14} className="text-retail-accent-2" aria-hidden="true" />
              کاتالوگ خرده‌فروشی
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] text-white sm:text-4xl">
              انتخاب سریع محصول با قیمت، موجودی و امکان خرید چندتایی
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-retail-secondary">
              محصول را جستجو کنید، دسته‌بندی را محدود کنید و همان‌جا تعداد دلخواه را به سبد اضافه
              کنید.
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
            {activeCategory ? (
              <Badge tone="info">دسته‌بندی: {activeCategory.nameFa}</Badge>
            ) : (
              <Badge tone="success">همه دسته‌بندی‌ها</Badge>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[19rem_1fr] lg:py-10">
        <aside className="h-fit rounded-retail border border-retail-border bg-retail-surface p-4 shadow-retail-lg lg:sticky lg:top-24">
          <div className="flex items-center gap-2 border-b border-retail-border pb-4">
            <SlidersHorizontal size={18} className="text-retail-accent" aria-hidden="true" />
            <h2 className="font-black text-white">فیلتر کاتالوگ</h2>
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
                  defaultValue={q}
                  className="min-h-11 w-full rounded-md border border-retail-border bg-retail-bg px-3 pe-9 text-white outline-none transition placeholder:text-retail-muted focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
                  placeholder="نام محصول یا SKU"
                />
              </span>
            </label>
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-retail-accent bg-retail-accent px-4 text-sm font-bold text-retail-bg transition hover:bg-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent">
              <Filter size={16} aria-hidden="true" />
              اعمال فیلتر
            </button>
          </form>
          <nav aria-label="دسته‌بندی‌ها" className="mt-5 grid gap-2 text-sm">
            <Link
              className={`rounded-md px-3 py-2 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-retail-accent ${!category ? "bg-white/10 text-white" : "text-retail-secondary"}`}
              href="/products"
            >
              همه محصولات
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                className={`rounded-md px-3 py-2 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-retail-accent ${category === item.slug ? "bg-white/10 text-white" : "text-retail-secondary"}`}
                href={`/products/category/${item.slug}`}
              >
                {item.nameFa}
              </Link>
            ))}
          </nav>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                {activeCategory ? activeCategory.nameFa : "همه محصولات"}
              </h2>
              <p className="mt-1 text-sm text-retail-secondary">
                قیمت‌ها به تومان نمایش داده می‌شوند و موجودی قبل از پرداخت دوباره کنترل می‌شود.
              </p>
            </div>
            <Badge tone="info">فیلترهای دارای query برای SEO noindex می‌شوند</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => {
              const variant = getPrimaryVariant(product.id);
              const inventory = getInventoryByVariant(variant.id);
              const available = inventory ? getAvailableStock(inventory) : 0;
              return (
                <div key={product.id} className="rounded-retail transition-shadow hover:shadow-retail-lg">
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
                    price={<Price key={`price-${product.id}`} valueRial={variant.retailPriceRial} />}
                    actions={
                      <div key={`actions-${product.id}`} className="grid w-full gap-2">
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
        </section>
      </div>
    </main>
  );
}
