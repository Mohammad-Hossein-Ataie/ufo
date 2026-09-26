import { randomUUID } from "node:crypto";
import { getDb, hasUsableMongoUri } from "@ufo/database";
import type { Db } from "mongodb";

export type ContentPostType = "article" | "news";
export type ContentPostStatus = "draft" | "scheduled" | "published";
export type ContentAudience = "retail" | "wholesale";

export interface ContentPost {
  id: string;
  type: ContentPostType;
  audience: ContentAudience;
  status: ContentPostStatus;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  coverAlt: string;
  category: string;
  tags: string[];
  author: string;
  sources: string[];
  seoTitle: string;
  seoDescription: string;
  readingMinutes: number;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPostInput {
  type?: unknown;
  audience?: unknown;
  status?: unknown;
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  body?: unknown;
  coverImage?: unknown;
  coverAlt?: unknown;
  category?: unknown;
  tags?: unknown;
  author?: unknown;
  sources?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  scheduledAt?: unknown;
}

const seededAt = "2026-08-05T08:00:00.000Z";
const memoryPosts: ContentPost[] = [
  {
    id: "guide-compatible-cartridge",
    type: "article",
    audience: "retail",
    status: "published",
    title: "چطور کارتریج سازگار با دستگاه خود را پیدا کنیم؟",
    slug: "compatible-cartridge-guide",
    excerpt:
      "راهنمای بررسی نام دستگاه، سری کارتریج، مقاومت کویل و مشخصات فنی برای انتخاب دقیق‌تر.",
    body: `انتخاب کارتریج سازگار از مقایسه دقیق مدل دستگاه و مشخصات محصول شروع می‌شود.

## مدل و سری دستگاه را بررسی کنید
نام کامل دستگاه و سری کارتریج را از روی بدنه یا جعبه بخوانید. شباهت ظاهری به‌تنهایی نشانه سازگاری نیست.

## مقاومت و نوع مصرف
مقدار مقاومت کویل با علامت Ω نمایش داده می‌شود. تنها از گزینه‌هایی استفاده کنید که سازنده برای دستگاه معرفی کرده است.

اگر سازگاری در صفحه محصول روشن نیست، پیش از خرید از پشتیبانی سؤال کنید.`,
    coverImage: "/images/ufo-hero.webp",
    coverAlt: "راهنمای انتخاب کارتریج سازگار با پاد",
    category: "راهنمای خرید",
    tags: ["کارتریج", "کویل", "راهنمای خرید"],
    author: "تحریریه یوفوپاف",
    sources: [],
    seoTitle: "راهنمای انتخاب کارتریج سازگار با دستگاه | یوفوپاف",
    seoDescription:
      "برای پیدا کردن کارتریج سازگار، مدل دستگاه، سری کارتریج و مقاومت کویل را مرحله‌به‌مرحله بررسی کنید و انتخاب دقیق‌تری داشته باشید.",
    readingMinutes: 2,
    publishedAt: seededAt,
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "guide-disposable-buying",
    type: "article",
    audience: "retail",
    status: "published",
    title: "در خرید پاد یک‌بارمصرف به چه نکاتی توجه کنیم؟",
    slug: "disposable-pod-buying-guide",
    excerpt:
      "مقایسه تعداد پاف، ظرفیت باتری، نوع شارژ، برند و موجودی برای یک انتخاب آگاهانه‌تر.",
    body: `پیش از انتخاب پاد یک‌بارمصرف، مشخصات درج‌شده برای هر مدل را کنار هم قرار دهید.

## مشخصات قابل مقایسه
تعداد پاف اعلامی، ظرفیت باتری، قابلیت شارژ، طعم و قیمت نهایی مهم‌ترین اطلاعات صفحه محصول هستند.

عدد پاف یک مقدار تقریبی است و الگوی مصرف می‌تواند نتیجه واقعی را تغییر دهد.`,
    coverImage: "/images/ufo-hero.webp",
    coverAlt: "راهنمای خرید پاد یک‌بارمصرف",
    category: "راهنمای خرید",
    tags: ["پاد یک‌بارمصرف", "راهنمای خرید"],
    author: "تحریریه یوفوپاف",
    sources: [],
    seoTitle: "راهنمای خرید پاد یک‌بارمصرف | یوفوپاف",
    seoDescription:
      "هنگام خرید پاد یک‌بارمصرف، تعداد پاف، ظرفیت باتری، نوع شارژ، برند، موجودی و قیمت نهایی را با هم مقایسه کنید.",
    readingMinutes: 1,
    publishedAt: "2026-08-03T08:00:00.000Z",
    createdAt: "2026-08-03T08:00:00.000Z",
    updatedAt: "2026-08-03T08:00:00.000Z",
  },
  {
    id: "news-retail-wholesale",
    type: "news",
    audience: "wholesale",
    status: "published",
    title: "مسیر خرید تکی و همکاری یوفوپاف چگونه کار می‌کند؟",
    slug: "retail-and-wholesale-shopping",
    excerpt:
      "تفکیک شفاف قیمت واحد، حداقل سفارش همکاری و کالاهای فعال در کاتالوگ عمده یوفوپاف.",
    body: `فروشگاه یوفوپاف دو مسیر مجزا برای خرید تکی و همکاری دارد.

در خرید تکی، قیمت واحد و موجودی همان لحظه نمایش داده می‌شود. در مسیر همکاری، قیمت عمده و حداقل تعداد کارتن فقط برای کالاهایی نمایش داده می‌شود که فروش همکاری آن‌ها فعال است.`,
    coverImage: "/images/ufo-hero.webp",
    coverAlt: "مسیر خرید تکی و عمده یوفوپاف",
    category: "اخبار فروشگاه",
    tags: ["خرید تکی", "خرید عمده", "همکاری"],
    author: "روابط عمومی یوفوپاف",
    sources: [],
    seoTitle: "خرید تکی و عمده از یوفوپاف چگونه است؟",
    seoDescription:
      "با تفاوت مسیر خرید تکی و همکاری یوفوپاف، نحوه نمایش قیمت عمده و حداقل سفارش کالاهای فعال آشنا شوید.",
    readingMinutes: 1,
    publishedAt: "2026-08-01T08:00:00.000Z",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-01T08:00:00.000Z",
  },
];

async function ensureSeededContent(db: Db): Promise<void> {
  const marker = await db.collection("settings").updateOne(
    { id: "content-seed-v1" },
    { $setOnInsert: { id: "content-seed-v1", createdAt: new Date().toISOString() } },
    { upsert: true },
  );
  if (marker.upsertedCount === 1) {
    try {
      await db.collection<ContentPost>("blogPosts").bulkWrite(
        memoryPosts.map((post) => ({
          updateOne: { filter: { slug: post.slug }, update: { $setOnInsert: post }, upsert: true },
        })),
      );
    } catch (error) {
      await db.collection("settings").deleteOne({ id: "content-seed-v1" });
      throw error;
    }
  }

  const audienceMarker = await db.collection("settings").updateOne(
    { id: "content-audience-v1" },
    { $setOnInsert: { id: "content-audience-v1", createdAt: new Date().toISOString() } },
    { upsert: true },
  );
  if (audienceMarker.upsertedCount === 1) {
    try {
      await db.collection("blogPosts").updateMany(
        { audience: { $nin: ["retail", "wholesale"] } },
        { $set: { audience: "retail" } },
      );
      await db.collection("blogPosts").updateOne(
        { slug: "retail-and-wholesale-shopping" },
        { $set: { audience: "wholesale" } },
      );
    } catch (error) {
      await db.collection("settings").deleteOne({ id: "content-audience-v1" });
      throw error;
    }
  }
}

function text(value: unknown, maxLength: number): string {
  return (typeof value === "string" ? value : "").trim().slice(0, maxLength);
}

function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n]/) : [];
  return [...new Set(values.map((item) => text(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

export function contentSlug(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function readingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function parseInput(input: ContentPostInput, current?: ContentPost): Omit<ContentPost, "id" | "createdAt" | "updatedAt" | "publishedAt"> {
  const title = text(input.title, 140);
  const slug = contentSlug(text(input.slug, 120) || title);
  const excerpt = text(input.excerpt, 320);
  const body = text(input.body, 50_000);
  const type: ContentPostType = input.type === "news" ? "news" : "article";
  const audience: ContentAudience = input.audience === "wholesale" ? "wholesale" : "retail";
  const status: ContentPostStatus =
    input.status === "published" || input.status === "scheduled" ? input.status : "draft";
  const scheduledAt = text(input.scheduledAt, 40);

  if (title.length < 10) throw new Error("عنوان باید حداقل ۱۰ کاراکتر باشد.");
  if (!slug) throw new Error("اسلاگ معتبر الزامی است.");
  if (excerpt.length < 30) throw new Error("خلاصه باید حداقل ۳۰ کاراکتر باشد.");
  if (body.length < 80) throw new Error("متن محتوا باید حداقل ۸۰ کاراکتر باشد.");
  if (status === "scheduled") {
    const date = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now())
      throw new Error("برای انتشار زمان‌بندی‌شده، زمان معتبری در آینده انتخاب کنید.");
  }

  const seoTitle = text(input.seoTitle, 70) || title;
  const seoDescription = text(input.seoDescription, 180) || excerpt;
  if (seoTitle.length < 20) throw new Error("عنوان SEO باید حداقل ۲۰ کاراکتر باشد.");
  if (seoDescription.length < 70)
    throw new Error("توضیحات SEO باید حداقل ۷۰ کاراکتر باشد.");

  return {
    type,
    audience,
    status,
    title,
    slug,
    excerpt,
    body,
    coverImage: text(input.coverImage, 1_000) || current?.coverImage || "/images/ufo-hero.webp",
    coverAlt: text(input.coverAlt, 180) || title,
    category: text(input.category, 80) || (type === "news" ? "اخبار فروشگاه" : "راهنمای خرید"),
    tags: stringList(input.tags, 12, 60),
    author: text(input.author, 100) || "تحریریه یوفوپاف",
    sources: stringList(input.sources, 12, 500).filter((source) => {
      try {
        return new URL(source).protocol === "https:";
      } catch {
        return false;
      }
    }),
    seoTitle,
    seoDescription,
    readingMinutes: readingMinutes(body),
    ...(status === "scheduled" ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
  };
}

function withoutMongoId(post: ContentPost & { _id?: unknown }): ContentPost {
  const { _id: _ignored, ...plain } = post;
  return { ...plain, audience: post.audience === "wholesale" ? "wholesale" : "retail" };
}

function isPublic(post: ContentPost, now = Date.now()): boolean {
  return (
    post.status === "published" ||
    (post.status === "scheduled" && Boolean(post.scheduledAt) && new Date(post.scheduledAt!).getTime() <= now)
  );
}

export async function listPublishedPosts(
  options: { limit?: number; type?: ContentPostType; audience?: ContentAudience } = {},
): Promise<ContentPost[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  if (!hasUsableMongoUri()) {
    return memoryPosts
      .filter(
        (post) =>
          isPublic(post) &&
          (!options.type || post.type === options.type) &&
          (!options.audience || post.audience === options.audience),
      )
      .sort((a, b) => String(b.publishedAt ?? b.scheduledAt).localeCompare(String(a.publishedAt ?? a.scheduledAt)))
      .slice(0, limit);
  }
  const now = new Date().toISOString();
  const db = await getDb();
  await ensureSeededContent(db);
  const posts = await db
    .collection<ContentPost>("blogPosts")
    .find({
      ...(options.type ? { type: options.type } : {}),
      ...(options.audience ? { audience: options.audience } : {}),
      $or: [{ status: "published" }, { status: "scheduled", scheduledAt: { $lte: now } }],
    })
    .sort({ publishedAt: -1, scheduledAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return posts.map(withoutMongoId);
}

export async function findPublishedPostBySlug(
  slug: string,
  audience?: ContentAudience,
): Promise<ContentPost | undefined> {
  const normalized = contentSlug(slug);
  if (!normalized) return undefined;
  if (!hasUsableMongoUri())
    return memoryPosts.find(
      (post) => post.slug === normalized && isPublic(post) && (!audience || post.audience === audience),
    );
  const now = new Date().toISOString();
  const db = await getDb();
  await ensureSeededContent(db);
  const post = await db.collection<ContentPost>("blogPosts").findOne({
    slug: normalized,
    ...(audience ? { audience } : {}),
    $or: [{ status: "published" }, { status: "scheduled", scheduledAt: { $lte: now } }],
  });
  return post ? withoutMongoId(post) : undefined;
}

export async function listAdminPosts(): Promise<ContentPost[]> {
  if (!hasUsableMongoUri()) return [...memoryPosts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const db = await getDb();
  await ensureSeededContent(db);
  return (await db.collection<ContentPost>("blogPosts").find({}).sort({ updatedAt: -1 }).toArray()).map(withoutMongoId);
}

export async function getAdminPost(id: string): Promise<ContentPost | undefined> {
  if (!hasUsableMongoUri()) return memoryPosts.find((post) => post.id === id);
  const db = await getDb();
  await ensureSeededContent(db);
  const post = await db.collection<ContentPost>("blogPosts").findOne({ id });
  return post ? withoutMongoId(post) : undefined;
}

export async function saveContentPost(input: ContentPostInput, id?: string): Promise<ContentPost> {
  const current = id ? await getAdminPost(id) : undefined;
  if (id && !current) throw new Error("مطلب پیدا نشد.");
  const parsed = parseInput(input, current);
  const duplicate = (await listAdminPosts()).find((post) => post.slug === parsed.slug && post.id !== id);
  if (duplicate) throw new Error("این اسلاگ قبلاً استفاده شده است.");
  const now = new Date().toISOString();
  const post: ContentPost = {
    ...parsed,
    id: current?.id ?? randomUUID(),
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    ...(parsed.status === "published"
      ? { publishedAt: current?.publishedAt ?? now }
      : current?.publishedAt
        ? { publishedAt: current.publishedAt }
        : {}),
  };
  if (!hasUsableMongoUri()) {
    const index = memoryPosts.findIndex((item) => item.id === post.id);
    if (index === -1) memoryPosts.unshift(post);
    else memoryPosts[index] = post;
    return post;
  }
  const db = await getDb();
  await db.collection<ContentPost>("blogPosts").updateOne({ id: post.id }, { $set: post }, { upsert: true });
  return post;
}

export async function deleteContentPost(id: string): Promise<boolean> {
  if (!hasUsableMongoUri()) {
    const index = memoryPosts.findIndex((post) => post.id === id);
    if (index === -1) return false;
    memoryPosts.splice(index, 1);
    return true;
  }
  const db = await getDb();
  return (await db.collection<ContentPost>("blogPosts").deleteOne({ id })).deletedCount === 1;
}
