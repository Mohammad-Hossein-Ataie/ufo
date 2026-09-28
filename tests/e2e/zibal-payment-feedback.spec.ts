import { expect, test } from "@playwright/test";

test("checkout enables Zibal while card-to-card remains selectable", async ({
  page,
}) => {
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

  let gatewayRequests = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/payments/zibal/")) gatewayRequests += 1;
    if (url.pathname === "/api/cart") {
      await route.fulfill({
        json: {
          items: [{ id: "line-1", productName: "محصول آزمایشی", quantity: 1, totalPrice: 10000000 }],
          summary: { subtotalRial: 10000000, discountRial: 0 },
        },
      });
      return;
    }
    if (url.pathname === "/api/customer/addresses") {
      await route.fulfill({
        json: {
          addresses: [{
            id: "address-1",
            label: "خانه",
            province: "تهران",
            city: "تهران",
            line1: "نشانی آزمایشی",
            receiverName: "کاربر آزمایشی",
            receiverPhone: "09123456789",
            isDefault: true,
          }],
        },
      });
      return;
    }
    if (url.pathname === "/api/shipping/methods") {
      await route.fulfill({
        json: {
          methods: [{
            scope: "nationwide",
            code: "tipax",
            titleFa: "تیپاکس",
            descriptionFa: "ارسال آزمایشی",
            costRial: 0,
            etaFa: "۱ تا ۳ روز",
            available: true,
          }],
        },
      });
      return;
    }
    if (url.pathname === "/api/orders") {
      expect(route.request().postDataJSON().paymentMethod).toBe("card_to_card");
      await route.fulfill({ status: 201, json: { order: { id: "manual-order-1" } } });
      return;
    }
    await route.fulfill({ json: {} });
  });

  await page.goto("/checkout");
  const zibal = page.locator('input[name="paymentMethod"][value="zibal"]');
  const cardToCard = page.locator('input[name="paymentMethod"][value="card_to_card"]');
  await expect(zibal).toBeEnabled();
  await expect(zibal).toBeChecked();
  await expect(zibal.locator("xpath=..")).not.toContainText("به‌زودی");
  await expect(cardToCard).toBeEnabled();
  await cardToCard.check();
  await expect(cardToCard).toBeChecked();
  await expect(page.getByRole("button", { name: "تأیید و ثبت سفارش", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "تأیید و ثبت سفارش", exact: true }).click();
  await expect(page).toHaveURL(/\/orders\/manual-order-1$/);
  expect(gatewayRequests).toBe(0);
});
