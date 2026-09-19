import { expect, test } from "@playwright/test";

for (const route of ["/", "/b2b"]) {
  for (const width of [1440, 1280, 1024, 430, 390, 375, 320]) {
    test(`${route} floating and docked at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route);
      const header = page.getByRole("banner");
      await expect(header).toHaveAttribute("data-docked", "false");
      await page.evaluate(() => document.fonts.ready);
      const initial = await header.boundingBox();
      expect(initial!.x).toBeGreaterThan(0);
      expect(initial!.y).toBeGreaterThan(0);
      const contentTop = await page
        .locator("main")
        .evaluate((el) => el.getBoundingClientRect().top + scrollY);
      expect(contentTop).toBeCloseTo(0, 0);
      await expect(header).toHaveCSS("border-radius", "999px");
      expect(await header.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain(
        "blur(24px)",
      );
      const heroContent = page.locator("main > section").first().getByRole("heading", { level: 1 });
      expect((await heroContent.boundingBox())!.y).toBeGreaterThan(initial!.y + initial!.height);
      await expect(header).toHaveCSS("direction", "rtl");
      for (const y of [240, 18, 22, 17, 240]) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
        await expect(header).toHaveAttribute("data-docked", "true");
      }
      await expect.poll(async () => (await header.boundingBox())!.x).toBe(0);
      expect((await header.boundingBox())!.y).toBe(0);
      expect((await header.boundingBox())!.height).toBe(initial!.height);
      expect(
        await page.locator("main").evaluate((el) => el.getBoundingClientRect().top + scrollY),
      ).toBe(contentTop);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await expect(header).toHaveAttribute("data-docked", "false");
      await expect.poll(async () => (await header.boundingBox())!.x).toBe(initial!.x);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
      const controlsFit = await header.evaluate((el) => {
        const boxes = [...el.querySelectorAll("a, button, input")]
          .map((node) => node.getBoundingClientRect())
          .filter((r) => r.width && r.height);
        return boxes.every(
          (a, i) =>
            a.left >= 0 &&
            a.right <= innerWidth &&
            boxes
              .slice(i + 1)
              .every(
                (b) =>
                  Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 ||
                  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
              ),
        );
      });
      expect(controlsFit).toBe(true);
      await page.screenshot({
        path: `temp/header-docking/${route === "/" ? "retail" : "b2b"}-${width}.png`,
      });
      if (route === "/b2b" && width < 1280) {
        const menu = header.getByRole("button", { name: "باز کردن منو" });
        await menu.click();
        await expect(header.getByRole("navigation", { name: "منوی موبایل عمده" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
        await expect(header.getByRole("link", { name: "ورود عمده", exact: true })).toHaveAttribute(
          "href",
          "/b2b/login",
        );
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(
        await header.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
      ).toBeLessThanOrEqual(0.00001);
    });
  }
}
