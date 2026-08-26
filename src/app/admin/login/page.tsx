import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { KeyRound, LockKeyhole, ShieldCheck, UserCog } from "lucide-react";
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
    title: "محافظت سرور",
    text: "اطلاعات ورود از متغیرهای محیطی پروداکشن خوانده می‌شود.",
  },
];

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_27rem]">
        <section className="order-2 hidden lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
            <UserCog size={18} className="text-cyan-600" aria-hidden="true" />
            پنل مدیریت یوفوپاف
          </div>

          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-[1.35] xl:text-5xl">
            ورود امن به سفارش‌ها، محصولات و موجودی
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            این بخش برای عملیات داخلی فروشگاه طراحی شده است؛ ساده، قابل اتکا و مناسب تصمیم‌های
            روزانه مدیر.
          </p>

          <div className="mt-8 grid max-w-2xl gap-4 md:grid-cols-2">
            {securityNotes.map((item) => (
              <article
                key={item.title}
                className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              >
                <item.icon size={22} className="text-cyan-600" aria-hidden="true" />
                <h2 className="mt-4 font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-7 lg:order-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-14 w-14 shrink-0">
                <Image
                  src="/logos/logo.png"
                  alt="لوگوی پنل مدیریت یوفوپاف"
                  fill
                  sizes="56px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-500" dir="ltr">
                  UFO Puff Admin
                </p>
                <h1 className="text-2xl font-black sm:text-3xl">ورود ادمین</h1>
              </div>
            </div>
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan-100 bg-cyan-50 text-cyan-700 sm:inline-flex">
              <KeyRound size={20} aria-hidden="true" />
            </span>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-600">
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
