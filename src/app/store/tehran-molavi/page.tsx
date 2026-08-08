import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { Alert, Button } from "@ufo/ui";
import { faqPageJsonLd, jsonLdScriptProps, localBusinessJsonLd } from "@ufo/seo";
import { storeSettings } from "@ufo/domain";

export const metadata: Metadata = {
  title: "درباره یوفوپاف | فروشگاه پاد و ویپ در مولوی تهران",
  description:
    "درباره یوفوپاف، فروشگاه تخصصی پاد و ویپ با امکان خرید آنلاین، سفارش عمده، دریافت حضوری در مولوی تهران و پشتیبانی مستقیم.",
  alternates: { canonical: "/store/tehran-molavi" },
  openGraph: {
    title: "درباره یوفوپاف | UFO Puff",
    description: "آشنایی با یوفوپاف، مسیر خرید آنلاین، سفارش عمده و دریافت حضوری در مولوی تهران.",
    url: "/store/tehran-molavi",
    siteName: "یوفوپاف | UFO Puff",
    locale: "fa_IR",
  },
};

const storeFaq = [
  {
    question: "یوفوپاف چه محصولاتی عرضه می‌کند؟",
    answer:
      "یوفوپاف روی کاتالوگ پاد، ویپ، سالت نیکوتین، جویس، کویل، کارتریج و لوازم جانبی مرتبط تمرکز دارد.",
  },
  {
    question: "آیا سفارش حضوری بدون ثبت آنلاین ممکن است؟",
    answer:
      "برای رزرو موجودی و جلوگیری از اتلاف زمان، ثبت سفارش آنلاین قبل از مراجعه پیشنهاد می‌شود.",
  },
  {
    question: "آیا پیک تهران فعال است؟",
    answer: "بله، برای شهر تهران و پس از تایید پرداخت قابل انتخاب است.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "کنترل اصالت",
    text: "رسید و سفارش پیش از تایید نهایی بررسی می‌شود تا خرید شفاف‌تر باشد.",
  },
  {
    icon: Truck,
    title: "ارسال منعطف",
    text: "تیپاکس، پیک تهران و دریافت حضوری بعد از هماهنگی قابل انتخاب است.",
  },
  {
    icon: ShoppingBag,
    title: "خرید تکی و عمده",
    text: "یوفوپاف برای خریدار retail و همکار فروشگاهی مسیر جدا و واضح دارد.",
  },
];

export default function StorePage() {
  return (
    <main id="main-content" className="bg-retail-bg text-retail-primary">
      <script {...jsonLdScriptProps(localBusinessJsonLd())} />
      <script {...jsonLdScriptProps(faqPageJsonLd(storeFaq))} />

      <section className="showcase-grid relative isolate overflow-hidden border-b border-retail-border">
        <Image
          src="/images/ufo-hero.png"
          alt="ویترین محصولات پاد و ویپ یوفوپاف در تهران"
          fill
          priority
          unoptimized
          className="-z-20 object-cover opacity-45"
          style={{ objectPosition: "center 72%" }}
          sizes="100vw"
        />
        <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid min-h-[66svh] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_24rem]">
          <div className="reveal-up max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary backdrop-blur">
              <Store size={14} className="text-retail-accent-2" aria-hidden="true" />
              درباره یوفوپاف
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] text-white sm:text-5xl">
              یوفوپاف؛ فروشگاه تخصصی پاد و ویپ برای خرید مطمئن
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#D9E2EC]">
              ما در یوفوپاف کاتالوگ محصولات ویپ را با قیمت شفاف، موجودی قابل پیگیری، مسیر خرید تکی و
              سفارش عمده برای همکاران فروشگاهی ارائه می‌کنیم.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" className="glow-accent">
                  مشاهده محصولات
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </Link>
              <a href={storeSettings.telegramUrl} target="_blank" rel="noreferrer">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-retail-border bg-white/5 text-white backdrop-blur hover:bg-white/10"
                >
                  <Send size={18} aria-hidden="true" />
                  ارتباط در تلگرام
                </Button>
              </a>
            </div>
          </div>

          <aside className="reveal-up-delay-1 rounded-retail border border-retail-border bg-retail-surface/85 p-5 shadow-retail-lg backdrop-blur">
            <h2 className="text-xl font-black text-white">اطلاعات تماس یوفوپاف</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-1 shrink-0 text-retail-accent" size={18} aria-hidden="true" />
                <div>
                  <dt className="text-retail-secondary">آدرس</dt>
                  <dd className="mt-1 leading-7 text-white">{storeSettings.address}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-1 shrink-0 text-retail-accent" size={18} aria-hidden="true" />
                <div>
                  <dt className="text-retail-secondary">تماس</dt>
                  <dd className="mt-1 text-white" dir="ltr">
                    {storeSettings.phone}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-1 shrink-0 text-retail-accent" size={18} aria-hidden="true" />
                <div>
                  <dt className="text-retail-secondary">ساعت کاری</dt>
                  <dd className="mt-1 text-white">{storeSettings.workingHours}</dd>
                </div>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="section-surface">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 md:grid-cols-3">
          {values.map((item) => (
            <article
              key={item.title}
              className="flex gap-3 rounded-retail border border-retail-border bg-white/[0.02] p-4"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-retail-accent-2/10 text-retail-accent-2">
                <item.icon size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold text-white">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-retail-secondary">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">چرا یوفوپاف؟</h2>
          <p className="mt-4 leading-8 text-retail-secondary">
            بهترین تجربه خرید محصولاتی مثل پاد و ویپ زمانی شکل می‌گیرد که کاربر قبل از پرداخت،
            موجودی، قیمت، شیوه ارسال و مسیر پشتیبانی را روشن ببیند. طراحی یوفوپاف بر همین اصل ساخته
            شده است: انتخاب سریع، اطلاعات کافی، و مسیر checkout کوتاه.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-[#D9E2EC]">
            {[
              "کاتالوگ قابل جستجو برای خرید تکی",
              "مسیر جدا برای سفارش عمده و قیمت همکاری",
              "پشتیبانی مستقیم برای هماهنگی ارسال یا دریافت حضوری",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <BadgeCheck size={17} className="text-retail-accent-2" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-retail border border-retail-border bg-retail-surface p-6">
          <h2 className="text-2xl font-black text-white">دریافت حضوری در مولوی</h2>
          <p className="mt-4 leading-8 text-retail-secondary">
            دریافت حضوری بعد از ثبت سفارش و هماهنگی پشتیبانی فعال می‌شود. این کار کمک می‌کند موجودی
            کالا قبل از مراجعه رزرو شود و تجربه حضوری کوتاه‌تر و مطمئن‌تر باشد.
          </p>
          <div className="mt-6">
            <Alert title="مسیر پیشنهادی خرید" tone="info">
              ابتدا محصول را از کاتالوگ یوفوپاف انتخاب کنید، سپس بعد از ورود با شماره موبایل، روش
              ارسال یا دریافت حضوری را در checkout نهایی کنید.
            </Alert>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products">
              <Button>شروع خرید</Button>
            </Link>
            <a href={`tel:${storeSettings.phone}`}>
              <Button variant="ghost" className="border-retail-border bg-white/5">
                <Phone size={18} aria-hidden="true" />
                تماس با یوفوپاف
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-retail-accent" size={22} aria-hidden="true" />
          <h2 className="text-2xl font-black text-white">پرسش‌های رایج درباره یوفوپاف</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {storeFaq.map((item) => (
            <article
              key={item.question}
              className="rounded-retail border border-retail-border bg-retail-surface p-5"
            >
              <h3 className="font-bold leading-7 text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-retail-secondary">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
