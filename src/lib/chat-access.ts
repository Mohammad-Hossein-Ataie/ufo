import { getSubmittedOrder, getSubmittedOrderForCustomer } from "@ufo/orders";
import type { SalesChannel } from "@ufo/types";
import { requireAdminRead, requireAdminMutation, adminRequestErrorStatus } from "./admin-request";
import { requireCustomerSession, checkRateLimit } from "./customer-session";

export class ChatAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function requireChatOrder(
  request: Request,
  orderId: string,
  audience: SalesChannel | "admin",
) {
  if (!orderId || orderId.length > 160) throw new ChatAccessError("شناسه سفارش معتبر نیست.", 400);
  let order;
  if (audience === "admin") {
    if (request.method === "GET") await requireAdminRead(request);
    else await requireAdminMutation(request);
    order = getSubmittedOrder(orderId);
  } else {
    let session;
    try {
      session = requireCustomerSession(request, audience);
    } catch {
      throw new ChatAccessError("برای گفتگو وارد حساب خود شوید.", 401);
    }
    order = getSubmittedOrderForCustomer(orderId, session.customerId, audience);
    if (
      request.method !== "GET" &&
      !checkRateLimit(`chat:${session.customerId}`, 30, 60000).allowed
    )
      throw new ChatAccessError("کمی بعد دوباره تلاش کنید.", 429);
  }
  if (!order) throw new ChatAccessError("سفارش پیدا نشد.", 404);
  return order;
}

export const chatErrorStatus = (error: unknown) =>
  error instanceof ChatAccessError ? error.status : adminRequestErrorStatus(error);

export async function boundedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new ChatAccessError("درخواست خالی است.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) {
      await reader.cancel();
      throw new ChatAccessError("حجم فایل یا پیام زیاد است.", 413);
    }
    chunks.push(part.value);
  }
  return Buffer.concat(chunks);
}
