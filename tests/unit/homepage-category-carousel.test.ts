import { describe, expect, it } from "vitest";
import {
  getCircularOffset,
  normalizeCarouselIndex,
} from "@/components/homepage-category-carousel";

describe("homepage category carousel navigation", () => {
  it("wraps previous and next navigation in RTL-safe index space", () => {
    expect(normalizeCarouselIndex(-1, 8)).toBe(7);
    expect(normalizeCarouselIndex(8, 8)).toBe(0);
    expect(normalizeCarouselIndex(10, 8)).toBe(2);
  });

  it("places neighboring cards on the shortest side of the active card", () => {
    expect(getCircularOffset(4, 3, 8)).toBe(1);
    expect(getCircularOffset(2, 3, 8)).toBe(-1);
    expect(getCircularOffset(0, 7, 8)).toBe(1);
    expect(getCircularOffset(7, 0, 8)).toBe(-1);
  });
});
