import type { Metadata } from "next";
import { AdminOrdersClient } from "@/components/admin/admin-orders-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سفارش‌ها",
};

export default function AdminOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-[#168BFF]">مرکز عملیات سفارش</p>
        <h1 className="mt-2 text-3xl font-black leading-[1.25]">سفارش‌ها</h1>
        <p className="mt-3 max-w-3xl leading-7 text-[#5F6C79]">
          سفارش‌های فروش تکی و عمده را از یک صف مشترک مدیریت کنید؛ تایید پرداخت، آماده‌سازی، خروج
          انبار، ارسال و تحویل باید با کمترین کلیک و بیشترین وضوح انجام شود.
        </p>
      </section>
      <div className="mt-6">
        <AdminOrdersClient />
      </div>
    </main>
  );
}
