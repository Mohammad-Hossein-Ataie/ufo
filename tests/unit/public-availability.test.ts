import { describe, expect, it } from "vitest";
import {
  getPublicAvailabilityState,
  publicAvailabilityLabelFa,
} from "@/lib/public-availability";

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
    expect(publicAvailabilityLabelFa("unavailable", "نیازمند هماهنگی")).toBe(
      "نیازمند هماهنگی",
    );
  });
});
