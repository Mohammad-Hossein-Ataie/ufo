"use client";

import { useState } from "react";
import { Check, LoaderCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@ufo/ui";
import type { ProductVariantType, SalesChannel } from "@ufo/types";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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

  function variantMatches(line: GuestCartLine, option: SelectedVariant | undefined) {
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

  function linePayload(option: SelectedVariant | undefined, lineQuantity: number): GuestCartLine {
    return {
      variantId,
      quantity: lineQuantity,
      channel,
      ...(option ? { selectedVariant: option } : {}),
      ...(option?.type === "color" ? { colorId: option.valueId } : {}),
    };
  }

  async function syncServerCart(line: GuestCartLine) {
    const session = readCustomerSession(channel);
    if (!session) throw new Error("ابتدا وارد حساب کاربری شوید.");
    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(channel) },
      body: JSON.stringify(line),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || "افزودن به سبد خرید انجام نشد.");
    }
    window.dispatchEvent(
      new CustomEvent(`${channel === "retail" ? "ufo-retail-cart" : "ufo-b2b-cart"}-updated`),
    );
    window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
    return true;
  }

  async function addToCart(addQuantity = quantity) {
    if (busy) return;
    setBusy(true);
    setError("");
    const cart = readGuestCart(channel);
    const quantityToAdd = Math.max(1, Math.floor(addQuantity));
    const session = readCustomerSession(channel);
    if (session) {
      try {
        for (const option of selectedVariants) {
          await syncServerCart(linePayload(option, quantityToAdd));
        }
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "افزودن به سبد خرید انجام نشد.");
      } finally {
        setBusy(false);
      }
      return;
    }
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
    saveGuestCart(channel, nextCart);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    setBusy(false);
  }

  async function setRetailQuantity(nextQuantity: number) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const safeQuantity = Math.max(0, Math.floor(nextQuantity));
      const session = readCustomerSession(channel);
      if (session) {
        const delta = safeQuantity - selectedQuantity;
        if (delta > 0) {
          for (const option of selectedVariants) {
            await syncServerCart(linePayload(option, delta));
          }
        } else if (delta < 0) {
          const cart = await fetchCustomerCart(channel);
          if (!cart) throw new Error("دریافت سبد خرید انجام نشد.");
          for (const option of selectedVariants) {
            const item = cart.items.find((line) => variantMatches({
              variantId: line.variantId ?? "",
              quantity: line.quantity,
              channel,
              ...(line.selectedVariant ? { selectedVariant: line.selectedVariant } : {}),
            }, option));
            if (!item) continue;
            const next = Math.max(0, item.quantity + delta);
            const response = await fetch(`/api/cart/items/${encodeURIComponent(item.id)}`, {
              method: next === 0 ? "DELETE" : "PATCH",
              headers: { "Content-Type": "application/json", ...authHeaders(channel) },
              ...(next > 0 ? { body: JSON.stringify({ quantity: next }) } : {}),
            });
            if (!response.ok) throw new Error("تغییر تعداد در سبد خرید انجام نشد.");
          }
          window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
        }
        setSelectedQuantity(safeQuantity);
        setAdded(safeQuantity > 0);
        window.setTimeout(() => setAdded(false), 1800);
        return;
      }
      const cart = readGuestCart(channel);
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
      saveGuestCart(channel, nextCart);
      setSelectedQuantity(safeQuantity);
      setAdded(safeQuantity > 0);
      window.setTimeout(() => setAdded(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تغییر سبد خرید انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (enableQuantity) {
    if (selectedQuantity === 0) {
      return (
        <div className="grid gap-1">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => setRetailQuantity(firstQuantity)}
          className="add-cart-button w-full min-w-0 select-none"
        >
          {busy ? (
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
          ) : (
            <ShoppingCart size={16} aria-hidden="true" />
          )}
          {busy ? "در حال افزودن" : label}
        </Button>
        {error ? <p role="alert" className="text-xs text-rose-400">{error}</p> : null}
        </div>
      );
    }

    return (
      <div className="grid w-full gap-2" aria-label="انتخاب تعداد">
        {error ? <p role="alert" className="text-xs text-rose-400">{error}</p> : null}
        <div className="inline-flex min-h-10 w-full items-center justify-between overflow-hidden rounded-md border border-current/20 bg-current/[0.04]">
          <button
            type="button"
            className="inline-flex h-10 w-12 select-none items-center justify-center transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="کاهش تعداد"
            disabled={busy}
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
          disabled={busy}
          onClick={() => setRetailQuantity(selectedQuantity)}
          className={`add-cart-button w-full min-w-0 select-none ${added ? "is-success" : ""}`}
        >
          {busy ? (
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
          ) : added ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <ShoppingCart size={16} aria-hidden="true" />
          )}
          {added
            ? `${formatter.format(selectedQuantity)} انتخاب شد`
            : `${formatter.format(selectedQuantity)} انتخاب شده`}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
    <Button
      type="button"
      size="sm"
      disabled={busy}
      onClick={() => addToCart()}
      className={`add-cart-button select-none ${added ? "is-success" : ""}`}
    >
      {busy ? (
        <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
      ) : added ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <ShoppingCart size={16} aria-hidden="true" />
      )}
      {busy ? "در حال افزودن" : added ? "به سبد اضافه شد" : label}
    </Button>
    {error ? <p role="alert" className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
