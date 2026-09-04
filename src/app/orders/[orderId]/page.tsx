import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/order-detail-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جزئیات سفارش",
  robots: { index: false, follow: false },
};

export default async function RetailOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderDetailClient orderId={orderId} channel="retail" />;
}
