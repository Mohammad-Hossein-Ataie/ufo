import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const attachmentPath = process.argv[2];
if (!attachmentPath) {
  throw new Error("Usage: node scripts/add-device-and-parts-products.mjs <pasted-text.txt>");
}

const outputPath = resolve("packages/domain/src/imported-products.ts");
const importedAt = "2026-08-09T00:00:00.000Z";
const defaultImage = "/images/ufo-hero.png";

const directDeviceRows = [
  ["پاد سیستم ویپرسو ارمور جی", "VAPORESSO ARMOUR G", "VAPORESSO", 8_700_000],
  ["پاد ماد ویپرسو لوکس XR مکس", "VAPORESSO LUXE XR MAX POD SYSTEM", "VAPORESSO", 7_400_000],
  ["پاد ماد ویپرسو لوکس ایکس آر", "VAPORESSO LUXE XR", "VAPORESSO", 5_500_000],
  ["ویپ ویپرسو آرمور اس", "Vaporesso Armour S", "VAPORESSO", 13_800_000],
  ["ویپ ویپرسو لوکس ایکس ۲", "Vaporesso Luxe X2", "VAPORESSO", 5_550_000],
  ["ویپ ویپرسو لوکس ایکس 3", "VAPORESSO LUXE X3", "VAPORESSO", 6_800_000],
  ["پاد ماد اسموک نورد ۵۰ وات", "SMOK Nord 50W Pod Mod", "SMOK", 3_799_000],
  [
    "پاد ماد ایجیس بوست گیک ویپ بی 60",
    "GEEKVAPE B60 AEGIS BOOST 2 POD SYSTEM",
    "GEEKVAPE",
    6_490_000,
  ],
  ["ویپ اس 100 گیک ویپ", "GEEKVAPE S100 VAPE", "GEEKVAPE", 7_050_000],
  ["ویپ ای ۱۰۰ گیک ویپ", "Geekvape E100 Kit", "GEEKVAPE", 6_450_000],
  ["ویپ ایجیس لجند ۳ گیک ویپ", "Geekvape Aegis Legend 3 Kit", "GEEKVAPE", 10_400_000],
  ["ویپ گیک ویپ ام 100", "geekvape m100", "GEEKVAPE", 7_550_000],
  ["ویپ گیک ویپ ایجیس سولو 3", "Geekvape Aegis SOLO 3", "GEEKVAPE", 7_850_000],
  ["ویپ گیک ویپ تی۲۰۰", "GEEKVAPE T200 (AEGIS TOUCH)", "GEEKVAPE", 17_600_000],
  ["ویپ گیک ویپ دیجی فلیور", "Geekvape Digiflavor XP 77W", "GEEKVAPE", 3_790_000],
  ["ویپ تلما اوربان 80 لاست ویپ", "lost vape thelema urban 80", "LOST VAPE", 4_690_000],
  ["ویپ ووپو آرگاس جی تی ۲", "Voopoo Argus Gt2 Vape", "VOOPOO", 12_200_000],
];

const brandCatalog = {
  VAPORESSO: { id: "brand-vaporesso", slug: "vaporesso", nameFa: "Vaporesso" },
  SMOK: { id: "brand-smok", slug: "smok", nameFa: "SMOK" },
  GEEKVAPE: { id: "brand-geekvape", slug: "geekvape", nameFa: "GeekVape" },
  "LOST VAPE": { id: "brand-lostvape", slug: "lostvape", nameFa: "Lost Vape" },
  VOOPOO: { id: "brand-voopoo", slug: "voopoo", nameFa: "VOOPOO" },
  ASPIRE: { id: "brand-aspire", slug: "aspire", nameFa: "Aspire" },
  UWELL: { id: "brand-uwell", slug: "uwell", nameFa: "Uwell" },
};

function normalizeDigits(value) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    if (persian >= 0) return String(persian);
    const arabic = "٠١٢٣٤٥٦٧٨٩".indexOf(digit);
    return arabic >= 0 ? String(arabic) : digit;
  });
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

function slugify(value) {
  const normalized = normalizeDigits(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const latin = normalized.match(/[a-z0-9]+/g)?.join("-") ?? "";
  const fallback = Buffer.from(normalized || "product")
    .toString("hex")
    .slice(0, 18);
  return (latin || `item-${fallback}`).replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function literal(value, indent = 2) {
  return JSON.stringify(value, null, 2)
    .replace(/\n/g, `\n${" ".repeat(indent)}`)
    .replace(/"([^"]+)":/g, "$1:");
}

function existingSet(source, pattern) {
  return new Set([...source.matchAll(pattern)].map((match) => match[1]));
}

function unique(base, seen) {
  let candidate = base;
  let suffix = 2;
  while (seen.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  seen.add(candidate);
  return candidate;
}

function inferBrand(nameFa, nameEn, explicitBrand) {
  if (explicitBrand && brandCatalog[explicitBrand]) return brandCatalog[explicitBrand];
  const text = `${nameFa} ${nameEn}`.toLowerCase();
  if (text.includes("vaporesso") || text.includes("ویپرسو")) return brandCatalog.VAPORESSO;
  if (text.includes("smok") || text.includes("اسموک")) return brandCatalog.SMOK;
  if (text.includes("geekvape") || text.includes("geek vape") || text.includes("گیک ویپ"))
    return brandCatalog.GEEKVAPE;
  if (text.includes("lost vape") || text.includes("لاست ویپ")) return brandCatalog["LOST VAPE"];
  if (text.includes("voopoo") || text.includes("ووپو")) return brandCatalog.VOOPOO;
  if (text.includes("aspire") || text.includes("اسپایر")) return brandCatalog.ASPIRE;
  if (text.includes("uwell") || text.includes("یوول")) return brandCatalog.UWELL;
  return { id: "brand-ufo", slug: "ufo-selection", nameFa: "UFO Selection" };
}

function inferKind(typeText, nameFa, nameEn) {
  const text = `${typeText} ${nameFa} ${nameEn}`.toLowerCase();
  if (text.includes("کویل") || text.includes("coil")) {
    return { categoryId: "cat-coil", productKind: "coil", typeFa: "کویل" };
  }
  if (text.includes("کارتریج") || text.includes("cartridge") || text.includes("pod cartridge")) {
    return { categoryId: "cat-cartridge", productKind: "cartridge", typeFa: "کارتریج" };
  }
  if (text.includes("پاد") && !text.includes("پاد تانک")) {
    return { categoryId: "cat-pod", productKind: "pod-device", typeFa: "پاد سیستم" };
  }
  if (text.includes("ویپ") || text.includes("vape")) {
    return { categoryId: "cat-vape", productKind: "vape-device", typeFa: "ویپ" };
  }
  return { categoryId: "cat-lighter", productKind: "accessory", typeFa: "اکسسوری" };
}

function parseSpecs(body) {
  const specsBlock = body.split(/مشخصات:/)[1]?.split(/سازگار با دستگاه‌ها:/)[0] ?? "";
  return specsBlock
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^-\s*/, ""))
    .filter((line) => line.includes(":"))
    .slice(0, 8)
    .map((line) => {
      const [labelFa, ...rest] = line.split(":");
      return { labelFa: labelFa.trim(), valueFa: rest.join(":").trim() || "-" };
    });
}

function parseHighlights(body) {
  const block = body.split(/ویژگی‌های اصلی:/)[1]?.split(/نقاط قوت:/)[0] ?? "";
  return block
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^-\s*/, ""))
    .filter(Boolean)
    .slice(0, 6);
}

function parseAttachmentRows(text) {
  const headingPattern = /^(\d+)\.\s+(.+?)\s*\|\s*(.+)$/gm;
  const headings = [...text.matchAll(headingPattern)];
  return headings.map((match, index) => {
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = headings[index + 1]?.index ?? text.length;
    const body = text.slice(bodyStart, bodyEnd).trim();
    const typeText = body.match(/نوع محصول:\s*([\s\S]*?)(?:\r?\n\r?\n|مشخصات:)/)?.[1]?.trim() ?? "";
    return {
      nameFa: match[2].trim(),
      nameEn: match[3].trim(),
      typeText,
      body,
      source: "لیست تکمیلی کویل، کارتریج و قطعات",
    };
  });
}

function createProduct(row, index, seen) {
  const brand = inferBrand(row.nameFa, row.nameEn, row.brand);
  const inferred = row.inferred ?? inferKind(row.typeText, row.nameFa, row.nameEn);
  const slug = unique(slugify(row.nameEn || row.nameFa), seen.slugs);
  const productId = unique(`prod-extra-${slug}`, seen.productIds);
  const variantId = unique(`var-extra-${slug}-std`, seen.variantIds);
  const retailPriceRial = row.priceToman ? row.priceToman * 10 : 0;
  const active = retailPriceRial > 0;
  const shortDescriptionFa = active
    ? `${row.nameFa} (${row.nameEn}) با قیمت ثبت‌شده در لیست جدید یوفوپاف.`
    : `${row.nameFa} (${row.nameEn}) از لیست تکمیلی قطعات و دستگاه‌ها؛ قیمت از پنل ادمین تکمیل شود.`;
  const cartonSize =
    inferred.productKind === "vape-device" || inferred.productKind === "pod-device" ? 6 : 10;
  const product = {
    id: productId,
    slug,
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    brandId: brand.id,
    categoryId: inferred.categoryId,
    productKind: inferred.productKind,
    salesChannels: active ? ["retail", "wholesale"] : ["retail"],
    shortDescriptionFa,
    descriptionFa: row.body || `${row.nameFa} (${row.nameEn}) به کاتالوگ یوفوپاف اضافه شد.`,
    image: defaultImage,
    images: [defaultImage],
    tags: [inferred.typeFa, brand.nameFa, row.nameEn, "یوفوپاف"].filter(Boolean),
    attributes: [
      { nameFa: "نوع", valueFa: inferred.typeFa },
      { nameFa: "برند", valueFa: brand.nameFa },
      { nameFa: "نام لاتین", valueFa: row.nameEn, technicalValue: row.nameEn },
    ],
    specs: row.specs ?? parseSpecs(row.body ?? ""),
    highlightsFa: row.highlightsFa ?? parseHighlights(row.body ?? ""),
    sourceNoteFa: row.source ?? "لیست قیمت دستگاه‌ها و قطعات ۱۴۰۵",
    ...(active
      ? {}
      : { adminNotesFa: "قیمت این محصول هنوز ثبت نشده و قبل از فعال‌سازی باید تکمیل شود." }),
    isActive: active,
    isAgeRestricted: true,
    seoTitle: `${row.nameFa} | یوفوپاف UFO Puff`,
    seoDescription: shortDescriptionFa,
    createdAt: importedAt,
    updatedAt: importedAt,
  };
  const variant = {
    id: variantId,
    productId,
    nameFa: "استاندارد",
    sku: `UFO-EXTRA-${String(index + 1).padStart(4, "0")}`,
    retailPriceRial,
    wholesalePriceRial: active ? Math.round((retailPriceRial * 0.9) / 10_000) * 10_000 : 0,
    ...(active
      ? { compareAtPriceRial: Math.round((retailPriceRial * 1.05) / 10_000) * 10_000 }
      : {}),
    cartonSize,
    minWholesaleCartonCount:
      inferred.productKind === "vape-device" || inferred.productKind === "pod-device" ? 1 : 2,
    wholesaleEnabled: active,
    attributes: [{ nameFa: "مدل", valueFa: "استاندارد" }],
    isActive: active,
  };
  const inventory = {
    id: `inv-extra-${slug}`,
    variantId,
    onHand: active ? 12 : 0,
    reserved: 0,
    preorderEnabled: true,
    restockThreshold: active ? 3 : 1,
    updatedAt: importedAt,
  };
  return { brand, product, variant, inventory };
}

function appendToArray(source, exportName, entries) {
  if (entries.length === 0) return source;
  const start = source.indexOf(`export const ${exportName}`);
  if (start < 0) throw new Error(`Export not found: ${exportName}`);
  const end = source.indexOf("\n];", start);
  if (end < 0) throw new Error(`Array end not found: ${exportName}`);
  const prefix = source.slice(0, end);
  const suffix = source.slice(end);
  const needsComma = !prefix.trimEnd().endsWith("[");
  const block = `${needsComma ? "," : ""}\n${entries.map((entry) => `  ${literal(entry, 2)}`).join(",\n")}`;
  return `${prefix}${block}${suffix}`;
}

let source = readFileSync(outputPath, "utf8");
const attachmentText = readFileSync(resolve(attachmentPath), "utf8");
const seen = {
  brandIds: existingSet(source, /id: "([^"]+)"/g),
  productIds: existingSet(source, /id: "(prod-[^"]+)"/g),
  variantIds: existingSet(source, /id: "(var-[^"]+)"/g),
  slugs: existingSet(source, /slug: "([^"]+)"/g),
};

const directRows = directDeviceRows.map(([nameFa, nameEn, brand, priceToman]) => ({
  nameFa,
  nameEn,
  brand,
  priceToman,
  inferred: { categoryId: "cat-vape", productKind: "vape-device", typeFa: "ویپ" },
  source: "لیست قیمت دستگاه‌ها به تفکیک برند",
  body: `${nameFa} | ${nameEn}\n\nنوع محصول:\nویپ\n\nقیمت:\n${toPersianDigits(priceToman.toLocaleString("fa-IR"))} تومان`,
}));

const attachmentRows = parseAttachmentRows(attachmentText);
const candidateRows = [...directRows, ...attachmentRows];
const added = { brands: [], products: [], variants: [], inventoryItems: [] };
const seenProductSlugsBefore = new Set(seen.slugs);
const processedCandidateSlugs = new Set();

candidateRows.forEach((row, index) => {
  const baseSlug = slugify(row.nameEn || row.nameFa);
  if (seenProductSlugsBefore.has(baseSlug) || processedCandidateSlugs.has(baseSlug)) return;
  processedCandidateSlugs.add(baseSlug);
  const created = createProduct(row, index, seen);
  if (!seen.brandIds.has(created.brand.id) && created.brand.id !== "brand-ufo") {
    seen.brandIds.add(created.brand.id);
    added.brands.push(created.brand);
  }
  added.products.push(created.product);
  added.variants.push(created.variant);
  added.inventoryItems.push(created.inventory);
});

source = appendToArray(source, "importedBrands", added.brands);
source = appendToArray(source, "importedProducts", added.products);
source = appendToArray(source, "importedVariants", added.variants);
source = appendToArray(source, "importedInventoryItems", added.inventoryItems);

writeFileSync(outputPath, source, "utf8");
console.log(
  `Added ${added.products.length} products, ${added.variants.length} variants, ${added.inventoryItems.length} inventory rows, ${added.brands.length} brands.`,
);
