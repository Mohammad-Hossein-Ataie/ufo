import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });
test.setTimeout(90_000);

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`product actions show immediate navigation feedback on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const slot = page.locator(".homepage-product-slot").first();
    await slot.scrollIntoViewIfNeeded();
    const details = slot.locator('[data-product-navigation="details"]');
    await expect(details).toBeVisible();
    await details.focus();
    const href = await details.getAttribute("href");
    expect(href).toMatch(/^\/products\//);

    await page.route(`**${href}?*`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await details.click({ noWaitAfter: true });
    await expect(page.getByText("در حال باز کردن…", { exact: true })).toBeVisible({ timeout: 500 });
    await slot.screenshot({ path: `temp/navigation-feedback-${viewport.name}.png` });
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    const loading = page.getByTestId("loading-product");
    await expect(loading).toBeVisible();
    if (viewport.width >= 1024) {
      const gallery = await loading.getByTestId("loading-product-gallery").boundingBox();
      const info = await loading.getByTestId("loading-product-info").boundingBox();
      expect(gallery!.x).toBeLessThan(info!.x);
      await page.screenshot({ path: "temp/product-skeleton-desktop.png" });
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (viewport.width < 1024) {
      const surface = await page.getByTestId("product-gallery-surface").boundingBox();
      const frame = await page.getByTestId("product-gallery-frame").boundingBox();
      expect(Math.abs(surface!.width - frame!.width)).toBeLessThanOrEqual(2);
      expect(frame!.width / frame!.height).toBeCloseTo(3 / 4, 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const image = page.getByTestId("product-gallery-frame").locator("img");
      await expect(image).toHaveCount(1);
      await image.evaluate(async (element: HTMLImageElement) => {
        element.removeAttribute("srcset");
        element.src =
          "data:image/svg+xml," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#11212b"/><rect x="3" y="3" width="594" height="794" fill="none" stroke="#00d9ff" stroke-width="6"/></svg>',
          );
        await element.decode();
      });
      await page.screenshot({ path: "temp/product-gallery-mobile.png" });
    }
  });
}
