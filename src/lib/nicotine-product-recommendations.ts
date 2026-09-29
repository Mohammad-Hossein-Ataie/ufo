import type { AdminProductRecord } from "@/lib/admin-products";
import { getCatalogRowStock } from "@/lib/catalog-data";
import {
  getNicotineRecommendationTargets,
  nicotineDependenceBands,
  nicotineGuideDevices,
  type DependenceBand,
  type NicotineLiquidKind,
  type NicotineRecommendationTarget,
  type VapingDevice,
} from "@/lib/nicotine-guide";

export type NicotineMatchQuality = "strength" | "type-only";
export type NicotineRecommendationSetKey = `${VapingDevice}:${DependenceBand}`;

export interface RankedNicotineProduct {
  row: AdminProductRecord;
  kind: NicotineLiquidKind;
  strengthsMg: number[];
  matchQuality: NicotineMatchQuality;
}

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function uniqueSorted(values: number[]) {
  return [
    ...new Set(values.filter((value) => Number.isFinite(value) && value >= 0 && value <= 100)),
  ].sort((left, right) => left - right);
}

export function extractNicotineStrengthsMg(row: AdminProductRecord): number[] {
  const attributes = [
    ...row.product.attributes,
    ...(row.product.specs ?? []).map((spec) => ({
      nameFa: spec.labelFa,
      valueFa: spec.valueFa,
      technicalValue: spec.technicalValue,
    })),
    ...row.variant.attributes,
  ];
  const strengths: number[] = [];

  for (const attribute of attributes) {
    const text = normalizeDigits(
      `${attribute.nameFa} ${attribute.valueFa} ${attribute.technicalValue ?? ""}`,
    );
    const isNicotineField = /نیکوتین|nicotine|nic\b/i.test(attribute.nameFa);
    for (const match of text.matchAll(
      /(\d{1,3}(?:\.\d+)?)\s*(?:mg(?:\s*\/\s*ml)?|میلی[\s‌-]*گرم)/gi,
    )) {
      strengths.push(Number(match[1]));
    }
    if (isNicotineField) {
      for (const match of text.matchAll(/(\d{1,2}(?:\.\d+)?)\s*[%٪]/g)) {
        strengths.push(Number(match[1]) * 10);
      }
    }
  }

  return uniqueSorted(strengths);
}

export function getNicotineLiquidKind(row: AdminProductRecord): NicotineLiquidKind | undefined {
  if (row.product.productKind === "salt-nicotine") return "salt";
  if (row.product.productKind === "e-liquid") return "freebase";
  if (row.product.categoryId === "cat-salt-nicotine") return "salt";
  if (row.product.categoryId !== "cat-eliquid") return undefined;

  const searchable = normalizeDigits(
    [
      row.product.nameFa,
      row.product.nameEn,
      ...row.product.tags,
      ...row.product.attributes.flatMap((attribute) => [attribute.nameFa, attribute.valueFa]),
    ]
      .filter(Boolean)
      .join(" "),
  );
  return /سالت|salt(?:\s+nic(?:otine)?)?/i.test(searchable) ? "salt" : "freebase";
}

function isPublicInStock(row: AdminProductRecord) {
  return (
    row.product.isActive &&
    row.variant.isActive &&
    (row.product.salesChannels?.includes("retail") ?? true) &&
    getCatalogRowStock(row) > 0
  );
}

function rankForTarget(
  rows: AdminProductRecord[],
  target: NicotineRecommendationTarget,
  limit: number,
): RankedNicotineProduct[] {
  const midpoint = (target.minMg + target.maxMg) / 2;
  return rows
    .map((row, index) => {
      const kind = getNicotineLiquidKind(row);
      const strengthsMg = extractNicotineStrengthsMg(row);
      const matchingStrengths = strengthsMg.filter(
        (strength) => strength >= target.minMg && strength <= target.maxMg,
      );
      if (!isPublicInStock(row) || kind !== target.kind) return undefined;
      if (strengthsMg.length > 0 && matchingStrengths.length === 0) return undefined;
      return {
        row,
        kind,
        strengthsMg,
        matchingStrengths,
        matchQuality: matchingStrengths.length > 0 ? ("strength" as const) : ("type-only" as const),
        distance:
          matchingStrengths.length > 0
            ? Math.min(...matchingStrengths.map((strength) => Math.abs(strength - midpoint)))
            : Number.POSITIVE_INFINITY,
        stock: getCatalogRowStock(row),
        index,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort(
      (left, right) =>
        Number(right.matchQuality === "strength") - Number(left.matchQuality === "strength") ||
        left.distance - right.distance ||
        right.stock - left.stock ||
        left.index - right.index,
    )
    .slice(0, limit)
    .map(({ row, kind, strengthsMg, matchQuality }) => ({
      row,
      kind,
      strengthsMg,
      matchQuality,
    }));
}

export function buildNicotineRecommendationSets(
  rows: AdminProductRecord[],
  limit = 4,
): Record<NicotineRecommendationSetKey, RankedNicotineProduct[]> {
  const sets = {} as Record<NicotineRecommendationSetKey, RankedNicotineProduct[]>;
  for (const device of nicotineGuideDevices) {
    for (const band of nicotineDependenceBands) {
      const targets = getNicotineRecommendationTargets(device, band);
      const perTargetLimit =
        targets.length > 1 ? Math.max(1, Math.floor(limit / targets.length)) : limit;
      const seen = new Set<string>();
      const recommendations: RankedNicotineProduct[] = [];
      for (const target of targets) {
        for (const item of rankForTarget(rows, target, perTargetLimit)) {
          const key = `${item.row.product.id}:${item.row.variant.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          recommendations.push(item);
        }
      }
      sets[`${device}:${band}`] = recommendations.slice(0, limit);
    }
  }
  return sets;
}

export function summarizeNicotineCatalog(rows: AdminProductRecord[]) {
  const publicRows = rows.filter(isPublicInStock);
  const summaryFor = (kind: NicotineLiquidKind) => {
    const matching = publicRows.filter((row) => getNicotineLiquidKind(row) === kind);
    return {
      available: matching.length,
      withStrength: matching.filter((row) => extractNicotineStrengthsMg(row).length > 0).length,
    };
  };
  return { salt: summaryFor("salt"), freebase: summaryFor("freebase") };
}
