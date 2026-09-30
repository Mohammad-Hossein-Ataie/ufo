import type { Product } from "@ufo/types";
import { isProductAvailableForPurchase } from "@ufo/domain";
import type { AdminProductRecord } from "@/lib/admin-products";
import { getCatalogRowStock } from "@/lib/catalog-data";
import {
  nicotineRecommendationStrengths,
  type NicotineRecommendationStrength,
} from "@/lib/nicotine-guide";

export const nicotineDeviceTypes = ["pod", "vape"] as const;

export type NicotineDeviceType = (typeof nicotineDeviceTypes)[number];
export type NicotineLiquidKind = "salt" | "freebase";
export type NicotineMatchQuality = "strength";
export type NicotineRecommendationSetKey =
  `${NicotineDeviceType}:${NicotineRecommendationStrength}`;

export interface RankedNicotineProduct {
  row: AdminProductRecord;
  kind: NicotineLiquidKind;
  strengthsMg: number[];
  matchQuality: NicotineMatchQuality;
}

function uniqueSortedStrengths(values: number[] | undefined) {
  return [
    ...new Set(
      (values ?? []).filter((value) => Number.isFinite(value) && value >= 0 && value <= 100),
    ),
  ].sort((left, right) => left - right);
}

/**
 * The only source of truth for nicotine strength matching. Product titles,
 * descriptions, tags, specs and flavor variants are intentionally ignored.
 */
export function getProductNicotineStrengths(product: Product): number[] {
  return uniqueSortedStrengths(product.nicotineStrengthsMg);
}

export function getNicotineLiquidKind(row: AdminProductRecord): NicotineLiquidKind | undefined {
  if (row.product.productKind === "salt-nicotine") return "salt";
  if (row.product.productKind === "e-liquid") return "freebase";
  if (row.product.productKind) return undefined;
  if (row.product.categoryId === "cat-salt-nicotine") return "salt";
  if (row.product.categoryId === "cat-eliquid") return "freebase";
  return undefined;
}

function requiredKind(deviceType: NicotineDeviceType): NicotineLiquidKind {
  return deviceType === "pod" ? "salt" : "freebase";
}

function isEligible(row: AdminProductRecord) {
  return (
    !row.product.deletedAt &&
    row.product.isActive &&
    row.variant.isActive &&
    (row.product.salesChannels?.includes("retail") ?? true) &&
    isProductAvailableForPurchase(row.product) &&
    getCatalogRowStock(row) > 0
  );
}

function flavorSignature(row: AdminProductRecord) {
  if (row.product.variantType !== "flavor") return row.product.id;
  const values = [...new Set(row.product.variantValueIds ?? [])].sort();
  return values.length > 0 ? values.join("|") : row.product.id;
}

function selectDiverseProducts(
  candidates: Array<RankedNicotineProduct & { stock: number }>,
  limit: number,
) {
  const bestByProduct = new Map<string, (typeof candidates)[number]>();
  for (const candidate of candidates) {
    const current = bestByProduct.get(candidate.row.product.id);
    if (
      !current ||
      candidate.stock > current.stock ||
      (candidate.stock === current.stock &&
        candidate.row.variant.id.localeCompare(current.row.variant.id) < 0)
    ) {
      bestByProduct.set(candidate.row.product.id, candidate);
    }
  }

  const remaining = [...bestByProduct.values()].sort(
    (left, right) =>
      right.stock - left.stock || left.row.product.id.localeCompare(right.row.product.id),
  );
  const selected: typeof remaining = [];
  const brandUse = new Map<string, number>();
  const flavorUse = new Map<string, number>();

  while (remaining.length > 0 && selected.length < limit) {
    remaining.sort((left, right) => {
      const brandDifference =
        (brandUse.get(left.row.product.brandId) ?? 0) -
        (brandUse.get(right.row.product.brandId) ?? 0);
      if (brandDifference !== 0) return brandDifference;
      const flavorDifference =
        (flavorUse.get(flavorSignature(left.row)) ?? 0) -
        (flavorUse.get(flavorSignature(right.row)) ?? 0);
      return (
        flavorDifference ||
        right.stock - left.stock ||
        left.row.product.id.localeCompare(right.row.product.id)
      );
    });
    const next = remaining.shift();
    if (!next) break;
    selected.push(next);
    brandUse.set(next.row.product.brandId, (brandUse.get(next.row.product.brandId) ?? 0) + 1);
    const flavor = flavorSignature(next.row);
    flavorUse.set(flavor, (flavorUse.get(flavor) ?? 0) + 1);
  }

  return selected.map(({ stock: _stock, ...candidate }) => candidate);
}

export function selectRecommendedProducts({
  rows,
  nicotineResult,
  deviceType,
  limit = 4,
}: {
  rows: AdminProductRecord[];
  nicotineResult: NicotineRecommendationStrength;
  deviceType: NicotineDeviceType;
  limit?: number;
}): RankedNicotineProduct[] {
  const kind = requiredKind(deviceType);
  const candidates = rows.flatMap((row) => {
    if (!isEligible(row) || getNicotineLiquidKind(row) !== kind) return [];
    const strengthsMg = getProductNicotineStrengths(row.product);
    if (!strengthsMg.includes(nicotineResult)) return [];
    return [
      {
        row,
        kind,
        strengthsMg,
        matchQuality: "strength" as const,
        stock: getCatalogRowStock(row),
      },
    ];
  });
  return selectDiverseProducts(candidates, limit);
}

export function buildNicotineRecommendationSets(
  rows: AdminProductRecord[],
  limit = 4,
): Record<NicotineRecommendationSetKey, RankedNicotineProduct[]> {
  const sets = {} as Record<NicotineRecommendationSetKey, RankedNicotineProduct[]>;
  for (const deviceType of nicotineDeviceTypes) {
    for (const strength of nicotineRecommendationStrengths) {
      sets[`${deviceType}:${strength}`] = selectRecommendedProducts({
        rows,
        nicotineResult: strength,
        deviceType,
        limit,
      });
    }
  }
  return sets;
}

export function summarizeNicotineCatalog(rows: AdminProductRecord[]) {
  const summaryFor = (kind: NicotineLiquidKind) => {
    const uniqueProducts = new Map<string, AdminProductRecord>();
    for (const row of rows) {
      if (isEligible(row) && getNicotineLiquidKind(row) === kind) {
        uniqueProducts.set(row.product.id, row);
      }
    }
    const products = [...uniqueProducts.values()];
    const withStrength = products.filter(
      (row) => getProductNicotineStrengths(row.product).length > 0,
    ).length;
    return {
      available: products.length,
      withStrength,
      unknownStrength: products.length - withStrength,
    };
  };
  return { salt: summaryFor("salt"), freebase: summaryFor("freebase") };
}
