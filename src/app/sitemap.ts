import type { MetadataRoute } from "next";
import { categories, products } from "@ufo/domain";
import { canonical } from "@ufo/seo";
import { listCatalogRows } from "@/lib/catalog-data";
import { listPublishedPosts } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

function validModifiedDate(value: string): Date | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let catalogProducts = products;
  try {
    catalogProducts = (await listCatalogRows()).map((row) => row.product);
  } catch {
    // Keep the sitemap available while the catalog store is unavailable.
  }
  const activeProducts = [
    ...new Map(
      catalogProducts
        .filter(
          (product) => product.isActive && (product.salesChannels?.includes("retail") ?? true),
        )
        .map((product) => [product.slug, product]),
    ).values(),
  ];
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
    { url: canonical("/"), changeFrequency: "weekly", priority: 1 },
    {
      url: canonical("/products"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: canonical("/nicotine-guide"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: canonical("/store/tehran-molavi"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: canonical("/blog"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: canonical("/b2b"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: canonical("/b2b/blog"),
      changeFrequency: "weekly",
      priority: 0.65,
    },
    ...indexableCategories.map((category) => {
      const updatedAt = activeProducts
        .filter((product) => product.categoryId === category.id)
        .map((product) => validModifiedDate(product.updatedAt)?.getTime())
        .filter((time): time is number => time !== undefined);
      return {
        url: canonical(`/products/category/${category.slug}`),
        ...(updatedAt.length > 0 ? { lastModified: new Date(Math.max(...updatedAt)) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      };
    }),
    ...activeProducts.map((product) => {
      const lastModified = validModifiedDate(product.updatedAt);
      return {
        url: canonical(`/products/${product.slug}`),
        ...(lastModified ? { lastModified } : {}),
      };
    }),
    ...contentPosts.map((post) => ({
      url: canonical(`${post.audience === "wholesale" ? "/b2b/blog" : "/blog"}/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: post.type === "news" ? 0.55 : 0.6,
    })),
  ];
}
