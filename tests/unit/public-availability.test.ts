import { describe, expect, it } from "vitest";
import { getPublicAvailabilityState, publicAvailabilityLabelFa } from "@/lib/public-availability";
import { getCatalogRowAvailability } from "@/lib/catalog-data";
import { inventoryItems, products, variants } from "@ufo/domain";
import type { AdminProductRecord } from "@/lib/admin-products";

describe("public inventory presentation", () => {
  it("maps exact quantities into centralized semantic states", () => {
    expect(getPublicAvailabilityState(0)).toBe("unavailable");
    expect(getPublicAvailabilityState(1)).toBe("almost_unavailable");
    expect(getPublicAvailabilityState(2)).toBe("almost_unavailable");
    expect(getPublicAvailabilityState(3)).toBe("low_stock");
    expect(getPublicAvailabilityState(9)).toBe("low_stock");
    expect(getPublicAvailabilityState(10)).toBe("available");
  });

  it("uses an inventory item's existing restock threshold without exposing the quantity", () => {
    expect(getPublicAvailabilityState(4, { lowStockAt: 5 })).toBe("low_stock");
    expect(getPublicAvailabilityState(6, { lowStockAt: 5 })).toBe("available");
    expect(publicAvailabilityLabelFa("unavailable", "نیازمند هماهنگی")).toBe("نیازمند هماهنگی");
  });

  it("lets explicit parent and aggregate option availability override positive stock", () => {
    const product = products[0]!;
    const variant = variants.find((item) => item.productId === product.id)!;
    const inventory = inventoryItems.find((item) => item.variantId === variant.id)!;
    const row = {
      product: { ...product, isAvailable: false },
      variant,
      inventory: { ...inventory, onHand: 100, reserved: 0 },
      brandNameFa: "تست",
      categoryNameFa: "تست",
    } satisfies AdminProductRecord;
    expect(getCatalogRowAvailability(row)).toBe("unavailable");

    expect(
      getCatalogRowAvailability({
        ...row,
        product: {
          ...product,
          isAvailable: true,
          variantValueStates: Object.fromEntries(
            (product.variantValueIds ?? []).map((valueId) => [
              valueId,
              { isActive: true, isAvailable: false },
            ]),
          ),
        },
      }),
    ).toBe("unavailable");
  });
});
