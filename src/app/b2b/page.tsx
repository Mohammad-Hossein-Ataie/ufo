import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@ufo/ui";
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
    question: "حداقل سفارش عمده چگونه کنترل می‌شود؟",
    answer: "حداقل تعداد کارتن روی هر واریانت ذخیره شده و هنگام ثبت سفارش سریع اعتبارسنجی می‌شود.",
  },
];

export default function B2BHomePage() {
  return (
    <main id="main-content">
      <script {...jsonLdScriptProps(faqPageJsonLd(b2bFaq))} />
      <section className="border-b border-[#D5D9C9] bg-[#14201B] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_25rem]">
          <div>
            <h1 className="text-4xl font-black leading-[1.35]">سفارش همکاری UFO Puff</h1>
            <p className="mt-4 max-w-3xl leading-8 text-white/75">
              قیمت کارتن، حداقل سفارش، پیش‌فاکتور و رزرو موجودی در این محیط خصوصی مدیریت می‌شود.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/b2b/quick-order">
                <Button className="border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]">
                  سفارش سریع
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <Link href="/b2b/catalog">
                <Button variant="ghost">مشاهده کاتالوگ</Button>
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 rounded-md border border-white/20 bg-white/10 p-5">
            {[
              "اعتبارسنجی حداقل کارتن",
              "رزرو موجودی مشترک",
              "پیش‌فاکتور قابل ارسال",
              "قیمت‌ها noindex",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="text-[#E8C547]" size={20} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl font-black">راهنمای سفارش عمده</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {b2bFaq.map((item) => (
            <article
              key={item.question}
              className="rounded-md border border-[#D5D9C9] bg-white p-5"
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
