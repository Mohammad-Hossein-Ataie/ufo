import type { Metadata } from "next";
import { Alert } from "@ufo/ui";
import { faqPageJsonLd, jsonLdScriptProps, localBusinessJsonLd } from "@ufo/seo";
import { storeSettings } from "@ufo/domain";

export const metadata: Metadata = {
  title: "فروشگاه ویپ در مولوی تهران",
  description: "اطلاعات فروشگاه حضوری UFO Puff در بازار مولوی تهران، مسیر دسترسی و دریافت حضوری.",
  alternates: { canonical: "/store/tehran-molavi" },
};

const storeFaq = [
  {
    question: "آیا سفارش حضوری بدون ثبت آنلاین ممکن است؟",
    answer: "برای رزرو موجودی، ثبت سفارش آنلاین پیشنهاد می‌شود.",
  },
  {
    question: "آیا پیک تهران فعال است؟",
    answer: "بله، برای شهر تهران و پس از تایید پرداخت قابل انتخاب است.",
  },
];

export default function StorePage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-10">
      <script {...jsonLdScriptProps(localBusinessJsonLd())} />
      <script {...jsonLdScriptProps(faqPageJsonLd(storeFaq))} />
      <h1 className="text-4xl font-black leading-[1.35]">UFO Puff در بازار مولوی</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
          <h2 className="text-xl font-bold">اطلاعات مراجعه</h2>
          <dl className="mt-4 grid gap-3 leading-7">
            <div>
              <dt className="text-[#9BA7B4]">آدرس</dt>
              <dd>{storeSettings.address}</dd>
            </div>
            <div>
              <dt className="text-[#9BA7B4]">مسئول</dt>
              <dd>{storeSettings.ownerName}</dd>
            </div>
            <div>
              <dt className="text-[#9BA7B4]">تماس</dt>
              <dd>{storeSettings.phone}</dd>
            </div>
            <div>
              <dt className="text-[#9BA7B4]">ساعت کاری</dt>
              <dd>{storeSettings.workingHours}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-md border border-[#22303D] bg-[#141A22] p-5">
          <h2 className="text-xl font-bold">دریافت حضوری</h2>
          <p className="mt-3 leading-8 text-[#D9E2EC]">
            بعد از ثبت سفارش، دریافت حضوری با هماهنگی پشتیبانی فعال می‌شود. موجودی کالا قبل از
            مراجعه رزرو می‌شود.
          </p>
          <Alert title="مسیر دسترسی" tone="info">
            برای جلوگیری از doorway page، همین صفحه تنها صفحه محلی فروشگاه تهران است و اطلاعات آن با
            schema یکسان نگه داشته می‌شود.
          </Alert>
        </section>
      </div>
      <section className="mt-6 rounded-md border border-[#22303D] bg-[#0D1117] p-5">
        <h2 className="text-xl font-bold">FAQ</h2>
        <div className="mt-4 grid gap-4">
          {storeFaq.map((item) => (
            <article key={item.question}>
              <h3 className="font-bold">{item.question}</h3>
              <p className="mt-1 text-[#9BA7B4]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
