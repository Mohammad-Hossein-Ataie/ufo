import { listAdminProducts, type AdminProductRecord } from "@/lib/admin-products";

function matchesQuery(row: AdminProductRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    row.product.nameFa,
    row.product.nameEn,
    row.product.slug,
    row.variant.sku,
    row.brandNameFa,
    row.categoryNameFa,
    ...row.product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
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
