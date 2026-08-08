import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Boxes, PackagePlus, ShieldCheck, Truck } from "lucide-react";
import { Button, Price, ProductCard } from "@ufo/ui";
import { getAvailableStock, getInventoryByVariant, products, variants } from "@ufo/domain";
import { canonical } from "@ufo/seo";

export const metadata: Metadata = {
  title: "کاتالوگ عمده یوفوپاف",
  description: "کاتالوگ داخلی قیمت همکاری یوفوپاف UFO Puff برای سفارش عمده همکاران فروشگاهی.",
  alternates: { canonical: canonical("/b2b/catalog") },
  robots: { index: false, follow: false },
};

export default function B2BCatalogPage() {
  const wholesaleProducts = products.filter(
    (product) => product.salesChannels?.includes("wholesale") ?? true,
  );
  const wholesaleVariants = variants.filter((item) => item.wholesaleEnabled !== false);

  return (
    <main id="main-content" className="bg-[#F7F7F2] text-[#14201B]">
      <section className="relative overflow-hidden border-b border-[#D5D9C9] bg-[#F7F7F2]">
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(20,32,27,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,32,27,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_24rem] lg:py-14">
          <div className="reveal-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C8D6C7] bg-white px-3 py-1 text-xs font-bold text-[#405148] shadow-sm">
              <Boxes size={14} className="text-[#1F8A5B]" aria-hidden="true" />
              کاتالوگ همکاری یوفوپاف
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.3] sm:text-4xl">
              لیست عمده با قیمت کارتن، حداقل سفارش و موجودی قابل بررسی
            </h1>
            <p className="mt-3 max-w-3xl leading-8 text-[#596B61]">
              این صفحه برای تصمیم سریع همکاران طراحی شده است: تصویر محصول، قیمت همکاری، حداقل کارتن
              و مسیر مستقیم سفارش سریع در فضای روشن و عملیاتی B2B.
            </p>
          </div>
          <aside className="reveal-up-delay-1 rounded-md border border-[#D5D9C9] bg-white p-5 shadow-[0_16px_40px_rgba(20,32,27,0.10)]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { value: wholesaleProducts.length, label: "محصول عمده" },
                { value: wholesaleVariants.length, label: "واریانت فعال" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-[#D5D9C9] bg-[#F7F7F2] p-4"
                >
                  <div className="text-2xl font-black tabular-nums">
                    {new Intl.NumberFormat("fa-IR").format(item.value)}
                  </div>
                  <div className="mt-1 text-sm text-[#596B61]">{item.label}</div>
                </div>
              ))}
            </div>
            <Link href="/b2b/quick-order" className="mt-4 block">
              <Button className="w-full border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
                سفارش سریع
                <ArrowLeft size={18} aria-hidden="true" />
              </Button>
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#D5D9C9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "قیمت همکاری",
              text: "قیمت‌های عمده خارج از دسترس موتور جستجو هستند.",
            },
            {
              icon: PackagePlus,
              title: "حداقل کارتن",
              text: "حداقل سفارش هر واریانت در کارت محصول دیده می‌شود.",
            },
            {
              icon: Truck,
              title: "هماهنگی ارسال",
              text: "پیش‌فاکتور بعد از ثبت برای هماهنگی بررسی می‌شود.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-md border border-[#D5D9C9] bg-[#F7F7F2] p-4"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9FBF1] text-[#1F8A5B]">
                <item.icon size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#596B61]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">محصولات قابل سفارش عمده</h2>
            <p className="mt-2 text-sm text-[#596B61]">
              کارت‌ها برای اسکن سریع قیمت، حداقل کارتن و وضعیت موجودی مرتب شده‌اند.
            </p>
          </div>
          <Link
            href="/b2b"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-[#1F8A5B] transition hover:text-[#176D48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"
          >
            صفحه همکاری
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {wholesaleProducts.map((product) => {
            const variant = variants.find(
              (item) => item.productId === product.id && item.wholesaleEnabled !== false,
            );
            if (!variant) return null;
            const inventory = getInventoryByVariant(variant.id);
            const available = inventory ? getAvailableStock(inventory) : 0;
            return (
              <div
                key={product.id}
                className="rounded-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <ProductCard
                  title={product.nameFa}
                  description={`حداقل ${new Intl.NumberFormat("fa-IR").format(variant.minWholesaleCartonCount)} کارتن، هر کارتن ${new Intl.NumberFormat("fa-IR").format(variant.cartonSize)} عدد`}
                  media={
                    <Image
                      key={`media-${product.id}`}
                      src={product.image}
                      alt={product.nameFa}
                      width={520}
                      height={390}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  }
                  badge={
                    <span className="inline-flex min-h-7 items-center rounded-md border border-[#A8E6C0] bg-[#E9FBF1] px-2 text-xs font-bold text-[#176D48]">
                      {available > 0 ? "موجود" : "نیازمند هماهنگی"}
                    </span>
                  }
                  price={
                    <Price key={`price-${product.id}`} valueRial={variant.wholesalePriceRial} />
                  }
                  actions={
                    <div key={`quick-${product.id}`} className="grid w-full gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#596B61]">
                        <BadgeCheck size={15} className="text-[#1F8A5B]" aria-hidden="true" />
                        SKU: <span dir="ltr">{variant.sku}</span>
                      </div>
                      <Link href="/b2b/quick-order">
                        <Button
                          size="sm"
                          className="w-full border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
                        >
                          افزودن کارتن
                          <ArrowLeft size={16} aria-hidden="true" />
                        </Button>
                      </Link>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
