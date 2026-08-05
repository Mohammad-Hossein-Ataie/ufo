import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSubmittedOrder, orderStatusLabelsFa, paymentStatusLabelsFa } from "@ufo/orders";
import { Button, Price, StatusPill } from "@ufo/ui";
import { AdminOrderChatClient } from "@/components/admin/admin-order-chat-client";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getSubmittedOrder(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_24rem]">
      <section className="grid gap-5">
        <div>
          <Link href="/admin/orders" className="inline-flex">
            <Button size="sm" variant="secondary">
              <ArrowRight size={16} />
              بازگشت
            </Button>
          </Link>
          <h1 className="mt-4 text-3xl font-black">سفارش {order.orderNumber}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone={order.channel === "wholesale" ? "success" : "info"}>
              {order.channel === "wholesale" ? "عمده" : "تکی"}
            </StatusPill>
            <StatusPill tone="info">{orderStatusLabelsFa[order.status]}</StatusPill>
            <StatusPill tone={order.paymentStatus === "approved" ? "success" : "warning"}>
              {paymentStatusLabelsFa[order.paymentStatus]}
            </StatusPill>
          </div>
        </div>
        <section className="rounded-md border border-[#D7DDE4] bg-white p-5">
          <h2 className="text-xl font-bold">اقلام سفارش</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div
                key={item.sku}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#F4F6F8] p-3"
              >
                <div>
                  <p className="font-bold">{item.productName}</p>
                  <p className="mt-1 text-sm text-[#5F6C79]">
                    {item.variantName} · {item.quantity.toLocaleString("fa-IR")} عدد
                    {item.cartonCount ? ` · ${item.cartonCount.toLocaleString("fa-IR")} کارتن` : ""}
                  </p>
                </div>
                <Price valueRial={item.totalRial} />
              </div>
            ))}
          </div>
        </section>
        <AdminOrderChatClient orderId={order.id} />
      </section>
      <aside className="h-fit rounded-md border border-[#D7DDE4] bg-white p-5">
        <h2 className="text-lg font-bold">اطلاعات سفارش</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <div>
            <p className="text-[#5F6C79]">مشتری</p>
            <p className="font-bold">{order.customer.businessName ?? order.customer.fullName}</p>
            <p dir="ltr">{order.customer.phone}</p>
          </div>
          <div>
            <p className="text-[#5F6C79]">آدرس</p>
            <p className="leading-7">
              {order.shippingAddress.city}، {order.shippingAddress.line1}
            </p>
          </div>
          <div>
            <p className="text-[#5F6C79]">رسید پرداخت</p>
            <p className="leading-7">{order.receiptNote || "رسید/توضیح ثبت نشده است."}</p>
          </div>
          <div className="border-t border-[#D7DDE4] pt-3">
            <div className="flex justify-between gap-3">
              <span>جمع کالاها</span>
              <Price valueRial={order.subtotalRial} />
            </div>
            <div className="mt-2 flex justify-between gap-3">
              <span>{order.shippingTitleFa}</span>
              <Price valueRial={order.shippingRial} />
            </div>
            <div className="mt-3 flex justify-between gap-3 text-lg font-black">
              <span>مبلغ نهایی</span>
              <Price valueRial={order.totalRial} />
            </div>
            <p className="mt-2 text-[#5F6C79]">زمان تخمینی ارسال: {order.etaFa}</p>
          </div>
          <div className="border-t border-[#D7DDE4] pt-3">
            <p className="font-bold">Timeline</p>
            <div className="mt-3 grid gap-2">
              {order.timeline.map((event) => (
                <div key={event.id} className="rounded-md bg-[#F4F6F8] p-3">
                  <p>{event.labelFa}</p>
                  <time className="mt-1 block text-[#5F6C79]">
                    {new Date(event.createdAt).toLocaleString("fa-IR")}
                  </time>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
