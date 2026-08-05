import { ProductManager } from "@/components/admin/product-manager";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">مدیریت محصولات</h1>
          <p className="mt-2 text-[#5F6C79]">
            ایجاد، ویرایش، قیمت‌گذاری و فعال‌سازی کانال تک‌فروشی یا عمده برای محصولات.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <ProductManager />
      </div>
    </main>
  );
}
