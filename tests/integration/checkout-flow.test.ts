import { describe, expect, it } from "vitest";
import {
  createInvoice,
  createOrder,
  createOrderItemSnapshot,
  getPrimaryVariant,
  products,
  quoteShipping,
} from "@ufo/domain";

const product = products[0];

if (!product) {
  throw new Error("product fixture is missing");
}

describe("checkout integration", () => {
  it("creates retail order, shipping quote and invoice", () => {
    const variant = getPrimaryVariant(product.id);
    const item = createOrderItemSnapshot({ product, variant, channel: "retail", quantity: 2 });
    const quote = quoteShipping(
      {
        province: "تهران",
        city: "تهران",
        line1: "بازار مولوی",
        receiverName: "امیر محمودی",
        receiverPhone: "09362157181",
      },
      "tehran_courier",
    );
    const order = createOrder({
      id: "order_1",
      channel: "retail",
      items: [item],
      sequence: 1,
      shippingRial: quote.costRial,
      shippingMethod: quote.method,
      now: new Date("2026-08-02T08:00:00.000Z"),
    });
    const invoice = createInvoice({
      id: "invoice_1",
      order,
      sequence: 1,
      secureTokenHash: "hash",
      now: new Date("2026-08-02T08:00:00.000Z"),
    });
    expect(quote.available).toBe(true);
    expect(order.orderNumber).toBe("RTL-20260802-00001");
    expect(invoice.totalRial).toBe(order.totalRial);
  });

  it("rejects Tehran courier outside Tehran", () => {
    const quote = quoteShipping(
      {
        province: "فارس",
        city: "شیراز",
        line1: "مرکز شهر",
        receiverName: "کاربر تست",
        receiverPhone: "09362157181",
      },
      "tehran_courier",
    );
    expect(quote.available).toBe(false);
    expect(quote.reasonFa).toContain("تهران");
  });
});
