import { expect, test } from "@playwright/test";

const preferenceKey = "ufo:nicotine-guide-promo:v1";

test.use({ storageState: { cookies: [], origins: [] } });

test("homepage promo can be postponed without interrupting the next visit", async ({ page }) => {
  await page.goto("/");

  const promo = page.getByTestId("nicotine-guide-promo");
  await expect(promo).toBeVisible({ timeout: 10_000 });
  await expect(promo.getByRole("heading", { name: "نیکوتین مناسب را حدس نزنید" })).toBeVisible();
  await expect(promo.getByRole("link", { name: "شروع محاسبه رایگان" })).toHaveAttribute(
    "href",
    "/nicotine-guide",
  );
  await expect(promo.getByRole("img")).toBeVisible();
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: "temp/nicotine-promo-desktop.png" });

  await promo.getByRole("button", { name: "بعداً یادآوری کن" }).click();
  await expect(promo).toBeHidden();

  const preference = await page.evaluate((key) => {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }, preferenceKey);
  expect(preference.choice).toBe("remind-later");
  expect(preference.remindAt).toBeGreaterThan(Date.now());

  await page.reload();
  await page.waitForTimeout(2_800);
  await expect(promo).toBeHidden();
});

test("mobile promo stays contained and opens the nicotine guide", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const promo = page.getByTestId("nicotine-guide-promo");
  await expect(promo).toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: "temp/nicotine-promo-mobile.png" });

  await promo.getByRole("link", { name: "شروع محاسبه رایگان" }).click();
  await expect(page).toHaveURL(/\/nicotine-guide$/);

  const preference = await page.evaluate((key) => {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }, preferenceKey);
  expect(preference.choice).toBe("opened");
});

test("never-remind preference permanently suppresses this campaign", async ({ page }) => {
  await page.goto("/");

  const promo = page.getByTestId("nicotine-guide-promo");
  await expect(promo).toBeVisible({ timeout: 10_000 });
  await promo.getByRole("button", { name: "دیگر یادآوری نکن" }).click();
  await expect(promo).toBeHidden();

  const preference = await page.evaluate((key) => {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }, preferenceKey);
  expect(preference.choice).toBe("never");

  await page.reload();
  await page.waitForTimeout(2_800);
  await expect(promo).toBeHidden();
});
