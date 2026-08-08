"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button, Price } from "@ufo/ui";
import {
  calculateCartonQuantity,
  products,
  validateWholesaleCartonCount,
  variants,
} from "@ufo/domain";

type CartonState = Record<string, number>;

const formatter = new Intl.NumberFormat("fa-IR");

export function QuickOrderClient() {
  const [cartons, setCartons] = useState<CartonState>({});

  const lines = useMemo(
    () =>
      variants
        .filter((variant) => variant.wholesaleEnabled !== false)
        .map((variant) => {
          const product = products.find((item) => item.id === variant.productId);
          if (product?.salesChannels && !product.salesChannels.includes("wholesale"))
            return undefined;
          const cartonCount = cartons[variant.id] ?? 0;
          const quantity = cartonCount > 0 ? calculateCartonQuantity(variant, cartonCount) : 0;
          const isSelected = cartonCount > 0;
          const isBelowMinimum = isSelected && cartonCount < variant.minWholesaleCartonCount;
          return {
            variant,
            product,
            cartonCount,
            quantity,
            isSelected,
            isBelowMinimum,
            totalRial: quantity * variant.wholesalePriceRial,
          };
        })
        .filter((line): line is NonNullable<typeof line> => Boolean(line)),
    [cartons],
  );

  const selectedLines = lines.filter((line) => line.isSelected);
  const hasInvalidSelection = selectedLines.some((line) => line.isBelowMinimum);
  const totalRial = selectedLines.reduce((sum, line) => sum + line.totalRial, 0);

  function updateCarton(variantId: string, value: number) {
    const safeValue = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    setCartons((current) => {
      const next = { ...current };
      if (safeValue === 0) {
        delete next[variantId];
      } else {
        next[variantId] = safeValue;
      }
      return next;
    });
  }

  function saveWholesaleCart() {
    if (selectedLines.length === 0 || hasInvalidSelection) return;
    const payload = selectedLines.map((line) => {
      validateWholesaleCartonCount(line.variant, line.cartonCount);
      return {
        variantId: line.variant.id,
        quantity: line.quantity,
        cartonCount: line.cartonCount,
        channel: "wholesale",
      };
    });
    window.localStorage.setItem("ufo-b2b-cart", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("ufo-b2b-cart-updated"));
    window.location.href = "/b2b/cart";
  }

  return (
    <div className="grid gap-5">
      <div className="overflow-x-auto rounded-md border border-[#D5D9C9] bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-[#EEF0E5] text-[#405148]">
            <tr>
              <th className="px-4 py-3 text-right">محصول</th>
              <th className="px-4 py-3 text-right">SKU</th>
              <th className="px-4 py-3 text-right">تعداد در کارتن</th>
              <th className="px-4 py-3 text-right">کارتن</th>
              <th className="px-4 py-3 text-right">قیمت همکاری</th>
              <th className="px-4 py-3 text-right">جمع</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.variant.id} className="border-t border-[#E2E4D8]">
                <td className="px-4 py-3 font-bold text-[#12201A]">
                  {line.product?.nameFa ?? "محصول"}
                </td>
                <td className="px-4 py-3 text-[#12201A]" dir="ltr">
                  {line.variant.sku}
                </td>
                <td className="px-4 py-3 text-[#12201A]">
                  {formatter.format(line.variant.cartonSize)}
                </td>
                <td className="px-4 py-3">
                  {line.isSelected ? (
                    <div className="grid gap-2">
                      <div className="inline-flex h-11 w-fit items-center overflow-hidden rounded-md border border-[#8FA08F] bg-white text-[#12201A] shadow-sm">
                        <button
                          type="button"
                          className="inline-flex h-11 w-11 items-center justify-center text-[#12201A] transition hover:bg-[#EEF0E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"
                          aria-label="کاهش تعداد کارتن"
                          onClick={() => updateCarton(line.variant.id, line.cartonCount - 1)}
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <output
                          className="min-w-12 px-3 text-center font-black tabular-nums text-[#12201A]"
                          aria-live="polite"
                        >
                          {formatter.format(line.cartonCount)}
                        </output>
                        <button
                          type="button"
                          className="inline-flex h-11 w-11 items-center justify-center text-[#12201A] transition hover:bg-[#EEF0E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A5B]"
                          aria-label="افزایش تعداد کارتن"
                          onClick={() => updateCarton(line.variant.id, line.cartonCount + 1)}
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>
                      {line.isBelowMinimum ? (
                        <p className="text-xs font-bold text-[#A15C00]">
                          حداقل همکاری: {formatter.format(line.variant.minWholesaleCartonCount)}{" "}
                          کارتن
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
                      onClick={() => updateCarton(line.variant.id, 1)}
                    >
                      <ShoppingCart size={16} aria-hidden="true" />
                      افزودن
                    </Button>
                  )}
                </td>
                <td className="px-4 py-3 text-[#12201A]">
                  <Price valueRial={line.variant.wholesalePriceRial} />
                </td>
                <td className="px-4 py-3 font-bold text-[#12201A]">
                  {line.isSelected ? <Price valueRial={line.totalRial} /> : "انتخاب نشده"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D5D9C9] bg-[#14201B] p-4 text-white">
        <div>
          <span className="text-lg font-bold">
            جمع سفارش: <Price valueRial={totalRial} />
          </span>
          <p className="mt-1 text-sm text-white/70">
            {selectedLines.length === 0
              ? "هنوز محصولی انتخاب نشده است."
              : hasInvalidSelection
                ? "برای انتقال به سبد، تعداد کارتن‌های انتخاب‌شده باید به حداقل همکاری برسد."
                : `${formatter.format(selectedLines.length)} ردیف آماده انتقال است.`}
          </p>
        </div>
        <Button
          type="button"
          className="border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D] disabled:border-white/20 disabled:bg-white/15 disabled:text-white/50"
          disabled={selectedLines.length === 0 || hasInvalidSelection}
          onClick={saveWholesaleCart}
        >
          انتقال به سبد عمده
        </Button>
      </aside>
    </div>
  );
}
