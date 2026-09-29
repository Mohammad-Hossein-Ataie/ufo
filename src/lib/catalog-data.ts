import { listAdminProducts, type AdminProductRecord } from "@/lib/admin-products";
import { catalogSearchTokenGroups, normalizeCatalogSearchText } from "@/lib/catalog-search-text";
import { getPublicAvailabilityState } from "@/lib/public-availability";

function matchesQuery(row: AdminProductRecord, query: string): boolean {
  const tokenGroups = catalogSearchTokenGroups(query);
  if (tokenGroups.length === 0) return true;
  const searchable = normalizeCatalogSearchText(
    [
      row.product.nameFa,
      row.product.nameEn,
      row.product.slug,
      row.variant.sku,
      row.brandNameFa,
      row.categoryNameFa,
      ...row.product.tags,
      ...row.variant.attributes.map(
        (attribute) => `${attribute.valueFa} ${attribute.technicalValue ?? ""}`,
      ),
    ]
      .filter(Boolean)
      .join(" "),
  );
  return tokenGroups.every((group) => group.some((token) => searchable.includes(token)));
}

export async function listCatalogRows(): Promise<AdminProductRecord[]> {
  return listAdminProducts();
}

// Public catalog pages, search suggestions, and image lookups can tolerate a brief snapshot.
// Cart and checkout continue to read current inventory through listCatalogRows.
const discoveryCacheMs = 20_000;
let discoveryCache: { rows: AdminProductRecord[]; expiresAt: number } | undefined;
let discoveryPending: Promise<AdminProductRecord[]> | undefined;

function refreshDiscoveryCatalog(): Promise<AdminProductRecord[]> {
  if (!discoveryPending) {
    discoveryPending = listAdminProducts()
      .then((rows) => {
        discoveryCache = { rows, expiresAt: Date.now() + discoveryCacheMs };
        return rows;
      })
      .catch((error: unknown) => {
        if (discoveryCache) discoveryCache.expiresAt = Date.now() + 5_000;
        throw error;
      })
      .finally(() => {
        discoveryPending = undefined;
      });
  }
  return discoveryPending;
}

export async function listCatalogRowsForDiscovery(): Promise<AdminProductRecord[]> {
  if (discoveryCache) {
    if (Date.now() >= discoveryCache.expiresAt && !discoveryPending) {
      void refreshDiscoveryCatalog().catch(() => undefined);
    }
    return discoveryCache.rows;
  }
  return refreshDiscoveryCatalog();
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

export function getCatalogRowAvailability(row: AdminProductRecord) {
  return getPublicAvailabilityState(getCatalogRowStock(row), {
    lowStockAt: row.inventory.restockThreshold,
  });
}
