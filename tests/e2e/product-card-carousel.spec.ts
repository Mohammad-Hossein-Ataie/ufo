import { expect as baseExpect, test } from "@playwright/test";

// Preparation may try an 8s protected derivative and then its fallback.
const expect = baseExpect.configure({ timeout: 20000 });
test.setTimeout(90000);

test("all new-product slots rotate together without play/pause controls", async ({ page }) => {
  await page.goto("/");
  const deck = page.locator(".homepage-product-deck");
  await deck.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(deck.getByRole("button", { name: /نمایش خودکار/ })).toHaveCount(0);
  await expect
    .poll(
      () =>
        deck
          .locator(".homepage-product-slot")
          .evaluateAll((slots) => slots.map((slot) => slot.getAttribute("data-active-index"))),
      { timeout: 25000 },
    )
    .toEqual(["1", "1", "1", "1"]);
  await deck.locator("[data-slide-index='1']").first().focus();
  await expect(deck).toHaveAttribute("data-phase", "idle");
  await page.waitForTimeout(8000);
  await expect
    .poll(() =>
      deck
        .locator(".homepage-product-slot")
        .evaluateAll((slots) => slots.map((slot) => slot.getAttribute("data-active-index"))),
    )
    .toEqual(["1", "1", "1", "1"]);
});

test("automatic and manual rotations keep the guest cart, price, image and details synchronized", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const slot = page.locator(".homepage-product-slot").first();
  await slot.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(slot).toHaveAttribute("data-active-index", "1", { timeout: 10000 });
  await slot.hover();
  const entries: { name: string; price: string; href: string }[] = [];
  for (const index of [1, 2]) {
    if (index === 2) {
      await slot.locator('[data-slide-index="2"]').click();
      await expect(slot).toHaveAttribute("data-active-index", "2");
    }
    const name = await slot.locator("h3").innerText();
    const price = await slot.locator(".tabular-nums").innerText();
    const href = await slot.locator("article a").first().getAttribute("href");
    await expect(slot.locator("article img")).toHaveAttribute("alt", name);
    await expect
      .poll(() =>
        slot
          .locator("article img")
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await slot.locator(".add-cart-button").click();
    entries.push({ name, price, href: href! });
  }
  const cart = await page.evaluate(
    () => JSON.parse(localStorage.getItem("ufo-retail-cart") ?? "[]") as { variantId: string }[],
  );
  expect(cart).toHaveLength(2);
  expect(new Set(cart.map((line) => line.variantId)).size).toBe(2);
  await page.goto("/cart");
  for (const entry of entries) {
    const line = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: entry.name, exact: true }) });
    await expect(line).toBeVisible();
    await expect(line).toContainText(entry.price);
    await page.goto(entry.href);
    await expect(page.locator("h1")).toHaveText(entry.name);
    await page.goto("/cart");
  }
});

test("hover pauses for a long interaction, RTL keyboard and focused controls select safely", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const slot = page.locator(".homepage-product-slot").first();
  await slot.hover();
  const initial = await slot.getAttribute("data-active-index");
  await page.waitForTimeout(8100);
  await expect(slot).toHaveAttribute("data-active-index", initial!);
  await slot.locator('[data-slide-index="0"]').focus();
  await page.mouse.move(0, 0);
  await slot.locator('[data-slide-index="0"]').press("ArrowLeft");
  await expect(slot).toHaveAttribute("data-active-index", "1");
  await expect(slot.locator('[data-slide-index="1"]')).toBeFocused();
  await page.waitForTimeout(7700);
  await expect(slot).toHaveAttribute("data-active-index", "1");
  await slot.locator('[data-slide-index="1"]').press("ArrowRight");
  await expect(slot).toHaveAttribute("data-active-index", "0");
  await slot
    .locator('[data-slide-index="0"]')
    .evaluate((button: HTMLButtonElement) => button.blur());
  await expect(slot).toHaveAttribute("data-active-index", "1", { timeout: 8000 });
});

test("RTL touch swipes ignore tiny and vertical gestures, and rapid indicators keep the last selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const slot = page.locator(".homepage-product-slot").first();
  await slot.scrollIntoViewIfNeeded();
  const media = slot.locator('[aria-roledescription="اسلاید محصول"]');
  const gesture = async (dx: number, dy: number) => {
    await media.dispatchEvent("pointerdown", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
    });
    await media.dispatchEvent("pointermove", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 100 + dx,
      clientY: 200 + dy,
    });
    await media.dispatchEvent("pointerup", {
      pointerId: 2,
      pointerType: "touch",
      clientX: 100 + dx,
      clientY: 200 + dy,
    });
  };
  await gesture(12, 0);
  await expect(slot).toHaveAttribute("data-active-index", "0");
  await gesture(70, 120);
  await expect(slot).toHaveAttribute("data-active-index", "0");
  await gesture(65, 4);
  await expect(slot).toHaveAttribute("data-active-index", "1");
  await gesture(-65, 4);
  await expect(slot).toHaveAttribute("data-active-index", "0");
  await slot.locator('[data-slide-index="1"]').dispatchEvent("click");
  await slot.locator('[data-slide-index="2"]').dispatchEvent("click");
  await expect(slot).toHaveAttribute("data-active-index", "2");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await slot.locator('[data-slide-index="0"]').click();
  await expect(slot).toHaveAttribute("data-active-index", "0");
  await expect(slot).toHaveAttribute("data-phase", "idle");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("native mobile touch preserves vertical scrolling and suppresses swipe clicks", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto("http://localhost:3000/");
    const slot = page.locator(".homepage-product-slot").first();
    await slot.scrollIntoViewIfNeeded();
    const image = slot.locator("article img");
    await image.evaluate((img: HTMLImageElement) => img.decode());
    const box = await image.boundingBox();
    const cdp = await context.newCDPSession(page);
    const x = box!.x + box!.width / 2;
    const y = Math.max(130, box!.y + box!.height / 2);
    const touch = async (dx: number, dy: number) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let step = 1; step <= 6; step++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + (dx * step) / 6, y: y + (dy * step) / 6 }],
        });
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    await touch(65, 2);
    await expect(slot).toHaveAttribute("data-active-index", "1");
    await expect(page).toHaveURL("http://localhost:3000/");
    expect(await page.evaluate(() => localStorage.getItem("ufo-retail-cart"))).toBeNull();
    const beforeScroll = await page.evaluate(() => scrollY);
    await touch(2, -100);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll);
    await expect(slot).toHaveAttribute("data-active-index", "1");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await slot.scrollIntoViewIfNeeded();
    await image.evaluate((img: HTMLImageElement) => img.decode());
    await slot.screenshot({ path: "tmp/storefront-review/carousel-mobile.png" });
    await cdp.detach();
  } finally {
    await context.close();
  }
});
