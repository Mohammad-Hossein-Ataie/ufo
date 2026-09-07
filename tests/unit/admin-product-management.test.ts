import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { products, variants, inventoryItems, brands, categories } from "@ufo/domain";
import {
  getMemoryAdminProducts,
  getAdminProduct,
  saveAdminProduct,
  type AdminProductRecord,
} from "@/lib/admin-products";
import {
  paginateMemoryProducts,
  productQuerySchema,
  queryAdminProducts,
} from "@/lib/admin-product-query";
import { bulkProductSchema, bulkUpdateProducts } from "@/lib/admin-product-bulk";
import { GET as listRoute } from "@/app/api/admin/products/route";
import { POST as bulkRoute } from "@/app/api/admin/products/bulk/route";
import { createAdminSessionToken } from "@/lib/admin-session";

beforeEach(() => {
  vi.stubEnv("MONGODB_URI", "");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
  vi.stubEnv("SESSION_SECRET", "test-product-management-secret-32-characters");
});
afterEach(() => vi.unstubAllEnvs());
const fixture = (): AdminProductRecord[] =>
  Array.from({ length: 3240 }, (_, i) => ({
    product: {
      ...products[0]!,
      id: `test-${String(i).padStart(5, "0")}`,
      nameFa: `Product ${i}`,
      slug: `product-${i}`,
      categoryId: categories[i % 2]!.id,
      brandId: brands[i % 2]!.id,
      productKind: "accessory",
      salesChannels: [i % 2 ? "retail" : "wholesale"],
      isActive: i % 2 === 0,
      updatedAt: "2026-09-01T00:00:00Z",
    },
    variant: {
      ...variants[0]!,
      id: `var-${i}`,
      sku: `SKU-${i}`,
      retailPriceRial: i * 1000,
      wholesalePriceRial: i * 500,
    },
    inventory: { ...inventoryItems[0]!, onHand: i % 12, reserved: 2, restockThreshold: 4 },
    brandNameFa: brands[i % 2]!.nameFa,
    categoryNameFa: categories[i % 2]!.nameFa,
  }));
describe("bounded product queries", () => {
  it("paginates thousands of products without duplicate or missing boundary rows", () => {
    const rows = fixture();
    const query = productQuerySchema.parse({ pageSize: 50 });
    const first = paginateMemoryProducts(rows, query),
      second = paginateMemoryProducts(rows, { ...query, page: 2 });
    expect(first.total).toBe(3240);
    expect(first.rows).toHaveLength(50);
    expect(second.rows).toHaveLength(50);
    expect(new Set([...first.rows, ...second.rows].map((r) => r.product.id)).size).toBe(100);
    expect(paginateMemoryProducts(rows, { ...query, page: 999 }).rows).toHaveLength(40);
    expect(first.rows[0]!.product).not.toHaveProperty("descriptionFa");
  });
  it.each([20, 50, 100])("supports page size %i", (pageSize) =>
    expect(
      paginateMemoryProducts(fixture(), productQuerySchema.parse({ pageSize })).rows,
    ).toHaveLength(pageSize),
  );
  it.each([
    { pageSize: 5000 },
    { page: -1 },
    { sort: "$where" },
    { q: "a".repeat(121) },
    { status: "invalid" },
  ])("rejects invalid query parameters", (input) =>
    expect(productQuerySchema.safeParse(input).success).toBe(false),
  );
  it("searches SKU/slug/name and combines category, brand, kind, channel, state and stock filters", () => {
    const rows = fixture();
    expect(
      paginateMemoryProducts(rows, productQuerySchema.parse({ q: "SKU-3239" })).rows[0]?.product.id,
    ).toBe("test-03239");
    expect(
      paginateMemoryProducts(rows, productQuerySchema.parse({ q: "product-3239" })).total,
    ).toBe(1);
    const result = paginateMemoryProducts(
      rows,
      productQuerySchema.parse({
        category: categories[0]!.id,
        brand: brands[0]!.id,
        kind: "accessory",
        channel: "wholesale",
        status: "active",
        stock: "low",
        sort: "price",
        direction: "asc",
      }),
    );
    expect(result.total).toBeGreaterThan(0);
    expect(
      result.rows.every(
        (r) => r.product.isActive && r.inventory.onHand > 2 && r.inventory.onHand <= 6,
      ),
    ).toBe(true);
    expect(result.rows[0]!.variant.retailPriceRial).toBeLessThan(
      result.rows[1]!.variant.retailPriceRial,
    );
    expect(paginateMemoryProducts(rows, productQuerySchema.parse({ q: ".*" })).total).toBe(0);
    expect(paginateMemoryProducts([], productQuerySchema.parse({}))).toMatchObject({
      rows: [],
      total: 0,
      page: 1,
    });
  });
  it("returns bounded API data with an exact total and rejects unbounded sizes", async () => {
    const response = await listRoute(
      new Request("http://localhost:3000/api/admin/products?pageSize=20&page=2"),
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.rows).toHaveLength(20);
    expect(data.total).toBe(getMemoryAdminProducts().length);
    expect(
      (await listRoute(new Request("http://localhost:3000/api/admin/products?pageSize=10000")))
        .status,
    ).toBe(400);
  });
});

describe("catalog mutations", () => {
  it("generates default SEO when optional editor fields are left empty", async () => {
    const row = await saveAdminProduct({
      nameFa: "محصول بدون سئوی سفارشی",
      slug: "default-seo-test",
      categoryId: "cat-lighter",
      productKind: "accessory",
      salesChannels: ["retail"],
      variantType: "none",
      retailPriceRial: 0,
      seoTitle: "",
      seoDescription: "",
    });
    expect(row.product.seoTitle).toContain(row.product.nameFa);
    expect(row.product.seoDescription.length).toBeGreaterThan(0);
    await bulkUpdateProducts({ ids: [row.product.id], action: "delete" });
  });
  it("persists SEO, stock and image order; applies bulk changes and tombstones deletion", async () => {
    const row = await saveAdminProduct({
      nameFa: "محصول تست مدیریت",
      slug: "management-test",
      categoryId: "cat-lighter",
      productKind: "accessory",
      salesChannels: ["retail"],
      variantType: "none",
      retailPriceRial: 1000,
      onHand: 10,
      image: "/images/ufo-hero.webp",
      images: ["/images/ufo-hero.webp", "/images/second.png"],
      seoTitle: "عنوان سفارشی",
      seoDescription: "توضیح سفارشی",
      seoKeywords: ["تست"],
    });
    expect((await getAdminProduct(row.product.id))?.product.seoTitle).toBe("عنوان سفارشی");
    const input = { ids: [row.product.id] };
    expect(
      (await bulkUpdateProducts({ ...input, action: "prices", retailPriceRial: 9000 })).succeeded,
    ).toEqual(input.ids);
    expect((await getAdminProduct(row.product.id))?.variant.retailPriceRial).toBe(9000);
    await bulkUpdateProducts({ ...input, action: "deactivate" });
    expect((await getAdminProduct(row.product.id))?.product.isActive).toBe(false);
    await bulkUpdateProducts({ ...input, action: "activate" });
    await bulkUpdateProducts({ ...input, action: "brand", value: brands[1]!.id });
    expect((await getAdminProduct(row.product.id))?.product.brandId).toBe(brands[1]!.id);
    const edited = await getAdminProduct(row.product.id);
    await saveAdminProduct({
      id: row.product.id,
      nameFa: row.product.nameFa,
      categoryId: row.product.categoryId,
      productKind: "accessory",
      salesChannels: ["retail"],
      variantType: "none",
      retailPriceRial: 9000,
      image: "/images/second.png",
      images: ["/images/second.png", "/images/ufo-hero.webp"],
    });
    expect((await getAdminProduct(row.product.id))?.product.images[0]).toBe("/images/second.png");
    expect((await getAdminProduct(row.product.id))?.product.seoTitle).toBe(
      edited?.product.seoTitle,
    );
    const result = await bulkUpdateProducts({ ids: [row.product.id, "missing"], action: "delete" });
    expect(result.succeeded).toEqual(input.ids);
    expect(result.failed).toHaveLength(1);
    expect(await getAdminProduct(row.product.id)).toBeUndefined();
    expect(
      (await queryAdminProducts(productQuerySchema.parse({ q: "management-test" }))).total,
    ).toBe(0);
  });
  it("bounds and validates bulk mutations", () => {
    expect(
      bulkProductSchema.safeParse({ action: "delete", ids: Array(101).fill("id") }).success,
    ).toBe(false);
    expect(
      bulkProductSchema.safeParse({ action: "prices", ids: ["id"], retailPriceRial: -1 }).success,
    ).toBe(false);
    expect(
      bulkProductSchema.safeParse({ action: "brand", ids: ["id"], value: "invalid" }).success,
    ).toBe(false);
  });
  it("enforces admin session and same-origin protection on the bulk endpoint", async () => {
    const body = JSON.stringify({ ids: ["missing"], action: "activate" });
    const token = await createAdminSessionToken("admin");
    const make = (headers: Record<string, string>) =>
      new Request("http://localhost:3000/api/admin/products/bulk", {
        method: "POST",
        headers,
        body,
      });
    expect((await bulkRoute(make({ origin: "http://localhost:3000" }))).status).toBe(401);
    expect(
      (
        await bulkRoute(
          make({ cookie: `ufo_admin_session=${token}`, origin: "https://evil.example" }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await bulkRoute(
          make({ cookie: `ufo_admin_session=${token}`, origin: "http://localhost:3000" }),
        )
      ).status,
    ).toBe(200);
  });
});
