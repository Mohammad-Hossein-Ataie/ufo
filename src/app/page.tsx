import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Cog,
  Cpu,
  Droplets,
  Flame,
  FlaskConical,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { Button, Price, StockStatus } from "@ufo/ui";
import {
  brands,
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  products,
} from "@ufo/domain";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { categoryImageBySlug, getProductImage } from "@/lib/product-images";
import { faqPageJsonLd, jsonLdScriptProps, organizationJsonLd, websiteJsonLd } from "@ufo/seo";

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
    icon: ShieldCheck,
    title: "کنترل اصالت",
    text: "رسید و سفارش پیش از تایید نهایی بررسی می‌شود.",
  },
  {
    icon: Truck,
    title: "ارسال منعطف",
    text: "تیپاکس، پیک تهران و تحویل حضوری قابل انتخاب است.",
  },
  {
    icon: Warehouse,
    title: "موجودی مشترک",
    text: "رزرو سفارش برای جلوگیری از فروش بیش از موجودی طراحی شده است.",
  },
];

const heroHighlights = ["ضمانت اصالت", "ارسال سریع", "پرداخت امن", "پشتیبانی مستقیم"];

const stats = [
  { value: "+۵٬۰۰۰", label: "مشتری فعال" },
  { value: "+۱۲٬۰۰۰", label: "سفارش پردازش‌شده" },
  { value: "۴٫۸ / ۵", label: "رضایت خرید" },
  { value: categories.length.toLocaleString("fa-IR"), label: "دسته‌بندی کالا" },
];

const categoryIcons: Record<string, typeof Boxes> = {
  pod: Cpu,
  vape: Zap,
  disposable: Sparkles,
  "e-liquid": Droplets,
  "salt-nicotine": FlaskConical,
  coil: Cog,
  cartridge: Boxes,
  lighter: Flame,
};

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

export default function HomePage() {
  const featured = products.filter((product) => product.isActive).slice(0, 4);

  return (
    <main id="main-content">
      <script {...jsonLdScriptProps(organizationJsonLd())} />
      <script {...jsonLdScriptProps(websiteJsonLd())} />
      <script {...jsonLdScriptProps(faqPageJsonLd(homeFaq))} />

      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/ufo-hero.png"
          alt="نمای فروشگاهی محصولات پاد و ویپ UFO Puff"
          fill
          priority
          unoptimized
          className="-z-10 object-cover"
          style={{ objectPosition: "center 72%" }}
          sizes="100vw"
        />
        <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto flex min-h-[80svh] max-w-7xl items-center px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-retail-border bg-white/5 px-3 py-1 text-xs font-medium text-retail-secondary backdrop-blur">
              <Sparkles size={14} className="text-retail-accent-2" aria-hidden="true" />
              یوفوپاف؛ فروش تکی و عمده پاد و ویپ
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.2] tracking-tight text-white sm:text-5xl md:text-6xl">
              کاتالوگ شفاف یوفوپاف برای پاد و ویپ،
              <span className="bg-gradient-to-l from-retail-accent to-retail-accent-2 bg-clip-text text-transparent">
                {" "}
                از انتخاب تا تحویل
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#D9E2EC]">
              پاد، ویپ، جویس و لوازم جانبی با موجودی لحظه‌ای، قیمت شفاف و کنترل سازگاری؛ برای خرید
              تکی مطمئن و سفارش عمده سریع.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" className="glow-accent">
                  مشاهده محصولات
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/b2b">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-retail-border bg-white/5 text-white backdrop-blur hover:bg-white/10"
                >
                  <Store size={18} aria-hidden="true" />
                  خرید عمده (B2B)
                </Button>
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-retail-secondary">
              {heroHighlights.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <BadgeCheck size={16} className="text-retail-accent-2" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-surface">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 md:grid-cols-3">
          {trustStrip.map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-retail border border-retail-border bg-white/[0.02] p-4"
            >
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-retail-accent-2/10">
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

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">محصولات منتخب یوفوپاف</h2>
            <p className="mt-2 text-retail-secondary">
              قیمت‌ها در دیتابیس ریالی ذخیره و در UI به تومان نمایش داده می‌شوند.
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => {
            const variant = getPrimaryVariant(product.id);
            const inventory = getInventoryByVariant(variant.id);
            const available = inventory ? getAvailableStock(inventory) : 0;
            const category = categories.find((item) => item.id === product.categoryId);
            const imageSrc = getProductImage(product);
            return (
              <article
                key={product.id}
                className="group relative isolate grid h-full overflow-hidden rounded-retail bg-[#0C1218] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.16),0_18px_44px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.42),0_24px_60px_rgba(0,0,0,0.32)]"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="absolute inset-0 z-10 rounded-retail focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
                  aria-label={`مشاهده جزئیات ${product.nameFa}`}
                />
                <div className="relative aspect-[4/3] overflow-hidden bg-retail-surface-alt">
                  <Image
                    src={imageSrc}
                    alt={product.nameFa}
                    fill
                    loading="lazy"
                    className="object-cover transition duration-500 group-hover:scale-[1.05]"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#0C1218] via-transparent to-black/10"
                    aria-hidden="true"
                  />
                  <div className="absolute right-3 top-3 z-20">
                    <StockStatus available={available} />
                  </div>
                  {category ? (
                    <span className="absolute bottom-3 left-3 z-20 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-[#D9E2EC] backdrop-blur">
                      {category.nameFa}
                    </span>
                  ) : null}
                </div>
                <div className="grid min-h-[19rem] grid-rows-[auto_auto_1fr_auto] gap-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 text-lg font-black leading-8 text-white">
                      {product.nameFa}
                    </h3>
                    {product.nameEn ? (
                      <p className="mt-1 line-clamp-1 text-xs font-medium text-retail-muted">
                        {product.nameEn}
                      </p>
                    ) : null}
                  </div>
                  <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-retail-secondary">
                    {product.shortDescriptionFa}
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                    <span className="text-xs text-retail-muted">قیمت خرید تکی</span>
                    <Price
                      valueRial={variant.retailPriceRial}
                      className="text-lg font-black text-white"
                    />
                  </div>
                  <div className="relative z-20 grid gap-2">
                    <AddToCartButton variantId={variant.id} />
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold text-retail-accent transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
                    >
                      جزئیات
                      <ArrowLeft size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">خرید بر اساس دسته‌بندی</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-retail-secondary">
              دسته‌های اصلی یوفوپاف با تصویر جداگانه، ارتفاع یکدست و مسیر مستقیم به کاتالوگ.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-retail-accent transition hover:text-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
          >
            کاتالوگ کامل
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Boxes;
            const imageSrc = categoryImageBySlug[category.slug] ?? "/images/categories/default.png";
            const accent = categoryAccent[category.slug] ?? "from-cyan-300/25";

            return (
              <Link
                key={category.id}
                href={`/products/category/${category.slug}`}
                className="group relative isolate flex min-h-[17rem] overflow-hidden rounded-retail border border-retail-border bg-retail-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-retail-accent/70 hover:shadow-retail-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
              >
                <Image
                  src={imageSrc}
                  alt={`دسته ${category.nameFa} در فروشگاه یوفوپاف`}
                  fill
                  loading="lazy"
                  className="-z-20 object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
                <span
                  className={`absolute inset-0 -z-10 bg-gradient-to-t ${accent} via-black/45 to-black/10`}
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-black/90 to-transparent"
                  aria-hidden="true"
                />
                <div className="mt-auto flex min-h-[7.5rem] w-full flex-col justify-end">
                  <h3 className="text-2xl font-black text-white drop-shadow-sm">
                    {category.nameFa}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#D9E2EC]">
                    {category.descriptionFa}
                  </p>
                  <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-sm font-bold text-retail-accent backdrop-blur transition group-hover:bg-retail-accent group-hover:text-retail-bg">
                    کلیک کنید
                    <Icon size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
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

          <div className="mt-12">
            <div className="flex items-center justify-center gap-2 text-sm text-retail-secondary">
              <Users size={16} aria-hidden="true" />
              <span>برندهای همکار</span>
            </div>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {brands.map((brand) => (
                <li
                  key={brand.id}
                  className="rounded-full border border-retail-border bg-retail-surface px-5 py-2 text-sm font-bold text-[#D9E2EC]"
                >
                  {brand.nameFa}
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
