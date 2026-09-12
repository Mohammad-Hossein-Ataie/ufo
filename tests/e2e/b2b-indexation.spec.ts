import { expect, test } from "@playwright/test";

const utilityPaths = [
  "/b2b/catalog",
  "/b2b/quick-order",
  "/b2b/login",
  "/b2b/account",
  "/b2b/cart",
  "/b2b/checkout",
  "/b2b/orders",
  "/b2b/orders/indexation-check",
];

// Inspect the HTTP HTML so noindex must exist before client scripts or redirects.
for (const path of utilityPaths) {
  test(`${path} serves noindex in its server-rendered HTML`, async ({ request }) => {
    const response = await request.get(path, { headers: { "User-Agent": "Googlebot" } });
    expect(response.status()).toBe(200);
    const html = await response.text();
    const metaTags = html.match(/<meta\b[^>]*>/g) ?? [];
    const robots = metaTags.filter((tag) => tag.includes('name="robots"'));
    expect(robots).toHaveLength(1);
    expect(robots[0]).toContain("noindex");
    expect(robots[0]).toContain("nofollow");
    expect(metaTags.some((tag) => tag.includes('property="og:url"'))).toBe(false);

    const canonicals = (html.match(/<link\b[^>]*>/g) ?? []).filter((tag) =>
      tag.includes('rel="canonical"'),
    );
    if (path === "/b2b/catalog") {
      expect(canonicals).toHaveLength(1);
      expect(canonicals[0]).toContain('/b2b/catalog"');
    } else {
      expect(canonicals).toHaveLength(0);
    }

    if (!path.startsWith("/b2b/orders/")) {
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html.match(/<main\b[^>]*id="main-content"/g)).toHaveLength(1);
    }
  });
}

for (const path of ["/b2b", "/b2b/about"]) {
  test(`${path} retains its existing explicit metadata`, async ({ request }) => {
    const response = await request.get(path, { headers: { "User-Agent": "Googlebot" } });
    expect(response.status()).toBe(200);
    const html = await response.text();
    const robots = (html.match(/<meta\b[^>]*>/g) ?? []).filter((tag) =>
      tag.includes('name="robots"'),
    );
    expect(robots).toHaveLength(1);
    expect(robots[0]).toContain('content="index, follow"');
    const canonicals = (html.match(/<link\b[^>]*>/g) ?? []).filter((tag) =>
      tag.includes('rel="canonical"'),
    );
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0]).toContain(`${path}"`);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html.match(/<main\b[^>]*id="main-content"/g)).toHaveLength(1);
    expect(html).not.toContain("+۵۰۰");
    expect(html).not.toContain("۲۴h");
  });
}

test("generated sitemap excludes B2B utility URLs", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );
  for (const path of utilityPaths) expect(paths).not.toContain(path);
});
