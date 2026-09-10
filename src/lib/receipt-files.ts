import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { getOrderStorePath } from "@ufo/orders";

function receiptPath(key: string) {
  if (!/^[a-f0-9-]{36}\.webp$/.test(key)) throw new Error("رسید معتبر نیست.");
  return join(dirname(getOrderStorePath()), "private-receipts", key);
}
export async function storeReceiptImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("رسید باید تصویر JPG، PNG یا WebP و حداکثر ۵ مگابایت باشد.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const source = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
  const metadata = await source.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1)
    throw new Error("محتوای تصویر معتبر نیست.");
  const output = await source
    .rotate()
    .resize({ width: 2200, height: 3000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();
  const key = `${crypto.randomUUID()}.webp`;
  await mkdir(dirname(receiptPath(key)), { recursive: true });
  await writeFile(receiptPath(key), output, { mode: 0o600, flag: "wx" });
  return key;
}
export const readReceiptImage = (key: string) => readFile(receiptPath(key));
export const removeReceiptImage = (key: string) => unlink(receiptPath(key));
