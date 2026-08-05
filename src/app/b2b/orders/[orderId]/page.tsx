import { notFound } from "next/navigation";
import { getSubmittedOrder, orderStatusLabelsFa, paymentStatusLabelsFa } from "@ufo/orders";
import { Price, StatusPill } from "@ufo/ui";
import { B2BOrderChatClient } from "@/components/b2b/b2b-order-chat-client";

export const dynamic = "force-dynamic";

export default async function B2BOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getSubmittedOrder(orderId);
  if (!order || order.channel !== "wholesale") notFound();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-5">
        <div>
          <h1 className="text-3xl font-black">سفارش عمده {order.orderNumber}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="info">{orderStatusLabelsFa[order.status]}</StatusPill>
            <StatusPill tone={order.paymentStatus === "approved" ? "success" : "warning"}>
              {paymentStatusLabelsFa[order.paymentStatus]}
            </StatusPill>
          </div>
        </div>
        <section className="rounded-md border border-[#D5D9C9] bg-white p-5">
          <h2 className="text-xl font-bold">اقلام عمده</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div
                key={item.sku}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#F7F7F2] p-3"
              >
                <div>
                  <p className="font-bold">{item.productName}</p>
                  <p className="mt-1 text-sm text-[#596B61]">
                    {item.variantName} · {item.cartonCount?.toLocaleString("fa-IR") ?? "۰"} کارتن ·{" "}
                    {item.quantity.toLocaleString("fa-IR")} عدد
                  </p>
                </div>
                <Price valueRial={item.totalRial} />
              </div>
            ))}
          </div>
        </section>
        <B2BOrderChatClient orderId={order.id} />
      </section>
      <aside className="h-fit rounded-md border border-[#D5D9C9] bg-[#14201B] p-5 text-white">
        <h2 className="text-lg font-bold">پیش‌فاکتور</h2>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span>جمع کالاها</span>
            <Price valueRial={order.subtotalRial} />
          </div>
          <div className="flex justify-between gap-3">
            <span>{order.shippingTitleFa}</span>
            <Price valueRial={order.shippingRial} />
          </div>
          <div className="mt-3 flex justify-between gap-3 border-t border-white/15 pt-3 text-lg font-black">
            <span>مبلغ نهایی</span>
            <Price valueRial={order.totalRial} />
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-white/65">زمان تخمینی ارسال: {order.etaFa}</p>
        <div className="mt-5 border-t border-white/15 pt-4">
          <h3 className="font-bold">روند سفارش</h3>
          <div className="mt-3 grid gap-3 text-sm">
            {order.timeline.map((event) => (
              <div key={event.id} className="rounded-md bg-white/10 p-3">
                <p>{event.labelFa}</p>
                <time className="mt-1 block text-white/65">
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
