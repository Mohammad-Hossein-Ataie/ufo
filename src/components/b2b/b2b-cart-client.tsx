"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Price } from "@ufo/ui";
import { products, variants } from "@ufo/domain";

interface CartLine {
  variantId: string;
  quantity: number;
  cartonCount: number;
  channel: "wholesale";
}

function readCart(): CartLine[] {
  const raw =
    window.localStorage.getItem("ufo-b2b-cart") ?? window.localStorage.getItem("ufo-cart");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is CartLine => {
      if (typeof line !== "object" || line === null) return false;
      const record = line as Record<string, unknown>;
      return (
        typeof record.variantId === "string" &&
        typeof record.quantity === "number" &&
        typeof record.cartonCount === "number" &&
        record.channel === "wholesale"
      );
    });
  } catch {
    return [];
  }
}

export function B2BCartClient() {
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    window.addEventListener("ufo-b2b-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ufo-b2b-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const variant = variants.find((item) => item.id === line.variantId);
          const product = variant
            ? products.find((item) => item.id === variant.productId)
            : undefined;
          if (!variant || !product) return null;
          return {
            ...line,
            variant,
            product,
            totalRial: variant.wholesalePriceRial * line.quantity,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [cart],
  );

  const totalRial = lines.reduce((sum, line) => sum + line.totalRial, 0);

  function clearCart() {
    window.localStorage.removeItem("ufo-b2b-cart");
    window.dispatchEvent(new CustomEvent("ufo-b2b-cart-updated"));
    setCart([]);
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="سبد عمده خالی است">
        از سفارش سریع، حداقل کارتن‌های موردنظر را انتخاب کنید.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-3">
        {lines.map((line) => (
          <article
            key={line.variantId}
            className="grid gap-3 rounded-md border border-[#D5D9C9] bg-white p-4 sm:grid-cols-[1fr_auto]"
          >
            <div>
              <h2 className="font-bold">{line.product.nameFa}</h2>
              <p className="mt-1 text-sm text-[#596B61]">
                {line.variant.nameFa} · {line.variant.sku}
              </p>
              <p className="mt-2 text-sm text-[#596B61]">
                {line.cartonCount.toLocaleString("fa-IR")} کارتن ·{" "}
                {line.quantity.toLocaleString("fa-IR")} عدد
              </p>
            </div>
            <div className="font-bold">
              <Price valueRial={line.totalRial} />
            </div>
          </article>
        ))}
      </div>
      <aside className="h-fit rounded-md border border-[#D5D9C9] bg-[#14201B] p-5 text-white">
        <h2 className="text-lg font-bold">خلاصه عمده</h2>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-white/65">جمع کالاها</span>
          <Price valueRial={totalRial} />
        </div>
        <div className="mt-5 grid gap-2">
          <Link href="/b2b/checkout">
            <Button className="w-full border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]">
              ادامه ثبت سفارش
            </Button>
          </Link>
          <Button type="button" variant="ghost" className="w-full" onClick={clearCart}>
            خالی کردن سبد عمده
          </Button>
        </div>
      </aside>
    </div>
  );
}
