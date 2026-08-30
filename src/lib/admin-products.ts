import { ensureIndexes, getDb, hasUsableMongoUri } from "@ufo/database";
import {
  brands,
  categories,
  getDefaultProductVariantType,
  inventoryItems,
  productColorAttributeTechnicalValue,
  productColorPalette,
  productFlavorAttributeTechnicalValue,
  productFlavorCatalog,
  products,
  variants,
} from "@ufo/domain";
import type {
  InventoryItem,
  Product,
  ProductKind,
  ProductSpec,
  ProductVariant,
  ProductVariantType,
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
  images?: string[] | undefined;
  variantType?: ProductVariantType | undefined;
  variantValueIds?: string[] | undefined;
  variantImages?: Record<string, string> | undefined;
  colorImages?: Record<string, string> | undefined;
  tags?: string[] | undefined;
  specs?: ProductSpec[] | undefined;
  colorIds?: string[] | undefined;
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

function uniqueIds(ids: string[] | undefined): string[] {
  return [...new Set((ids ?? []).map((item) => item.trim()).filter(Boolean))];
}

function getCurrentVariantValueIds(product: Product | undefined, variantType: ProductVariantType) {
  if (!product || variantType === "none") return [];
  if (product.variantType === variantType && product.variantValueIds?.length) {
    return product.variantValueIds;
  }
  const technicalValue =
    variantType === "color"
      ? productColorAttributeTechnicalValue
      : productFlavorAttributeTechnicalValue;
  return (
    product.attributes
      .find((attribute) => attribute.technicalValue === technicalValue)
      ?.valueFa.split(",") ?? []
  );
}

function variantAttribute(variantType: ProductVariantType, valueIds: string[]) {
  if (variantType === "color" && valueIds.length > 0) {
    return {
      nameFa: "Ø±Ù†Ú¯â€ŒÙ‡Ø§ÛŒ Ù‚Ø§Ø¨Ù„ Ø³ÙØ§Ø±Ø´",
      valueFa: valueIds.join(","),
      technicalValue: productColorAttributeTechnicalValue,
    };
  }
  if (variantType === "flavor" && valueIds.length > 0) {
    return {
      nameFa: "Ø·Ø¹Ù…â€ŒÙ‡Ø§ÛŒ Ù‚Ø§Ø¨Ù„ Ø³ÙØ§Ø±Ø´",
      valueFa: valueIds.join(","),
      technicalValue: productFlavorAttributeTechnicalValue,
    };
  }
  return undefined;
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
  const images = [
    image,
    ...(input.images ?? current?.product.images ?? []).map((item) => item.trim()).filter(Boolean),
  ].filter((item, index, list) => list.indexOf(item) === index);
  const tags = input.tags?.filter(Boolean) ?? current?.product.tags ?? [];
  const variantType =
    input.variantType ??
    current?.product.variantType ??
    getDefaultProductVariantType({ categoryId: input.categoryId, productKind: input.productKind });
  const allowedVariantIds =
    variantType === "color"
      ? productColorPalette.map((color) => color.id)
      : variantType === "flavor"
        ? productFlavorCatalog.map((flavor) => flavor.id)
        : [];
  const rawVariantValueIds =
    input.variantValueIds ??
    (variantType === "color" ? input.colorIds : undefined) ??
    getCurrentVariantValueIds(current?.product, variantType);
  const variantValueIds = uniqueIds(rawVariantValueIds).filter((item) =>
    allowedVariantIds.includes(item),
  );
  const retailPriceRial = input.retailPriceRial;
  const wholesalePriceRial =
    input.wholesalePriceRial ?? current?.variant.wholesalePriceRial ?? retailPriceRial;
  const salesChannels: SalesChannel[] =
    input.salesChannels.length > 0 ? input.salesChannels : ["retail"];
  const wholesaleEnabled = input.wholesaleEnabled ?? salesChannels.includes("wholesale");
  const rawVariantImages =
    input.variantImages ??
    input.colorImages ??
    current?.product.variantImages ??
    current?.product.colorImages ??
    {};
  const variantImages = Object.fromEntries(
    Object.entries(rawVariantImages)
      .map(([valueId, imageValue]) => [valueId.trim(), imageValue.trim()] as const)
      .filter(
        ([valueId, imageValue]) =>
          valueId &&
          imageValue &&
          variantValueIds.includes(valueId) &&
          (images.includes(imageValue) || /^https?:\/\//i.test(imageValue)),
      ),
  );
  const optionAttribute = variantAttribute(variantType, variantValueIds);

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
    images,
    variantType,
    ...(variantValueIds.length > 0 ? { variantValueIds } : {}),
    ...(Object.keys(variantImages).length > 0 ? { variantImages } : {}),
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
      ...(optionAttribute ? [optionAttribute] : []),
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

function withoutMongoId<T extends { id: string }>(item: T): T {
  const { _id: _ignored, ...plainItem } = item as T & { _id?: unknown };
  return plainItem as T;
}

function upsertMemory<T extends { id: string }>(items: T[], next: T): T[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) return [next, ...items];
  return items.map((item) => (item.id === next.id ? next : item));
}

export function mergeCatalogRecords<T extends { id: string }>(
  baseItems: T[],
  overrideItems: T[],
): T[] {
  const overrideIds = new Set(overrideItems.map((item) => item.id));
  return [...overrideItems, ...baseItems.filter((item) => !overrideIds.has(item.id))];
}

export async function listAdminProducts(): Promise<AdminProductRecord[]> {
  if (!hasUsableMongoUri()) {
    return combineRows(memoryState.products, memoryState.variants, memoryState.inventoryItems);
  }
  let productList: Product[];
  let variantList: ProductVariant[];
  let inventoryList: InventoryItem[];

  try {
    const db = await getDb();
    await ensureIndexes(db);
    const [mongoProducts, mongoVariants, mongoInventoryItems] = await Promise.all([
      db.collection<Product>("products").find({}).sort({ updatedAt: -1 }).toArray(),
      db.collection<ProductVariant>("productVariants").find({}).toArray(),
      db.collection<InventoryItem>("inventoryItems").find({}).toArray(),
    ]);
    productList = mongoProducts.map(withoutMongoId);
    variantList = mongoVariants.map(withoutMongoId);
    inventoryList = mongoInventoryItems.map(withoutMongoId);
  } catch (error) {
    console.error("Admin products read failed; using bundled catalog fallback", error);
    return combineRows(memoryState.products, memoryState.variants, memoryState.inventoryItems);
  }

  if (productList.length === 0 && variantList.length === 0 && inventoryList.length === 0) {
    return combineRows(memoryState.products, memoryState.variants, memoryState.inventoryItems);
  }

  return combineRows(
    mergeCatalogRecords(products, productList),
    mergeCatalogRecords(variants, variantList),
    mergeCatalogRecords(inventoryItems, inventoryList),
  );
}

export async function saveAdminProduct(input: AdminProductInput): Promise<AdminProductRecord> {
  const current = input.id
    ? (await listAdminProducts()).find((row) => row.product.id === input.id)
    : undefined;
  const row = buildDocuments(input, current);

  if (!hasUsableMongoUri()) {
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
