import { beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "@ufo/domain";
import { listCatalogRows } from "@/lib/catalog-data";
import { listPublishedPosts } from "@/lib/content-posts";
import sitemap from "@/app/sitemap";

vi.mock("@/lib/catalog-data", () => ({ listCatalogRows: vi.fn() }));
vi.mock("@/lib/content-posts", () => ({ listPublishedPosts: vi.fn() }));

describe("public sitemap", () => {
  beforeEach(() => {
    vi.mocked(listPublishedPosts).mockResolvedValue([]);
  });

  it("includes live retail products once and excludes inactive or wholesale-only products", async () => {
    const base = products[0]!;
    const live = {
      ...base,
      slug: "live-catalog-item",
      categoryId: "cat-vape",
      updatedAt: "2026-09-27T12:00:00.000Z",
      isActive: true,
      salesChannels: ["retail"] as const,
    };
    const inactive = { ...base, slug: "inactive-catalog-item", isActive: false };
    const wholesale = {
      ...base,
      slug: "wholesale-catalog-item",
      salesChannels: ["wholesale"] as const,
    };
    vi.mocked(listCatalogRows).mockResolvedValue(
      [live, live, inactive, wholesale].map((product) => ({ product })) as Awaited<
        ReturnType<typeof listCatalogRows>
      >,
    );

    const entries = await sitemap();
    const productUrl = "https://ufopuff.com/products/live-catalog-item";
    expect(entries.filter((entry) => entry.url === productUrl)).toHaveLength(1);
    expect(entries.some((entry) => entry.url.endsWith("/products/inactive-catalog-item"))).toBe(
      false,
    );
    expect(entries.some((entry) => entry.url.endsWith("/products/wholesale-catalog-item"))).toBe(
      false,
    );
    expect(
      entries.find((entry) => entry.url.endsWith("/products/category/vape"))?.lastModified,
    ).toEqual(new Date(live.updatedAt));
  });

  it("keeps a useful sitemap when the catalog store is unavailable", async () => {
    vi.mocked(listCatalogRows).mockRejectedValue(new Error("catalog unavailable"));
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url === "https://ufopuff.com/")).toBe(true);
    expect(entries.some((entry) => entry.url === "https://ufopuff.com/nicotine-guide")).toBe(true);
    expect(entries.some((entry) => entry.url.includes("/products/"))).toBe(true);
  });
});
