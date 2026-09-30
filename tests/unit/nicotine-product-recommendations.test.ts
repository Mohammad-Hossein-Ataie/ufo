import { describe, expect, it } from "vitest";
import type { AdminProductRecord } from "@/lib/admin-products";
import type { ProductKind } from "@ufo/types";
import {
  buildNicotineRecommendationSets,
  getNicotineLiquidKind,
  getProductNicotineStrengths,
  selectRecommendedProducts,
  summarizeNicotineCatalog,
} from "@/lib/nicotine-product-recommendations";

function row({
  id,
  productId = id,
  kind = "salt-nicotine",
  strengths,
  stock = 12,
  active = true,
  available = true,
  variantActive = true,
  retail = true,
  deleted = false,
  brandId = "brand-test",
  flavor = id,
}: {
  id: string;
  productId?: string;
  kind?: ProductKind | undefined;
  strengths?: number[];
  stock?: number;
  active?: boolean;
  available?: boolean;
  variantActive?: boolean;
  retail?: boolean;
  deleted?: boolean;
  brandId?: string;
  flavor?: string;
}): AdminProductRecord {
  const categoryId =
    kind === "salt-nicotine"
      ? "cat-salt-nicotine"
      : kind === "e-liquid"
        ? "cat-eliquid"
        : "cat-lighter";
  return {
    product: {
      ...(deleted ? { deletedAt: "2026-01-02T00:00:00.000Z" } : {}),
      id: productId,
      slug: productId,
      nameFa: `محصول ${productId}`,
      nameEn: `Product ${productId} 50mg`,
      brandId,
      categoryId,
      productKind: kind,
      ...(strengths ? { nicotineStrengthsMg: strengths } : {}),
      salesChannels: retail ? ["retail"] : ["wholesale"],
      shortDescriptionFa: "تست",
      descriptionFa: "نیکوتین ۵۰ میلی‌گرم در عنوان توصیفی غیرساخت‌یافته",
      image: "/images/ufo-hero.webp",
      images: ["/images/ufo-hero.webp"],
      variantType: kind === "salt-nicotine" || kind === "e-liquid" ? "flavor" : "none",
      variantValueIds: kind === "salt-nicotine" || kind === "e-liquid" ? [flavor] : undefined,
      tags: ["50mg"],
      attributes: [{ nameFa: "نیکوتین", valueFa: "۵۰ میلی‌گرم" }],
      specs: [{ labelFa: "غلظت", valueFa: "50mg" }],
      isActive: active,
      isAvailable: available,
      isAgeRestricted: true,
      seoTitle: productId,
      seoDescription: productId,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    variant: {
      id: `variant-${id}`,
      productId,
      nameFa: "پیش‌فرض",
      sku: id,
      retailPriceRial: 1_000_000,
      wholesalePriceRial: 900_000,
      cartonSize: 1,
      minWholesaleCartonCount: 1,
      attributes: [],
      isActive: variantActive,
    },
    inventory: {
      id: `inventory-${id}`,
      variantId: `variant-${id}`,
      onHand: stock,
      reserved: 0,
      preorderEnabled: false,
      restockThreshold: 2,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    brandNameFa: brandId,
    categoryNameFa: categoryId,
  };
}

function ids(items: ReturnType<typeof selectRecommendedProducts>) {
  return items.map((item) => item.row.product.id);
}

describe("nicotine product recommendations", () => {
  it("uses only structured nicotine metadata and never guesses from content", () => {
    const unknown = row({ id: "unknown" });
    const known = row({ id: "known", strengths: [50, 20, 50] });

    expect(getProductNicotineStrengths(unknown.product)).toEqual([]);
    expect(getProductNicotineStrengths(known.product)).toEqual([20, 50]);
    expect(
      ids(selectRecommendedProducts({ rows: [unknown], nicotineResult: 50, deviceType: "pod" })),
    ).toEqual([]);
  });

  it("classifies by productKind/category only and does not infer family from titles", () => {
    const accessory = row({ id: "salt-title-accessory", kind: "accessory", strengths: [20] });
    accessory.product.nameFa = "سالت نیکوتین تست";
    expect(getNicotineLiquidKind(accessory)).toBeUndefined();

    const legacy = row({ id: "legacy", strengths: [20] });
    delete legacy.product.productKind;
    legacy.product.categoryId = "cat-eliquid";
    expect(getNicotineLiquidKind(legacy)).toBe("freebase");
  });

  it("returns only exact eligible salt products for Pod + 20mg and Pod + 50mg", () => {
    const rows = [
      row({ id: "salt-20", strengths: [20] }),
      row({ id: "salt-50", strengths: [50] }),
      row({ id: "juice-20", kind: "e-liquid", strengths: [20] }),
      row({ id: "device-20", kind: "pod-device", strengths: [20] }),
      row({ id: "disposable-20", kind: "disposable", strengths: [20] }),
      row({ id: "coil-20", kind: "coil", strengths: [20] }),
      row({ id: "cartridge-20", kind: "cartridge", strengths: [20] }),
      row({ id: "accessory-20", kind: "accessory", strengths: [20] }),
    ];

    expect(ids(selectRecommendedProducts({ rows, nicotineResult: 20, deviceType: "pod" }))).toEqual(
      ["salt-20"],
    );
    expect(ids(selectRecommendedProducts({ rows, nicotineResult: 50, deviceType: "pod" }))).toEqual(
      ["salt-50"],
    );
  });

  it("returns only exact e-liquid products for Vape without salt-to-juice conversion", () => {
    const rows = [
      row({ id: "juice-35", kind: "e-liquid", strengths: [35] }),
      row({ id: "juice-6", kind: "e-liquid", strengths: [6] }),
      row({ id: "salt-35", strengths: [35] }),
    ];

    expect(
      ids(selectRecommendedProducts({ rows, nicotineResult: 35, deviceType: "vape" })),
    ).toEqual(["juice-35"]);
    expect(
      ids(selectRecommendedProducts({ rows, nicotineResult: 50, deviceType: "vape" })),
    ).toEqual([]);
  });

  it("excludes unavailable, inactive, deleted, wholesale-only and out-of-stock products", () => {
    const rows = [
      row({ id: "valid", strengths: [25] }),
      row({ id: "unavailable", strengths: [25], available: false }),
      row({ id: "inactive", strengths: [25], active: false }),
      row({ id: "variant-inactive", strengths: [25], variantActive: false }),
      row({ id: "deleted", strengths: [25], deleted: true }),
      row({ id: "wholesale", strengths: [25], retail: false }),
      row({ id: "empty", strengths: [25], stock: 0 }),
    ];

    expect(ids(selectRecommendedProducts({ rows, nicotineResult: 25, deviceType: "pod" }))).toEqual(
      ["valid"],
    );
  });

  it("keeps strength pools distinct and builds all Pod/Vape result sets", () => {
    const rows = [
      row({ id: "salt-20", strengths: [20] }),
      row({ id: "salt-25", strengths: [25] }),
      row({ id: "salt-35", strengths: [35] }),
      row({ id: "salt-50", strengths: [50] }),
      row({ id: "juice-20", kind: "e-liquid", strengths: [20] }),
    ];
    const sets = buildNicotineRecommendationSets(rows);

    expect(Object.keys(sets)).toEqual([
      "pod:20",
      "pod:25",
      "pod:35",
      "pod:50",
      "vape:20",
      "vape:25",
      "vape:35",
      "vape:50",
    ]);
    expect(ids(sets["pod:20"])).toEqual(["salt-20"]);
    expect(ids(sets["pod:50"])).toEqual(["salt-50"]);
    expect(ids(sets["vape:20"])).toEqual(["juice-20"]);
  });

  it("is deterministic, favors brand diversity and removes duplicate product cards", () => {
    const rows = [
      row({ id: "a-variant-1", productId: "a", strengths: [20], stock: 20, brandId: "brand-a" }),
      row({ id: "a-variant-2", productId: "a", strengths: [20], stock: 18, brandId: "brand-a" }),
      row({ id: "b", strengths: [20], stock: 19, brandId: "brand-a" }),
      row({ id: "c", strengths: [20], stock: 10, brandId: "brand-b" }),
      row({ id: "d", strengths: [20], stock: 9, brandId: "brand-c" }),
    ];
    const first = ids(
      selectRecommendedProducts({ rows, nicotineResult: 20, deviceType: "pod", limit: 4 }),
    );
    const second = ids(
      selectRecommendedProducts({ rows, nicotineResult: 20, deviceType: "pod", limit: 4 }),
    );

    expect(first).toEqual(second);
    expect(first).toEqual(["a", "c", "d", "b"]);
    expect(new Set(first).size).toBe(first.length);
  });

  it("reports known and unknown structured strength counts per liquid family", () => {
    const rows = [
      row({ id: "salt-known", strengths: [20] }),
      row({ id: "salt-unknown" }),
      row({ id: "juice-known", kind: "e-liquid", strengths: [6] }),
      row({ id: "juice-unknown", kind: "e-liquid" }),
      row({ id: "juice-unavailable", kind: "e-liquid", strengths: [20], available: false }),
    ];

    expect(summarizeNicotineCatalog(rows)).toEqual({
      salt: { available: 2, withStrength: 1, unknownStrength: 1 },
      freebase: { available: 2, withStrength: 1, unknownStrength: 1 },
    });
  });
});
