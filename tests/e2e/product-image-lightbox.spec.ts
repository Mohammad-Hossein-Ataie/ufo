import { expect, test } from "@playwright/test";

test("product lightbox scrolls through every protected gallery image", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/products/geek-vape-au-kit", { waitUntil: "domcontentloaded" });

  const openButton = page.getByTestId("product-gallery-frame");
  await expect(openButton).toBeVisible();
  await openButton.click();

  const dialog = page.getByRole("dialog", { name: "نمای بزرگ تصویر" });
  const scroller = page.getByTestId("image-lightbox-scroller");
  await expect(dialog).toBeVisible();
  test.skip((await scroller.count()) === 0, "This catalog fixture has only one product image.");
  await expect(scroller).toBeVisible();
  const slides = scroller.locator("[data-lightbox-slide]");
  const slideCount = await slides.count();
  expect(slideCount).toBeGreaterThan(1);
  expect(await scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);

  const initialIndex = Number(await scroller.getAttribute("data-active-index"));
  const direction = initialIndex < slideCount - 1 ? 1 : -1;
  await scroller.hover();
  await page.mouse.wheel(0, direction * 900);
  await expect.poll(async () => Number(await scroller.getAttribute("data-active-index"))).not.toBe(initialIndex);
  await expect(scroller.locator('img:not([aria-hidden="true"])')).toHaveCount(1);
  await expect(scroller.locator('img:not([aria-hidden="true"])')).toHaveCSS("object-fit", "contain");
  await page.screenshot({ path: "temp/product-gallery/lightbox-scroll-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "بستن تصویر" }).click();
  await expect(dialog).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await openButton.click();
  await expect(scroller).toBeVisible();
  await scroller.evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "auto" }));
  await expect.poll(async () => Number(await scroller.getAttribute("data-active-index"))).toBe(slideCount - 1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "temp/product-gallery/lightbox-scroll-mobile.png", fullPage: true });
});
