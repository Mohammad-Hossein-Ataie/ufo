import { describe, expect, it } from "vitest";
import {
  getProductColorOptions,
  getProductFlavorOptions,
  getProductVariantOptions,
  getProductVariantType,
} from "@ufo/domain";
import { collectionNames, databaseIndexes } from "@ufo/database";
import type { Product } from "@ufo/types";
import { mergeCatalogRecords } from "../../src/lib/admin-products";

describe("admin product catalog merging", () => {
  it("keeps bundled products when a single product has a database override", () => {
    const bundled = [
      { id: "prod-a", name: "A" },
      { id: "prod-b", name: "B" },
      { id: "prod-c", name: "C" },
    ];
    const overrides = [{ id: "prod-b", name: "Updated B" }];

    expect(mergeCatalogRecords(bundled, overrides)).toEqual([
      { id: "prod-b", name: "Updated B" },
      { id: "prod-a", name: "A" },
      { id: "prod-c", name: "C" },
    ]);
  });

  it("adds admin-created records that do not exist in the bundled catalog", () => {
    const bundled = [{ id: "prod-a", name: "A" }];
    const overrides = [{ id: "prod-new", name: "New" }];

    expect(mergeCatalogRecords(bundled, overrides)).toEqual([
      { id: "prod-new", name: "New" },
      { id: "prod-a", name: "A" },
    ]);
  });
});

describe("product option architecture", () => {
  const baseProduct: Product = {
    id: "prod-test",
    slug: "test-product",
    nameFa: "محصول تست",
    brandId: "brand-ufo",
    categoryId: "cat-disposable",
    productKind: "disposable",
    shortDescriptionFa: "تست",
    descriptionFa: "تست",
    image: "/images/ufo-hero.png",
    images: ["/images/ufo-hero.png"],
    tags: [],
    attributes: [],
    isActive: true,
    isAgeRestricted: true,
    seoTitle: "تست",
    seoDescription: "تست",
    createdAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
  };

  it("uses flavors as first-class product option values", () => {
    const product: Product = {
      ...baseProduct,
      variantType: "flavor",
      variantValueIds: ["watermelon-ice", "blueberry-ice"],
    };

    expect(getProductVariantType(product)).toBe("flavor");
    expect(getProductFlavorOptions(product).map((flavor) => flavor.id)).toEqual([
      "watermelon-ice",
      "blueberry-ice",
    ]);
    expect(getProductColorOptions(product)).toEqual([]);
    expect(getProductVariantOptions(product).map((option) => option.type)).toEqual([
      "flavor",
      "flavor",
    ]);
  });

  it("keeps genuine color products on color option values", () => {
    const product: Product = {
      ...baseProduct,
      categoryId: "cat-vape",
      productKind: "vape-device",
      variantType: "color",
      variantValueIds: ["black", "silver"],
    };

    expect(getProductVariantType(product)).toBe("color");
    expect(getProductColorOptions(product).map((color) => color.id)).toEqual(["black", "silver"]);
    expect(getProductFlavorOptions(product)).toEqual([]);
  });
});

describe("flavor persistence model", () => {
  it("declares productFlavors as a database collection with a slug index", () => {
    expect(collectionNames).toContain("productFlavors");
    expect(databaseIndexes.productFlavors).toEqual([{ key: { slug: 1 }, unique: true }]);
  });
});
