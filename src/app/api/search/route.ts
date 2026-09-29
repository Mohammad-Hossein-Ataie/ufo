import { NextResponse } from "next/server";
import { brands, categories } from "@ufo/domain";
import type { SalesChannel } from "@ufo/types";
import type { AdminProductRecord } from "@/lib/admin-products";
import {
  getCatalogRowAvailability,
  getCatalogRowStock,
  listCatalogRowsForDiscovery,
  searchCatalogRows,
} from "@/lib/catalog-data";
import { publicAvailabilityLabelFa } from "@/lib/public-availability";
import { expandCatalogSearchTokens, normalizeCatalogSearchText } from "@/lib/catalog-search-text";
import { getCategoryImage, getProductSearchImage } from "@/lib/product-images";

type SearchChannel = Extract<SalesChannel, "retail" | "wholesale">;

function fieldScore(field: string, tokens: string[], exactWeight: number, containsWeight: number) {
  const normalized = normalizeCatalogSearchText(field);
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  const channel = url.searchParams.get("channel") === "wholesale" ? "wholesale" : "retail";
  const tokens = expandCatalogSearchTokens(rawQuery);
  const rows = await listCatalogRowsForDiscovery();
  const channelRows = rows.filter((row) => rowMatchesChannel(row, channel));

  const rankedRows = searchCatalogRows(channelRows, rawQuery)
    .map((row) => ({
      row,
      score: tokens.length > 0 ? scoreRow(row, tokens) : getCatalogRowStock(row),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  const categoryScores = categories
    .map((category) => {
      const matches = channelRows.filter((row) => row.product.categoryId === category.id);
      const score =
        tokens.length > 0
          ? fieldScore(category.nameFa + " " + category.slug, tokens, 45, 18)
          : matches.length;
      return { category, count: matches.length, score };
    })
    .filter((item) => item.count > 0 && item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  const brandScores = brands
    .map((brand) => {
      const matches = channelRows.filter((row) => row.product.brandId === brand.id);
      const score =
        tokens.length > 0
          ? fieldScore(brand.nameFa + " " + brand.slug, tokens, 45, 18)
          : matches.length;
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
      const availabilityState = getCatalogRowAvailability(row);
      const priceRial =
        channel === "wholesale" ? row.variant.wholesalePriceRial : row.variant.retailPriceRial;
      const fallbackImage =
        getCategoryImage(row.product.categoryId) ?? "/images/categories/lighter.webp";
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
        image: getProductSearchImage(row.product),
        fallbackImage,
        priceRial,
        compareAtPriceRial:
          channel === "retail" && (row.variant.compareAtPriceRial ?? 0) > priceRial
            ? row.variant.compareAtPriceRial
            : null,
        availabilityState,
        stockLabel: publicAvailabilityLabelFa(
          availabilityState,
          channel === "wholesale" ? "نیازمند هماهنگی" : "پیش‌سفارش",
        ),
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
