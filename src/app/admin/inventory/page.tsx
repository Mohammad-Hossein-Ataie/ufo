import { InventoryTable } from "@/components/admin/inventory-table";

export default function InventoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">مدیریت موجودی</h1>
      <p className="mt-2 text-[#5F6C79]">
        جدول با TanStack Table ساخته شده و برای گردش موجودی و bulk action قابل توسعه است.
      </p>
      <div className="mt-6">
        <InventoryTable />
      </div>
    </main>
  );
}
