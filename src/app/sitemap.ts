import type { MetadataRoute } from "next";
import { products } from "@ufo/domain";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-02T00:00:00.000Z");
  return [
    { url: "https://ufopuff.ir", lastModified: now },
    { url: "https://ufopuff.ir/products", lastModified: now },
    { url: "https://ufopuff.ir/store/tehran-molavi", lastModified: now },
    { url: "https://ufopuff.ir/b2b", lastModified: now },
    { url: "https://ufopuff.ir/b2b/catalog", lastModified: now },
    ...products.map((product) => ({
      url: `https://ufopuff.ir/products/${product.slug}`,
      lastModified: new Date(product.updatedAt)
    }))
  ];
}
