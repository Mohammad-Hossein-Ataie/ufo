import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 20000 });

for (const width of [1440, 1280, 1024, 430, 390, 375, 320]) {
  test(`product deck motion at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const deck = page.locator(".homepage-product-deck");
    const slot = deck.locator(".homepage-product-slot").first();
    await slot.scrollIntoViewIfNeeded();
    await slot.locator("[data-slide-index]").first().focus();
    await expect(deck.getByRole("button", { name: /نمایش خودکار/ })).toHaveCount(0);
    await expect(slot).toHaveAttribute("data-phase", "idle");
    const initial = await slot.getAttribute("data-active-index");
    const target = initial === "1" ? 2 : 1;
    const samples = await slot.evaluate(async (element, target) => {
      const frames: {
        height: number;
        overflow: boolean;
        transform: string;
        phase: string | undefined;
        decoded: boolean;
        count: number;
      }[] = [];
      const before = element.getBoundingClientRect().height;
      element.querySelector<HTMLButtonElement>(`[data-slide-index="${target}"]`)!.click();
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          const slide = element.querySelector<HTMLElement>(".homepage-product-slide")!;
          const img = slide.querySelector<HTMLImageElement>("img")!;
          frames.push({
            height: element.getBoundingClientRect().height,
            overflow: document.documentElement.scrollWidth > innerWidth,
            transform: getComputedStyle(slide).transform,
            phase: slide.dataset.phase,
            decoded: img.complete && img.naturalWidth > 0,
            count: element.querySelectorAll("article").length,
          });
          const finished =
            element.getAttribute("data-active-index") === String(target) &&
            slide.dataset.phase === "idle";
          if (!finished && performance.now() - start < 20000) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      return { before, frames };
    }, target);
    await expect(slot).toHaveAttribute("data-active-index", String(target));
    for (const card of await deck.locator(".homepage-product-slot").all()) {
      await expect(card).toHaveAttribute("data-active-index", String(target));
    }
    await expect(slot).toHaveAttribute("data-phase", "idle");
    expect(samples.frames.some((f) => f.transform.startsWith("matrix3d"))).toBe(true);
    expect(samples.frames.some((f) => f.phase === "out")).toBe(true);
    expect(samples.frames.some((f) => f.phase === "in")).toBe(true);
    expect(
      samples.frames.every(
        (f) => Math.abs(f.height - samples.before) < 1 && !f.overflow && f.count === 1,
      ),
    ).toBe(true);
    expect(samples.frames.filter((f) => f.phase === "in").every((f) => f.decoded)).toBe(true);
    expect(
      await deck.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length),
    ).toBe(width >= 1024 ? 4 : 2);
    await expect(slot.locator(".homepage-product-perspective")).toHaveCSS("perspective", "1100px");
    expect(
      await slot
        .locator(".homepage-product-perspective")
        .evaluate((el) => getComputedStyle(el).getPropertyValue("--carousel-rotation").trim()),
    ).toBe(width >= 1024 ? "8deg" : "4deg");
    const indicator = slot.locator(`[data-slide-index="${target}"]`);
    await indicator.focus();
    await indicator.press("ArrowRight");
    await expect(slot).toHaveAttribute("data-active-index", String(target - 1));
    await expect(slot).toHaveAttribute("data-motion-direction", "-1");
    await expect(slot.locator(`[data-slide-index="${target - 1}"]`)).toBeFocused();
    await expect(slot).toHaveAttribute("data-phase", "idle");
    await expect(slot.locator(".homepage-product-slide")).toHaveCSS("transform", "none");
    await page.screenshot({ path: `temp/product-deck/${width}.png` });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await slot.locator('[data-slide-index="2"]').click();
    await expect(slot).toHaveAttribute("data-active-index", "2");
    await expect(slot).toHaveAttribute("data-phase", "idle");
    await expect(slot.locator(".homepage-product-slide")).toHaveCSS("animation-name", "none");
  });
}
