import { describe, expect, it } from "vitest";
import type { Product } from "@ufo/types";
import {
  getStorefrontVariantOptions,
  resolveStorefrontVariantValueId,
} from "@/lib/storefront-variants";

const baseProduct: Product = {
  id: "variant-state-product",
  slug: "variant-state-product",
  nameFa: "محصول تست",
  brandId: "brand-ufo",
  categoryId: "cat-vape",
  productKind: "vape-device",
  shortDescriptionFa: "تست",
  descriptionFa: "تست",
  image: "/images/ufo-hero.webp",
  images: ["/images/ufo-hero.webp"],
  variantType: "color",
  variantValueIds: ["black", "silver", "green"],
  variantImages: {
    black: "/images/black.webp",
    silver: "/images/silver.webp",
    green: "/images/green.webp",
  },
  tags: [],
  attributes: [],
  isActive: true,
  isAgeRestricted: true,
  seoTitle: "محصول تست",
  seoDescription: "محصول تست",
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
};

describe("storefront variant availability", () => {
  it("keeps legacy option records active and available", () => {
    const options = getStorefrontVariantOptions(baseProduct);
    expect(options.map((option) => option.id)).toEqual(["black", "silver", "green"]);
    expect(options.every((option) => !option.disabled)).toBe(true);
  });

  it("hides inactive values and disables unavailable values without exposing exact stock", () => {
    const options = getStorefrontVariantOptions({
      ...baseProduct,
      variantValueStates: {
        black: { isActive: false, isAvailable: true, stockQuantity: 12 },
        silver: { isActive: true, isAvailable: false, stockQuantity: 8 },
        green: { isActive: true, isAvailable: true, stockQuantity: 2 },
      },
    });

    expect(options.map((option) => option.id)).toEqual(["silver", "green"]);
    expect(options.find((option) => option.id === "silver")).toMatchObject({
      disabled: true,
      availability: "unavailable",
    });
    expect(options.find((option) => option.id === "green")).toMatchObject({
      disabled: false,
      availability: "almost_unavailable",
    });
    expect(options[1]).not.toHaveProperty("stockQuantity");
    expect(baseProduct.variantImages).toHaveProperty("black", "/images/black.webp");
  });

  it("resolves requested, configured, first-available, and all-unavailable defaults", () => {
    const options = getStorefrontVariantOptions({
      ...baseProduct,
      variantValueStates: {
        black: { isActive: true, isAvailable: false },
        silver: { isActive: true, isAvailable: true },
        green: { isActive: true, isAvailable: true },
      },
    });

    expect(resolveStorefrontVariantValueId(options, "green", "silver")).toBe("green");
    expect(resolveStorefrontVariantValueId(options, "black", "silver")).toBe("silver");
    expect(resolveStorefrontVariantValueId(options, undefined, "black")).toBe("silver");
    expect(
      resolveStorefrontVariantValueId(
        options.map((option) => ({ ...option, disabled: true, availability: "unavailable" })),
        "silver",
        "green",
      ),
    ).toBeNull();
  });

  it("makes the same option selectable again after re-enabling it", () => {
    const unavailable = {
      ...baseProduct,
      variantValueStates: {
        black: { isActive: true, isAvailable: false },
      },
    } satisfies Product;
    expect(getStorefrontVariantOptions(unavailable)[0]?.disabled).toBe(true);

    const reenabled: Product = {
      ...unavailable,
      variantValueStates: {
        ...unavailable.variantValueStates,
        black: { isActive: true, isAvailable: true, stockQuantity: 4 },
      },
    };
    expect(getStorefrontVariantOptions(reenabled)[0]).toMatchObject({
      id: "black",
      disabled: false,
    });
  });
});
