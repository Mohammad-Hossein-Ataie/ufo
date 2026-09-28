import { ArrowLeft } from "lucide-react";
import { Price, ProductCard, StockStatus } from "@ufo/ui";
import type { AdminProductRecord } from "@/lib/admin-products";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";
import { getCatalogRowStock } from "@/lib/catalog-data";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { ProductVariantDots, ProductVariantSummary } from "@/components/product-variant-visuals";
import { ProductNavigationLink } from "@/components/product-navigation-link";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function RetailCatalogProductCard({
  row,
  variantOptions,
  eagerImage = false,
}: {
  row: AdminProductRecord;
  variantOptions: StorefrontVariantOption[];
  eagerImage?: boolean;
}) {
  const { product, variant } = row;
  const available = getCatalogRowStock(row);
  const compareAt = variant.compareAtPriceRial;
  const discountPercent =
    compareAt && compareAt > variant.retailPriceRial
      ? Math.round(((compareAt - variant.retailPriceRial) / compareAt) * 100)
      : 0;
  const hasDots = variantOptions.some(
    (option) => option.type === "color" || option.type === "flavor",
  );

  return (
    <ProductCard
      className="catalog-linked-card"
      title={product.nameFa}
      subtitle={product.nameEn}
      description={product.shortDescriptionFa}
      compactOnMobile
      media={
        <StorefrontProductImage
          src={getProductImage(product)}
          fallbackSrc={getCategoryImage(product.categoryId) ?? "/images/categories/lighter.webp"}
          alt={product.nameFa}
          loading={eagerImage ? "eager" : "lazy"}
        />
      }
      mediaFooter={hasDots ? <ProductVariantDots options={variantOptions} /> : undefined}
      badge={
        <div className="flex shrink-0 flex-col items-end gap-1">
          {discountPercent > 0 ? (
            <span className="rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">
              ٪{new Intl.NumberFormat("fa-IR").format(discountPercent)}
            </span>
          ) : null}
          <StockStatus available={available} />
        </div>
      }
      price={
        <div className="grid gap-0.5">
          {compareAt && compareAt > variant.retailPriceRial ? (
            <Price
              valueRial={compareAt}
              className="text-xs font-medium text-retail-muted line-through"
            />
          ) : null}
          <Price valueRial={variant.retailPriceRial} />
        </div>
      }
      variantSummary={
        !hasDots && variantOptions.length > 0 ? (
          <div className="hidden sm:block">
            <ProductVariantSummary options={variantOptions} />
          </div>
        ) : undefined
      }
      actions={
        <div className="grid w-full gap-3">
          <ProductNavigationLink
            href={`/products/${product.slug}`}
            documentNavigation
            action={variantOptions.length > 0 ? "select" : "details"}
            pendingLabel={variantOptions.length > 0 ? "در حال آماده‌سازی…" : "در حال باز کردن…"}
            className={`w-full px-2 ${
              variantOptions.length > 0
                ? "border border-cyan-300 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                : "border border-transparent text-current hover:bg-white/10"
            }`}
          >
            {variantOptions.length > 0 ? "انتخاب و خرید" : "جزئیات"}
            <ArrowLeft size={16} aria-hidden="true" />
          </ProductNavigationLink>
          {variantOptions.length === 0 ? (
            <div className="catalog-card-secondary-action">
              <AddToCartButton
                variantId={variant.id}
                label="افزودن به سبد خرید"
                enableQuantity
                maxQuantity={available > 0 ? available : undefined}
              />
            </div>
          ) : null}
        </div>
      }
    />
  );
}
