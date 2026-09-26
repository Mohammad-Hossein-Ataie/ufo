import type { MetadataRoute } from "next";
import { categories, products } from "@ufo/domain";
import { canonical } from "@ufo/seo";
import { listPublishedPosts } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUpdatedAt = new Date("2026-08-05T00:00:00.000Z");
  const activeProducts = products.filter((product) => product.isActive);
  const indexableCategories = categories.filter((category) =>
    activeProducts.some((product) => product.categoryId === category.id),
  );

  let contentPosts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    contentPosts = await listPublishedPosts();
  } catch {
    // Core storefront URLs must remain available if the content store is temporarily offline.
  }
  return [
    { url: canonical("/"), lastModified: siteUpdatedAt, changeFrequency: "weekly", priority: 1 },
    {
      url: canonical("/products"),
      lastModified: siteUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: canonical("/store/tehran-molavi"),
      lastModified: siteUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: canonical("/blog"),
      lastModified: siteUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonical("/b2b"),
      lastModified: siteUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: canonical("/b2b/blog"),
      lastModified: siteUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    },
    ...indexableCategories.map((category) => ({
      url: canonical(`/products/category/${category.slug}`),
      lastModified: siteUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...activeProducts.map((product) => ({
      url: canonical(`/products/${product.slug}`),
      lastModified: new Date(product.updatedAt),
    })),
    ...contentPosts.map((post) => ({
      url: canonical(`${post.audience === "wholesale" ? "/b2b/blog" : "/blog"}/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: post.type === "news" ? 0.55 : 0.6,
    })),
  ];
}
