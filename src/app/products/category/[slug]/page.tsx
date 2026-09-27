import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Price, ProductCard, StockStatus } from "@ufo/ui";
import { categories } from "@ufo/domain";
import { ProductVariantSummary } from "@/components/product-variant-visuals";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { listAdminColors } from "@/lib/admin-colors";
import { listAdminBrands } from "@/lib/admin-brands";
import { listAdminFlavors } from "@/lib/admin-flavors";
import { getCatalogRowStock, listCatalogRows } from "@/lib/catalog-data";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import { getStorefrontVariantOptions } from "@/lib/storefront-variants";
import { getBrandLogoUrl } from "@/lib/partner-brand-logos";
import {
  breadcrumbJsonLd,
  categoryMetadata,
  collectionPageJsonLd,
  itemListJsonLd,
  jsonLdScriptProps,
} from "@ufo/seo";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductNavigationLink } from "@/components/product-navigation-link";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const rows = await listCatalogRows();
  const activeCategoryIds = new Set(
    rows
      .filter(
        (row) => row.product.isActive && (row.product.salesChannels?.includes("retail") ?? true),
      )
      .map((row) => row.product.categoryId),
  );
  return categories
    .filter((category) => activeCategoryIds.has(category.id))
    .map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ brand?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};
  const { brand } = (await searchParams) ?? {};
  return {
    ...categoryMetadata(category),
    ...(brand ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ brand?: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const [catalogRows, flavors, colors, adminBrands] = await Promise.all([
    listCatalogRows(),
    listAdminFlavors(),
    listAdminColors(),
    listAdminBrands(),
  ]);
  const categoryRows = catalogRows.filter(
    (row) =>
      row.product.isActive &&
      (row.product.salesChannels?.includes("retail") ?? true) &&
      row.product.categoryId === category.id,
  );
  if (categoryRows.length === 0) notFound();
  const categoryPath = `/products/category/${category.slug}`;
  const logoByBrandId = new Map(adminBrands.map((brand) => [brand.id, getBrandLogoUrl(brand)]));
  const brandCounts = new Map<
    string,
    { id: string; name: string; logo: string | undefined; count: number }
  >();
  for (const row of categoryRows) {
    const id = row.product.brandId;
    const existing = brandCounts.get(id);
    if (existing) existing.count += 1;
    else
      brandCounts.set(id, {
        id,
        name: row.brandNameFa || id,
        logo: logoByBrandId.get(id),
        count: 1,
      });
  }
  const availableBrands = [...brandCounts.values()].sort(
    (left, right) => right.count - left.count || left.name.localeCompare(right.name, "fa"),
  );
  const { brand: requestedBrand } = (await searchParams) ?? {};
  const selectedBrand = availableBrands.find((brand) => brand.id === requestedBrand);
  const visibleRows = selectedBrand
    ? categoryRows.filter((row) => row.product.brandId === selectedBrand.id)
    : categoryRows;

  const breadcrumb = breadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "محصولات", path: "/products" },
    { name: category.nameFa, path: categoryPath },
  ]);
  const categoryProducts = visibleRows.map((row) => row.product);
  const itemList = itemListJsonLd(
    categoryProducts
      .slice(0, 24)
      .map((product) => ({ name: product.nameFa, url: `/products/${product.slug}` })),
    `محصولات ${category.nameFa}`,
  );

  return (
    <main id="main-content" className="retail-storefront mx-auto max-w-7xl px-4 py-10">
      <script {...jsonLdScriptProps(breadcrumb)} />
      <script {...jsonLdScriptProps(collectionPageJsonLd(category, categoryRows.length))} />
      <script {...jsonLdScriptProps(itemList)} />
      <nav aria-label="مسیر صفحه" className="text-sm text-[#9BA7B4]">
        <Link href="/products" className="hover:text-cyan-200">
          محصولات
        </Link>
        <span className="px-2">/</span>
        <span>{category.nameFa}</span>
      </nav>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black leading-[1.35]">{category.nameFa}</h1>
          <p className="mt-3 max-w-3xl leading-8 text-[#D9E2EC]">{category.descriptionFa}</p>
        </div>
        <Link href="/products">
          <Button variant="ghost">
            همه محصولات
            <ArrowLeft size={18} />
          </Button>
        </Link>
      </header>
      <section
        className="mt-7 rounded-2xl border border-retail-border bg-retail-surface p-4 sm:p-5"
        aria-labelledby="category-brands-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="category-brands-heading" className="text-lg font-black text-white sm:text-xl">
              برندهای {category.nameFa}
            </h2>
            <p className="mt-1 text-xs leading-6 text-retail-secondary sm:text-sm">
              فقط برندهای دارای محصول در این دسته نمایش داده می‌شوند.
            </p>
          </div>
          <p
            className="rounded-full bg-retail-accent/10 px-3 py-1 text-xs font-bold text-retail-accent"
            aria-live="polite"
          >
            {new Intl.NumberFormat("fa-IR").format(visibleRows.length)} محصول
          </p>
        </div>
        <nav
          aria-label={`فیلتر برندهای ${category.nameFa}`}
          className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5"
        >
          <ul className="flex w-max min-w-full gap-2 lg:w-auto lg:flex-wrap">
            <li>
              <Link
                href={categoryPath}
                aria-current={!selectedBrand ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent ${!selectedBrand ? "border-retail-accent bg-retail-accent text-retail-bg" : "border-retail-border bg-retail-bg text-white hover:border-retail-accent/60"}`}
              >
                همه برندها
                <span className="text-xs tabular-nums opacity-75">
                  {new Intl.NumberFormat("fa-IR").format(categoryRows.length)}
                </span>
              </Link>
            </li>
            {availableBrands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`${categoryPath}?brand=${encodeURIComponent(brand.id)}`}
                  aria-current={selectedBrand?.id === brand.id ? "page" : undefined}
                  className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent ${selectedBrand?.id === brand.id ? "border-retail-accent bg-retail-accent text-retail-bg" : "border-retail-border bg-retail-bg text-white hover:border-retail-accent/60"}`}
                >
                  {brand.logo ? (
                    <span className="relative h-8 w-14 shrink-0" aria-hidden="true">
                      <Image
                        src={brand.logo}
                        alt=""
                        fill
                        sizes="56px"
                        unoptimized={brand.logo.startsWith("/api/brand-images/")}
                        className="object-contain"
                      />
                    </span>
                  ) : null}
                  {brand.name}
                  <span className="text-xs tabular-nums opacity-75">
                    {new Intl.NumberFormat("fa-IR").format(brand.count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      <section className="retail-glass mt-8 rounded-md border border-[#22303D] bg-[#0D1117] p-5">
        <h2 className="text-xl font-bold">چطور انتخاب کنیم؟</h2>
        <p className="mt-3 leading-8 text-[#D9E2EC]">
          برای انتخاب مطمئن، ابتدا نوع مصرف، سازگاری دستگاه یا کارتریج، موجودی قابل فروش و قیمت
          نهایی را بررسی کنید. محصولات نیکوتین‌دار فقط برای افراد بالای ۱۸ سال عرضه می‌شوند و هیچ
          ادعای درمانی برای آن‌ها مطرح نمی‌شود.
        </p>
      </section>
      <section
        aria-label={`محصولات ${selectedBrand ? `${selectedBrand.name} در ` : ""}${category.nameFa}`}
        className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {visibleRows.map((row) => {
          const product = row.product;
          const variant = row.variant;
          const available = getCatalogRowStock(row);
          const variantOptions = getStorefrontVariantOptions(product, flavors, colors);
          return (
            <ProductCard
              key={product.id}
              title={product.nameFa}
              subtitle={product.nameEn}
              description={product.shortDescriptionFa}
              media={
                <StorefrontProductImage
                  src={getProductImage(product)}
                  fallbackSrc={
                    getCategoryImage(product.categoryId) ?? "/images/categories/lighter.webp"
                  }
                  alt={product.nameFa}
                />
              }
              badge={<StockStatus available={available} />}
              price={<Price valueRial={variant.retailPriceRial} />}
              variantSummary={
                <ProductVariantSummary key={`variants-${product.id}`} options={variantOptions} />
              }
              actions={
                <div className="grid w-full gap-3">
                  <ProductNavigationLink
                    href={`/products/${product.slug}`}
                    action="details"
                    className="w-full border border-transparent text-current hover:bg-white/10"
                  >
                    جزئیات
                  </ProductNavigationLink>
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
      </section>
    </main>
  );
}
