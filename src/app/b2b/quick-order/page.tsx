import { QuickOrderClient } from "@/components/b2b/quick-order-client";

export default function QuickOrderPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black">سفارش سریع کارتن</h1>
      <p className="mt-2 text-[#596B61]">تعداد کمتر از حداقل همکاری در لحظه ثبت رد می‌شود.</p>
      <div className="mt-6">
        <QuickOrderClient />
      </div>
    </main>
  );
}
