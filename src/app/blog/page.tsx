import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, BookOpenText, Clock3, Newspaper, ShoppingBag, Sparkles } from "lucide-react";
import { canonical, itemListJsonLd, jsonLdScriptProps } from "@ufo/seo";
import { ContentPostCard, contentPostHref } from "@/components/content-post-card";
import { listPublishedPosts, type ContentPostType } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مجله خرید پاد و ویپ؛ اخبار و راهنماها",
  description: "راهنماهای کاربردی خرید و آخرین اخبار خرده‌فروشی یوفوپاف برای انتخاب دقیق‌تر پاد، ویپ، کارتریج، کویل و محصولات مرتبط.",
  alternates: { canonical: canonical("/blog") },
  openGraph: {
    title: "مجله خرید یوفوپاف",
    description: "راهنماهای انتخاب محصول و تازه‌ترین خبرهای خرده‌فروشی یوفوپاف.",
    url: canonical("/blog"),
    type: "website",
    locale: "fa_IR",
  },
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const requestedType = (await searchParams).type;
  const type: ContentPostType | undefined = requestedType === "news" || requestedType === "article" ? requestedType : undefined;
  const allPosts = await listPublishedPosts({ audience: "retail" });
  const posts = type ? allPosts.filter((post) => post.type === type) : allPosts;
  const featured = posts[0];
  const remaining = posts.slice(1);
  const articleCount = allPosts.filter((post) => post.type === "article").length;
  const newsCount = allPosts.filter((post) => post.type === "news").length;

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <script {...jsonLdScriptProps(itemListJsonLd(posts.map((post) => ({ name: post.title, url: contentPostHref(post) })), "مجله خرید یوفوپاف"))} />

      <section className="relative isolate overflow-hidden rounded-[2rem] border border-retail-border bg-retail-surface p-6 shadow-retail-lg sm:p-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-10">
        <div className="accent-halo pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="flex flex-col justify-center py-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-retail-accent/25 bg-retail-accent/5 px-3 py-1 text-xs font-bold text-retail-accent">
            <BookOpenText size={14} aria-hidden="true" /> مجله خرید خرده‌فروشی
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-black leading-[1.35] text-white sm:text-5xl">
            قبل از خرید، انتخاب مطمئن‌تری داشته باشید
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-retail-secondary">
            راهنمای مقایسه، نکات سازگاری و خبرهای فروشگاه را بخوانید؛ بعد مستقیم سراغ محصول مناسب خودتان بروید.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-retail-accent px-5 text-sm font-black text-retail-bg transition hover:bg-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent">
              <ShoppingBag size={17} aria-hidden="true" /> مشاهده محصولات <ArrowLeft size={16} aria-hidden="true" />
            </Link>
            {featured ? <Link href={contentPostHref(featured)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-retail-border bg-white/5 px-5 text-sm font-black text-white transition hover:border-retail-accent/60 hover:bg-white/10"><BookOpenCheck size={17} aria-hidden="true" /> مطالعه پیشنهاد امروز</Link> : null}
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-retail-border pt-6 sm:max-w-md">
            <div className="rounded-xl bg-white/[0.04] p-4"><dt className="text-xs text-retail-muted">راهنمای خرید</dt><dd className="mt-1 text-2xl font-black text-white">{articleCount.toLocaleString("fa-IR")}</dd></div>
            <div className="rounded-xl bg-white/[0.04] p-4"><dt className="text-xs text-retail-muted">خبر فروشگاه</dt><dd className="mt-1 text-2xl font-black text-white">{newsCount.toLocaleString("fa-IR")}</dd></div>
          </dl>
        </div>

        {featured ? (
          <Link href={contentPostHref(featured)} className="group relative mt-8 block min-h-[24rem] overflow-hidden rounded-2xl border border-retail-border bg-retail-media-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent lg:mt-0">
            <Image src={featured.coverImage} alt={featured.coverAlt} fill priority className="object-cover transition duration-700 group-hover:scale-[1.035] motion-reduce:transform-none" sizes="(min-width: 1024px) 38vw, 100vw" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-[#05070B]/45 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#D9E2EC]"><span className="rounded-full bg-retail-accent px-3 py-1 font-black text-retail-bg">مطلب منتخب</span><span>{featured.category}</span><span aria-hidden="true">•</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {featured.readingMinutes.toLocaleString("fa-IR")} دقیقه</span></div>
              <h2 className="mt-3 text-2xl font-black leading-10 text-white sm:text-3xl">{featured.title}</h2>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-retail-accent">شروع مطالعه <ArrowLeft size={16} /></span>
            </div>
          </Link>
        ) : null}
      </section>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
        <div><span className="text-sm font-bold text-retail-accent">تازه‌ترین محتوا</span><h2 className="mt-1 text-2xl font-black text-white">برای خرید آگاهانه‌تر</h2></div>
        <nav className="flex flex-wrap gap-2" aria-label="فیلتر نوع محتوا">
          {[{ href: "/blog", label: "همه مطالب", value: undefined }, { href: "/blog?type=article", label: "مقالات", value: "article" }, { href: "/blog?type=news", label: "اخبار", value: "news" }].map((item) => {
            const active = item.value === type;
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${active ? "border-retail-accent bg-retail-accent text-retail-bg" : "border-retail-border bg-retail-surface text-retail-secondary hover:border-retail-accent/60 hover:text-white"}`}>{item.label}</Link>;
          })}
        </nav>
      </div>

      {remaining.length ? <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="فهرست مطالب">{remaining.map((post, index) => <ContentPostCard key={post.id} post={post} priority={index < 2} />)}</section> : posts.length ? null : <section className="mt-8 rounded-retail border border-retail-border bg-retail-surface p-10 text-center"><Newspaper className="mx-auto text-retail-muted" size={36} /><h2 className="mt-4 text-xl font-black text-white">هنوز مطلبی در این بخش منتشر نشده است</h2><p className="mt-2 text-sm text-retail-secondary">از فیلتر «همه مطالب» استفاده کنید یا محصولات موجود را ببینید.</p></section>}

      <section className="relative mt-12 overflow-hidden rounded-[2rem] border border-retail-accent/25 bg-gradient-to-l from-[#0B2028] to-[#0D1117] p-7 sm:p-10">
        <Sparkles className="absolute -left-8 -top-8 text-retail-accent/10" size={180} aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div><span className="text-sm font-bold text-retail-accent">آماده انتخاب هستید؟</span><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">دانسته‌ها را به یک انتخاب درست تبدیل کنید</h2><p className="mt-3 max-w-2xl leading-7 text-retail-secondary">کاتالوگ را بر اساس دسته و برند بررسی کنید؛ موجودی و قیمت هر تنوع پیش از خرید نمایش داده می‌شود.</p></div>
          <Link href="/products" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-md bg-retail-accent px-6 text-base font-black text-retail-bg transition hover:bg-retail-accent-hover">رفتن به کاتالوگ محصولات <ArrowLeft size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
