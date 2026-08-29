import { describe, expect, it } from "vitest";
import { absoluteUrl, canonical, productJsonLd, siteOrigin } from "@ufo/seo";
import { products, variants } from "@ufo/domain";

describe("seo helpers", () => {
  it("builds stable absolute canonical URLs without query strings", () => {
    expect(siteOrigin("")).toBe("https://ufopuff.com");
    expect(siteOrigin("https://example.com/shop?x=1")).toBe("https://example.com");
    expect(canonical("/products?sort=cheap", "https://example.com")).toBe(
      "https://example.com/products",
    );
    expect(absoluteUrl("/logos/logo.png", "https://example.com")).toBe(
      "https://example.com/logos/logo.png",
    );
  });

  it("serializes product JSON-LD from actual product and variant data", () => {
    const product = products.find((item) => item.slug === "vozol-12k") ?? products[0];
    const variant = variants.find((item) => item.productId === product?.id);
    if (!product || !variant) throw new Error("product fixtures are missing");

    const data = productJsonLd(product, variant, true, "Vozol");
    expect(data["@type"]).toBe("Product");
    expect(data.sku).toBe(variant.sku);
    expect(data.offers.price).toBe(variant.retailPriceRial);
    expect(data.offers.url).toContain(`/products/${product.slug}`);
  });
});
