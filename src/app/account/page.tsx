import type { Metadata } from "next";
import { AccountClient } from "@/components/account-client";

export const metadata: Metadata = {
  title: "حساب کاربری",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black">حساب کاربری</h1>
      <p className="mt-2 text-[#9BA7B4]">
        پروفایل، سفارش‌های اخیر و خریدهای تکراری خود را مدیریت کنید.
      </p>
      <div className="mt-6">
        <AccountClient />
      </div>
    </main>
  );
}
