import sharp from "sharp";

export const productImagePresets = {
  card: { width: 600, height: 800, quality: 80 },
  detail: { width: 1200, height: 1600, quality: 84 },
} as const;

export type ProductImagePreset = keyof typeof productImagePresets;
export const productCardImageVersion = "5";
export const productDetailImageVersion = "5";

export const productOriginalPrefix = "storage/products/original/";
export const productGeneratedPrefix = "storage/products/generated/";
export const maxProductImageBytes = 8 * 1024 * 1024;
export const maxProductImagePixels = 40_000_000;

const assetUrlPattern = /^\/api\/product-images\/asset\/([0-9a-f-]{36})\/(card|detail)$/i;

export function isProductImagePreset(value: string): value is ProductImagePreset {
  return value === "card" || value === "detail";
}

export function productAssetUrl(assetId: string, preset: ProductImagePreset): string {
  return `/api/product-images/asset/${assetId}/${preset}`;
}

export function productCatalogImageUrl(
  productId: string,
  slot: string,
  preset: ProductImagePreset,
): string {
  return `/api/product-images/catalog/${encodeURIComponent(productId)}/${encodeURIComponent(slot)}/${preset}`;
}

export function productImageAssetId(value: string): string | undefined {
  return value.match(assetUrlPattern)?.[1]?.toLowerCase();
}

export function protectedAssetUrl(value: string, preset: ProductImagePreset): string | undefined {
  const assetId = productImageAssetId(value);
  return assetId ? productAssetUrl(assetId, preset) : undefined;
}

export function originalProductKey(assetId: string): string {
  return `${productOriginalPrefix}${assetId}`;
}

export function generatedProductKey(cacheId: string, preset: ProductImagePreset): string {
  const version =
    preset === "card" ? `-v${productCardImageVersion}` : `-v${productDetailImageVersion}`;
  return `${productGeneratedPrefix}${cacheId}-${preset}${version}.webp`;
}

function watermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.round(width * 0.044);
  const inset = Math.round(width * 0.035);
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width - inset}" y="${height - inset}" text-anchor="end"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700"
        letter-spacing="1" fill="#07131A" opacity="0.15">UFO Puff</text>
    </svg>
  `);
}

export async function validateProductImage(input: Uint8Array): Promise<void> {
  if (input.byteLength === 0 || input.byteLength > maxProductImageBytes) {
    throw new Error("حجم تصویر باید حداکثر ۸ مگابایت باشد.");
  }
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: maxProductImagePixels,
    }).metadata();
  } catch {
    throw new Error("فقط تصویر JPEG، PNG، WebP یا AVIF معتبر مجاز است.");
  }
  const allowedFormats = new Set(["jpeg", "png", "webp", "avif"]);
  if (!metadata.format || !allowedFormats.has(metadata.format)) {
    throw new Error("فقط تصویر JPEG، PNG، WebP یا AVIF مجاز است.");
  }
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > maxProductImagePixels
  ) {
    throw new Error("ابعاد تصویر بیش از حد مجاز است.");
  }
}

export async function generateProtectedProductImage(
  input: Uint8Array,
  preset: ProductImagePreset,
): Promise<Uint8Array> {
  await validateProductImage(input);
  const config = productImagePresets[preset];
  const source = sharp(input, {
    failOn: "error",
    limitInputPixels: maxProductImagePixels,
  }).rotate();
  let studioBackground: { r: number; g: number; b: number } | undefined;
  {
    // Extend a uniform opaque studio backdrop. Other sources retain transparency
    // around the complete image so each storefront can supply its own surface.
    const { data, info } = await source
      .clone()
      .resize(64, 64, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const corners = [
      [1, 1],
      [62, 1],
      [1, 62],
      [62, 62],
    ].map(([x, y]) => {
      const offset = (y! * info.width + x!) * info.channels;
      return [data[offset]!, data[offset + 1]!, data[offset + 2]!, data[offset + 3]!];
    });
    if (
      corners.every((corner) => corner[3]! >= 250) &&
      [0, 1, 2].every(
        (channel) =>
          Math.max(...corners.map((c) => c[channel]!)) -
            Math.min(...corners.map((c) => c[channel]!)) <=
          16,
      )
    ) {
      const average = (channel: number) =>
        Math.round(corners.reduce((sum, c) => sum + c[channel]!, 0) / corners.length);
      studioBackground = { r: average(0), g: average(1), b: average(2) };
    }
  }
  const output = await source
    .resize(config.width, config.height, {
      fit: "contain",
      background: studioBackground ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .composite([{ input: watermarkSvg(config.width, config.height), gravity: "southeast" }])
    .webp({ quality: config.quality, effort: 5, smartSubsample: true })
    .toBuffer();
  return new Uint8Array(output);
}
