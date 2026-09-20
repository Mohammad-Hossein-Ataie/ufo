import { expect, test } from "@playwright/test";

// The local catalog can take longer on a cold data/cache read.
test.setTimeout(90_000);

for (const width of [1440, 390, 320]) {
  test(`portrait gallery and accessible image viewer at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/products/vozol-vista-plug-15k", { waitUntil: "domcontentloaded" });
    const opener = page.getByRole("button", { name: "بزرگ‌نمایی تصویر" });
    await expect(opener).toBeVisible();
    await opener.locator("img").evaluate((img: HTMLImageElement) => img.decode());
    const initial = await opener.boundingBox();
    expect(initial!.width / initial!.height).toBeCloseTo(0.75, 2);
    await expect(opener.locator("img")).toHaveCSS("object-fit", "contain");
    await opener.click();
    const viewer = page.getByRole("dialog", { name: "نمای بزرگ تصویر" });
    await expect(viewer).toBeVisible();
    const img = viewer.getByRole("img");
    await img.evaluate((node: HTMLImageElement) => node.decode());
    await expect(img).toHaveAttribute("src", /\/api\/product-images\/.+\/detail\?v=5/);
    await expect(img).toHaveAttribute("draggable", "false");
    await expect(img).toHaveCSS("object-fit", "contain");
    const protection = await img.evaluate((node) => {
      const menu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      node.dispatchEvent(menu);
      return menu.defaultPrevented;
    });
    expect(protection).toBe(true);
    await expect(page.locator(".image-viewer-overlay")).toHaveCSS("backdrop-filter", "blur(12px)");
    const bounds = await viewer.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    await page.keyboard.press("Tab");
    expect(await viewer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: `temp/portrait-media/viewer-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `temp/portrait-media/gallery-${width}.png` });
  });
}

for (const route of ["/", "/b2b/catalog"]) {
  test(`${route} portrait frames and bilingual title order`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const card = page
      .locator(".storefront-product-card")
      .filter({ has: page.locator(".product-card-subtitle") })
      .first();
    await card.scrollIntoViewIfNeeded();
    await card.locator("img").first().evaluate((img: HTMLImageElement) => img.decode());
    const media = await card.locator(".media-frame").boundingBox();
    expect(media!.width / media!.height).toBeCloseTo(0.75, 2);
    const title = await card.getByRole("heading").boundingBox();
    const english = await card.locator(".product-card-subtitle").boundingBox();
    expect(english!.y).toBeGreaterThanOrEqual(title!.y + title!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `temp/portrait-media/${route === "/" ? "retail" : "b2b"}-cards.png`,
    });
    if (route === "/b2b/catalog") {
      await card.getByRole("button", { name: /بزرگ‌نمایی تصویر/ }).click();
      const viewer = page.getByRole("dialog", { name: "نمای بزرگ تصویر" });
      await expect(viewer).toHaveCSS("background-color", "rgb(247, 247, 242)");
      await expect(viewer.getByRole("img")).toHaveCSS("object-fit", "contain");
      await viewer.getByRole("img").evaluate((img: HTMLImageElement) => img.decode());
      await page.screenshot({ path: "temp/portrait-media/b2b-viewer.png" });
      await page.keyboard.press("Escape");
      await expect(viewer).toHaveCount(0);
    }
  });
}

for (const route of ["/", "/b2b"]) {
  test(`${route} header expands through intermediate widths without shifting content`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.getByRole("banner").evaluate(async (header) => {
      const start = header.getBoundingClientRect();
      const mainTop = document.querySelector("main")!.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: 200, behavior: "instant" });
      const samples: number[] = [];
      const started = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          samples.push(header.getBoundingClientRect().width);
          if (performance.now() - started < 650) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      return {
        samples,
        width: start.width,
        height: start.height,
        endHeight: header.getBoundingClientRect().height,
        mainTop,
        endMainTop: document.querySelector("main")!.getBoundingClientRect().top + scrollY,
      };
    });
    expect(result.samples.some((w) => w > result.width + 1 && w < 1439)).toBe(true);
    expect(result.endHeight).toBe(result.height);
    expect(result.endMainTop).toBe(result.mainTop);
  });
}
