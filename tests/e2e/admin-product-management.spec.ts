import { test, expect } from "@playwright/test";
import sharp from "sharp";
test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/admin/login", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: { username: "local-catalog-test", password: "local-only-catalog-test-password" },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/admin/products");
  await expect(page.getByRole("button", { name: "ویرایش", exact: true }).first()).toBeVisible();
});

test("server pagination, filtering, selection and sorting", async ({ page }) => {
  const response = page.waitForResponse(
    (r) => r.url().includes("/api/admin/products?") && r.url().includes("pageSize=20"),
  );
  await page.getByLabel("تعداد در صفحه", { exact: true }).selectOption("20");
  const data = await (await response).json();
  expect(data.rows).toHaveLength(20);
  expect(data.total).toBeGreaterThan(100);
  await expect(page.getByRole("button", { name: "ویرایش", exact: true })).toHaveCount(20);
  await page.getByLabel("انتخاب محصولات همین صفحه").check();
  await expect(page.getByText("۲۰ محصول انتخاب شده")).toBeVisible();
  const next = page.waitForResponse(
    (r) => r.url().includes("/api/admin/products?") && r.url().includes("page=2"),
  );
  await page.getByRole("button", { name: "بعدی", exact: true }).click();
  const nextData = await (await next).json();
  expect(nextData.rows[0].product.id).not.toBe(data.rows[0].product.id);
  await expect(page.getByText("۲۰ محصول انتخاب شده")).toHaveCount(0);
  await page.getByLabel("جست‌وجوی محصولات").fill("no-product-for-this-query-12345");
  await expect(page.getByText("محصولی با این مشخصات پیدا نشد")).toBeVisible();
  await page.getByRole("button", { name: "پاک کردن فیلترها" }).click();
  await expect(page.getByRole("button", { name: "ویرایش", exact: true })).toHaveCount(20);
  const sorted = page.waitForResponse((r) => r.url().includes("sort=price"));
  await page.getByRole("button", { name: "قیمت تکی", exact: true }).click();
  const sortedData = await (await sorted).json();
  expect(sortedData.rows[0].variant.retailPriceRial).toBeLessThanOrEqual(
    sortedData.rows[1].variant.retailPriceRial,
  );
  await page.screenshot({ path: "test-results/admin-products-desktop.png", fullPage: true });
});

test("tabbed editing, image order, unsaved warning, SEO and bulk actions", async ({ page }) => {
  const slug = `catalog-browser-${Date.now()}`;
  await page.getByRole("button", { name: "افزودن محصول", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ایجاد محصول", exact: true });
  await editor.getByLabel("نام فارسی", { exact: true }).fill("محصول آزمایشی کاتالوگ");
  await editor.getByLabel("Slug", { exact: true }).fill(slug);
  await editor.getByRole("combobox", { name: "نوع محصول", exact: true }).selectOption("accessory");
  await editor.getByRole("combobox", { name: "دسته", exact: true }).selectOption("cat-lighter");
  await editor.getByRole("tab", { name: "قیمت و موجودی" }).click();
  await editor.getByLabel("قیمت فروش تکی هر عدد (تومان)").fill("125000");
  await editor.getByLabel("موجودی کل", { exact: true }).fill("12");
  await editor.getByRole("tab", { name: "سئو", exact: true }).click();
  await editor.getByLabel("عنوان متا").fill("عنوان اختصاصی محصول");
  await editor.getByLabel("توضیحات متا").fill("توضیحات اختصاصی محصول برای آزمون");
  await editor.getByLabel("کلمات کلیدی").fill("تست، کاتالوگ");
  await editor.getByRole("tab", { name: "تصاویر", exact: true }).click();
  await editor.getByLabel("نشانی تصویر", { exact: true }).fill("/images/category-showcase.png");
  await editor.getByRole("button", { name: "افزودن نشانی" }).click();
  await editor.getByLabel("انتقال تصویر 2 به قبل").click();
  const uploadResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/admin/storage/upload") && r.request().method() === "POST",
  );
  const buffer = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } })
    .png()
    .toBuffer();
  await editor
    .getByLabel("آپلود تصاویر محصول")
    .setInputFiles({ name: "catalog-test.png", mimeType: "image/png", buffer });
  expect((await uploadResponse).status()).toBe(200);
  await expect(editor.getByText("در حال آپلود…", { exact: true })).toHaveCount(0);
  await editor.getByLabel("پیش‌نمایش تصویر 1").click();
  await expect(page.getByRole("dialog", { name: "پیش‌نمایش تصویر", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "بستن پیش‌نمایش" }).click();
  await editor.getByRole("button", { name: "بستن", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "تغییرات ذخیره نشده‌اند" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "تغییرات ذخیره نشده‌اند" })
    .getByRole("button", { name: "انصراف" })
    .click();
  await editor.getByRole("tab", { name: "سئو", exact: true }).click();
  await expect(editor.getByLabel("عنوان متا")).toHaveValue("عنوان اختصاصی محصول");
  await page.screenshot({ path: "test-results/admin-product-editor.png", fullPage: true });
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/admin/products") && r.request().method() === "POST",
  );
  await editor.getByRole("button", { name: "ذخیره محصول", exact: true }).click();
  const savedResponse = await saved;
  expect(savedResponse.status()).toBe(201);
  const { row } = await savedResponse.json();
  expect(row.product.seoKeywords).toEqual(["تست", "کاتالوگ"]);
  expect(row.product.image).toBe("/images/category-showcase.png");
  await expect(editor).toHaveCount(0);
  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await expect(page.getByRole("button", { name: "ویرایش", exact: true })).toHaveCount(1);
  const detail = page.waitForResponse(
    (r) =>
      r.url().includes(`/api/admin/products/${row.product.id}`) && r.request().method() === "GET",
  );
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  expect((await detail).status()).toBe(200);
  const edit = page.getByRole("dialog", { name: "ویرایش محصول", exact: true });
  await edit.getByRole("tab", { name: "سئو", exact: true }).click();
  await expect(edit.getByLabel("عنوان متا")).toHaveValue("عنوان اختصاصی محصول");
  await edit.getByLabel("عنوان متا").fill("عنوان ویرایش‌شده");
  const patched = page.waitForResponse(
    (r) =>
      r.request().method() === "PATCH" && r.url().includes(`/api/admin/products/${row.product.id}`),
  );
  await edit.getByRole("button", { name: "ذخیره محصول", exact: true }).click();
  expect((await (await patched).json()).row.product.seoTitle).toBe("عنوان ویرایش‌شده");
  await expect(edit).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ویرایش", exact: true })).toHaveCount(1);
  await page.getByLabel("انتخاب محصولات همین صفحه").check();
  await page.getByLabel("عملیات گروهی").selectOption("deactivate");
  await page.getByRole("button", { name: "اعمال تغییرات" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "تأیید", exact: true }).click();
  await expect(page.getByRole("cell", { name: "غیرفعال", exact: true })).toBeVisible();
  await page.getByLabel("انتخاب محصولات همین صفحه").check();
  await page.getByLabel("عملیات گروهی").selectOption("delete");
  await page.getByRole("button", { name: "اعمال تغییرات" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "تأیید", exact: true }).click();
  await expect(page.getByText("محصولی با این مشخصات پیدا نشد")).toBeVisible();
});

test("responsive editor keeps save reachable and keyboard tabs work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "افزودن محصول", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ایجاد محصول", exact: true });
  await editor.getByRole("tab", { name: "اطلاعات پایه", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(editor.getByRole("tab", { name: "قیمت و موجودی" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const save = editor.getByRole("button", { name: "ذخیره محصول" });
  await expect(save).toBeInViewport();
  await page.screenshot({ path: "test-results/admin-product-mobile.png", fullPage: true });
});
