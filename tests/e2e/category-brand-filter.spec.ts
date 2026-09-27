import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`category brand filter keeps category context at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const keyWarnings: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes('Each child in a list should have a unique "key" prop')
      ) {
        keyWarnings.push(message.text());
      }
    });
    await page.getByRole("link", { name: "مشاهده محصولات ویپ" }).click();
    await expect(page).toHaveURL(/\/products\/category\/vape$/);

    const brands = page.getByRole("navigation", { name: "فیلتر برندهای ویپ" });
    const allBrands = brands.getByRole("link", { name: /همه برندها/ });
    const brandLinks = brands.getByRole("link");
    await expect(brandLinks.nth(1)).toBeVisible();
    expect(await brandLinks.count()).toBeGreaterThan(2);

    const cards = page.locator(".storefront-product-card");
    const allProductLinks = await cards
      .locator('a[href^="/products/"]')
      .evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))]);
    const brandLink = brands
      .locator('a[href*="?brand="]')
      .filter({ has: page.locator("img") })
      .first();
    await expect(brandLink.locator("img")).toBeVisible();
    const brandHref = await brandLink.getAttribute("href");
    expect(brandHref).toMatch(/^\/products\/category\/vape\?brand=/);
    await brandLink.locator("img").click();

    await expect(page).toHaveURL(
      new RegExp(`${brandHref!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    );
    await expect(brands.locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(brands.locator('a[aria-current="page"]')).toHaveAttribute("href", brandHref!);
    const filteredProductLinks = await cards
      .locator('a[href^="/products/"]')
      .evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))]);
    expect(filteredProductLinks.length).toBeGreaterThan(0);
    expect(filteredProductLinks.length).toBeLessThan(allProductLinks.length);
    expect(filteredProductLinks.every((href) => allProductLinks.includes(href))).toBe(true);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/products\/category\/vape$/,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    await allBrands.click();
    await expect(page).toHaveURL(/\/products\/category\/vape$/);
    await expect(cards).toHaveCount(allProductLinks.length);
    expect(keyWarnings).toEqual([]);
  });
}
