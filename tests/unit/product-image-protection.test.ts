import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MemoryStorageProvider } from "@ufo/storage";
import {
  generateProtectedProductImage,
  productAssetUrl,
  productCatalogImageUrl,
  productImageAssetId,
  validateProductImage,
  generatedProductKey,
} from "@/lib/product-image-protection";

describe("product image protection", () => {
  it.each(["card", "detail"] as const)(
    "preserves both ends of a narrow studio product in %s",
    async (preset) => {
      const original = await sharp({
        create: { width: 100, height: 300, channels: 3, background: "white" },
      })
        .composite([
          {
            input: Buffer.from(
              '<svg width="100" height="300"><rect x="40" y="10" width="20" height="280" fill="red"/><rect x="40" y="10" width="20" height="20" fill="blue"/><rect x="40" y="270" width="20" height="20" fill="#00ff00"/></svg>',
            ),
          },
        ])
        .png()
        .toBuffer();
      const output = await generateProtectedProductImage(original, preset);
      const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
      const pixel = (x: number, y: number, channel: number) =>
        data[(y * info.width + x) * info.channels + channel]!;
      expect(pixel(info.width / 2, Math.round(info.height * 0.05), 2)).toBeGreaterThan(200);
      expect(pixel(info.width / 2, Math.round(info.height * 0.95), 1)).toBeGreaterThan(200);
      expect(pixel(2, 2, 0)).toBeGreaterThan(245);
    },
  );
  it.each([
    [100, 300],
    [300, 100],
  ])("fills a %s × %s card edge to edge without synthetic fill bands", async (width, height) => {
    const original = await sharp({
      create: { width, height, channels: 3, background: "#e02030" },
    })
      .png()
      .toBuffer();
    const card = await generateProtectedProductImage(original, "card");
    const { data, info } = await sharp(card).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) =>
      Array.from(
        data.subarray(
          (y * info.width + x) * info.channels,
          (y * info.width + x) * info.channels + 3,
        ),
      );
    expect(pixel(10, 10)[0]).toBeGreaterThan(200);
    expect(pixel(10, 10)[1]).toBeLessThan(60);
    for (const [x, y] of width < height
      ? [
          [300, 2],
          [300, 597],
        ]
      : [
          [2, 300],
          [597, 300],
        ]) {
      expect(pixel(x!, y!)[0]).toBeGreaterThan(200);
    }
    expect(generatedProductKey("asset", "card")).toContain("card-v4.webp");
    expect(generatedProductKey("asset", "detail")).toContain("asset-detail-v4.webp");
  });
  it("creates exact WebP card and detail derivatives with a visible low-opacity watermark", async () => {
    const original = await sharp({
      create: { width: 160, height: 100, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();

    const card = await generateProtectedProductImage(original, "card");
    const detail = await generateProtectedProductImage(original, "detail");
    const cardMetadata = await sharp(card).metadata();
    const detailMetadata = await sharp(detail).metadata();
    const cardStats = await sharp(card).stats();

    expect(cardMetadata).toMatchObject({ format: "webp", width: 600, height: 600 });
    expect(detailMetadata).toMatchObject({ format: "webp", width: 1200, height: 1200 });
    expect(cardStats.channels.some((channel) => channel.min < 245)).toBe(true);
  });

  it("rejects active SVG input even when the declared MIME type could be forged", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    await expect(validateProductImage(svg)).rejects.toThrow(/JPEG|PNG|WebP|AVIF/);
  });

  it("uses opaque controller URLs and can change an asset preset without exposing a key", () => {
    const assetId = "123e4567-e89b-42d3-a456-426614174000";
    const assetUrl = productAssetUrl(assetId, "detail");
    expect(assetUrl).toBe(`/api/product-images/asset/${assetId}/detail`);
    expect(productImageAssetId(assetUrl)).toBe(assetId);
    expect(productCatalogImageUrl("product-1", "gallery-0", "card")).toBe(
      "/api/product-images/catalog/product-1/gallery-0/card",
    );
    expect(assetUrl).not.toContain("storage/products/original");
  });

  it("keeps stored originals readable only through the server storage abstraction", async () => {
    const storage = new MemoryStorageProvider();
    const body = new Uint8Array([1, 2, 3]);
    await storage.upload({
      key: "storage/products/original/test",
      body,
      contentType: "image/png",
      visibility: "private",
    });
    expect((await storage.read("storage/products/original/test")).body).toEqual(body);
    await expect(storage.read("storage/products/original/missing")).rejects.toThrow();
  });
});
