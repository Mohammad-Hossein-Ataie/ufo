import { ensureIndexes, getDb } from "@ufo/database";
import { brands, categories, inventoryItems, products, variants } from "@ufo/domain";
import type {
  InventoryItem,
  Product,
  ProductKind,
  ProductSpec,
  ProductVariant,
  SalesChannel,
} from "@ufo/types";

export interface AdminProductRecord {
  product: Product;
  variant: ProductVariant;
  inventory: InventoryItem;
  brandNameFa: string;
  categoryNameFa: string;
}

export interface AdminProductInput {
  id?: string | undefined;
  variantId?: string | undefined;
  inventoryId?: string | undefined;
  nameFa: string;
  nameEn?: string | undefined;
  slug?: string | undefined;
  brandId?: string | undefined;
  categoryId: string;
  productKind: ProductKind;
  salesChannels: SalesChannel[];
  shortDescriptionFa?: string | undefined;
  descriptionFa?: string | undefined;
  image?: string | undefined;
  tags?: string[] | undefined;
  specs?: ProductSpec[] | undefined;
  retailPriceRial: number;
  wholesalePriceRial?: number | undefined;
  wholesaleEnabled?: boolean | undefined;
  cartonSize?: number | undefined;
  minWholesaleCartonCount?: number | undefined;
  onHand?: number | undefined;
  reserved?: number | undefined;
  restockThreshold?: number | undefined;
  isActive?: boolean | undefined;
}

const memoryState = {
  products: [...products],
  variants: [...variants],
  inventoryItems: [...inventoryItems],
};

function normalizeSlug(value: string): string {
  const normalized = value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const latin = normalized.match(/[a-z0-9]+/g)?.join("-") ?? "";
  const fallback = Buffer.from(normalized || "product")
    .toString("hex")
    .slice(0, 18);
  return (latin || `product-${fallback}`).replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function getBrandName(brandId: string): string {
  return brands.find((brand) => brand.id === brandId)?.nameFa ?? brandId;
}

function getCategoryName(categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.nameFa ?? categoryId;
}

function assertInput(input: AdminProductInput) {
  if (!input.nameFa?.trim()) throw new Error("نام فارسی محصول الزامی است.");
  if (!categories.some((category) => category.id === input.categoryId))
    throw new Error("دسته‌بندی معتبر نیست.");
  if (!Number.isInteger(input.retailPriceRial) || input.retailPriceRial < 0)
    throw new Error("قیمت تک‌فروشی معتبر نیست.");
  if (
    input.wholesalePriceRial !== undefined &&
    (!Number.isInteger(input.wholesalePriceRial) || input.wholesalePriceRial < 0)
  ) {
    throw new Error("قیمت همکاری معتبر نیست.");
  }
  if (!input.salesChannels.every((channel) => channel === "retail" || channel === "wholesale")) {
    throw new Error("کانال فروش معتبر نیست.");
  }
}

function buildDocuments(
  input: AdminProductInput,
  current?: AdminProductRecord,
): AdminProductRecord {
  assertInput(input);
  const date = nowIso();
  const slug = normalizeSlug(input.slug || input.nameEn || input.nameFa);
  const productId = input.id || current?.product.id || `prod-admin-${slug}-${Date.now()}`;
  const variantId = input.variantId || current?.variant.id || `var-admin-${slug}-${Date.now()}`;
  const inventoryId =
    input.inventoryId || current?.inventory.id || `inv-admin-${slug}-${Date.now()}`;
  const brandId = input.brandId || current?.product.brandId || "brand-ufo";
  const image = input.image?.trim() || current?.product.image || "/images/ufo-hero.png";
  const tags = input.tags?.filter(Boolean) ?? current?.product.tags ?? [];
  const retailPriceRial = input.retailPriceRial;
  const wholesalePriceRial =
    input.wholesalePriceRial ?? current?.variant.wholesalePriceRial ?? retailPriceRial;
  const salesChannels: SalesChannel[] =
    input.salesChannels.length > 0 ? input.salesChannels : ["retail"];
  const wholesaleEnabled = input.wholesaleEnabled ?? salesChannels.includes("wholesale");

  const product: Product = {
    id: productId,
    slug,
    nameFa: input.nameFa.trim(),
    ...(input.nameEn?.trim() ? { nameEn: input.nameEn.trim() } : {}),
    brandId,
    categoryId: input.categoryId,
    productKind: input.productKind,
    salesChannels,
    shortDescriptionFa:
      input.shortDescriptionFa?.trim() || `${input.nameFa.trim()} در کاتالوگ UFO Puff.`,
    descriptionFa:
      input.descriptionFa?.trim() ||
      input.shortDescriptionFa?.trim() ||
      `${input.nameFa.trim()} از پنل ادمین ثبت شده است.`,
    image,
    images: [image],
    tags,
    attributes: [
      { nameFa: "نوع", valueFa: getCategoryName(input.categoryId) },
      ...(input.nameEn?.trim()
        ? [
            {
              nameFa: "نام لاتین",
              valueFa: input.nameEn.trim(),
              technicalValue: input.nameEn.trim(),
            },
          ]
        : []),
    ],
    specs: input.specs ?? current?.product.specs ?? [],
    sourceNoteFa: current?.product.sourceNoteFa ?? "ثبت‌شده از پنل ادمین",
    isActive: input.isActive ?? true,
    isAgeRestricted: true,
    seoTitle: `${input.nameFa.trim()} | UFO Puff`,
    seoDescription:
      input.shortDescriptionFa?.trim() || `${input.nameFa.trim()} با قیمت و موجودی قابل ویرایش.`,
    createdAt: current?.product.createdAt ?? date,
    updatedAt: date,
  };

  const variant: ProductVariant = {
    id: variantId,
    productId,
    nameFa: current?.variant.nameFa ?? "استاندارد",
    sku: current?.variant.sku ?? `UFO-ADM-${String(Date.now()).slice(-8)}`,
    retailPriceRial,
    wholesalePriceRial,
    cartonSize: input.cartonSize ?? current?.variant.cartonSize ?? 10,
    minWholesaleCartonCount:
      input.minWholesaleCartonCount ?? current?.variant.minWholesaleCartonCount ?? 1,
    wholesaleEnabled,
    attributes: current?.variant.attributes ?? [{ nameFa: "مدل", valueFa: "استاندارد" }],
    isActive: input.isActive ?? true,
  };

  const inventory: InventoryItem = {
    id: inventoryId,
    variantId,
    onHand: input.onHand ?? current?.inventory.onHand ?? 0,
    reserved: input.reserved ?? current?.inventory.reserved ?? 0,
    preorderEnabled: current?.inventory.preorderEnabled ?? true,
    restockThreshold: input.restockThreshold ?? current?.inventory.restockThreshold ?? 5,
    updatedAt: date,
  };

  return {
    product,
    variant,
    inventory,
    brandNameFa: getBrandName(product.brandId),
    categoryNameFa: getCategoryName(product.categoryId),
  };
}

function combineRows(
  productList: Product[],
  variantList: ProductVariant[],
  inventoryList: InventoryItem[],
): AdminProductRecord[] {
  return productList
    .map((product) => {
      const variant = variantList.find((item) => item.productId === product.id);
      if (!variant) return undefined;
      const inventory = inventoryList.find((item) => item.variantId === variant.id) ?? {
        id: `inv-missing-${variant.id}`,
        variantId: variant.id,
        onHand: 0,
        reserved: 0,
        preorderEnabled: true,
        restockThreshold: 5,
        updatedAt: nowIso(),
      };
      return {
        product,
        variant,
        inventory,
        brandNameFa: getBrandName(product.brandId),
        categoryNameFa: getCategoryName(product.categoryId),
      };
    })
    .filter((row): row is AdminProductRecord => Boolean(row));
}

function upsertMemory<T extends { id: string }>(items: T[], next: T): T[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) return [next, ...items];
  return items.map((item) => (item.id === next.id ? next : item));
}

export async function listAdminProducts(): Promise<AdminProductRecord[]> {
  if (!process.env.MONGODB_URI) {
    return combineRows(memoryState.products, memoryState.variants, memoryState.inventoryItems);
  }
  const db = await getDb();
  await ensureIndexes(db);
  const [productList, variantList, inventoryList] = await Promise.all([
    db.collection<Product>("products").find({}).sort({ updatedAt: -1 }).toArray(),
    db.collection<ProductVariant>("productVariants").find({}).toArray(),
    db.collection<InventoryItem>("inventoryItems").find({}).toArray(),
  ]);
  return combineRows(productList, variantList, inventoryList);
}

export async function saveAdminProduct(input: AdminProductInput): Promise<AdminProductRecord> {
  const current = input.id
    ? (await listAdminProducts()).find((row) => row.product.id === input.id)
    : undefined;
  const row = buildDocuments(input, current);

  if (!process.env.MONGODB_URI) {
    memoryState.products = upsertMemory(memoryState.products, row.product);
    memoryState.variants = upsertMemory(memoryState.variants, row.variant);
    memoryState.inventoryItems = upsertMemory(memoryState.inventoryItems, row.inventory);
    return row;
  }

  const db = await getDb();
  await ensureIndexes(db);
  await Promise.all([
    db
      .collection<Product>("products")
      .updateOne({ id: row.product.id }, { $set: row.product }, { upsert: true }),
    db
      .collection<ProductVariant>("productVariants")
      .updateOne({ id: row.variant.id }, { $set: row.variant }, { upsert: true }),
    db
      .collection<InventoryItem>("inventoryItems")
      .updateOne({ id: row.inventory.id }, { $set: row.inventory }, { upsert: true }),
  ]);
  return row;
}
