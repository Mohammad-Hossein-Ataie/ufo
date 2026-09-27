import { expect, test } from "@playwright/test";

test("mobile search opens directly and catalog filters wait for Apply", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto("/products");

  await page.getByRole("button", { name: "باز کردن جستجو" }).click();
  const searchDialog = page.locator("#retail-mobile-search");
  await expect(searchDialog).toBeVisible();
  await expect(page).toHaveURL(/\/products$/);
  const dialogSearch = searchDialog.getByPlaceholder("جستجوی محصول، برند یا SKU");
  await expect(dialogSearch).toBeFocused();
  const emptySuggestions = await searchDialog.getByRole("button", { name: "مشاهده همه محصولات" }).locator("..").boundingBox();
  expect(emptySuggestions?.height).toBeLessThan(100);
  await dialogSearch.fill("پاد");
  await dialogSearch.press("Enter");

  await expect(searchDialog).toBeHidden();
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("پاد");
  await expect(page.getByRole("link", { name: "حذف جستجو: پاد", exact: true })).toBeVisible({ timeout: 20000 });

  const catalogSearch = page.getByRole("searchbox", { name: "جستجو در محصولات" });
  await expect(catalogSearch).toHaveValue("پاد");
  await catalogSearch.fill("ویپ");
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).searchParams.get("q")).toBe("پاد");
  await page.getByRole("button", { name: "جستجو", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("ویپ");

  await page.getByRole("button", { name: /فیلتر و مرتب‌سازی/ }).click();
  const filters = page.locator("#catalog-filters");
  await filters.getByRole("button", { name: "همه دسته‌ها" }).click();
  await filters.getByRole("option", { name: "ویپ", exact: true }).click();
  expect(new URL(page.url()).searchParams.get("category")).toBeNull();
  await filters.getByRole("button", { name: "اعمال فیلترها و نمایش محصولات" }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("category")).toBe("vape");
  expect(new URL(page.url()).searchParams.get("q")).toBe("ویپ");
  await expect(page.getByRole("link", { name: "حذف ویپ", exact: true })).toBeVisible();
});

test("wholesale catalog search waits for an explicit submit", async ({ page }) => {
  await page.goto("/b2b/catalog");
  const filters = page.locator('form[action="/b2b/catalog"]');
  const search = filters.locator('input[name="q"]');
  await search.fill("Uwell");
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).searchParams.get("q")).toBeNull();
  await filters.getByRole("button", { name: "جستجو", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("Uwell");
});

test("catalog search includes Argus P1 above three million unless price is explicitly capped", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const suggestionsResponse = await page.request.get(`/api/search?channel=retail&q=${encodeURIComponent("آرگاس پی 1")}`);
  expect(suggestionsResponse.ok()).toBe(true);
  const suggestions = (await suggestionsResponse.json()) as { products: { href: string }[] };
  expect(suggestions.products.some((product) => product.href === "/products/argus-p1")).toBe(true);
  expect(suggestions.products.some((product) => product.href === "/products/argus-p3")).toBe(false);
  await page.goto("/products?q=آرگاس پی 1", { waitUntil: "domcontentloaded" });
  const argusP1 = page.locator(".storefront-product-card").filter({
    has: page.locator('a[href="/products/argus-p1"]'),
  });
  await expect(argusP1).toBeVisible();
  await expect(page.locator('input[name="maxPrice"]')).not.toHaveValue(new Intl.NumberFormat("fa-IR").format(3_000_000));

  await page.goto("/products?q=آرگاس پی 1&maxPrice=3000000", { waitUntil: "domcontentloaded" });
  await expect(argusP1).toHaveCount(0);

  await page.goto("/products");
  const filters = page.locator("#catalog-filters");
  await filters.getByRole("button", { name: "همه دسته‌ها" }).click();
  await filters.getByRole("option", { name: "پاد", exact: true }).click();
  await expect(page).toHaveURL(/category=pod/);
  expect(new URL(page.url()).searchParams.has("maxPrice")).toBe(false);
});

test("partner brand links open the catalog with that brand selected", async ({ page }) => {
  await page.goto("/");
  const brandList = page.getByRole("list", { name: "فیلتر محصولات بر اساس برند" });
  const brandLink = brandList.getByRole("link", {
    name: "مشاهده محصولات برند Al Fakher",
    exact: true,
  });

  await expect(brandList.getByRole("link")).toHaveCount(17);
  await expect(brandList.locator("img")).toHaveCount(17);
  await expect(brandLink).toHaveAttribute("href", "/products?brand=brand-al-fakher");
  await brandLink.click();

  await expect(page).toHaveURL(/\/products\?brand=brand-al-fakher$/, { timeout: 20000 });
  await expect(page.locator('input[name="brand"]')).toHaveValue("brand-al-fakher");
  await expect(
    page.locator(".showcase-grid").getByText("Al Fakher", { exact: true }),
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
    const imageSrc = await image.getAttribute("src");
    if (imageSrc?.includes("/api/product-images/")) {
      expect(imageSrc).toMatch(/\/api\/product-images\/.+\/card\?v=\d+/);
    } else {
      expect(imageSrc).toMatch(/\/images\/categories\/.+\.webp$/);
    }
    const size = await image.boundingBox();
    expect(Math.abs(size!.width / size!.height - 0.75)).toBeLessThan(0.02);
    if (width < 1024) await page.getByRole("button", { name: /فیلتر و مرتب‌سازی/ }).click();
    const filters = page.locator("#catalog-filters");
    await filters.getByRole("button", { name: "همه دسته‌ها" }).click();
    await filters.getByRole("option", { name: "پاد", exact: true }).click();
    if (width < 1024) {
      await expect(page).not.toHaveURL(/category=pod/);
      await filters.getByRole("button", { name: "اعمال فیلترها و نمایش محصولات" }).click();
    }
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
