import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");
const dataRoot = resolve(workspaceRoot, "..", "..", "ufo-data");
const outputPath = resolve(workspaceRoot, "packages/domain/src/imported-products.ts");
const importedAt = "2026-08-05T00:00:00.000Z";
const defaultImage = "/images/ufo-hero.png";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const disposablePriceLines = `
وزول ۱۲ هزار | Vozol 12K | 1.600t
وزول ۱۵ هزار پلاگ | Vozol Vista Plug 15K | 1.800t
وزول ۲۰ هزار استار | Vozol Star 20K | 2.100t
وزول ۴۰ هزار ریوو | Vozol Rave 40K | 2.650t
وزول ۴۰ هزار استار | Vozol Star 40K | 2.750t
وزول ۵۰ هزار گییر پاور | Vozol Gear Power 50K | 2.900t
اسموک ۴۰ هزار اسپیس من | Smok Spaceman 40K | 2.050t
واکا ۶۰۰ پاف | Waka 600 | 290t
نستی ۵۰ هزار | Nasty 50K | 2.450t
نستی ۱۲۰۰ پاف | Nasty 1200 | 390t
آی وی جی ۳ هزار | IVG 3000 | 590t
پریموبار ۳۵۰۰ پاف | Primobar 3500 | 490t
واکا ۶ هزار | Waka 6000 | 690t
گیک‌بار ۱۰ هزار | Geek Bar 10000 | 1.050t
کریس براون ۱۵ هزار | Chris Brown 15000 | 850t
پرایوبار ۱۵ هزار | Priobar 15000 | 1.150t
بوگاتی ۱۷ هزار | Bugatti 17000 | 890t
ویشبار ویکلی ۲۰ هزار | Vishbar Weekly 20000 | 1.500t
نمو مجیک ۳۰ هزار | Nemo Magic 30000 | 1.550t
مکس گو ۲۲ هزار | Max Go 22000 | 1.100t
هیتلی ۱۱ هزار | Hitli 11000 | 1.150t
یلا ۲۴ هزار طعم سوییچ | Yalla 24000 Switch Flavor | 1.500t
آووک ۱۰۰ هزار قلیونی | Aook 100000 Shisha | 2.900t
یوول ۴۰ هزار | Uwell 40000 | 1.900t
اسکوییز ۲۵ هزار | Squeeze 25000 | 1.600t
الفاخر ۸ هزار | Al Fakher 8000 | 900t
وزول ۲۰ هزار مجیک | Vozol Magic 20000 | 2.250t
اس‌پی۲اس ۵ هزار | SP2S 5000 | 650t
پیلوتاک ۸۵۰۰ پاف | Pilotak 8500 | 1.050t
وزول ۲۵ هزار قلیونی | Vozol 25000 Shisha | 2.450t
جودو ۲۴ هزار | Judo 24000 | 1.600t
رایپ ویپ ۴۰ هزار | Ripe Vapes 40000 | 2.100t
مکس پو ۵۰ هزار | Max Pu 50000 | 2.400t
کارتریج مکس پو ۵۰ هزار | Max Pu 50000 Cartridge | 1.700t
`;

const podPriceLines = `
آرگاس جی۳ مینی | argus g3 mini | 2.700t
آرگاس پی۲ | argus p2 | 4.600t
آرگاس اِی | argus A | 4.700t
آرگاس پی ۱ | argus p1 | 3.600t
آرگاس پی۳ | argus P3 | 5.900t
آرگاس ماتریکس | argus matrix | 5.300t
آرگاس جی۳ | argus G3 | 4.900t
آرگاس جی۲ | argus G2 | 4.200t
تاگبات دیمن پرو | tugboat dimon pro | 3.900t
وزول ایس گو | vozol ACE GO | 3.800t
اسموک نوو | smok novo | 2.750t
اسموک سولوس | smok solus | 2.850t
اسموک نورد کیت | smok nord kit | 3.800t
اسموک نورد کیت پرو | smok nord kit pro | 2.800t
گیک ویپ وناکس کیو پرو | geek vape venax Q pro |
گیک ویپ اِی یو کیت | geek vape au kit | 2.100t
گیک ویپ ساندر کیو لایت | geek vape sonder Q lite | 1.850t
گیک ویپ ساندر کیو | geek vape sonder Q | 2.300t
گیک ویپ ای کیو کیت | geekvape AQ kit | 2.200t
یوول تنت اسلیم | uwell tenet | 1.500t
یوول تنت کوکو | uwell tenet koko | 2.350t
یوول جی کی۲ | uwell gk2 | 2.150t
یوول جی‌کی۳ | uwell gk3 | 2.600t
یوول جی۵ کوکو | uwell G5 koko | 4.900t
یوول جی۵ لایت | uwell G5 lite | 3.350t
یوول جی۵ لایت اس ای | uwell G5 lite se | 3.450t
یوول جی۳ لایت کوکو | uwell G3 lite koko | 2.800t
یوول جی۳ لایت کوکو لیمیتد | uwell G3 lite koko limited | 2.900t
یوول جی۳ لایت قلمی | uwell G3 lite | 2.450t
یوول اِی زد ۳ | uwell Az3 | 2.600t
یوول اِی ۲ اس | uwell A2s | 1.900t
ویپرسو ایکسراس ۴ | vaporesso xros 4 | 4.750t
ویپرسو ایکسراس پرو | vaporesso xros pro | 4.700t
ویپرسو ایکسراس کیوب | vaporesso xros cube | 4.650t
ویپرسو اکو نانو | vaporesso eco nano | 2.500t
لاست ویپ اورسا بیبی۳ | lostvape ursa baby3 | 4.500t
لاست ویپ اورسا بیبی۳ پرو | lostvape ursa baby3 pro | 5.600t
لاست ویپ اورسا پاکت | lostvape ursa pocket | 3.300t
لاست ویپ اورسا نانو ایر | lostvape ursa nano air | 3.800t
لاست ویپ نانو آرت | lostvape ursa nano art | 1.600t
لاست ویپ اورسا نانو اس۲ | lostvape ursa nano s2 | 3.200t
گلکسی اس ۳۶۰ | lostvape galaxy S360 | 3.950t
`;

const inlineSpecSections = {
  "geek-vape-au-kit": {
    highlightsFa: [
      "باتری ۸۰۰ میلی‌آمپرساعتی مناسب استفاده روزانه",
      "حداکثر توان ۲۰ وات با خروجی پایدار",
      "فعال‌سازی خودکار با مکش و شارژ سریع USB-C",
      "سازگار با کارتریج‌های GeekVape U",
    ],
    packageItemsFa: [
      "۱ عدد دستگاه GeekVape AU",
      "۲ عدد کارتریج U ۰.۷ و ۱.۱ اهم",
      "۱ عدد کابل USB-C",
    ],
    specs: [
      ["ظرفیت باتری", "۸۰۰mAh"],
      ["توان خروجی", "حداکثر ۲۰ وات"],
      ["ظرفیت کارتریج", "۲ میلی‌لیتر"],
      ["پورت شارژ", "USB-C"],
      ["نوع فعال‌سازی", "Auto Draw"],
    ],
  },
  "geekvape-aq-kit": {
    highlightsFa: [
      "باتری ۱۰۰۰ میلی‌آمپرساعتی برای استفاده طولانی",
      "۳ سطح تنظیم توان و کنترل جریان هوا",
      "سازگار با کارتریج‌های سری Q با فناوری VPU",
      "بدنه مقاوم Tri-Proof و شارژ سریع USB-C",
    ],
    packageItemsFa: [
      "۱ عدد دستگاه Venax AQ",
      "۱ عدد کارتریج Q",
      "۱ عدد کابل USB-C",
      "۱ عدد درپوش دهانه",
    ],
    specs: [
      ["ظرفیت باتری", "۱۰۰۰mAh"],
      ["توان خروجی", "۵ تا ۲۰ وات"],
      ["ظرفیت کارتریج", "۲ میلی‌لیتر"],
      ["پورت شارژ", "USB-C"],
      ["تنظیم Airflow", "دارد"],
    ],
  },
  "uwell-a2s": {
    highlightsFa: [
      "باتری ۵۲۰ میلی‌آمپرساعتی برای استفاده روزمره",
      "توان خروجی ۱۵ وات و فعال‌سازی خودکار با مکش",
      "فناوری Pro-FOCS برای طعم‌دهی شفاف",
      "کارتریج شفاف برای مشاهده سطح مایع",
    ],
    packageItemsFa: ["۱ عدد دستگاه Uwell Caliburn A2S", "۲ عدد کارتریج A2S", "دفترچه راهنما"],
    specs: [
      ["ظرفیت باتری", "۵۲۰mAh"],
      ["توان خروجی", "۱۵ وات"],
      ["ظرفیت کارتریج", "۲ میلی‌لیتر"],
      ["مقاومت کویل", "۰.۹ اهم"],
      ["پورت شارژ", "USB-C"],
    ],
  },
};

function normalizeDigits(value) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

function priceTokenToRial(token) {
  if (!token?.trim()) return undefined;
  const normalized = normalizeDigits(token)
    .toLowerCase()
    .replace(/[,،\s]/g, "");
  const number = normalized.replace(/t|تومان/g, "");
  if (!number) return undefined;
  if (number.includes(".")) return Math.round(Number(number) * 1_000_000) * 10;
  return Number(number) * 1_000 * 10;
}

function tomanTextToRial(token) {
  const normalized = normalizeDigits(token).replace(/[^\d]/g, "");
  return normalized ? Number(normalized) * 10 : undefined;
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

function brandFromName(nameFa, nameEn = "") {
  const text = `${nameFa} ${nameEn}`.toLowerCase();
  const brands = [
    ["vozol", "وزول", "Vozol"],
    ["smok", "اسموک", "SMOK"],
    ["waka", "واکا", "Waka"],
    ["nasty", "نستی", "Nasty"],
    ["ivg", "آی وی جی", "IVG"],
    ["primobar", "پریموبار", "Primobar"],
    ["geekbar", "گیک‌بار", "Geek Bar"],
    ["geekvape", "گیک ویپ", "GeekVape", "geek vape"],
    ["uwell", "یوول", "Uwell"],
    ["vgod", "ویگاد", "VGOD"],
    ["dr-vapes", "دکتر ویپز", "Dr Vapes", "dr.vapes", "drvapes"],
    ["pod-salt", "پاد سالت", "Pod Salt", "podsalt", "پادسالت"],
    ["vaporesso", "ویپرسو", "Vaporesso"],
    ["lostvape", "لاست ویپ", "Lost Vape", "lost vape"],
    ["argus", "آرگاس", "Argus"],
    ["al-fakher", "الفاخر", "Al Fakher"],
    ["bugatti", "بوگاتی", "Bugatti"],
  ];
  const found = brands.find(([slug, fa, en, ...aliases]) =>
    [slug, fa, en, ...aliases].some((alias) => text.includes(alias.toLowerCase())),
  );
  return found
    ? { id: `brand-${found[0]}`, slug: found[0], nameFa: found[2] }
    : { id: "brand-ufo", slug: "ufo-selection", nameFa: "UFO Selection" };
}

function extractPuffCount(nameFa, nameEn = "") {
  const normalized = normalizeDigits(`${nameFa} ${nameEn}`).replace(/,/g, "");
  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch?.[1]) return Math.round(Number(kMatch[1]) * 1000);
  const hazarMatch = normalized.match(/(\d+)\s*هزار/);
  if (hazarMatch?.[1]) return Number(hazarMatch[1]) * 1000;
  const puffs = [...normalized.matchAll(/(\d{3,6})\s*(?:پاف|puff)?/gi)].map((match) =>
    Number(match[1]),
  );
  return puffs.find((value) => value >= 300);
}

function parsePipePriceRows(text, source) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameFa = "", nameEn = "", price = ""] = line.split("|").map((part) => part.trim());
      return { nameFa, nameEn, retailPriceRial: priceTokenToRial(price), source };
    })
    .filter((row) => row.nameFa);
}

function parseSaltText(text, source) {
  const compact = text.replace(/\r/g, "\n");
  const pattern = /([^|\n]+?)\s*\|\s*([^\n]+?)\s*([\d۰-۹٠-٩,]+)\s*تومان/g;
  const rows = [];
  for (const match of compact.matchAll(pattern)) {
    const nameFa = match[1].replace(/\s+/g, " ").trim();
    const nameEn = match[2].replace(/\s+/g, " ").trim();
    const retailPriceRial = tomanTextToRial(match[3]);
    if (nameFa && nameEn && retailPriceRial) rows.push({ nameFa, nameEn, retailPriceRial, source });
  }
  return rows;
}

function findZipEntry(buffer, wantedName) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("DOCX zip directory not found.");
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;
  while (offset < end) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);
    if (fileName === wantedName) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      if (compression === 0) return compressed.toString("utf8");
      if (compression === 8) return inflateRawSync(compressed).toString("utf8");
      throw new Error(`Unsupported DOCX compression: ${compression}`);
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`DOCX entry not found: ${wantedName}`);
}

function extractDocxText(filePath) {
  if (!existsSync(filePath)) return "";
  const xml = findZipEntry(readFileSync(filePath), "word/document.xml");
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseSpecSections(...texts) {
  const sections = new Map();
  const headingPattern = /^(?:[A-Za-z].{2,70}|\S.{1,42}\([^)]+\))$/;
  for (const text of texts) {
    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    let current;
    for (const line of lines) {
      const looksLikeHeading =
        headingPattern.test(line) &&
        !/[.:：]$/.test(line) &&
        !line.startsWith("✔") &&
        !line.startsWith("•") &&
        !line.startsWith("–") &&
        !/[🔋⚡💧💨🌀🔌🎯📦📺🌬️🛡️👀]/u.test(line);
      if (looksLikeHeading) {
        current = { title: line, body: [] };
        sections.set(slugify(line), current);
        continue;
      }
      if (current) current.body.push(line);
    }
  }
  return sections;
}

function findSpecFor(row, sections) {
  const keys = [slugify(row.nameEn), slugify(`${row.nameFa} ${row.nameEn}`), slugify(row.nameFa)];
  for (const key of keys) {
    const exact = sections.get(key);
    if (exact) return exact;
  }
  const compactName = slugify(row.nameEn || row.nameFa);
  return Array.from(sections.entries()).find(
    ([key]) => key.includes(compactName) || compactName.includes(key),
  )?.[1];
}

function wholesaleFallback(retailPriceRial) {
  return retailPriceRial ? Math.round((retailPriceRial * 0.92) / 10_000) * 10_000 : 0;
}

function makeProducts() {
  const saltSources = [
    [resolve(dataRoot, "PodSalt_Products.docx"), "فایل PodSalt_Products.docx"],
    [resolve(dataRoot, "Nasty_Products.docx"), "فایل Nasty_Products.docx"],
    [resolve(dataRoot, "VGOD.txt"), "فایل VGOD.txt"],
    [resolve(dataRoot, "Dr_vape.txt"), "فایل Dr_vape.txt"],
  ];
  const saltRows = saltSources.flatMap(([path, source]) => {
    const text = path.endsWith(".docx")
      ? extractDocxText(path)
      : existsSync(path)
        ? readFileSync(path, "utf8")
        : "";
    return parseSaltText(text, source);
  });

  const specSections = parseSpecSections(
    extractDocxText(resolve(dataRoot, "Main pods.docx")),
    extractDocxText(resolve(dataRoot, "geekvape_uwell_devices.docx")),
  );

  const rows = [
    ...parsePipePriceRows(disposablePriceLines, "لیست قیمت تک‌فروشی کارفرما"),
    ...parsePipePriceRows(podPriceLines, "لیست پاد دائمی کارفرما"),
    ...saltRows,
  ];

  const seenProductIds = new Set();
  const seenVariantIds = new Set();
  const seenSlugs = new Set();
  const brandMap = new Map();
  const products = [];
  const variants = [];
  const inventoryItems = [];

  rows.forEach((row, index) => {
    const isSalt =
      row.source.includes("VGOD") ||
      row.source.includes("Dr_vape") ||
      row.source.includes("PodSalt") ||
      row.source.includes("Nasty_Products");
    const isPod = !isSalt && podPriceLines.includes(row.nameFa);
    const isCartridge = /کارتریج|cartridge/i.test(`${row.nameFa} ${row.nameEn}`);
    const categoryId = isSalt
      ? "cat-salt-nicotine"
      : isCartridge
        ? "cat-cartridge"
        : isPod
          ? "cat-pod"
          : "cat-disposable";
    const productKind = isSalt
      ? "salt-nicotine"
      : isCartridge
        ? "cartridge"
        : isPod
          ? "pod-device"
          : "disposable";
    const brand = brandFromName(row.nameFa, row.nameEn);
    brandMap.set(brand.id, brand);
    const puffCount = extractPuffCount(row.nameFa, row.nameEn);
    const baseSlug = slugify(row.nameEn || row.nameFa);
    const slug = unique(baseSlug, seenSlugs);
    const productId = unique(`prod-client-${slug}`, seenProductIds);
    const variantId = unique(`var-client-${slug}-std`, seenVariantIds);
    const specSection = findSpecFor(row, specSections);
    const inline = inlineSpecSections[slug] ?? inlineSpecSections[baseSlug];
    const hasPrice = typeof row.retailPriceRial === "number" && row.retailPriceRial > 0;
    const retailPriceRial = row.retailPriceRial ?? 0;
    const title = row.nameFa;
    const puffText = puffCount ? `${toPersianDigits(puffCount)} پاف` : undefined;
    const shortDescriptionFa = isSalt
      ? `${row.nameFa}، سالت نیکوتین ۳۰ میلی‌لیتر با قیمت تک‌فروشی ثبت‌شده.`
      : isPod
        ? `${row.nameFa} از لیست پادهای دائمی با قیمت ${hasPrice ? "به‌روز" : "در انتظار تکمیل"} کارفرما.`
        : `${row.nameFa}${puffText ? ` با ظرفیت ${puffText}` : ""} و قیمت تک‌فروشی ثبت‌شده.`;
    const sectionBody = specSection?.body.slice(0, 10) ?? [];

    products.push({
      id: productId,
      slug,
      nameFa: title,
      ...(row.nameEn ? { nameEn: row.nameEn } : {}),
      brandId: brand.id,
      categoryId,
      productKind,
      salesChannels: ["retail"],
      shortDescriptionFa,
      descriptionFa:
        sectionBody.length > 0
          ? sectionBody.join(" ")
          : `${row.nameFa}${row.nameEn ? ` (${row.nameEn})` : ""} بر اساس دیتای کارفرما وارد کاتالوگ UFO Puff شده و از پنل ادمین قابل ویرایش است.`,
      image: defaultImage,
      images: [defaultImage],
      tags: [
        isSalt ? "سالت نیکوتین" : isPod ? "پاد دائمی" : "یکبارمصرف",
        brand.nameFa,
        ...(row.nameEn ? row.nameEn.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4) : []),
        ...(puffText ? [puffText, String(puffCount)] : []),
      ],
      attributes: [
        {
          nameFa: "نوع",
          valueFa: isSalt
            ? "سالت نیکوتین"
            : isPod
              ? "پاد دائمی"
              : isCartridge
                ? "کارتریج"
                : "یکبارمصرف",
        },
        ...(puffCount
          ? [
              {
                nameFa: "پاف",
                valueFa: toPersianDigits(puffCount),
                technicalValue: String(puffCount),
              },
            ]
          : []),
        ...(row.nameEn
          ? [{ nameFa: "نام لاتین", valueFa: row.nameEn, technicalValue: row.nameEn }]
          : []),
      ],
      specs: inline?.specs.map(([labelFa, valueFa]) => ({ labelFa, valueFa })) ?? [],
      highlightsFa:
        inline?.highlightsFa ??
        sectionBody
          .filter((line) => line.startsWith("✔"))
          .slice(0, 5)
          .map((line) => line.replace(/^✔️?\s*/, "")),
      packageItemsFa:
        inline?.packageItemsFa ??
        sectionBody
          .find((line) => line.includes("محتویات بسته"))
          ?.replace(/^.*?:\s*/, "")
          .split(/[،,]/)
          .map((item) => item.trim())
          .filter(Boolean),
      sourceNoteFa: row.source,
      ...(hasPrice
        ? {}
        : {
            adminNotesFa:
              "قیمت این محصول در لیست کارفرما خالی بود و قبل از فعال‌سازی باید تکمیل شود.",
          }),
      isActive: hasPrice,
      isAgeRestricted: true,
      seoTitle: `${title} | UFO Puff`,
      seoDescription: shortDescriptionFa,
      createdAt: importedAt,
      updatedAt: importedAt,
    });

    variants.push({
      id: variantId,
      productId,
      nameFa: isSalt ? "۳۰ میلی‌لیتر" : "استاندارد",
      sku: `UFO-${productKind.toUpperCase().replace(/[^A-Z]+/g, "-")}-${String(index + 1).padStart(4, "0")}`,
      retailPriceRial,
      wholesalePriceRial: wholesaleFallback(retailPriceRial),
      ...(hasPrice
        ? { compareAtPriceRial: Math.round((retailPriceRial * 1.06) / 10_000) * 10_000 }
        : {}),
      cartonSize: isSalt ? 10 : isPod ? 6 : puffCount && puffCount >= 40_000 ? 10 : 20,
      minWholesaleCartonCount: isSalt ? 3 : isPod ? 1 : 2,
      wholesaleEnabled: false,
      attributes: [
        { nameFa: isSalt ? "حجم" : "مدل", valueFa: isSalt ? "۳۰ میلی‌لیتر" : "استاندارد" },
        ...(puffCount
          ? [
              {
                nameFa: "پاف",
                valueFa: toPersianDigits(puffCount),
                technicalValue: String(puffCount),
              },
            ]
          : []),
      ],
      isActive: hasPrice,
    });

    inventoryItems.push({
      id: `inv-client-${slug}`,
      variantId,
      onHand: isSalt ? 24 : isPod ? 12 : 60,
      reserved: 0,
      preorderEnabled: true,
      restockThreshold: isSalt ? 6 : isPod ? 3 : 10,
      updatedAt: importedAt,
    });
  });

  return {
    brands: Array.from(brandMap.values()).filter((brand) => brand.id !== "brand-ufo"),
    products,
    variants,
    inventoryItems,
  };
}

const { brands, products, variants, inventoryItems } = makeProducts();

const content = `import type { Brand, InventoryItem, Product, ProductVariant } from "@ufo/types";

// Generated by scripts/import-client-catalog.mjs from the client supplied catalog on 2026-08-05.
export const importedBrands: Brand[] = ${JSON.stringify(brands, null, 2)};

export const importedProducts: Product[] = ${JSON.stringify(products, null, 2)};

export const importedVariants: ProductVariant[] = ${JSON.stringify(variants, null, 2)};

export const importedInventoryItems: InventoryItem[] = ${JSON.stringify(inventoryItems, null, 2)};
`;

writeFileSync(outputPath, `${content}\n`, "utf8");
console.log(
  `Imported ${products.length} products, ${variants.length} variants, ${brands.length} brands.`,
);
