import Link from "next/link";
import {
  ArrowRight,
  ArrowUpLeft,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
} from "lucide-react";
import { Price, StatusPill } from "@ufo/ui";
import { orderStatusLabelsFa, paymentStatusLabelsFa, type SubmittedOrder } from "@ufo/orders";
import { AdminOrderChatClient } from "@/components/admin/admin-order-chat-client";
import { AdminPaymentReview } from "@/components/admin/admin-payment-review";
import { AdminOrderFulfillment } from "@/components/admin/admin-order-fulfillment";
import { StorefrontProductImage } from "@/components/storefront-product-image";

const panel = "min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm";
const date = (value: string) =>
  new Date(value).toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export function AdminOrderDetail({
  order,
  images,
}: {
  order: SubmittedOrder;
  images: Record<string, string>;
}) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const steps = ["ثبت سفارش", "بررسی پرداخت", "آماده‌سازی", "تحویل سفارش"];
  const currentStep = ["delivered", "shipped", "ready_for_pickup"].includes(order.status)
    ? 3
    : order.paymentStatus === "approved"
      ? 2
      : order.receipts?.length
        ? 1
        : 0;
  const terminal = order.status === "cancelled" || order.status === "returned";
  return (
    <main className="mx-auto grid max-w-[1440px] gap-5 px-4 py-6 text-slate-900 sm:px-6 [color-scheme:light]">
      <nav aria-label="مسیر صفحه" className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/orders"
          className="inline-flex min-h-9 items-center gap-2 hover:text-cyan-700"
        >
          <ArrowRight size={15} /> سفارش‌ها
        </Link>
        <span>/</span>
        <span>جزئیات سفارش</span>
      </nav>
      <header className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-cyan-300 sm:flex">
              <ReceiptText size={27} />
            </span>
            <div className="min-w-0">
              <p className="mb-1.5 text-xs font-bold text-slate-500">
                {order.channel === "wholesale" ? "سفارش عمده" : "سفارش خرده‌فروشی"}
              </p>
              <h1 className="break-all text-xl font-black tracking-tight sm:text-2xl">
                <span className="sr-only">سفارش </span>
                <bdi>{order.orderNumber}</bdi>
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays size={13} /> ثبت در {date(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              tone={
                terminal ? "danger" : order.paymentStatus === "approved" ? "success" : "warning"
              }
            >
              {orderStatusLabelsFa[order.status]}
            </StatusPill>
            <StatusPill tone="neutral">
              {order.channel === "wholesale" ? "عمده" : "خرده‌فروشی"}
            </StatusPill>
          </div>
        </div>
        {!terminal && (
          <ol
            aria-label="مراحل سفارش"
            className="grid grid-cols-4 border-t border-slate-100 bg-slate-50/70 px-3 py-4 sm:px-6"
          >
            {steps.map((step, i) => (
              <li
                key={step}
                aria-current={i === currentStep ? "step" : undefined}
                className="relative flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-3"
              >
                <span
                  className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < currentStep ? "bg-emerald-100 text-emerald-700" : i === currentStep ? "bg-cyan-700 text-white ring-4 ring-cyan-700/10" : "border border-slate-200 bg-white text-slate-400"}`}
                >
                  {i < currentStep ? <Check size={14} /> : (i + 1).toLocaleString("fa-IR")}
                </span>
                <span
                  className={`text-[10px] sm:text-xs ${i === currentStep ? "font-bold text-cyan-800" : "text-slate-500"}`}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "مبلغ نهایی سفارش",
            value: <Price valueRial={order.totalRial} />,
            icon: CreditCard,
          },
          { label: "روش ارسال", value: order.shippingTitleFa, icon: Truck },
          {
            label: "وضعیت پرداخت",
            value: paymentStatusLabelsFa[order.paymentStatus],
            icon: Clock3,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${panel} flex items-center gap-3 p-4`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
              <Icon size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{label}</p>
              <div className="mt-1.5 text-sm font-extrabold sm:text-base">{value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-5">
          <section className={panel}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-extrabold">
                <Package size={18} className="text-cyan-700" /> اقلام سفارش
              </h2>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                {count.toLocaleString("fa-IR")} عدد · {order.items.length.toLocaleString("fa-IR")}{" "}
                ردیف
              </span>
            </div>
            <div className="divide-y divide-slate-100 px-4 sm:px-5">
              {order.items.map((item, index) => (
                <article
                  key={`${item.sku}-${index}`}
                  className="flex items-start gap-3 py-5 sm:items-center sm:gap-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1 sm:h-24 sm:w-24">
                    <StorefrontProductImage
                      src={images[item.sku] ?? ""}
                      fallbackSrc="/images/categories/lighter.png"
                      alt={item.productName}
                      className="h-full w-full object-contain"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-7 sm:text-base">
                        {item.productName}
                      </h3>
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {item.variantName} · {item.quantity.toLocaleString("fa-IR")} عدد
                        {item.cartonCount
                          ? ` · ${item.cartonCount.toLocaleString("fa-IR")} کارتن`
                          : ""}
                      </p>
                      <span
                        dir="ltr"
                        className="mt-1 block break-all font-mono text-[10px] text-slate-400"
                      >
                        {item.sku}
                      </span>
                    </div>
                    <div className="shrink-0">
                      <Price valueRial={item.totalRial} className="text-sm font-extrabold" />
                      <p className="mt-1 text-[11px] text-slate-400">
                        هر عدد <Price valueRial={item.unitPriceRial} />
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <AdminPaymentReview key={order.updatedAt} initialOrder={order} />
          <AdminOrderFulfillment key={`delivery-${order.updatedAt}`} initialOrder={order} />
          <details className={`${panel} group overflow-hidden`}>
            <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5">
              <MessageSquare size={19} className="text-slate-500" />
              <span className="text-sm font-bold">گفت‌وگوی پشتیبانی</span>
              <span className="mr-auto text-xs text-slate-400">
                {order.chat.length.toLocaleString("fa-IR")} پیام
              </span>
              <ArrowUpLeft size={16} className="text-slate-400 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-100 p-3">
              <AdminOrderChatClient orderId={order.id} />
            </div>
          </details>
        </div>
        <aside className="grid min-w-0 gap-5">
          <section className={`${panel} p-5`}>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
              <UserRound size={17} className="text-cyan-700" /> مشتری و تحویل‌گیرنده
            </h2>
            <p className="font-bold">{order.customer.businessName ?? order.customer.fullName}</p>
            {order.customer.businessName && (
              <p className="mt-1 text-xs text-slate-500">{order.customer.fullName}</p>
            )}
            <a
              href={`tel:${order.customer.phone}`}
              className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-700"
            >
              <Phone size={14} />
              <bdi>{order.customer.phone}</bdi>
            </a>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <MapPin size={15} /> آدرس تحویل
              </p>
              <p className="mt-2 text-sm leading-7">
                {order.shippingAddress.province}، {order.shippingAddress.city}،{" "}
                {order.shippingAddress.line1}
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                گیرنده: {order.shippingAddress.receiverName} ·{" "}
                <bdi>{order.shippingAddress.receiverPhone}</bdi>
              </p>
              {order.shippingAddress.postalCode && (
                <p className="mt-2 text-xs text-slate-500">
                  کد پستی: <bdi>{order.shippingAddress.postalCode}</bdi>
                </p>
              )}
              {order.shippingAddress.location && (
                <a
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-700"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${order.shippingAddress.location.latitude}&mlon=${order.shippingAddress.location.longitude}#map=17/${order.shippingAddress.location.latitude}/${order.shippingAddress.location.longitude}`}
                >
                  مشاهده روی نقشه <ArrowUpLeft size={14} />
                </a>
              )}
            </div>
          </section>
          <section className={`${panel} p-5`}>
            <h2 className="mb-4 text-sm font-extrabold">خلاصه مالی</h2>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">جمع کالاها</dt>
                <dd>
                  <Price valueRial={order.subtotalRial} />
                </dd>
              </div>
              {order.discountRial > 0 && (
                <div className="flex justify-between gap-3 text-emerald-700">
                  <dt>تخفیف</dt>
                  <dd>
                    <Price valueRial={order.discountRial} />
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">هزینه ارسال</dt>
                <dd>
                  <Price valueRial={order.shippingRial} />
                </dd>
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-2 rounded-xl bg-slate-900 p-3 text-white">
                <dt>مبلغ نهایی</dt>
                <dd className="font-extrabold">
                  <Price valueRial={order.totalRial} />
                </dd>
              </div>
            </dl>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
              <p className="font-bold text-slate-700">
                {order.shippingScope === "pickup" || order.shippingMethod === "pickup"
                  ? "زمان تقریبی آماده‌شدن"
                  : "زمان تقریبی ارسال"}
              </p>
              {order.estimatedDispatchAt
                ? date(order.estimatedDispatchAt)
                : "هنگام تأیید پرداخت تعیین می‌شود."}
              <p className="mt-1">مدت حمل: {order.etaFa}</p>
            </div>
            {order.receiptNote && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-500">یادداشت سفارش</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{order.receiptNote}</p>
              </div>
            )}
          </section>
          <section className={`${panel} p-5`}>
            <h2 className="mb-5 flex items-center gap-2 text-sm font-extrabold">
              <Clock3 size={16} className="text-slate-500" /> تاریخچه سفارش
            </h2>
            <ol className="grid gap-5">
              {order.timeline.map((event, index) => (
                <li key={event.id} className="relative border-r border-slate-200 pr-4">
                  <span
                    className={`absolute -right-[5px] top-1 h-2 w-2 rounded-full ring-4 ring-white ${index === 0 ? "bg-cyan-600" : "bg-slate-300"}`}
                  />
                  <p className="text-xs leading-6 text-slate-600">{event.labelFa}</p>
                  <time
                    dateTime={event.createdAt}
                    className="mt-1 block text-[10px] leading-5 text-slate-400"
                  >
                    {date(event.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
