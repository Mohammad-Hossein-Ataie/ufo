import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

test("nicotine calculator keeps the four client values separate from device recommendations", async ({
  page,
}) => {
  await page.goto("/nicotine-guide");

  await expect(
    page.getByRole("heading", {
      name: "محاسبه‌گر نیکوتین بر اساس تعداد و نوع سیگار",
    }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/محاسبه‌گر نیکوتین بر اساس تعداد و نوع سیگار/);

  const count = page.getByLabel("تعداد نخ سیگار در روز");
  const submit = page.getByRole("button", { name: "نمایش پیشنهاد شروع" });
  const recommendation = page.getByTestId("nicotine-recommendation-value");
  const pod = page.getByRole("radio", { name: /^پاد/ });
  const vape = page.getByRole("radio", { name: /^ویپ/ });

  await expect(count).toHaveAttribute("min", "1");
  await expect(count).toHaveAttribute("max", "100");
  await expect(pod).toBeVisible();
  await expect(vape).toBeVisible();
  await expect(pod).toBeChecked();

  await count.fill("10");
  await page.getByText("سبک / اولترا لایت", { exact: true }).click();
  await submit.click();
  await expect(recommendation).toHaveText("20mg");

  await page.getByText("معمولی / لایت", { exact: true }).click();
  await submit.click();
  await expect(recommendation).toHaveText("25mg");

  await count.fill("20");
  await submit.click();
  await expect(recommendation).toHaveText("35mg");

  await page.getByText("سنگین / پرکشش", { exact: true }).click();
  await submit.click();
  await expect(recommendation).toHaveText("50mg");
  await expect(page.getByTestId("nicotine-device-value")).toHaveText("پاد");
  await expect(page.getByTestId("nicotine-family-value")).toHaveText("سالت نیکوتین");
  await expect(page.getByRole("link", { name: "مشاهده همه دسته" })).toHaveAttribute(
    "href",
    "/products/category/salt-nicotine",
  );

  await page.getByText("ویپ", { exact: true }).click();
  await expect(recommendation).toHaveText("50mg");
  await expect(page.getByTestId("nicotine-device-value")).toHaveText("ویپ");
  await expect(page.getByTestId("nicotine-family-value")).toHaveText("جویس / ای‌لیکوئید");
  await expect(page.getByRole("link", { name: "مشاهده همه دسته" })).toHaveAttribute(
    "href",
    "/products/category/e-liquid",
  );
  await expect(page.getByText(/هیچ تبدیل حدسی از سالت به جویس/)).toBeVisible();

  await count.fill("100");
  await submit.click();
  await expect(recommendation).toHaveText("50mg");
});

test("nicotine calculator validates empty and out-of-range inputs", async ({ page }) => {
  await page.goto("/nicotine-guide");

  const count = page.getByLabel("تعداد نخ سیگار در روز");
  const submit = page.getByRole("button", { name: "نمایش پیشنهاد شروع" });
  const error = page.locator("#cigarette-count-error");

  await submit.click();
  await expect(error).toHaveText("تعداد نخ سیگار در روز را وارد کنید.");

  await count.fill("0");
  await submit.click();
  await expect(error).toContainText("بین ۱ تا ۱۰۰");

  await count.fill("101");
  await submit.click();
  await expect(error).toContainText("بین ۱ تا ۱۰۰");
  await expect(page.getByTestId("nicotine-recommendation-value")).toHaveCount(0);
});

test("nicotine calculator stays readable at every requested responsive width", async ({ page }) => {
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto("/nicotine-guide");
    await page.getByLabel("تعداد نخ سیگار در روز").fill("20");
    await page.getByText("سنگین / پرکشش", { exact: true }).click();
    await page.getByText("ویپ", { exact: true }).click();
    await page.getByRole("button", { name: "نمایش پیشنهاد شروع" }).click();

    await expect(page.getByTestId("nicotine-recommendation-value")).toHaveText("50mg");
    await expect(page.getByTestId("nicotine-family-value")).toHaveText("جویس / ای‌لیکوئید");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `temp/nicotine-guide-${width}.png`, fullPage: true });
  }
});
