import { notFound } from "next/navigation";
import { getSubmittedOrder } from "@ufo/orders";
import { AdminOrderDetail } from "@/components/admin/admin-order-detail";
import { listCatalogRows } from "@/lib/catalog-data";
import { getProductImage } from "@/lib/product-images";
import { protectedAssetUrl } from "@/lib/product-image-protection";

export const dynamic = "force-dynamic";
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getSubmittedOrder(orderId);
  if (!order) notFound();
  const catalog = await listCatalogRows();
  const bySku = new Map(catalog.map((row) => [row.variant.sku, row.product]));
  const images = Object.fromEntries(
    order.items.map((item) => {
      const product = bySku.get(item.sku);
      return [
        item.sku,
        product ? getProductImage(product) : (protectedAssetUrl(item.image, "card") ?? ""),
      ];
    }),
  );
  return <AdminOrderDetail order={order} images={images} />;
}
