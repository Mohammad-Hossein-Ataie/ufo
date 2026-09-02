import { createHash } from "node:crypto";
import { ensureIndexes, getDb, hasUsableMongoUri } from "@ufo/database";
import { productColorPalette, type ProductColorOption } from "@ufo/domain";

const memoryColors: ProductColorOption[] = [...productColorPalette];

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
    .update(normalized || "color")
    .digest("hex")
    .slice(0, 12);
  return (latin || `color-${fallback}`).replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  const shortHex = trimmed.match(/^#?([0-9a-f]{3})$/i)?.[1];
  if (shortHex) {
    return `#${shortHex
      .split("")
      .map((item) => item + item)
      .join("")
      .toUpperCase()}`;
  }
  const longHex = trimmed.match(/^#?([0-9a-f]{6})$/i)?.[1];
  if (!longHex) throw new Error("کد رنگ معتبر نیست.");
  return `#${longHex.toUpperCase()}`;
}

function upsertColor(colors: ProductColorOption[], color: ProductColorOption): ProductColorOption[] {
  const index = colors.findIndex((item) => item.id === color.id);
  if (index === -1) return [...colors, color];
  return colors.map((item) => (item.id === color.id ? color : item));
}

export async function listAdminColors(): Promise<ProductColorOption[]> {
  if (!hasUsableMongoUri()) return memoryColors;

  try {
    const db = await getDb();
    await ensureIndexes(db);
    const mongoColors = await db
      .collection<ProductColorOption>("productColors")
      .find({})
      .sort({ labelFa: 1 })
      .toArray();
    if (mongoColors.length === 0) return memoryColors;
    const overrides = mongoColors.map(withoutMongoId);
    const overrideIds = new Set(overrides.map((item) => item.id));
    return [...overrides, ...productColorPalette.filter((item) => !overrideIds.has(item.id))];
  } catch (error) {
    console.error("Admin colors read failed; using bundled palette fallback", error);
    return memoryColors;
  }
}

export async function saveAdminColor(input: {
  labelFa: string;
  id?: string;
  hex: string;
}): Promise<ProductColorOption> {
  const labelFa = input.labelFa.trim();
  if (!labelFa) throw new Error("نام فارسی رنگ الزامی است.");

  const color: ProductColorOption = {
    id: normalizeSlug(input.id || labelFa),
    labelFa,
    hex: normalizeHex(input.hex),
  };

  if (!hasUsableMongoUri()) {
    const next = upsertColor(memoryColors, color);
    memoryColors.splice(0, memoryColors.length, ...next);
    return color;
  }

  const db = await getDb();
  await ensureIndexes(db);
  await db
    .collection<ProductColorOption>("productColors")
    .updateOne({ id: color.id }, { $set: color }, { upsert: true });
  return color;
}
