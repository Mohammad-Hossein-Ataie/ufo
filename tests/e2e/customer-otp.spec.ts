import { expect, test } from "@playwright/test";

const base = process.env.UFO_E2E_BASE_URL ?? "http://localhost:3000";

for (const channel of ["retail", "wholesale"] as const) {
  const prefix = channel === "wholesale" ? "/b2b" : "";
  const customer = {
    id: "test-customer",
    mobileNumber: "09123456789",
    firstName: "Ali",
    lastName: "Test",
    companyName: "Test Store",
    customerType: channel,
    status: "active",
  };

  for (const returning of [false, true]) {
    test(`${channel}: ${returning ? "returning skips profile" : "new completes profile after OTP"}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(
        returning ? { width: 1440, height: 900 } : { width: 390, height: 844 },
      );
      await page.route("**/api/auth/send-otp", async (route) => {
        expect(route.request().postDataJSON()).toEqual({
          phone: "09123456789",
          customerType: channel,
        });
        await route.fulfill({ json: { challengeId: "browser-test-challenge" } });
      });
      await page.route("**/api/auth/verify-otp", async (route) => {
        const body = route.request().postDataJSON();
        expect(body).not.toHaveProperty("firstName");
        expect(body.code).toBe("123456");
        await route.fulfill({
          json: {
            token: "browser-test-token",
            customer: returning
              ? customer
              : {
                  ...customer,
                  firstName: "",
                  lastName: "",
                  companyName: "",
                },
          },
        });
      });
      await page.route("**/api/customer/profile", async (route) => {
        expect(route.request().headers().authorization).toBe("Bearer browser-test-token");
        const body = route.request().postDataJSON();
        expect(body.firstName).toBe("Ali");
        expect(body.lastName).toBe("Test");
        if (channel === "wholesale") expect(body.companyName).toBe("Test Store");
        await route.fulfill({ json: { customer } });
      });
      await page.route(`${base}${prefix}/account`, (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>Account destination</h1>" }),
      );
      await page.goto(`${base}${prefix}/login`);
      await expect(page.getByLabel("شماره موبایل", { exact: true })).toBeVisible();
      await expect(page.getByLabel("نام", { exact: true })).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath("phone.png"), fullPage: true, caret: "initial" });
      await page.getByLabel("شماره موبایل", { exact: true }).fill("۰۹۱۲۳۴۵۶۷۸۹");
      await page.getByRole("button", { name: "دریافت کد ورود", exact: true }).click();
      await expect(page.getByLabel("کد پیامکی", { exact: true })).toBeVisible();
      await expect(page.getByLabel("نام", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /ارسال مجدد/ })).toBeDisabled();
      await page.getByLabel("کد پیامکی", { exact: true }).fill("۱۲۳۴۵۶");
      await page.getByRole("button", { name: "تأیید و ورود", exact: true }).click();
      if (!returning) {
        await expect(page.getByLabel("نام", { exact: true })).toBeVisible();
        await page.getByLabel("نام", { exact: true }).fill("Ali");
        await page.getByLabel("نام خانوادگی", { exact: true }).fill("Test");
        if (channel === "wholesale")
          await page.getByLabel("نام فروشگاه یا شرکت", { exact: true }).fill("Test Store");
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await page.screenshot({ path: testInfo.outputPath("profile.png"), fullPage: true, caret: "initial" });
        await page.getByRole("button", { name: "ثبت اطلاعات و ادامه", exact: true }).click();
      }
      await expect(page).toHaveURL(`${base}${prefix}/account`);
    });
  }

  test(`${channel}: network failure permits retry and phone correction`, async ({ page }) => {
    await page.route("**/api/auth/send-otp", (route) => route.abort());
    await page.goto(`${base}${prefix}/login`);
    await page.getByLabel("شماره موبایل", { exact: true }).fill("09123456789");
    await page.getByRole("button", { name: "دریافت کد ورود", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "ارتباط برقرار نشد" })).toBeVisible();
    await expect(page.getByRole("button", { name: "دریافت کد ورود", exact: true })).toBeEnabled();
    await page.route("**/api/auth/send-otp", (route) =>
      route.fulfill({ json: { challengeId: "retry-challenge" } }),
    );
    await page.getByRole("button", { name: "دریافت کد ورود", exact: true }).click();
    await page.getByRole("button", { name: "تغییر شماره موبایل", exact: true }).click();
    await expect(page.getByLabel("شماره موبایل", { exact: true })).toBeVisible();
  });
}
