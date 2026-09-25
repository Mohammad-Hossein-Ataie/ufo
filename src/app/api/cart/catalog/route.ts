import { NextResponse } from "next/server";
import { listCatalogRows } from "@/lib/catalog-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { variantIds?: unknown };
  const ids = Array.isArray(body.variantIds)
    ? body.variantIds.filter((id): id is string => typeof id === "string").slice(0, 100)
    : [];
  const selected = new Set(ids);
  const rows = (await listCatalogRows())
    .filter((row) => selected.has(row.variant.id) && row.product.isActive && row.variant.isActive && (row.product.salesChannels?.includes("retail") ?? true))
    .map((row) => ({
      product: { id: row.product.id, nameFa: row.product.nameFa },
      variant: {
        id: row.variant.id,
        productId: row.variant.productId,
        nameFa: row.variant.nameFa,
        sku: row.variant.sku,
        retailPriceRial: row.variant.retailPriceRial,
      },
    }));
  return NextResponse.json({ rows });
}
