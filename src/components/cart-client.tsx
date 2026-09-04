"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, IconButton, Price } from "@ufo/ui";
import {
  getProductColorById,
  getProductFlavorById,
  getProductVariantOptions,
  products,
  variants,
} from "@ufo/domain";
import type { ProductVariantType } from "@ufo/types";
import type { CustomerCartView, EnrichedCartItem } from "@ufo/orders";
import {
  authHeaders,
  fetchCustomerCart,
  readCustomerSession,
  readGuestCart,
  saveGuestCart,
  type GuestCartLine,
} from "@/lib/customer-client";

interface SelectedVariant {
  type: Exclude<ProductVariantType, "none">;
  valueId: string;
}

interface RetailLine {
  id?: string;
  variantId: string;
  quantity: number;
  selectedVariant?: SelectedVariant;
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  unitPriceSnapshot: number;
  discountAmount: number;
  totalPrice: number;
}

function getSelectedVariantLabel(type: SelectedVariant["type"]) {
  if (type === "flavor") return "طعم";
  if (type === "color") return "رنگ";
  if (type === "resistance") return "اهم";
  return "ظرفیت";
}

function guestToLine(line: GuestCartLine): RetailLine | null {
  const variant = variants.find((item) => item.id === line.variantId);
  const product = variant ? products.find((item) => item.id === variant.productId) : undefined;
  if (!variant || !product || line.channel !== "retail") return null;
  const selectedVariant =
    line.selectedVariant ??
    (line.colorId ? { type: "color" as const, valueId: line.colorId } : undefined);
  return {
    variantId: line.variantId,
    quantity: line.quantity,
    ...(selectedVariant ? { selectedVariant } : {}),
    productName: product.nameFa,
    variantName: variant.nameFa,
    sku: variant.sku,
    image: product.image,
    unitPriceSnapshot: variant.retailPriceRial,
    discountAmount: 0,
    totalPrice: variant.retailPriceRial * line.quantity,
  };
}

function serverToLine(item: EnrichedCartItem): RetailLine {
  return {
    id: item.id,
    variantId: item.variantId ?? "",
    quantity: item.quantity,
    ...(item.selectedVariant ? { selectedVariant: item.selectedVariant } : {}),
    productName: item.productName,
    variantName: item.variantName,
    sku: item.sku,
    image: item.image,
    unitPriceSnapshot: item.unitPriceSnapshot,
    discountAmount: item.discountAmount,
    totalPrice: item.totalPrice,
  };
}

export function CartClient() {
  const [cartView, setCartView] = useState<CustomerCartView | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartLine[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function sync() {
    const session = readCustomerSession("retail");
    setIsLoggedIn(Boolean(session));
    if (session) {
      setCartView(await fetchCustomerCart("retail"));
      return;
    }
    setGuestCart(readGuestCart("retail"));
  }

  useEffect(() => {
    void sync();
    window.addEventListener("ufo-cart-updated", sync);
    window.addEventListener("ufo-retail-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ufo-cart-updated", sync);
      window.removeEventListener("ufo-retail-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const lines = useMemo(
    () =>
      isLoggedIn
        ? (cartView?.items.map(serverToLine) ?? [])
        : guestCart.map(guestToLine).filter((line): line is RetailLine => line !== null),
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

  async function updateQuantity(line: RetailLine, quantity: number) {
    const safeQuantity = Math.max(0, Math.floor(quantity));
    if (isLoggedIn && line.id) {
      const requestInit: RequestInit =
        safeQuantity === 0
          ? { method: "DELETE", headers: authHeaders("retail") }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json", ...authHeaders("retail") },
              body: JSON.stringify({ quantity: safeQuantity }),
            };
      const response = await fetch(`/api/cart/items/${line.id}`, requestInit);
      if (response.ok) setCartView((await response.json()) as CustomerCartView);
      return;
    }
    const next = guestCart
      .map((item) =>
        item.variantId === line.variantId ? { ...item, quantity: safeQuantity } : item,
      )
      .filter((item) => item.quantity > 0);
    saveGuestCart("retail", next);
    setGuestCart(next);
  }

  async function clearCart() {
    if (isLoggedIn && cartView) {
      await Promise.all(
        cartView.items.map((item) =>
          fetch(`/api/cart/items/${item.id}`, {
            method: "DELETE",
            headers: authHeaders("retail"),
          }),
        ),
      );
      setCartView(await fetchCustomerCart("retail"));
      return;
    }
    saveGuestCart("retail", []);
    setGuestCart([]);
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="سبد خرید خالی است">
        محصول موردنظر را از کاتالوگ انتخاب کنید. موجودی و قیمت قبل از پرداخت دوباره در backend کنترل
        می‌شود.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-3">
        {lines.map((line) => {
          const product = products.find(
            (item) =>
              item.id === variants.find((variant) => variant.id === line.variantId)?.productId,
          );
          const selectedOption =
            line.selectedVariant?.type === "flavor"
              ? getProductFlavorById(line.selectedVariant.valueId)
              : line.selectedVariant?.type === "color"
                ? getProductColorById(line.selectedVariant.valueId)
                : line.selectedVariant && product
                  ? getProductVariantOptions(product).find(
                      (item) => item.id === line.selectedVariant?.valueId,
                    )
                  : undefined;
          return (
            <article
              key={`${line.id ?? line.variantId}-${line.selectedVariant?.type ?? "none"}-${line.selectedVariant?.valueId ?? "default"}`}
              className="grid gap-4 rounded-md border border-[#22303D] bg-[#0D1117] p-4 sm:grid-cols-[7rem_1fr_auto]"
            >
              <div className="relative aspect-square overflow-hidden rounded-md border border-[#22303D] bg-[#141A22]">
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
                <p className="mt-1 text-sm text-[#9BA7B4]">
                  {line.variantName} · {line.sku}
                </p>
                <div className="mt-3 inline-flex h-10 items-center overflow-hidden rounded-md border border-[#22303D]">
                  <IconButton
                    label="کاهش تعداد"
                    className="h-10 w-10 border-0"
                    onClick={() => updateQuantity(line, line.quantity - 1)}
                  >
                    <Minus size={16} />
                  </IconButton>
                  <output className="min-w-12 px-3 text-center text-sm font-bold">
                    {line.quantity.toLocaleString("fa-IR")}
                  </output>
                  <IconButton
                    label="افزایش تعداد"
                    className="h-10 w-10 border-0"
                    onClick={() => updateQuantity(line, line.quantity + 1)}
                  >
                    <Plus size={16} />
                  </IconButton>
                </div>
                {selectedOption && line.selectedVariant ? (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-[#22303D] px-2 py-1 text-xs text-[#D9E2EC]">
                    {"hex" in selectedOption ? (
                      <span
                        className="h-4 w-4 rounded-full border border-white/30"
                        style={
                          selectedOption.hex.startsWith("linear-gradient")
                            ? { backgroundImage: selectedOption.hex }
                            : { backgroundColor: selectedOption.hex }
                        }
                        aria-hidden="true"
                      />
                    ) : null}
                    {getSelectedVariantLabel(line.selectedVariant.type)}:{" "}
                    {"labelFa" in selectedOption ? selectedOption.labelFa : selectedOption.nameFa}
                  </p>
                ) : null}
              </div>
              <div className="grid content-between gap-3 justify-items-end font-bold">
                <Price valueRial={line.totalPrice} />
                <IconButton label="حذف از سبد" onClick={() => updateQuantity(line, 0)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </article>
          );
        })}
      </div>
      <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5">
        <h2 className="text-lg font-bold">خلاصه سفارش</h2>
        <div className="mt-4 grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[#9BA7B4]">جمع کالاها</span>
            <Price valueRial={subtotalRial} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9BA7B4]">تخفیف</span>
            <Price valueRial={discountRial} />
          </div>
          <div className="border-t border-[#22303D] pt-3 flex items-center justify-between font-black">
            <span>قابل پرداخت</span>
            <Price valueRial={totalRial} />
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          <Link href={isLoggedIn ? "/checkout" : "/login?next=/checkout"}>
            <Button className="w-full">ادامه خرید</Button>
          </Link>
          <Button type="button" variant="ghost" className="w-full" onClick={clearCart}>
            خالی کردن سبد
          </Button>
        </div>
      </aside>
    </div>
  );
}
