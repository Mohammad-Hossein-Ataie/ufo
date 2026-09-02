import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Price, ProductCard, StockStatus } from "@ufo/ui";
import { categories } from "@ufo/domain";
import { ProductVariantSummary } from "@/components/product-variant-visuals";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { listAdminColors } from "@/lib/admin-colors";
import { listAdminFlavors } from "@/lib/admin-flavors";
import { getCatalogRowStock, listCatalogRows } from "@/lib/catalog-data";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import { getStorefrontVariantOptions } from "@/lib/storefront-variants";
import {
  breadcrumbJsonLd,
  categoryMetadata,
  collectionPageJsonLd,
  itemListJsonLd,
  jsonLdScriptProps,
} from "@ufo/seo";
import { AddToCartButton } from "@/components/add-to-cart-button";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const rows = await listCatalogRows();
  const activeCategoryIds = new Set(
    rows.filter((row) => row.product.isActive).map((row) => row.product.categoryId),
  );
  return categories
    .filter((category) => activeCategoryIds.has(category.id))
    .map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};
  return categoryMetadata(category);
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const categoryRows = (await listCatalogRows()).filter(
    (row) => row.product.isActive && row.product.categoryId === category.id,
  );
  const flavors = await listAdminFlavors();
  const colors = await listAdminColors();
  if (categoryRows.length === 0) notFound();

  const breadcrumb = breadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "محصولات", path: "/products" },
    { name: category.nameFa, path: `/products/category/${category.slug}` },
  ]);
  const categoryProducts = categoryRows.map((row) => row.product);
  const itemList = itemListJsonLd(
    categoryProducts
      .slice(0, 24)
      .map((product) => ({ name: product.nameFa, url: `/products/${product.slug}` })),
    `محصولات ${category.nameFa}`,
  );

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-10">
      <script {...jsonLdScriptProps(breadcrumb)} />
      <script {...jsonLdScriptProps(collectionPageJsonLd(category, categoryProducts.length))} />
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
      <section className="mt-8 rounded-md border border-[#22303D] bg-[#0D1117] p-5">
        <h2 className="text-xl font-bold">چطور انتخاب کنیم؟</h2>
        <p className="mt-3 leading-8 text-[#D9E2EC]">
          برای انتخاب مطمئن، ابتدا نوع مصرف، سازگاری دستگاه یا کارتریج، موجودی قابل فروش و قیمت
          نهایی را بررسی کنید. محصولات نیکوتین‌دار فقط برای افراد بالای ۱۸ سال عرضه می‌شوند و هیچ
          ادعای درمانی برای آن‌ها مطرح نمی‌شود.
        </p>
      </section>
      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categoryRows.map((row) => {
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
                  src={getProductImage(product)}
                  fallbackSrc={
                    getCategoryImage(product.categoryId) ?? "/images/categories/lighter.png"
                  }
                  alt={product.nameFa}
                  className="h-full w-full object-contain p-4 transition duration-200 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              }
              badge={<StockStatus available={available} />}
              price={<Price valueRial={variant.retailPriceRial} />}
              actions={
                <div className="grid w-full gap-3">
                  <ProductVariantSummary options={variantOptions} />
                  <Link href={`/products/${product.slug}`}>
                    <Button size="sm" variant="ghost" className="w-full">
                      جزئیات
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
      </section>
    </main>
  );
}
