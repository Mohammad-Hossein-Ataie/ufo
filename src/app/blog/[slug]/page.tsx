import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, ShoppingBag, UserRound } from "lucide-react";
import { absoluteUrl, breadcrumbJsonLd, canonical, jsonLdScriptProps } from "@ufo/seo";
import { ContentPostBody } from "@/components/content-post-body";
import { findPublishedPostBySlug, listPublishedPosts } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await findPublishedPostBySlug((await params).slug, "retail");
  if (!post) return { title: "مطلب پیدا نشد" };
  const url = canonical(`/blog/${post.slug}`);
  return { title: post.seoTitle, description: post.seoDescription, keywords: post.tags, authors: [{ name: post.author }], alternates: { canonical: url }, openGraph: { type: "article", title: post.seoTitle, description: post.seoDescription, url, locale: "fa_IR", publishedTime: post.publishedAt ?? post.scheduledAt, modifiedTime: post.updatedAt, authors: [post.author], images: [{ url: absoluteUrl(post.coverImage), alt: post.coverAlt }] }, twitter: { card: "summary_large_image", title: post.seoTitle, description: post.seoDescription, images: [absoluteUrl(post.coverImage)] } };
}

export default async function ContentPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await findPublishedPostBySlug((await params).slug, "retail");
  if (!post) notFound();
  const related = (await listPublishedPosts({ audience: "retail", type: post.type, limit: 4 })).filter((item) => item.id !== post.id).slice(0, 3);
  const publishedAt = post.publishedAt ?? post.scheduledAt ?? post.updatedAt;
  const articleJsonLd = { "@context": "https://schema.org", "@type": post.type === "news" ? "NewsArticle" : "Article", headline: post.title, description: post.seoDescription, image: [absoluteUrl(post.coverImage)], datePublished: publishedAt, dateModified: post.updatedAt, inLanguage: "fa-IR", author: { "@type": "Person", name: post.author }, publisher: { "@type": "Organization", name: "UFO Puff", logo: { "@type": "ImageObject", url: absoluteUrl("/logos/logo.png") } }, mainEntityOfPage: canonical(`/blog/${post.slug}`) };
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <script {...jsonLdScriptProps(articleJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: "خانه", path: "/" }, { name: "اخبار و مقالات", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]))} />
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-retail-accent hover:text-retail-accent-hover"><ArrowRight size={16} /> بازگشت به اخبار و مقالات</Link>
      <article className="mt-5 overflow-hidden rounded-[2rem] border border-retail-border bg-retail-surface">
        <header className="p-6 sm:p-10"><div className="flex flex-wrap items-center gap-2 text-xs text-retail-muted"><span className="rounded-full bg-retail-accent/10 px-3 py-1 font-bold text-retail-accent">{post.type === "news" ? "خبر" : "مقاله"}</span><span>{post.category}</span><span aria-hidden="true">•</span><time dateTime={publishedAt}>{new Date(publishedAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}</time></div><h1 className="mt-5 max-w-4xl text-3xl font-black leading-[1.45] text-white sm:text-5xl">{post.title}</h1><p className="mt-5 max-w-3xl text-lg leading-9 text-retail-secondary">{post.excerpt}</p><div className="mt-6 flex flex-wrap gap-4 text-sm text-retail-muted"><span className="inline-flex items-center gap-2"><UserRound size={16} /> {post.author}</span><span className="inline-flex items-center gap-2"><Clock3 size={16} /> زمان مطالعه {post.readingMinutes.toLocaleString("fa-IR")} دقیقه</span></div></header>
        <div className="relative aspect-video w-full bg-retail-media-bg"><Image src={post.coverImage} alt={post.coverAlt} fill priority className="object-cover" sizes="(min-width: 1024px) 72rem, 100vw" /></div>
        <div className="px-6 py-8 sm:px-10 sm:py-12"><ContentPostBody body={post.body} />{post.sources.length ? <section className="mt-10 border-t border-retail-border pt-7"><h2 className="text-xl font-black text-white">منابع</h2><ul className="mt-3 grid gap-2 text-sm text-retail-accent" dir="ltr">{post.sources.map((source) => <li key={source}><a href={source} target="_blank" rel="noreferrer" className="break-all hover:underline">{source}</a></li>)}</ul></section> : null}{post.tags.length ? <div className="mt-8 flex flex-wrap gap-2" aria-label="برچسب‌ها">{post.tags.map((tag) => <span key={tag} className="rounded-full border border-retail-border px-3 py-1 text-xs text-retail-secondary">#{tag}</span>)}</div> : null}<section className="mt-10 rounded-2xl border border-retail-accent/25 bg-gradient-to-l from-[#0B2028] to-[#080E15] p-6 sm:p-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div><span className="text-sm font-bold text-retail-accent">حالا انتخاب کنید</span><h2 className="mt-2 text-2xl font-black text-white">محصول مناسب خودتان را در کاتالوگ پیدا کنید</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-retail-secondary">موجودی، قیمت و تنوع هر محصول را بررسی کنید و با اطلاعات کامل‌تری خرید را ادامه دهید.</p></div><Link href="/products" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-retail-accent px-5 font-black text-retail-bg hover:bg-retail-accent-hover"><ShoppingBag size={17} /> مشاهده محصولات <ArrowLeft size={16} /></Link></div></section></div>
      </article>
      {related.length ? <section className="mt-10"><h2 className="text-2xl font-black text-white">مطالب مرتبط</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/blog/${item.slug}`} className="rounded-retail border border-retail-border bg-retail-surface p-5 transition hover:border-retail-accent/60"><span className="text-xs font-bold text-retail-accent">{item.category}</span><h3 className="mt-2 font-black leading-7 text-white">{item.title}</h3></Link>)}</div></section> : null}
    </main>
  );
}
