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
          "/b2b/cart",
          "/b2b/checkout",
          "/b2b/login",
          "/b2b/orders",
          "/b2b/account",
          "/*?sort=",
          "/*?filter=",
          "/*?q=",
        ],
      },
    ],
    sitemap: canonical("/sitemap.xml"),
  };
}
