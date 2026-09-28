import { createHash } from "node:crypto";
import { getDb, hasUsableMongoUri } from "@ufo/database";
import { brands as bundledBrands } from "@ufo/domain";
import type { Brand } from "@ufo/types";

const memoryBrands: Brand[] = [...bundledBrands];

function slugify(value: string) {
  const latin = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]+/g)
    ?.join("-");
  return latin || `brand-${createHash("sha1").update(value.trim()).digest("hex").slice(0, 12)}`;
}

export async function listAdminBrands(): Promise<Brand[]> {
  if (!hasUsableMongoUri()) return [...memoryBrands];
  const db = await getDb();
  const saved = await db.collection<Brand>("productBrands").find({}).sort({ nameFa: 1 }).toArray();
  const overrides = saved.map(({ _id: _ignored, ...brand }) => brand as Brand);
  const ids = new Set(overrides.map((brand) => brand.id));
  return [...overrides, ...bundledBrands.filter((brand) => !ids.has(brand.id))];
}

export async function saveAdminBrand(input: { nameFa: string; slug?: string }): Promise<Brand> {
  const nameFa = input.nameFa.trim();
  if (!nameFa || nameFa.length > 100) throw new Error("نام برند باید بین ۱ تا ۱۰۰ نویسه باشد.");
  const slug = slugify(input.slug?.trim() || nameFa);
  if (slug.length > 100) throw new Error("شناسه برند بیش از حد طولانی است.");
  const existing = await listAdminBrands();
  if (
    existing.some(
      (brand) =>
        brand.slug === slug ||
        brand.nameFa.toLocaleLowerCase("fa") === nameFa.toLocaleLowerCase("fa"),
    )
  ) {
    throw new Error("این برند قبلاً ثبت شده است.");
  }
  const brand: Brand = { id: `brand-${slug}`, nameFa, slug };
  if (!hasUsableMongoUri()) {
    memoryBrands.push(brand);
    return brand;
  }
  const db = await getDb();
  const collection = db.collection<Brand>("productBrands");
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.insertOne(brand);
  return brand;
}

export async function updateAdminBrandLogo(brandId: string, logoUrl: string): Promise<Brand> {
  const brand = (await listAdminBrands()).find((item) => item.id === brandId);
  if (!brand) throw new Error("برند پیدا نشد.");
  if (
    !/^\/api\/brand-images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      logoUrl,
    )
  ) {
    throw new Error("آدرس تصویر برند معتبر نیست.");
  }
  const updated = { ...brand, logoUrl };
  if (!hasUsableMongoUri()) {
    const index = memoryBrands.findIndex((item) => item.id === brandId);
    memoryBrands[index] = updated;
    return updated;
  }
  const db = await getDb();
  await db
    .collection<Brand>("productBrands")
    .updateOne({ id: brandId }, { $set: updated }, { upsert: true });
  return updated;
}
