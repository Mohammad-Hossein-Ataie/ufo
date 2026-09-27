import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { createAdminSessionToken } from "@/lib/admin-session";
import { listAdminBrands, saveAdminBrand } from "@/lib/admin-brands";
import { POST as uploadBrandImage } from "@/app/api/admin/brands/[brandId]/image/route";
import { GET as readBrandImage } from "@/app/api/brand-images/[assetId]/route";

beforeEach(() => {
  vi.stubEnv("MONGODB_URI", "");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
  vi.stubEnv("SESSION_SECRET", "brand-image-test-secret-at-least-32-characters");
  vi.stubEnv("STORAGE_PROVIDER", "memory");
});

afterEach(() => vi.unstubAllEnvs());

async function upload(brandId: string, bytes: Uint8Array, authenticated = true) {
  const form = new FormData();
  form.set("file", new File([bytes], "logo.png", { type: "image/png" }));
  const token = authenticated ? await createAdminSessionToken("brand-editor") : "";
  return uploadBrandImage(
    new Request(`http://localhost:3000/api/admin/brands/${brandId}/image`, {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        ...(token ? { cookie: `ufo_admin_session=${token}` } : {}),
      },
      body: form,
    }),
    { params: Promise.resolve({ brandId }) },
  );
}

describe("brand images", () => {
  it("stores transparent optimized logos and replaces a brand image without changing its identity", async () => {
    const brand = await saveAdminBrand({
      nameFa: `برند تصویر ${Date.now()}`,
      slug: `image-brand-${Date.now()}`,
    });
    const source = await sharp({
      create: { width: 1200, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();

    const first = await upload(brand.id, source);
    expect(first.status).toBe(200);
    const firstBrand = ((await first.json()) as { brand: { id: string; logoUrl: string } }).brand;
    expect(firstBrand.id).toBe(brand.id);
    expect(firstBrand.logoUrl).toMatch(/^\/api\/brand-images\/[0-9a-f-]{36}$/);
    expect((await listAdminBrands()).find((item) => item.id === brand.id)?.logoUrl).toBe(
      firstBrand.logoUrl,
    );

    const assetId = firstBrand.logoUrl.split("/").pop()!;
    const response = await readBrandImage(
      new Request(`http://localhost:3000${firstBrand.logoUrl}`),
      {
        params: Promise.resolve({ assetId }),
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect(metadata.width).toBeLessThanOrEqual(640);
    expect(metadata.height).toBeLessThanOrEqual(640);
    expect(metadata.hasAlpha).toBe(true);

    const second = await upload(brand.id, source);
    expect(second.status).toBe(200);
    const secondBrand = ((await second.json()) as { brand: { id: string; logoUrl: string } }).brand;
    expect(secondBrand.id).toBe(brand.id);
    expect(secondBrand.logoUrl).not.toBe(firstBrand.logoUrl);
    expect((await listAdminBrands()).find((item) => item.id === brand.id)?.logoUrl).toBe(
      secondBrand.logoUrl,
    );
  });

  it("rejects unauthenticated, unknown-brand and invalid image uploads", async () => {
    const source = await sharp({
      create: { width: 32, height: 32, channels: 4, background: "#ffffff" },
    })
      .png()
      .toBuffer();
    expect((await upload("brand-ufo", source, false)).status).toBe(401);
    expect((await upload("brand-not-found", source)).status).toBe(404);
    expect((await upload("brand-ufo", new TextEncoder().encode("not an image"))).status).toBe(400);
  });
});
