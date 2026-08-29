import { InventoryTable } from "@/components/admin/inventory-table";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default function InventoryPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="انبارداری یوفوپاف"
        title="پایش موجودی و ریسک شارژ"
        description="موجودی قابل فروش، رزرو سفارش‌ها، نقطه هشدار و ارزش موجودی عمده را برای تصمیم‌های روزانه انبار کنترل کنید."
      />
      <InventoryTable />
    </AdminPage>
  );
}
