import { categories } from "@ufo/domain";
import type { AdminProductRecord } from "@/lib/admin-products";

export const homepageCategorySlugs = ["pod", "vape", "disposable", "e-liquid"] as const;

export interface HomepageProductSlot {
  id: string;
  category: (typeof categories)[number] | undefined;
  rows: AdminProductRecord[];
}

function freshness(row: AdminProductRecord): number {
  // Match the admin catalog's update-based ordering, including its bundled fallback.
  return Date.parse(row.product.updatedAt) || Date.parse(row.product.createdAt) || 0;
}

export function getLatestHomepageProducts(rows: AdminProductRecord[]): HomepageProductSlot[] {
  const seen = new Set<string>();
  const latest = rows
    .filter(
      ({ product }) => product.isActive && (product.salesChannels?.includes("retail") ?? true),
    )
    .slice()
    .sort((a, b) => freshness(b) - freshness(a) || a.product.id.localeCompare(b.product.id))
    .filter(({ product }) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  const used = new Set<string>();
  const slots = homepageCategorySlugs.map((slug): HomepageProductSlot => {
    const category = categories.find((item) => item.slug === slug);
    const primary = latest.find((row) => row.product.categoryId === category?.id);
    if (primary) used.add(primary.product.id);
    return { id: slug, category, rows: primary ? [primary] : [] };
  });

  // Reserve every primary before fallbacks or carousel extras can consume it.
  for (const slot of slots) {
    if (slot.rows.length) continue;
    const fallback = latest.find((row) => !used.has(row.product.id));
    if (fallback) {
      slot.rows.push(fallback);
      // Label the actual category, never claim a fallback belongs to the missing one.
      slot.category = categories.find((item) => item.id === fallback.product.categoryId);
      used.add(fallback.product.id);
    }
  }
  for (const slot of slots) {
    if (slot.category?.slug !== slot.id) continue;
    for (const row of latest) {
      if (slot.rows.length >= 3) break;
      if (row.product.categoryId !== slot.category.id || used.has(row.product.id)) continue;
      slot.rows.push(row);
      used.add(row.product.id);
    }
  }
  return slots.filter((slot) => slot.rows.length > 0);
}
