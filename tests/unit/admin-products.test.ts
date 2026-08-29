import { describe, expect, it } from "vitest";
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
