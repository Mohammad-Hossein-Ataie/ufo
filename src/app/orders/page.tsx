import type { Metadata } from "next";
import { OrdersClient } from "@/components/orders-client";

export const metadata: Metadata = {
  title: "سفارش‌های من",
  robots: { index: false, follow: false }
};

export default function RetailOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black">سفارش‌های من</h1>
      <p className="mt-2 text-[#9BA7B4]">فقط سفارش‌های فروش تکی مربوط به موبایل واردشده نمایش داده می‌شود.</p>
      <div className="mt-6">
        <OrdersClient />
      </div>
    </main>
  );
}
