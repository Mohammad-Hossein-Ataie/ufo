"use client";

import { useState } from "react";
import { Check, Gauge, Palette, Sparkles } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";
import type { ProductVariantType } from "@ufo/types";
import { Button } from "@ufo/ui";

interface ProductPurchasePanelProps {
  variantId: string;
  variantType: ProductVariantType;
  variantOptions: StorefrontVariantOption[];
  initialVariantValueId?: string | null;
  label: string;
}

function swatchStyle(option: StorefrontVariantOption) {
  if (!option.swatch) return undefined;
  return option.swatch.startsWith("linear-gradient")
    ? { backgroundImage: option.swatch }
    : { backgroundColor: option.swatch };
}

function getVariantTypeLabel(variantType: ProductVariantType) {
  if (variantType === "flavor") return "طعم";
  if (variantType === "color") return "رنگ";
  if (variantType === "resistance") return "اهم";
  if (variantType === "capacity") return "ظرفیت";
  return "";
}

export function ProductPurchasePanel({
  variantId,
  variantType,
  variantOptions,
  initialVariantValueId = null,
  label,
}: ProductPurchasePanelProps) {
  const [selectedValueId, setSelectedValueId] = useState<string | null>(
    initialVariantValueId,
  );
  const hasOptions = variantType !== "none";
  const selectedOption = variantOptions.find((option) => option.id === selectedValueId);
  const needsSelection = hasOptions && !selectedOption;
  const hasAvailableOption = variantOptions.some((option) => !option.disabled);
  const labelFa = getVariantTypeLabel(variantType);

  return (
    <div className="grid gap-4">
      {hasOptions ? (
        <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-black">
              {variantType === "flavor" ? (
                <Sparkles size={17} className="text-cyan-300" aria-hidden="true" />
              ) : variantType === "color" ? (
                <Palette size={17} className="text-cyan-300" aria-hidden="true" />
              ) : (
                <Gauge size={17} className="text-cyan-300" aria-hidden="true" />
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
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) setSelectedValueId(option.id);
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                    active
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : option.disabled
                        ? "cursor-not-allowed border-[#22303D] bg-[#141A22] text-white/40 line-through"
                      : "border-[#22303D] bg-[#141A22] text-white hover:border-cyan-300/70"
                  }`}
                  role="radio"
                  aria-checked={active}
                  aria-disabled={option.disabled}
                >
                  {option.swatch ? (
                    <span
                      className="h-5 w-5 rounded-full border border-white/35"
                      style={swatchStyle(option)}
                      aria-hidden="true"
                    />
                  ) : null}
                  {option.labelFa}
                  {option.disabled ? <span className="text-[10px] no-underline">ناموجود</span> : null}
                  {active ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {needsSelection ? (
        <Button type="button" disabled className="w-full">
          {hasAvailableOption ? `ابتدا ${labelFa} را انتخاب کنید` : "همه گزینه‌ها ناموجود هستند"}
        </Button>
      ) : (
        <AddToCartButton
          key={`${variantId}-${selectedValueId ?? "default"}`}
          variantId={variantId}
          label={label}
          enableQuantity
          selectedVariant={
            selectedValueId && variantType !== "none"
              ? { type: variantType, valueId: selectedValueId }
              : undefined
          }
        />
      )}
    </div>
  );
}
