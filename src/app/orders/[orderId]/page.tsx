import { notFound } from "next/navigation";
import { getSubmittedOrder, orderStatusLabelsFa, paymentStatusLabelsFa } from "@ufo/orders";
import { Price, StatusPill } from "@ufo/ui";
import { OrderChatClient } from "@/components/order-chat-client";

export const dynamic = "force-dynamic";

export default async function RetailOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getSubmittedOrder(orderId);
  if (!order || order.channel !== "retail") notFound();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-5">
        <div>
          <h1 className="text-3xl font-black">سفارش {order.orderNumber}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="info">{orderStatusLabelsFa[order.status]}</StatusPill>
            <StatusPill tone={order.paymentStatus === "approved" ? "success" : "warning"}>
              {paymentStatusLabelsFa[order.paymentStatus]}
            </StatusPill>
          </div>
        </div>
        <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
          <h2 className="text-xl font-bold">اقلام سفارش</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div
                key={item.sku}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/5 p-3"
              >
                <div>
                  <p className="font-bold">{item.productName}</p>
                  <p className="mt-1 text-sm text-[#9BA7B4]">
                    {item.variantName} · تعداد {item.quantity.toLocaleString("fa-IR")}
                  </p>
                </div>
                <Price valueRial={item.totalRial} />
              </div>
            ))}
          </div>
        </section>
        <OrderChatClient orderId={order.id} />
      </section>
      <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5">
        <h2 className="text-lg font-bold">خلاصه سفارش</h2>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span>جمع کالاها</span>
            <Price valueRial={order.subtotalRial} />
          </div>
          <div className="flex justify-between gap-3">
            <span>{order.shippingTitleFa}</span>
            <Price valueRial={order.shippingRial} />
          </div>
          <div className="mt-3 flex justify-between gap-3 border-t border-[#22303D] pt-3 text-lg font-black">
            <span>مبلغ نهایی</span>
            <Price valueRial={order.totalRial} />
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#9BA7B4]">زمان تخمینی ارسال: {order.etaFa}</p>
        <div className="mt-5 border-t border-[#22303D] pt-4">
          <h3 className="font-bold">روند سفارش</h3>
          <div className="mt-3 grid gap-3 text-sm">
            {order.timeline.map((event) => (
              <div key={event.id} className="rounded-md bg-white/5 p-3">
                <p>{event.labelFa}</p>
                <time className="mt-1 block text-[#9BA7B4]">
                  {new Date(event.createdAt).toLocaleString("fa-IR")}
                </time>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
