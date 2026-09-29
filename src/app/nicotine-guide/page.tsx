import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  Calculator,
  CircleAlert,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { breadcrumbJsonLd, canonical, faqPageJsonLd, jsonLdScriptProps } from "@ufo/seo";
import {
  NicotineGuideCalculator,
  type NicotineRecommendationSets,
} from "@/components/nicotine-guide-calculator";
import { getCatalogRowAvailability, listCatalogRowsForDiscovery } from "@/lib/catalog-data";
import { getCategoryImage, getProductImage } from "@/lib/product-images";
import {
  buildNicotineRecommendationSets,
  summarizeNicotineCatalog,
} from "@/lib/nicotine-product-recommendations";

export const dynamic = "force-dynamic";

const faqItems = [
  {
    question: "برای کسی که روزانه ۱۰ نخ سیگار می‌کشد چه نیکوتینی مناسب است؟",
    answer:
      "به‌عنوان نقطه شروع، برای پاد کم‌وات معمولاً سالت ۱۰ تا ۱۲ میلی‌گرم در میلی‌لیتر و برای ویپ پرقدرت جویس فری‌بیس ۳ تا ۶ میلی‌گرم در میلی‌لیتر بررسی می‌شود. زمان اولین سیگار و مشخصات دستگاه می‌تواند این بازه را تغییر دهد.",
  },
  {
    question: "سالت نیکوتین بهتر است یا جویس معمولی؟",
    answer:
      "سالت بیشتر برای پادهای کم‌وات و کام‌دهی دهان‌به‌ریه مناسب است. جویس فری‌بیس با غلظت پایین‌تر معمولاً برای ویپ یا مود پرقدرت و بخار بیشتر انتخاب می‌شود. نوع دستگاه از تعداد نخ مهم‌تر است.",
  },
  {
    question: "آیا سیگار لایت به نیکوتین کمتری نیاز دارد؟",
    answer:
      "نه لزوماً. برچسب لایت یا رنگ پاکت مقدار واقعی دریافت نیکوتین را دقیق نشان نمی‌دهد، چون شیوه پک‌زدن و دفعات مصرف متفاوت است. این راهنما از تعداد نخ و زمان اولین سیگار استفاده می‌کند.",
  },
  {
    question: "آیا سالت ۳۵ یا ۵۰ میلی‌گرم پیشنهاد می‌شود؟",
    answer:
      "این راهنما غلظت بالاتر از ۲۰ میلی‌گرم در میلی‌لیتر را پیشنهاد نمی‌کند. دریافت نیکوتین به دستگاه و شیوه مصرف وابسته است و غلظت بالا می‌تواند احتمال دریافت بیش‌ازحد را افزایش دهد.",
  },
  {
    question: "از کجا بفهمم نیکوتین زیاد یا کم است؟",
    answer:
      "ادامه میل شدید به سیگار یا مصرف هم‌زمان مکرر می‌تواند نشانه ناکافی‌بودن باشد. تهوع، سرگیجه، سردرد یا تپش قلب می‌تواند نشانه دریافت زیاد باشد؛ مصرف را متوقف کنید و برای علائم شدید یا ماندگار کمک پزشکی بگیرید.",
  },
];

export const metadata: Metadata = {
  title: "محاسبه‌گر نیکوتین سالت و جویس بر اساس مصرف سیگار",
  description:
    "با تعداد نخ سیگار، زمان اولین سیگار و نوع دستگاه، بازه شروع نیکوتین سالت یا جویس فری‌بیس را پیدا کنید؛ راهنمای رایگان ویژه بزرگسالان سیگاری.",
  keywords: [
    "محاسبه نیکوتین سالت",
    "نیکوتین مناسب بر اساس تعداد سیگار",
    "سالت چند میلی گرم",
    "جویس مناسب ترک سیگار",
    "تفاوت سالت و جویس",
  ],
  alternates: { canonical: canonical("/nicotine-guide") },
  openGraph: {
    title: "محاسبه‌گر نیکوتین سالت و جویس | یوفوپاف",
    description:
      "یک بازه شروع محافظه‌کارانه برای نیکوتین، متناسب با مصرف سیگار و نوع دستگاه پیدا کنید.",
    url: canonical("/nicotine-guide"),
    type: "website",
    locale: "fa_IR",
    images: [
      {
        url: "/logos/logo.png",
        width: 500,
        height: 500,
        alt: "محاسبه‌گر نیکوتین یوفوپاف",
      },
    ],
  },
  robots: { index: true, follow: true },
};

const applicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": canonical("/nicotine-guide#calculator"),
  name: "محاسبه‌گر نیکوتین سالت و جویس یوفوپاف",
  url: canonical("/nicotine-guide"),
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  inLanguage: "fa-IR",
  isAccessibleForFree: true,
  audience: {
    "@type": "PeopleAudience",
    requiredMinAge: 18,
    audienceType: "بزرگسالانی که در حال حاضر سیگار مصرف می‌کنند",
  },
  description:
    "راهنمای آموزشی انتخاب بازه شروع نیکوتین سالت یا جویس بر اساس تعداد سیگار، زمان اولین سیگار و نوع دستگاه؛ این ابزار تشخیص یا نسخه پزشکی نیست.",
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "IRR",
  },
};

const sources = [
  {
    title: "راهنمای استفاده از ویپ برای توقف سیگار — NHS",
    href: "https://www.nhs.uk/live-well/quit-smoking/using-e-cigarettes-to-stop-smoking/",
    note: "غلظت مناسب باید با میزان مصرف و کنترل میل به سیگار هماهنگ شود.",
  },
  {
    title: "راهنمای درمان وابستگی به دخانیات — NCSCT",
    href: "https://www.ncsct.co.uk/library/view/pdf/Standard-Treatment-Plan-for-Inpatient-Tobacco-Dependence.pdf",
    note: "تجربه مصرف برای تنظیم دوز مهم است و غلظت باید علائم محرومیت و میل به سیگار را کنترل کند.",
  },
  {
    title: "واقعیت سیگارهای لایت — CDC",
    href: "https://stacks.cdc.gov/view/cdc/153208/cdc_153208_DS1.pdf",
    note: "عنوان لایت یا کم‌قطران به معنی سیگار ایمن‌تر نیست.",
  },
];

async function getRecommendationData() {
  try {
    const rows = await listCatalogRowsForDiscovery();
    const rankedSets = buildNicotineRecommendationSets(rows);
    const recommendationSets = Object.fromEntries(
      Object.entries(rankedSets).map(([key, recommendations]) => [
        key,
        recommendations.map(({ row, strengthsMg, matchQuality }) => ({
          id: `${row.product.id}:${row.variant.id}`,
          slug: row.product.slug,
          nameFa: row.product.nameFa,
          ...(row.product.nameEn ? { nameEn: row.product.nameEn } : {}),
          description: row.product.shortDescriptionFa,
          brandNameFa: row.brandNameFa,
          image: getProductImage(row.product),
          fallbackImage:
            getCategoryImage(row.product.categoryId) ?? "/images/categories/e-liquid.webp",
          priceRial: row.variant.retailPriceRial,
          availability: getCatalogRowAvailability(row),
          strengthsMg,
          matchQuality,
        })),
      ]),
    ) as NicotineRecommendationSets;
    return { recommendationSets, catalogSummary: summarizeNicotineCatalog(rows) };
  } catch {
    return {
      recommendationSets: {} as NicotineRecommendationSets,
      catalogSummary: {
        salt: { available: 0, withStrength: 0 },
        freebase: { available: 0, withStrength: 0 },
      },
    };
  }
}

export default async function NicotineGuidePage() {
  const { recommendationSets, catalogSummary } = await getRecommendationData();

  return (
    <main
      id="main-content"
      className="retail-storefront min-h-screen bg-retail-bg pb-16 text-retail-primary sm:pb-24"
    >
      <script {...jsonLdScriptProps(applicationJsonLd)} />
      <script {...jsonLdScriptProps(faqPageJsonLd(faqItems))} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "خانه", path: "/" },
            { name: "راهنمای نیکوتین", path: "/nicotine-guide" },
          ]),
        )}
      />

      <section className="showcase-grid relative isolate overflow-hidden border-b border-retail-border">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,rgba(0,217,255,.13),transparent_38%),radial-gradient(circle_at_12%_75%,rgba(32,242,139,.08),transparent_30%)]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-16">
          <nav aria-label="مسیر صفحه" className="flex items-center gap-2 text-xs text-retail-muted">
            <Link href="/" className="transition hover:text-white">
              خانه
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-retail-secondary">
              راهنمای نیکوتین
            </span>
          </nav>

          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-retail-accent/25 bg-retail-accent/5 px-3 py-1 text-xs font-bold text-retail-accent">
                <Calculator size={14} aria-hidden="true" />
                ابزار رایگان خرده‌فروشی
              </span>
              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-[1.4] text-white sm:text-5xl sm:leading-[1.3] lg:text-6xl">
                محاسبه‌گر نیکوتین سالت و جویس
                <span className="mt-1 block bg-gradient-to-l from-retail-accent to-retail-accent-2 bg-clip-text text-transparent">
                  بر اساس مصرف سیگار
                </span>
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#d6e1ea] sm:text-lg sm:leading-9">
                تعداد نخ روزانه، زمان اولین سیگار و نوع دستگاه را وارد کنید تا یک بازه شروع
                محافظه‌کارانه برای سالت یا جویس فری‌بیس ببینید؛ بدون ادعای محاسبه دقیق جذب نیکوتین.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2 lg:w-[22rem] lg:grid-cols-1">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                <p className="text-xs text-retail-muted">مناسب برای</p>
                <p className="mt-1 text-sm font-black text-white">بزرگسالان سیگاری ۱۸+</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                <p className="text-xs text-retail-muted">حد پیشنهادی ابزار</p>
                <p dir="ltr" className="mt-1 text-left text-sm font-black text-retail-accent">
                  حداکثر 20 mg/ml
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] p-4 text-sm leading-7 text-amber-50">
            <ShieldAlert size={20} className="mt-1 shrink-0 text-amber-300" aria-hidden="true" />
            <p>
              <strong>این ابزار برای شروع مصرف نیکوتین نیست.</strong> اگر سیگار نمی‌کشید، باردار یا
              شیرده هستید، یا بیماری قلبی و داروی خاص دارید، بدون نظر پزشک از محصولات نیکوتینی
              استفاده نکنید. بهترین انتخاب برای سلامت، قطع کامل سیگار و نیکوتین است.
            </p>
          </div>
        </div>
      </section>

      <div className="-mt-1 pt-8 sm:pt-12">
        <NicotineGuideCalculator
          recommendationSets={recommendationSets}
          catalogSummary={catalogSummary}
        />
      </div>

      <section className="mx-auto mt-16 grid max-w-7xl gap-6 px-4 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div className="lg:sticky lg:top-[calc(var(--retail-header-height)+1.5rem)]">
          <span className="text-sm font-black text-retail-accent">جواب کوتاه</span>
          <h2 className="mt-2 text-2xl font-black leading-10 text-white sm:text-3xl">
            سالت یا جویس را اول با دستگاه تطبیق دهید
          </h2>
          <p className="mt-4 text-sm leading-8 text-retail-secondary">
            برای پاد کم‌وات و کام MTL معمولاً سالت با غلظت بالاتر کاربرد دارد؛ برای دستگاه پرقدرت
            DTL، جویس فری‌بیس با غلظت پایین‌تر. تعداد سیگار فقط نقطه شروع است و توان دستگاه، مقاومت
            کویل و الگوی کام‌گرفتن روی دریافت واقعی نیکوتین اثر می‌گذارند.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl border border-retail-border px-5 text-sm font-black text-white transition hover:border-retail-accent/50 hover:text-retail-accent"
          >
            بررسی کاتالوگ خرده‌فروشی
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-3">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group rounded-xl border border-retail-border bg-retail-surface p-5 open:border-retail-accent/25 open:bg-[#101821]"
            >
              <summary className="cursor-pointer list-none pr-8 text-sm font-black leading-7 text-white marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="relative block before:absolute before:-right-7 before:top-3 before:h-0.5 before:w-3 before:bg-retail-accent after:absolute after:-right-[1.375rem] after:top-[.45rem] after:h-3 after:w-0.5 after:bg-retail-accent after:transition group-open:after:rotate-90 group-open:after:opacity-0">
                  {item.question}
                </span>
              </summary>
              <p className="mt-3 border-t border-white/10 pt-4 text-sm leading-8 text-retail-secondary">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4" aria-labelledby="safe-use-title">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-retail-border bg-retail-surface p-5 sm:p-6">
            <CircleAlert className="text-amber-300" size={24} aria-hidden="true" />
            <h2 id="safe-use-title" className="mt-4 text-lg font-black text-white">
              اگر نیکوتین زیاد بود
            </h2>
            <p className="mt-2 text-sm leading-7 text-retail-secondary">
              تهوع، سرگیجه، سردرد یا تپش قلب را جدی بگیرید؛ مصرف را متوقف کنید. برای علائم شدید یا
              ماندگار کمک پزشکی بگیرید.
            </p>
          </article>
          <article className="rounded-2xl border border-retail-border bg-retail-surface p-5 sm:p-6">
            <HeartHandshake className="text-retail-accent-2" size={24} aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black text-white">اگر نیکوتین کم بود</h2>
            <p className="mt-2 text-sm leading-7 text-retail-secondary">
              میل شدید و ادامه مصرف هم‌زمان سیگار نشانه خوبی نیست. به‌جای تغییر خودسرانه زیاد،
              دستگاه و شیوه استفاده را با فرد متخصص بررسی کنید.
            </p>
          </article>
          <article className="rounded-2xl border border-retail-border bg-retail-surface p-5 sm:p-6">
            <Sparkles className="text-retail-accent" size={24} aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black text-white">هدف بعدی</h2>
            <p className="mt-2 text-sm leading-7 text-retail-secondary">
              پس از تثبیت و قطع کامل سیگار، غلظت نیکوتین را آهسته و با توجه به میل به سیگار کاهش
              دهید؛ عجله می‌تواند احتمال بازگشت را بیشتر کند.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4" aria-labelledby="method-title">
        <div className="rounded-[1.75rem] border border-retail-border bg-[#090d13] p-6 sm:p-9">
          <div className="flex items-start gap-3">
            <BookOpenCheck
              size={25}
              className="mt-1 shrink-0 text-retail-accent"
              aria-hidden="true"
            />
            <div>
              <h2 id="method-title" className="text-xl font-black text-white sm:text-2xl">
                روش محاسبه و منابع
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-8 text-retail-secondary">
                این ابزار جذب خونی نیکوتین را محاسبه نمی‌کند. تعداد نخ، زمان اولین سیگار به‌عنوان
                نشانه ساده وابستگی، و نوع دستگاه را به یک بازه شروع تبدیل می‌کند. نتیجه باید با
                کنترل میل به سیگار و نشانه‌های دریافت زیاد تنظیم شود.
              </p>
            </div>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {sources.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-retail-border bg-white/[0.025] p-4 transition hover:border-retail-accent/40 hover:bg-white/[0.045]"
              >
                <span className="text-sm font-black leading-7 text-white transition group-hover:text-retail-accent">
                  {source.title}
                </span>
                <span className="mt-2 block text-xs leading-6 text-retail-muted">
                  {source.note}
                </span>
              </a>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-retail-muted">
            آخرین بازبینی محتوایی: مهر ۱۴۰۵ · این صفحه محتوای آموزشی است و جایگزین ارزیابی پزشک یا
            خدمات تخصصی ترک دخانیات نیست.
          </p>
        </div>
      </section>
    </main>
  );
}
