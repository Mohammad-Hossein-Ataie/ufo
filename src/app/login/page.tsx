import type { Metadata } from "next";
import { Suspense } from "react";
import { PhoneLoginClient } from "@/components/phone-login-client";

export const metadata: Metadata = {
  title: "ورود",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-black">ورود با کد یک‌بارمصرف</h1>
      <p className="mt-2 text-sm leading-7 text-[#9BA7B4]">
        در نسخه mock شماره موبایل session خرید تکی را می‌سازد و برای ثبت سفارش استفاده می‌شود.
      </p>
      <Suspense fallback={null}>
        <PhoneLoginClient />
      </Suspense>
    </main>
  );
}
