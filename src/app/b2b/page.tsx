import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@ufo/ui";

export default function B2BHomePage() {
  return (
    <main>
      <section className="border-b border-[#D5D9C9] bg-[#14201B] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_25rem]">
          <div>
            <h1 className="text-4xl font-black leading-[1.35]">سفارش همکاری UFO Puff</h1>
            <p className="mt-4 max-w-3xl leading-8 text-white/75">
              قیمت کارتن، حداقل سفارش، پیش‌فاکتور و رزرو موجودی در این محیط خصوصی مدیریت می‌شود.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/b2b/quick-order">
                <Button className="border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]">
                  سفارش سریع
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <Link href="/b2b/catalog">
                <Button variant="ghost">مشاهده کاتالوگ</Button>
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 rounded-md border border-white/20 bg-white/10 p-5">
            {["اعتبارسنجی حداقل کارتن", "رزرو موجودی مشترک", "پیش‌فاکتور قابل ارسال", "قیمت‌ها noindex"].map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="text-[#E8C547]" size={20} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
