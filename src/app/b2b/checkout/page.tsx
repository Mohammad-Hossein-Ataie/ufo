import { B2BCheckoutClient } from "@/components/b2b/b2b-checkout-client";
export const dynamic = "force-dynamic";

export default function B2BCheckoutPage() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">ثبت سفارش عمده</h1>
      <p className="mt-2 text-[#596B61]">
        روش ارسال و پرداخت را انتخاب کنید. پرداخت آنلاین پس از بازگشت از درگاه بررسی می‌شود؛ برای
        کارت‌به‌کارت نیز می‌توانید رسید را بعد از ثبت سفارش بفرستید.
      </p>
      <div className="mt-6">
        <B2BCheckoutClient gatewayEnabled={Boolean(process.env.ZIBAL_MERCHANT?.trim())} />
      </div>
    </main>
  );
}
