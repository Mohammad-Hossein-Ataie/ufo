import { expect, test } from "@playwright/test";

test("checkout shows gateway progress and preserves a saved order when Zibal rejects startup", async ({
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

  let releaseGateway!: () => void;
  const gatewayGate = new Promise<void>((resolve) => {
    releaseGateway = resolve;
  });

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/cart") {
      await route.fulfill({
        json: {
          items: [
            { id: "line-1", productName: "محصول آزمایشی", quantity: 1, totalPrice: 10000000 },
          ],
          summary: { subtotalRial: 10000000, discountRial: 0 },
        },
      });
      return;
    }
    if (url.pathname === "/api/customer/addresses") {
      await route.fulfill({
        json: {
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
        },
      });
      return;
    }
    if (url.pathname === "/api/shipping/methods") {
      await route.fulfill({
        json: {
          methods: [
            {
              scope: "nationwide",
              code: "tipax",
              titleFa: "تیپاکس",
              descriptionFa: "ارسال آزمایشی",
              costRial: 0,
              etaFa: "۱ تا ۳ روز",
              available: true,
            },
          ],
        },
      });
      return;
    }
    if (url.pathname === "/api/orders") {
      await route.fulfill({ status: 201, json: { order: { id: "zibal-order-1" } } });
      return;
    }
    if (url.pathname === "/api/payments/zibal/zibal-order-1") {
      await gatewayGate;
      await route.fulfill({
        status: 502,
        json: { error: "شناسه پذیرنده درگاه زیبال معتبر نیست." },
      });
      return;
    }
    await route.fulfill({ json: {} });
  });

  await page.goto("/checkout");
  const submit = page.getByRole("button", {
    name: "ثبت سفارش و پرداخت آنلاین",
    exact: true,
  });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(
    page.getByRole("button", { name: "در حال اتصال به درگاه...", exact: true }),
  ).toBeVisible();

  releaseGateway();
  await expect(
    page.getByText("سفارش ثبت شد؛ اتصال به درگاه انجام نشد", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("شناسه پذیرنده درگاه زیبال معتبر نیست.", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "مشاهده سفارش و تلاش دوباره", exact: true }),
  ).toHaveAttribute("href", "/orders/zibal-order-1");
  await expect(submit).toBeDisabled();
});
