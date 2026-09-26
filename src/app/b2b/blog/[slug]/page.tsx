import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, PackageSearch, UserRound } from "lucide-react";
import { absoluteUrl, breadcrumbJsonLd, canonical, jsonLdScriptProps } from "@ufo/seo";
import { ContentPostBody } from "@/components/content-post-body";
import { findPublishedPostBySlug, listPublishedPosts } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await findPublishedPostBySlug((await params).slug, "wholesale");
  if (!post) return { title: "مطلب عمده‌فروشی پیدا نشد" };
  const url = canonical(`/b2b/blog/${post.slug}`);
  return {
    title: post.seoTitle,
    description: post.seoDescription,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: "article", title: post.seoTitle, description: post.seoDescription, url, locale: "fa_IR", publishedTime: post.publishedAt ?? post.scheduledAt, modifiedTime: post.updatedAt, authors: [post.author], images: [{ url: absoluteUrl(post.coverImage), alt: post.coverAlt }] },
    twitter: { card: "summary_large_image", title: post.seoTitle, description: post.seoDescription, images: [absoluteUrl(post.coverImage)] },
  };
}

export default async function B2BContentPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await findPublishedPostBySlug((await params).slug, "wholesale");
  if (!post) notFound();
  const related = (await listPublishedPosts({ audience: "wholesale", type: post.type, limit: 4 })).filter((item) => item.id !== post.id).slice(0, 3);
  const publishedAt = post.publishedAt ?? post.scheduledAt ?? post.updatedAt;
  const articleUrl = `/b2b/blog/${post.slug}`;
  const articleJsonLd = { "@context": "https://schema.org", "@type": post.type === "news" ? "NewsArticle" : "Article", headline: post.title, description: post.seoDescription, image: [absoluteUrl(post.coverImage)], datePublished: publishedAt, dateModified: post.updatedAt, inLanguage: "fa-IR", author: { "@type": "Person", name: post.author }, publisher: { "@type": "Organization", name: "UFO Puff B2B", logo: { "@type": "ImageObject", url: absoluteUrl("/logos/logo.png") } }, mainEntityOfPage: canonical(articleUrl) };

  return (
    <main id="main-content" className="bg-[#F7F7F2] px-4 py-8 text-[#14201B] sm:py-12">
      <script {...jsonLdScriptProps(articleJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: "عمده‌فروشی", path: "/b2b" }, { name: "اخبار و مقالات عمده", path: "/b2b/blog" }, { name: post.title, path: articleUrl }]))} />
      <div className="mx-auto max-w-6xl">
        <Link href="/b2b/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#1F8A5B] hover:text-[#176D48]"><ArrowRight size={16} /> بازگشت به مطالب عمده</Link>
        <article className="mt-5 overflow-hidden rounded-[2rem] border border-[#D5D9C9] bg-white shadow-[0_20px_60px_rgba(20,32,27,0.08)]">
          <header className="relative overflow-hidden p-6 sm:p-10">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#E8FFF3] to-transparent" aria-hidden="true" />
            <div className="relative"><div className="flex flex-wrap items-center gap-2 text-xs text-[#718078]"><span className="rounded-full bg-[#E9FBF1] px-3 py-1 font-bold text-[#176D48]">{post.type === "news" ? "خبر عمده" : "مقاله عمده"}</span><span>{post.category}</span><span aria-hidden="true">•</span><time dateTime={publishedAt}>{new Date(publishedAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}</time></div><h1 className="mt-5 max-w-4xl text-3xl font-black leading-[1.45] sm:text-5xl">{post.title}</h1><p className="mt-5 max-w-3xl text-lg leading-9 text-[#596B61]">{post.excerpt}</p><div className="mt-6 flex flex-wrap gap-4 text-sm text-[#718078]"><span className="inline-flex items-center gap-2"><UserRound size={16} /> {post.author}</span><span className="inline-flex items-center gap-2"><Clock3 size={16} /> زمان مطالعه {post.readingMinutes.toLocaleString("fa-IR")} دقیقه</span></div></div>
          </header>
          <div className="relative aspect-video w-full bg-[#EEF0E5]"><Image src={post.coverImage} alt={post.coverAlt} fill priority className="object-cover" sizes="(min-width: 1024px) 72rem, 100vw" /></div>
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <ContentPostBody body={post.body} tone="wholesale" />
            {post.sources.length ? <section className="mt-10 border-t border-[#D5D9C9] pt-7"><h2 className="text-xl font-black">منابع</h2><ul className="mt-3 grid gap-2 text-sm text-[#1F8A5B]" dir="ltr">{post.sources.map((source) => <li key={source}><a href={source} target="_blank" rel="noreferrer" className="break-all hover:underline">{source}</a></li>)}</ul></section> : null}
            {post.tags.length ? <div className="mt-8 flex flex-wrap gap-2" aria-label="برچسب‌ها">{post.tags.map((tag) => <span key={tag} className="rounded-full border border-[#D5D9C9] bg-[#F7F7F2] px-3 py-1 text-xs text-[#596B61]">#{tag}</span>)}</div> : null}
            <section className="mt-10 rounded-2xl bg-[#153B2C] p-6 text-white sm:p-8">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div><span className="text-sm font-bold text-[#7CFFB7]">گام بعدی برای همکاران</span><h2 className="mt-2 text-2xl font-black">محصولات مناسب فروشگاهتان را بررسی کنید</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">قیمت همکاری و حداقل کارتن را ببینید؛ سپس سفارش را از مسیر سریع ثبت کنید.</p></div><div className="flex shrink-0 flex-wrap gap-3"><Link href="/b2b/catalog" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-5 font-bold hover:bg-white/10">کاتالوگ عمده</Link><Link href="/b2b/quick-order" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#20F28B] px-5 font-black text-[#14201B] hover:bg-[#7CFFB7]"><PackageSearch size={17} /> سفارش سریع <ArrowLeft size={16} /></Link></div></div>
            </section>
          </div>
        </article>
        {related.length ? <section className="mt-10"><h2 className="text-2xl font-black">مطالب مرتبط ویژه همکاران</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/b2b/blog/${item.slug}`} className="rounded-md border border-[#D5D9C9] bg-white p-5 shadow-sm transition hover:border-[#1F8A5B]"><span className="text-xs font-bold text-[#1F8A5B]">{item.category}</span><h3 className="mt-2 font-black leading-7">{item.title}</h3></Link>)}</div></section> : null}
      </div>
    </main>
  );
}
