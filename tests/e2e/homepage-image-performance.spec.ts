import { expect, test } from "@playwright/test";

test("homepage images prioritize the hero, lazy-load lower sections, and avoid duplicate URLs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    (window as Window & { __homepageCls?: number }).__homepageCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (!entry.hadRecentInput) {
          (window as Window & { __homepageCls?: number }).__homepageCls! += entry.value ?? 0;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  const imageRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "image" || request.url().includes("/api/product-images/")) {
      imageRequests.push(request.url());
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const initialRequests = [...imageRequests];
  expect(initialRequests.filter((url) => url.includes("/images/ufo-hero.webp"))).toHaveLength(1);
  expect(
    initialRequests.filter((url) => url.includes("/images/categories/"))
      .length,
  ).toBeLessThanOrEqual(7);
  // At most the four visible product cards plus the four intentionally predecoded next cards.
  expect(
    initialRequests.filter((url) => url.includes("/api/product-images/")).length,
  ).toBeLessThanOrEqual(8);
  expect(
    await page.locator('main img[fetchpriority="high"], main img[loading="eager"]').count(),
  ).toBeLessThanOrEqual(2);

  await page.locator(".homepage-product-deck").scrollIntoViewIfNeeded();
  await expect.poll(() => imageRequests.some((url) => url.includes("/api/product-images/"))).toBe(true);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(750);

  const duplicateUrls = [...new Set(imageRequests)].filter(
    (url) => imageRequests.filter((candidate) => candidate === url).length > 1,
  );
  expect(duplicateUrls).toEqual([]);
  expect(
    await page.locator("main img").evaluateAll((images) =>
      images.every((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => (window as Window & { __homepageCls?: number }).__homepageCls ?? 0,
    ),
  ).toBeLessThan(0.1);
});
