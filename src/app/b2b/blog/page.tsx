import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, BriefcaseBusiness, Clock3, Newspaper, PackageSearch, Sparkles } from "lucide-react";
import { canonical, itemListJsonLd, jsonLdScriptProps } from "@ufo/seo";
import { ContentPostCard, contentPostHref } from "@/components/content-post-card";
import { listPublishedPosts, type ContentPostType } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "اخبار و مقالات همکاری عمده",
  description: "راهنماهای عملیاتی و اخبار همکاری عمده یوفوپاف برای مدیریت سفارش کارتنی، موجودی، انتخاب کالا و فروش فروشگاهی.",
  alternates: { canonical: canonical("/b2b/blog") },
  robots: { index: true, follow: true },
  openGraph: {
    title: "مرکز محتوای عمده‌فروشی یوفوپاف",
    description: "راهنماها و خبرهای ویژه همکاران فروشگاهی یوفوپاف.",
    url: canonical("/b2b/blog"),
    type: "website",
    locale: "fa_IR",
  },
};

export default async function B2BBlogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const requestedType = (await searchParams).type;
  const type: ContentPostType | undefined = requestedType === "news" || requestedType === "article" ? requestedType : undefined;
  const allPosts = await listPublishedPosts({ audience: "wholesale" });
  const posts = type ? allPosts.filter((post) => post.type === type) : allPosts;
  const featured = posts[0];
  const remaining = posts.slice(1);
  const articleCount = allPosts.filter((post) => post.type === "article").length;
  const newsCount = allPosts.filter((post) => post.type === "news").length;

  return (
    <main id="main-content" className="bg-[#F7F7F2] px-4 py-8 text-[#14201B] sm:py-12">
      <script {...jsonLdScriptProps(itemListJsonLd(posts.map((post) => ({ name: post.title, url: contentPostHref(post) })), "مرکز محتوای عمده یوفوپاف"))} />
      <div className="mx-auto max-w-7xl">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#D5D9C9] bg-white p-6 shadow-[0_20px_60px_rgba(20,32,27,0.09)] sm:p-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-10">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(20,32,27,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(20,32,27,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-[#E8FFF3] to-transparent" aria-hidden="true" />
          <div className="flex flex-col justify-center py-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#C8D6C7] bg-white px-3 py-1 text-xs font-bold text-[#176D48] shadow-sm"><BriefcaseBusiness size={14} /> دانشنامه همکاری عمده</span>
            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-[1.35] sm:text-5xl">تصمیم بهتر برای خرید کارتنی و فروش بیشتر</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#596B61]">راهنمای انتخاب موجودی، حداقل سفارش و خبرهای همکاری را بخوانید و بدون اتلاف وقت وارد کاتالوگ یا سفارش سریع شوید.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/b2b/quick-order" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1F8A5B] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(31,138,91,0.2)] transition hover:bg-[#176D48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"><PackageSearch size={17} /> سفارش سریع <ArrowLeft size={16} /></Link>
              {featured ? <Link href={contentPostHref(featured)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#C8D6C7] bg-white px-5 text-sm font-black transition hover:bg-[#EEF0E5]"><BookOpenCheck size={17} /> مطالعه پیشنهاد همکاری</Link> : null}
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-[#D5D9C9] pt-6 sm:max-w-md">
              <div className="rounded-md border border-[#E2E4D8] bg-[#F7F7F2] p-4"><dt className="text-xs text-[#718078]">راهنمای همکاری</dt><dd className="mt-1 text-2xl font-black">{articleCount.toLocaleString("fa-IR")}</dd></div>
              <div className="rounded-md border border-[#E2E4D8] bg-[#F7F7F2] p-4"><dt className="text-xs text-[#718078]">خبر عمده</dt><dd className="mt-1 text-2xl font-black">{newsCount.toLocaleString("fa-IR")}</dd></div>
            </dl>
          </div>

          {featured ? <Link href={contentPostHref(featured)} className="group relative mt-8 block min-h-[24rem] overflow-hidden rounded-2xl border border-[#D5D9C9] bg-[#EEF0E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B] lg:mt-0"><Image src={featured.coverImage} alt={featured.coverAlt} fill priority className="object-cover transition duration-700 group-hover:scale-[1.035] motion-reduce:transform-none" sizes="(min-width: 1024px) 38vw, 100vw" /><span className="absolute inset-0 bg-gradient-to-t from-[#14201B] via-[#14201B]/40 to-transparent" aria-hidden="true" /><div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7"><div className="flex flex-wrap items-center gap-2 text-xs text-white/80"><span className="rounded-full bg-[#20F28B] px-3 py-1 font-black text-[#14201B]">ویژه همکاران</span><span>{featured.category}</span><span aria-hidden="true">•</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {featured.readingMinutes.toLocaleString("fa-IR")} دقیقه</span></div><h2 className="mt-3 text-2xl font-black leading-10 sm:text-3xl">{featured.title}</h2><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#7CFFB7]">شروع مطالعه <ArrowLeft size={16} /></span></div></Link> : null}
        </section>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
          <div><span className="text-sm font-bold text-[#1F8A5B]">محتوای تخصصی B2B</span><h2 className="mt-1 text-2xl font-black">برای خرید عمده آگاهانه‌تر</h2></div>
          <nav className="flex flex-wrap gap-2" aria-label="فیلتر نوع محتوای عمده">
            {[{ href: "/b2b/blog", label: "همه مطالب", value: undefined }, { href: "/b2b/blog?type=article", label: "مقالات", value: "article" }, { href: "/b2b/blog?type=news", label: "اخبار", value: "news" }].map((item) => { const active = item.value === type; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${active ? "border-[#1F8A5B] bg-[#1F8A5B] text-white" : "border-[#D5D9C9] bg-white text-[#596B61] hover:border-[#1F8A5B] hover:text-[#176D48]"}`}>{item.label}</Link>; })}
          </nav>
        </div>

        {remaining.length ? <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="فهرست مطالب عمده">{remaining.map((post, index) => <ContentPostCard key={post.id} post={post} priority={index < 2} />)}</section> : posts.length ? null : <section className="mt-8 rounded-md border border-[#D5D9C9] bg-white p-10 text-center"><Newspaper className="mx-auto text-[#718078]" size={36} /><h2 className="mt-4 text-xl font-black">هنوز مطلبی در این بخش منتشر نشده است</h2><p className="mt-2 text-sm text-[#596B61]">از فیلتر «همه مطالب» استفاده کنید یا وارد کاتالوگ عمده شوید.</p></section>}

        <section className="relative mt-12 overflow-hidden rounded-[2rem] bg-[#153B2C] p-7 text-white shadow-[0_18px_45px_rgba(20,32,27,0.18)] sm:p-10">
          <Sparkles className="absolute -left-8 -top-8 text-white/10" size={180} aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div><span className="text-sm font-bold text-[#7CFFB7]">مرحله بعد روشن است</span><h2 className="mt-2 text-2xl font-black sm:text-3xl">از راهنما به سفارش عمده برسید</h2><p className="mt-3 max-w-2xl leading-7 text-white/75">قیمت همکاری، حداقل کارتن و موجودی فعال را در کاتالوگ ببینید یا مستقیماً سفارش سریع بسازید.</p></div><div className="flex shrink-0 flex-wrap gap-3"><Link href="/b2b/catalog" className="inline-flex min-h-14 items-center justify-center rounded-md border border-white/25 bg-white/10 px-5 font-black hover:bg-white/15">کاتالوگ عمده</Link><Link href="/b2b/quick-order" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#20F28B] px-6 font-black text-[#14201B] hover:bg-[#7CFFB7]">ثبت سفارش سریع <ArrowLeft size={18} /></Link></div></div>
        </section>
      </div>
    </main>
  );
}
