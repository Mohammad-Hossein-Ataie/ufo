import type { Metadata } from "next";
import { AdminOrdersClient } from "@/components/admin/admin-orders-client";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سفارش‌ها",
};

export default function AdminOrdersPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="مرکز عملیات سفارش"
        title="صف سفارش‌های نیازمند اقدام"
        description="سفارش‌های تکی و عمده را از یک نمای عملیاتی کنترل کنید؛ تایید پرداخت، آماده‌سازی، خروج انبار و ارسال باید سریع و قابل ردیابی باشد."
      />
      <AdminOrdersClient />
    </AdminPage>
  );
}
