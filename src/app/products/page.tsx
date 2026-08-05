import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, Button, Price, ProductCard, StockStatus } from "@ufo/ui";
import {
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  searchProducts
} from "@ufo/domain";
import { AddToCartButton } from "@/components/add-to-cart-button";

export const metadata: Metadata = {
  title: "کاتالوگ محصولات",
  description: "کاتالوگ پاد، ویپ، جویس، کویل و کارتریج با قیمت و موجودی.",
  alternates: { canonical: "/products" }
};

export default async function ProductsPage({
  searchParams
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="h-fit rounded-md border border-[#22303D] bg-[#0D1117] p-4">
          <h1 className="text-xl font-black">کاتالوگ</h1>
          <form action="/products" className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm">
              جستجو
              <input
                name="q"
                defaultValue={q}
                className="min-h-11 rounded-md border border-[#22303D] bg-[#05070B] px-3 outline-none focus:border-[#00D9FF]"
                placeholder="نام محصول یا SKU"
              />
            </label>
            <button className="min-h-11 rounded-md bg-[#00D9FF] font-bold text-[#05070B]">
              اعمال فیلتر
            </button>
          </form>
          <nav aria-label="دسته‌بندی‌ها" className="mt-5 grid gap-2 text-sm">
            <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/products">
              همه محصولات
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                className="rounded-md px-3 py-2 hover:bg-white/10"
                href={`/products?category=${item.slug}`}
              >
                {item.nameFa}
              </Link>
            ))}
          </nav>
        </aside>
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#9BA7B4]">
              {new Intl.NumberFormat("fa-IR").format(filtered.length)} محصول پیدا شد
            </p>
            <Badge tone="info">مرتب‌سازی کم‌ارزش برای SEO noindex می‌شود</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => {
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
                      key={`media-${product.id}`}
                      src={product.image}
                      alt={product.nameFa}
                      width={520}
                      height={390}
                      className="h-full w-full object-cover"
                    />
                  }
                  badge={<StockStatus key={`stock-${product.id}`} available={available} />}
                  price={<Price key={`price-${product.id}`} valueRial={variant.retailPriceRial} />}
                  actions={
                    <div key={`actions-${product.id}`} className="flex flex-wrap gap-2">
                      <Link href={`/products/${product.slug}`}>
                        <Button size="sm" variant="ghost">جزئیات</Button>
                      </Link>
                      <AddToCartButton variantId={variant.id} label="خرید سریع" />
                    </div>
                  }
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
