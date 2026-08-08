import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  Warehouse,
} from "lucide-react";
import { Button } from "@ufo/ui";
import { brands, products, variants } from "@ufo/domain";
import { canonical, faqPageJsonLd, jsonLdScriptProps } from "@ufo/seo";

export const metadata: Metadata = {
  title: "خرید عمده پاد و ویپ از یوفوپاف",
  description:
    "مسیر سفارش همکاری یوفوپاف UFO Puff برای خرید عمده پاد، ویپ و محصولات مرتبط با حداقل سفارش، قیمت کارتن و پیش‌فاکتور.",
  alternates: { canonical: canonical("/b2b") },
  robots: { index: true, follow: true },
  openGraph: {
    title: "خرید عمده پاد و ویپ | یوفوپاف UFO Puff B2B",
    description: "اطلاعات سفارش همکاری، حداقل کارتن و رزرو موجودی برای همکاران فروش.",
    url: canonical("/b2b"),
    locale: "fa_IR",
    siteName: "یوفوپاف | UFO Puff",
  },
};

const b2bFaq = [
  {
    question: "خرید عمده در یوفوپاف چطور انجام می‌شود؟",
    answer:
      "همکاران از مسیر B2B وارد کاتالوگ همکاری می‌شوند، تعداد کارتن را انتخاب می‌کنند و پیش‌فاکتور برای بررسی ادمین ثبت می‌شود.",
  },
  {
    question: "آیا همه محصولات تک‌فروشی برای عمده فعال هستند؟",
    answer:
      "خیر، فقط محصولاتی که قیمت همکاری آن‌ها توسط ادمین فعال شده باشد در مسیر عمده یوفوپاف نمایش داده می‌شوند.",
  },
  {
    question: "حداقل سفارش عمده چطور کنترل می‌شود؟",
    answer: "حداقل تعداد کارتن روی هر واریانت ذخیره شده و هنگام ثبت سفارش سریع اعتبارسنجی می‌شود.",
  },
];

const workflow = [
  {
    icon: ClipboardList,
    title: "کاتالوگ همکاری",
    text: "قیمت کارتن، حداقل سفارش و SKU در یک نمای سریع‌خوان.",
  },
  {
    icon: Warehouse,
    title: "رزرو موجودی",
    text: "موجودی مشترک قبل از تایید نهایی کنترل و رزرو می‌شود.",
  },
  {
    icon: PackageCheck,
    title: "پیش‌فاکتور",
    text: "سفارش برای هماهنگی ارسال و تایید ادمین ثبت می‌شود.",
  },
];

const stats = [
  { value: `${products.length}`, label: "محصول قابل بررسی" },
  {
    value: `${variants.filter((item) => item.wholesaleEnabled !== false).length}`,
    label: "واریانت همکاری",
  },
  { value: "+۵۰۰", label: "همکار فروشگاهی" },
  { value: "۲۴h", label: "پیگیری سفارش" },
];

export default function B2BHomePage() {
  const partnerBrands = brands.slice(0, 6);

  return (
    <main id="main-content" className="bg-[#F7F7F2] text-[#14201B]">
      <script {...jsonLdScriptProps(faqPageJsonLd(b2bFaq))} />

      <section className="relative isolate overflow-hidden border-b border-[#D5D9C9] bg-[#F7F7F2]">
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(20,32,27,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,32,27,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-[#E8FFF3] to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto grid min-h-[72svh] max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1fr_27rem] lg:py-18">
          <div className="reveal-up max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C8D6C7] bg-white px-3 py-1 text-xs font-bold text-[#405148] shadow-sm">
              <Sparkles size={14} className="text-[#1F8A5B]" aria-hidden="true" />
              یوفوپاف عمده برای همکاران فروشگاهی
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] text-[#14201B] sm:text-5xl md:text-6xl">
              خرید عمده پاد و ویپ از یوفوپاف، شفاف و قابل پیگیری
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#405148]">
              کاتالوگ همکاری، قیمت کارتن، حداقل سفارش و پیش‌فاکتور در یک مسیر روشن برای فروشگاه‌ها و
              خریداران عمده آماده شده است.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/b2b/quick-order">
                <Button
                  size="lg"
                  className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
                >
                  سفارش سریع
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/b2b/catalog">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-[#C8D6C7] bg-white text-[#14201B] hover:bg-[#EEF0E5]"
                >
                  مشاهده کاتالوگ عمده
                </Button>
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#596B61]">
              {["قیمت همکاری", "حداقل کارتن", "پیش‌فاکتور", "پشتیبانی مستقیم"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <BadgeCheck size={16} className="text-[#1F8A5B]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="reveal-up-delay-1 overflow-hidden rounded-md border border-[#D5D9C9] bg-white shadow-[0_16px_40px_rgba(20,32,27,0.12)]">
            <div className="relative aspect-[4/3] bg-[#EEF0E5]">
              <Image
                src="/images/ufo-hero.png"
                alt="ویترین محصولات یوفوپاف برای سفارش عمده"
                fill
                priority
                unoptimized
                sizes="(min-width: 1024px) 27rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-4 border-b border-[#E2E4D8] pb-4">
                <div>
                  <p className="text-sm text-[#596B61]">وضعیت همکاری</p>
                  <h2 className="mt-1 text-xl font-black">آماده ثبت سفارش</h2>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E9FBF1] text-[#1F8A5B]">
                  <BarChart3 size={24} aria-hidden="true" />
                </span>
              </div>
              <ul className="mt-5 grid gap-3">
                {[
                  "اعتبارسنجی حداقل کارتن",
                  "نمایش قیمت همکاری",
                  "رزرو موجودی مشترک",
                  "خروجی مناسب پیش‌فاکتور",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#405148]">
                    <CheckCircle2 className="text-[#1F8A5B]" size={18} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#D5D9C9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-[#D5D9C9] bg-[#F7F7F2] p-5 text-center"
            >
              <div className="text-3xl font-black tabular-nums text-[#14201B]">{item.value}</div>
              <div className="mt-2 text-sm text-[#596B61]">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">مسیر همکاری با یوفوپاف</h2>
            <p className="mt-2 max-w-2xl leading-7 text-[#596B61]">
              اطلاعات عملیاتی برای خرید عمده باید سریع خوانده شود: قیمت، حداقل سفارش و مرحله بعد.
            </p>
          </div>
          <Link
            href="/b2b/catalog"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-[#1F8A5B] transition hover:text-[#176D48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"
          >
            ورود به کاتالوگ
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {workflow.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-md border border-[#D5D9C9] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#1F8A5B] hover:shadow-lg ${index === 1 ? "reveal-up-delay-1" : "reveal-up-delay-2"}`}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E9FBF1] text-[#1F8A5B]">
                <item.icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#596B61]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#D5D9C9] bg-[#EEF0E5]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">اعتمادسازی برای همکاری عمده</h2>
              <p className="mt-3 leading-8 text-[#596B61]">
                اصالت کالا، کنترل موجودی و مسیر پیش‌فاکتور کمک می‌کند خرید عمده یوفوپاف قابل پیگیری
                و کم‌ریسک باشد.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "کنترل اصالت" },
                { icon: Truck, title: "ارسال هماهنگ" },
                { icon: Warehouse, title: "موجودی قابل پیگیری" },
              ].map((item) => (
                <div key={item.title} className="rounded-md border border-[#D5D9C9] bg-white p-4">
                  <item.icon className="text-[#1F8A5B]" size={22} aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-bold">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {partnerBrands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-full border border-[#D5D9C9] bg-white px-5 py-2 text-sm font-bold text-[#405148]"
              >
                {brand.nameFa}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-black sm:text-3xl">راهنمای سفارش عمده</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {b2bFaq.map((item) => (
            <article
              key={item.question}
              className="rounded-md border border-[#D5D9C9] bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold leading-7">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-[#596B61]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
