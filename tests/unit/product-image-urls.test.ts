import { expect, it } from "vitest";
import { getProductImages, getProductVariantImages } from "@/lib/product-images";

const source = "https://images.example.test/photo.webp";
const product = {
  id: "demo-gallery",
  categoryId: "demo",
  image: source,
  images: [source, "https://images.example.test/second.webp"],
  variantImages: { blue: source, red: "https://images.example.test/second.webp" },
};

it("uses exactly the same protected URL for a thumbnail and its matching image choice", () => {
  const gallery = getProductImages(product);
  const choices = getProductVariantImages(product);
  expect(choices.blue).toBe(gallery[0]);
  expect(choices.red).toBe(gallery[1]);
  expect(choices.blue).toMatch(/^\/api\/product-images\/.+\/detail\?v=/);
  expect(JSON.stringify(choices)).not.toContain("images.example.test");
});

it("keeps the original slot index for images absent from the gallery", () => {
  const choices = getProductVariantImages({
    ...product,
    variantImages: { empty: "", extra: "https://images.example.test/extra.webp" },
  });
  expect(choices.extra).toContain("/variant-1/detail");
  expect(choices).not.toHaveProperty("empty");
});

it("retains direct protected asset URLs and supports legacy color-image records", () => {
  const asset = "/api/product-images/asset/123e4567-e89b-42d3-a456-426614174000/card";
  const { variantImages: _unused, ...base } = product;
  const choices = getProductVariantImages({ ...base, colorImages: { blue: asset } });
  expect(choices.blue).toMatch(/\/asset\/123e4567-e89b-42d3-a456-426614174000\/detail\?v=/);
});
