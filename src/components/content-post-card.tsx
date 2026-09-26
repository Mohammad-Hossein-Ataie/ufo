import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, Newspaper, Store } from "lucide-react";
import type { ContentPost } from "@/lib/content-posts";

export function contentPostHref(post: Pick<ContentPost, "audience" | "slug">) {
  return `${post.audience === "wholesale" ? "/b2b/blog" : "/blog"}/${post.slug}`;
}

export function ContentPostCard({ post, priority = false }: { post: ContentPost; priority?: boolean }) {
  const date = post.publishedAt ?? post.scheduledAt ?? post.updatedAt;
  const wholesale = post.audience === "wholesale";

  return (
    <article
      className={wholesale
        ? "group overflow-hidden rounded-md border border-[#D5D9C9] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#1F8A5B] hover:shadow-[0_18px_44px_rgba(20,32,27,0.12)] motion-reduce:transform-none motion-reduce:transition-none"
        : "group overflow-hidden rounded-retail border border-retail-border bg-retail-surface shadow-retail transition duration-300 hover:-translate-y-1 hover:border-retail-accent/60 hover:shadow-retail-lg motion-reduce:transform-none motion-reduce:transition-none"}
    >
      <Link
        href={contentPostHref(post)}
        className={`block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${wholesale ? "focus-visible:outline-[#1F8A5B]" : "focus-visible:outline-retail-accent"}`}
      >
        <div className={`relative aspect-video overflow-hidden ${wholesale ? "bg-[#EEF0E5]" : "bg-retail-media-bg"}`}>
          <Image src={post.coverImage} alt={post.coverAlt} fill priority={priority} className="object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur"><Newspaper size={13} aria-hidden="true" />{post.type === "news" ? "خبر" : "مقاله"}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black shadow-sm ${wholesale ? "bg-[#E9FBF1] text-[#176D48]" : "bg-retail-accent text-retail-bg"}`}><Store size={12} aria-hidden="true" />{wholesale ? "عمده" : "خرده"}</span>
          </div>
        </div>
        <div className="flex min-h-[17rem] flex-col p-5">
          <div className={`flex flex-wrap items-center gap-2 text-xs ${wholesale ? "text-[#718078]" : "text-retail-muted"}`}><span className={`font-bold ${wholesale ? "text-[#1F8A5B]" : "text-retail-accent"}`}>{post.category}</span><span aria-hidden="true">•</span><time dateTime={date}>{new Date(date).toLocaleDateString("fa-IR")}</time><span aria-hidden="true">•</span><span className="inline-flex items-center gap-1"><Clock3 size={13} aria-hidden="true" /> {post.readingMinutes.toLocaleString("fa-IR")} دقیقه</span></div>
          <h3 className={`mt-3 line-clamp-2 text-lg font-black leading-8 transition ${wholesale ? "text-[#14201B] group-hover:text-[#176D48]" : "text-white group-hover:text-retail-accent"}`}>{post.title}</h3>
          <p className={`mt-2 line-clamp-3 text-sm leading-7 ${wholesale ? "text-[#596B61]" : "text-retail-secondary"}`}>{post.excerpt}</p>
          <span className={`mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-black ${wholesale ? "text-[#1F8A5B]" : "text-retail-accent"}`}>{post.type === "news" ? "مشاهده خبر" : "مطالعه مقاله"}<ArrowLeft size={16} aria-hidden="true" /></span>
        </div>
      </Link>
    </article>
  );
}
