import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/store", "/blog", "/b2b", "/b2b/catalog"],
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
          "/*?filter="
        ]
      }
    ],
    sitemap: "https://ufopuff.ir/sitemap.xml"
  };
}
