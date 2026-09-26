import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { createAdminSessionToken } from "@/lib/admin-session";
import { findPublishedPostBySlug, listPublishedPosts } from "@/lib/content-posts";
import { GET as listPosts, POST as createPost } from "@/app/api/admin/content/route";
import { DELETE as deletePost, PATCH as updatePost } from "@/app/api/admin/content/[postId]/route";
import { POST as uploadCover } from "@/app/api/admin/content/upload/route";
import { GET as readCover } from "@/app/api/content-images/[assetId]/route";

beforeEach(() => {
  vi.stubEnv("MONGODB_URI", "");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
  vi.stubEnv("SESSION_SECRET", "content-test-session-secret-at-least-32-characters");
  vi.stubEnv("STORAGE_PROVIDER", "memory");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function adminHeaders(mutation = false) {
  const token = await createAdminSessionToken("content-editor");
  return {
    cookie: `ufo_admin_session=${token}`,
    ...(mutation ? { origin: "http://localhost:3000", "content-type": "application/json" } : {}),
  };
}

function input(status: "draft" | "published" = "draft") {
  return {
    type: "article",
    audience: "retail",
    status,
    title: "راهنمای آزمایشی انتخاب محصول مناسب برای کاربران",
    slug: `content-test-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    excerpt: "این خلاصه آزمایشی برای بررسی مسیر کامل ساخت و انتشار محتوا در فروشگاه نوشته شده است.",
    body: "این متن آزمایشی با طول کافی برای بررسی اعتبارسنجی سمت سرور آماده شده است.\n\n## بخش دوم\nدر این بخش جزئیات بیشتری درباره انتخاب محصول ارائه می‌شود.",
    coverImage: "/images/ufo-hero.webp",
    coverAlt: "تصویر راهنمای آزمایشی انتخاب محصول",
    category: "راهنمای خرید",
    tags: ["راهنما", "انتخاب محصول"],
    author: "تحریریه تست",
    sources: ["https://example.com/source"],
    seoTitle: "راهنمای آزمایشی انتخاب محصول مناسب | یوفوپاف",
    seoDescription: "این توضیحات آزمایشی برای بررسی متادیتای سئو، نمایش نتیجه جست‌وجو و اعتبارسنجی کامل مطلب در پنل مدیریت یوفوپاف نوشته شده است.",
  };
}

describe("content management", () => {
  it("keeps drafts private, publishes them and supports authenticated deletion", async () => {
    const draft = input();
    const created = await createPost(
      new Request("http://localhost:3000/api/admin/content", {
        method: "POST",
        headers: await adminHeaders(true),
        body: JSON.stringify(draft),
      }),
    );
    expect(created.status).toBe(201);
    const createdPayload = (await created.json()) as { post: { id: string; slug: string } };
    expect(await findPublishedPostBySlug(createdPayload.post.slug)).toBeUndefined();

    const listed = await listPosts(
      new Request("http://localhost:3000/api/admin/content", { headers: await adminHeaders() }),
    );
    expect(listed.status).toBe(200);
    expect(((await listed.json()) as { posts: Array<{ id: string }> }).posts).toContainEqual(
      expect.objectContaining({ id: createdPayload.post.id }),
    );

    const published = await updatePost(
      new Request(`http://localhost:3000/api/admin/content/${createdPayload.post.id}`, {
        method: "PATCH",
        headers: await adminHeaders(true),
        body: JSON.stringify({ ...draft, status: "published" }),
      }),
      { params: Promise.resolve({ postId: createdPayload.post.id }) },
    );
    expect(published.status).toBe(200);
    expect((await findPublishedPostBySlug(createdPayload.post.slug))?.status).toBe("published");
    expect(await findPublishedPostBySlug(createdPayload.post.slug, "wholesale")).toBeUndefined();

    const deleted = await deletePost(
      new Request(`http://localhost:3000/api/admin/content/${createdPayload.post.id}`, {
        method: "DELETE",
        headers: await adminHeaders(true),
      }),
      { params: Promise.resolve({ postId: createdPayload.post.id }) },
    );
    expect(deleted.status).toBe(200);
    expect(await findPublishedPostBySlug(createdPayload.post.slug)).toBeUndefined();
  });

  it("keeps retail and wholesale publications in their own storefronts", async () => {
    const wholesalePost = { ...input("published"), audience: "wholesale", slug: `wholesale-${Date.now()}` };
    const created = await createPost(
      new Request("http://localhost:3000/api/admin/content", {
        method: "POST",
        headers: await adminHeaders(true),
        body: JSON.stringify(wholesalePost),
      }),
    );
    expect(created.status).toBe(201);
    const payload = (await created.json()) as { post: { id: string; slug: string; audience: string } };
    expect(payload.post.audience).toBe("wholesale");
    expect((await listPublishedPosts({ audience: "wholesale" })).some((post) => post.id === payload.post.id)).toBe(true);
    expect((await listPublishedPosts({ audience: "retail" })).some((post) => post.id === payload.post.id)).toBe(false);
    expect(await findPublishedPostBySlug(payload.post.slug, "retail")).toBeUndefined();
    expect((await findPublishedPostBySlug(payload.post.slug, "wholesale"))?.id).toBe(payload.post.id);

    await deletePost(
      new Request(`http://localhost:3000/api/admin/content/${payload.post.id}`, {
        method: "DELETE",
        headers: await adminHeaders(true),
      }),
      { params: Promise.resolve({ postId: payload.post.id }) },
    );
  });

  it("rejects unauthenticated writes and weak SEO content", async () => {
    const unauthorized = await createPost(
      new Request("http://localhost:3000/api/admin/content", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "content-type": "application/json" },
        body: JSON.stringify(input()),
      }),
    );
    expect(unauthorized.status).toBe(401);

    const invalid = await createPost(
      new Request("http://localhost:3000/api/admin/content", {
        method: "POST",
        headers: await adminHeaders(true),
        body: JSON.stringify({ ...input(), seoDescription: "کوتاه" }),
      }),
    );
    expect(invalid.status).toBe(400);
    expect(((await invalid.json()) as { error: string }).error).toContain("توضیحات SEO");
  });

  it("converts cover uploads to a cached 1600 by 900 WebP image", async () => {
    const source = await sharp({
      create: { width: 320, height: 500, channels: 3, background: "#0ea5e9" },
    })
      .png()
      .toBuffer();
    const formData = new FormData();
    formData.set("file", new File([source], "cover.png", { type: "image/png" }));
    const headers = await adminHeaders();
    const uploaded = await uploadCover(
      new Request("http://localhost:3000/api/admin/content/upload", {
        method: "POST",
        headers: { ...headers, origin: "http://localhost:3000" },
        body: formData,
      }),
    );
    expect(uploaded.status).toBe(200);
    const url = ((await uploaded.json()) as { url: string }).url;
    const assetId = url.split("/").at(-1)!;
    const image = await readCover(new Request(`http://localhost:3000${url}`), {
      params: Promise.resolve({ assetId }),
    });
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/webp");
    const metadata = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
    expect(metadata).toMatchObject({ width: 1600, height: 900, format: "webp" });
  });
});
