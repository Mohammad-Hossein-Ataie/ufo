import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "راهنما و مقالات",
  description: "راهنمای سازگاری کویل، کارتریج و انتخاب محصول بدون ادعای درمانی.",
  alternates: { canonical: "/blog" }
};

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">راهنما و مقالات</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          "راهنمای جلوگیری از اشتباه در انتخاب کویل",
          "چطور کارتریج سازگار را پیدا کنیم؟",
          "تفاوت سفارش تکی و همکاری در UFO Puff"
        ].map((title) => (
          <article key={title} className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#9BA7B4]">محتوا از CMS قابل مدیریت خواهد بود.</p>
          </article>
        ))}
      </div>
    </main>
  );
}
