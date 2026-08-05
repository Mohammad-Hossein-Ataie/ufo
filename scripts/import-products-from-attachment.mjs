import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const attachmentPath = process.argv[2];

if (!attachmentPath) {
  throw new Error("Usage: node scripts/import-products-from-attachment.mjs <pasted-text.txt>");
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");
const outputPath = resolve(workspaceRoot, "packages/domain/src/imported-products.ts");
const importedAt = "2026-08-02T00:00:00.000Z";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

function slugify(value) {
  const normalized = normalizeDigits(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const latin = normalized.match(/[a-z0-9]+/g)?.join("-") ?? "";
  const fallback = Buffer.from(normalized).toString("hex").slice(0, 18);
  return (latin || `item-${fallback}`).replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function extractPuffCount(name) {
  const normalized = normalizeDigits(name).replace(/,/g, "");
  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch?.[1]) return Math.round(Number(kMatch[1]) * 1000);
  const numberMatch = normalized.match(/(?:^|\s)(\d{3,6})(?:\s|$)/);
  return numberMatch?.[1] ? Number(numberMatch[1]) : undefined;
}

function uniqueId(base, seen) {
  let candidate = base;
  let suffix = 2;
  while (seen.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  seen.add(candidate);
  return candidate;
}

function splitName(name) {
  const latin = name.match(/[a-zA-Z][a-zA-Z0-9\s.-]*/g)?.join(" ").replace(/\s+/g, " ").trim();
  const fa = name.replace(/[a-zA-Z][a-zA-Z0-9\s.-]*/g, "").replace(/\s+/g, " ").trim();
  return {
    fa: fa || name,
    latin: latin || undefined
  };
}

function inferBrand(name) {
  const latin = name.toLowerCase();
  const candidates = [
    "vozol",
    "smok",
    "waka",
    "nasty",
    "ivg",
    "primobar",
    "geekbar",
    "bugatti",
    "vishbar",
    "nemo",
    "maxgo",
    "hitli",
    "yella",
    "aook",
    "uwell",
    "kado",
    "moti",
    "sorin",
    "oxva",
    "aspire",
    "vaporesso",
    "lostvape",
    "geek vape",
    "geekvape",
    "elfbar",
    "kent",
    "flum",
    "monster",
    "voopoo"
  ];
  return candidates.find((candidate) => latin.includes(candidate)) ?? "ufo-import";
}

function retailPrice(category, puffCount) {
  if (category === "pod") return 14_800_000;
  const effectivePuff = Math.min(Math.max(puffCount ?? 6_000, 600), 100_000);
  return 2_200_000 + Math.round(effectivePuff * 185);
}

function cartonSize(category, puffCount) {
  if (category === "pod") return 6;
  if ((puffCount ?? 0) >= 40_000) return 10;
  return 20;
}

const text = readFileSync(resolve(attachmentPath), "utf8")
  .replace(/^\[.*?\]\s*[^:]+:\s*/gm, "")
  .replace(/\r/g, "");

const lines = text
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const parsed = [];
let category = "disposable";

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  if (line.includes("یکبارمصرف")) {
    category = "disposable";
    continue;
  }
  if (line.includes("دائمی ها") || line.includes("(پاد)")) {
    category = "pod";
    continue;
  }

  if (category === "disposable") {
    const hasProductSignal = /[a-zA-Z\d۰-۹٠-٩]/.test(line);
    if (!hasProductSignal || line.includes("/")) continue;
    const nextLine = lines[index + 1] ?? "";
    const flavors = nextLine.includes("/")
      ? nextLine
          .split("/")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    if (flavors.length > 0) index += 1;
    parsed.push({ category, name: line, flavors: flavors.length > 0 ? flavors : ["استاندارد"] });
    continue;
  }

  if (!line.includes("/")) {
    parsed.push({ category, name: line, flavors: ["استاندارد"] });
  }
}

const seenIds = new Set();
const seenSlugs = new Set();
const products = [];
const variants = [];
const inventoryItems = [];

parsed.forEach((item, productIndex) => {
  const puffCount = extractPuffCount(item.name);
  const slug = uniqueId(slugify(item.name), seenSlugs);
  const productId = uniqueId(`prod-import-${slug}`, seenIds);
  const { fa, latin } = splitName(item.name);
  const categoryId = item.category === "pod" ? "cat-pod" : "cat-disposable";
  const brand = inferBrand(item.name);
  const puffLabel = puffCount ? `${toPersianDigits(puffCount)} پاف` : "مدل پاد";
  const shortDescriptionFa =
    item.category === "pod"
      ? `${fa} از لیست وارداتی UFO Puff با قیمت پایه و موجودی قابل کنترل.`
      : `${fa} با ${toPersianDigits(item.flavors.length)} طعم ثبت‌شده و ظرفیت ${puffLabel}.`;

  products.push({
    id: productId,
    slug,
    nameFa: fa,
    brandId: "brand-ufo",
    categoryId,
    shortDescriptionFa,
    descriptionFa:
      item.category === "pod"
        ? `${item.name} در کاتالوگ پادهای دائمی ثبت شده و قیمت/موجودی آن از پنل ادمین قابل به‌روزرسانی است.`
        : `${item.name} از لیست محصول‌های یکبارمصرف وارد شد. طعم‌های فعال به عنوان واریانت جداگانه قابل انتخاب هستند.`,
    image: "/images/ufo-hero.png",
    images: ["/images/ufo-hero.png"],
    tags: [
      item.category === "pod" ? "پاد دائمی" : "یکبارمصرف",
      brand,
      ...(puffCount ? [`${puffCount}`, `${toPersianDigits(puffCount)} پاف`] : [])
    ],
    attributes: [
      { nameFa: "نوع", valueFa: item.category === "pod" ? "پاد دائمی" : "یکبارمصرف" },
      ...(puffCount ? [{ nameFa: "پاف", valueFa: toPersianDigits(puffCount), technicalValue: String(puffCount) }] : []),
      ...(latin ? [{ nameFa: "نام لاتین", valueFa: latin, technicalValue: latin }] : [])
    ],
    isActive: true,
    isAgeRestricted: true,
    seoTitle: `${fa} | UFO Puff`,
    seoDescription: shortDescriptionFa,
    createdAt: importedAt,
    updatedAt: importedAt
  });

  item.flavors.forEach((flavor, flavorIndex) => {
    const variantBase = slugify(`${slug}-${flavor}`);
    const variantId = uniqueId(`var-import-${variantBase}`, seenIds);
    const price = retailPrice(item.category, puffCount);
    const quantityPerCarton = cartonSize(item.category, puffCount);
    variants.push({
      id: variantId,
      productId,
      nameFa: flavor,
      sku: `UFO-${item.category === "pod" ? "POD" : "DSP"}-${String(productIndex + 1).padStart(3, "0")}-${String(
        flavorIndex + 1
      ).padStart(2, "0")}`,
      retailPriceRial: price,
      wholesalePriceRial: Math.round(price * 0.84),
      compareAtPriceRial: Math.round(price * 1.08),
      cartonSize: quantityPerCarton,
      minWholesaleCartonCount: item.category === "pod" ? 1 : 2,
      attributes: [
        { nameFa: item.category === "pod" ? "مدل" : "طعم", valueFa: flavor },
        ...(puffCount ? [{ nameFa: "پاف", valueFa: toPersianDigits(puffCount), technicalValue: String(puffCount) }] : [])
      ],
      isActive: true
    });
    inventoryItems.push({
      id: `inv-${variantId.replace(/^var-/, "")}`,
      variantId,
      onHand: item.category === "pod" ? 18 : 120,
      reserved: 0,
      preorderEnabled: true,
      restockThreshold: item.category === "pod" ? 4 : 20,
      updatedAt: importedAt
    });
  });
});

const content = `import type { InventoryItem, Product, ProductVariant } from "@ufo/types";

// Generated from the user supplied product list on 2026-08-02.
export const importedProducts: Product[] = ${JSON.stringify(products, null, 2)};

export const importedVariants: ProductVariant[] = ${JSON.stringify(variants, null, 2)};

export const importedInventoryItems: InventoryItem[] = ${JSON.stringify(inventoryItems, null, 2)};
`;

writeFileSync(outputPath, `${content}\n`, "utf8");
console.log(`Imported ${products.length} products and ${variants.length} variants into ${outputPath}`);
