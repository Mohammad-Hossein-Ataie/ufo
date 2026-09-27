import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@ufo/ui";
import { categories } from "@ufo/domain";
import { HomepageProducts } from "@/components/homepage-products";
import { ContentPostCard } from "@/components/content-post-card";
import { getLatestHomepageProducts } from "@/lib/homepage-products";
import { listCatalogRows } from "@/lib/catalog-data";
import { categoryImageBySlug } from "@/lib/product-images";
import { listAdminBrands } from "@/lib/admin-brands";
import { getHomepagePartnerBrands } from "@/lib/homepage-brand-logos";
import { faqPageJsonLd, jsonLdScriptProps, organizationJsonLd, websiteJsonLd } from "@ufo/seo";
import { listPublishedPosts } from "@/lib/content-posts";

export const dynamic = "force-dynamic";

const homeFaq = [
  {
    question: "UFO Puff چه محصولاتی عرضه می‌کند؟",
    answer:
      "کاتالوگ یوفوپاف شامل پاد، ویپ، سالت نیکوتین، جویس، کارتریج، کویل و لوازم جانبی مرتبط است.",
  },
  {
    question: "قیمت محصولات چگونه نمایش داده می‌شود؟",
    answer: "قیمت‌ها در سیستم به ریال ذخیره می‌شوند و در رابط کاربری به تومان نمایش داده می‌شوند.",
  },
  {
    question: "آیا فروش عمده جدا از تک‌فروشی است؟",
    answer:
      "بله، مسیر عمده در بخش B2B قرار دارد و فقط محصولاتی که قیمت همکاری آن‌ها فعال شده باشد در کاتالوگ عمده نمایش داده می‌شوند.",
  },
];

const trustStrip = [
  {
    icon: Truck,
    title: "ارسال سریع",
    text: "مسیر ارسال و تحویل از همان ابتدای خرید روشن است.",
  },
  {
    icon: ShieldCheck,
    title: "اصالت کالا",
    text: "سفارش پیش از تایید نهایی با اطلاعات محصول تطبیق داده می‌شود.",
  },
  {
    icon: CreditCard,
    title: "پرداخت امن",
    text: "فرآیند پرداخت و رسید با مسیر قابل پیگیری انجام می‌شود.",
  },
  {
    icon: Headphones,
    title: "پشتیبانی مستقیم",
    text: "قبل و بعد از خرید، وضعیت سفارش قابل پیگیری است.",
  },
];

const stats = [
  { value: "+۵٬۰۰۰", label: "مشتری فعال" },
  { value: "+۱۲٬۰۰۰", label: "سفارش پردازش‌شده" },
  { value: "۴٫۸ / ۵", label: "رضایت خرید" },
  { value: categories.length.toLocaleString("fa-IR"), label: "دسته‌بندی کالا" },
];

const categoryAccent: Record<string, string> = {
  pod: "from-cyan-300/35",
  vape: "from-yellow-300/35",
  disposable: "from-yellow-300/30",
  "e-liquid": "from-cyan-300/30",
  "salt-nicotine": "from-purple-400/25",
  coil: "from-cyan-300/25",
  cartridge: "from-sky-300/25",
  lighter: "from-yellow-300/30",
};

export default async function HomePage() {
  const [catalogRows, latestPosts, savedBrands] = await Promise.all([
    listCatalogRows(),
    listPublishedPosts({ audience: "retail", limit: 3 }),
    listAdminBrands(),
  ]);
  const homepageSlots = getLatestHomepageProducts(catalogRows);
  const partnerBrands = getHomepagePartnerBrands(savedBrands);

  return (
    <main id="main-content" className="retail-storefront header-overlay-home">
      <script {...jsonLdScriptProps(organizationJsonLd())} />
      <script {...jsonLdScriptProps(websiteJsonLd())} />
      <script {...jsonLdScriptProps(faqPageJsonLd(homeFaq))} />

      <section className="home-hero relative isolate overflow-hidden" aria-labelledby="home-hero-title">
        <Image
          src="/images/ufo-hero.webp"
          alt="نمای فروشگاهی محصولات پاد و ویپ UFO Puff"
          fill
          priority
          unoptimized
          className="home-hero-image -z-10 object-cover"
          style={{ objectPosition: "center 72%" }}
          sizes="100vw"
        />
        <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="home-hero-light absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto flex min-h-[80svh] max-w-7xl flex-col justify-center px-4 pb-8 pt-6 sm:pb-14 sm:pt-12 lg:pb-16">
          <div className="home-hero-copy max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary backdrop-blur">
              <Sparkles size={14} className="text-retail-accent-2" aria-hidden="true" />
              یوفوپاف؛ فروش تکی و عمده پاد و ویپ
            </span>
            <h1 id="home-hero-title" className="mt-4 text-3xl font-black leading-[1.3] tracking-tight text-white sm:mt-5 sm:text-5xl md:text-6xl">
              کاتالوگ شفاف یوفوپاف برای پاد و ویپ،
              <span className="bg-gradient-to-l from-retail-accent to-retail-accent-2 bg-clip-text text-transparent">
                {" "}
                از انتخاب تا تحویل
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#D9E2EC] sm:mt-5 sm:text-lg sm:leading-8">
              پاد، ویپ، جویس و لوازم جانبی با موجودی لحظه‌ای، قیمت شفاف و کنترل سازگاری؛ برای خرید
              تکی مطمئن و سفارش عمده سریع.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 sm:mt-9 sm:gap-4">
              <Link href="/products">
                <Button size="lg" className="glow-accent min-h-12 px-5 text-base font-black sm:min-h-14 sm:px-7 sm:text-lg">
                  مشاهده محصولات
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/b2b">
                <Button
                  size="lg"
                  variant="ghost"
                  className="min-h-12 border-retail-border bg-white/10 px-5 text-base font-black text-white backdrop-blur hover:bg-white/15 sm:min-h-14 sm:px-7 sm:text-lg"
                >
                  <Store size={18} aria-hidden="true" />
                  خرید عمده (B2B)
                </Button>
              </Link>
            </div>
          </div>
          <div className="home-hero-categories mt-7 sm:mt-14" aria-labelledby="home-categories-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
              <div>
                <span className="text-xs font-bold text-retail-accent">مسیر سریع خرید</span>
                <h2 id="home-categories-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                  خرید بر اساس دسته‌بندی
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-bold text-retail-accent transition hover:text-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
              >
                کاتالوگ کامل
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
            </div>
            <ul className="home-category-rail" aria-label="دسته‌بندی‌های محصولات">
              {categories.map((category) => {
                const imageSrc = categoryImageBySlug[category.slug] ?? "/images/categories/default.png";
                const accent = categoryAccent[category.slug] ?? "from-cyan-300/25";

                return (
                  <li key={category.id} className="min-w-0 snap-start">
                    <Link
                      href={`/products/category/${category.slug}`}
                      className="home-category-card group relative isolate flex h-36 overflow-hidden rounded-2xl border border-white/20 bg-retail-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent min-[400px]:h-44 sm:h-48 lg:h-44"
                      aria-label={`مشاهده محصولات ${category.nameFa}`}
                    >
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        loading="lazy"
                        className="-z-20 object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                        sizes="(min-width: 1024px) 160px, (min-width: 640px) 190px, 44vw"
                      />
                      <span
                        className={`absolute inset-0 -z-10 bg-gradient-to-t ${accent} via-black/15 to-black/5`}
                        aria-hidden="true"
                      />
                      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/15 to-transparent" aria-hidden="true" />
                      <div className="mt-auto flex w-full items-end justify-between gap-1 p-3 text-sm font-black leading-5 text-white drop-shadow-md sm:text-base">
                        <h3>{category.nameFa}</h3>
                        <ArrowLeft className="shrink-0 text-retail-accent" size={16} aria-hidden="true" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-retail-secondary lg:hidden">برای دیدن همه دسته‌ها، کارت‌ها را به چپ و راست بکشید.</p>
          </div>
        </div>
      </section>

      <section className="section-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map((item) => (
            <div
              key={item.title}
              className="flex min-h-32 gap-3 rounded-retail border border-retail-border bg-[#101923] p-5 shadow-retail transition hover:border-retail-accent/50"
            >
              <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-retail-accent-2/10">
                <item.icon className="text-retail-accent-2" size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold text-white">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-retail-secondary">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="new-products-section section-surface-alt border-y border-retail-border">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">محصولات جدید یوفوپاف</h2>
              <p className="mt-2 text-retail-secondary">
                تازه‌ترین محصولات پاد، ویپ، پاد یک‌بارمصرف و سالت نیکوتین را کشف کنید.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-retail-accent transition hover:text-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
            >
              مشاهده همه
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </div>
          <HomepageProducts slots={homepageSlots} />
        </div>
      </section>

      <section className="section-surface-alt border-y border-retail-border">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-retail-accent">مجله یوفوپاف</span>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">آخرین اخبار و مقالات</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-retail-secondary">
                راهنماهای کاربردی خرید و تازه‌ترین خبرهای فروشگاه را یک‌جا دنبال کنید.
              </p>
            </div>
            <Link href="/blog" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-retail-accent transition hover:text-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent">
              مشاهده همه مطالب <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => <ContentPostCard key={post.id} post={post} />)}
          </div>
        </div>
      </section>

      <section className="section-surface-alt border-y border-retail-border">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-retail border border-retail-border bg-retail-surface p-6 text-center"
              >
                <div className="text-3xl font-black tabular-nums text-white">{item.value}</div>
                <div className="mt-2 text-sm text-retail-secondary">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#080E15] px-4 py-8 shadow-2xl shadow-black/25 sm:px-8 sm:py-10">
            <div
              className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-retail-accent/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-retail-accent-2/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-retail-accent/20 bg-retail-accent/5 px-4 py-2 text-xs font-bold tracking-wide text-retail-accent">
                <Users size={15} aria-hidden="true" />
                شبکه برندهای منتخب یوفوپاف
              </span>
              <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">برندهای همکار</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-retail-secondary sm:text-base">
                روی لوگوی هر برند بزنید تا محصولات همان برند را مستقیم در کاتالوگ ببینید.
              </p>
            </div>
            <ul
              className="relative mt-8 flex flex-wrap items-stretch justify-center gap-3"
              aria-label="فیلتر محصولات بر اساس برند"
            >
              {partnerBrands.map(({ brand, logo }) => (
                <li
                  key={brand.id}
                  className="w-[calc(50%_-_0.375rem)] sm:w-[calc(33.333%_-_0.5rem)] lg:w-[calc(20%_-_0.6rem)]"
                >
                  <Link
                    href={`/products?brand=${encodeURIComponent(brand.id)}`}
                    aria-label={`مشاهده محصولات برند ${brand.nameFa}`}
                    className="group relative flex min-h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] px-4 py-5 transition duration-300 hover:-translate-y-1 hover:border-retail-accent/50 hover:bg-white/[0.09] hover:shadow-[0_18px_45px_rgba(0,0,0,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent motion-reduce:transform-none motion-reduce:transition-none sm:min-h-32"
                  >
                    <span
                      className="pointer-events-none absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-retail-accent/70 to-transparent opacity-0 transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <span className="relative block h-16 w-[88%] sm:h-20">
                      <Image
                        src={logo}
                        alt=""
                        fill
                        unoptimized={logo.startsWith("/api/brand-images/")}
                        sizes="(min-width: 1024px) 12rem, (min-width: 640px) 28vw, 42vw"
                        loading="lazy"
                        className="object-contain opacity-90 drop-shadow-[0_0_18px_rgba(255,255,255,0.04)] transition duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:drop-shadow-[0_0_20px_rgba(0,229,255,0.14)] motion-reduce:transform-none motion-reduce:transition-none"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="relative overflow-hidden rounded-retail border border-retail-border bg-retail-surface p-8 sm:p-10">
          <div className="accent-halo pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                از موجودی تازه و تخفیف‌ها باخبر شوید
              </h2>
              <p className="mt-3 leading-7 text-retail-secondary">
                شماره تماس خود را ثبت کنید تا کاتالوگ به‌روز، محصولات جدید و پیشنهادهای همکاری
                یوفوپاف را دریافت کنید.
              </p>
            </div>
            <form className="flex w-full max-w-md items-center gap-2" aria-label="عضویت در خبرنامه">
              <label htmlFor="newsletter-phone" className="sr-only">
                شماره موبایل
              </label>
              <input
                id="newsletter-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                className="min-h-11 w-full rounded-md border border-retail-border bg-retail-surface-alt px-3 text-white outline-none transition placeholder:text-retail-muted focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/40"
              />
              <Button type="submit" className="shrink-0">
                عضویت
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="text-2xl font-black text-white sm:text-3xl">پرسش‌های رایج خرید</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {homeFaq.map((item) => (
            <article
              key={item.question}
              className="rounded-retail border border-retail-border bg-retail-surface p-6"
            >
              <div className="flex items-start gap-3">
                <PackageCheck
                  size={18}
                  className="mt-1 shrink-0 text-retail-accent"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-bold leading-7 text-white">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-retail-secondary">{item.answer}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
