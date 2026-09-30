"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Gauge,
  PackageCheck,
  Palette,
  Sparkles,
  ZoomIn,
} from "lucide-react";
import { ImageLightbox, type ImageLightboxItem } from "@/components/image-lightbox";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageCrossfade } from "@/components/product-image-crossfade";
import { ProtectedProductImage } from "@/components/protected-product-image";
import {
  FlavorVisual,
  SelectedCheck,
  VariantOptionVisual,
} from "@/components/product-variant-visuals";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";
import type { Product, ProductVariant, ProductVariantType } from "@ufo/types";
import { Alert, Badge, Button, Price, StockStatus } from "@ufo/ui";
import type { PublicAvailabilityState } from "@/lib/public-availability";

interface ProductDetailClientProps {
  product: Pick<Product, "id" | "nameFa" | "nameEn" | "shortDescriptionFa">;
  variant: ProductVariant;
  availability: PublicAvailabilityState;
  purchasable: boolean;
  brandName?: string | undefined;
  galleryImages: string[];
  variantType: ProductVariantType;
  variantImages: Record<string, string>;
  variantOptions: StorefrontVariantOption[];
  initialVariantValueId: string | null;
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

function getVariantTypeLabel(variantType: ProductVariantType) {
  if (variantType === "flavor") return "طعم";
  if (variantType === "color") return "رنگ";
  if (variantType === "resistance") return "اهم";
  if (variantType === "capacity") return "ظرفیت";
  return "";
}

export function ProductDetailClient({
  product,
  variant,
  availability,
  purchasable,
  brandName,
  galleryImages,
  variantType,
  variantImages,
  variantOptions,
  initialVariantValueId,
}: ProductDetailClientProps) {
  const firstImage = galleryImages[0] ?? "/images/categories/lighter.webp";
  const variantImageMap = useMemo(
    () => buildVariantImageMap(variantOptions, variantImages),
    [variantImages, variantOptions],
  );
  const imagePreloadSources = useMemo(
    () => [...new Set([...variantImageMap.values(), ...galleryImages])],
    [variantImageMap, galleryImages],
  );
  const imageVariantValueMap = useMemo(() => {
    const entries = Array.from(variantImageMap.entries()).map(
      ([valueId, image]): [string, string] => [image, valueId],
    );
    return new Map<string, string>(entries);
  }, [variantImageMap]);
  const lightboxImages = useMemo<ImageLightboxItem[]>(
    () =>
      imagePreloadSources.map((image, index) => {
        const optionId = imageVariantValueMap.get(image);
        const option = variantOptions.find((item) => item.id === optionId);
        return {
          src: image,
          alt: option
            ? `${product.nameFa} - ${option.labelFa}`
            : `${product.nameFa} - تصویر ${new Intl.NumberFormat("fa-IR").format(index + 1)}`,
        };
      }),
    [imagePreloadSources, imageVariantValueMap, product.nameFa, variantOptions],
  );
  const initialImage = initialVariantValueId
    ? (variantImageMap.get(initialVariantValueId) ?? firstImage)
    : firstImage;
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [imageOpen, setImageOpen] = useState(false);
  const [selectedVariantValueId, setSelectedVariantValueId] = useState<string | null>(
    initialVariantValueId,
  );
  const selectedVariantOption = variantOptions.find(
    (option) => option.id === selectedVariantValueId,
  );
  const requiresVariantSelection = variantType !== "none";
  const needsVariantSelection = requiresVariantSelection && !selectedVariantOption;
  const hasAvailableVariant = variantOptions.some((option) => !option.disabled);
  const effectiveAvailability = selectedVariantOption?.availability ?? availability;
  const displayedAvailability =
    !purchasable || needsVariantSelection ? "unavailable" : effectiveAvailability;
  const variantTypeLabel = getVariantTypeLabel(variantType);
  const selectorTitle = `${variantTypeLabel} را انتخاب کنید`;
  const compareAt = variant.compareAtPriceRial;
  const discountPercent =
    compareAt && compareAt > variant.retailPriceRial
      ? Math.round(((compareAt - variant.retailPriceRial) / compareAt) * 100)
      : 0;

  function selectVariantValue(valueId: string) {
    if (variantOptions.find((option) => option.id === valueId)?.disabled) return;
    setSelectedVariantValueId(valueId);
    setSelectedImage(variantImageMap.get(valueId) ?? firstImage);
  }

  function selectImage(image: string) {
    setSelectedImage(image);
    const optionId = imageVariantValueMap.get(image);
    const option = variantOptions.find((item) => item.id === optionId);
    setSelectedVariantValueId(option && !option.disabled ? option.id : null);
  }

  const variantSelector = requiresVariantSelection ? (
    <section aria-label={`انتخاب ${variantTypeLabel} محصول`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-black text-white">
          {variantType === "flavor" ? (
            <Sparkles size={18} className="text-cyan-300" aria-hidden="true" />
          ) : variantType === "color" ? (
            <Palette size={18} className="text-cyan-300" aria-hidden="true" />
          ) : (
            <Gauge size={18} className="text-cyan-300" aria-hidden="true" />
          )}
          {hasAvailableVariant ? selectorTitle : `${variantTypeLabel} موجود نیست`}
        </h2>
        {selectedVariantOption ? (
          <span className="text-xs font-bold text-retail-accent">
            {selectedVariantOption.labelFa}
          </span>
        ) : null}
      </div>
      <div
        className={
          variantType === "flavor"
            ? "grid gap-2 sm:grid-cols-2"
            : "flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
        }
        role="radiogroup"
        aria-label={`انتخاب ${variantTypeLabel} محصول`}
      >
        {variantOptions.map((option) => {
          const active = selectedVariantValueId === option.id;
          const optionImage = variantImageMap.get(option.id);
          return option.type === "flavor" ? (
            <button
              key={option.id}
              type="button"
              onClick={() => selectVariantValue(option.id)}
              disabled={option.disabled}
              className={`flex min-h-12 select-none items-center justify-between gap-3 rounded-md border px-3 text-sm font-black transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none ${active ? "border-cyan-300 bg-cyan-300 text-slate-950 shadow-[0_10px_24px_rgba(0,217,255,0.20)]" : option.disabled ? "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/40 line-through" : "border-white/10 bg-white/[0.04] text-white hover:border-cyan-300/60 hover:bg-white/[0.07]"}`}
              role="radio"
              aria-checked={active}
              aria-disabled={option.disabled}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <FlavorVisual option={option} />
                <span className="truncate">{option.labelFa}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1">
                {option.disabled ? <span className="no-underline text-[10px]">ناموجود</span> : null}
                {optionImage ? <PackageCheck size={14} aria-hidden="true" /> : null}
                {active ? <SelectedCheck /> : null}
              </span>
            </button>
          ) : (
            <button
              key={option.id}
              type="button"
              onClick={() => selectVariantValue(option.id)}
              disabled={option.disabled}
              className={`inline-flex min-h-11 shrink-0 select-none items-center gap-2 rounded-md border px-3 text-sm font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none ${active ? "border-cyan-300 bg-white text-slate-950" : option.disabled ? "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/40 line-through" : "border-white/10 bg-white/[0.04] text-white hover:border-cyan-300/60"}`}
              role="radio"
              aria-checked={active}
              aria-disabled={option.disabled}
            >
              <VariantOptionVisual option={option} />
              <span>{option.labelFa}</span>
              {option.disabled ? <span className="no-underline text-[10px]">ناموجود</span> : null}
              {active ? <Check size={15} aria-hidden="true" /> : null}
            </button>
          );
        })}
        {variantOptions.length === 0 ? (
          <p className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-retail-secondary">
            در حال حاضر گزینه فعالی برای این محصول وجود ندارد.
          </p>
        ) : null}
      </div>
    </section>
  ) : null;

  return (
    <section className="retail-glass grid gap-6 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(0,217,255,0.10),transparent_34%),#0D1117] p-3 shadow-retail-lg sm:p-5 lg:grid-cols-[minmax(0,1.03fr)_minmax(24rem,0.97fr)] lg:gap-7 lg:p-6">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 lg:order-2">
        <div
          data-testid="product-gallery-surface"
          className={`relative min-w-0 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A0F15] ${
            !purchasable ? "product-detail-unavailable-media" : ""
          }`}
        >
          <button
            type="button"
            data-testid="product-gallery-frame"
            onClick={() => setImageOpen(true)}
            aria-label="بزرگ‌نمایی تصویر"
            aria-haspopup="dialog"
            className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden bg-[#0B1118] shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-300"
          >
            <ProductImageCrossfade
              src={selectedImage}
              preloadSources={imagePreloadSources}
              alt={
                selectedVariantOption
                  ? `${product.nameFa} - ${selectedVariantOption.labelFa}`
                  : product.nameFa
              }
            />
            <span
              className="pointer-events-none absolute bottom-3 end-3 rounded-full border border-white/25 bg-black/60 p-2 text-white"
              aria-hidden="true"
            >
              <ZoomIn size={20} />
            </span>
          </button>
          {selectedVariantOption ? (
            <span className="absolute right-4 top-4 inline-flex select-none items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-black text-slate-800 shadow-sm">
              <VariantOptionVisual option={selectedVariantOption} size="sm" />
              {selectedVariantOption.labelFa}
            </span>
          ) : null}
        </div>

        <div className="flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible lg:grid-cols-5 xl:grid-cols-6">
          {galleryImages.map((image, index) => {
            const active = selectedImage === image;
            const thumbnailOption = variantOptions.find(
              (option) => option.id === imageVariantValueMap.get(image),
            );
            const thumbnailUnavailable = thumbnailOption?.disabled === true;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => selectImage(image)}
                data-availability={thumbnailUnavailable ? "unavailable" : "available"}
                className={`group relative aspect-[3/4] w-[4.25rem] shrink-0 snap-start select-none overflow-hidden rounded-xl border bg-[#091019] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:w-auto motion-reduce:transition-none ${
                  !purchasable ? "product-detail-unavailable-media opacity-75" : ""
                } ${thumbnailUnavailable ? "product-detail-unavailable-thumbnail" : ""} ${
                  active
                    ? "border-cyan-300 ring-2 ring-cyan-300/30"
                    : "border-white/10 hover:border-cyan-300/70"
                }`}
                aria-label={`${product.nameFa} ${thumbnailOption?.labelFa ?? index + 1}${
                  thumbnailUnavailable ? " - ناموجود" : ""
                }`}
                aria-pressed={active}
              >
                <ProtectedProductImage
                  src={image}
                  alt={`${product.nameFa} ${thumbnailOption?.labelFa ?? index + 1}`}
                  fill
                  loading="lazy"
                  unoptimized
                  sizes="112px"
                  className="object-contain"
                />
                {thumbnailOption ? (
                  <span className="absolute bottom-1 right-1 z-[2]">
                    <VariantOptionVisual option={thumbnailOption} size="sm" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="mt-2 lg:hidden">{variantSelector}</div>
        <ImageLightbox
          open={imageOpen}
          onClose={() => setImageOpen(false)}
          src={selectedImage}
          images={lightboxImages}
          alt={
            selectedVariantOption
              ? `${product.nameFa} - ${selectedVariantOption.labelFa}`
              : product.nameFa
          }
        />
      </div>

      <div className="flex min-w-0 flex-col py-1 lg:order-1">
        <div className="flex flex-wrap items-center gap-2">
          <StockStatus
            state={displayedAvailability}
            unavailableLabel={!purchasable || requiresVariantSelection ? "ناموجود" : "پیش‌سفارش"}
          />
          <Badge tone="warning">۱۸+</Badge>
          {brandName ? <Badge tone="info">{brandName}</Badge> : null}
        </div>

        <div className="mt-5">
          <h1 className="text-2xl font-black leading-[1.5] text-white sm:text-4xl sm:leading-[1.35]">
            {product.nameFa}
          </h1>
          {product.nameEn ? (
            <p className="mt-2 text-sm font-semibold text-retail-secondary" dir="ltr">
              {product.nameEn}
            </p>
          ) : null}
          <p className="mt-4 max-w-2xl leading-8 text-[#D9E2EC]">{product.shortDescriptionFa}</p>
        </div>

        <div className="product-purchase-zone mt-6 hidden lg:block">{variantSelector}</div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-white/10 py-4">
          <div>
            <p className="text-xs font-bold text-retail-secondary">قیمت فروش</p>
            {compareAt && compareAt > variant.retailPriceRial ? (
              <div className="mt-1 flex items-center gap-2">
                <Price
                  valueRial={compareAt}
                  className="text-sm font-medium text-retail-muted line-through"
                />
                <span className="rounded-full bg-rose-500 px-2 py-1 text-[11px] font-black text-white">
                  ٪{new Intl.NumberFormat("fa-IR").format(discountPercent)} تخفیف
                </span>
              </div>
            ) : null}
            <div
              className={`mt-1 text-2xl font-black sm:text-3xl ${
                purchasable ? "text-retail-accent" : "text-retail-muted line-through"
              }`}
            >
              <Price valueRial={variant.retailPriceRial} />
            </div>
          </div>
          <div className="grid gap-1 text-left text-xs text-retail-secondary">
            <span dir="ltr">SKU: {variant.sku}</span>
            <span>
              {displayedAvailability === "available"
                ? "آماده سفارش"
                : displayedAvailability === "low_stock"
                  ? "موجودی محدود"
                  : displayedAvailability === "almost_unavailable"
                    ? "رو به اتمام"
                    : !purchasable || requiresVariantSelection
                      ? "ناموجود"
                      : "قابل پیش‌سفارش"}
            </span>
          </div>
        </div>

        <div className="product-purchase-zone mt-6 grid gap-4">
          {!purchasable ? (
            <Button
              type="button"
              disabled
              aria-label="محصول ناموجود است"
              className="w-full min-h-12 text-base"
            >
              ناموجود
            </Button>
          ) : needsVariantSelection ? (
            <Button type="button" disabled className="w-full min-h-12 text-base">
              {hasAvailableVariant
                ? `ابتدا ${variantTypeLabel} را انتخاب کنید`
                : "همه گزینه‌ها ناموجود هستند"}
            </Button>
          ) : (
            <AddToCartButton
              key={`${variant.id}-${selectedVariantValueId ?? "default"}`}
              variantId={variant.id}
              label={
                effectiveAvailability !== "unavailable" ? "افزودن به سبد خرید" : "ثبت پیش‌سفارش"
              }
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
