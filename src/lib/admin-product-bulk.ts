import { z } from "zod";
import { brands, categories, getDefaultProductVariantType } from "@ufo/domain";
import { getDb, hasUsableMongoUri } from "@ufo/database";
import type { Product, ProductVariant } from "@ufo/types";
import { getAdminProduct, mutateMemoryAdminProduct } from "./admin-products";

const ids = z
  .array(z.string().min(1).max(150))
  .min(1)
  .max(100)
  .transform((values) => [...new Set(values)]);
export const bulkProductSchema = z.discriminatedUnion("action", [
  z.object({ ids, action: z.literal("activate") }),
  z.object({ ids, action: z.literal("deactivate") }),
  z.object({ ids, action: z.literal("delete") }),
  z.object({
    ids,
    action: z.literal("category"),
    value: z.string().refine((id) => categories.some((c) => c.id === id)),
  }),
  z.object({
    ids,
    action: z.literal("brand"),
    value: z.string().refine((id) => brands.some((b) => b.id === id)),
  }),
  z.object({
    ids,
    action: z.literal("prices"),
    retailPriceRial: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
    wholesalePriceRial: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  }),
]);
export type BulkProductInput = z.infer<typeof bulkProductSchema>;
export async function bulkUpdateProducts(input: BulkProductInput) {
  if (
    input.action === "prices" &&
    input.retailPriceRial === undefined &&
    input.wholesalePriceRial === undefined
  )
    throw new Error("حداقل یک قیمت وارد کنید.");
  const succeeded: string[] = [],
    failed: Array<{ id: string; error: string }> = [];
  const db = hasUsableMongoUri() ? await getDb() : undefined;
  for (const id of input.ids) {
    try {
      const current = await getAdminProduct(id);
      if (!current) throw new Error("محصول پیدا نشد.");
      const product: Partial<Product> = { updatedAt: new Date().toISOString() };
      const variant: Partial<ProductVariant> = {};
      if (input.action === "activate" || input.action === "deactivate")
        product.isActive = variant.isActive = input.action === "activate";
      if (input.action === "delete") {
        product.deletedAt = product.updatedAt!;
        product.isActive = variant.isActive = false;
      }
      if (input.action === "brand") product.brandId = input.value;
      if (input.action === "category") {
        if (
          getDefaultProductVariantType({ ...current.product, categoryId: input.value }) !==
          getDefaultProductVariantType(current.product)
        )
          throw new Error("این دسته به تنوع متفاوت نیاز دارد؛ محصول را جداگانه ویرایش کنید.");
        product.categoryId = input.value;
      }
      if (input.action === "prices") {
        if (input.retailPriceRial !== undefined) variant.retailPriceRial = input.retailPriceRial;
        if (input.wholesalePriceRial !== undefined)
          variant.wholesalePriceRial = input.wholesalePriceRial;
      }
      if (db) {
        if (Object.keys(variant).length)
          await db
            .collection<ProductVariant>("productVariants")
            .updateMany({ productId: id }, { $set: variant });
        await db
          .collection<Product>("products")
          .updateOne({ id, deletedAt: { $exists: false } }, { $set: product });
      } else mutateMemoryAdminProduct(id, product, variant);
      succeeded.push(id);
    } catch (error) {
      failed.push({
        id,
        error:
          error instanceof Error && /محصول|دسته/.test(error.message)
            ? error.message
            : "تغییر کامل نشد؛ وضعیت محصول را بررسی و دوباره تلاش کنید.",
      });
    }
  }
  return { succeeded, failed };
}
