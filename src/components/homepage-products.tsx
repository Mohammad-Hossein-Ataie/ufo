import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Price, ProductCard, StockStatus } from "@ufo/ui";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { HomepageProductSlot } from "@/components/homepage-product-slot";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import { getCatalogRowStock } from "@/lib/catalog-data";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import type { HomepageProductSlot as Slot } from "@/lib/homepage-products";

export function HomepageProducts({ slots }: { slots: Slot[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {slots.map((slot, slotIndex) => (
        <HomepageProductSlot
          key={slot.rows.map(({ product }) => product.id).join(":")}
          slotIndex={slotIndex}
          images={slot.rows.map(({ product }) => ({
            src: getProductImage(product),
            fallbackSrc: getCategoryImage(product.categoryId) ?? "/images/categories/lighter.webp",
          }))}
          label={slot.category?.nameFa ?? "تازه‌های فروشگاه"}
          names={slot.rows.map(({ product }) => product.nameFa)}
        >
          {slot.rows.map((row) => (
            <ProductCard
              key={row.product.id}
              compactOnMobile
              title={row.product.nameFa}
              description={row.product.shortDescriptionFa}
              media={
                <Link
                  href={`/products/${row.product.slug}`}
                  className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-retail-accent"
                >
                  <StorefrontProductImage
                    src={getProductImage(row.product)}
                    fallbackSrc={
                      getCategoryImage(row.product.categoryId) ?? "/images/categories/lighter.webp"
                    }
                    alt={row.product.nameFa}
                    sizes="(min-width: 1280px) 296px, (min-width: 1024px) 25vw, 50vw"
                  />
                </Link>
              }
              badge={<StockStatus available={getCatalogRowStock(row)} />}
              price={<Price valueRial={row.variant.retailPriceRial} />}
              actions={
                <div className="grid gap-2">
                  <AddToCartButton variantId={row.variant.id} />
                  <Link
                    href={`/products/${row.product.slug}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-bold text-retail-accent hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-retail-accent"
                  >
                    جزئیات <ArrowLeft size={16} aria-hidden="true" />
                  </Link>
                </div>
              }
            />
          ))}
        </HomepageProductSlot>
      ))}
    </div>
  );
}
