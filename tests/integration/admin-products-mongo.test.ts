import { MongoClient, type Db } from "mongodb";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { products, variants, inventoryItems } from "@ufo/domain";
import { databaseIndexes } from "@ufo/database";
import { productQuerySchema, queryAdminProducts } from "@/lib/admin-product-query";
import { bulkUpdateProducts } from "@/lib/admin-product-bulk";

const state = vi.hoisted(() => ({ db: undefined as Db | undefined }));
vi.mock("@ufo/database", async (original) => ({
  ...(await original<typeof import("@ufo/database")>()),
  hasUsableMongoUri: () => true,
  getDb: async () => {
    if (!state.db) throw new Error("Test database not initialized");
    return state.db;
  },
}));
const uri = process.env.UFO_TEST_MONGODB_URI;
const enabled = Boolean(uri && /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(uri));
// Never uses MONGODB_URI or a remote database. The only dropped DB is created here.
describe.skipIf(!enabled)("MongoDB product pagination and mutations", () => {
  let client: MongoClient;
  const name = `ufo_admin_test_${randomUUID().replaceAll("-", "")}`;
  beforeAll(async () => {
    client = await new MongoClient(uri!).connect();
    state.db = client.db(name);
    for (const collection of ["products", "productVariants", "inventoryItems"] as const) {
      await state.db.collection(collection).createIndexes(databaseIndexes[collection]);
    }
    await state.db
      .collection("products")
      .insertMany(
        Array.from({ length: 125 }, (_, i) => ({
          ...products[0]!,
          id: `p-${i}`,
          slug: `test-${i}`,
          nameFa: `Item ${i}`,
          updatedAt: "2026-09-01",
          isActive: i % 2 === 0,
        })),
      );
    await state.db
      .collection("productVariants")
      .insertMany(
        Array.from({ length: 125 }, (_, i) => ({
          ...variants[0]!,
          id: `v-${i}`,
          productId: `p-${i}`,
          sku: `TEST-${i}`,
          retailPriceRial: i * 1000,
        })),
      );
    await state.db
      .collection("inventoryItems")
      .insertMany(
        Array.from({ length: 125 }, (_, i) => ({
          ...inventoryItems[0]!,
          id: `i-${i}`,
          variantId: `v-${i}`,
          onHand: i % 10,
          reserved: 2,
          restockThreshold: 4,
        })),
      );
  });
  afterAll(async () => {
    if (state.db?.databaseName === name && name.startsWith("ufo_admin_test_"))
      await state.db.dropDatabase();
    await client?.close();
  });
  it("executes the aggregate with exact count, stable pages, sorting and stock filtering", async () => {
    const first = await queryAdminProducts(
      productQuerySchema.parse({ pageSize: 20, sort: "price", direction: "asc" }),
    );
    expect(first.total).toBe(125);
    expect(first.rows).toHaveLength(20);
    expect(first.rows[0]?.variant.retailPriceRial).toBe(0);
    expect(first.rows[0]?.product).not.toHaveProperty("descriptionFa");
    expect(first.rows[0]?.variant).not.toHaveProperty("_id");
    const second = await queryAdminProducts(
      productQuerySchema.parse({ pageSize: 20, page: 2, sort: "price", direction: "asc" }),
    );
    expect(second.rows[0]?.variant.retailPriceRial).toBe(20000);
    const low = await queryAdminProducts(
      productQuerySchema.parse({ stock: "low", status: "active" }),
    );
    expect(
      low.rows.every(
        (r) => r.product.isActive && r.inventory.onHand > 2 && r.inventory.onHand <= 6,
      ),
    ).toBe(true);
    const search = await queryAdminProducts(productQuerySchema.parse({ q: "TEST-124" }));
    expect(search.total).toBe(1);
    expect((await queryAdminProducts(productQuerySchema.parse({ q: ".*" }))).total).toBe(0);
    expect((await queryAdminProducts(productQuerySchema.parse({ page: 999 }))).page).toBe(3);
  });
  it("keeps deleted products out of results and updates prices in MongoDB", async () => {
    expect(
      (await bulkUpdateProducts({ ids: ["p-124"], action: "prices", retailPriceRial: 700 }))
        .succeeded,
    ).toEqual(["p-124"]);
    expect(
      (await queryAdminProducts(productQuerySchema.parse({ q: "TEST-124" }))).rows[0]?.variant
        .retailPriceRial,
    ).toBe(700);
    await bulkUpdateProducts({ ids: ["p-124"], action: "delete" });
    expect((await queryAdminProducts(productQuerySchema.parse({ q: "TEST-124" }))).total).toBe(0);
    expect(
      await state
        .db!.collection("products")
        .countDocuments({ id: "p-124", deletedAt: { $exists: true } }),
    ).toBe(1);
  });
});
