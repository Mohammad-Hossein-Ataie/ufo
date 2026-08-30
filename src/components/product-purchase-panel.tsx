"use client";

import { useState } from "react";
import { Check, Palette, Sparkles } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { ProductVariantOption } from "@ufo/domain";
import type { ProductVariantType } from "@ufo/types";
import { Button } from "@ufo/ui";

interface ProductPurchasePanelProps {
  variantId: string;
  variantType: ProductVariantType;
  variantOptions: ProductVariantOption[];
  maxQuantity?: number | undefined;
  label: string;
}

function swatchStyle(option: ProductVariantOption) {
  if (!option.swatch) return undefined;
  return option.swatch.startsWith("linear-gradient")
    ? { backgroundImage: option.swatch }
    : { backgroundColor: option.swatch };
}

export function ProductPurchasePanel({
  variantId,
  variantType,
  variantOptions,
  maxQuantity,
  label,
}: ProductPurchasePanelProps) {
  const [selectedValueId, setSelectedValueId] = useState<string | null>(null);
  const hasOptions = variantType !== "none" && variantOptions.length > 0;
  const selectedOption = variantOptions.find((option) => option.id === selectedValueId);
  const needsSelection = hasOptions && !selectedValueId;
  const labelFa = variantType === "flavor" ? "طعم" : "رنگ";

  return (
    <div className="grid gap-4">
      {hasOptions ? (
        <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-black">
              {variantType === "flavor" ? (
                <Sparkles size={17} className="text-cyan-300" aria-hidden="true" />
              ) : (
                <Palette size={17} className="text-cyan-300" aria-hidden="true" />
              )}
              انتخاب {labelFa}
            </h2>
            <span className="text-xs text-[#9BA7B4]">
              {selectedOption ? selectedOption.labelFa : "هنوز انتخاب نشده"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`انتخاب ${labelFa}`}>
            {variantOptions.map((option) => {
              const active = selectedValueId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedValueId(option.id)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                    active
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-[#22303D] bg-[#141A22] text-white hover:border-cyan-300/70"
                  }`}
                  role="radio"
                  aria-checked={active}
                >
                  {option.swatch ? (
                    <span
                      className="h-5 w-5 rounded-full border border-white/35"
                      style={swatchStyle(option)}
                      aria-hidden="true"
                    />
                  ) : null}
                  {option.labelFa}
                  {active ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {needsSelection ? (
        <Button type="button" disabled className="w-full">
          ابتدا {labelFa} را انتخاب کنید
        </Button>
      ) : (
        <AddToCartButton
          key={`${variantId}-${selectedValueId ?? "default"}`}
          variantId={variantId}
          maxQuantity={maxQuantity}
          label={label}
          enableQuantity
          selectedVariant={
            selectedValueId
              ? { type: variantType as "flavor" | "color", valueId: selectedValueId }
              : undefined
          }
        />
      )}
    </div>
  );
}
