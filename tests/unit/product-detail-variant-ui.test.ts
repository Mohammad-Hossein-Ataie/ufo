import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductDetailClient } from "@/components/product-detail-client";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";
import type { ProductVariant } from "@ufo/types";

Object.assign(globalThis, { React });

const variant: ProductVariant = {
  id: "variant-ui-test",
  productId: "product-ui-test",
  nameFa: "استاندارد",
  sku: "UI-TEST",
  retailPriceRial: 1_000_000,
  wholesalePriceRial: 900_000,
  cartonSize: 10,
  minWholesaleCartonCount: 1,
  attributes: [],
  isActive: true,
};

const options: StorefrontVariantOption[] = [
  {
    id: "black",
    labelFa: "مشکی",
    type: "color",
    swatch: "#111827",
    availability: "unavailable",
    disabled: true,
  },
  {
    id: "silver",
    labelFa: "نقره‌ای",
    type: "color",
    swatch: "#CBD5E1",
    availability: "available",
    disabled: false,
  },
];

function render(
  variantOptions: StorefrontVariantOption[],
  initialVariantValueId: string | null,
  purchasable = true,
  variantImages: Record<string, string> = {},
  galleryImages = ["/images/ufo-hero.webp"],
) {
  return renderToStaticMarkup(
    React.createElement(ProductDetailClient, {
      product: {
        id: "product-ui-test",
        nameFa: "محصول تست",
        shortDescriptionFa: "توضیح تست",
      },
      variant,
      availability: "available",
      purchasable,
      galleryImages,
      variantType: "color",
      variantImages,
      variantOptions,
      initialVariantValueId,
    }),
  );
}

describe("product detail variant controls", () => {
  it("renders an unavailable option as a semantic disabled radio while selecting an alternative", () => {
    const markup = render(options, "silver");
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain("افزودن به سبد خرید");
    expect(markup).not.toContain("stockQuantity");
  });

  it("marks the gallery thumbnail matched to an unavailable option as grayscale", () => {
    const markup = render(
      options,
      "silver",
      true,
      {
        black: "/images/black.webp",
        silver: "/images/silver.webp",
      },
      ["/images/black.webp", "/images/silver.webp"],
    );

    expect(markup).toMatch(
      /data-availability="unavailable" class="[^"]*product-detail-unavailable-thumbnail/,
    );
    expect(markup).toContain('aria-label="محصول تست مشکی - ناموجود"');
    expect(markup).toContain('data-availability="available"');
    expect(markup).toContain('aria-label="محصول تست نقره‌ای"');
  });

  it("does not fabricate a selection or purchase action when every option is unavailable", () => {
    const markup = render(
      options.map((option) => ({
        ...option,
        availability: "unavailable" as const,
        disabled: true,
      })),
      null,
    );
    expect(markup).toContain("همه گزینه‌ها ناموجود هستند");
    expect(markup).not.toContain("افزودن به سبد خرید");
  });

  it("keeps unavailable product information visible while disabling the parent purchase", () => {
    const markup = render(
      options.map((option) => ({
        ...option,
        availability: "unavailable" as const,
        disabled: true,
      })),
      null,
      false,
    );

    expect(markup).toContain("product-detail-unavailable-media");
    expect(markup).toContain("محصول ناموجود است");
    expect(markup).toContain("line-through");
    expect(markup).not.toContain("افزودن به سبد خرید");
  });
});
