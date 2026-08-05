import { expect, test } from "@playwright/test";

test("single Next app exposes retail, B2B and admin routes", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "UFO Puff", exact: true })).toBeVisible();

  await page.goto("/b2b");
  await expect(page.getByText("UFO Puff B2B").first()).toBeVisible();

  await page.goto("/admin/login");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "ورود ادمین" })).toBeVisible();

  expect(
    consoleErrors.filter(
      (message) => message.includes("hydrated") || message.includes("Hydration"),
    ),
  ).toEqual([]);
});

test("admin protected routes redirect to scoped admin login", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Forders$/);
});
