"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, EmptyState, Price } from "@ufo/ui";
import {
  calculateOrderTotals,
  getProductFlavorById,
  getProductColorById,
  products,
  variants,
} from "@ufo/domain";
import type { ProductVariantType, SalesChannel } from "@ufo/types";

interface SelectedVariant {
  type: Exclude<ProductVariantType, "none">;
  valueId: string;
}

interface CartLine {
  variantId: string;
  quantity: number;
  channel: SalesChannel;
  selectedVariant?: SelectedVariant;
  colorId?: string;
}

function isSelectedVariant(value: unknown): value is SelectedVariant {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.type === "flavor" ||
      record.type === "color" ||
      record.type === "resistance" ||
      record.type === "capacity") &&
    typeof record.valueId === "string"
  );
}

function getSelectedVariantLabel(type: SelectedVariant["type"]) {
  if (type === "flavor") return "طعم";
  if (type === "color") return "رنگ";
  if (type === "resistance") return "اهم";
  return "ظرفیت";
}

function readCart(): CartLine[] {
  const raw =
    window.localStorage.getItem("ufo-retail-cart") ?? window.localStorage.getItem("ufo-cart");
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
        record.channel === "retail" &&
        (!("selectedVariant" in record) || isSelectedVariant(record.selectedVariant)) &&
        (!("colorId" in record) || typeof record.colorId === "string")
      );
    });
  } catch {
    return [];
  }
}

export function CartClient() {
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
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
      cart
        .map((line) => {
          const variant = variants.find((item) => item.id === line.variantId);
          const product = variant
            ? products.find((item) => item.id === variant.productId)
            : undefined;
          if (!variant || !product) return null;
          const unitPriceRial =
            line.channel === "wholesale" ? variant.wholesalePriceRial : variant.retailPriceRial;
          const selectedVariant =
            line.selectedVariant ??
            (line.colorId ? ({ type: "color", valueId: line.colorId } as const) : undefined);
          const selectedOption =
            selectedVariant?.type === "flavor"
              ? getProductFlavorById(selectedVariant.valueId)
              : selectedVariant?.type === "color"
                ? getProductColorById(selectedVariant.valueId)
                : selectedVariant
                  ? { nameFa: selectedVariant.valueId }
                  : undefined;
          return {
            ...line,
            product,
            variant,
            selectedVariant,
            selectedOption,
            unitPriceRial,
            totalRial: unitPriceRial * line.quantity,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [cart],
  );

  const totals = calculateOrderTotals(
    lines.map((line) => ({
      productName: line.product.nameFa,
      variantName: line.variant.nameFa,
      sku: line.variant.sku,
      image: line.product.image,
      selectedAttributes: line.variant.attributes,
      pricingMode: line.channel,
      unitPriceRial: line.unitPriceRial,
      quantity: line.quantity,
      discountRial: 0,
      totalRial: line.totalRial,
    })),
  );

  function clearCart() {
    window.localStorage.removeItem("ufo-retail-cart");
    window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
    window.dispatchEvent(new CustomEvent("ufo-retail-cart-updated"));
    setCart([]);
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="سبد خرید خالی است">
        محصول موردنظر را از کاتالوگ انتخاب کنید. موجودی و قیمت قبل از پرداخت دوباره کنترل می‌شود.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-3">
        {lines.map((line) => (
          <article
            key={`${line.variantId}-${line.channel}-${line.selectedVariant?.type ?? "none"}-${line.selectedVariant?.valueId ?? line.colorId ?? "default"}`}
            className="grid gap-4 rounded-md border border-[#22303D] bg-[#0D1117] p-4 sm:grid-cols-[7rem_1fr_auto]"
          >
            <div className="relative aspect-square overflow-hidden rounded-md border border-[#22303D] bg-[#141A22]">
              <Image
                src={line.product.image}
                alt={line.product.nameFa}
                fill
                sizes="(min-width: 640px) 7rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold">{line.product.nameFa}</h2>
              <p className="mt-1 text-sm text-[#9BA7B4]">
                {line.variant.nameFa} · {line.variant.sku}
              </p>
              <p className="mt-2 text-sm text-[#D9E2EC]">
                تعداد: {new Intl.NumberFormat("fa-IR").format(line.quantity)}
              </p>
              {line.selectedOption ? (
                <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-[#22303D] px-2 py-1 text-xs text-[#D9E2EC]">
                  {line.selectedVariant?.type === "color" && "hex" in line.selectedOption ? (
                    <span
                      className="h-4 w-4 rounded-full border border-white/30"
                      style={
                        line.selectedOption.hex.startsWith("linear-gradient")
                          ? { backgroundImage: line.selectedOption.hex }
                          : { backgroundColor: line.selectedOption.hex }
                      }
                      aria-hidden="true"
                    />
                  ) : null}
                  {line.selectedVariant ? getSelectedVariantLabel(line.selectedVariant.type) : ""}:{" "}
                  {"labelFa" in line.selectedOption
                    ? line.selectedOption.labelFa
                    : line.selectedOption.nameFa}
                </p>
              ) : null}
            </div>
            <div className="font-bold">
              <Price valueRial={line.totalRial} />
            </div>
          </article>
        ))}
      </div>
      <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5">
        <h2 className="text-lg font-bold">خلاصه سفارش</h2>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[#9BA7B4]">جمع کالاها</span>
          <Price valueRial={totals.subtotalRial} />
        </div>
        <div className="mt-5 grid gap-2">
          <Link href="/checkout">
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
