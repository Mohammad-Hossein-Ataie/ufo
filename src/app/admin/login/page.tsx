import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AdminLoginClient } from "@/components/admin/admin-login-client";

export const metadata: Metadata = {
  title: "ورود ادمین",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="relative h-12 w-12 shrink-0">
          <Image
            src="/logos/logo.png"
            alt="UFO Puff Admin"
            fill
            sizes="48px"
            className="object-contain"
            priority
            unoptimized
          />
        </span>
        <h1 className="text-3xl font-black">ورود ادمین</h1>
      </div>
      <p className="mt-2 text-sm leading-7 text-[#5F6C79]">
        پنل مدیریت با نام کاربری و رمز عبور محلی محافظت می‌شود.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminLoginClient />
        </Suspense>
      </div>
    </main>
  );
}
