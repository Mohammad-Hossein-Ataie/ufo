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
  title: "خرید عمده پاد و ویپ",
  description:
    "مسیر سفارش همکاری UFO Puff برای خرید عمده پاد، ویپ و محصولات مرتبط با حداقل سفارش و پیش‌فاکتور.",
  alternates: { canonical: canonical("/b2b") },
  robots: { index: true, follow: true },
  openGraph: {
    title: "خرید عمده پاد و ویپ | UFO Puff B2B",
    description: "اطلاعات سفارش همکاری، حداقل کارتن و رزرو موجودی برای همکاران فروش.",
    url: canonical("/b2b"),
    locale: "fa_IR",
    siteName: "UFO Puff",
  },
};

const b2bFaq = [
  {
    question: "خرید عمده در UFO Puff چطور انجام می‌شود؟",
    answer:
      "همکاران از مسیر B2B وارد کاتالوگ همکاری می‌شوند، تعداد کارتن را انتخاب می‌کنند و پیش‌فاکتور برای بررسی ادمین ثبت می‌شود.",
  },
  {
    question: "آیا همه محصولات تک‌فروشی برای عمده فعال هستند؟",
    answer:
      "خیر، فقط محصولاتی که قیمت همکاری آن‌ها توسط ادمین فعال شده باشد در مسیر عمده نمایش داده می‌شوند.",
  },
  {
    question: "حداقل سفارش عمده چطور کنترل می‌شود؟",
    answer:
      "حداقل تعداد کارتن روی هر واریانت ذخیره شده و هنگام ثبت سفارش سریع اعتبارسنجی می‌شود.",
  },
];

const workflow = [
  { icon: ClipboardList, title: "کاتالوگ همکاری", text: "قیمت کارتن، حداقل سفارش و SKU در یک نمای سریع‌خوان." },
  { icon: Warehouse, title: "رزرو موجودی", text: "موجودی مشترک قبل از تایید نهایی کنترل و رزرو می‌شود." },
  { icon: PackageCheck, title: "پیش‌فاکتور", text: "سفارش برای هماهنگی ارسال و تایید ادمین ثبت می‌شود." },
];

const stats = [
  { value: `${products.length}`, label: "محصول قابل بررسی" },
  { value: `${variants.filter((item) => item.wholesaleEnabled !== false).length}`, label: "واریانت همکاری" },
  { value: "+۵۰۰", label: "همکار فروشگاهی" },
  { value: "۲۴h", label: "پیگیری سفارش" },
];

export default function B2BHomePage() {
  const partnerBrands = brands.slice(0, 6);

  return (
    <main id="main-content" className="bg-retail-bg text-retail-primary">
      <script {...jsonLdScriptProps(faqPageJsonLd(b2bFaq))} />

      <section className="showcase-grid relative isolate overflow-hidden border-b border-retail-border">
        <Image
          src="/images/ufo-hero.png"
          alt="ویترین محصولات UFO Puff برای سفارش عمده"
          fill
          priority
          unoptimized
          className="-z-20 object-cover opacity-45"
          style={{ objectPosition: "center 72%" }}
          sizes="100vw"
        />
        <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid min-h-[76svh] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_26rem] lg:py-20">
          <div className="reveal-up max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary backdrop-blur">
              <Sparkles size={14} className="text-retail-accent-2" aria-hidden="true" />
              تجربه عمده‌فروشی با ظاهر یکپارچه فروشگاه
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] text-white sm:text-5xl md:text-6xl">
              خرید عمده پاد و ویپ،
              <span className="bg-gradient-to-l from-retail-accent to-retail-accent-2 bg-clip-text text-transparent">
                {" "}
                سریع، شفاف و قابل پیگیری
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#D9E2EC]">
              کاتالوگ همکاری، قیمت کارتن، حداقل سفارش و پیش‌فاکتور در یک مسیر منظم برای فروشگاه‌ها
              و خریداران عمده آماده شده است.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/b2b/quick-order">
                <Button size="lg" className="glow-accent">
                  سفارش سریع
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/b2b/catalog">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-retail-border bg-white/5 text-white backdrop-blur hover:bg-white/10"
                >
                  مشاهده کاتالوگ عمده
                </Button>
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-retail-secondary">
              {["قیمت همکاری", "حداقل کارتن", "پیش‌فاکتور", "پشتیبانی مستقیم"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <BadgeCheck size={16} className="text-retail-accent-2" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="reveal-up-delay-1 rounded-retail border border-retail-border bg-retail-surface/85 p-5 shadow-retail-lg backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-retail-border pb-4">
              <div>
                <p className="text-sm text-retail-secondary">وضعیت همکاری</p>
                <h2 className="mt-1 text-xl font-black text-white">آماده ثبت سفارش</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-retail-accent-2/10 text-retail-accent-2">
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
                <li key={item} className="flex items-center gap-2 text-sm text-[#D9E2EC]">
                  <CheckCircle2 className="text-retail-accent-2" size={18} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="section-surface">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-retail border border-retail-border bg-white/[0.02] p-5 text-center">
              <div className="text-3xl font-black tabular-nums text-white">{item.value}</div>
              <div className="mt-2 text-sm text-retail-secondary">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">مسیر همکاری</h2>
            <p className="mt-2 max-w-2xl leading-7 text-retail-secondary">
              همان حس بصری فروشگاه اصلی، با اطلاعات فشرده و قابل اتکا برای خرید عمده.
            </p>
          </div>
          <Link
            href="/b2b/catalog"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-retail-accent transition hover:text-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
          >
            ورود به کاتالوگ
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {workflow.map((item, index) => (
            <article
              key={item.title}
              className={`card-interactive p-6 ${index === 1 ? "reveal-up-delay-1" : "reveal-up-delay-2"}`}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-retail-accent/10 text-retail-accent">
                <item.icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-retail-secondary">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-surface-alt border-y border-retail-border">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">اعتمادسازی برای همکاری</h2>
              <p className="mt-3 leading-8 text-retail-secondary">
                اصالت کالا، کنترل موجودی و مسیر پیش‌فاکتور کمک می‌کند خرید عمده قابل پیگیری و کم‌ریسک
                باشد.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "کنترل اصالت" },
                { icon: Truck, title: "ارسال هماهنگ" },
                { icon: Warehouse, title: "موجودی قابل پیگیری" },
              ].map((item) => (
                <div key={item.title} className="rounded-retail border border-retail-border bg-retail-surface p-4">
                  <item.icon className="text-retail-accent-2" size={22} aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-bold text-white">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {partnerBrands.map((brand) => (
              <li key={brand.id} className="rounded-full border border-retail-border bg-retail-surface px-5 py-2 text-sm font-bold text-[#D9E2EC]">
                {brand.nameFa}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-black text-white sm:text-3xl">راهنمای سفارش عمده</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {b2bFaq.map((item) => (
            <article key={item.question} className="rounded-retail border border-retail-border bg-retail-surface p-5">
              <h3 className="font-bold leading-7 text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-retail-secondary">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
