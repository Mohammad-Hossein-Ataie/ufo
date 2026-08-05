import type { Metadata } from "next";
import { AdminOrdersClient } from "@/components/admin/admin-orders-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سفارش‌ها",
};

export default function AdminOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">سفارش‌ها</h1>
      <p className="mt-2 text-[#5F6C79]">
        سفارش‌های فروش تکی و عمده از store مشترک خوانده می‌شود؛ تایید پرداخت، آماده‌سازی، ارسال و
        تحویل از همین صفحه ثبت می‌شود.
      </p>
      <div className="mt-6">
        <AdminOrdersClient />
      </div>
    </main>
  );
}
