import type { Metadata } from "next";
import Link from "next/link";
import { canonical, faqPageJsonLd, jsonLdScriptProps } from "@ufo/seo";

export const metadata: Metadata = {
  title: "راهنما و مقالات",
  description: "راهنمای سازگاری کویل، کارتریج و انتخاب محصول بدون ادعای درمانی.",
  alternates: { canonical: canonical("/blog") },
};

const guides = [
  {
    title: "چطور کارتریج سازگار را پیدا کنیم؟",
    text: "نام دستگاه، سری کارتریج، مقاومت کویل و نوع مصرف را با مشخصات محصول مقایسه کنید. اگر سازگاری در توضیح محصول ذکر نشده، قبل از خرید از پشتیبانی بپرسید.",
  },
  {
    title: "در خرید پاد یکبارمصرف به چه چیزی توجه کنیم؟",
    text: "تعداد پاف، ظرفیت باتری، نوع شارژ، برند، موجودی و قیمت نهایی مهم‌ترین اطلاعات قابل مقایسه هستند. عدد پاف تضمین مصرف یکسان برای همه کاربران نیست.",
  },
  {
    title: "تفاوت سفارش تکی و همکاری چیست؟",
    text: "در خرید تکی قیمت واحد نمایش داده می‌شود. در مسیر همکاری، حداقل کارتن و قیمت عمده فقط برای کالاهای فعال‌شده توسط ادمین قابل استفاده است.",
  },
];

export default function BlogPage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-10">
      <script
        {...jsonLdScriptProps(
          faqPageJsonLd(guides.map((guide) => ({ question: guide.title, answer: guide.text }))),
        )}
      />
      <h1 className="text-3xl font-black">راهنما و مقالات</h1>
      <p className="mt-3 leading-8 text-[#D9E2EC]">
        این بخش برای پاسخ مستقیم به پرسش‌های رایج خرید و کاهش خطای انتخاب محصول ساخته شده است.
        محتوای راهنما فقط بر پایه اطلاعات قابل مشاهده محصول نوشته می‌شود و ادعای درمانی یا سلامت
        ندارد.
      </p>
      <div className="mt-6 grid gap-4">
        {guides.map((guide) => (
          <article
            key={guide.title}
            className="rounded-md border border-[#22303D] bg-[#0D1117] p-5"
          >
            <h2 className="font-bold">{guide.title}</h2>
            <p className="mt-2 text-sm leading-7 text-[#9BA7B4]">{guide.text}</p>
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-md border border-[#22303D] bg-[#141A22] p-5">
        <h2 className="text-xl font-bold">مسیرهای مرتبط</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-[#00D9FF]">
          <Link href="/products/category/pod">پاد</Link>
          <Link href="/products/category/disposable">پاد یکبارمصرف</Link>
          <Link href="/products/category/salt-nicotine">سالت نیکوتین</Link>
          <Link href="/b2b">خرید عمده</Link>
        </div>
      </section>
    </main>
  );
}
