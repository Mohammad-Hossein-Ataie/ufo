import { listAdminProducts, type AdminProductRecord } from "@/lib/admin-products";
import { catalogSearchTokenGroups, normalizeCatalogSearchText } from "@/lib/catalog-search-text";

function matchesQuery(row: AdminProductRecord, query: string): boolean {
  const tokenGroups = catalogSearchTokenGroups(query);
  if (tokenGroups.length === 0) return true;
  const searchable = normalizeCatalogSearchText([
    row.product.nameFa,
    row.product.nameEn,
    row.product.slug,
    row.variant.sku,
    row.brandNameFa,
    row.categoryNameFa,
    ...row.product.tags,
    ...row.variant.attributes.map((attribute) => `${attribute.valueFa} ${attribute.technicalValue ?? ""}`),
  ]
    .filter(Boolean)
    .join(" "));
  return tokenGroups.every((group) => group.some((token) => searchable.includes(token)));
}

export async function listCatalogRows(): Promise<AdminProductRecord[]> {
  return listAdminProducts();
}

export async function findCatalogRowBySlug(slug: string): Promise<AdminProductRecord | undefined> {
  return (await listCatalogRows()).find((row) => row.product.slug === slug && row.product.isActive);
}

export function searchCatalogRows(rows: AdminProductRecord[], query: string): AdminProductRecord[] {
  return rows.filter((row) => matchesQuery(row, query));
}

export function getCatalogRowStock(row: AdminProductRecord): number {
  return Math.max(0, row.inventory.onHand - row.inventory.reserved);
}
