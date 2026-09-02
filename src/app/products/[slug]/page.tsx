import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Box, Film, ListChecks, ShieldCheck } from "lucide-react";
import { ProductDetailClient } from "@/components/product-detail-client";
import { ProductVariantSummary } from "@/components/product-variant-visuals";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { findCatalogRowBySlug, getCatalogRowStock, listCatalogRows } from "@/lib/catalog-data";
import { listAdminColors } from "@/lib/admin-colors";
import { listAdminFlavors } from "@/lib/admin-flavors";
import {
  getCategoryImage,
  getProductImage,
  getProductImages,
  getProductVariantImages,
} from "@/lib/product-images";
import { getStorefrontVariantOptions } from "@/lib/storefront-variants";
import { rewriteLiaraPublicUrl } from "@ufo/storage";
import {
  brands,
  categories,
  getProductVariantType,
  productColorAttributeTechnicalValue,
  productFlavorAttributeTechnicalValue,
} from "@ufo/domain";
import { breadcrumbJsonLd, jsonLdScriptProps, productJsonLd } from "@ufo/seo";
import { Button, Price, ProductCard, StockStatus } from "@ufo/ui";

export const dynamic = "force-dynamic";

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
      const imageUrl = rewriteLiaraPublicUrl(imageMatch.groups.url);
      return (
        <figure key={`${block}-${index}`} className="overflow-hidden rounded-xl bg-white/[0.04]">
          <div className="relative aspect-[16/10]">
            <Image
              src={imageUrl}
              alt={imageMatch.groups.alt || "تصویر توضیحات محصول"}
              fill
              unoptimized
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
          className="aspect-video w-full rounded-xl bg-black"
          src={url}
          controls
        />
      ) : (
        <iframe
          key={`${block}-${index}`}
          className="aspect-video w-full rounded-xl bg-black"
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

export async function generateStaticParams() {
  return (await listCatalogRows())
    .filter((row) => row.product.isActive)
    .map((row) => ({ slug: row.product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await findCatalogRowBySlug(slug);
  const product = row?.product;
  if (!product) return {};
  const images = getProductImages(product);
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
  const row = await findCatalogRowBySlug(slug);
  if (!row) notFound();

  const product = row.product;
  const variant = row.variant;
  const available = getCatalogRowStock(row);
  const brand = brands.find((item) => item.id === product.brandId);
  const category = categories.find((item) => item.id === product.categoryId);
  const galleryImages = getProductImages(product);
  const variantImages = getProductVariantImages(product);
  const variantType = getProductVariantType(product);
  const flavors = await listAdminFlavors();
  const colors = await listAdminColors();
  const variantOptions = getStorefrontVariantOptions(product, flavors, colors);
  const relatedRows = (await listCatalogRows())
    .filter(
      (item) =>
        item.product.isActive &&
        item.product.id !== product.id &&
        item.product.categoryId === product.categoryId,
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
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

        <ProductDetailClient
          product={product}
          variant={variant}
          available={available}
          brandName={brand?.nameFa}
          galleryImages={galleryImages}
          variantType={variantType}
          variantImages={variantImages}
          variantOptions={variantOptions}
        />

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-xl bg-[#0D1117] p-5 ring-1 ring-white/10">
            <h2 className="inline-flex items-center gap-2 text-xl font-black">
              <Film size={22} className="text-cyan-300" aria-hidden="true" />
              توضیحات
            </h2>
            <div className="mt-4 grid gap-4">{renderRichDescription(product.descriptionFa)}</div>
          </div>
          <div className="rounded-xl bg-[#0D1117] p-5 ring-1 ring-white/10">
            <h2 className="inline-flex items-center gap-2 text-xl font-black">
              <ListChecks size={22} className="text-cyan-300" aria-hidden="true" />
              مشخصات
            </h2>
            <dl className="mt-4 grid gap-2">
              {(product.specs ?? []).map((spec) => (
                <div
                  key={`${spec.labelFa}-${spec.valueFa}`}
                  className="flex justify-between gap-3 border-b border-white/10 py-2 last:border-b-0"
                >
                  <dt className="text-[#9BA7B4]">{spec.labelFa}</dt>
                  <dd>{spec.valueFa}</dd>
                </div>
              ))}
              {product.attributes
                .filter(
                  (attribute) =>
                    attribute.technicalValue !== productColorAttributeTechnicalValue &&
                    attribute.technicalValue !== productFlavorAttributeTechnicalValue,
                )
                .map((attribute) => (
                  <div
                    key={`${attribute.nameFa}-${attribute.valueFa}`}
                    className="flex justify-between gap-3 border-b border-white/10 py-2 last:border-b-0"
                  >
                    <dt className="text-[#9BA7B4]">{attribute.nameFa}</dt>
                    <dd>{attribute.valueFa}</dd>
                  </div>
                ))}
              {variantOptions.length > 0 ? (
                <div className="pt-2">
                  <dt className="text-[#9BA7B4]">
                    {variantType === "flavor" ? "طعم‌های قابل انتخاب" : "رنگ‌های قابل سفارش"}
                  </dt>
                  <dd className="mt-2">
                    <ProductVariantSummary options={variantOptions} />
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        {product.highlightsFa?.length || product.packageItemsFa?.length ? (
          <section className="mt-10 grid gap-5 lg:grid-cols-2">
            {product.highlightsFa?.length ? (
              <div className="rounded-xl bg-[#0D1117] p-5 ring-1 ring-white/10">
                <h2 className="inline-flex items-center gap-2 text-xl font-black">
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
              <div className="rounded-xl bg-[#0D1117] p-5 ring-1 ring-white/10">
                <h2 className="inline-flex items-center gap-2 text-xl font-black">
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

        {relatedRows.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">محصولات مرتبط</h2>
              <Link
                href="/products"
                className="inline-flex select-none items-center gap-1 text-sm font-bold text-cyan-300"
              >
                همه محصولات
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedRows.map((relatedRow) => {
                const related = relatedRow.product;
                const relatedVariant = relatedRow.variant;
                const relatedAvailable = getCatalogRowStock(relatedRow);
                const relatedVariantOptions = getStorefrontVariantOptions(related, flavors, colors);
                return (
                  <ProductCard
                    key={related.id}
                    title={related.nameFa}
                    description={related.shortDescriptionFa}
                    mediaClassName="bg-white"
                    media={
                      <StorefrontProductImage
                        src={getProductImage(related)}
                        fallbackSrc={
                          getCategoryImage(related.categoryId) ?? "/images/categories/lighter.png"
                        }
                        alt={related.nameFa}
                        className="h-full w-full object-contain p-3 transition duration-200 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    }
                    badge={<StockStatus available={relatedAvailable} />}
                    price={<Price valueRial={relatedVariant.retailPriceRial} />}
                    actions={
                      <div className="grid gap-3">
                        <ProductVariantSummary options={relatedVariantOptions} />
                        <Link href={`/products/${related.slug}`}>
                          <Button size="sm" variant="ghost" className="w-full">
                            جزئیات
                          </Button>
                        </Link>
                      </div>
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
