"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@ufo/ui";
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

const cartKeys: Record<SalesChannel, string> = {
  retail: "ufo-retail-cart",
  wholesale: "ufo-b2b-cart",
};

function isCartLine(value: unknown): value is CartLine {
  return (
    typeof value === "object" &&
    value !== null &&
    "variantId" in value &&
    "quantity" in value &&
    "channel" in value &&
    typeof value.variantId === "string" &&
    typeof value.quantity === "number" &&
    (value.channel === "retail" || value.channel === "wholesale") &&
    (!("selectedVariant" in value) || isSelectedVariant(value.selectedVariant)) &&
    (!("colorId" in value) || typeof value.colorId === "string")
  );
}

function readCart(channel: SalesChannel): CartLine[] {
  const raw =
    window.localStorage.getItem(cartKeys[channel]) ?? window.localStorage.getItem("ufo-cart");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isCartLine).filter((line) => line.channel === channel)
      : [];
  } catch {
    return [];
  }
}

export function AddToCartButton({
  variantId,
  quantity = 1,
  channel = "retail",
  label = "افزودن به سبد خرید",
  enableQuantity = false,
  maxQuantity,
  selectedVariant,
  selectedColorIds = [],
}: {
  variantId: string;
  quantity?: number;
  channel?: SalesChannel;
  label?: string;
  enableQuantity?: boolean;
  maxQuantity?: number | undefined;
  selectedVariant?: SelectedVariant | undefined;
  selectedColorIds?: string[];
}) {
  const [added, setAdded] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const formatter = new Intl.NumberFormat("fa-IR");
  const firstQuantity = Math.max(1, Math.floor(quantity));
  const canIncrease = typeof maxQuantity !== "number" || selectedQuantity < maxQuantity;
  const selectedVariants: Array<SelectedVariant | undefined> =
    selectedVariant !== undefined
      ? [selectedVariant]
      : selectedColorIds.length > 0
        ? selectedColorIds.map((colorId) => ({ type: "color", valueId: colorId }))
        : [undefined];

  function variantMatches(line: CartLine, option: SelectedVariant | undefined) {
    const lineOption =
      line.selectedVariant ??
      (line.colorId ? ({ type: "color", valueId: line.colorId } as const) : undefined);
    return (
      line.variantId === variantId &&
      line.channel === channel &&
      lineOption?.type === option?.type &&
      lineOption?.valueId === option?.valueId
    );
  }

  function linePayload(option: SelectedVariant | undefined, lineQuantity: number): CartLine {
    return {
      variantId,
      quantity: lineQuantity,
      channel,
      ...(option ? { selectedVariant: option } : {}),
      ...(option?.type === "color" ? { colorId: option.valueId } : {}),
    };
  }

  function addToCart(addQuantity = quantity) {
    const cart = readCart(channel);
    const quantityToAdd = Math.max(1, Math.floor(addQuantity));
    let nextCart = [...cart];
    for (const option of selectedVariants) {
      const existing = nextCart.find((line) => variantMatches(line, option));
      nextCart = existing
        ? nextCart.map((line) =>
            variantMatches(line, option)
              ? { ...line, quantity: line.quantity + quantityToAdd }
              : line,
          )
        : [...nextCart, linePayload(option, quantityToAdd)];
    }
    window.localStorage.setItem(cartKeys[channel], JSON.stringify(nextCart));
    window.dispatchEvent(new CustomEvent(`${cartKeys[channel]}-updated`));
    window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function setRetailQuantity(nextQuantity: number) {
    const safeQuantity = Math.max(0, Math.floor(nextQuantity));
    const cart = readCart(channel);
    let nextCart = cart.filter(
      (line) =>
        !(
          line.variantId === variantId &&
          line.channel === channel &&
          selectedVariants.some((option) => variantMatches(line, option))
        ),
    );
    if (safeQuantity > 0) {
      nextCart = [
        ...nextCart,
        ...selectedVariants.map((option) => linePayload(option, safeQuantity)),
      ];
    }
    window.localStorage.setItem(cartKeys[channel], JSON.stringify(nextCart));
    window.dispatchEvent(new CustomEvent(`${cartKeys[channel]}-updated`));
    window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
    setSelectedQuantity(safeQuantity);
    setAdded(safeQuantity > 0);
    window.setTimeout(() => setAdded(false), 1800);
  }

  if (enableQuantity) {
    if (selectedQuantity === 0) {
      return (
        <Button
          type="button"
          size="sm"
          onClick={() => setRetailQuantity(firstQuantity)}
          className="w-full min-w-40 select-none"
        >
          <ShoppingCart size={16} aria-hidden="true" />
          {label}
        </Button>
      );
    }

    return (
      <div className="grid w-full gap-2" aria-label="انتخاب تعداد">
        <div className="inline-flex min-h-10 w-full items-center justify-between overflow-hidden rounded-md border border-current/20 bg-current/[0.04]">
          <button
            type="button"
            className="inline-flex h-10 w-12 select-none items-center justify-center transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="کاهش تعداد"
            onClick={() => setRetailQuantity(selectedQuantity - 1)}
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <output
            className="min-w-10 px-2 text-center text-sm font-bold tabular-nums"
            aria-live="polite"
          >
            {formatter.format(selectedQuantity)}
          </output>
          <button
            type="button"
            className="inline-flex h-10 w-12 select-none items-center justify-center transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="افزایش تعداد"
            disabled={!canIncrease}
            onClick={() => setRetailQuantity(selectedQuantity + 1)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setRetailQuantity(selectedQuantity)}
          className="w-full min-w-40 select-none"
        >
          <ShoppingCart size={16} aria-hidden="true" />
          {added
            ? `${formatter.format(selectedQuantity)} انتخاب شد`
            : `${formatter.format(selectedQuantity)} انتخاب شده`}
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="sm" onClick={() => addToCart()} className="select-none">
      <ShoppingCart size={16} aria-hidden="true" />
      {added ? "اضافه شد" : label}
    </Button>
  );
}
