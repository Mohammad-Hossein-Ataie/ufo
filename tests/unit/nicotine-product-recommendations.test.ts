import { describe, expect, it } from "vitest";
import type { AdminProductRecord } from "@/lib/admin-products";
import {
  buildNicotineRecommendationSets,
  extractNicotineStrengthsMg,
  getNicotineLiquidKind,
  summarizeNicotineCatalog,
} from "@/lib/nicotine-product-recommendations";

function row({
  id,
  kind = "salt-nicotine",
  categoryId = "cat-salt-nicotine",
  strength,
  stock = 12,
  active = true,
}: {
  id: string;
  kind?: "salt-nicotine" | "e-liquid" | undefined;
  categoryId?: string;
  strength?: string;
  stock?: number;
  active?: boolean;
}): AdminProductRecord {
  const nicotine = strength
    ? [{ nameFa: "نیکوتین", valueFa: strength, technicalValue: strength }]
    : [];
  return {
    product: {
      id,
      slug: id,
      nameFa: id,
      nameEn: kind === "salt-nicotine" ? "Salt" : "E-liquid",
      brandId: "brand-test",
      categoryId,
      productKind: kind,
      salesChannels: ["retail"],
      shortDescriptionFa: "تست",
      descriptionFa: "تست",
      image: "/images/ufo-hero.webp",
      images: ["/images/ufo-hero.webp"],
      tags: kind === "salt-nicotine" ? ["سالت"] : ["جویس"],
      attributes: nicotine,
      isActive: active,
      isAgeRestricted: true,
      seoTitle: id,
      seoDescription: id,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    variant: {
      id: `variant-${id}`,
      productId: id,
      nameFa: "پیش‌فرض",
      sku: id,
      retailPriceRial: 1_000_000,
      wholesalePriceRial: 900_000,
      cartonSize: 1,
      minWholesaleCartonCount: 1,
      attributes: [],
      isActive: active,
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
    brandNameFa: "برند تست",
    categoryNameFa: kind === "salt-nicotine" ? "سالت" : "جویس",
  };
}

describe("nicotine product recommendations", () => {
  it("extracts Persian digits, mg/ml and nicotine percentages", () => {
    const mg = row({ id: "mg", strength: "۱۲ میلی‌گرم" });
    const percent = row({ id: "percent", strength: "۲٪" });

    expect(extractNicotineStrengthsMg(mg)).toEqual([12]);
    expect(extractNicotineStrengthsMg(percent)).toEqual([20]);
  });

  it("recognizes a salt product misplaced in the e-liquid category", () => {
    const misplaced = row({ id: "misplaced", kind: undefined, categoryId: "cat-eliquid" });
    misplaced.product.nameFa = "سالت نیکوتین نعناع";

    expect(getNicotineLiquidKind(misplaced)).toBe("salt");
  });

  it("prioritizes exact strengths, keeps unknown strengths as fallback and excludes wrong strengths", () => {
    const rows = [
      row({ id: "unknown" }),
      row({ id: "exact", strength: "۱۵ mg/ml" }),
      row({ id: "too-strong", strength: "۲۵ mg/ml" }),
      row({ id: "out-of-stock", strength: "۱۵ mg/ml", stock: 0 }),
    ];

    const recommendations = buildNicotineRecommendationSets(rows)["pod-mtl:regular"];
    expect(recommendations.map((item) => item.row.product.id)).toEqual(["exact", "unknown"]);
    expect(recommendations.map((item) => item.matchQuality)).toEqual(["strength", "type-only"]);
  });

  it("does not present salt as freebase when no freebase product exists", () => {
    const rows = [row({ id: "salt", strength: "۶ mg/ml" })];

    expect(buildNicotineRecommendationSets(rows)["mod-dtl:regular"]).toEqual([]);
    expect(summarizeNicotineCatalog(rows)).toEqual({
      salt: { available: 1, withStrength: 1 },
      freebase: { available: 0, withStrength: 0 },
    });
  });
});
