import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Boxes,
  ClipboardList,
  Clock3,
  FileText,
  MessageSquare,
  Package,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  Warehouse,
} from "lucide-react";
import { Price, StatusPill } from "@ufo/ui";
import { categories, inventoryItems, products, variants } from "@ufo/domain";
import { listSubmittedOrders, orderStatusLabelsFa, type SubmittedOrder } from "@ufo/orders";
import type { InventoryItem, OrderStatus, ProductVariant, SalesChannel } from "@ufo/types";

export const dynamic = "force-dynamic";

const terminalStatuses: OrderStatus[] = ["delivered", "cancelled", "returned"];
const activeStatuses: OrderStatus[] = [
  "payment_under_review",
  "confirmed",
  "processing",
  "ready_for_pickup",
  "shipped",
];

const statusTone: Partial<
  Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info">
> = {
  payment_under_review: "warning",
  confirmed: "info",
  processing: "info",
  ready_for_pickup: "success",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
  returned: "warning",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isToday(value: string) {
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function sumOrders(orders: SubmittedOrder[]) {
  return orders.reduce((sum, order) => sum + order.totalRial, 0);
}

function findVariant(variantId: string): ProductVariant | undefined {
  return variants.find((variant) => variant.id === variantId);
}

function productNameForVariant(variantId: string) {
  const variant = findVariant(variantId);
  const product = variant ? products.find((item) => item.id === variant.productId) : undefined;
  return product?.nameFa ?? variantId;
}

function inventoryRisk(item: InventoryItem) {
  const available = item.onHand - item.reserved;
  const ratio = item.restockThreshold > 0 ? available / item.restockThreshold : available;
  if (available <= 0) return { available, label: "اتمام موجودی", tone: "danger" as const, ratio };
  if (available <= item.restockThreshold) {
    return { available, label: "نیازمند شارژ", tone: "warning" as const, ratio };
  }
  return { available, label: "پایدار", tone: "success" as const, ratio };
}

function channelLabel(channel: SalesChannel) {
  return channel === "wholesale" ? "عمده" : "تکی";
}

export default function AdminDashboardPage() {
  const orders = listSubmittedOrders();
  const todayOrders = orders.filter((order) => isToday(order.createdAt));
  const retailOrders = orders.filter((order) => order.channel === "retail");
  const wholesaleOrders = orders.filter((order) => order.channel === "wholesale");
  const openOrders = orders.filter((order) => !terminalStatuses.includes(order.status));
  const paymentReviewOrders = orders.filter((order) => order.paymentStatus === "pending_review");
  const activeChatOrders = orders.filter((order) => order.chat.length > 0);
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const totalRevenue = sumOrders(orders);
  const todayRevenue = sumOrders(todayOrders);
  const retailRevenue = sumOrders(retailOrders);
  const wholesaleRevenue = sumOrders(wholesaleOrders);
  const averageOrderRial = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const deliveredRate =
    orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0;

  const inventoryRows = inventoryItems.map((item) => {
    const risk = inventoryRisk(item);
    return {
      ...item,
      ...risk,
      productName: productNameForVariant(item.variantId),
    };
  });
  const urgentInventory = inventoryRows
    .filter((item) => item.tone !== "success")
    .sort((left, right) => left.available - right.available)
    .slice(0, 6);
  const stableInventoryCount = inventoryRows.filter((item) => item.tone === "success").length;
  const stockoutCount = inventoryRows.filter((item) => item.available <= 0).length;
  const totalAvailableUnits = inventoryRows.reduce(
    (sum, item) => sum + Math.max(0, item.available),
    0,
  );
  const inventoryValueRial = inventoryRows.reduce((sum, item) => {
    const variant = findVariant(item.variantId);
    return sum + Math.max(0, item.available) * (variant?.retailPriceRial ?? 0);
  }, 0);

  const orderStatusCounts = activeStatuses.map((status) => ({
    status,
    label: orderStatusLabelsFa[status],
    count: orders.filter((order) => order.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...orderStatusCounts.map((item) => item.count));

  const channelCards = [
    {
      title: "فروش تکی",
      orders: retailOrders.length,
      revenue: retailRevenue,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      title: "فروش عمده",
      orders: wholesaleOrders.length,
      revenue: wholesaleRevenue,
      icon: Warehouse,
      href: "/admin/orders",
    },
  ];

  const kpis = [
    {
      title: "فروش امروز",
      value: <Price valueRial={todayRevenue} />,
      meta: `${formatNumber(todayOrders.length)} سفارش امروز`,
      icon: TrendingUp,
    },
    {
      title: "درآمد کل",
      value: <Price valueRial={totalRevenue} />,
      meta: `${formatNumber(orders.length)} سفارش ثبت‌شده`,
      icon: Banknote,
    },
    {
      title: "در انتظار بررسی",
      value: formatNumber(paymentReviewOrders.length),
      meta: "رسید یا پرداخت نیازمند تصمیم",
      icon: Clock3,
    },
    {
      title: "میانگین سبد",
      value: <Price valueRial={averageOrderRial} />,
      meta: `${formatNumber(deliveredRate)}٪ تحویل‌شده`,
      icon: PackageCheck,
    },
    {
      title: "موجودی قابل فروش",
      value: formatNumber(totalAvailableUnits),
      meta: `${formatNumber(stockoutCount)} اتمام موجودی`,
      icon: Boxes,
    },
    {
      title: "ارزش موجودی",
      value: <Price valueRial={inventoryValueRial} />,
      meta: `${formatNumber(stableInventoryCount)} آیتم پایدار`,
      icon: Package,
    },
    {
      title: "چت فعال",
      value: formatNumber(activeChatOrders.length),
      meta: "گفتگوهای نیازمند پیگیری",
      icon: MessageSquare,
    },
    {
      title: "محصول فعال",
      value: formatNumber(products.filter((product) => product.isActive).length),
      meta: `${formatNumber(categories.length)} دسته‌بندی`,
      icon: ClipboardList,
    },
  ];

  const recentOrders = orders.slice(0, 6);
  const topProducts = new Map<string, { name: string; quantity: number; revenue: number }>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = topProducts.get(item.sku) ?? {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      topProducts.set(item.sku, {
        name: current.name,
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.totalRial,
      });
    });
  });
  const topProductRows = Array.from(topProducts.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold text-[#168BFF]">داشبورد مدیریتی یوفوپاف</p>
            <h1 className="mt-2 text-3xl font-black leading-[1.25] sm:text-4xl">
              نمای عملیات فروش، عمده، موجودی و پشتیبانی
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-[#5F6C79]">
              این صفحه برای تصمیم روزانه مدیر ساخته شده است: چه چیزی باید تایید شود، کدام سفارش گیر
              کرده، چه موجودی در خطر است و فروش از کدام کانال می‌آید.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-md border border-[#D7DDE4] bg-[#F4F6F8] p-4">
              <div className="text-2xl font-black tabular-nums">
                {formatNumber(openOrders.length)}
              </div>
              <div className="mt-1 text-xs text-[#5F6C79]">سفارش باز</div>
            </div>
            <div className="rounded-md border border-[#D7DDE4] bg-[#F4F6F8] p-4">
              <div className="text-2xl font-black tabular-nums">
                {formatNumber(urgentInventory.length)}
              </div>
              <div className="mt-1 text-xs text-[#5F6C79]">ریسک موجودی</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((stat) => (
          <article
            key={stat.title}
            className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[#5F6C79]">{stat.title}</p>
                <div className="mt-2 text-2xl font-black tabular-nums">{stat.value}</div>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#EEF3F8] text-[#168BFF]">
                <stat.icon size={22} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#5F6C79]">{stat.meta}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {channelCards.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#5F6C79]">{item.title}</p>
                <div className="mt-2 text-2xl font-black">
                  <Price valueRial={item.revenue} />
                </div>
                <p className="mt-2 text-sm text-[#5F6C79]">{formatNumber(item.orders)} سفارش</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#EEF3F8] text-[#168BFF]">
                <item.icon size={24} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">قیف وضعیت سفارش‌ها</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-[#168BFF]">
              مشاهده همه
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {orderStatusCounts.map((item) => (
              <div key={item.status} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.label}</span>
                  <span className="font-bold tabular-nums">{formatNumber(item.count)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EEF3F8]">
                  <div
                    className="h-full rounded-full bg-[#168BFF]"
                    style={{ width: `${Math.max(6, (item.count / maxStatusCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">ریسک‌های موجودی</h2>
            <Link href="/admin/inventory" className="text-sm font-bold text-[#168BFF]">
              مدیریت موجودی
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {urgentInventory.length > 0 ? (
              urgentInventory.map((item) => (
                <div key={item.id} className="rounded-md bg-[#F4F6F8] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.productName}</p>
                      <p className="mt-1 text-xs text-[#5F6C79]" dir="ltr">
                        {item.variantId}
                      </p>
                    </div>
                    <StatusPill tone={item.tone}>{item.label}</StatusPill>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#5F6C79]">
                    <span>قابل فروش: {formatNumber(item.available)}</span>
                    <span>حد شارژ: {formatNumber(item.restockThreshold)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                موجودی‌های بحرانی دیده نشدند.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">سفارش‌های اخیر</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-[#168BFF]">
              همه سفارش‌ها
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid gap-3 rounded-md border border-[#E5EAF0] bg-[#F8FAFC] p-4 transition hover:border-[#168BFF] sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold" dir="ltr">
                        {order.orderNumber}
                      </span>
                      <StatusPill tone={order.channel === "wholesale" ? "success" : "info"}>
                        {channelLabel(order.channel)}
                      </StatusPill>
                      <StatusPill tone={statusTone[order.status] ?? "neutral"}>
                        {orderStatusLabelsFa[order.status]}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-[#5F6C79]">
                      {order.customer.businessName ?? order.customer.fullName} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-left font-black">
                    <Price valueRial={order.totalRial} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#CBD5E1] p-6 text-center text-sm text-[#5F6C79]">
                هنوز سفارشی ثبت نشده است.
              </div>
            )}
          </div>
        </article>

        <div className="grid gap-4">
          <article className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">محصولات پرفروش</h2>
            <div className="mt-5 grid gap-3">
              {topProductRows.length > 0 ? (
                topProductRows.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      <p className="mt-1 text-xs text-[#5F6C79]">
                        {formatNumber(item.quantity)} عدد
                      </p>
                    </div>
                    <span className="text-sm font-black">
                      <Price valueRial={item.revenue} />
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-[#5F6C79]">
                  بعد از ثبت سفارش، رتبه محصولات اینجا می‌آید.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-md border border-[#D7DDE4] bg-[#17202A] p-5 text-white shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 text-amber-300" size={22} aria-hidden="true" />
              <div>
                <h2 className="text-xl font-black">اولویت‌های امروز</h2>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  ابتدا رسیدهای در انتظار، بعد سفارش‌های آماده‌سازی و سپس ریسک موجودی را بررسی کنید.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              {[
                { href: "/admin/orders", label: "بررسی سفارش‌ها", icon: FileText },
                { href: "/admin/chat", label: "پاسخ به چت‌ها", icon: MessageSquare },
                { href: "/admin/products", label: "مدیریت محصولات", icon: Package },
                { href: "/admin/inventory", label: "شارژ موجودی", icon: Truck },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center justify-between rounded-md bg-white/10 px-3 text-sm font-bold transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <item.icon size={17} aria-hidden="true" />
                    {item.label}
                  </span>
                  <ArrowLeft size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
