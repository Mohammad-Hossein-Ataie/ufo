import { expect, test } from "@playwright/test";

for (const width of [375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`homepage hero carousel remains RTL-safe at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const carousel = page.locator(".hero-category-carousel");
    const stage = carousel.getByRole("region", { name: "دسته‌بندی‌های محصولات" });
    await expect(carousel).toHaveAttribute("data-active-index", "3");
    await expect(stage.locator('[data-active="true"] a')).toHaveAttribute("aria-current", "true");
    await stage.focus();
    await stage.press("ArrowLeft");
    await expect(carousel).toHaveAttribute("data-active-index", "4");
    await stage.press("ArrowRight");
    await expect(carousel).toHaveAttribute("data-active-index", "3");
    await carousel.getByRole("button", { name: "دسته بعدی" }).click();
    await expect(carousel).toHaveAttribute("data-active-index", "4");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator("main > section")).toHaveCount(7);
    await expect(page.locator("main > section").last()).toBeVisible();
    if (width === 390 || width === 1440) {
      await page.waitForTimeout(550);
      await page.screenshot({ path: `temp/homepage-full-${width}.png`, fullPage: true });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await stage
        .locator(".hero-category-slide")
        .first()
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
    ).toBeLessThan(0.001);
  });
}

test("homepage hero accepts horizontal touch swipes without stealing vertical gestures", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const carousel = page.locator(".hero-category-carousel");
  const stage = carousel.getByRole("region", { name: "دسته‌بندی‌های محصولات" });
  const gesture = async (dx: number, dy: number) => {
    await stage.dispatchEvent("pointerdown", {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
      clientX: 180,
      clientY: 300,
    });
    await stage.dispatchEvent("pointermove", {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
      clientX: 180 + dx,
      clientY: 300 + dy,
    });
    await stage.dispatchEvent("pointerup", {
      pointerId: 7,
      pointerType: "touch",
      isPrimary: true,
      clientX: 180 + dx,
      clientY: 300 + dy,
    });
  };
  await gesture(10, 90);
  await expect(carousel).toHaveAttribute("data-active-index", "3");
  await gesture(70, 2);
  await expect(carousel).toHaveAttribute("data-active-index", "4");
  await gesture(-70, 2);
  await expect(carousel).toHaveAttribute("data-active-index", "3");
});
