"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Check, PackageCheck, Palette, Sparkles } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  FlavorVisual,
  SelectedCheck,
  VariantOptionVisual,
} from "@/components/product-variant-visuals";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";
import type { Product, ProductVariant, ProductVariantType } from "@ufo/types";
import { Alert, Badge, Button, Price, StockStatus } from "@ufo/ui";

interface ProductDetailClientProps {
  product: Product;
  variant: ProductVariant;
  available: number;
  brandName?: string | undefined;
  galleryImages: string[];
  variantType: ProductVariantType;
  variantImages: Record<string, string>;
  variantOptions: StorefrontVariantOption[];
}

function buildVariantImageMap(
  options: StorefrontVariantOption[],
  variantImages: Record<string, string>,
) {
  return new Map<string, string>(
    options
      .map((option): [string, string | undefined] => [option.id, variantImages[option.id]])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export function ProductDetailClient({
  product,
  variant,
  available,
  brandName,
  galleryImages,
  variantType,
  variantImages,
  variantOptions,
}: ProductDetailClientProps) {
  const firstImage = galleryImages[0] ?? product.image;
  const variantImageMap = useMemo(
    () => buildVariantImageMap(variantOptions, variantImages),
    [variantImages, variantOptions],
  );
  const imageVariantValueMap = useMemo(() => {
    const entries = Array.from(variantImageMap.entries()).map(
      ([valueId, image]): [string, string] => [image, valueId],
    );
    return new Map<string, string>(entries);
  }, [variantImageMap]);
  const [selectedImage, setSelectedImage] = useState(firstImage);
  const [selectedVariantValueId, setSelectedVariantValueId] = useState<string | null>(null);
  const selectedVariantOption = variantOptions.find(
    (option) => option.id === selectedVariantValueId,
  );
  const hasVariantOptions = variantType !== "none" && variantOptions.length > 0;
  const needsVariantSelection = hasVariantOptions && !selectedVariantValueId;
  const variantTypeLabel = variantType === "flavor" ? "طعم" : "رنگ";
  const selectorTitle = variantType === "flavor" ? "طعم را انتخاب کنید" : "رنگ را انتخاب کنید";

  function selectVariantValue(valueId: string) {
    setSelectedVariantValueId(valueId);
    setSelectedImage(variantImageMap.get(valueId) ?? firstImage);
  }

  function selectImage(image: string) {
    setSelectedImage(image);
    setSelectedVariantValueId(imageVariantValueMap.get(image) ?? null);
  }

  return (
    <section className="grid gap-7 rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(0,217,255,0.10),transparent_34%),#0D1117] p-3 shadow-retail-lg sm:p-5 lg:grid-cols-[minmax(0,1.03fr)_minmax(24rem,0.97fr)] lg:p-6">
      <div className="grid gap-3 lg:order-2">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#F5F7FA] p-3 sm:p-4">
          <div className="relative mx-auto aspect-square max-h-[34rem] max-w-[34rem] overflow-hidden rounded-lg bg-white">
            <Image
              key={selectedImage}
              src={selectedImage}
              alt={
                selectedVariantOption
                  ? `${product.nameFa} - ${selectedVariantOption.labelFa}`
                  : product.nameFa
              }
              fill
              priority
              unoptimized
              className="object-contain p-3 transition-opacity duration-200 motion-reduce:transition-none"
              sizes="(min-width: 1024px) 47vw, 100vw"
            />
          </div>
          {selectedVariantOption ? (
            <span className="absolute right-4 top-4 inline-flex select-none items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm">
              <VariantOptionVisual option={selectedVariantOption} size="sm" />
              {selectedVariantOption.labelFa}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
          {galleryImages.map((image, index) => {
            const active = selectedImage === image;
            const thumbnailOption = variantOptions.find(
              (option) => option.id === imageVariantValueMap.get(image),
            );
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => selectImage(image)}
                className={`relative aspect-square select-none overflow-hidden rounded-md border bg-white transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none ${
                  active
                    ? "border-cyan-300 ring-2 ring-cyan-300/30"
                    : "border-white/10 hover:border-cyan-300/70"
                }`}
                aria-label={`${product.nameFa} ${thumbnailOption?.labelFa ?? index + 1}`}
                aria-pressed={active}
              >
                <Image
                  src={image}
                  alt={`${product.nameFa} ${thumbnailOption?.labelFa ?? index + 1}`}
                  fill
                  unoptimized
                  sizes="112px"
                  className="object-contain p-1.5"
                />
                {thumbnailOption ? (
                  <span className="absolute bottom-1 right-1">
                    <VariantOptionVisual option={thumbnailOption} size="sm" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-col py-1 lg:order-1">
        <div className="flex flex-wrap items-center gap-2">
          <StockStatus available={available} />
          <Badge tone="warning">۱۸+</Badge>
          {brandName ? <Badge tone="info">{brandName}</Badge> : null}
        </div>

        <div className="mt-5">
          <h1 className="text-3xl font-black leading-[1.35] text-white sm:text-4xl">
            {product.nameFa}
          </h1>
          {product.nameEn ? (
            <p className="mt-2 text-sm font-semibold text-retail-secondary" dir="ltr">
              {product.nameEn}
            </p>
          ) : null}
          <p className="mt-4 max-w-2xl leading-8 text-[#D9E2EC]">{product.shortDescriptionFa}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-white/10 py-4">
          <div>
            <p className="text-xs font-bold text-retail-secondary">قیمت فروش</p>
            <div className="mt-1 text-3xl font-black text-retail-accent">
              <Price valueRial={variant.retailPriceRial} />
            </div>
          </div>
          <div className="grid gap-1 text-left text-xs text-retail-secondary">
            <span dir="ltr">SKU: {variant.sku}</span>
            <span>{new Intl.NumberFormat("fa-IR").format(available)} عدد قابل سفارش</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {hasVariantOptions ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-base font-black text-white">
                  {variantType === "flavor" ? (
                    <Sparkles size={18} className="text-cyan-300" aria-hidden="true" />
                  ) : (
                    <Palette size={18} className="text-cyan-300" aria-hidden="true" />
                  )}
                  {selectorTitle}
                </h2>
                {selectedVariantOption ? (
                  <span className="text-xs font-bold text-retail-accent">
                    {selectedVariantOption.labelFa}
                  </span>
                ) : null}
              </div>

              <div
                className={
                  variantType === "flavor" ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"
                }
                role="radiogroup"
                aria-label={`انتخاب ${variantTypeLabel} محصول`}
              >
                {variantOptions.map((option) => {
                  const active = selectedVariantValueId === option.id;
                  const optionImage = variantImageMap.get(option.id);
                  const unavailable = available <= 0;

                  if (option.type === "flavor") {
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => selectVariantValue(option.id)}
                        disabled={unavailable}
                        className={`flex min-h-12 select-none items-center justify-between gap-3 rounded-md border px-3 text-sm font-black transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${
                          active
                            ? "border-cyan-300 bg-cyan-300 text-slate-950 shadow-[0_10px_24px_rgba(0,217,255,0.20)]"
                            : "border-white/10 bg-white/[0.04] text-white hover:border-cyan-300/60 hover:bg-white/[0.07]"
                        }`}
                        role="radio"
                        aria-checked={active}
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <FlavorVisual option={option} />
                          <span className="truncate">{option.labelFa}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1">
                          {optionImage ? <PackageCheck size={14} aria-hidden="true" /> : null}
                          {active ? <SelectedCheck /> : null}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectVariantValue(option.id)}
                      disabled={unavailable}
                      className={`inline-flex min-h-11 select-none items-center gap-2 rounded-md border px-3 text-sm font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${
                        active
                          ? "border-cyan-300 bg-white text-slate-950"
                          : "border-white/10 bg-white/[0.04] text-white hover:border-cyan-300/60"
                      }`}
                      role="radio"
                      aria-checked={active}
                    >
                      <VariantOptionVisual option={option} />
                      <span>{option.labelFa}</span>
                      {active ? <Check size={15} aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {needsVariantSelection ? (
            <Button type="button" disabled className="w-full min-h-12 text-base">
              ابتدا {variantTypeLabel} را انتخاب کنید
            </Button>
          ) : (
            <AddToCartButton
              key={`${variant.id}-${selectedVariantValueId ?? "default"}`}
              variantId={variant.id}
              maxQuantity={available > 0 ? available : undefined}
              label={available > 0 ? "افزودن به سبد خرید" : "ثبت پیش‌سفارش"}
              enableQuantity
              selectedVariant={
                selectedVariantValueId && variantType !== "none"
                  ? { type: variantType, valueId: selectedVariantValueId }
                  : undefined
              }
            />
          )}
        </div>

        <div className="mt-5 grid gap-2 text-sm text-retail-secondary sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <BadgeCheck size={17} className="text-retail-accent-2" aria-hidden="true" />
            موجودی و قیمت قبل از ارسال بررسی می‌شود
          </span>
          <span className="inline-flex items-center gap-2">
            <AlertTriangle size={17} className="text-amber-300" aria-hidden="true" />
            فروش فقط برای افراد بالای ۱۸ سال
          </span>
        </div>

        <div className="mt-5">
          <Alert title="هشدار مصرف" tone="warning">
            این محصول حاوی نیکوتین است و فقط برای افراد بالای ۱۸ سال عرضه می‌شود.
          </Alert>
        </div>
      </div>
    </section>
  );
}
