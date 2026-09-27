import { describe, expect, it } from "vitest";
import { brands } from "@ufo/domain";
import { getHomepagePartnerBrands } from "@/lib/homepage-brand-logos";

describe("homepage partner brand logos", () => {
  it("keeps bundled logos until an uploaded image replaces them", () => {
    const original = getHomepagePartnerBrands(brands);
    const uwell = original.find(({ brand }) => brand.id === "brand-uwell");
    expect(uwell?.logo).toBe("/logos/brands/uwell.webp");

    const updated = getHomepagePartnerBrands(
      brands.map((brand) =>
        brand.id === "brand-uwell"
          ? { ...brand, logoUrl: "/api/brand-images/11111111-1111-4111-8111-111111111111" }
          : brand,
      ),
    );
    expect(updated.find(({ brand }) => brand.id === "brand-uwell")?.logo).toBe(
      "/api/brand-images/11111111-1111-4111-8111-111111111111",
    );
    expect(updated).toHaveLength(original.length);
  });

  it("shows a newly added brand after an image is uploaded", () => {
    const extra = { id: "brand-extra", nameFa: "برند تازه", slug: "extra" };
    expect(
      getHomepagePartnerBrands([...brands, extra]).some(({ brand }) => brand.id === extra.id),
    ).toBe(false);
    expect(
      getHomepagePartnerBrands([...brands, { ...extra, logoUrl: "/api/brand-images/new" }]),
    ).toContainEqual({
      brand: { ...extra, logoUrl: "/api/brand-images/new" },
      logo: "/api/brand-images/new",
    });
  });
});
