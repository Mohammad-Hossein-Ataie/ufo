import { Boxes, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { Price, StatusPill } from "@ufo/ui";
import { inventoryItems, products } from "@ufo/domain";
import { listSubmittedOrders } from "@ufo/orders";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const orders = listSubmittedOrders();
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = orders
    .filter((order) => order.createdAt.slice(0, 10) === today)
    .reduce((sum, order) => sum + order.totalRial, 0);
  const openOrders = orders.filter((order) => !["delivered", "cancelled", "returned"].includes(order.status));
  const openChats = orders.filter((order) => order.chat.length > 0);
  const stats = [
    { title: "فروش امروز", value: <Price valueRial={todayRevenue} />, icon: TrendingUp },
    { title: "سفارش باز", value: openOrders.length.toLocaleString("fa-IR"), icon: FileText },
    { title: "محصول فعال", value: products.length.toLocaleString("fa-IR"), icon: Boxes },
    { title: "چت فعال", value: openChats.length.toLocaleString("fa-IR"), icon: MessageSquare }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">داشبورد</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <section key={stat.title} className="rounded-md border border-[#D7DDE4] bg-white p-5">
            <stat.icon className="text-[#168BFF]" size={24} />
            <p className="mt-4 text-sm text-[#5F6C79]">{stat.title}</p>
            <div className="mt-1 text-2xl font-black">{stat.value}</div>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-md border border-[#D7DDE4] bg-white p-5">
        <h2 className="text-xl font-bold">هشدار موجودی</h2>
        <div className="mt-4 grid gap-3">
          {inventoryItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-[#F4F6F8] p-3">
              <span dir="ltr">{item.variantId}</span>
              <StatusPill tone={item.onHand - item.reserved <= item.restockThreshold ? "warning" : "success"}>
                {item.onHand - item.reserved <= item.restockThreshold ? "نیازمند شارژ" : "پایدار"}
              </StatusPill>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
