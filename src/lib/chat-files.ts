import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { getOrderStorePath } from "@ufo/orders";

function directory(orderId: string) {
  return join(
    dirname(getOrderStorePath()),
    "private-chat",
    createHash("sha256").update(orderId).digest("hex"),
  );
}
function filePath(orderId: string, key: string) {
  if (!/^[a-f0-9-]{36}\.(webp|pdf)$/.test(key)) throw new Error("فایل معتبر نیست.");
  return join(directory(orderId), key);
}
export async function storeChatFile(orderId: string, file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error("حداکثر حجم فایل ۵ مگابایت است.");
  let bytes = Buffer.from(await file.arrayBuffer());
  const pdf = file.type === "application/pdf";
  if (pdf) {
    if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("فایل PDF معتبر نیست.");
  } else {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error("فقط JPG، PNG، WebP یا PDF قابل ارسال است.");
    const source = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
    const metadata = await source.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1)
      throw new Error("تصویر معتبر نیست.");
    bytes = await source
      .rotate()
      .resize({ width: 2200, height: 3000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();
  }
  const key = `${randomUUID()}.${pdf ? "pdf" : "webp"}`;
  await mkdir(directory(orderId), { recursive: true });
  await writeFile(filePath(orderId, key), bytes, { mode: 0o600, flag: "wx" });
  return {
    key,
    name: file.name.slice(0, 160),
    contentType: pdf ? "application/pdf" : "image/webp",
    url: `/api/chat/upload?orderId=${encodeURIComponent(orderId)}&key=${key}`,
  };
}
export const readChatFile = (orderId: string, key: string) => readFile(filePath(orderId, key));
