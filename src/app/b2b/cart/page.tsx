import { B2BCartClient } from "@/components/b2b/b2b-cart-client";

export default function B2BCartPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">سبد عمده</h1>
      <p className="mt-2 text-[#596B61]">این سبد فقط اقلام عمده و قیمت همکاری را نمایش می‌دهد.</p>
      <div className="mt-6">
        <B2BCartClient />
      </div>
    </main>
  );
}
