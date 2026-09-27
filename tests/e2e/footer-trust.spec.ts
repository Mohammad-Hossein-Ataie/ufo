import { expect, test, type Page } from "@playwright/test";

async function mockCheckout(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("ufo-age-verified", "true");
    localStorage.setItem(
      "ufo-retail-session",
      JSON.stringify({
        channel: "retail",
        token: "ui-test-only",
        customer: {
          id: "test-customer",
          firstName: "کاربر",
          lastName: "آزمایشی",
          mobileNumber: "09123456789",
        },
      }),
    );
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json =
      path === "/api/cart"
        ? {
            items: [
              { id: "line-1", productName: "محصول آزمایشی", quantity: 1, totalPrice: 10000000 },
            ],
            summary: { subtotalRial: 10000000, discountRial: 0 },
          }
        : path === "/api/customer/addresses"
          ? {
              addresses: [
                {
                  id: "address-1",
                  label: "خانه",
                  province: "تهران",
                  city: "تهران",
                  line1: "نشانی آزمایشی",
                  receiverName: "کاربر آزمایشی",
                  receiverPhone: "09123456789",
                  isDefault: true,
                },
              ],
            }
          : path === "/api/shipping/methods"
            ? {
                methods: [
                  {
                    scope: "nationwide",
                    code: "tipax",
                    titleFa: "تیپاکس",
                    descriptionFa: "ارسال آزمایشی",
                    costRial: 0,
                    etaFa: "۳ روز",
                    available: true,
                  },
                ],
              }
            : path === "/api/orders"
              ? { order: { id: "zibal-order-mobile" } }
              : path === "/api/payments/zibal/zibal-order-mobile"
                ? { error: "شناسه پذیرنده درگاه زیبال معتبر نیست." }
                : {};
    await route.fulfill({
      status: path === "/api/payments/zibal/zibal-order-mobile" ? 502 : 200,
      json,
    });
  });
  // Mock only external image bytes: all trust links, markup, CSS and sizing remain ours.
  for (const url of ["https://trustseal.enamad.ir/**", "https://zibal.ir/trust/assets/2.png"]) {
    await page.route(url, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200"><rect width="150" height="200" fill="white"/><text x="10" y="100" fill="black">External fixture</text></svg>',
      }),
    );
  }
}

for (const width of [440, 360, 1440]) {
  test(`footer trust badges stay contained and fixed controls remain above them at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 956 });
    await mockCheckout(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "خلاصه سفارش", exact: true })).toBeVisible();
    const trust = page.getByRole("region", { name: "اعتماد و اعتبار", exact: true });
    const enamad = trust.getByRole("link", { name: "اعتبارسنجی نماد اعتماد الکترونیکی یوفوپاف" });
    const zibal = trust.getByRole("link", { name: "اعتبارسنجی درگاه پرداخت زیبال یوفوپاف" });
    await expect(zibal).toHaveAttribute("href", "https://gateway.zibal.ir/trustMe/ufopuff.com");
    await expect(enamad).toHaveAttribute(
      "href",
      "https://trustseal.enamad.ir/?id=7628595&Code=9H4ALixgxYdhUO3XrI7dMMNT5ULunNIC",
    );
    await expect(zibal.locator("img")).toHaveAttribute(
      "src",
      "https://zibal.ir/trust/assets/2.png",
    );
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
    await expect(trust).toBeVisible();
    for (const badge of [enamad, zibal]) {
      await expect(badge.locator("img")).toHaveCSS("position", "static");
      await expect(badge.locator("img")).toHaveJSProperty("complete", true);
    }
    // Wait for the actual entry animation without depending on a timer.
    await page.locator("footer .motion-reveal").evaluate(async (el) => {
      await Promise.all(el.getAnimations().map((animation) => animation.finished));
    });
    const geometry = await trust.evaluate((section) => {
      const bounds = (element: Element) => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      return {
        trust: bounds(section),
        footer: bounds(section.closest("footer")!),
        images: [...section.querySelectorAll("img")].map(bounds),
        cta: bounds(document.querySelector('[data-testid="checkout-mobile-cta"]')!),
        nav: bounds(document.querySelector(".mobile-bottom-nav")!),
        copyright: bounds(document.querySelector("footer > div:last-child")!),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry.overflow).toBe(false);
    for (const image of geometry.images) {
      expect(image.left).toBeGreaterThanOrEqual(geometry.trust.left);
      expect(image.right).toBeLessThanOrEqual(geometry.trust.right);
      expect(image.top).toBeGreaterThanOrEqual(geometry.trust.top);
      expect(image.bottom).toBeLessThanOrEqual(geometry.trust.bottom);
      expect(image.bottom).toBeLessThanOrEqual(geometry.footer.bottom);
      if (width < 1024) expect(image.bottom).toBeLessThanOrEqual(geometry.cta.top);
    }
    if (width < 1024) {
      expect(geometry.cta.bottom).toBeLessThanOrEqual(geometry.nav.top + 0.5);
      expect(geometry.copyright.bottom).toBeLessThanOrEqual(geometry.cta.top);
      // Put the seal behind the fixed CTA and prove the CTA wins hit testing.
      await enamad.locator("img").evaluate((img) => {
        const cta = document
          .querySelector('[data-testid="checkout-mobile-cta"]')!
          .getBoundingClientRect();
        const r = img.getBoundingClientRect();
        window.scrollBy({
          top: r.top + r.height / 2 - (cta.top + cta.height / 2),
          behavior: "instant",
        });
      });
      const hitTest = await enamad.locator("img").evaluate((img) => {
        const r = img.getBoundingClientRect();
        const cta = document
          .querySelector('[data-testid="checkout-mobile-cta"]')!
          .getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          badgeTop: r.top,
          badgeBottom: r.bottom,
          ctaTop: cta.top,
          ctaBottom: cta.bottom,
          topElement: top?.outerHTML.slice(0, 300),
          ctaWins: Boolean(top?.closest('[data-testid="checkout-mobile-cta"]')),
        };
      });
      expect(hitTest).toMatchObject({ ctaWins: true });
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
    }
    await page.screenshot({ path: `temp/footer-trust-${width}.png` });
  });
}

test("portaled mobile checkout button submits its form and preserves a rejected order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 440, height: 956 });
  await mockCheckout(page);
  await page.goto("/checkout");
  const submit = page
    .getByTestId("checkout-mobile-cta")
    .getByRole("button", { name: "ثبت و پرداخت", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(
    page.getByText("سفارش ثبت شد؛ اتصال به درگاه انجام نشد", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "مشاهده سفارش و تلاش دوباره", exact: true }),
  ).toHaveAttribute("href", "/orders/zibal-order-mobile");
  await expect(submit).toBeDisabled();
});
