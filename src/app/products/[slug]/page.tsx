import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Alert, Badge, Price, StockStatus } from "@ufo/ui";
import {
  findProduct,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  products
} from "@ufo/domain";
import { breadcrumbJsonLd, productJsonLd } from "@ufo/seo";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};
  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      images: [product.image]
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  const variant = getPrimaryVariant(product.id);
  const inventory = getInventoryByVariant(variant.id);
  const available = inventory ? getAvailableStock(inventory) : 0;
  const jsonLd = productJsonLd(product, variant.retailPriceRial, available > 0);
  const breadcrumb = breadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "محصولات", path: "/products" },
    { name: product.nameFa, path: `/products/${product.slug}` }
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="overflow-hidden rounded-md border border-[#22303D] bg-[#0D1117]">
          <div className="relative aspect-[4/3]">
            <Image src={product.image} alt={product.nameFa} fill priority className="object-cover" sizes="(min-width: 1024px) 60vw, 100vw" />
          </div>
        </section>
        <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StockStatus available={available} />
            <Badge tone="warning">۱۸+</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-[1.4]">{product.nameFa}</h1>
          {product.nameEn ? <p className="mt-1 text-sm text-[#9BA7B4]" dir="ltr">{product.nameEn}</p> : null}
          <p className="mt-3 leading-8 text-[#D9E2EC]">{product.shortDescriptionFa}</p>
          <div className="mt-5 text-2xl font-black text-[#20F28B]">
            <Price valueRial={variant.retailPriceRial} />
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between gap-3 border-t border-[#22303D] pt-3">
              <dt className="text-[#9BA7B4]">SKU</dt>
              <dd dir="ltr">{variant.sku}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#22303D] pt-3">
              <dt className="text-[#9BA7B4]">موجودی قابل فروش</dt>
              <dd>{new Intl.NumberFormat("fa-IR").format(available)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <AddToCartButton variantId={variant.id} label={available > 0 ? "افزودن به سبد" : "ثبت پیش‌سفارش"} />
          </div>
          <Alert title="هشدار مصرف" tone="warning">
            این محصول حاوی نیکوتین است و فقط برای افراد بالای ۱۸ سال عرضه می‌شود.
          </Alert>
        </aside>
      </div>
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black">توضیحات</h2>
          <p className="mt-3 leading-8 text-[#D9E2EC]">{product.descriptionFa}</p>
        </div>
        <div>
          <h2 className="text-2xl font-black">مشخصات</h2>
          <dl className="mt-3 grid gap-2">
            {(product.specs ?? []).map((spec) => (
              <div key={`${spec.labelFa}-${spec.valueFa}`} className="flex justify-between rounded-md border border-[#22303D] p-3">
                <dt className="text-[#9BA7B4]">{spec.labelFa}</dt>
                <dd>{spec.valueFa}</dd>
              </div>
            ))}
            {product.attributes.map((attribute) => (
              <div key={`${attribute.nameFa}-${attribute.valueFa}`} className="flex justify-between rounded-md border border-[#22303D] p-3">
                <dt className="text-[#9BA7B4]">{attribute.nameFa}</dt>
                <dd>{attribute.valueFa}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      {product.highlightsFa?.length || product.packageItemsFa?.length ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {product.highlightsFa?.length ? (
            <div>
              <h2 className="text-2xl font-black">مزایا</h2>
              <ul className="mt-3 grid gap-2 leading-8 text-[#D9E2EC]">
                {product.highlightsFa.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}
          {product.packageItemsFa?.length ? (
            <div>
              <h2 className="text-2xl font-black">محتویات بسته</h2>
              <ul className="mt-3 grid gap-2 leading-8 text-[#D9E2EC]">
                {product.packageItemsFa.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
