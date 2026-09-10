"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button, IconButton, Price } from "@ufo/ui";
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
import { CustomerOtpLogin } from "@/components/customer-otp-login";
import { ProtectedProductImage } from "@/components/protected-product-image";
import { CommerceSkeleton } from "@/components/commerce-skeleton";

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
    image: `/api/product-images/variant/${encodeURIComponent(line.variantId)}/card`,
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
    image: `/api/product-images/variant/${encodeURIComponent(item.variantId ?? "")}/card`,
    unitPriceSnapshot: item.unitPriceSnapshot,
    discountAmount: item.discountAmount,
    totalPrice: item.totalPrice,
  };
}

export function CartClient() {
  const [cartView, setCartView] = useState<CustomerCartView | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartLine[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!loginOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setLoginOpen(false);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", close);
    };
  }, [loginOpen]);

  async function sync() {
    try {
      setLoadError("");
      const session = readCustomerSession("retail");
      setIsLoggedIn(Boolean(session));
      if (session) {
        const cart = await fetchCustomerCart("retail");
        if (!cart) throw new Error("دریافت سبد خرید انجام نشد.");
        setCartView(cart);
        return;
      }
      setGuestCart(readGuestCart("retail"));
    } catch {
      setLoadError("دریافت سبد خرید انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) return <CommerceSkeleton kind="cart" />;
  if (loadError)
    return (
      <div role="alert" className="rounded-2xl border border-retail-border p-6 text-center">
        <p>{loadError}</p>
        <Button
          className="mt-4"
          onClick={() => {
            setIsLoading(true);
            void sync();
          }}
        >
          تلاش دوباره
        </Button>
      </div>
    );

  if (lines.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-retail-border bg-white/[0.025] px-5 py-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-retail-accent/10 text-retail-accent">
          <ShoppingBag size={29} />
        </span>
        <h2 className="mt-5 text-xl font-black text-white">سبد خرید شما خالی است</h2>
        <p className="mt-2 text-sm leading-7 text-retail-secondary">
          محصول موردنظرتان را پیدا کنید و با یک لمس به سبد اضافه کنید.
        </p>
        <Link href="/products">
          <Button className="mt-6 min-h-12 w-full max-w-xs rounded-xl">مشاهده محصولات</Button>
        </Link>
      </div>
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
                <ProtectedProductImage
                  src={line.image}
                  alt={line.productName}
                  fill
                  loading="lazy"
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
          {isLoggedIn ? (
            <Link href="/checkout">
              <Button className="w-full">ادامه خرید</Button>
            </Link>
          ) : (
            <Button type="button" className="w-full" onClick={() => setLoginOpen(true)}>
              <LockKeyhole size={17} />
              ورود و ادامه پرداخت
            </Button>
          )}
          <Button type="button" variant="ghost" className="w-full" onClick={clearCart}>
            خالی کردن سبد
          </Button>
        </div>
      </aside>
      <div
        className={`fixed inset-0 z-[70] ${loginOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!loginOpen}
      >
        <button
          type="button"
          aria-label="بستن ورود"
          onClick={() => setLoginOpen(false)}
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ease-mobile ${loginOpen ? "opacity-100" : "opacity-0"}`}
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-label="ورود برای ادامه پرداخت"
          className={`absolute inset-x-0 bottom-0 mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-[28px] border border-retail-border bg-[#090e14] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,.7)] transition-transform duration-300 ease-mobile sm:bottom-1/2 sm:rounded-[28px] sm:p-6 sm:translate-y-1/2 ${loginOpen ? "translate-y-0 sm:translate-y-1/2" : "translate-y-full sm:translate-y-[calc(50%+100vh)]"}`}
        >
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <h2 className="font-black text-white">ورود امن برای پرداخت</h2>
              <p className="mt-1 text-xs text-retail-secondary">سبد شما بعد از ورود حفظ می‌شود</p>
            </div>
            <button
              type="button"
              aria-label="بستن"
              onClick={() => setLoginOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-retail-secondary hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <CustomerOtpLogin channel="retail" nextPath="/checkout" />
          <button
            type="button"
            onClick={() => setLoginOpen(false)}
            className="mt-3 min-h-11 w-full text-sm font-bold text-retail-secondary hover:text-white"
          >
            فعلاً به خرید ادامه می‌دهم
          </button>
        </section>
      </div>
    </div>
  );
}
