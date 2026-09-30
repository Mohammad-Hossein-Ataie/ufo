import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ufo-age-verified", "true"));
  await page.route("**/api/analytics", (route) => route.fulfill({ json: {} }));
  await page.route(/^https:\/\/(trustseal\.enamad\.ir|zibal\.ir)\//, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',
    }),
  );
  await page.route("**/api/search?**", (route) =>
    route.fulfill({
      json: {
        products: [
          {
            id: "search-example",
            title: "پاد آرگاس ARGUS مدل آزمایشی",
            subtitle: "ARGUS Pod System آرگاس",
            brand: "VOOPOO",
            category: "پاد سیستم",
            sku: "TEST-1",
            href: "/products/test-search",
            image: "/images/categories/lighter.webp",
            fallbackImage: "/images/categories/lighter.webp",
            priceRial: 12000000,
            compareAtPriceRial: 13000000,
            availabilityState: "available",
            purchasable: true,
            stockLabel: "موجود",
            cartonSize: 10,
            moq: 1,
          },
        ],
        categories: [],
        brands: [],
      },
    }),
  );
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 440, height: 956 },
  { width: 1440, height: 900 },
]) {
  test(`search matches use color only and larger thumbnails fit at ${viewport.width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|cannot be a descendant|nesting/i.test(message.text())
      )
        errors.push(message.text());
    });
    await page.setViewportSize(viewport);
    await page.goto("/products", { waitUntil: "domcontentloaded" });
    if (viewport.width < 1024)
      await page.getByRole("button", { name: "باز کردن جستجو", exact: true }).click();
    const input = page.getByPlaceholder("جستجوی محصول، برند یا SKU").filter({ visible: true });
    await input.fill("آرگاس ARGUS");
    const row = page.locator('[data-search-product="true"]:visible');
    await expect(row).toHaveCount(1);
    await expect(row.locator("mark")).toHaveCount(4);
    const marks = await row.locator("mark").evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          background: style.backgroundColor,
          padding: style.padding,
          color: style.color,
          surrounding: getComputedStyle(node.parentElement!).color,
          border: style.borderWidth,
        };
      }),
    );
    for (const mark of marks) {
      expect(mark.background).toBe("rgba(0, 0, 0, 0)");
      expect(mark.padding).toBe("0px");
      expect(mark.border).toBe("0px");
      expect(mark.color).not.toBe(mark.surrounding);
    }
    const image = row.locator("img");
    await expect(image.locator("..").locator("..")).toHaveClass(/bg-retail-surface-alt/);
    await expect
      .poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 0))
      .toBe(true);
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveCSS("padding", "0px");
    expect((await image.boundingBox())!.width).toBeGreaterThan(64);
    expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await input.press("ArrowDown");
    await expect(row).toHaveClass(/bg-white\/10/);
    await page.screenshot({ path: `temp/search-ui-${viewport.width}.png` });
    await input.press("Escape");
    await expect(row).toHaveCount(0);
    if (viewport.width < 1024)
      await expect(page.getByRole("button", { name: "باز کردن جستجو", exact: true })).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test("wholesale search uses its own theme color without boxed matches", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/b2b", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("جستجوی کاتالوگ عمده").filter({ visible: true }).fill("ARGUS");
  const row = page.locator('[data-search-product="true"]:visible');
  await expect(row).toHaveCount(1);
  const mark = row.locator("mark").first();
  await expect(mark).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect(
    await mark.evaluate((node) => getComputedStyle(node).getPropertyValue("--ui-focus").trim()),
  ).toBe("#176d48");
  await page.screenshot({ path: "temp/search-ui-wholesale.png" });
});

test("category cards use the catalog layout with compact variant dots and pagination", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/category/vape", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".catalog-linked-card");
  await expect(cards).toHaveCount(12);
  await expect(cards.first()).toHaveClass(/mobile-product-card/);
  await expect(page.getByRole("navigation", { name: "صفحه‌بندی محصولات" })).toBeVisible();
  await expect(
    page.locator('.catalog-linked-card [role="group"][aria-label="رنگ‌های محصول"]'),
  ).not.toHaveCount(0);
  await cards.first().scrollIntoViewIfNeeded();
  await expect
    .poll(() => cards.first().locator("img").first().evaluate((image) => (image as HTMLImageElement).naturalWidth), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({ path: "temp/category-vape-mobile.png" });
  const firstHref = await cards.first().locator("[data-product-navigation]").getAttribute("href");
  await cards.first().locator(".media-frame").scrollIntoViewIfNeeded();
  const mediaHref = await cards
    .first()
    .locator(".media-frame")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return document
        .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        ?.closest("a")
        ?.getAttribute("href");
    });
  expect(mediaHref).toBe(firstHref);
  await cards.first().locator("[data-product-navigation]").click();
  await expect(page).toHaveURL(new RegExp(`${firstHref}$`));
});

test("catalog cards share one native link across media, title and empty space; cart controls stay separate", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|cannot be a descendant|nesting/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto("/products", { waitUntil: "domcontentloaded" });
  const card = page.locator(".catalog-linked-card").first();
  const link = card.locator("[data-product-navigation]");
  await expect(link).toHaveCount(1);
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/products\//);
  await expect(card.locator("a a, a button, a input")).toHaveCount(0);
  const cartButton = page.locator(".catalog-card-secondary-action button").first();
  if (await cartButton.count()) {
    await cartButton.scrollIntoViewIfNeeded();
    expect(
      await cartButton.evaluate((button) => {
        const r = button.getBoundingClientRect();
        return (
          document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest("button") ===
          button
        );
      }),
    ).toBe(true);
    await cartButton.click();
    await expect(page).toHaveURL(/\/products$/);
  }
  for (const part of [card.locator(".media-frame"), card.locator("h3"), link]) {
    await part.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect
      .poll(() =>
        part.evaluate((element) => {
          const r = element.getBoundingClientRect();
          return document
            .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
            ?.closest("a")
            ?.getAttribute("href");
        }),
      )
      .toBe(href);
  }
  await link.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(link).toBeFocused();
  await expect(card).toHaveCSS("outline-style", "solid");
  await expect(card).toHaveCSS("outline-width", "2px");
  await page.screenshot({ path: "temp/catalog-card-focus-440.png" });
  await link.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await page.goto("/products", { waitUntil: "domcontentloaded" });
  // A real click on card whitespace follows the same CTA URL.
  await card.scrollIntoViewIfNeeded();
  await card.click({ position: { x: 4, y: 4 } });
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await page.goto("/products", { waitUntil: "domcontentloaded" });
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  expect(errors).toEqual([]);
});
