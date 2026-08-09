"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@ufo/ui";
import type { SalesChannel } from "@ufo/types";

interface CartLine {
  variantId: string;
  quantity: number;
  channel: SalesChannel;
  colorId?: string;
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
  label = "افزودن",
  enableQuantity = channel === "retail",
  maxQuantity,
  selectedColorIds = [],
}: {
  variantId: string;
  quantity?: number;
  channel?: SalesChannel;
  label?: string;
  enableQuantity?: boolean;
  maxQuantity?: number | undefined;
  selectedColorIds?: string[];
}) {
  const [added, setAdded] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const formatter = new Intl.NumberFormat("fa-IR");
  const firstQuantity = Math.max(1, Math.floor(quantity));
  const canIncrease = typeof maxQuantity !== "number" || selectedQuantity < maxQuantity;
  const colorIds: Array<string | undefined> =
    selectedColorIds.length > 0 ? selectedColorIds : [undefined];

  function addToCart(addQuantity = quantity) {
    const cart = readCart(channel);
    const quantityToAdd = Math.max(1, Math.floor(addQuantity));
    let nextCart = [...cart];
    for (const colorId of colorIds) {
      const existing = nextCart.find(
        (line) =>
          line.variantId === variantId && line.channel === channel && line.colorId === colorId,
      );
      nextCart = existing
        ? nextCart.map((line) =>
            line.variantId === variantId && line.channel === channel && line.colorId === colorId
              ? { ...line, quantity: line.quantity + quantityToAdd }
              : line,
          )
        : [
            ...nextCart,
            { variantId, quantity: quantityToAdd, channel, ...(colorId ? { colorId } : {}) },
          ];
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
          colorIds.includes(line.colorId)
        ),
    );
    if (safeQuantity > 0) {
      nextCart = [
        ...nextCart,
        ...colorIds.map((colorId) => ({
          variantId,
          quantity: safeQuantity,
          channel,
          ...(colorId ? { colorId } : {}),
        })),
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
          className="min-w-32"
        >
          <ShoppingCart size={16} aria-hidden="true" />
          {label}
        </Button>
      );
    }

    return (
      <div className="grid w-full gap-2 sm:w-auto" aria-label="انتخاب تعداد">
        <div className="inline-flex min-h-10 items-center overflow-hidden rounded-md border border-current/20 bg-current/[0.04]">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent disabled:cursor-not-allowed disabled:opacity-45"
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
            className="inline-flex h-10 w-10 items-center justify-center transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent disabled:cursor-not-allowed disabled:opacity-45"
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
          className="min-w-32"
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
    <Button type="button" size="sm" onClick={() => addToCart()}>
      <ShoppingCart size={16} aria-hidden="true" />
      {added ? "اضافه شد" : label}
    </Button>
  );
}
