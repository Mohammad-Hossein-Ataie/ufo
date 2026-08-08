import { InventoryTable } from "@/components/admin/inventory-table";

export default function InventoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-[#168BFF]">انبارداری یوفوپاف</p>
        <h1 className="mt-2 text-3xl font-black leading-[1.25]">مدیریت و پایش موجودی</h1>
        <p className="mt-3 max-w-3xl leading-7 text-[#5F6C79]">
          موجودی پاد، ویپ، جویس، کویل و اکسسوری را برای فروش تکی و عمده کنترل کنید؛ ریسک شارژ، رزرو
          سفارش‌ها و ارزش موجودی قابل فروش در همین صفحه دیده می‌شود.
        </p>
      </div>
      <div className="mt-6">
        <InventoryTable />
      </div>
    </main>
  );
}
