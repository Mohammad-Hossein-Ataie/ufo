import {
  calculateOrderTotals,
  createOrder,
  createOrderItemSnapshot,
  getProductColorOptions,
  products,
  quoteShipping,
  variants,
} from "@ufo/domain";
import type {
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PaymentMethod,
  SalesChannel,
  ShippingAddress,
  ShippingMethodCode,
} from "@ufo/types";
import { normalizeIranPhone } from "@ufo/validation";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export { createOrder, createOrderItemSnapshot, createOrderNumber } from "@ufo/domain";

export type PaymentReviewStatus = "pending_review" | "approved" | "rejected";
export type ChatSender = "customer" | "admin";

export interface CartSubmissionLine {
  variantId: string;
  quantity: number;
  cartonCount?: number;
  colorId?: string;
}

export interface OrderCustomerSnapshot {
  phone: string;
  fullName: string;
  businessName?: string;
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  actor: "customer" | "admin" | "system";
  labelFa: string;
  status: OrderStatus;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  orderId: string;
  sender: ChatSender;
  body: string;
  attachments?: Array<{
    url: string;
    key?: string;
    name?: string;
    contentType?: string;
  }>;
  replyToId?: string;
  editedAt?: string;
  readByAdminAt?: string;
  readByCustomerAt?: string;
  createdAt: string;
}

export interface SubmittedOrder extends Order {
  customer: OrderCustomerSnapshot;
  shippingAddress: ShippingAddress;
  shippingTitleFa: string;
  etaFa: string;
  paymentStatus: PaymentReviewStatus;
  receiptNote: string;
  timeline: OrderTimelineEvent[];
  chat: ChatMessageRecord[];
}

export interface CreateSubmittedOrderInput {
  channel: SalesChannel;
  customerName: string;
  businessName?: string;
  phone: string;
  address: ShippingAddress;
  lines: CartSubmissionLine[];
  shippingMethod: ShippingMethodCode;
  paymentMethod?: PaymentMethod;
  receiptNote?: string;
}

interface OrderStoreFile {
  orders: SubmittedOrder[];
}

const emptyStore: OrderStoreFile = { orders: [] };

export const orderStatusLabelsFa: Record<OrderStatus, string> = {
  draft: "پیش‌نویس",
  awaiting_payment: "در انتظار پرداخت",
  awaiting_receipt: "در انتظار رسید",
  payment_under_review: "در انتظار تایید پرداخت",
  confirmed: "تایید شده",
  processing: "در حال آماده‌سازی",
  ready_for_pickup: "آماده تحویل حضوری",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
};

export const paymentStatusLabelsFa: Record<PaymentReviewStatus, string> = {
  pending_review: "در انتظار بررسی رسید",
  approved: "پرداخت تایید شد",
  rejected: "پرداخت رد شد",
};

function findWorkspaceRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "turbo.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

export function getOrderStorePath(): string {
  return resolve(
    process.env.UFO_MOCK_DATA_DIR ?? join(findWorkspaceRoot(), "mock-data"),
    "orders.json",
  );
}

function readStore(): OrderStoreFile {
  const storePath = getOrderStorePath();
  if (!existsSync(storePath)) return emptyStore;
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8")) as OrderStoreFile;
    return Array.isArray(parsed.orders) ? parsed : emptyStore;
  } catch {
    return emptyStore;
  }
}

function writeStore(store: OrderStoreFile): void {
  const storePath = getOrderStorePath();
  mkdirSync(dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  if (existsSync(storePath)) rmSync(storePath, { force: true });
  renameSync(tempPath, storePath);
}

function createEvent(
  orderId: string,
  status: OrderStatus,
  actor: OrderTimelineEvent["actor"],
  labelFa: string,
): OrderTimelineEvent {
  const now = new Date().toISOString();
  return {
    id: `evt_${crypto.randomUUID()}`,
    orderId,
    actor,
    labelFa,
    status,
    createdAt: now,
  };
}

function createItemSnapshots(
  lines: CartSubmissionLine[],
  channel: SalesChannel,
): OrderItemSnapshot[] {
  if (lines.length === 0) throw new Error("سبد خرید خالی است.");

  return lines.map((line) => {
    const variant = variants.find((item) => item.id === line.variantId);
    if (!variant) throw new Error("واریانت محصول پیدا نشد.");
    const product = products.find((item) => item.id === variant.productId);
    if (!product) throw new Error("محصول پیدا نشد.");

    if (channel === "wholesale") {
      const cartonCount = line.cartonCount ?? Math.ceil(line.quantity / variant.cartonSize);
      return createOrderItemSnapshot({ product, variant, channel, cartonCount });
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("تعداد محصول باید عدد صحیح و مثبت باشد.");
    }
    const snapshot = createOrderItemSnapshot({
      product,
      variant,
      channel,
      quantity: line.quantity,
    });
    const color = line.colorId
      ? getProductColorOptions(product).find((item) => item.id === line.colorId)
      : undefined;
    return color
      ? {
          ...snapshot,
          selectedAttributes: [
            ...snapshot.selectedAttributes,
            { nameFa: "رنگ", valueFa: color.labelFa, technicalValue: color.id },
          ],
        }
      : snapshot;
  });
}

function updatePaymentStatus(
  status: OrderStatus,
  current: PaymentReviewStatus,
): PaymentReviewStatus {
  if (["confirmed", "processing", "ready_for_pickup", "shipped", "delivered"].includes(status))
    return "approved";
  if (status === "cancelled" || status === "returned") return "rejected";
  return current;
}

export function listSubmittedOrders(
  filters: { channel?: SalesChannel; phone?: string } = {},
): SubmittedOrder[] {
  const phone = filters.phone ? normalizeIranPhone(filters.phone) : undefined;
  return readStore()
    .orders.filter((order) => {
      if (filters.channel && order.channel !== filters.channel) return false;
      if (phone && order.customer.phone !== phone) return false;
      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getSubmittedOrder(orderId: string): SubmittedOrder | undefined {
  return readStore().orders.find((order) => order.id === orderId || order.orderNumber === orderId);
}

export function createSubmittedOrder(input: CreateSubmittedOrderInput): SubmittedOrder {
  const phone = normalizeIranPhone(input.phone);
  const customerName = input.customerName.trim();
  if (!customerName) throw new Error("نام مشتری الزامی است.");

  const quote = quoteShipping(
    {
      ...input.address,
      receiverName: input.address.receiverName || customerName,
      receiverPhone: input.address.receiverPhone || phone,
    },
    input.shippingMethod,
  );
  if (!quote.available)
    throw new Error(quote.reasonFa ?? "این روش ارسال برای آدرس انتخاب‌شده فعال نیست.");

  const store = readStore();
  const items = createItemSnapshots(input.lines, input.channel);
  const id = `ord_${crypto.randomUUID()}`;
  const order = createOrder({
    id,
    channel: input.channel,
    items,
    sequence: store.orders.length + 1,
    userId: `phone_${phone}`,
    shippingRial: quote.costRial,
    paymentMethod: input.paymentMethod ?? "card_to_card",
    shippingMethod: quote.method,
  });
  const totals = calculateOrderTotals(items, quote.costRial);
  const submitted: SubmittedOrder = {
    ...order,
    status: "payment_under_review",
    subtotalRial: totals.subtotalRial,
    discountRial: totals.discountRial,
    totalRial: totals.totalRial,
    customer: {
      phone,
      fullName: customerName,
      ...(input.businessName?.trim() ? { businessName: input.businessName.trim() } : {}),
    },
    shippingAddress: {
      ...input.address,
      receiverName: input.address.receiverName || customerName,
      receiverPhone: phone,
    },
    shippingTitleFa: quote.titleFa,
    etaFa: quote.etaFa,
    paymentStatus: "pending_review",
    receiptNote: input.receiptNote?.trim() ?? "",
    timeline: [
      createEvent(
        id,
        "payment_under_review",
        "customer",
        "سفارش ثبت شد و رسید پرداخت برای بررسی ادمین ارسال شد.",
      ),
    ],
    chat: [],
  };

  writeStore({ orders: [submitted, ...store.orders] });
  return submitted;
}

export function updateSubmittedOrderStatus(
  orderId: string,
  status: OrderStatus,
  labelFa?: string,
): SubmittedOrder {
  const store = readStore();
  const index = store.orders.findIndex(
    (order) => order.id === orderId || order.orderNumber === orderId,
  );
  if (index < 0) throw new Error("سفارش پیدا نشد.");

  const current = store.orders[index];
  if (!current) throw new Error("سفارش پیدا نشد.");
  const next: SubmittedOrder = {
    ...current,
    status,
    paymentStatus: updatePaymentStatus(status, current.paymentStatus),
    updatedAt: new Date().toISOString(),
    timeline: [
      createEvent(
        current.id,
        status,
        "admin",
        labelFa ?? `وضعیت سفارش به «${orderStatusLabelsFa[status]}» تغییر کرد.`,
      ),
      ...current.timeline,
    ],
  };

  const orders = [...store.orders];
  orders[index] = next;
  writeStore({ orders });
  return next;
}

export function listChatMessages(orderId: string): ChatMessageRecord[] {
  return getSubmittedOrder(orderId)?.chat ?? [];
}

export function appendChatMessage(args: {
  orderId: string;
  sender: ChatSender;
  body: string;
  attachments?: ChatMessageRecord["attachments"];
  replyToId?: string;
}): ChatMessageRecord {
  const body = args.body.trim();
  const attachments = args.attachments?.filter((item) => item.url.trim()) ?? [];
  if (!body && attachments.length === 0) throw new Error("متن پیام یا تصویر الزامی است.");
  const store = readStore();
  const index = store.orders.findIndex(
    (order) => order.id === args.orderId || order.orderNumber === args.orderId,
  );
  if (index < 0) throw new Error("سفارش پیدا نشد.");
  const current = store.orders[index];
  if (!current) throw new Error("سفارش پیدا نشد.");

  const message: ChatMessageRecord = {
    id: `msg_${crypto.randomUUID()}`,
    orderId: current.id,
    sender: args.sender,
    body,
    ...(attachments.length > 0 ? { attachments } : {}),
    ...(args.replyToId ? { replyToId: args.replyToId } : {}),
    ...(args.sender === "admin"
      ? { readByAdminAt: new Date().toISOString() }
      : { readByCustomerAt: new Date().toISOString() }),
    createdAt: new Date().toISOString(),
  };

  const next: SubmittedOrder = {
    ...current,
    updatedAt: message.createdAt,
    chat: [...current.chat, message],
  };
  const orders = [...store.orders];
  orders[index] = next;
  writeStore({ orders });
  return message;
}

export function editChatMessage(args: {
  orderId: string;
  messageId: string;
  sender: ChatSender;
  body: string;
}): ChatMessageRecord {
  const body = args.body.trim();
  if (!body) throw new Error("متن پیام خالی است.");
  const store = readStore();
  const orderIndex = store.orders.findIndex(
    (order) => order.id === args.orderId || order.orderNumber === args.orderId,
  );
  if (orderIndex < 0) throw new Error("سفارش پیدا نشد.");
  const current = store.orders[orderIndex];
  if (!current) throw new Error("سفارش پیدا نشد.");
  const message = current.chat.find((entry) => entry.id === args.messageId);
  if (!message) throw new Error("پیام پیدا نشد.");
  if (message.sender !== args.sender) throw new Error("ویرایش این پیام مجاز نیست.");

  const editedAt = new Date().toISOString();
  const nextMessage: ChatMessageRecord = { ...message, body, editedAt };
  const next: SubmittedOrder = {
    ...current,
    updatedAt: editedAt,
    chat: current.chat.map((entry) => (entry.id === args.messageId ? nextMessage : entry)),
  };
  const orders = [...store.orders];
  orders[orderIndex] = next;
  writeStore({ orders });
  return nextMessage;
}

export function markChatMessagesRead(orderId: string, reader: ChatSender): ChatMessageRecord[] {
  const store = readStore();
  const orderIndex = store.orders.findIndex(
    (order) => order.id === orderId || order.orderNumber === orderId,
  );
  if (orderIndex < 0) return [];
  const current = store.orders[orderIndex];
  if (!current) return [];
  const readAt = new Date().toISOString();
  const chat = current.chat.map((message) => {
    if (reader === "admin" && message.sender === "customer" && !message.readByAdminAt) {
      return { ...message, readByAdminAt: readAt };
    }
    if (reader === "customer" && message.sender === "admin" && !message.readByCustomerAt) {
      return { ...message, readByCustomerAt: readAt };
    }
    return message;
  });
  const orders = [...store.orders];
  orders[orderIndex] = { ...current, chat, updatedAt: readAt };
  writeStore({ orders });
  return chat;
}

export function resetSubmittedOrderStoreForTests(): void {
  const storePath = getOrderStorePath();
  if (existsSync(storePath)) rmSync(storePath, { force: true });
}
