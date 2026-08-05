import { describe, expect, it } from "vitest";
import {
  calculateCartonQuantity,
  calculateOrderTotals,
  createOrderItemSnapshot,
  products,
  rialToToman,
  validateWholesaleCartonCount,
  variants
} from "@ufo/domain";

const product = products[0];
const variant = variants[0];

if (!product || !variant) {
  throw new Error("fixtures are missing");
}

describe("pricing", () => {
  it("stores rial and displays toman without floating point money", () => {
    expect(rialToToman(12_500_000)).toBe(1_250_000);
    expect(() => rialToToman(12.5)).toThrow("ریالی");
  });

  it("validates wholesale carton minimums", () => {
    expect(() => validateWholesaleCartonCount(variant, variant.minWholesaleCartonCount - 1)).toThrow("حداقل");
    expect(validateWholesaleCartonCount(variant, variant.minWholesaleCartonCount).quantity).toBe(
      variant.cartonSize * variant.minWholesaleCartonCount,
    );
  });

  it("calculates carton quantity and order totals", () => {
    const quantity = calculateCartonQuantity(variant, 2);
    const item = createOrderItemSnapshot({
      product,
      variant,
      channel: "wholesale",
      cartonCount: 2
    });
    const totals = calculateOrderTotals([item], 100_000);
    expect(quantity).toBe(variant.cartonSize * 2);
    expect(totals.totalRial).toBe(item.totalRial + 100_000);
  });
});
