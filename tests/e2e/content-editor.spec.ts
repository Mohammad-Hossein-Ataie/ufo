import { expect, test } from "@playwright/test";
import sharp from "sharp";
import type { ContentPost } from "../../src/lib/content-posts";
import type { RichTextDocument } from "../../src/lib/content-rich-text";

const origin = "http://127.0.0.1:3106";

test.beforeEach(async ({ page, baseURL }) => {
  expect(baseURL).toBe(origin);
  const login = await page.request.post("/api/admin/login", {
    headers: { origin },
    data: { username: "local-catalog-test", password: "local-only-catalog-test-password" },
  });
  expect(login.ok()).toBe(true);
});

test("edits, saves and reopens a table, inline image and separate article banner", async ({
  page,
}) => {
  const initialBody: RichTextDocument = {
    version: 1,
    blocks: [
      { type: "paragraph", content: [{ type: "text", text: "مقدمه قبل از جدول" }] },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "پاراگراف پایانی برای بررسی نگهداری متن مقاله. این یادداشت آموزشی درباره برنامه مطالعه است و پس از جدول و تصویر باقی می‌ماند.",
          },
        ],
      },
    ],
  };
  const created = await page.request.post("/api/admin/content", {
    headers: { origin },
    data: {
      title: "یادداشت آزمایشی جدول و تصویر برای برنامه مطالعه",
      slug: `content-editor-${Date.now()}`,
      excerpt:
        "این یادداشت آموزشی ساختار یک مقاله با تصویر و جدول را بررسی می‌کند و محتوای آزمایشی محلی است.",
      body: JSON.stringify(initialBody),
      seoTitle: "یادداشت آموزشی درباره برنامه مطالعه روزانه",
      seoDescription:
        "این یادداشت آموزشی ساختار مقاله را با جدول و تصویر بررسی می‌کند و نگهداری اطلاعات را پس از ذخیره و بازکردن دوباره ارزیابی می‌کند.",
    },
  });
  expect(created.status()).toBe(201);
  const { post } = (await created.json()) as { post: ContentPost };
  try {
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto("/admin/content");
    await page.getByRole("button").filter({ hasText: post.title }).click();
    const editor = page.getByRole("textbox", { name: "متن اصلی", exact: true });
    await expect(editor).toContainText("مقدمه قبل از جدول");
    await editor.locator("p").filter({ hasText: "مقدمه قبل از جدول" }).click();
    await page.keyboard.press("End");
    await page.getByRole("button", { name: "افزودن جدول", exact: true }).click();
    await page.getByLabel("تعداد سطرها", { exact: true }).fill("3");
    await page.getByLabel("تعداد ستون‌ها", { exact: true }).fill("3");
    await page.getByLabel("عنوان جدول (اختیاری)", { exact: true }).fill("برنامه مطالعه روزانه");
    await page.getByRole("button", { name: "درج جدول در متن", exact: true }).click();
    const table = editor.getByRole("table");
    await expect(table.getByRole("row")).toHaveCount(3);
    await table.getByRole("columnheader").nth(0).fill("روز");
    await table.getByRole("columnheader").nth(1).fill("موضوع");
    await table.getByRole("columnheader").nth(2).fill("یادداشت");
    await table.getByRole("cell").nth(0).fill("شنبه");
    await table.getByRole("cell").nth(1).fill("مطالعه");
    await table.getByRole("cell").nth(0).click();
    await page.getByRole("button", { name: "افزودن سطر بعد", exact: true }).click();
    await expect(table.getByRole("row")).toHaveCount(4);
    await table.getByRole("cell").nth(0).click();
    await page.getByRole("button", { name: "افزودن ستون بعد", exact: true }).click();
    await expect(table.getByRole("columnheader")).toHaveCount(4);
    await table.getByRole("columnheader").nth(1).click();
    await page.getByRole("button", { name: "حذف ستون", exact: true }).click();
    await expect(table.getByRole("columnheader")).toHaveCount(3);

    // Insert an image immediately before the last paragraph, preserving both sides.
    await editor.locator("p").filter({ hasText: "پاراگراف پایانی" }).click();
    await editor.locator("p").filter({ hasText: "پاراگراف پایانی" }).evaluate((paragraph) => {
      const range = document.createRange();
      range.setStart(paragraph, 0);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await page.getByRole("button", { name: "افزودن تصویر به متن", exact: true }).click();
    await page
      .getByLabel("توضیح تصویر برای دسترس‌پذیری", { exact: true })
      .fill("تصویر عمودی آزمایشی برنامه مطالعه");
    await page
      .getByLabel("زیرنویس تصویر (اختیاری)", { exact: true })
      .fill("زیرنویس مستقل از توضیح تصویر");
    const image = await sharp({
      create: { width: 320, height: 500, channels: 3, background: "#0e7490" },
    })
      .png()
      .toBuffer();
    const inlineUpload = page.waitForResponse((response) => response.url().endsWith("/api/admin/content/upload") && response.request().method() === "POST");
    await page
      .getByLabel("فایل تصویر میان متن", { exact: true })
      .setInputFiles({ name: "inline.png", mimeType: "image/png", buffer: image });
    expect((await inlineUpload).ok()).toBe(true);
    await expect(editor.locator("figure img")).toHaveCount(1);
    await expect(editor.locator("figure img")).toHaveAttribute("width", "320");
    await expect(editor.locator("figure img")).toHaveAttribute("height", "500");
    await editor.locator("figure").click();
    await page
      .getByLabel("زیرنویس تصویر (اختیاری)", { exact: true })
      .fill("زیرنویس ویرایش‌شده تصویر میان متن");
    await page.getByRole("button", { name: "ثبت توضیحات تصویر", exact: true }).click();
    await expect(editor.locator("figcaption")).toHaveText("زیرنویس ویرایش‌شده تصویر میان متن");
    const banner = await sharp({
      create: { width: 640, height: 360, channels: 3, background: "#475569" },
    })
      .png()
      .toBuffer();
    await page
      .getByLabel("فایل تصویر بنر مقاله", { exact: true })
      .setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: banner });
    await expect(page.getByRole("button", { name: "ذخیره مطلب", exact: true })).toBeEnabled();
    await page
      .getByLabel("متن جایگزین بنر مقاله", { exact: true })
      .fill("بنر آزمایشی یادداشت آموزشی");
    const saving = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/content/${post.id}`) &&
        response.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "ذخیره مطلب", exact: true }).click();
    expect((await saving).ok()).toBe(true);
    const detail = (await (await page.request.get(`/api/admin/content/${post.id}`)).json())
      .post as ContentPost;
    const savedBody = JSON.parse(detail.body) as RichTextDocument;
    expect(savedBody.blocks.filter((block) => block.type === "table")).toHaveLength(1);
    expect(savedBody.blocks.filter((block) => block.type === "image")).toHaveLength(1);
    expect(savedBody.blocks[0]).toEqual(initialBody.blocks[0]);
    expect(savedBody.blocks.at(-1)).toEqual(initialBody.blocks[1]);
    expect(detail.coverImage).toMatch(/^\/api\/content-images\//);
    const inlineImage = savedBody.blocks.find((block) => block.type === "image");
    expect(inlineImage?.src).not.toBe(detail.coverImage);

    await page.reload();
    await page.getByRole("button").filter({ hasText: post.title }).click();
    await expect(editor.locator("figcaption")).toHaveText("زیرنویس ویرایش‌شده تصویر میان متن");
    await expect(table.getByRole("row")).toHaveCount(4);
    await expect(table.getByRole("cell", { name: "شنبه", exact: true })).toBeVisible();
    await editor.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "temp/content-editor-table-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await editor.scrollIntoViewIfNeeded();
    const editorBox = await editor.boundingBox();
    expect(editorBox).not.toBeNull();
    expect(editorBox!.x).toBeGreaterThanOrEqual(0);
    expect(editorBox!.x + editorBox!.width).toBeLessThanOrEqual(390);
    await page.getByRole("toolbar", { name: "ابزارهای ویرایش متن" }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: "temp/content-editor-table-mobile.png" });

    // Publish only on the isolated test server to verify the shared article renderer.
    const publication = await page.request.patch(`/api/admin/content/${post.id}`, {
      headers: { origin },
      data: { ...detail, status: "published" },
    });
    expect(publication.ok()).toBe(true);
    await page.goto(`/blog/${post.slug}`);
    const article = page.locator("article");
    await expect(article.getByRole("table", { name: "برنامه مطالعه روزانه" })).toBeVisible();
    await expect(
      article.getByRole("img", { name: "تصویر عمودی آزمایشی برنامه مطالعه" }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await article.getByRole("table").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "temp/content-article-table-mobile.png" });
  } finally {
    await page.request.delete(`/api/admin/content/${post.id}`, { headers: { origin } });
  }
});
