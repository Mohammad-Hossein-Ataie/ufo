import type { PaymentReviewStatus, SubmittedOrder } from "@ufo/orders";
import type { OrderStatus, SalesChannel } from "@ufo/types";

export type AdminOrderStatusFilter = OrderStatus | "all" | "active";
export type AdminOrderPaymentFilter = "all" | "pending_review" | "approved" | "rejected";
export type AdminOrderSortKey = "createdAt" | "totalRial" | "status" | "customer";
export type AdminOrderSortDirection = "asc" | "desc";

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  channel: SalesChannel;
  status: OrderStatus;
  paymentStatus: PaymentReviewStatus;
  totalRial: number;
  createdAt: string;
  shippingMethod: string;
  shippingScope?: "nationwide" | "tehran" | "pickup";
  shippingTitleFa: string;
  etaFa: string;
  estimatedDispatchAt?: string;
  customer: { phone: string; fullName: string; businessName?: string };
  shippingAddress: { province: string; city: string };
  itemCount: number;
  unitCount: number;
  cartonCount: number;
  firstProductName: string;
  chatCount: number;
}

export interface AdminOrderDashboardSummary {
  openOrders: number;
  paymentReview: number;
  processing: number;
  readyToShip: number;
  totalRevenue: number;
  wholesaleOrders: number;
}

export interface AdminOrderQuery {
  channel: SalesChannel | "all";
  status: AdminOrderStatusFilter;
  payment: AdminOrderPaymentFilter;
  shipping: string;
  q: string;
  sort: AdminOrderSortKey;
  direction: AdminOrderSortDirection;
  page: number;
  pageSize: number;
}

const activeStatuses: OrderStatus[] = [
  "awaiting_payment",
  "awaiting_receipt",
  "payment_under_review",
  "confirmed",
  "processing",
  "ready_for_pickup",
  "shipped",
];

function customerName(order: SubmittedOrder | AdminOrderSummary) {
  return order.customer.businessName ?? order.customer.fullName;
}

export function toAdminOrderSummary(order: SubmittedOrder): AdminOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    channel: order.channel,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalRial: order.totalRial,
    createdAt: order.createdAt,
    shippingMethod: order.shippingMethod,
    ...(order.shippingScope ? { shippingScope: order.shippingScope } : {}),
    shippingTitleFa: order.shippingTitleFa,
    etaFa: order.etaFa,
    ...(order.estimatedDispatchAt ? { estimatedDispatchAt: order.estimatedDispatchAt } : {}),
    customer: {
      phone: order.customer.phone,
      fullName: order.customer.fullName,
      ...(order.customer.businessName ? { businessName: order.customer.businessName } : {}),
    },
    shippingAddress: {
      province: order.shippingAddress.province,
      city: order.shippingAddress.city,
    },
    itemCount: order.items.length,
    unitCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    cartonCount: order.items.reduce((sum, item) => sum + (item.cartonCount ?? 0), 0),
    firstProductName: order.items[0]?.productName ?? "",
    chatCount: order.chat.length,
  };
}

function dashboardSummary(orders: SubmittedOrder[]): AdminOrderDashboardSummary {
  return {
    openOrders: orders.filter((order) => activeStatuses.includes(order.status)).length,
    paymentReview: orders.filter((order) => order.paymentStatus === "pending_review").length,
    processing: orders.filter((order) => order.status === "processing").length,
    readyToShip: orders.filter((order) => order.status === "ready_for_pickup").length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalRial, 0),
    wholesaleOrders: orders.filter((order) => order.channel === "wholesale").length,
  };
}

function compareOrders(left: SubmittedOrder, right: SubmittedOrder, sort: AdminOrderSortKey) {
  if (sort === "createdAt") return left.createdAt.localeCompare(right.createdAt);
  if (sort === "totalRial") return left.totalRial - right.totalRial;
  if (sort === "status") return left.status.localeCompare(right.status);
  return customerName(left).localeCompare(customerName(right), "fa");
}

export function queryAdminOrders(allOrders: SubmittedOrder[], query: AdminOrderQuery) {
  const channelOrders = allOrders.filter(
    (order) => query.channel === "all" || order.channel === query.channel,
  );
  const normalized = query.q.trim().toLocaleLowerCase("fa");
  const filtered = channelOrders
    .filter((order) => {
      const matchesStatus =
        query.status === "all" ||
        (query.status === "active" && activeStatuses.includes(order.status)) ||
        order.status === query.status;
      const matchesPayment = query.payment === "all" || order.paymentStatus === query.payment;
      const matchesShipping = query.shipping === "all" || order.shippingMethod === query.shipping;
      if (!matchesStatus || !matchesPayment || !matchesShipping) return false;
      if (!normalized) return true;
      return [
        order.orderNumber,
        customerName(order),
        order.customer.fullName,
        order.customer.businessName,
        order.customer.phone,
        order.shippingAddress.city,
        order.shippingAddress.province,
        ...order.items.map((item) => item.productName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fa")
        .includes(normalized);
    })
    .sort((left, right) => {
      const result = compareOrders(left, right, query.sort);
      return (query.direction === "asc" ? result : -result) || left.id.localeCompare(right.id);
    });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const pageOrders = filtered.slice((page - 1) * query.pageSize, page * query.pageSize);
  const priorityOrders = filtered
    .filter(
      (order) => order.paymentStatus === "pending_review" || order.status === "ready_for_pickup",
    )
    .slice(0, 3)
    .map(toAdminOrderSummary);

  return {
    orders: pageOrders.map(toAdminOrderSummary),
    priorityOrders,
    summary: dashboardSummary(channelOrders),
    shippingMethods: Array.from(new Set(channelOrders.map((order) => order.shippingMethod))),
    total,
    channelTotal: channelOrders.length,
    page,
    pageSize: query.pageSize,
    totalPages,
  };
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseAdminOrderQuery(url: URL): AdminOrderQuery {
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  return {
    channel: oneOf(url.searchParams.get("channel"), ["all", "retail", "wholesale"], "all"),
    status: oneOf(
      url.searchParams.get("status"),
      [
        "all",
        "active",
        "draft",
        "awaiting_payment",
        "awaiting_receipt",
        "payment_under_review",
        "confirmed",
        "processing",
        "ready_for_pickup",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      "active",
    ),
    payment: oneOf(
      url.searchParams.get("payment"),
      ["all", "pending_review", "approved", "rejected"],
      "all",
    ),
    shipping: (url.searchParams.get("shipping") ?? "all").slice(0, 80),
    q: (url.searchParams.get("q") ?? "").trim().slice(0, 160),
    sort: oneOf(
      url.searchParams.get("sort"),
      ["createdAt", "totalRial", "status", "customer"],
      "createdAt",
    ),
    direction: oneOf(url.searchParams.get("direction"), ["asc", "desc"], "desc"),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: 40,
  };
}
