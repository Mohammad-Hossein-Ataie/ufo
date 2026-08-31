import type { Product } from "@ufo/types";

export interface CatalogTechnicalOption {
  id: string;
  labelFa: string;
}

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function formatOhm(value: number) {
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(value)} اهم`;
}

function normalizeOhm(value: number) {
  return `${Number(value.toFixed(2))}ohm`;
}

export function getProductResistanceOptions(product: Product): CatalogTechnicalOption[] {
  if (product.productKind !== "coil" && product.productKind !== "cartridge") return [];

  const source = [
    product.nameFa,
    product.nameEn,
    product.shortDescriptionFa,
    product.descriptionFa,
    ...product.tags,
    ...product.attributes.flatMap((attribute) => [
      attribute.nameFa,
      attribute.valueFa,
      attribute.technicalValue,
    ]),
    ...(product.specs ?? []).flatMap((spec) => [spec.labelFa, spec.valueFa, spec.technicalValue]),
  ]
    .filter(Boolean)
    .join(" ");

  const normalized = toLatinDigits(source);
  const suffixMatches = normalized.matchAll(/(?:^|[^\d])(\d+(?:[./]\d+)?)\s*(?:ohm|Ω|اهم)\b/gi);
  const prefixMatches = normalized.matchAll(/\b(?:ohm|Ω|اهم)\s*(\d+(?:[./]\d+)?)/gi);
  const values = [...Array.from(suffixMatches), ...Array.from(prefixMatches)]
    .map((match) => Number(match[1]?.replace("/", ".")))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 10);

  return Array.from(new Set(values.map(normalizeOhm)))
    .map((id) => {
      const numeric = Number(id.replace("ohm", ""));
      return { id, labelFa: formatOhm(numeric) };
    })
    .sort((left, right) => Number(left.id.replace("ohm", "")) - Number(right.id.replace("ohm", "")));
}

export function aggregateProductResistanceOptions(rows: Array<{ product: Product }>) {
  const byId = new Map<string, CatalogTechnicalOption>();
  for (const row of rows) {
    for (const option of getProductResistanceOptions(row.product)) {
      byId.set(option.id, option);
    }
  }
  return Array.from(byId.values());
}
