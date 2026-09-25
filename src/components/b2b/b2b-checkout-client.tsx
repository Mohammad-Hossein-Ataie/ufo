"use client";
import { CheckoutClient } from "@/components/checkout-client";
export function B2BCheckoutClient({ gatewayEnabled }: { gatewayEnabled: boolean }) {
  return (
    <div className="rounded-3xl bg-[#080c11] p-4 text-white sm:p-6">
      <CheckoutClient channel="wholesale" gatewayEnabled={gatewayEnabled} />
    </div>
  );
}
