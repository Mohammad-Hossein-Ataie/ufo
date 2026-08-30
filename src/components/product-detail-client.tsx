"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Palette, Sparkles } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { ProductVariantOption } from "@ufo/domain";
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
  variantOptions: ProductVariantOption[];
}

function optionSwatchStyle(option: ProductVariantOption) {
  if (!option.swatch) return undefined;
  return option.swatch.startsWith("linear-gradient")
    ? { backgroundImage: option.swatch }
    : { backgroundColor: option.swatch };
}

function buildVariantImageMap(
  options: ProductVariantOption[],
  images: string[],
  variantImages: Record<string, string>,
) {
  return new Map<string, string>(
    options
      .map((option, index): [string, string | undefined] => [
        option.id,
        variantImages[option.id] ?? images[index],
      ])
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
    () => buildVariantImageMap(variantOptions, galleryImages, variantImages),
    [variantImages, variantOptions, galleryImages],
  );
  const imageColorMap = useMemo(() => {
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

  function selectVariantValue(valueId: string) {
    setSelectedVariantValueId(valueId);
    setSelectedImage(variantImageMap.get(valueId) ?? firstImage);
  }

  function selectImage(image: string) {
    setSelectedImage(image);
    setSelectedVariantValueId(imageColorMap.get(image) ?? null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_29rem]">
      <section className="grid gap-3">
        <div className="overflow-hidden rounded-md border border-[#22303D] bg-[#0D1117] p-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#141A22]">
            <Image
              src={selectedImage}
              alt={
                selectedVariantOption
                  ? `${product.nameFa} - ${selectedVariantOption.labelFa}`
                  : product.nameFa
              }
              fill
              priority
              className="object-contain p-4 transition-transform duration-300"
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {galleryImages.map((image, index) => {
            const active = selectedImage === image;
            const thumbnailOption = variantOptions.find(
              (option) => option.id === imageColorMap.get(image),
            );
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => selectImage(image)}
                className={`group relative aspect-square overflow-hidden rounded-md border bg-[#141A22] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                  active
                    ? "border-cyan-300 ring-2 ring-cyan-300/30"
                    : "border-[#22303D] hover:border-cyan-300/70"
                }`}
                aria-label={`${product.nameFa} ${thumbnailOption?.labelFa ?? index + 1}`}
                aria-pressed={active}
              >
                <Image
                  src={image}
                  alt={`${product.nameFa} ${thumbnailOption?.labelFa ?? index + 1}`}
                  fill
                  sizes="120px"
                  className="object-contain p-2"
                />
                {thumbnailOption?.swatch ? (
                  <span
                    className="absolute bottom-1 right-1 h-4 w-4 rounded-full border border-white/50 shadow-sm"
                    style={optionSwatchStyle(thumbnailOption)}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5 shadow-retail-lg lg:sticky lg:top-24">
        <div className="flex flex-wrap items-center gap-2">
          <StockStatus available={available} />
          <Badge tone="warning">۱۸+</Badge>
          {brandName ? <Badge tone="info">{brandName}</Badge> : null}
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

        <div className="mt-6 grid gap-4">
          {hasVariantOptions ? (
            <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-black">
                  {variantType === "flavor" ? (
                    <Sparkles size={17} className="text-cyan-300" aria-hidden="true" />
                  ) : (
                    <Palette size={17} className="text-cyan-300" aria-hidden="true" />
                  )}
                  انتخاب {variantTypeLabel}
                </h2>
                <span className="text-xs text-[#9BA7B4]">
                  {selectedVariantOption ? selectedVariantOption.labelFa : "هنوز انتخاب نشده"}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={`انتخاب ${variantTypeLabel} محصول`}
              >
                {variantOptions.map((option) => {
                  const active = selectedVariantValueId === option.id;
                  const optionImage = variantImageMap.get(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectVariantValue(option.id)}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                        active
                          ? "border-cyan-300 bg-cyan-300 text-slate-950"
                          : "border-[#22303D] bg-[#141A22] text-white hover:border-cyan-300/70"
                      }`}
                      role="radio"
                      aria-checked={active}
                    >
                      {option.swatch ? (
                        <span
                          className="h-5 w-5 rounded-full border border-white/35"
                          style={optionSwatchStyle(option)}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span>{option.labelFa}</span>
                      {optionImage ? <span className="sr-only">تصویر اختصاصی دارد</span> : null}
                      {active ? <Check size={15} aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {needsVariantSelection ? (
            <Button type="button" disabled className="w-full">
              ابتدا {variantTypeLabel} را انتخاب کنید
            </Button>
          ) : (
            <AddToCartButton
              key={`${variant.id}-${selectedVariantValueId ?? "default"}`}
              variantId={variant.id}
              maxQuantity={available > 0 ? available : undefined}
              label={available > 0 ? "افزودن به سبد" : "ثبت پیش‌سفارش"}
              enableQuantity
              selectedVariant={
                selectedVariantValueId && variantType !== "none"
                  ? { type: variantType, valueId: selectedVariantValueId }
                  : undefined
              }
            />
          )}
        </div>

        <div className="mt-5">
          <Alert title="هشدار مصرف" tone="warning">
            این محصول حاوی نیکوتین است و فقط برای افراد بالای ۱۸ سال عرضه می‌شود.
          </Alert>
        </div>
      </aside>
    </div>
  );
}
