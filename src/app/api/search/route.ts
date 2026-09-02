import { NextResponse } from "next/server";
import { brands, categories } from "@ufo/domain";
import type { SalesChannel } from "@ufo/types";
import { listAdminProducts, type AdminProductRecord } from "@/lib/admin-products";
import { getCatalogRowStock } from "@/lib/catalog-data";
import { getCategoryImage } from "@/lib/product-images";

type SearchChannel = Extract<SalesChannel, "retail" | "wholesale">;

const commonAliases: Record<string, string[]> = {
  پاد: ["pod"],
  ویپ: ["vape"],
  کویل: ["coil"],
  کارتریج: ["cartridge"],
  جویس: ["juice", "liquid"],
  سالت: ["salt"],
  ویپو: ["voopoo"],
  آرگاس: ["argus"],
  ارگاس: ["argus"],
  جی: ["g"],
};

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(/\s+/).filter(Boolean);
}

function expandTokens(query: string): string[] {
  const tokens = tokenize(query);
  return [
    ...new Set(
      tokens.flatMap((token) => [token, ...(commonAliases[token] ?? [])]).filter((token) => token.length > 0),
    ),
  ];
}

function fieldScore(field: string, tokens: string[], exactWeight: number, containsWeight: number) {
  const normalized = normalizeText(field);
  if (!normalized) return 0;
  return tokens.reduce((score, token) => {
    if (normalized === token) return score + exactWeight;
    if (normalized.startsWith(token)) return score + Math.round(exactWeight * 0.7);
    if (normalized.includes(token)) return score + containsWeight;
    return score;
  }, 0);
}

function rowMatchesChannel(row: AdminProductRecord, channel: SearchChannel) {
  if (!row.product.isActive || !row.variant.isActive) return false;
  if (!(row.product.salesChannels?.includes(channel) ?? true)) return false;
  if (channel === "wholesale" && row.variant.wholesaleEnabled === false) return false;
  return true;
}

function scoreRow(row: AdminProductRecord, tokens: string[]) {
  const stock = getCatalogRowStock(row);
  const compareAt = row.variant.compareAtPriceRial ?? 0;
  const hasRetailDiscount = compareAt > row.variant.retailPriceRial;
  const variantValues = row.variant.attributes
    .map((attribute) => `${attribute.valueFa} ${attribute.technicalValue ?? ""}`)
    .join(" ");

  return (
    fieldScore(row.product.nameFa, tokens, 90, 36) +
    fieldScore(row.product.nameEn ?? "", tokens, 90, 36) +
    fieldScore(row.product.slug, tokens, 70, 28) +
    fieldScore(row.brandNameFa, tokens, 65, 24) +
    fieldScore(row.variant.sku, tokens, 75, 30) +
    fieldScore(row.categoryNameFa, tokens, 42, 16) +
    fieldScore(row.product.tags.join(" "), tokens, 35, 12) +
    fieldScore(variantValues, tokens, 34, 12) +
    Math.min(stock, 25) +
    (hasRetailDiscount ? 8 : 0)
  );
}

function formatStockLabel(available: number, channel: SearchChannel) {
  if (available <= 0) return channel === "wholesale" ? "نیازمند هماهنگی" : "پیش سفارش";
  if (available < 10) return "موجودی محدود";
  return "موجود";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  const channel = url.searchParams.get("channel") === "wholesale" ? "wholesale" : "retail";
  const tokens = expandTokens(rawQuery);
  const rows = await listAdminProducts();
  const channelRows = rows.filter((row) => rowMatchesChannel(row, channel));

  const rankedRows = channelRows
    .map((row) => ({
      row,
      score: tokens.length > 0 ? scoreRow(row, tokens) : getCatalogRowStock(row),
    }))
    .filter((item) => tokens.length === 0 || item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  const categoryScores = categories
    .map((category) => {
      const matches = channelRows.filter((row) => row.product.categoryId === category.id);
      const score =
        tokens.length > 0 ? fieldScore(category.nameFa + " " + category.slug, tokens, 45, 18) : matches.length;
      return { category, count: matches.length, score };
    })
    .filter((item) => item.count > 0 && item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const brandScores = brands
    .map((brand) => {
      const matches = channelRows.filter((row) => row.product.brandId === brand.id);
      const score =
        tokens.length > 0 ? fieldScore(brand.nameFa + " " + brand.slug, tokens, 45, 18) : matches.length;
      return { brand, count: matches.length, score };
    })
    .filter((item) => item.count > 0 && item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const catalogPath = channel === "wholesale" ? "/b2b/catalog" : "/products";

  return NextResponse.json({
    query: rawQuery,
    channel,
    products: rankedRows.map(({ row }) => {
      const available = getCatalogRowStock(row);
      const priceRial =
        channel === "wholesale" ? row.variant.wholesalePriceRial : row.variant.retailPriceRial;
      const fallbackImage = getCategoryImage(row.product.categoryId) ?? "/images/categories/lighter.png";
      return {
        id: row.product.id,
        title: row.product.nameFa,
        subtitle: row.product.shortDescriptionFa,
        brand: row.brandNameFa,
        category: row.categoryNameFa,
        sku: row.variant.sku,
        href:
          channel === "wholesale"
            ? `/b2b/catalog?q=${encodeURIComponent(row.product.nameFa)}`
            : `/products/${row.product.slug}`,
        image: fallbackImage,
        fallbackImage,
        priceRial,
        compareAtPriceRial:
          channel === "retail" && (row.variant.compareAtPriceRial ?? 0) > priceRial
            ? row.variant.compareAtPriceRial
            : null,
        stockCount: available,
        stockLabel: formatStockLabel(available, channel),
        cartonSize: channel === "wholesale" ? row.variant.cartonSize : null,
        moq: channel === "wholesale" ? row.variant.minWholesaleCartonCount : null,
      };
    }),
    categories: categoryScores.map(({ category, count }) => ({
      id: category.id,
      label: category.nameFa,
      href: `${catalogPath}?category=${category.slug}`,
      count,
    })),
    brands: brandScores.map(({ brand, count }) => ({
      id: brand.id,
      label: brand.nameFa,
      href: `${catalogPath}?brand=${brand.id}`,
      count,
    })),
  });
}
