import { expect, test } from "@playwright/test";

test("partner brand links open the catalog with that brand selected", async ({ page }) => {
  await page.goto("/");
  const brandList = page.getByRole("list", { name: "فیلتر محصولات بر اساس برند" });
  const brandLink = brandList.getByRole("link", { name: "UFO Selection", exact: true });

  await expect(brandLink).toHaveAttribute("href", "/products?brand=brand-ufo");
  await brandLink.click();

  await expect(page).toHaveURL(/\/products\?brand=brand-ufo$/, { timeout: 20000 });
  await expect(page.locator('input[name="brand"]')).toHaveValue("brand-ufo");
  await expect(
    page.locator(".showcase-grid").getByText("UFO Selection", { exact: true }),
  ).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`homepage discovery stays stable and accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "محصولات جدید یوفوپاف" })).toBeVisible();
    const slots = page.locator(".homepage-product-slot");
    await expect(slots).toHaveCount(4);
    const allProducts = new Set<string>();
    for (const slot of await slots.all()) {
      const initialHeight = await slot.evaluate((el) => el.getBoundingClientRect().height);
      const controls = slot.locator("button[data-slide-index]");
      const count = await controls.count();
      for (let index = 0; index < Math.max(1, count); index++) {
        if (count) {
          await controls.nth(index).click();
          await expect(slot).toHaveAttribute("data-active-index", String(index));
          await expect(controls.nth(index)).toHaveAttribute("aria-pressed", "true");
          const target = await controls.nth(index).boundingBox();
          expect(target!.width).toBeGreaterThanOrEqual(44);
          expect(target!.height).toBeGreaterThanOrEqual(44);
        }
        const href = await slot.locator("article a").first().getAttribute("href");
        expect(allProducts.has(href!)).toBe(false);
        allProducts.add(href!);
        expect(await slot.evaluate((el) => el.getBoundingClientRect().height)).toBe(initialHeight);
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(slots.first().locator(".homepage-product-slide")).toHaveCSS(
      "animation-name",
      "none",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });

  test(`catalog filtering, protected images and product details work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/products");
    const cards = page.locator(".storefront-product-card");
    await expect(cards.first()).toBeVisible();
    await cards.first().scrollIntoViewIfNeeded();
    const image = cards.first().locator("img");
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    await expect(image).toHaveAttribute("src", /\/api\/product-images\/.+\/card\?v=2/);
    const size = await image.boundingBox();
    expect(Math.abs(size!.width - size!.height)).toBeLessThan(1);
    if (width < 1024) await page.locator('label[for="mobile-filter-toggle"]').click();
    await page.locator('select[name="category"]').selectOption("pod");
    await expect(page).toHaveURL(/category=pod/);
    await expect(cards.first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const detailHref = await cards.first().locator("a").first().getAttribute("href");
    await page.goto(detailHref!);
    await expect(page.locator("h1")).toBeVisible();
    const detailImage = page.locator(".retail-glass img").first();
    await expect
      .poll(
        () => detailImage.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
        { timeout: 20000 },
      )
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
