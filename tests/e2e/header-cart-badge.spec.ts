import { expect, test, type Locator } from "@playwright/test";

async function expectBadgeInside(slot: Locator, badge: Locator) {
  await expect(badge).toBeVisible();
  const controlBox = await slot.boundingBox();
  const badgeBox = await badge.boundingBox();
  expect(controlBox).not.toBeNull();
  expect(badgeBox).not.toBeNull();
  if (!controlBox || !badgeBox) return;
  expect(badgeBox.x).toBeGreaterThanOrEqual(controlBox.x);
  expect(badgeBox.y).toBeGreaterThanOrEqual(controlBox.y);
  expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(controlBox.x + controlBox.width);
  expect(badgeBox.y + badgeBox.height).toBeLessThanOrEqual(controlBox.y + controlBox.height);
  const iconBox = await slot.locator("svg").first().boundingBox();
  expect(iconBox).not.toBeNull();
  if (iconBox) expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(iconBox.x);
}

async function expectBadgeAtTopRight(control: Locator, badge: Locator) {
  await expect(badge).toBeVisible();
  await badge.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  const controlBox = await control.boundingBox();
  const badgeBox = await badge.boundingBox();
  expect(controlBox).not.toBeNull();
  expect(badgeBox).not.toBeNull();
  if (!controlBox || !badgeBox) return;
  expect(Math.abs(badgeBox.x + badgeBox.width - (controlBox.x + controlBox.width))).toBeLessThanOrEqual(
    1,
  );
  expect(Math.abs(badgeBox.y - controlBox.y)).toBeLessThanOrEqual(1);
}

async function expectSquareCartControl(slot: Locator, control: Locator) {
  const slotBox = await slot.boundingBox();
  const controlBox = await control.boundingBox();
  expect(slotBox).not.toBeNull();
  expect(controlBox).not.toBeNull();
  if (!slotBox || !controlBox) return;
  expect(slotBox.width).toBeGreaterThan(controlBox.width);
  expect(controlBox.width).toBe(44);
  expect(controlBox.height).toBe(44);
}

test("retail cart count sits on the desktop cart button's top-right corner", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("ufo-retail-cart", JSON.stringify([{ channel: "retail", quantity: 3 }]));
  });
  await page.goto("/");
  const slot = page.locator(".retail-header .header-cart-slot");
  await expectSquareCartControl(slot, slot.locator(".header-cart"));
  await expectBadgeAtTopRight(slot.locator(".header-cart"), slot.locator(".cart-count-pop"));
});

test("retail cart count sits on the mobile cart button's top-right corner", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("ufo-retail-cart", JSON.stringify([{ channel: "retail", quantity: 3 }]));
  });
  await page.goto("/");
  const slot = page.locator(".retail-header .header-cart-slot");
  await expectSquareCartControl(slot, slot.locator(".header-cart"));
  await expectBadgeAtTopRight(slot.locator(".header-cart"), slot.locator(".cart-count-pop"));
});

test("wholesale cart count stays in the header slot, clear of the icon", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "ufo-b2b-cart",
      JSON.stringify([{ channel: "wholesale", cartonCount: 3 }]),
    );
  });
  await page.goto("/b2b");
  const slot = page.locator(".b2b-header .header-cart-slot");
  await expectSquareCartControl(slot, slot.locator('a[aria-label*="سبد"]'));
  await expectBadgeInside(slot, slot.locator("a span"));
});

test("large cart counts stay compact in both headers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "ufo-retail-cart",
      JSON.stringify([{ channel: "retail", quantity: 1234 }]),
    );
    localStorage.setItem(
      "ufo-b2b-cart",
      JSON.stringify([{ channel: "wholesale", cartonCount: 1234 }]),
    );
  });
  await page.goto("/");
  const retailControl = page.locator(".retail-header .header-cart-slot");
  const retailBadge = retailControl.locator(".cart-count-pop");
  await expect(retailBadge).toHaveText("۹۹+");
  await expectBadgeAtTopRight(retailControl.locator(".header-cart"), retailBadge);

  await page.goto("/b2b");
  const wholesaleControl = page.locator(".b2b-header .header-cart-slot");
  const wholesaleBadge = wholesaleControl.locator("a span");
  await expect(wholesaleBadge).toHaveText("۹۹+");
  await expectBadgeInside(wholesaleControl, wholesaleBadge);
});

test("empty retail cart keeps the original square button without a badge", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const slot = page.locator(".retail-header .header-cart-slot");
    await expectSquareCartControl(slot, slot.locator(".header-cart"));
    await expect(slot.locator(".cart-count-pop")).toHaveCount(0);
  }
});

test("empty wholesale cart keeps the original square link without a badge", async ({ page }) => {
  await page.goto("/b2b");
  const slot = page.locator(".b2b-header .header-cart-slot");
  await expectSquareCartControl(slot, slot.locator('a[aria-label*="سبد"]'));
  await expect(slot.locator("a span")).toHaveCount(0);
});
