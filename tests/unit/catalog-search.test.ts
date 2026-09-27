import { describe, expect, it } from "vitest";
import { getMemoryAdminProducts } from "@/lib/admin-products";
import { searchCatalogRows } from "@/lib/catalog-data";

describe("catalog search", () => {
  const rows = getMemoryAdminProducts();

  it.each(["آرگاس پی 1", "آرگاس پی ۱", "آرگاس پی1", "argus p1"])(
    "finds Argus P1 for %s",
    (query) => {
      expect(searchCatalogRows(rows, query).some((row) => row.product.slug === "argus-p1")).toBe(true);
    },
  );

  it("requires every meaningful query token", () => {
    expect(searchCatalogRows(rows, "آرگاس پی 99999").some((row) => row.product.slug === "argus-p1")).toBe(false);
  });
});
