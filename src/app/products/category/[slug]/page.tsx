import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Price, ProductCard, StockStatus } from "@ufo/ui";
import {
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  products,
} from "@ufo/domain";
import { getProductImage } from "@/lib/product-images";
import {
  breadcrumbJsonLd,
  categoryMetadata,
  collectionPageJsonLd,
  itemListJsonLd,
  jsonLdScriptProps,
} from "@ufo/seo";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function generateStaticParams() {
  const activeCategoryIds = new Set(
    products.filter((product) => product.isActive).map((product) => product.categoryId),
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
  const categoryProducts = products.filter(
    (product) => product.isActive && product.categoryId === category.id,
  );
  if (categoryProducts.length === 0) notFound();

  const breadcrumb = breadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "محصولات", path: "/products" },
    { name: category.nameFa, path: `/products/category/${category.slug}` },
  ]);
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
        {categoryProducts.map((product) => {
          const variant = getPrimaryVariant(product.id);
          const inventory = getInventoryByVariant(variant.id);
          const available = inventory ? getAvailableStock(inventory) : 0;
          return (
            <ProductCard
              key={product.id}
              title={product.nameFa}
              description={product.shortDescriptionFa}
              media={
                <Image
                  src={getProductImage(product)}
                  alt={product.nameFa}
                  width={520}
                  height={390}
                  className="h-full w-full object-cover"
                />
              }
              badge={<StockStatus available={available} />}
              price={<Price valueRial={variant.retailPriceRial} />}
              actions={
                <div className="grid w-full gap-2">
                  <Link href={`/products/${product.slug}`}>
                    <Button size="sm" variant="ghost" className="w-full">
                      جزئیات
                    </Button>
                  </Link>
                  <AddToCartButton variantId={variant.id} label="افزودن به سبد خرید" />
                </div>
              }
            />
          );
        })}
      </section>
    </main>
  );
}
