import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck, Warehouse } from "lucide-react";
import { Badge, Button, Price, ProductCard, StockStatus } from "@ufo/ui";
import {
  categories,
  getAvailableStock,
  getInventoryByVariant,
  getPrimaryVariant,
  products,
} from "@ufo/domain";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { faqPageJsonLd, jsonLdScriptProps, organizationJsonLd, websiteJsonLd } from "@ufo/seo";

const homeFaq = [
  {
    question: "UFO Puff چه محصولاتی عرضه می‌کند؟",
    answer:
      "کاتالوگ UFO Puff شامل پاد، ویپ، سالت نیکوتین، جویس، کارتریج، کویل و لوازم جانبی مرتبط است.",
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

export default function HomePage() {
  const featured = products.filter((product) => product.isActive).slice(0, 4);

  return (
    <main id="main-content">
      <script {...jsonLdScriptProps(organizationJsonLd())} />
      <script {...jsonLdScriptProps(websiteJsonLd())} />
      <script {...jsonLdScriptProps(faqPageJsonLd(homeFaq))} />
      <section className="relative min-h-[78svh] overflow-hidden">
        <Image
          src="/images/ufo-hero.png"
          alt="نمای فروشگاهی محصولات پاد و ویپ UFO Puff"
          fill
          priority
          unoptimized
          className="object-cover"
          style={{ objectPosition: "center 72%" }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[78svh] max-w-7xl items-center px-4 py-14">
          <div className="max-w-2xl">
            <Badge tone="info">فروش تکی</Badge>
            <h1 className="mt-5 text-4xl font-black leading-[1.35] md:text-6xl">UFO Puff</h1>
            <p className="mt-4 text-lg leading-8 text-[#D9E2EC]">
              کاتالوگ فارسی پاد، ویپ، جویس و لوازم جانبی با موجودی شفاف، سفارش سریع و کنترل سازگاری.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg">
                  مشاهده محصولات
                  <ArrowLeft size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1117]">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 md:grid-cols-3">
          {[
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
              text: "رزرو سفارش برای جلوگیری از oversell طراحی شده است.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-md border border-[#22303D] p-4">
              <item.icon className="mt-1 text-[#20F28B]" size={22} />
              <div>
                <h2 className="font-bold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#9BA7B4]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">محصولات منتخب</h2>
            <p className="mt-2 text-[#9BA7B4]">
              قیمت‌ها در دیتابیس ریالی ذخیره و در UI به تومان نمایش داده می‌شوند.
            </p>
          </div>
          <Link href="/products" className="text-sm font-bold text-[#00D9FF]">
            مشاهده همه
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => {
            const variant = getPrimaryVariant(product.id);
            const inventory = getInventoryByVariant(variant.id);
            const available = inventory ? getAvailableStock(inventory) : 0;
            return (
              <ProductCard
                key={product.id}
                title={product.nameFa}
                description={product.shortDescriptionFa}
                media={
                  <Image
                    key={`media-${product.id}`}
                    src={product.image}
                    alt={product.nameFa}
                    width={520}
                    height={390}
                    className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  />
                }
                badge={<StockStatus key={`stock-${product.id}`} available={available} />}
                price={<Price key={`price-${product.id}`} valueRial={variant.retailPriceRial} />}
                actions={<AddToCartButton key={`cart-${variant.id}`} variantId={variant.id} />}
              />
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-black">دسته‌بندی‌ها</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products/category/${category.slug}`}
              className="rounded-md border border-[#22303D] bg-[#0D1117] p-4 transition hover:border-[#00D9FF]"
            >
              <h3 className="font-bold">{category.nameFa}</h3>
              <p className="mt-2 text-sm leading-6 text-[#9BA7B4]">{category.descriptionFa}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-black">پرسش‌های رایج خرید</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {homeFaq.map((item) => (
            <article
              key={item.question}
              className="rounded-md border border-[#22303D] bg-[#0D1117] p-5"
            >
              <h3 className="font-bold leading-7">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-[#9BA7B4]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
