import { expect, test } from "@playwright/test";

const widths = [1440, 1280, 1024, 1023, 768, 430, 390, 375, 360, 320];

for (const width of widths) {
  test(`retail header branding at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const header = page.getByRole("banner");
    const brand = header.getByRole("link", { name: "یوفوپاف، صفحه خانه" });
    await expect(brand).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const image = brand.locator("img");
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);

    const geometry = await header.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const image = element.querySelector("img")!;
      const logo = image.getBoundingClientRect();
      const controls = [...element.querySelectorAll("a, button, input")]
        .map((control) => control.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      const overlap = controls.some((a, index) =>
        controls
          .slice(index + 1)
          .some(
            (b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
          ),
      );
      return {
        height: rect.height,
        width: rect.width,
        logoWidth: logo.width,
        logoHeight: logo.height,
        logoCenter: logo.x + logo.width / 2,
        source: image.currentSrc,
        overflow: controls.some((box) => box.left < 0 || box.right > innerWidth),
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        overlap,
        rtl: getComputedStyle(element).direction,
      };
    });
    expect(geometry.width).toBe(Math.min(1280, width - (width >= 640 ? 32 : 16)));
    expect(geometry.height).toBe(width >= 1024 ? 119 : 62);
    expect(geometry.rtl).toBe("rtl");
    expect(geometry.overflow).toBe(false);
    expect(geometry.pageOverflow).toBe(false);
    expect(geometry.overlap).toBe(false);
    expect(geometry.logoWidth).toBe(width >= 1024 ? 144 : width < 374 ? 88 : 120);
    expect(geometry.logoHeight).toBeCloseTo(geometry.logoWidth / 3, 1);
    expect(geometry.logoWidth / geometry.logoHeight).toBeCloseTo(3, 2);
    expect(geometry.source).toContain("ufo-puff-logo.webp");
    if (width < 1024) expect(geometry.logoCenter).toBe(width / 2);
    await expect(header.getByRole("search", { includeHidden: true })).toHaveCount(1);
    if (width >= 1024) await expect(header.getByRole("search")).toBeVisible();
    else await expect(header.getByRole("search")).toBeHidden();
    await brand.focus();
    await expect(brand).toBeFocused();
    expect(await brand.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await brand.blur();
    await page.screenshot({ path: `temp/header-branding/${width}.png` });
    await header.screenshot({ path: `temp/header-branding/header-${width}.png` });
    expect(errors).toEqual([]);
  });
}

test("desktop search and navigation retain their destinations", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "ورود", exact: true })).toHaveAttribute(
    "href",
    "/login",
  );
  await header.getByRole("link", { name: "کاتالوگ محصولات" }).click();
  await expect(page).toHaveURL(/\/products$/, { timeout: 20_000 });
  await expect(header.getByRole("link", { name: "محصولات", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect
    .poll(async () => (await page.locator(".catalog-filter-aside").boundingBox())!.y)
    .toBeGreaterThanOrEqual(118);
  await expect(page.locator(".catalog-filter-aside")).toHaveCSS("top", "134px");
  await page.evaluate(() => window.scrollTo(0, 0));
  await header.getByPlaceholder("جستجوی محصول، برند یا SKU").fill("Uwell Caliburn");
  await header.getByPlaceholder("جستجوی محصول، برند یا SKU").press("Enter");
  await expect(page).toHaveURL(/\/products\?q=Uwell%20Caliburn$/, { timeout: 20_000 });
});

for (const width of [1440, 390]) {
  test(`logo loading reserves its layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/logos/ufo-puff-logo.webp", async (route) => {
      await pending;
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const brand = page.getByRole("banner").getByRole("link", { name: "یوفوپاف، صفحه خانه" });
    const before = await brand.boundingBox();
    expect(await brand.locator("img").evaluate((img: HTMLImageElement) => img.complete)).toBe(
      false,
    );
    release();
    await expect
      .poll(() =>
        brand
          .locator("img")
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    expect(await brand.boundingBox()).toEqual(before);
  });
}

test("favicon source preview at small display sizes", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 240 });
  await page.setContent(`<html><body style="margin:0;background:#0d1117;color:#f5f7fa;font:14px system-ui;padding:32px">
    <div style="display:flex;align-items:center;gap:36px">${[16, 32, 48, 64].map((size) => `<div><img src="http://localhost:3000/logos/ufo-puff-symbol.svg" width="${size}" height="${size}" alt="UFO Puff ${size}px"><p>${size}px</p></div>`).join("")}</div>
    <p>UFO PUFF · Favicon source artwork</p></body></html>`);
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (img) =>
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth === 64,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({ path: "temp/header-branding/favicon-source.png" });
});

test("mobile menu, search, account and empty cart remain operable", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "باز کردن منو" }).click();
  const menu = page.getByRole("dialog", { name: "منوی موبایل" });
  await expect(menu).toBeVisible();
  await expect(header.getByRole("button", { name: "باز کردن منو" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.screenshot({ path: "temp/header-branding/menu-360.png" });
  await page.keyboard.press("Escape");
  await expect(header.getByRole("button", { name: "باز کردن منو" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await header.getByRole("button", { name: "سبد خرید", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "سبد خرید شما خالی است" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "سبد خرید شما خالی است" })).toHaveCount(0);
  await header.getByRole("link", { name: "جستجو", exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  await header.getByRole("link", { name: "ورود", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
  await header.getByRole("button", { name: "باز کردن منو" }).click();
  await menu.getByRole("link", { name: "محصولات", exact: true }).click();
  await expect(page).toHaveURL(/\/products$/, { timeout: 20_000 });
  await expect(header.getByRole("button", { name: "باز کردن منو" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
