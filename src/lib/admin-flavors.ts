import { createHash } from "node:crypto";
import { ensureIndexes, getDb, hasUsableMongoUri } from "@ufo/database";
import { productFlavorCatalog } from "@ufo/domain";
import type { ProductFlavor } from "@ufo/types";

const memoryFlavors: ProductFlavor[] = [...productFlavorCatalog];

function withoutMongoId<T extends { id: string }>(item: T): T {
  const { _id: _ignored, ...plainItem } = item as T & { _id?: unknown };
  return plainItem as T;
}

function normalizeSlug(value: string): string {
  const normalized = value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const latin = normalized.match(/[a-z0-9]+/g)?.join("-") ?? "";
  const fallback = createHash("sha1")
    .update(normalized || "flavor")
    .digest("hex")
    .slice(0, 12);
  return (latin || `flavor-${fallback}`).replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function upsertFlavor(flavors: ProductFlavor[], flavor: ProductFlavor): ProductFlavor[] {
  const index = flavors.findIndex((item) => item.id === flavor.id);
  if (index === -1) return [...flavors, flavor];
  return flavors.map((item) => (item.id === flavor.id ? flavor : item));
}

export async function listAdminFlavors(): Promise<ProductFlavor[]> {
  if (!hasUsableMongoUri()) return memoryFlavors;

  try {
    const db = await getDb();
    await ensureIndexes(db);
    const mongoFlavors = await db
      .collection<ProductFlavor>("productFlavors")
      .find({})
      .sort({ nameFa: 1 })
      .toArray();
    if (mongoFlavors.length === 0) return memoryFlavors;
    const overrides = mongoFlavors.map(withoutMongoId);
    const overrideIds = new Set(overrides.map((item) => item.id));
    return [...overrides, ...productFlavorCatalog.filter((item) => !overrideIds.has(item.id))];
  } catch (error) {
    console.error("Admin flavors read failed; using bundled catalog fallback", error);
    return memoryFlavors;
  }
}

export async function saveAdminFlavor(input: {
  nameFa: string;
  nameEn?: string;
  slug?: string;
  iconKey?: string;
}): Promise<ProductFlavor> {
  const nameFa = input.nameFa.trim();
  if (!nameFa) throw new Error("نام فارسی طعم الزامی است.");

  const slug = normalizeSlug(input.slug || input.nameEn || nameFa);
  const flavor: ProductFlavor = {
    id: slug,
    slug,
    nameFa,
    ...(input.nameEn?.trim() ? { nameEn: input.nameEn.trim() } : {}),
    ...(input.iconKey?.trim() ? { iconKey: input.iconKey.trim() } : {}),
  };

  if (!hasUsableMongoUri()) {
    const next = upsertFlavor(memoryFlavors, flavor);
    memoryFlavors.splice(0, memoryFlavors.length, ...next);
    return flavor;
  }

  const db = await getDb();
  await ensureIndexes(db);
  await db
    .collection<ProductFlavor>("productFlavors")
    .updateOne({ id: flavor.id }, { $set: flavor }, { upsert: true });
  return flavor;
}
