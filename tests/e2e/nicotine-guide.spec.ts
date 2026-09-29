import { expect, test } from "@playwright/test";

test("retail nicotine guide calculates a device-aware starting range", async ({ page }) => {
  await page.goto("/nicotine-guide");

  await expect(
    page.getByRole("heading", { name: "محاسبه‌گر نیکوتین سالت و جویس بر اساس مصرف سیگار" }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/محاسبه‌گر نیکوتین سالت و جویس/);

  await page.getByLabel("تعداد نخ سیگار در روز").fill("10");
  await page.getByText("تا ۳۰ دقیقه", { exact: true }).click();
  await expect(page.getByLabel("تا ۳۰ دقیقه")).toBeChecked();
  await page.getByText("پاد کم‌وات (MTL)", { exact: true }).click();
  await expect(page.getByLabel("پاد کم‌وات (MTL)")).toBeChecked();
  await page.getByRole("button", { name: "نمایش پیشنهاد شروع" }).click();

  const result = page.getByRole("complementary", { name: "نتیجه راهنمای نیکوتین" });
  await expect(result.getByText("سالت نیکوتین برای پاد کم‌وات")).toBeVisible();
  await expect(result.getByText("12–18 mg/ml")).toBeVisible();
  await expect(result.getByRole("link", { name: "مشاهده محصولات پیشنهادی" })).toHaveAttribute(
    "href",
    "#recommended-products",
  );

  const recommendations = page.locator("#recommended-products");
  await expect(
    recommendations.getByRole("heading", { name: "محصولات متناسب با نتیجه شما" }),
  ).toBeVisible();
  await expect(recommendations.getByRole("article")).toHaveCount(4);
  await expect(recommendations.getByText("تطابق نوع محصول", { exact: true })).toHaveCount(4);
  await page.screenshot({ path: "temp/nicotine-guide-desktop-result.png", fullPage: true });
});

test("nicotine guide remains readable without horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/nicotine-guide");

  await expect(page.getByLabel("تعداد نخ سیگار در روز")).toBeVisible();
  await page.getByLabel("تعداد نخ سیگار در روز").fill("15");
  await page.getByText("تا ۳۰ دقیقه", { exact: true }).click();
  await page.getByText("پاد کم‌وات (MTL)", { exact: true }).click();
  await page.getByRole("button", { name: "نمایش پیشنهاد شروع" }).click();
  await expect(page.locator("#recommended-products").getByRole("article")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.screenshot({ path: "temp/nicotine-guide-mobile.png", fullPage: true });
});
