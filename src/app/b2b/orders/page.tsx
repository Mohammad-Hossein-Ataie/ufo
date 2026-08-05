import { B2BOrdersClient } from "@/components/b2b/b2b-orders-client";

export default function B2BOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black">سفارش‌های عمده</h1>
      <p className="mt-2 text-[#596B61]">
        فقط سفارش‌های ثبت‌شده با موبایل حساب عمده فعلی نمایش داده می‌شود.
      </p>
      <div className="mt-6">
        <B2BOrdersClient />
      </div>
    </main>
  );
}
