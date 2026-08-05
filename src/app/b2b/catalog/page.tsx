import Image from "next/image";
import Link from "next/link";
import { Button, Price, ProductCard } from "@ufo/ui";
import { products, variants } from "@ufo/domain";

export default function B2BCatalogPage() {
  const wholesaleProducts = products.filter((product) => product.salesChannels?.includes("wholesale") ?? true);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">کاتالوگ عمده</h1>
          <p className="mt-2 text-[#596B61]">قیمت‌ها مخصوص همکاران و خارج از دسترس موتور جستجو هستند.</p>
        </div>
        <Link href="/b2b/quick-order">
          <Button className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">سفارش سریع</Button>
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {wholesaleProducts.map((product) => {
          const variant = variants.find((item) => item.productId === product.id && item.wholesaleEnabled !== false);
          if (!variant) return null;
          return (
            <ProductCard
              key={product.id}
              title={product.nameFa}
              description={`حداقل ${new Intl.NumberFormat("fa-IR").format(variant.minWholesaleCartonCount)} کارتن، هر کارتن ${new Intl.NumberFormat("fa-IR").format(variant.cartonSize)} عدد`}
              media={<Image key={`media-${product.id}`} src={product.image} alt={product.nameFa} width={520} height={390} className="h-full w-full object-cover" />}
              price={<Price key={`price-${product.id}`} valueRial={variant.wholesalePriceRial} />}
              actions={
                <Link key={`quick-${product.id}`} href="/b2b/quick-order">
                  <Button size="sm" className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
                    افزودن کارتن
                  </Button>
                </Link>
              }
            />
          );
        })}
      </div>
    </main>
  );
}
