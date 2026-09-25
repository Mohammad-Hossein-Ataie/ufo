import { createHash } from "node:crypto";
import { ensureIndexes, getDb, hasUsableMongoUri } from "@ufo/database";
import { brands as bundledBrands } from "@ufo/domain";
import type { Brand } from "@ufo/types";

const memoryBrands: Brand[] = [...bundledBrands];

function slugify(value: string) {
  const latin = value.trim().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g)?.join("-");
  return latin || `brand-${createHash("sha1").update(value.trim()).digest("hex").slice(0, 12)}`;
}

export async function listAdminBrands(): Promise<Brand[]> {
  if (!hasUsableMongoUri()) return [...memoryBrands];
  const db = await getDb();
  await ensureIndexes(db);
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
  if (existing.some((brand) => brand.slug === slug || brand.nameFa.toLocaleLowerCase("fa") === nameFa.toLocaleLowerCase("fa"))) {
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
