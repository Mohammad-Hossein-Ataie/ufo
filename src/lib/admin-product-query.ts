import { z } from "zod";
import { brands, categories } from "@ufo/domain";
import type { Brand } from "@ufo/types";
import { getDb, hasUsableMongoUri } from "@ufo/database";
import type { Document } from "mongodb";
import { getMemoryAdminProducts, type AdminProductRecord } from "./admin-products";

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce
    .number()
    .refine((n) => [20, 50, 100].includes(n))
    .default(50),
  q: z.string().trim().max(120).default(""),
  category: z.string().max(100).default(""),
  brand: z.string().max(100).default(""),
  kind: z
    .enum([
      "",
      "disposable",
      "pod-device",
      "vape-device",
      "e-liquid",
      "salt-nicotine",
      "cartridge",
      "coil",
      "accessory",
    ])
    .default(""),
  channel: z.enum(["", "retail", "wholesale"]).default(""),
  status: z.enum(["", "active", "inactive"]).default(""),
  stock: z.enum(["", "in", "low", "out"]).default(""),
  sort: z
    .enum(["updatedAt", "nameFa", "brand", "category", "price", "wholesale", "stock", "status"])
    .default("updatedAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductListRow = Pick<
  AdminProductRecord,
  "brandNameFa" | "categoryNameFa" | "variant" | "inventory"
> & {
  product: Pick<
    AdminProductRecord["product"],
    "id" | "nameFa" | "slug" | "image" | "brandId" | "categoryId" | "isActive" | "updatedAt"
  >;
};
export interface ProductPage {
  rows: ProductListRow[];
  total: number;
  page: number;
  pageSize: number;
}
const paths = {
  updatedAt: "updatedAt",
  nameFa: "nameFa",
  brand: "brandNameFa",
  category: "categoryNameFa",
  price: "variant.retailPriceRial",
  wholesale: "variant.wholesalePriceRial",
  stock: "available",
  status: "isActive",
};
const available = (row: AdminProductRecord) =>
  Math.max(0, row.inventory.onHand - row.inventory.reserved);
function summary(row: AdminProductRecord): ProductListRow {
  const { id, nameFa, slug, image, brandId, categoryId, isActive, updatedAt } = row.product;
  return { ...row, product: { id, nameFa, slug, image, brandId, categoryId, isActive, updatedAt } };
}
export function paginateMemoryProducts(
  rows: AdminProductRecord[],
  query: ProductQuery,
): ProductPage {
  const filtered = rows.filter((row) => {
    const p = row.product;
    return (
      !p.deletedAt &&
      (!query.q ||
        [
          p.nameFa,
          p.nameEn,
          p.slug,
          row.variant.sku,
          row.brandNameFa,
          brands.find((b) => b.id === p.brandId)?.slug,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.q.toLowerCase())) &&
      (!query.category || p.categoryId === query.category) &&
      (!query.brand || p.brandId === query.brand) &&
      (!query.kind || p.productKind === query.kind) &&
      (!query.channel || (p.salesChannels ?? ["retail", "wholesale"]).includes(query.channel)) &&
      (!query.status || p.isActive === (query.status === "active")) &&
      (!query.stock ||
        (query.stock === "out"
          ? available(row) === 0
          : query.stock === "low"
            ? available(row) > 0 && available(row) <= row.inventory.restockThreshold
            : available(row) > 0))
    );
  });
  const value = (r: AdminProductRecord) =>
    ({
      updatedAt: r.product.updatedAt,
      nameFa: r.product.nameFa,
      brand: r.brandNameFa,
      category: r.categoryNameFa,
      price: r.variant.retailPriceRial,
      wholesale: r.variant.wholesalePriceRial,
      stock: available(r),
      status: Number(r.product.isActive),
    })[query.sort];
  filtered.sort((a, b) => {
    const av = value(a),
      bv = value(b);
    const order =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return (query.direction === "asc" ? order : -order) || a.product.id.localeCompare(b.product.id);
  });
  const page = Math.min(query.page, Math.max(1, Math.ceil(filtered.length / query.pageSize)));
  return {
    rows: filtered.slice((page - 1) * query.pageSize, page * query.pageSize).map(summary),
    total: filtered.length,
    page,
    pageSize: query.pageSize,
  };
}

export function productPipeline(query: ProductQuery, brandList: Brand[] = brands): Document[] {
  const match: Document = { deletedAt: { $exists: false } };
  if (query.category) match.categoryId = query.category;
  if (query.brand) match.brandId = query.brand;
  if (query.kind) match.productKind = query.kind;
  if (query.channel)
    match.$or = [{ salesChannels: query.channel }, { salesChannels: { $exists: false } }];
  if (query.status) match.isActive = query.status === "active";
  const lookupName = (items: Array<{ id: string; nameFa: string }>, field: string) => ({
    $switch: {
      branches: items.map((item) => ({ case: { $eq: [`$${field}`, item.id] }, then: item.nameFa })),
      default: `$${field}`,
    },
  });
  const pipeline: Document[] = [
    { $match: match },
    {
      $lookup: {
        from: "productVariants",
        localField: "id",
        foreignField: "productId",
        pipeline: [{ $sort: { id: 1 } }],
        as: "variants",
      },
    },
    {
      $set: {
        variant: { $first: "$variants" },
        brandNameFa: lookupName(brandList, "brandId"),
        categoryNameFa: lookupName(categories, "categoryId"),
      },
    },
    { $match: { variant: { $exists: true } } },
    {
      $lookup: {
        from: "inventoryItems",
        localField: "variant.id",
        foreignField: "variantId",
        as: "stockItems",
      },
    },
    {
      $set: {
        inventory: {
          $ifNull: [{ $first: "$stockItems" }, { onHand: 0, reserved: 0, restockThreshold: 5 }],
        },
      },
    },
    {
      $set: {
        available: { $max: [0, { $subtract: ["$inventory.onHand", "$inventory.reserved"] }] },
      },
    },
  ];
  if (query.q) {
    const regex = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const brandIds = brandList
      .filter((b) => `${b.nameFa} ${b.slug}`.toLowerCase().includes(query.q.toLowerCase()))
      .map((b) => b.id);
    pipeline.push({
      $match: {
        $or: [
          ...["nameFa", "nameEn", "slug", "variants.sku"].map((field) => ({
            [field]: { $regex: regex, $options: "i" },
          })),
          { brandId: { $in: brandIds } },
        ],
      },
    });
  }
  if (query.stock)
    pipeline.push({
      $match:
        query.stock === "out"
          ? { available: 0 }
          : query.stock === "in"
            ? { available: { $gt: 0 } }
            : {
                available: { $gt: 0 },
                $expr: { $lte: ["$available", "$inventory.restockThreshold"] },
              },
    });
  return [
    ...pipeline,
    {
      $unset: [
        "descriptionFa",
        "shortDescriptionFa",
        "images",
        "attributes",
        "specs",
        "variantImages",
        "colorImages",
        "stockItems",
        "variants",
        "variant._id",
        "inventory._id",
      ],
    },
    {
      $facet: {
        count: [{ $count: "total" }],
        rows: [
          { $sort: { [paths[query.sort]]: query.direction === "asc" ? 1 : -1, id: 1 } },
          { $skip: (query.page - 1) * query.pageSize },
          { $limit: query.pageSize },
          {
            $project: {
              _id: 0,
              product: {
                id: "$id",
                nameFa: "$nameFa",
                slug: "$slug",
                image: "$image",
                brandId: "$brandId",
                categoryId: "$categoryId",
                isActive: "$isActive",
                updatedAt: "$updatedAt",
              },
              variant: 1,
              inventory: 1,
              brandNameFa: 1,
              categoryNameFa: 1,
            },
          },
        ],
      },
    },
  ];
}

export async function queryAdminProducts(query: ProductQuery, brandList: Brand[] = brands): Promise<ProductPage> {
  if (!hasUsableMongoUri()) {
    const rows = getMemoryAdminProducts().map((row) => ({
      ...row,
      brandNameFa: brandList.find((brand) => brand.id === row.product.brandId)?.nameFa ?? row.brandNameFa,
    }));
    return paginateMemoryProducts(rows, query);
  }
  const db = await getDb();
  const [result] = await db
    .collection("products")
    .aggregate<{
      rows: ProductListRow[];
      count: Array<{ total: number }>;
    }>(productPipeline(query, brandList), { maxTimeMS: 10000, allowDiskUse: true })
    .toArray();
  const total = result?.count[0]?.total ?? 0;
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  if (page !== query.page) return queryAdminProducts({ ...query, page }, brandList);
  return { rows: result?.rows ?? [], total, page, pageSize: query.pageSize };
}
