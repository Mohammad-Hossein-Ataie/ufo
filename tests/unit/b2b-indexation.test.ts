import { afterEach, describe, expect, it, vi } from "vitest";
import { metadata } from "@/app/b2b/layout";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const utilityPaths = [
  "/b2b/catalog",
  "/b2b/quick-order",
  "/b2b/login",
  "/b2b/account",
  "/b2b/cart",
  "/b2b/checkout",
  "/b2b/orders",
  "/b2b/orders/example",
];

afterEach(() => vi.unstubAllEnvs());

describe("B2B indexation safety", () => {
  it("defaults new utility pages to noindex without a homepage canonical", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBeNull();
    expect(metadata.openGraph).toBeNull();
    expect(metadata.twitter).toBeNull();
  });

  it("allows production crawlers to read utility-page noindex directives", () => {
    vi.stubEnv("NODE_ENV", "production");
    const rules = robots().rules;
    expect(Array.isArray(rules)).toBe(true);
    const rule = (Array.isArray(rules) ? rules : [rules])[0];
    const blocked = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    for (const path of utilityPaths) {
      expect(
        blocked.filter((prefix) => prefix && !prefix.includes("*") && path.startsWith(prefix)),
      ).toEqual([]);
    }
    expect(blocked).toContain("/admin");
    expect(blocked).toContain("/api");
  });

  it("continues to block crawling outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(robots().rules).toEqual([{ userAgent: "*", disallow: "/" }]);
  });

  it("keeps utility and account URLs out of the sitemap", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    for (const path of utilityPaths) {
      expect(paths.some((entry) => entry === path || entry.startsWith(`${path}/`))).toBe(false);
    }
  });
});
