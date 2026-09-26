import { expect, test } from "@playwright/test";

test("published content is responsive and article details are readable", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "قبل از خرید، انتخاب مطمئن‌تری داشته باشید", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /مشاهده محصولات/ })).toBeVisible();
  await page.screenshot({ path: "temp/content-blog-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "temp/content-blog-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  const firstArticleLink = page.locator('a[href^="/blog/"]');
  await expect(firstArticleLink).toHaveCount(3);
  const firstHref = await firstArticleLink.first().getAttribute("href");
  expect(firstHref).toBeTruthy();
  await firstArticleLink.first().click();
  await page.waitForURL(`**${firstHref}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("script[type='application/ld+json']")).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "temp/content-article-mobile.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const latestHeading = page.getByRole("heading", { name: "آخرین اخبار و مقالات", exact: true });
  await expect(latestHeading).toBeVisible();
  await expect(latestHeading.locator("xpath=ancestor::section").locator("article")).toHaveCount(2);

  await page.goto("/b2b/blog");
  await expect(page.getByRole("heading", { name: "تصمیم بهتر برای خرید کارتنی و فروش بیشتر", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /سفارش سریع/ }).first()).toBeVisible();
  await expect(page.locator('a[href^="/b2b/blog/"]')).toHaveCount(2);
  await expect(page.getByText("چطور کارتریج سازگار با دستگاه خود را پیدا کنیم؟")).toHaveCount(0);
  await page.screenshot({ path: "temp/content-b2b-blog-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "temp/content-b2b-blog-mobile.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/b2b");
  const wholesaleLatest = page.getByRole("heading", { name: "آخرین اخبار و مقالات عمده", exact: true });
  await expect(wholesaleLatest).toBeVisible();
  await expect(wholesaleLatest.locator("xpath=ancestor::section").locator("article")).toHaveCount(1);
});

test("admin can create a SEO-ready draft with immediate feedback", async ({ page }) => {
  const login = await page.request.post("/api/admin/login", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: { username: "local-catalog-test", password: "local-only-catalog-test-password" },
  });
  expect(login.ok()).toBeTruthy();

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/admin/content");
  await expect(page.getByRole("heading", { name: "اخبار و مقالات", exact: true })).toBeVisible();
  const adminSidebar = page.getByTestId("admin-sidebar");
  await expect(adminSidebar).toBeVisible();
  expect(await adminSidebar.evaluate((element) => getComputedStyle(element).position)).toBe("fixed");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => adminSidebar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), right: Math.round(rect.right) };
  })).toEqual({ top: 0, bottom: 1080, right: 1920 });
  await page.screenshot({ path: "temp/content-admin-sidebar-scrolled.png", fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "مطلب جدید", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "متن اصلی", exact: true });
  const toolbar = page.getByRole("toolbar", { name: "ابزارهای ویرایش متن" });
  await expect(toolbar).toBeVisible();
  await expect.poll(() => editor.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBeGreaterThanOrEqual(850);
  await expect.poll(() => toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "افزودن تصویر به متن", exact: true }).click();
  await expect(page.getByText("افزودن تصویر میان متن", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "بستن افزودن تصویر", exact: true }).click();
  await page.getByLabel("وضعیت انتشار", { exact: false }).selectOption("scheduled");
  await page.getByRole("button", { name: "زمان انتشار", exact: true }).click();
  const calendar = page.getByRole("dialog", { name: "انتخاب تاریخ جلالی انتشار" });
  await expect(calendar).toBeVisible();
  await expect(page.getByText("ساعت ایران", { exact: true })).toBeVisible();
  await expect.poll(async () => {
    const box = await calendar.boundingBox();
    return Boolean(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1920 && box.y + box.height <= 1080);
  }).toBe(true);
  await page.screenshot({ path: "temp/content-admin-jalali-picker.png", fullPage: false });
  await page.getByLabel("وضعیت انتشار", { exact: false }).selectOption("draft");
  await page.getByRole("radio", { name: /عمده‌فروشی/ }).check();
  await page.getByLabel("عنوان مطلب", { exact: false }).fill("راهنمای کامل آزمایشی برای انتخاب بهتر محصول مناسب");
  await page.getByLabel("اسلاگ URL", { exact: false }).fill("playwright-content-guide");
  await page.getByLabel("خلاصه", { exact: false }).fill("این خلاصه آزمایشی مسیر ساخت یک مطلب تازه را در پنل مدیریت یوفوپاف بررسی می‌کند.");
  await page.getByLabel("متن اصلی", { exact: false }).fill("این متن آزمایشی برای بررسی فرم مدیریت محتوا نوشته شده و طول کافی برای عبور از اعتبارسنجی سمت سرور را دارد.\n\n## بخش دوم\nدر این بخش توضیح تکمیلی و قابل خواندن مطلب قرار می‌گیرد.");
  await page.getByLabel("عنوان SEO", { exact: false }).fill("راهنمای آزمایشی انتخاب بهتر محصول | یوفوپاف");
  await page.getByLabel("توضیحات SEO", { exact: false }).fill("این توضیحات آزمایشی برای بررسی پیش‌نمایش گوگل، اعتبارسنجی سئو و ذخیره امن مطلب جدید در پنل مدیریت یوفوپاف نوشته شده است.");
  await page.getByRole("button", { name: "ذخیره مطلب", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("مطلب ذخیره شد");
  await expect(page.getByText("عمده", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "مشاهده", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "temp/content-admin-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "temp/content-admin-mobile.png", fullPage: true });
});

test("SEO dashboard exposes lightweight analytics and Search Console setup", async ({ page }) => {
  const login = await page.request.post("/api/admin/login", {
    headers: { origin: "http://127.0.0.1:3106" },
    data: { username: "local-catalog-test", password: "local-only-catalog-test-password" },
  });
  expect(login.ok()).toBeTruthy();

  const analytics = await page.request.post("/api/analytics", {
    headers: { "sec-fetch-site": "same-origin", "user-agent": "UFO analytics browser test" },
    data: { name: "page_view", path: "/products?ignored=yes", channel: "retail", device: "desktop" },
  });
  expect(analytics.status()).toBe(204);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/seo");
  await expect(page.getByRole("heading", { name: "مرکز تحلیل SEO", exact: true })).toBeVisible();
  await expect(page.getByText("بدون اسکریپت ثالث", { exact: true })).toBeVisible();
  await expect(page.getByText("اتصال امن Google Search Console", { exact: true })).toBeVisible();
  await expect(page.getByText("/products", { exact: true })).toBeVisible();
  await page.screenshot({ path: "temp/seo-dashboard-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "مرکز تحلیل SEO", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({ path: "temp/seo-dashboard-mobile.png", fullPage: true });
});
