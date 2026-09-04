import {
  calculateOrderTotals,
  createOrder,
  createOrderItemSnapshot,
  getProductFlavorOptions,
  getProductColorOptions,
  getProductVariantOptions,
  getUnitPriceRial,
  products,
  quoteShipping,
  validateWholesaleCartonCount,
  variants,
} from "@ufo/domain";
import type {
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PaymentMethod,
  Cart,
  CartItem,
  Customer,
  CustomerType,
  ProductVariantType,
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
  selectedVariant?: {
    type: Exclude<ProductVariantType, "none">;
    valueId: string;
  };
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

function getSelectedVariantLabel(type: Exclude<ProductVariantType, "none">) {
  if (type === "flavor") return "طعم";
  if (type === "color") return "رنگ";
  if (type === "resistance") return "اهم";
  return "ظرفیت";
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
  customerId?: string;
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

interface CustomerStoreFile {
  customers: Customer[];
  carts: Cart[];
}

const emptyCustomerStore: CustomerStoreFile = { customers: [], carts: [] };

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

export function getCustomerStorePath(): string {
  return resolve(
    process.env.UFO_MOCK_DATA_DIR ?? join(findWorkspaceRoot(), "mock-data"),
    "customer-accounts.json",
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

function readCustomerStore(): CustomerStoreFile {
  const storePath = getCustomerStorePath();
  if (!existsSync(storePath)) return emptyCustomerStore;
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8")) as CustomerStoreFile;
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      carts: Array.isArray(parsed.carts) ? parsed.carts : [],
    };
  } catch {
    return emptyCustomerStore;
  }
}

function writeCustomerStore(store: CustomerStoreFile): void {
  const storePath = getCustomerStorePath();
  mkdirSync(dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${Date.now()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  if (existsSync(storePath)) rmSync(storePath, { force: true });
  renameSync(tempPath, storePath);
}

function trimOptional(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function getCustomerKey(phone: string, customerType: CustomerType): string {
  return `${customerType}_${phone.replace(/\D/g, "")}`;
}

function getLineKey(line: Pick<CartItem, "variantId" | "selectedVariant">): string {
  return `${line.variantId ?? ""}:${line.selectedVariant?.type ?? "none"}:${
    line.selectedVariant?.valueId ?? "default"
  }`;
}

export interface CustomerProfilePatch {
  firstName?: string;
  lastName?: string;
  email?: string;
  companyName?: string;
  businessType?: string;
  taxId?: string;
  customerLevel?: string;
  pricingGroup?: string;
}

export interface CartLineInput {
  variantId: string;
  quantity: number;
  cartonCount?: number;
  selectedVariant?: {
    type: Exclude<ProductVariantType, "none">;
    valueId: string;
  };
  colorId?: string;
}

export interface CartSummary {
  subtotalRial: number;
  discountRial: number;
  totalRial: number;
}

export interface EnrichedCartItem extends CartItem {
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  totalPrice: number;
}

export interface CustomerCartView {
  cart: Cart;
  items: EnrichedCartItem[];
  summary: CartSummary;
}

function priceCartLine(line: CartLineInput, channel: SalesChannel): CartItem {
  const variant = variants.find((item) => item.id === line.variantId && item.isActive);
  if (!variant) throw new Error("واریانت محصول پیدا نشد.");
  const product = products.find((item) => item.id === variant.productId && item.isActive);
  if (!product) throw new Error("محصول پیدا نشد.");
  if (product.salesChannels && !product.salesChannels.includes(channel)) {
    throw new Error("این محصول برای این پلتفرم فعال نیست.");
  }

  let quantity = Math.floor(line.quantity);
  let cartonCount = line.cartonCount;
  if (channel === "wholesale") {
    cartonCount = Math.max(
      1,
      Math.floor(line.cartonCount ?? Math.ceil(quantity / variant.cartonSize)),
    );
    quantity = validateWholesaleCartonCount(variant, cartonCount).quantity;
  } else if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("تعداد محصول باید عدد صحیح و مثبت باشد.");
  }

  return {
    id: `ci_${crypto.randomUUID()}`,
    cartId: "",
    productId: product.id,
    variantId: variant.id,
    quantity,
    unitPriceSnapshot: getUnitPriceRial(variant, channel),
    discountAmount: 0,
    ...(channel === "wholesale" && cartonCount ? { cartonCount } : {}),
    ...(line.selectedVariant
      ? { selectedVariant: line.selectedVariant }
      : line.colorId
        ? { selectedVariant: { type: "color", valueId: line.colorId } }
        : {}),
    createdAt: new Date().toISOString(),
  };
}

function enrichCart(cart: Cart): CustomerCartView {
  const items = cart.items
    .map((item) => {
      const variant = item.variantId
        ? variants.find((entry) => entry.id === item.variantId && entry.isActive)
        : undefined;
      const product = variant
        ? products.find((entry) => entry.id === variant.productId && entry.isActive)
        : undefined;
      if (!variant || !product) return null;
      const unitPriceSnapshot = getUnitPriceRial(variant, cart.platformType);
      const refreshed: EnrichedCartItem = {
        ...item,
        productId: product.id,
        variantId: variant.id,
        unitPriceSnapshot,
        productName: product.nameFa,
        variantName: variant.nameFa,
        sku: variant.sku,
        image: product.image,
        totalPrice: unitPriceSnapshot * item.quantity - item.discountAmount,
      };
      return refreshed;
    })
    .filter((item): item is EnrichedCartItem => item !== null);
  const summary = {
    subtotalRial: items.reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0),
    discountRial: items.reduce((sum, item) => sum + item.discountAmount, 0),
    totalRial: items.reduce((sum, item) => sum + item.totalPrice, 0),
  };
  return { cart: { ...cart, items }, items, summary };
}

export function upsertCustomerAccount(args: {
  mobileNumber: string;
  customerType: CustomerType;
  fullName?: string;
  profile?: CustomerProfilePatch;
}): Customer {
  const mobileNumber = normalizeIranPhone(args.mobileNumber);
  const store = readCustomerStore();
  const index = store.customers.findIndex(
    (customer) =>
      customer.mobileNumber === mobileNumber && customer.customerType === args.customerType,
  );
  const nameFromFullName = splitFullName(args.fullName ?? "");
  const now = new Date().toISOString();
  const profile = args.profile ?? {};
  const firstName = trimOptional(profile.firstName) ?? nameFromFullName.firstName;
  const lastName = trimOptional(profile.lastName) ?? nameFromFullName.lastName;
  const email = trimOptional(profile.email);
  const companyName = trimOptional(profile.companyName);
  const businessType = trimOptional(profile.businessType);
  const taxId = trimOptional(profile.taxId);
  const customerLevel = trimOptional(profile.customerLevel);
  const pricingGroup = trimOptional(profile.pricingGroup);

  if (index >= 0) {
    const current = store.customers[index];
    if (!current) throw new Error("حساب مشتری پیدا نشد.");
    const next: Customer = {
      ...current,
      firstName: firstName || current.firstName,
      lastName: lastName || current.lastName,
      ...(email ? { email } : {}),
      ...(args.customerType === "wholesale"
        ? {
            companyName: companyName ?? current.companyName ?? args.fullName ?? "",
            businessType: businessType ?? current.businessType ?? "",
            ...((taxId ?? current.taxId) ? { taxId: taxId ?? current.taxId } : {}),
            customerLevel: customerLevel ?? current.customerLevel ?? "standard",
            pricingGroup: pricingGroup ?? current.pricingGroup ?? "default",
          }
        : {}),
      updatedAt: now,
    };
    const customers = [...store.customers];
    customers[index] = next;
    writeCustomerStore({ ...store, customers });
    return next;
  }

  const customer: Customer = {
    id: `cus_${getCustomerKey(mobileNumber, args.customerType)}`,
    mobileNumber,
    firstName,
    lastName,
    ...(email ? { email } : {}),
    customerType: args.customerType,
    status: "active",
    ...(args.customerType === "wholesale"
      ? {
          companyName: companyName ?? args.fullName ?? "",
          businessType: businessType ?? "retailer",
          ...(taxId ? { taxId } : {}),
          customerLevel: customerLevel ?? "standard",
          pricingGroup: pricingGroup ?? "default",
        }
      : {}),
    createdAt: now,
    updatedAt: now,
  };
  writeCustomerStore({ ...store, customers: [...store.customers, customer] });
  return customer;
}

export function getCustomerAccount(customerId: string): Customer | undefined {
  return readCustomerStore().customers.find((customer) => customer.id === customerId);
}

export function updateCustomerAccountProfile(
  customerId: string,
  patch: CustomerProfilePatch,
): Customer {
  const store = readCustomerStore();
  const index = store.customers.findIndex((customer) => customer.id === customerId);
  if (index < 0) throw new Error("حساب مشتری پیدا نشد.");
  const current = store.customers[index];
  if (!current) throw new Error("حساب مشتری پیدا نشد.");
  const next: Customer = {
    ...current,
    ...(patch.firstName !== undefined ? { firstName: patch.firstName.trim() } : {}),
    ...(patch.lastName !== undefined ? { lastName: patch.lastName.trim() } : {}),
    ...(patch.email !== undefined && patch.email.trim() ? { email: patch.email.trim() } : {}),
    ...(current.customerType === "wholesale"
      ? {
          ...(patch.companyName !== undefined ? { companyName: patch.companyName.trim() } : {}),
          ...(patch.businessType !== undefined ? { businessType: patch.businessType.trim() } : {}),
          ...(patch.taxId !== undefined ? { taxId: patch.taxId.trim() } : {}),
          ...(patch.customerLevel !== undefined
            ? { customerLevel: patch.customerLevel.trim() }
            : {}),
          ...(patch.pricingGroup !== undefined ? { pricingGroup: patch.pricingGroup.trim() } : {}),
        }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  const customers = [...store.customers];
  customers[index] = next;
  writeCustomerStore({ ...store, customers });
  return next;
}

export function getOrCreateActiveCart(customerId: string, platformType: SalesChannel): Cart {
  const store = readCustomerStore();
  const customer = store.customers.find((item) => item.id === customerId);
  if (!customer || customer.customerType !== platformType)
    throw new Error("حساب مشتری معتبر نیست.");
  const existing = store.carts.find(
    (cart) =>
      cart.customerId === customerId &&
      cart.platformType === platformType &&
      cart.status === "ACTIVE",
  );
  if (existing) return existing;
  const now = new Date().toISOString();
  const cart: Cart = {
    id: `cart_${crypto.randomUUID()}`,
    customerId,
    platformType,
    status: "ACTIVE",
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  writeCustomerStore({ ...store, carts: [...store.carts, cart] });
  return cart;
}

export function getCustomerCart(customerId: string, platformType: SalesChannel): CustomerCartView {
  return enrichCart(getOrCreateActiveCart(customerId, platformType));
}

function saveCart(nextCart: Cart): Cart {
  const store = readCustomerStore();
  const index = store.carts.findIndex((cart) => cart.id === nextCart.id);
  const carts = [...store.carts];
  if (index >= 0) carts[index] = nextCart;
  else carts.push(nextCart);
  writeCustomerStore({ ...store, carts });
  return nextCart;
}

export function addCartItem(
  customerId: string,
  platformType: SalesChannel,
  line: CartLineInput,
): CustomerCartView {
  const cart = getOrCreateActiveCart(customerId, platformType);
  const priced = { ...priceCartLine(line, platformType), cartId: cart.id };
  const existing = cart.items.find((item) => getLineKey(item) === getLineKey(priced));
  const nextItems = existing
    ? cart.items.map((item) =>
        item.id === existing.id
          ? {
              ...priced,
              id: item.id,
              quantity: item.quantity + priced.quantity,
              ...(platformType === "wholesale"
                ? { cartonCount: (item.cartonCount ?? 0) + (priced.cartonCount ?? 0) }
                : {}),
              createdAt: item.createdAt,
            }
          : item,
      )
    : [...cart.items, priced];
  return enrichCart(saveCart({ ...cart, items: nextItems, updatedAt: new Date().toISOString() }));
}

export function updateCartItem(
  customerId: string,
  platformType: SalesChannel,
  itemId: string,
  quantity: number,
  cartonCount?: number,
): CustomerCartView {
  const cart = getOrCreateActiveCart(customerId, platformType);
  const current = cart.items.find((item) => item.id === itemId);
  if (!current) throw new Error("آیتم سبد خرید پیدا نشد.");
  const repriced = priceCartLine(
    {
      variantId: current.variantId ?? "",
      quantity,
      ...(cartonCount !== undefined ? { cartonCount } : {}),
      ...(current.selectedVariant ? { selectedVariant: current.selectedVariant } : {}),
    },
    platformType,
  );
  const nextItems = cart.items
    .map((item) =>
      item.id === itemId
        ? { ...repriced, id: item.id, cartId: cart.id, createdAt: item.createdAt }
        : item,
    )
    .filter((item) => item.quantity > 0);
  return enrichCart(saveCart({ ...cart, items: nextItems, updatedAt: new Date().toISOString() }));
}

export function removeCartItem(
  customerId: string,
  platformType: SalesChannel,
  itemId: string,
): CustomerCartView {
  const cart = getOrCreateActiveCart(customerId, platformType);
  if (!cart.items.some((item) => item.id === itemId)) throw new Error("آیتم سبد خرید پیدا نشد.");
  return enrichCart(
    saveCart({
      ...cart,
      items: cart.items.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function mergeGuestCart(
  customerId: string,
  platformType: SalesChannel,
  lines: CartLineInput[],
): CustomerCartView {
  let view = getCustomerCart(customerId, platformType);
  for (const line of lines) {
    view = addCartItem(customerId, platformType, line);
  }
  return view;
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

    const option =
      line.selectedVariant ??
      (line.colorId ? ({ type: "color", valueId: line.colorId } as const) : undefined);
    const selectedValue =
      option?.type === "flavor"
        ? getProductFlavorOptions(product).find((item) => item.id === option.valueId)
        : option?.type === "color"
          ? getProductColorOptions(product).find((item) => item.id === option.valueId)
          : option
            ? getProductVariantOptions(product).find((item) => item.id === option.valueId)
            : undefined;
    const withSelectedOption = (snapshot: OrderItemSnapshot) =>
      option && selectedValue
        ? {
            ...snapshot,
            selectedAttributes: [
              ...snapshot.selectedAttributes,
              {
                nameFa: getSelectedVariantLabel(option.type),
                valueFa: "labelFa" in selectedValue ? selectedValue.labelFa : selectedValue.nameFa,
                technicalValue: option.valueId,
              },
            ],
          }
        : snapshot;

    if (channel === "wholesale") {
      const cartonCount = line.cartonCount ?? Math.ceil(line.quantity / variant.cartonSize);
      return withSelectedOption(
        createOrderItemSnapshot({ product, variant, channel, cartonCount }),
      );
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("تعداد محصول باید عدد صحیح و مثبت باشد.");
    }
    return withSelectedOption(
      createOrderItemSnapshot({
        product,
        variant,
        channel,
        quantity: line.quantity,
      }),
    );
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
  filters: { channel?: SalesChannel; phone?: string; customerId?: string } = {},
): SubmittedOrder[] {
  const phone = filters.phone ? normalizeIranPhone(filters.phone) : undefined;
  return readStore()
    .orders.filter((order) => {
      if (filters.channel && order.channel !== filters.channel) return false;
      if (filters.customerId && order.userId !== filters.customerId) return false;
      if (phone && order.customer.phone !== phone) return false;
      return true;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getSubmittedOrder(orderId: string): SubmittedOrder | undefined {
  return readStore().orders.find((order) => order.id === orderId || order.orderNumber === orderId);
}

export function getSubmittedOrderForCustomer(
  orderId: string,
  customerId: string,
  channel: SalesChannel,
): SubmittedOrder | undefined {
  const order = getSubmittedOrder(orderId);
  if (!order || order.channel !== channel || order.userId !== customerId) return undefined;
  return order;
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
    userId: input.customerId ?? `phone_${phone}`,
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

export function checkoutCustomerCart(
  input: Omit<CreateSubmittedOrderInput, "lines">,
): SubmittedOrder {
  if (!input.customerId) throw new Error("ورود مشتری برای ثبت سفارش الزامی است.");
  const customer = getCustomerAccount(input.customerId);
  if (!customer || customer.customerType !== input.channel) {
    throw new Error("حساب مشتری معتبر نیست.");
  }
  const cart = getOrCreateActiveCart(input.customerId, input.channel);
  if (cart.items.length === 0) throw new Error("سبد خرید خالی است.");
  const order = createSubmittedOrder({
    ...input,
    lines: cart.items.map((item) => ({
      variantId: item.variantId ?? "",
      quantity: item.quantity,
      ...(item.cartonCount ? { cartonCount: item.cartonCount } : {}),
      ...(item.selectedVariant ? { selectedVariant: item.selectedVariant } : {}),
    })),
  });
  saveCart({ ...cart, status: "CHECKED_OUT", updatedAt: new Date().toISOString() });
  return order;
}

export function reorderSubmittedOrder(args: {
  orderId: string;
  customerId: string;
  channel: SalesChannel;
}): CustomerCartView {
  const order = getSubmittedOrderForCustomer(args.orderId, args.customerId, args.channel);
  if (!order) throw new Error("سفارش پیدا نشد یا متعلق به این حساب نیست.");
  let view = getCustomerCart(args.customerId, args.channel);
  for (const item of order.items) {
    const variant = variants.find((entry) => entry.sku === item.sku && entry.isActive);
    if (!variant) continue;
    view = addCartItem(args.customerId, args.channel, {
      variantId: variant.id,
      quantity: item.quantity,
      ...(item.cartonCount ? { cartonCount: item.cartonCount } : {}),
    });
  }
  return view;
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
