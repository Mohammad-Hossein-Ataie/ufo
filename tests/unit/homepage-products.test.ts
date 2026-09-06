import { describe, expect, it } from "vitest";
import { products, variants, inventoryItems } from "@ufo/domain";
import type { AdminProductRecord } from "@/lib/admin-products";
import { getLatestHomepageProducts } from "@/lib/homepage-products";

function row(
  id: string,
  categoryId: string,
  updatedAt: string,
  overrides = {},
): AdminProductRecord {
  return {
    product: {
      ...products[0]!,
      id,
      categoryId,
      updatedAt,
      isActive: true,
      salesChannels: ["retail"],
      ...overrides,
    },
    variant: variants[0]!,
    inventory: inventoryItems[0]!,
    brandNameFa: "",
    categoryNameFa: "",
  };
}
const date = (day: number) => `2026-08-${String(day).padStart(2, "0")}T00:00:00Z`;
const primaryIds = (rows: AdminProductRecord[]) =>
  getLatestHomepageProducts(rows).map((slot) => slot.rows[0]!.product.id);

describe("homepage category discovery", () => {
  it("uses update freshness in category priority order, independently of input/creation order", () => {
    const rows = [
      row("old", "cat-pod", date(1), { createdAt: date(30) }),
      row("juice", "cat-eliquid", date(3)),
      row("pod", "cat-pod", date(20)),
      row("vape", "cat-vape", date(10)),
      row("disposable", "cat-disposable", date(5)),
    ];
    expect(primaryIds(rows)).toEqual(["pod", "vape", "disposable", "juice"]);
    expect(rows[0]!.product.id).toBe("old");
  });
  it("reserves category primaries before filling missing slots and excludes unpublished/wholesale products", () => {
    const rows = [
      row("vape", "cat-vape", date(30)),
      row("spare", "cat-vape", date(20)),
      row("disposable", "cat-disposable", date(10)),
      row("juice", "cat-eliquid", date(5)),
      row("inactive", "cat-pod", date(31), { isActive: false }),
      row("wholesale", "cat-pod", date(31), { salesChannels: ["wholesale"] }),
    ];
    expect(primaryIds(rows)).toEqual(["spare", "vape", "disposable", "juice"]);
    expect(getLatestHomepageProducts(rows)[0]!.category?.slug).toBe("vape");
  });
  it("fills four slots from one category before allocating extras, with no duplicates across any slides", () => {
    const rows = Array.from({ length: 10 }, (_, i) => row(`p${i}`, "cat-pod", date(i + 1)));
    const slots = getLatestHomepageProducts([...rows, rows[0]!]);
    expect(slots).toHaveLength(4);
    expect(slots.map((slot) => slot.rows.length)).toEqual([3, 1, 1, 1]);
    const ids = slots.flatMap((slot) => slot.rows.map(({ product }) => product.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(primaryIds(rows)).toEqual(["p9", "p8", "p7", "p6"]);
  });
  it("provides the three latest products per category when available", () => {
    const rows = ["cat-pod", "cat-vape", "cat-disposable", "cat-eliquid"].flatMap((category) =>
      Array.from({ length: 4 }, (_, i) => row(`${category}-${i}`, category, date(i + 1))),
    );
    expect(
      getLatestHomepageProducts(rows).map((slot) => slot.rows.map(({ product }) => product.id)),
    ).toEqual(
      ["cat-pod", "cat-vape", "cat-disposable", "cat-eliquid"].map((category) =>
        [3, 2, 1].map((i) => `${category}-${i}`),
      ),
    );
  });
  it("handles empty/small catalogs, missing dates, legacy channels, and deterministic date ties", () => {
    expect(getLatestHomepageProducts([])).toEqual([]);
    const rows = [
      row("b", "unknown", "invalid", { createdAt: date(1), salesChannels: undefined }),
      row("a", "unknown", "", { createdAt: date(1) }),
    ];
    expect(primaryIds(rows)).toEqual(["a", "b"]);
  });
});
