import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LockKeyhole, ShieldCheck, UserCog } from "lucide-react";
import { AdminLoginClient } from "@/components/admin/admin-login-client";

export const metadata: Metadata = {
  title: "ورود ادمین",
  robots: { index: false, follow: false },
};

const securityNotes = [
  {
    icon: LockKeyhole,
    title: "دسترسی محدود",
    text: "این صفحه فقط برای مدیریت فروشگاه یوفوپاف است.",
  },
  {
    icon: ShieldCheck,
    title: "محافظت محلی",
    text: "ورود با نام کاربری و رمز عبور تنظیم‌شده در محیط اجرا انجام می‌شود.",
  },
];

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-8 text-[#111827]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_28rem]">
        <section className="hidden lg:block">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#D7DDE4] bg-white px-4 py-2 text-sm font-bold text-[#475569] shadow-sm">
            <UserCog size={18} className="text-[#2563EB]" aria-hidden="true" />
            پنل مدیریت یوفوپاف
          </div>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.25]">
            ورود امن به مدیریت سفارش‌ها، محصولات و موجودی
          </h1>
          <p className="mt-5 max-w-xl leading-8 text-[#5F6C79]">
            این بخش برای عملیات داخلی فروشگاه طراحی شده است؛ فرم کوتاه، پیام خطای واضح و مسیر بازگشت
            بعد از ورود دارد.
          </p>
          <div className="mt-8 grid max-w-2xl gap-4 md:grid-cols-2">
            {securityNotes.map((item) => (
              <article
                key={item.title}
                className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-sm"
              >
                <item.icon size={22} className="text-[#2563EB]" aria-hidden="true" />
                <h2 className="mt-4 font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#5F6C79]">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#D7DDE4] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7">
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 shrink-0">
              <Image
                src="/logos/logo.png"
                alt="لوگوی پنل مدیریت یوفوپاف"
                fill
                sizes="48px"
                className="object-contain"
                priority
                unoptimized
              />
            </span>
            <div>
              <p className="text-sm font-bold text-[#5F6C79]">UFO Puff Admin</p>
              <h1 className="text-2xl font-black">ورود ادمین</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-[#5F6C79]">
            برای ادامه، نام کاربری و رمز عبور مدیریت را وارد کنید.
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <AdminLoginClient />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
