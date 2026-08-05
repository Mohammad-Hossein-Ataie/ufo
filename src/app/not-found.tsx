import Link from "next/link";
import { Button } from "@ufo/ui";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70svh] max-w-xl place-items-center px-4 py-10 text-center">
      <div>
        <h1 className="text-4xl font-black">صفحه پیدا نشد</h1>
        <p className="mt-3 leading-7 text-[#9BA7B4]">ممکن است محصول حذف شده یا مسیر تغییر کرده باشد.</p>
        <Link href="/products" className="mt-6 inline-flex">
          <Button>بازگشت به کاتالوگ</Button>
        </Link>
      </div>
    </main>
  );
}
