"use client";

import type { Customer, ProductVariantType, SalesChannel } from "@ufo/types";
import type { CustomerCartView } from "@ufo/orders";

export interface CustomerSession {
  channel: SalesChannel;
  token: string;
  customer: Customer;
  loggedInAt: string;
  fullName?: string;
  phone: string;
  businessName?: string;
  managerName?: string;
}

export interface SelectedVariant {
  type: Exclude<ProductVariantType, "none">;
  valueId: string;
}

export interface GuestCartLine {
  variantId: string;
  quantity: number;
  cartonCount?: number;
  channel: SalesChannel;
  selectedVariant?: SelectedVariant;
  colorId?: string;
}

export const sessionKeys: Record<SalesChannel, string> = {
  retail: "ufo-retail-session",
  wholesale: "ufo-b2b-session",
};

export const cartKeys: Record<SalesChannel, string> = {
  retail: "ufo-retail-cart",
  wholesale: "ufo-b2b-cart",
};

export function isSelectedVariant(value: unknown): value is SelectedVariant {
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

export function isGuestCartLine(value: unknown): value is GuestCartLine {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.variantId === "string" &&
    typeof record.quantity === "number" &&
    (record.channel === "retail" || record.channel === "wholesale") &&
    (!("cartonCount" in record) || typeof record.cartonCount === "number") &&
    (!("selectedVariant" in record) || isSelectedVariant(record.selectedVariant)) &&
    (!("colorId" in record) || typeof record.colorId === "string")
  );
}

export function readGuestCart(channel: SalesChannel): GuestCartLine[] {
  const raw =
    window.localStorage.getItem(cartKeys[channel]) ?? window.localStorage.getItem("ufo-cart");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isGuestCartLine).filter((line) => line.channel === channel)
      : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(channel: SalesChannel, cart: GuestCartLine[]): void {
  window.localStorage.setItem(cartKeys[channel], JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(`${cartKeys[channel]}-updated`));
  window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
}

export function clearGuestCart(channel: SalesChannel): void {
  window.localStorage.removeItem(cartKeys[channel]);
  window.dispatchEvent(new CustomEvent(`${cartKeys[channel]}-updated`));
  window.dispatchEvent(new CustomEvent("ufo-cart-updated"));
}

export function readCustomerSession(channel: SalesChannel): CustomerSession | null {
  const raw = window.localStorage.getItem(sessionKeys[channel]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CustomerSession>;
    if (parsed.channel !== channel || typeof parsed.token !== "string" || !parsed.customer) {
      return null;
    }
    return parsed as CustomerSession;
  } catch {
    return null;
  }
}

export function saveCustomerSession(session: CustomerSession): void {
  window.localStorage.setItem(sessionKeys[session.channel], JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(`${sessionKeys[session.channel]}-updated`));
}

export function authHeaders(channel: SalesChannel): HeadersInit {
  const session = readCustomerSession(channel);
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function fetchCustomerCart(channel: SalesChannel): Promise<CustomerCartView | null> {
  const session = readCustomerSession(channel);
  if (!session) return null;
  const response = await fetch("/api/cart", {
    cache: "no-store",
    headers: authHeaders(channel),
  });
  if (!response.ok) return null;
  return (await response.json()) as CustomerCartView;
}
