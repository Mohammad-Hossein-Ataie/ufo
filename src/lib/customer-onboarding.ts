import type { Customer, SalesChannel } from "@ufo/types";

export function needsProfileCompletion(customer: Customer): boolean {
  return (
    !customer.firstName.trim() ||
    !customer.lastName.trim() ||
    (customer.customerType === "wholesale" && !customer.companyName?.trim())
  );
}

export function customerLoginDestination(next: string | null, channel: SalesChannel): string {
  const fallback = channel === "wholesale" ? "/b2b/account" : "/account";
  if (
    !next?.startsWith("/") ||
    next.startsWith("//") ||
    /[\\\s%]/.test(next) ||
    Array.from(next).some((char) => char.charCodeAt(0) < 32)
  )
    return fallback;
  const url = new URL(next, "https://store.example");
  const path = url.pathname;
  if (
    path === "/login" ||
    path === "/b2b/login" ||
    path.startsWith("/api") ||
    path.startsWith("/admin")
  )
    return fallback;
  const wholesale = path === "/b2b" || path.startsWith("/b2b/");
  return wholesale === (channel === "wholesale") ? `${path}${url.search}${url.hash}` : fallback;
}
