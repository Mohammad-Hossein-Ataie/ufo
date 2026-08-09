import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Box, Film, ListChecks, ShieldCheck } from "lucide-react";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import {
  brands,
  categories,
  findProduct,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  getProductColorOptions,
  products,
  productColorAttributeTechnicalValue,
} from "@ufo/domain";
import { breadcrumbJsonLd, jsonLdScriptProps, productJsonLd } from "@ufo/seo";
import { Alert, Badge, Button, Price, ProductCard, StockStatus } from "@ufo/ui";

const imageBlockPattern = /^!\[(?<alt>.*)]\((?<url>.+)\)$/;
const videoBlockPattern = /^\[ویدیو.*]\((?<url>.+)\)$/;

function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
  } catch {
    return url;
  }
  return url;
}

function renderRichDescription(description: string) {
  const blocks = description
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const imageMatch = block.match(imageBlockPattern);
    if (imageMatch?.groups?.url) {
      return (
        <figure
          key={`${block}-${index}`}
          className="overflow-hidden rounded-md border border-[#22303D] bg-[#0D1117]"
        >
          <div className="relative aspect-[16/10]">
            <Image
              src={imageMatch.groups.url}
              alt={imageMatch.groups.alt || "تصویر توضیحات محصول"}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      );
    }

    const videoMatch = block.match(videoBlockPattern);
    if (videoMatch?.groups?.url) {
      const url = videoMatch.groups.url;
      const isFileVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
      return isFileVideo ? (
        <video
          key={`${block}-${index}`}
          className="aspect-video w-full rounded-md border border-[#22303D] bg-black"
          src={url}
          controls
        />
      ) : (
        <iframe
          key={`${block}-${index}`}
          className="aspect-video w-full rounded-md border border-[#22303D] bg-black"
          src={youtubeEmbedUrl(url)}
          title="ویدیو محصول"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <p key={`${block}-${index}`} className="leading-8 text-[#D9E2EC]">
        {block}
      </p>
    );
  });
}

export function generateStaticParams() {
  return products.filter((product) => product.isActive).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};
  const images = product.images?.length ? product.images : [product.image];
  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      images,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  const variant = getPrimaryVariant(product.id);
  const inventory = getInventoryByVariant(variant.id);
  const available = inventory ? getAvailableStock(inventory) : 0;
  const brand = brands.find((item) => item.id === product.brandId);
  const category = categories.find((item) => item.id === product.categoryId);
  const galleryImages = product.images?.length ? product.images : [product.image];
  const colorOptions = getProductColorOptions(product);
  const relatedProducts = products
    .filter(
      (item) => item.isActive && item.id !== product.id && item.categoryId === product.categoryId,
    )
    .slice(0, 4);
  const jsonLd = productJsonLd(product, variant, available > 0, brand?.nameFa);
  const breadcrumb = breadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "محصولات", path: "/products" },
    { name: product.nameFa, path: `/products/${product.slug}` },
  ]);

  return (
    <main id="main-content" className="bg-retail-bg text-retail-primary">
      <script {...jsonLdScriptProps(jsonLd)} />
      <script {...jsonLdScriptProps(breadcrumb)} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav aria-label="مسیر صفحه" className="mb-5 text-sm text-[#9BA7B4]">
          <Link href="/products" className="hover:text-cyan-200">
            محصولات
          </Link>
          {category ? (
            <>
              <span className="px-2">/</span>
              <Link href={`/products/category/${category.slug}`} className="hover:text-cyan-200">
                {category.nameFa}
              </Link>
            </>
          ) : null}
          <span className="px-2">/</span>
          <span>{product.nameFa}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_29rem]">
          <section className="grid gap-3">
            <div className="overflow-hidden rounded-md border border-[#22303D] bg-[#0D1117] p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#141A22]">
                <Image
                  src={galleryImages[0] ?? product.image}
                  alt={product.nameFa}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {galleryImages.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className={`relative aspect-square overflow-hidden rounded-md border bg-[#141A22] ${
                    index === 0 ? "border-cyan-300" : "border-[#22303D]"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.nameFa} ${index + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5 shadow-retail-lg lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <StockStatus available={available} />
              <Badge tone="warning">۱۸+</Badge>
              {brand ? <Badge tone="info">{brand.nameFa}</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-black leading-[1.4]">{product.nameFa}</h1>
            {product.nameEn ? (
              <p className="mt-1 text-sm text-[#9BA7B4]" dir="ltr">
                {product.nameEn}
              </p>
            ) : null}
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
              <ProductPurchasePanel
                variantId={variant.id}
                colorOptions={colorOptions}
                maxQuantity={available > 0 ? available : undefined}
                label={available > 0 ? "افزودن به سبد" : "ثبت پیش‌سفارش"}
              />
            </div>
            <div className="mt-5">
              <Alert title="هشدار مصرف" tone="warning">
                این محصول حاوی نیکوتین است و فقط برای افراد بالای ۱۸ سال عرضه می‌شود.
              </Alert>
            </div>
          </aside>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-black">
              <Film size={22} className="text-cyan-300" aria-hidden="true" />
              توضیحات محصول
            </h2>
            <div className="mt-4 grid gap-4">{renderRichDescription(product.descriptionFa)}</div>
          </div>
          <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
            <h2 className="inline-flex items-center gap-2 text-2xl font-black">
              <ListChecks size={22} className="text-cyan-300" aria-hidden="true" />
              مشخصات
            </h2>
            <dl className="mt-4 grid gap-2">
              {(product.specs ?? []).map((spec) => (
                <div
                  key={`${spec.labelFa}-${spec.valueFa}`}
                  className="flex justify-between rounded-md border border-[#22303D] p-3"
                >
                  <dt className="text-[#9BA7B4]">{spec.labelFa}</dt>
                  <dd>{spec.valueFa}</dd>
                </div>
              ))}
              {product.attributes
                .filter(
                  (attribute) => attribute.technicalValue !== productColorAttributeTechnicalValue,
                )
                .map((attribute) => (
                  <div
                    key={`${attribute.nameFa}-${attribute.valueFa}`}
                    className="flex justify-between rounded-md border border-[#22303D] p-3"
                  >
                    <dt className="text-[#9BA7B4]">{attribute.nameFa}</dt>
                    <dd>{attribute.valueFa}</dd>
                  </div>
                ))}
              {colorOptions.length > 0 ? (
                <div className="rounded-md border border-[#22303D] p-3">
                  <dt className="text-[#9BA7B4]">رنگ‌های قابل سفارش</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <span
                        key={color.id}
                        className="inline-flex items-center gap-2 rounded-md bg-white/5 px-2 py-1 text-sm"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-white/30"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden="true"
                        />
                        {color.labelFa}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        {product.highlightsFa?.length || product.packageItemsFa?.length ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            {product.highlightsFa?.length ? (
              <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
                <h2 className="inline-flex items-center gap-2 text-2xl font-black">
                  <ShieldCheck size={22} className="text-[#20F28B]" aria-hidden="true" />
                  مزایا
                </h2>
                <ul className="mt-3 grid gap-2 leading-8 text-[#D9E2EC]">
                  {product.highlightsFa.map((item) => (
                    <li key={item} className="flex gap-2">
                      <BadgeCheck
                        size={18}
                        className="mt-1 shrink-0 text-[#20F28B]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {product.packageItemsFa?.length ? (
              <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
                <h2 className="inline-flex items-center gap-2 text-2xl font-black">
                  <Box size={22} className="text-cyan-300" aria-hidden="true" />
                  محتویات بسته
                </h2>
                <ul className="mt-3 grid gap-2 leading-8 text-[#D9E2EC]">
                  {product.packageItemsFa.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {relatedProducts.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">محصولات مرتبط</h2>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-sm font-bold text-cyan-300"
              >
                همه محصولات
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => {
                const relatedVariant = getPrimaryVariant(related.id);
                const relatedInventory = getInventoryByVariant(relatedVariant.id);
                const relatedAvailable = relatedInventory ? getAvailableStock(relatedInventory) : 0;
                return (
                  <ProductCard
                    key={related.id}
                    title={related.nameFa}
                    description={related.shortDescriptionFa}
                    media={
                      <Image
                        src={related.image}
                        alt={related.nameFa}
                        width={520}
                        height={390}
                        className="h-full w-full object-cover"
                      />
                    }
                    badge={<StockStatus available={relatedAvailable} />}
                    price={<Price valueRial={relatedVariant.retailPriceRial} />}
                    actions={
                      <Link href={`/products/${related.slug}`}>
                        <Button size="sm" variant="ghost" className="w-full">
                          جزئیات
                        </Button>
                      </Link>
                    }
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
