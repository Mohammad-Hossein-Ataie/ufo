"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@ufo/ui";
import type { SalesChannel } from "@ufo/types";

interface CartLine {
  variantId: string;
  quantity: number;
  channel: SalesChannel;
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
    (value.channel === "retail" || value.channel === "wholesale")
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
}: {
  variantId: string;
  quantity?: number;
  channel?: SalesChannel;
  label?: string;
}) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    const cart = readCart(channel);
    const existing = cart.find((line) => line.variantId === variantId && line.channel === channel);
    const nextCart = existing
      ? cart.map((line) =>
          line.variantId === variantId && line.channel === channel
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      : [...cart, { variantId, quantity, channel }];
    window.localStorage.setItem(cartKeys[channel], JSON.stringify(nextCart));
    window.dispatchEvent(new CustomEvent(`${cartKeys[channel]}-updated`));
    window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Button type="button" size="sm" onClick={addToCart}>
      <ShoppingCart size={16} />
      {added ? "اضافه شد" : label}
    </Button>
  );
}
