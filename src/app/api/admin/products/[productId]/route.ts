import { NextResponse } from "next/server";
import { saveAdminProduct, type AdminProductInput } from "@/lib/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseInput(productId: string, body: unknown): AdminProductInput {
  const value = body as Partial<AdminProductInput>;
  return {
    id: productId,
    variantId: value.variantId,
    inventoryId: value.inventoryId,
    nameFa: String(value.nameFa ?? ""),
    nameEn: value.nameEn,
    slug: value.slug,
    brandId: value.brandId,
    categoryId: String(value.categoryId ?? "cat-disposable"),
    productKind: value.productKind ?? "disposable",
    salesChannels: Array.isArray(value.salesChannels) ? value.salesChannels : ["retail"],
    shortDescriptionFa: value.shortDescriptionFa,
    descriptionFa: value.descriptionFa,
    image: value.image,
    tags: Array.isArray(value.tags) ? value.tags : [],
    specs: Array.isArray(value.specs) ? value.specs : [],
    retailPriceRial: Number(value.retailPriceRial ?? 0),
    wholesalePriceRial:
      value.wholesalePriceRial === undefined ? undefined : Number(value.wholesalePriceRial),
    wholesaleEnabled: Boolean(value.wholesaleEnabled),
    cartonSize: value.cartonSize === undefined ? undefined : Number(value.cartonSize),
    minWholesaleCartonCount:
      value.minWholesaleCartonCount === undefined
        ? undefined
        : Number(value.minWholesaleCartonCount),
    onHand: value.onHand === undefined ? undefined : Number(value.onHand),
    reserved: value.reserved === undefined ? undefined : Number(value.reserved),
    restockThreshold:
      value.restockThreshold === undefined ? undefined : Number(value.restockThreshold),
    isActive: value.isActive === undefined ? true : Boolean(value.isActive),
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const row = await saveAdminProduct(parseInput(productId, await req.json()));
    return NextResponse.json({ row, message: "محصول به‌روزرسانی شد." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "به‌روزرسانی محصول ناموفق بود." },
      { status: 400 },
    );
  }
}
