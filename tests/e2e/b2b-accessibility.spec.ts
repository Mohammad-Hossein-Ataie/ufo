import { expect, test } from "@playwright/test";

const widths = [1440, 1280, 1024, 768, 430, 390, 375, 360];
const pages = ["/b2b", "/b2b/catalog", "/b2b/about", "/b2b/quick-order"];

for (const width of widths) {
  test(`B2B layout and landmarks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of pages) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator("main#main-content")).toHaveCount(1);
      await expect(page.locator(".b2b-shell")).toHaveCSS("color-scheme", "light");
      const contrast = await page
        .locator('.b2b-shell :is(a, button)[class~="bg-[#1F8A5B]"]')
        .evaluateAll((controls) => {
          const luminance = (color: string) => {
            const channels = color
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map(Number)
              .map((value) => {
                const channel = value / 255;
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
              });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          return controls
            .filter((control) => control.getBoundingClientRect().width > 0)
            .every((control) => {
              const style = getComputedStyle(control);
              const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
                (a, b) => a - b,
              );
              return (values[1] + 0.05) / (values[0] + 0.05) >= 4.5;
            });
        });
      expect(contrast, `${path}: control text contrast`).toBe(true);
      await expect(page.getByRole("banner").locator("a button")).toHaveCount(0);
      const geometry = await page.getByRole("banner").evaluate((header) => {
        const boxes = [...header.querySelectorAll("a, button, input")]
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.width && rect.height);
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          clipped: boxes.some((rect) => rect.x < 0 || rect.right > innerWidth),
          overlapping: boxes.some((a, index) =>
            boxes
              .slice(index + 1)
              .some(
                (b) =>
                  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
              ),
          ),
          undersized: boxes.some((rect) => rect.width < 44 || rect.height < 44),
          direction: getComputedStyle(header).direction,
        };
      });
      expect(geometry, path).toEqual({
        overflow: false,
        clipped: false,
        overlapping: false,
        undersized: false,
        direction: "rtl",
      });
      const slug = path === "/b2b" ? "home" : path.split("/").pop();
      await page.screenshot({ path: `temp/b2b-accessibility/${slug}-${width}.png` });
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [360, 1024]) {
  test(`B2B disclosure menu supports keyboard dismissal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 650 });
    await page.goto("/b2b/about");
    const header = page.getByRole("banner");
    const trigger = header.getByRole("button", { name: "باز کردن منو" });
    await trigger.focus();
    await trigger.press("Enter");
    const openTrigger = header.getByRole("button", { name: "بستن منو" });
    await expect(openTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#b2b-mobile-menu")).toBeVisible();
    const active = page
      .getByRole("navigation", { name: "منوی موبایل عمده" })
      .getByRole("link", { name: "درباره همکاری" });
    await expect(active).toHaveAttribute("aria-current", "page");
    await active.focus();
    await page.screenshot({ path: `temp/b2b-accessibility/menu-${width}.png` });
    await active.press("Escape");
    await expect(page.locator("#b2b-mobile-menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
}

test("B2B table is keyboard-scrollable with labelled row context", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/b2b/quick-order");
  const region = page.getByRole("region", { name: "جدول اقلام" });
  await region.focus();
  await expect(region).toBeFocused();
  await expect(region).toHaveCSS("outline-style", "solid");
  await expect(region.getByRole("table", { name: "جدول اقلام" })).toBeVisible();
  await expect(region.locator('thead th[scope="col"]')).toHaveCount(6);
  expect(await region.locator('tbody th[scope="row"]').count()).toBeGreaterThan(0);
  expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  const before = await region.evaluate((element) => element.scrollLeft);
  await region.press("ArrowLeft");
  await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeLessThan(before);
  expect(
    await region.locator("button").evaluateAll((buttons) =>
      buttons.every((button) => {
        const reference = button.getAttribute("aria-describedby");
        return reference && document.getElementById(reference)?.getAttribute("scope") === "row";
      }),
    ),
  ).toBe(true);
});
