"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { ProductColorOption } from "@ufo/domain";
import { Button } from "@ufo/ui";

interface ProductPurchasePanelProps {
  variantId: string;
  colorOptions: ProductColorOption[];
  maxQuantity?: number | undefined;
  label: string;
}

export function ProductPurchasePanel({
  variantId,
  colorOptions,
  maxQuantity,
  label,
}: ProductPurchasePanelProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const hasColors = colorOptions.length > 0;
  const selectedColor = colorOptions.find((color) => color.id === selectedColorId);
  const needsColorSelection = hasColors && !selectedColorId;

  return (
    <div className="grid gap-4">
      {hasColors ? (
        <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-black">
              <Palette size={17} className="text-cyan-300" aria-hidden="true" />
              انتخاب رنگ
            </h2>
            <span className="text-xs text-[#9BA7B4]">
              {selectedColor ? selectedColor.labelFa : "هنوز انتخاب نشده"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="انتخاب رنگ محصول">
            {colorOptions.map((color) => {
              const active = selectedColorId === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColorId(color.id)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                    active
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-[#22303D] bg-[#141A22] text-white hover:border-cyan-300/70"
                  }`}
                  role="radio"
                  aria-checked={active}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-white/35"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  {color.labelFa}
                  {active ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-6 text-[#9BA7B4]">
            برای سفارش رنگ‌های مختلف، هر رنگ را جدا انتخاب کنید و با تعداد دلخواه به سبد اضافه کنید.
          </p>
        </section>
      ) : null}

      {needsColorSelection ? (
        <Button type="button" disabled className="w-full">
          ابتدا رنگ را انتخاب کنید
        </Button>
      ) : (
        <AddToCartButton
          key={`${variantId}-${selectedColorId ?? "default"}`}
          variantId={variantId}
          maxQuantity={maxQuantity}
          label={label}
          selectedColorIds={selectedColorId ? [selectedColorId] : []}
        />
      )}
    </div>
  );
}
