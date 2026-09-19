import sharp from "sharp";

export const productImagePresets = {
  card: { width: 600, height: 600, quality: 80 },
  detail: { width: 1200, height: 1200, quality: 84 },
} as const;

export type ProductImagePreset = keyof typeof productImagePresets;
export const productCardImageVersion = "2";
export const productDetailImageVersion = "2";

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
  if (preset === "card") {
    // Preserve portrait packaging and landscape artwork in full. A defocused copy
    // fills the square without white letterboxing or stretching the foreground.
    const source = sharp(input, {
      failOn: "error",
      limitInputPixels: maxProductImagePixels,
    }).rotate();
    const foreground = await source
      .clone()
      .resize(config.width, config.height, { fit: "contain", background: "#00000000" })
      .png()
      .toBuffer();
    const card = await source
      .clone()
      .resize(config.width, config.height, { fit: "cover" })
      .flatten({ background: "#141a22" })
      .blur(24)
      .modulate({ brightness: 0.7, saturation: 0.65 })
      .composite([
        { input: foreground },
        { input: watermarkSvg(config.width, config.height), gravity: "southeast" },
      ])
      .webp({ quality: config.quality, effort: 5, smartSubsample: true })
      .toBuffer();
    return new Uint8Array(card);
  }
  // Detail pages use the same visual treatment as catalog cards: keep the
  // original artwork fully visible and fill unused square space with a soft,
  // defocused copy instead of white letterboxing.
  const source = sharp(input, {
    failOn: "error",
    limitInputPixels: maxProductImagePixels,
  }).rotate();
  const foreground = await source
    .clone()
    .resize(config.width, config.height, { fit: "contain", background: "#00000000" })
    .png()
    .toBuffer();
  const output = await source
    .clone()
    .resize(config.width, config.height, { fit: "cover" })
    .flatten({ background: "#141a22" })
    .blur(34)
    .modulate({ brightness: 0.72, saturation: 0.72 })
    .composite([
      { input: foreground },
      { input: watermarkSvg(config.width, config.height), gravity: "southeast" },
    ])
    .webp({ quality: config.quality, effort: 5, smartSubsample: true })
    .toBuffer();
  return new Uint8Array(output);
}
