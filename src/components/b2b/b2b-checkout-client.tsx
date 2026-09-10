"use client";
import { CheckoutClient } from "@/components/checkout-client";
export function B2BCheckoutClient() {
  return (
    <div className="rounded-3xl bg-[#080c11] p-4 text-white sm:p-6">
      <CheckoutClient channel="wholesale" />
    </div>
  );
}
