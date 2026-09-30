import { ArrowLeft } from "lucide-react";
import { Price, ProductCard, StockStatus } from "@ufo/ui";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductNavigationLink } from "@/components/product-navigation-link";
import { HomepageProductDeck } from "@/components/homepage-product-deck";
import { HomepageProductSlot } from "@/components/homepage-product-slot";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { getCatalogRowAvailability } from "@/lib/catalog-data";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import type { HomepageProductSlot as Slot } from "@/lib/homepage-products";
import { getProductVariantType, isProductAvailableForPurchase } from "@ufo/domain";

export function HomepageProducts({ slots }: { slots: Slot[] }) {
  return (
    <HomepageProductDeck
      key={slots.map((slot) => slot.rows.map((row) => row.product.id).join(":")).join("|")}
      images={slots.map((slot) =>
        slot.rows.map(({ product }) => ({
          src: getProductImage(product),
          fallbackSrc: getCategoryImage(product.categoryId) ?? "/images/categories/lighter.webp",
        })),
      )}
    >
      {slots.map((slot, slotIndex) => (
        <HomepageProductSlot
          key={slot.rows.map(({ product }) => product.id).join(":")}
          slotIndex={slotIndex}
          label={slot.category?.nameFa ?? "تازه‌های فروشگاه"}
          names={slot.rows.map(({ product }) => product.nameFa)}
        >
          {slot.rows.map((row) => {
            const purchasable = isProductAvailableForPurchase(row.product);
            return (
              <ProductCard
                key={row.product.id}
                className="catalog-linked-card"
                unavailable={!purchasable}
                compactOnMobile
                title={row.product.nameFa}
                subtitle={row.product.nameEn}
                description={row.product.shortDescriptionFa}
                media={
                  <StorefrontProductImage
                    src={getProductImage(row.product)}
                    fallbackSrc={
                      getCategoryImage(row.product.categoryId) ?? "/images/categories/lighter.webp"
                    }
                    alt={row.product.nameFa}
                    sizes="(min-width: 1280px) 296px, (min-width: 1024px) 25vw, 50vw"
                  />
                }
                badge={
                  <StockStatus
                    state={getCatalogRowAvailability(row)}
                    unavailableLabel={purchasable ? "پیش‌سفارش" : "ناموجود"}
                  />
                }
                price={
                  <Price
                    valueRial={row.variant.retailPriceRial}
                    className={!purchasable ? "text-retail-muted line-through" : ""}
                  />
                }
                actions={
                  <div className="grid gap-2">
                    <ProductNavigationLink
                      href={`/products/${row.product.slug}`}
                      action={
                        purchasable && getProductVariantType(row.product) !== "none"
                          ? "select"
                          : "details"
                      }
                      pendingLabel={
                        !purchasable || getProductVariantType(row.product) === "none"
                          ? "در حال باز کردن…"
                          : "در حال آماده‌سازی…"
                      }
                      className="bg-retail-accent text-retail-bg hover:bg-retail-accent-hover"
                    >
                    {!purchasable
                      ? "مشاهده محصول"
                      : getProductVariantType(row.product) === "none"
                        ? "جزئیات"
                        : "انتخاب تنوع و خرید"}
                      <ArrowLeft size={16} aria-hidden="true" />
                    </ProductNavigationLink>
                    {purchasable && getProductVariantType(row.product) === "none" ? (
                      <div className="catalog-card-secondary-action">
                        <AddToCartButton variantId={row.variant.id} />
                      </div>
                    ) : null}
                  </div>
                }
              />
            );
          })}
        </HomepageProductSlot>
      ))}
    </HomepageProductDeck>
  );
}
