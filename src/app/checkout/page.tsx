import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout-client";

export const metadata: Metadata = {
  title: "تسویه حساب",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">تسویه حساب فروش تکی</h1>
      <p className="mt-2 text-[#9BA7B4]">
        پس از ثبت، سفارش برای ادمین ارسال می‌شود و وضعیت پرداخت و ارسال در صفحه سفارش به‌روزرسانی
        می‌شود.
      </p>
      <div className="mt-6">
        <CheckoutClient />
      </div>
    </main>
  );
}
