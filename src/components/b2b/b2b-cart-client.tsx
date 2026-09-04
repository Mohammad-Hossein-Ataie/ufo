"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { calculateCartonQuantity, products, variants } from "@ufo/domain";
import { Button, EmptyState, IconButton, Price } from "@ufo/ui";
import type { CustomerCartView, EnrichedCartItem } from "@ufo/orders";
import {
  authHeaders,
  fetchCustomerCart,
  readCustomerSession,
  readGuestCart,
  saveGuestCart,
  type GuestCartLine,
} from "@/lib/customer-client";

interface WholesaleLine {
  id?: string;
  variantId: string;
  cartonCount: number;
  quantity: number;
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  unitPriceSnapshot: number;
  discountAmount: number;
  totalPrice: number;
}

function guestToLine(line: GuestCartLine): WholesaleLine | null {
  const variant = variants.find((item) => item.id === line.variantId);
  const product = variant ? products.find((item) => item.id === variant.productId) : undefined;
  if (!variant || !product || line.channel !== "wholesale") return null;
  const cartonCount = line.cartonCount ?? Math.ceil(line.quantity / variant.cartonSize);
  const quantity = calculateCartonQuantity(variant, cartonCount);
  return {
    variantId: line.variantId,
    cartonCount,
    quantity,
    productName: product.nameFa,
    variantName: variant.nameFa,
    sku: variant.sku,
    image: product.image,
    unitPriceSnapshot: variant.wholesalePriceRial,
    discountAmount: 0,
    totalPrice: variant.wholesalePriceRial * quantity,
  };
}

function serverToLine(item: EnrichedCartItem): WholesaleLine {
  return {
    id: item.id,
    variantId: item.variantId ?? "",
    cartonCount: item.cartonCount ?? 1,
    quantity: item.quantity,
    productName: item.productName,
    variantName: item.variantName,
    sku: item.sku,
    image: item.image,
    unitPriceSnapshot: item.unitPriceSnapshot,
    discountAmount: item.discountAmount,
    totalPrice: item.totalPrice,
  };
}

export function B2BCartClient() {
  const [cartView, setCartView] = useState<CustomerCartView | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartLine[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function sync() {
    const session = readCustomerSession("wholesale");
    setIsLoggedIn(Boolean(session));
    if (session) {
      setCartView(await fetchCustomerCart("wholesale"));
      return;
    }
    setGuestCart(readGuestCart("wholesale"));
  }

  useEffect(() => {
    void sync();
    window.addEventListener("ufo-b2b-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ufo-b2b-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const lines = useMemo(
    () =>
      isLoggedIn
        ? (cartView?.items.map(serverToLine) ?? [])
        : guestCart.map(guestToLine).filter((line): line is WholesaleLine => line !== null),
    [cartView, guestCart, isLoggedIn],
  );

  const subtotalRial = isLoggedIn
    ? (cartView?.summary.subtotalRial ?? 0)
    : lines.reduce((sum, line) => sum + line.unitPriceSnapshot * line.quantity, 0);
  const discountRial = isLoggedIn
    ? (cartView?.summary.discountRial ?? 0)
    : lines.reduce((sum, line) => sum + line.discountAmount, 0);
  const totalRial = isLoggedIn
    ? (cartView?.summary.totalRial ?? 0)
    : lines.reduce((sum, line) => sum + line.totalPrice, 0);

  async function updateCarton(line: WholesaleLine, cartonCount: number) {
    const safeCartons = Math.max(0, Math.floor(cartonCount));
    const variant = variants.find((item) => item.id === line.variantId);
    if (!variant) return;
    if (isLoggedIn && line.id) {
      const requestInit: RequestInit =
        safeCartons === 0
          ? { method: "DELETE", headers: authHeaders("wholesale") }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json", ...authHeaders("wholesale") },
              body: JSON.stringify({
                cartonCount: safeCartons,
                quantity: calculateCartonQuantity(variant, safeCartons),
              }),
            };
      const response = await fetch(`/api/cart/items/${line.id}`, requestInit);
      if (response.ok) setCartView((await response.json()) as CustomerCartView);
      return;
    }
    const next = guestCart
      .map((item) =>
        item.variantId === line.variantId
          ? {
              ...item,
              cartonCount: safeCartons,
              quantity: safeCartons > 0 ? calculateCartonQuantity(variant, safeCartons) : 0,
            }
          : item,
      )
      .filter((item) => item.quantity > 0);
    saveGuestCart("wholesale", next);
    setGuestCart(next);
  }

  async function clearCart() {
    if (isLoggedIn && cartView) {
      await Promise.all(
        cartView.items.map((item) =>
          fetch(`/api/cart/items/${item.id}`, {
            method: "DELETE",
            headers: authHeaders("wholesale"),
          }),
        ),
      );
      setCartView(await fetchCustomerCart("wholesale"));
      return;
    }
    saveGuestCart("wholesale", []);
    setGuestCart([]);
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
            key={line.id ?? line.variantId}
            className="grid gap-4 rounded-md border border-[#D5D9C9] bg-white p-4 sm:grid-cols-[7rem_1fr_auto]"
          >
            <div className="relative aspect-square overflow-hidden rounded-md border border-[#D5D9C9] bg-[#EEF0E5]">
              <Image
                src={line.image}
                alt={line.productName}
                fill
                sizes="(min-width: 640px) 7rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold">{line.productName}</h2>
              <p className="mt-1 text-sm text-[#596B61]">
                {line.variantName} · {line.sku}
              </p>
              <p className="mt-2 text-sm text-[#596B61]">
                {line.cartonCount.toLocaleString("fa-IR")} کارتن ·{" "}
                {line.quantity.toLocaleString("fa-IR")} عدد
              </p>
              <div className="mt-3 inline-flex h-10 items-center overflow-hidden rounded-md border border-[#D5D9C9]">
                <IconButton
                  label="کاهش کارتن"
                  className="h-10 w-10 border-0 text-[#12201A]"
                  onClick={() => updateCarton(line, line.cartonCount - 1)}
                >
                  <Minus size={16} />
                </IconButton>
                <output className="min-w-12 px-3 text-center text-sm font-bold text-[#12201A]">
                  {line.cartonCount.toLocaleString("fa-IR")}
                </output>
                <IconButton
                  label="افزایش کارتن"
                  className="h-10 w-10 border-0 text-[#12201A]"
                  onClick={() => updateCarton(line, line.cartonCount + 1)}
                >
                  <Plus size={16} />
                </IconButton>
              </div>
            </div>
            <div className="grid content-between gap-3 justify-items-end font-bold">
              <Price valueRial={line.totalPrice} />
              <IconButton
                label="حذف از سبد"
                className="text-[#12201A]"
                onClick={() => updateCarton(line, 0)}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          </article>
        ))}
      </div>
      <aside className="h-fit rounded-md border border-[#D5D9C9] bg-[#14201B] p-5 text-white">
        <h2 className="text-lg font-bold">خلاصه عمده</h2>
        <div className="mt-4 grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-white/65">جمع کالاها</span>
            <Price valueRial={subtotalRial} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/65">تخفیف</span>
            <Price valueRial={discountRial} />
          </div>
          <div className="border-t border-white/15 pt-3 flex items-center justify-between font-black">
            <span>قابل پرداخت</span>
            <Price valueRial={totalRial} />
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          <Link href={isLoggedIn ? "/b2b/checkout" : "/b2b/login?next=/b2b/checkout"}>
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
