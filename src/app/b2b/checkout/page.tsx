import { B2BCheckoutClient } from "@/components/b2b/b2b-checkout-client";

export default function B2BCheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">ثبت سفارش عمده</h1>
      <p className="mt-2 text-[#596B61]">
        پس از ثبت، پیش‌فاکتور و رسید پرداخت برای ادمین ارسال می‌شود و وضعیت سفارش به‌روزرسانی خواهد شد.
      </p>
      <div className="mt-6">
        <B2BCheckoutClient />
      </div>
    </main>
  );
}
