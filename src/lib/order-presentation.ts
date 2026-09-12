import type { OrderStatus } from "@ufo/types";

export const orderStatusLabelsFa: Record<OrderStatus, string> = {
  draft: "پیش‌نویس",
  awaiting_payment: "در انتظار پرداخت",
  awaiting_receipt: "در انتظار ارسال رسید",
  payment_under_review: "در انتظار تأیید پرداخت",
  confirmed: "تأیید شده",
  processing: "در حال آماده‌سازی",
  ready_for_pickup: "آماده تحویل حضوری",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
};

export function orderStatusTone(status: OrderStatus) {
  if (status === "delivered" || status === "confirmed") return "success" as const;
  if (status === "cancelled" || status === "returned") return "danger" as const;
  if (["awaiting_payment", "awaiting_receipt", "payment_under_review"].includes(status))
    return "warning" as const;
  return "info" as const;
}

export interface OrderPaginationData {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}
