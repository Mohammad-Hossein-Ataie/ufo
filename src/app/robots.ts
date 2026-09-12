import type { MetadataRoute } from "next";
import { canonical } from "@ufo/seo";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: canonical("/sitemap.xml"),
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/products/category",
          "/store",
          "/blog",
          "/b2b",
          "/b2b/catalog",
          "/logos",
          "/images",
          "/favicons",
          "/api/product-images/",
        ],
        disallow: [
          "/admin",
          "/api",
          "/wholesale",
          "/cart",
          "/checkout",
          "/account",
          "/login",
          "/orders",
          "/search",
          // B2B utility pages serve noindex metadata. Crawlers must be able to
          // fetch it; robots.txt blocking alone does not prevent URL indexing.
          "/*?sort=",
          "/*?filter=",
          "/*?q=",
        ],
      },
    ],
    sitemap: canonical("/sitemap.xml"),
  };
}
