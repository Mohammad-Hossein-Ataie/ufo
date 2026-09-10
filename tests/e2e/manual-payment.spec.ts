import { test, expect } from "@playwright/test";

test("cart: skeleton waits for data and failed loading can be retried", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ufo-age-verified", "true");
    localStorage.setItem(
      "ufo-retail-session",
      JSON.stringify({
        channel: "retail",
        token: "test-only",
        customer: {
          id: "test",
          firstName: "کاربر",
          lastName: "آزمایشی",
          mobileNumber: "09123456789",
        },
      }),
    );
  });
  let release!: () => void;
  let fail = true;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/cart") {
      await gate;
      return route.fulfill({
        status: fail ? 503 : 200,
        json: fail
          ? { error: "آزمایشی" }
          : { items: [], summary: { subtotalRial: 0, discountRial: 0, totalRial: 0 } },
      });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto("/cart");
  await expect(page.getByTestId("loading-cart")).toHaveCount(1);
  await expect(page.getByTestId("loading-cart")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "سبد خرید شما خالی است", exact: true }),
  ).toHaveCount(0);
  await page.getByTestId("loading-cart").screenshot({ path: "temp/cart-skeleton-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByTestId("loading-cart").screenshot({ path: "temp/cart-skeleton-mobile.png" });
  expect(
    await page
      .getByTestId("loading-cart")
      .locator(".motion-safe\\:animate-pulse")
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  release();
  await expect(page.getByTestId("loading-cart")).toHaveCount(0);
  await expect(
    page.getByText("دریافت سبد خرید انجام نشد. دوباره تلاش کنید.", { exact: true }),
  ).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "سبد خرید شما خالی است", exact: true }),
  ).toBeVisible();
});

for (const channel of ["retail", "wholesale"] as const) {
  test(`${channel}: shipping selection, coordinates and manual payment`, async ({
    page,
    context,
  }) => {
    const base = channel === "wholesale" ? "/b2b" : "";
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" && /unique.*key|same key|hydration/i.test(m.text()))
        errors.push(m.text());
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(
      ({ channel }) => {
        localStorage.setItem(
          channel === "retail" ? "ufo-retail-session" : "ufo-b2b-session",
          JSON.stringify({
            channel,
            token: "ui-test-only",
            customer: {
              id: "test-customer",
              firstName: "کاربر",
              lastName: "آزمایشی",
              mobileNumber: "09123456789",
              companyName: "فروشگاه تست",
            },
          }),
        );
        localStorage.setItem("ufo-age-verified", "true");
      },
      { channel },
    );
    let submitted: Record<string, unknown> = {};
    let activeAccounts = false;
    let receiptBody = "";
    let releaseCheckout!: () => void;
    const checkoutGate = new Promise<void>((resolve) => {
      releaseCheckout = resolve;
    });
    let releaseOrder!: () => void;
    const orderGate = new Promise<void>((resolve) => {
      releaseOrder = resolve;
    });
    const order = {
      id: "ui-test-order",
      orderNumber: "TEST-001",
      channel,
      status: "awaiting_receipt",
      paymentStatus: "awaiting_receipt",
      items: ["گزینه اول", "گزینه دوم"].map((variantName) => ({
        productName: "محصول با گزینه متفاوت",
        variantName,
        sku: "UFO-EXTRA-0017",
        image: "",
        selectedAttributes: [],
        pricingMode: channel,
        unitPriceRial: 5000000,
        quantity: 1,
        discountRial: 0,
        totalRial: 5000000,
      })),
      subtotalRial: 10000000,
      totalRial: 10000000,
      discountRial: 0,
      shippingRial: 0,
      shippingTitleFa: "تحویل حضوری",
      customer: { fullName: "کاربر آزمایشی", phone: "09123456789" },
      shippingAddress: {
        province: "تهران",
        city: "تهران",
        line1: "نشانی تست",
        receiverName: "کاربر آزمایشی",
        receiverPhone: "09123456789",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [],
      receipts: [],
    };
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/cart" || url.pathname === "/api/customer/addresses")
        await checkoutGate;
      if (url.pathname.endsWith("/ui-test-order")) await orderGate;
      if (url.pathname === "/api/shipping/methods") {
        await route.continue();
        return;
      }
      let payload: unknown = {};
      if (url.pathname === "/api/cart")
        payload = {
          items: [
            { id: "line-1", productName: "محصول آزمایشی", quantity: 1, totalPrice: 10000000 },
          ],
          summary: { subtotalRial: 10000000, discountRial: 0 },
        };
      else if (url.pathname === "/api/customer/addresses") {
        if (route.request().method() === "POST")
          payload = { address: { ...route.request().postDataJSON(), id: "address-1" } };
        else payload = { addresses: [] };
      } else if (url.pathname === "/api/orders" || url.pathname === "/api/b2b/orders") {
        if (route.request().method() === "POST") submitted = route.request().postDataJSON();
        payload = { order, orders: [order] };
      } else if (url.pathname.endsWith("/ui-test-order/receipt")) {
        receiptBody = route.request().postData() ?? "";
        order.status = "payment_under_review";
        order.paymentStatus = "pending_review";
        payload = { order };
      } else if (url.pathname.endsWith("/ui-test-order"))
        payload = {
          order: {
            ...order,
            ...(order.status === "confirmed"
              ? { estimatedDispatchAt: "2026-10-01T10:00:00.000Z" }
              : {}),
          },
        };
      else if (url.pathname === "/api/payment-accounts")
        payload = {
          accounts: activeAccounts
            ? ["بلوبانک", "بانک ملت", "بانک سامان"].map((bankName, index) => ({
                id: `test-bank-${index}`,
                bankName,
                holderName: "امیرحسین محمودی",
                cardNumber: `000000000000000${index + 1}`,
                iban: `IR00000000000000000000000${index + 1}`,
                enabled: true,
              }))
            : [],
          demo: !activeAccounts,
        };
      else if (url.pathname === "/api/locations/search")
        payload = {
          results: [
            {
              id: "azadi",
              label: "میدان آزادی، تهران، ایران",
              latitude: 35.6997,
              longitude: 51.338,
            },
          ],
        };
      await route.fulfill({ json: payload });
    });
    await page.goto(`${base}/checkout`);
    await expect(page.getByTestId("loading-checkout")).toHaveCount(1);
    await expect(page.getByTestId("loading-checkout")).toBeVisible();
    await expect(page.getByText("برای پرداخت وارد شوید", { exact: true })).toHaveCount(0);
    await page
      .getByTestId("loading-checkout")
      .screenshot({ path: `temp/checkout-${channel}-skeleton.png` });
    releaseCheckout();
    await expect(page.getByTestId("loading-checkout")).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(3);
    const radios = page.getByRole("radio");
    await expect(radios.nth(0)).toBeChecked();
    await page.locator("label").filter({ hasText: "پیک تهران" }).click();
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.nth(0)).not.toBeChecked();
    await page.locator("label").filter({ hasText: "تحویل حضوری" }).click();
    await expect(radios.nth(2)).toBeChecked();
    await expect(radios.nth(1)).not.toBeChecked();
    await expect(page.getByRole("heading", { name: "دریافت از مغازه", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "نشانی کامل" })).toHaveCount(0);
    await page.locator("label").filter({ hasText: "تیپاکس" }).click();
    await page
      .getByRole("textbox", { name: "جست‌وجوی مکان", exact: true })
      .fill("تهران میدان آزادی");
    await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
    await page.getByRole("button", { name: "میدان آزادی، تهران، ایران", exact: true }).click();
    await expect(page.getByRole("spinbutton", { name: "عرض جغرافیایی" })).toHaveValue("35.6997");
    await page.getByRole("textbox", { name: "نشانی کامل" }).fill("خیابان آزمایشی، پلاک ۱");
    await page.getByRole("button", { name: "ذخیره و انتخاب آدرس" }).click();
    await expect(page.getByRole("button", { name: "ذخیره و انتخاب آدرس" })).toHaveCount(0);
    await page.locator("label").filter({ hasText: "تحویل حضوری" }).click();
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: `temp/payment-${channel}-checkout.png`, fullPage: true });
    await page.getByRole("button", { name: "تأیید و ثبت سفارش", exact: true }).click();
    await page.waitForURL(`**${base}/orders/ui-test-order`);
    await expect(page.getByTestId("loading-order")).toHaveCount(1);
    await expect(page.getByTestId("loading-order")).toBeVisible();
    await page
      .getByTestId("loading-order")
      .screenshot({ path: `temp/order-${channel}-skeleton.png` });
    releaseOrder();
    await expect(page.getByTestId("loading-order")).toHaveCount(0);
    await expect(page.getByText("محصول با گزینه متفاوت", { exact: true })).toHaveCount(2);
    await expect(page.getByText("گزینه اول · تعداد ۱", { exact: true })).toBeVisible();
    await expect(page.getByText("گزینه دوم · تعداد ۱", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "خرید مجدد", exact: true })).toHaveCount(0);
    expect(submitted.shippingMethod).toBe("pickup");
    expect(submitted.location).toBeUndefined();
    expect(submitted.address).toBe("");
    await expect(
      page.getByText("حساب‌ها آزمایشی و غیرقابل واریز هستند.", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "کپی شماره کارت", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "کپی شماره کارت", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "ارسال رسید برای بررسی" })).toBeDisabled();
    await page.getByRole("button", { name: "کپی مبلغ ریال", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("10000000");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("heading", { name: "پرداخت کارت به کارت" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `temp/payment-${channel}-mobile.png` });
    activeAccounts = true;
    await page.reload();
    const bankAccounts = page.getByTestId("payment-bank-accounts");
    const bankChoices = bankAccounts.getByRole("group", { name: "انتخاب حساب بانکی" });
    await expect(bankChoices.getByRole("button")).toHaveCount(3);
    await expect
      .poll(() =>
        bankChoices
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    for (const [index, bankName] of ["بلوبانک", "بانک ملت", "بانک سامان"].entries()) {
      const choice = bankChoices.getByRole("button").filter({ hasText: bankName });
      await choice.click();
      await expect(choice).toHaveAttribute("aria-pressed", "true");
      await expect(bankChoices.locator('[aria-pressed="true"]')).toHaveCount(1);
      await page.getByRole("button", { name: "کپی شماره کارت", exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        `000000000000000${index + 1}`,
      );
      await page.getByRole("button", { name: "کپی شبا", exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        `IR00000000000000000000000${index + 1}`,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const artwork = bankAccounts.locator("[data-bank-artwork]");
      const box = await artwork.boundingBox();
      expect(index === 0 ? box!.height > box!.width : box!.width > box!.height).toBe(true);
      await bankAccounts.screenshot({ path: `temp/bank-${channel}-${index}-mobile.png` });
      await page.setViewportSize({ width: 320, height: 760 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await bankAccounts
          .locator("article")
          .evaluate((element) =>
            [...element.querySelectorAll("p")].every((p) => p.scrollWidth <= p.clientWidth),
          ),
      ).toBe(true);
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await bankChoices.getByRole("button").filter({ hasText: "بلوبانک" }).click();
    await expect
      .poll(() =>
        bankChoices
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await bankAccounts.screenshot({ path: `temp/bank-${channel}-desktop.png` });
    const upload = page.getByLabel("تصویر رسید", { exact: true });
    const testImage = {
      name: "رسید-آزمایشی.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF1kAAAAASUVORK5CYII=",
        "base64",
      ),
    };
    await expect(page.getByText("انتخاب تصویر رسید", { exact: true })).toBeVisible();
    await upload.setInputFiles(testImage);
    await expect(page.getByText(testImage.name, { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "پیش‌نمایش رسید انتخاب‌شده" })).toBeVisible();
    await page.getByRole("button", { name: "حذف تصویر انتخاب‌شده" }).click();
    await expect(upload).toHaveValue("");
    await upload.setInputFiles(testImage);
    await expect(page.getByRole("img", { name: "پیش‌نمایش رسید انتخاب‌شده" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await upload.locator("..").screenshot({ path: `temp/upload-${channel}-mobile.png` });
    await page.getByRole("button", { name: "حذف تصویر انتخاب‌شده" }).click();
    await page
      .getByRole("textbox", { name: "متن رسید یا شماره پیگیری" })
      .fill("رسید آزمایشی؛ پیگیری TEST-123");
    await page.getByRole("button", { name: "ارسال رسید برای بررسی" }).click();
    await expect(
      page.getByText("رسید شما دریافت شد و در انتظار بررسی ادمین است.", { exact: false }),
    ).toBeVisible();
    expect(receiptBody).toContain("TEST-123");
    await expect(page.getByRole("button", { name: "خرید مجدد", exact: true })).toHaveCount(0);
    order.status = "confirmed";
    order.paymentStatus = "approved";
    await page.reload();
    await expect(page.getByText("زمان تقریبی ارسال:", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "خرید مجدد", exact: true })).toHaveCount(0);
    order.status = "delivered";
    await page.reload();
    await expect(page.getByRole("button", { name: "خرید مجدد", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
