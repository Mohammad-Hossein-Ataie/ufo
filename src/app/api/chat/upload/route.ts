import { NextResponse } from "next/server";
import { boundedBody, chatErrorStatus, requireChatOrder } from "@/lib/chat-access";
import { readChatFile, storeChatFile } from "@/lib/chat-files";
import { getStorageProvider } from "@ufo/storage";
import sharp from "sharp";
export const runtime = "nodejs";

async function access(request: Request) {
  const query = new URL(request.url).searchParams;
  const audience =
    query.get("audience") === "admin"
      ? "admin"
      : query.get("audience") === "wholesale"
        ? "wholesale"
        : "retail";
  return requireChatOrder(request, query.get("orderId") ?? "", audience);
}
export async function GET(request: Request) {
  try {
    const order = await access(request);
    const key = new URL(request.url).searchParams.get("key") ?? "";
    // Older conversations stored images in object storage. Only an attachment
    // already linked to this authorized order may use that legacy location.
    const legacy =
      key.startsWith("chat/") &&
      order.chat.some((message) => message.attachments?.some((file) => file.key === key));
    let bytes: Uint8Array;
    if (legacy) {
      const stored = await getStorageProvider().read(key);
      if (stored.body.byteLength > 6 * 1024 * 1024) throw new Error("فایل بزرگ است.");
      bytes = await sharp(stored.body, { limitInputPixels: 20_000_000, animated: false })
        .rotate()
        .webp()
        .toBuffer();
    } else {
      bytes = await readChatFile(order.id, key);
    }
    const pdf = !legacy && key.endsWith(".pdf");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": pdf ? "application/pdf" : "image/webp",
        "Content-Disposition": `${pdf ? "attachment" : "inline"}; filename="attachment.${pdf ? "pdf" : "webp"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "دسترسی به فایل ممکن نیست." },
      { status: chatErrorStatus(error) },
    );
  }
}
export async function POST(request: Request) {
  try {
    const order = await access(request);
    const bytes = await boundedBody(request, 5 * 1024 * 1024 + 16000);
    const bounded = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      body: bytes,
    });
    const file = (await bounded.formData()).get("file");
    if (!(file instanceof File)) throw new Error("فایل معتبر نیست.");
    return NextResponse.json({ file: await storeChatFile(order.id, file) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && !("code" in error) ? error.message : "آپلود فایل انجام نشد.",
      },
      { status: chatErrorStatus(error) },
    );
  }
}
