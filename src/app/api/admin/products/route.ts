import { NextResponse } from "next/server";
import { categories, brands } from "@ufo/domain";
import { listAdminProducts, saveAdminProduct, type AdminProductInput } from "@/lib/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseInput(body: unknown): AdminProductInput {
  const value = body as Partial<AdminProductInput>;
  return {
    id: value.id,
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
    images: Array.isArray(value.images) ? value.images.map(String) : [],
    tags: Array.isArray(value.tags) ? value.tags : [],
    specs: Array.isArray(value.specs) ? value.specs : [],
    colorIds: Array.isArray(value.colorIds) ? value.colorIds.map(String) : [],
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

export async function GET() {
  const rows = await listAdminProducts();
  return NextResponse.json({ rows, categories, brands });
}

export async function POST(req: Request) {
  try {
    const input = parseInput(await req.json());
    const row = await saveAdminProduct(input);
    return NextResponse.json({ row, message: "محصول ذخیره شد." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره محصول ناموفق بود." },
      { status: 400 },
    );
  }
}
