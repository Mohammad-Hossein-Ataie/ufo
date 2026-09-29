import { describe, expect, it } from "vitest";
import type { SubmittedOrder } from "@ufo/orders";
import { queryAdminOrders } from "@/lib/admin-order-query";

function order(
  id: string,
  overrides: Partial<SubmittedOrder> = {},
): SubmittedOrder {
  return {
    id,
    orderNumber: `UFO-${id}`,
    userId: `customer-${id}`,
    channel: "retail",
    status: "processing",
    items: [
      {
        productName: `محصول ${id}`,
        variantName: "پایه",
        sku: `SKU-${id}`,
        image: "/image.webp",
        selectedAttributes: [],
        pricingMode: "retail",
        unitPriceRial: 1_000_000,
        quantity: 2,
        discountRial: 0,
        totalRial: 2_000_000,
      },
    ],
    subtotalRial: 2_000_000,
    discountRial: 0,
    shippingRial: 0,
    totalRial: 2_000_000,
    paymentMethod: "card_to_card",
    shippingMethod: "tipax",
    createdAt: `2026-09-${id.padStart(2, "0")}T08:00:00.000Z`,
    updatedAt: `2026-09-${id.padStart(2, "0")}T08:00:00.000Z`,
    customer: { phone: `091200000${id.padStart(2, "0")}`, fullName: `مشتری ${id}` },
    shippingAddress: {
      province: "تهران",
      city: "تهران",
      line1: "نشانی کامل خصوصی",
      receiverName: `مشتری ${id}`,
      receiverPhone: `091200000${id.padStart(2, "0")}`,
    },
    shippingTitleFa: "تیپاکس",
    etaFa: "۲ روز",
    paymentStatus: "approved",
    receiptNote: "یادداشت خصوصی",
    receipts: [],
    timeline: [],
    chat: [
      {
        id: `message-${id}`,
        sender: "customer",
        text: "متن خصوصی گفتگو",
        createdAt: "2026-09-29T08:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

const baseQuery = {
  channel: "all" as const,
  status: "all" as const,
  payment: "all" as const,
  shipping: "all",
  q: "",
  sort: "createdAt" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 2,
};

describe("admin order list query", () => {
  it("paginates and projects heavy/private fields out of the list payload", () => {
    const result = queryAdminOrders([order("01"), order("02"), order("03")], baseQuery);
    expect(result.total).toBe(3);
    expect(result.orders).toHaveLength(2);
    expect(result.totalPages).toBe(2);
    expect(result.orders[0]).toMatchObject({ id: "03", itemCount: 1, unitCount: 2, chatCount: 1 });
    expect(result.orders[0]).not.toHaveProperty("chat");
    expect(result.orders[0]).not.toHaveProperty("timeline");
    expect(result.orders[0]).not.toHaveProperty("receipts");
    expect(result.orders[0]!.shippingAddress).toEqual({ province: "تهران", city: "تهران" });
  });

  it("filters before pagination while keeping channel summary totals stable", () => {
    const orders = [
      order("01"),
      order("02", { channel: "wholesale", paymentStatus: "pending_review" }),
      order("03", { channel: "wholesale", status: "delivered" }),
    ];
    const result = queryAdminOrders(orders, {
      ...baseQuery,
      channel: "wholesale",
      status: "active",
      q: "مشتری 02",
    });
    expect(result.orders.map((item) => item.id)).toEqual(["02"]);
    expect(result.channelTotal).toBe(2);
    expect(result.summary.paymentReview).toBe(1);
    expect(result.summary.wholesaleOrders).toBe(2);
  });
});
