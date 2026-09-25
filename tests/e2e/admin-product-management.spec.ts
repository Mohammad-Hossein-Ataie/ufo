import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { getProductColorOptions, getProductVariantType, products } from "@ufo/domain";
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title === "color product can be added on mobile and desktop" ||
      testInfo.title === "catalog starts at zero to three million with a blurred hero backdrop") return;
  const response = await page.request.post("/api/admin/login", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: { username: "local-catalog-test", password: "local-only-catalog-test-password" },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/admin/products");
  await expect(page.getByRole("button", { name: "افزودن محصول", exact: true })).toBeVisible();
});

test("searchable brands stay in the viewport and prices show three-digit groups", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 650 });
  await page.getByRole("button", { name: "افزودن محصول", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ایجاد محصول", exact: true });
  const brand = editor.getByRole("button", { name: "برند", exact: true });
  await brand.click();
  const list = page.getByRole("listbox", { name: "برند" });
  await expect(list).toBeVisible();
  await expect.poll(() => list.getByRole("option").count()).toBeGreaterThan(10);
  const bounds = await list.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(650);
  expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  expect(
    await page.evaluate(
      ({ x, y }) =>
        document.elementFromPoint(x, y)?.closest('[role="listbox"]')?.getAttribute("aria-label"),
      { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 },
    ),
  ).toBe("برند");
  await page.mouse.wheel(0, 280);
  await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.mouse.wheel(0, -280);
  await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBe(0);
  await page.getByRole("textbox", { name: "جست‌وجوی برند" }).fill("vapor10");
  await expect(list.getByRole("option")).toHaveCount(1);
  await list.getByRole("option", { name: "Vapor10" }).click();
  await expect(brand).toContainText("Vapor10");
  await brand.click();
  await page.getByRole("textbox", { name: "جست‌وجوی برند" }).fill("tokyo");
  await list.getByRole("option", { name: "Tokyo" }).click();
  await expect(brand).toContainText("Tokyo");

  await editor.getByRole("tab", { name: "قیمت و موجودی" }).click();
  const retail = editor.getByLabel("قیمت فروش تکی هر عدد (تومان)");
  const wholesale = editor.getByLabel("قیمت عمده هر عدد داخل کارتن (تومان)");
  await retail.fill("2450000");
  await wholesale.fill("۲۲۵۴۰۰۰");
  await expect(retail).toHaveValue("2,450,000");
  await expect(wholesale).toHaveValue("2,254,000");
  await page.screenshot({ path: "test-results/admin-product-searchable-brand-price.png" });
});

test("admin can add a brand while creating a product", async ({ page }) => {
  const slug = `new-brand-${Date.now()}`;
  const name = `برند آزمایشی ${Date.now()}`;
  await page.getByRole("button", { name: "افزودن محصول", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ایجاد محصول", exact: true });
  await editor.getByRole("button", { name: "افزودن برند" }).click();
  const dialog = page.getByRole("dialog", { name: "افزودن برند" });
  await dialog.getByRole("textbox", { name: "نام برند", exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "شناسه انگلیسی (اختیاری)" }).fill(slug);
  await dialog.getByRole("button", { name: "ذخیره برند" }).click();
  await expect(dialog).toBeHidden();
  await expect(editor.getByRole("button", { name: "برند", exact: true })).toContainText(name);
});

test("color product can be added on mobile and desktop", async ({ page }) => {
  const product = products.find((item) => item.isActive && getProductVariantType(item) === "color" && getProductColorOptions(item).length > 0);
  expect(product).toBeDefined();
  const firstColor = getProductColorOptions(product!)[0]!;
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/products/${product!.slug}`);
    const image = page.getByRole("button", { name: "بزرگ‌نمایی تصویر" });
    const selector = page.getByRole("radiogroup", { name: "انتخاب رنگ محصول" });
    await expect(selector).toBeVisible();
    if (width === 390) {
      expect((await image.boundingBox())!.width).toBeLessThanOrEqual(240);
      const selectorBounds = (await selector.boundingBox())!;
      expect(selectorBounds.y).toBeLessThan((await page.getByText("قیمت فروش").boundingBox())!.y);
      expect(selectorBounds.y + selectorBounds.height).toBeLessThanOrEqual(844);
    }
    await selector.getByRole("radio", { name: firstColor.labelFa }).click();
    await page.getByRole("button", { name: /افزودن به سبد خرید|ثبت پیش‌سفارش/ }).click();
  }
  await page.goto("/cart");
  await expect(page.getByText(product!.nameFa)).toBeVisible();
});

test("catalog starts at zero to three million with a blurred hero backdrop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/products");
  await expect(page.locator('input[name="maxPrice"]')).toHaveValue(new Intl.NumberFormat("fa-IR").format(3_000_000));
  const backdrop = await page.locator(".catalog-showcase").evaluate((element) => {
    const style = window.getComputedStyle(element, "::before");
    return { image: style.backgroundImage, blur: style.filter, opacity: style.opacity };
  });
  expect(backdrop.image).toContain("ufo-hero.webp");
  expect(backdrop.blur).toBe("blur(56px)");
  expect(backdrop.opacity).toBe("0.55");
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
  await editor.getByRole("button", { name: "نوع محصول", exact: true }).click();
  await page.getByRole("option", { name: "اکسسوری", exact: true }).click();
  await editor.getByRole("button", { name: "دسته", exact: true }).click();
  await page.getByRole("option", { name: "فندک", exact: true }).click();
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
  await page.getByRole("button", { name: "عملیات گروهی" }).click();
  await page.getByRole("option", { name: "غیرفعال‌سازی" }).click();
  await page.getByRole("button", { name: "اعمال تغییرات" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "تأیید", exact: true }).click();
  await expect(page.getByRole("cell", { name: "غیرفعال", exact: true })).toBeVisible();
  await page.getByLabel("انتخاب محصولات همین صفحه").check();
  await page.getByRole("button", { name: "عملیات گروهی" }).click();
  await page.getByRole("option", { name: "حذف محصولات" }).click();
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
