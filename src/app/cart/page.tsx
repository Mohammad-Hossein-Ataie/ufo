import type { Metadata } from "next";
import { CartClient } from "@/components/cart-client";

export const metadata: Metadata = {
  title: "سبد خرید",
  robots: { index: false, follow: false }
};

export default function CartPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black">سبد خرید</h1>
      <CartClient />
    </main>
  );
}
