import { expect, test } from "@playwright/test";

test("category card opens its product from the card body", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem("ufo-age-verified", "true"));
  await page.goto("/products/category/vape", { waitUntil: "domcontentloaded" });
  const card = page.locator(".catalog-linked-card").first();
  await expect(card).toBeVisible();
  const href = await card.locator('[data-product-navigation="details"]').getAttribute("href");
  expect(href).toMatch(/^\/products\/[^/]+$/);
  await card.locator("h3").click({ force: true });
  await expect.poll(() => new URL(page.url()).pathname).toBe(href);
});
