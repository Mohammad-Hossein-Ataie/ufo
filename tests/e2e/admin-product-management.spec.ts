import { test, expect, type APIRequestContext } from "@playwright/test";
import sharp from "sharp";
import { getProductColorOptions, getProductVariantType, products } from "@ufo/domain";
let adminCookies: Awaited<ReturnType<APIRequestContext["storageState"]>>["cookies"] = [];

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/admin/login", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: { username: "local-catalog-test", password: "local-only-catalog-test-password" },
  });
  expect(response.ok()).toBeTruthy();
  adminCookies = (await request.storageState()).cookies;
});

test.beforeEach(async ({ page }, testInfo) => {
  if (
    testInfo.title === "color product can be added on mobile and desktop" ||
    testInfo.title ===
      "catalog starts without a hidden price ceiling and keeps its blurred hero backdrop"
  )
    return;
  await page.context().addCookies(adminCookies);
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

test("admin can replace a brand logo in the brand manager", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/brands");
  await expect(page.getByRole("heading", { name: "تصاویر برندها" })).toBeVisible();
  await expect(page.getByText(/لوگوی بدون پس‌زمینه/)).toBeVisible();

  const brand = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Uwell", exact: true }) });
  await expect(brand.getByText("تصویر پیش‌فرض")).toBeVisible();
  const logo = await sharp({
    create: { width: 800, height: 300, channels: 4, background: "#00000000" },
  })
    .png()
    .toBuffer();
  await brand
    .getByLabel("آپلود تصویر برند Uwell")
    .setInputFiles({ name: "uwell.png", mimeType: "image/png", buffer: logo });
  await expect(brand.getByText("آپلود شده")).toBeVisible();
  const preview = brand.getByRole("img", { name: "پیش‌نمایش لوگوی Uwell" });
  const uploadedUrl = await preview.getAttribute("src");
  expect(uploadedUrl).toMatch(/^\/api\/brand-images\/[0-9a-f-]{36}$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("color product can be added on mobile and desktop", async ({ page }) => {
  const product = products.find(
    (item) =>
      item.isActive &&
      getProductVariantType(item) === "color" &&
      getProductColorOptions(item).length > 0,
  );
  expect(product).toBeDefined();
  const firstColor = getProductColorOptions(product!)[0]!;
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/products/${product!.slug}`);
    const image = page.getByRole("button", { name: "بزرگ‌نمایی تصویر" });
    const selector = page.getByRole("radiogroup", { name: "انتخاب رنگ محصول" });
    await expect(selector).toBeVisible();
    if (width === 390) {
      const imageBounds = (await image.boundingBox())!;
      expect(imageBounds.width).toBeLessThanOrEqual(width - 32);
      expect(imageBounds.width / imageBounds.height).toBeCloseTo(3 / 4, 2);
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

test("catalog starts without a hidden price ceiling and keeps its blurred hero backdrop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/products");
  const maxPrice = await page.locator('input[name="maxPrice"]').inputValue();
  const maxToman = Number(
    maxPrice
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[^\d]/g, ""),
  );
  expect(maxToman).toBeGreaterThan(3_000_000);
  const backdrop = await page.locator(".catalog-showcase").evaluate((element) => {
    const style = window.getComputedStyle(element, "::before");
    return { image: style.backgroundImage, blur: style.filter, opacity: style.opacity };
  });
  expect(backdrop.image).toContain("ufo-hero.webp");
  expect(backdrop.blur).toBe("blur(4px)");
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

test("variant reference lists are fetched once across repeated editor opens", async ({ page }) => {
  const requests = { flavors: 0, colors: 0 };
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path === "/api/admin/flavors") requests.flavors += 1;
    if (path === "/api/admin/colors") requests.colors += 1;
  });

  await page.getByRole("button", { name: "افزودن محصول", exact: true }).click();
  await expect.poll(() => requests).toEqual({ flavors: 1, colors: 1 });
  await page
    .getByRole("dialog", { name: "ایجاد محصول" })
    .getByRole("button", { name: "بستن" })
    .click();
  await page.getByRole("button", { name: "افزودن محصول", exact: true }).click();
  await page.waitForTimeout(300);
  expect(requests).toEqual({ flavors: 1, colors: 1 });
});

test("dashboard, content, and settings avoid duplicate client data requests", async ({ page }) => {
  const requests: string[] = [];
  await page.waitForLoadState("networkidle");
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/admin/")) requests.push(url.pathname);
  });

  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  expect(requests.filter((path) => path === "/api/admin/products").length).toBeLessThanOrEqual(1);
  expect(requests.filter((path) => path !== "/api/admin/products")).toEqual([]);

  requests.length = 0;
  await page.goto("/admin/content");
  await page.waitForLoadState("networkidle");
  expect(requests.filter((path) => path === "/api/admin/content")).toHaveLength(1);

  requests.length = 0;
  await page.goto("/admin/settings");
  await page.waitForLoadState("networkidle");
  const expectedSettingsRequests = [
    "/api/admin/announcements",
    "/api/admin/payment-accounts",
    "/api/admin/shipping-methods",
  ];
  for (const path of expectedSettingsRequests) {
    expect(requests.filter((candidate) => candidate === path)).toHaveLength(1);
  }
  expect(
    [...new Set(requests)].filter(
      (path) => requests.filter((candidate) => candidate === path).length > 1,
    ),
  ).toEqual([]);
});

test("per-option availability persists across admin save and reopen", async ({ page }) => {
  const slug = `variant-state-browser-${Date.now()}`;
  const created = await page.request.post("/api/admin/products", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: {
      nameFa: "محصول وضعیت تنوع مرورگر",
      nameEn: "Browser variant state product",
      slug,
      brandId: "brand-ufo",
      categoryId: "cat-vape",
      productKind: "vape-device",
      salesChannels: ["retail"],
      image: "/images/categories/pod.webp",
      images: ["/images/categories/pod.webp", "/images/categories/vape.webp"],
      variantType: "color",
      variantValueIds: ["black", "silver"],
      variantImages: {
        black: "/images/categories/pod.webp",
        silver: "/images/categories/vape.webp",
      },
      retailPriceRial: 1_250_000,
      onHand: 20,
      restockThreshold: 3,
      isActive: true,
    },
  });
  expect(created.status()).toBe(201);

  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await expect(page.getByRole("button", { name: "ویرایش", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ویرایش محصول" });
  await editor.getByRole("tab", { name: "تنوع‌ها" }).click();
  const variantTable = editor.getByRole("table", { name: "مدیریت مستقیم تنوع‌ها" });
  await variantTable.getByLabel("SKU مشکی").fill("BLACK-BROWSER-01");
  await variantTable.getByLabel("موجودی مشکی").fill("0");
  await variantTable.getByLabel("قابل سفارش بودن مشکی").uncheck();
  await variantTable.getByLabel("SKU نقره‌ای").fill("SILVER-BROWSER-07");
  await variantTable.getByLabel("موجودی نقره‌ای").fill("7");
  await variantTable.getByLabel("انتخاب نقره‌ای به عنوان پیش‌فرض").check();
  await editor.getByRole("button", { name: "ذخیره محصول", exact: true }).click();
  await expect(editor).toHaveCount(0);

  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  const reopened = page.getByRole("dialog", { name: "ویرایش محصول" });
  await reopened.getByRole("tab", { name: "تنوع‌ها" }).click();
  const reopenedTable = reopened.getByRole("table", { name: "مدیریت مستقیم تنوع‌ها" });
  await expect(reopenedTable.getByLabel("SKU مشکی")).toHaveValue("BLACK-BROWSER-01");
  await expect(reopenedTable.getByLabel("موجودی مشکی")).toHaveValue("0");
  await expect(reopenedTable.getByLabel("قابل سفارش بودن مشکی")).not.toBeChecked();
  await expect(reopenedTable.getByLabel("انتخاب نقره‌ای به عنوان پیش‌فرض")).toBeChecked();
  await reopened.getByRole("button", { name: "بستن" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/products/${slug}`);
  const unavailableThumbnail = page.getByRole("button", {
    name: "محصول وضعیت تنوع مرورگر مشکی - ناموجود",
    exact: true,
  });
  const availableThumbnail = page.getByRole("button", {
    name: "محصول وضعیت تنوع مرورگر نقره‌ای",
    exact: true,
  });
  await expect(unavailableThumbnail).toHaveAttribute("data-availability", "unavailable");
  await expect(unavailableThumbnail).toHaveClass(/product-detail-unavailable-thumbnail/);
  await expect(availableThumbnail).toHaveAttribute("data-availability", "available");
  expect(
    await unavailableThumbnail.locator("img").evaluate((image) => getComputedStyle(image).filter),
  ).toContain("grayscale(1)");
  expect(
    await availableThumbnail.locator("img").evaluate((image) => getComputedStyle(image).filter),
  ).toBe("none");
  await page.screenshot({ path: "test-results/unavailable-variant-thumbnail-390.png" });
});

test("product availability persists and remains visible but unpurchasable responsively", async ({
  page,
}) => {
  const suffix = Date.now();
  const slug = `parent-unavailable-browser-${suffix}`;
  const name = `محصول ناموجود مرورگر ${suffix}`;
  const created = await page.request.post("/api/admin/products", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: {
      nameFa: name,
      nameEn: "Unavailable browser product",
      slug,
      brandId: "brand-ufo",
      categoryId: "cat-lighter",
      productKind: "accessory",
      salesChannels: ["retail", "wholesale"],
      image: "/images/categories/lighter.webp",
      images: ["/images/categories/lighter.webp"],
      variantType: "none",
      variantValueIds: [],
      retailPriceRial: 1_250_000,
      wholesalePriceRial: 1_000_000,
      wholesaleEnabled: true,
      cartonSize: 10,
      minWholesaleCartonCount: 1,
      onHand: 20,
      restockThreshold: 3,
      isActive: true,
      isAvailable: true,
    },
  });
  expect(created.status()).toBe(201);

  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ویرایش محصول" });
  await editor.getByRole("tab", { name: "قیمت و موجودی" }).click();
  const productAvailability = editor.getByLabel("محصول موجود است");
  await expect(productAvailability).toBeChecked();
  await productAvailability.uncheck();
  await expect(editor.getByText("ناموجود", { exact: true })).toBeVisible();
  await editor.getByRole("button", { name: "ذخیره محصول", exact: true }).click();
  await expect(editor).toHaveCount(0);

  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  const reopened = page.getByRole("dialog", { name: "ویرایش محصول" });
  await reopened.getByRole("tab", { name: "قیمت و موجودی" }).click();
  await expect(reopened.getByLabel("محصول موجود است")).not.toBeChecked();
  await reopened.getByRole("button", { name: "بستن" }).click();

  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto(`/products?q=${encodeURIComponent(slug)}`);
    const card = page.getByRole("article").filter({ hasText: name });
    if ((await card.count()) === 0) {
      // A previous catalog test may have populated the short-lived discovery snapshot.
      // The first read starts its background refresh; reload once after that refresh settles.
      await page.waitForTimeout(500);
      await page.reload();
    }
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("data-availability", "unavailable");
    await expect(card.getByText("ناموجود", { exact: true })).toBeVisible();
    await expect(card.locator(".line-through")).toContainText("تومان");
    await expect(card.getByRole("button", { name: /افزودن به سبد خرید/ })).toHaveCount(0);
    await expect(card.getByRole("link", { name: /مشاهده محصول/ })).toBeVisible();
    expect(
      await card
        .locator("img")
        .first()
        .evaluate((image) => getComputedStyle(image).filter),
    ).not.toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: `test-results/product-unavailable-${width}.png`,
        fullPage: true,
      });
    }
  }

  await page.goto(`/products/${slug}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("button", { name: "محصول ناموجود است" })).toBeDisabled();
  await expect(page.getByTestId("product-gallery-surface")).toHaveClass(
    /product-detail-unavailable-media/,
  );
  await expect(
    page.getByText("قیمت فروش", { exact: true }).locator("..").locator(".line-through"),
  ).toContainText("تومان");
  await expect(page.getByText("ناموجود", { exact: true }).first()).toBeVisible();
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

test("admin edits nicotine strengths independently from flavor variants and persists them", async ({
  page,
}) => {
  const suffix = Date.now();
  const slug = `nicotine-strength-admin-${suffix}`;
  const created = await page.request.post("/api/admin/products", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: {
      nameFa: `سالت تست غلظت ${suffix}`,
      nameEn: "Admin nicotine strength test",
      slug,
      brandId: "brand-ufo",
      categoryId: "cat-salt-nicotine",
      productKind: "salt-nicotine",
      nicotineStrengthsMg: [20],
      salesChannels: ["retail"],
      image: "/images/categories/e-liquid.webp",
      images: ["/images/categories/e-liquid.webp"],
      variantType: "flavor",
      variantValueIds: ["mint"],
      retailPriceRial: 1_250_000,
      onHand: 12,
      restockThreshold: 2,
      isActive: true,
      isAvailable: true,
    },
  });
  expect(created.status()).toBe(201);

  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "ویرایش محصول" });
  await editor.getByRole("tab", { name: "قیمت و موجودی" }).click();
  const strengths = editor.getByLabel("غلظت‌های نیکوتین (mg/ml)");
  await expect(strengths).toHaveValue("20");
  await strengths.fill("۵۰، ۲۰، ۲۵، ۵۰");

  const patched = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" && response.url().includes("/api/admin/products/"),
  );
  await editor.getByRole("button", { name: "ذخیره محصول", exact: true }).click();
  const patchBody = await (await patched).json();
  expect(patchBody.row.product.nicotineStrengthsMg).toEqual([20, 25, 50]);

  await page.getByLabel("جست‌وجوی محصولات").fill(slug);
  await page.getByRole("button", { name: "ویرایش", exact: true }).click();
  const reopened = page.getByRole("dialog", { name: "ویرایش محصول" });
  await reopened.getByRole("tab", { name: "قیمت و موجودی" }).click();
  await expect(reopened.getByLabel("غلظت‌های نیکوتین (mg/ml)")).toHaveValue("20، 25، 50");
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
