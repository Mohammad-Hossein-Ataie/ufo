import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardList,
  PackageCheck,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import { Button } from "@ufo/ui";
import { canonical } from "@ufo/seo";
import { storeSettings } from "@ufo/domain";

export const metadata: Metadata = {
  title: "درباره همکاری عمده یوفوپاف",
  description:
    "آشنایی با مسیر همکاری عمده یوفوپاف برای فروشگاه‌ها: کاتالوگ عمده، قیمت کارتن، حداقل سفارش، رزرو موجودی و پیش‌فاکتور.",
  alternates: { canonical: canonical("/b2b/about") },
  robots: { index: true, follow: true },
};

const signals = [
  {
    icon: ClipboardList,
    title: "سفارش سریع",
    text: "همکار فروشگاهی محصول و تعداد کارتن را در یک مسیر کوتاه انتخاب می‌کند.",
  },
  {
    icon: Warehouse,
    title: "رزرو موجودی",
    text: "موجودی قابل فروش قبل از تایید نهایی بررسی می‌شود.",
  },
  {
    icon: PackageCheck,
    title: "پیش‌فاکتور همکاری",
    text: "سبد عمده برای بررسی، هماهنگی پرداخت و ارسال ثبت می‌شود.",
  },
];

export default function B2BAboutPage() {
  return (
    <main id="main-content" className="bg-[#F7F7F2] text-[#14201B]">
      <section className="relative overflow-hidden border-b border-[#D5D9C9] bg-[#F7F7F2]">
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(20,32,27,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,32,27,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_24rem]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C8D6C7] bg-white px-3 py-1 text-xs font-bold text-[#405148] shadow-sm">
              <ShieldCheck size={14} className="text-[#1F8A5B]" aria-hidden="true" />
              درباره همکاری عمده
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] sm:text-5xl">
              همکاری عمده با یوفوپاف برای فروشگاه‌ها و خریداران کارتنی
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#405148]">
              این صفحه مخصوص مسیر B2B است. تمرکز آن روی قیمت همکاری، حداقل کارتن، پیش‌فاکتور،
              هماهنگی ارسال و پشتیبانی فروشگاهی است؛ نه هدایت کاربر به مسیر خرید تکی.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/b2b/catalog">
                <Button
                  size="lg"
                  className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
                >
                  مشاهده کاتالوگ عمده
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/b2b/quick-order">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-[#C8D6C7] bg-white text-[#14201B] hover:bg-[#EEF0E5]"
                >
                  سفارش سریع
                </Button>
              </Link>
            </div>
          </div>
          <aside className="rounded-md border border-[#D5D9C9] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">کانال ارتباط همکاری</h2>
            <p className="mt-3 leading-7 text-[#596B61]">
              اطلاعات تماس همان فروشگاه یوفوپاف است، اما مسیر مکالمه برای همکاری عمده با نیازهای
              فروشگاهی، قیمت کارتنی و هماهنگی ارسال بررسی می‌شود.
            </p>
            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="text-[#596B61]">شماره هماهنگی</dt>
                <dd className="mt-1 font-bold" dir="ltr">
                  {storeSettings.phone}
                </dd>
              </div>
              <div>
                <dt className="text-[#596B61]">ساعت پاسخ‌گویی</dt>
                <dd className="mt-1 font-bold">{storeSettings.workingHours}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {signals.map((item) => (
            <article
              key={item.title}
              className="rounded-md border border-[#D5D9C9] bg-white p-6 shadow-sm"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E9FBF1] text-[#1F8A5B]">
                <item.icon size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#596B61]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#D5D9C9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">برای چه کسانی مناسب است؟</h2>
            <p className="mt-3 leading-8 text-[#596B61]">
              مسیر عمده یوفوپاف برای فروشگاه‌ها، همکاران فروش، و خریدارانی طراحی شده که تصمیمشان بر
              اساس تعداد کارتن، قیمت همکاری، تامین منظم و زمان ارسال گرفته می‌شود.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-[#405148]">
            {[
              "نیاز به قیمت همکاری و حداقل سفارش شفاف",
              "ثبت پیش‌فاکتور قبل از پرداخت نهایی",
              "پیگیری موجودی و ارسال برای سفارش‌های حجمی",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-md border border-[#D5D9C9] bg-[#F7F7F2] p-3"
              >
                <BadgeCheck size={17} className="text-[#1F8A5B]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-md border border-[#D5D9C9] bg-[#14201B] p-6 text-white">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-black">شروع همکاری عمده</h2>
              <p className="mt-2 leading-7 text-white/70">
                از کاتالوگ عمده شروع کنید یا مستقیما وارد سفارش سریع کارتن شوید.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/b2b/catalog">
                <Button className="border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]">
                  کاتالوگ عمده
                </Button>
              </Link>
              <Link href="/b2b/quick-order">
                <Button
                  variant="ghost"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  سفارش سریع
                  <Truck size={18} aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
