import { expect, test } from "@playwright/test";

for (const { slug, width } of ["vaporesso-xros-4", "vozol-vista-plug-15k"].flatMap((slug) =>
  [1440, 390].map((width) => ({ slug, width })),
)) {
  test(`${slug} gallery crossfades without an empty frame at ${width}px`, async ({ page }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
    const gallery = page.locator("[data-product-crossfade]");
    await expect(gallery).toBeVisible();
    await gallery.locator("img").evaluate((img: HTMLImageElement) => img.decode());
    const original = await gallery.locator("img").getAttribute("src");
    const before = await gallery.boundingBox();
    // Observe every frame: assertion polling can skip the entire 620ms overlap.
    const framePromise = gallery.evaluate(async (el) => {
      await new Promise<void>((resolve, reject) => {
        const started = performance.now();
        const observe = () => {
          if (el.getAttribute("data-transitioning") === "true") resolve();
          else if (performance.now() - started > 40000) reject(new Error("No gallery overlap"));
          else requestAnimationFrame(observe);
        };
        observe();
      });
      const images = [...el.querySelectorAll("img")];
      return {
        count: images.length,
        accessible: images.filter((img) => img.getAttribute("aria-hidden") !== "true").length,
        oldOpacity: getComputedStyle(images[0]!).opacity,
        decoded: images.every((img) => img.complete && img.naturalWidth > 0),
        duration: getComputedStyle(images[1]!).animationDuration,
      };
    });
    // These products have image-backed color/flavor choices.
    await page.getByRole("radio").nth(2).click();
    const frame = await framePromise;
    expect(frame).toEqual({
      count: 2,
      accessible: 1,
      oldOpacity: "1",
      decoded: true,
      duration: "0.62s",
    });
    await expect(gallery).toHaveAttribute("data-transitioning", "false");
    await expect(gallery.locator("img")).not.toHaveAttribute("src", original!);
    await expect(gallery.locator("img")).toHaveCSS("object-fit", "contain");
    const after = await gallery.boundingBox();
    expect(after!.height).toBe(before!.height);
    expect(after!.width).toBe(before!.width);
    // Rapid choices coalesce to the last selection without introducing extra layers.
    const lastLabel = await page.getByRole("radio").nth(3).innerText();
    await page.getByRole("radio").nth(1).click();
    await page.getByRole("radio").nth(3).click();
    await expect(page.getByRole("radio").nth(3)).toHaveAttribute("aria-checked", "true");
    await expect
      .poll(() => gallery.locator('img:not([aria-hidden="true"])').getAttribute("alt"), {
        timeout: 40000,
      })
      .toContain(lastLabel.trim());
    await expect(gallery).toHaveAttribute("data-transitioning", "false");
    await gallery.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `temp/product-gallery/${slug}-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    const firstLabel = await page.getByRole("radio").nth(0).innerText();
    await page.getByRole("radio").nth(0).click();
    await expect
      .poll(() => gallery.locator('img:not([aria-hidden="true"])').getAttribute("alt"), {
        timeout: 40000,
      })
      .toContain(firstLabel.trim());
    await expect(gallery).toHaveAttribute("data-transitioning", "false");
    await expect(gallery.locator("img")).toHaveCount(1);
  });
}
