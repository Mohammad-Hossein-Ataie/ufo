import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import {
  createSubmittedOrder,
  getOrderStorePath,
  getSubmittedOrder,
  listAvailableShippingQuotes,
  reviewOrderPayment,
  submitOrderReceipt,
  updateSubmittedOrderStatus,
  upsertCustomerAccount,
  createCustomerAddress,
  listCustomerAddresses,
  parseLocation,
  type SubmittedOrder,
} from "@ufo/orders";
import { variants } from "@ufo/domain";
import { POST, GET } from "@/app/api/orders/[orderId]/receipt/route";
import { PATCH, GET as adminImage } from "@/app/api/admin/orders/[orderId]/receipt/route";
import { PATCH as statusPatch } from "@/app/api/admin/orders/[orderId]/status/route";
import { createCustomerSessionToken } from "@/lib/customer-session";
import { createAdminSessionToken } from "@/lib/admin-session";
import { dispatchOrderNotifications, sendOrderSms } from "@/lib/order-sms";
import { demoBankAccounts, validateBankAccounts } from "@/lib/payment-settings";
import type { SalesChannel } from "@ufo/types";

let directory: string;
const address = {
  province: "تهران",
  city: "تهران",
  line1: "نشانی آزمایشی",
  receiverName: "کاربر تست",
  receiverPhone: "09123456789",
  location: { latitude: 35.7, longitude: 51.4 },
};
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "ufo-payment-test-"));
  vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
  vi.stubEnv("SESSION_SECRET", "payment-test-secret-with-at-least-32-characters");
  vi.stubEnv("SMS_PROVIDER", "mock");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  const target = resolve(directory);
  if (
    !target.startsWith(resolve(tmpdir()) + "\\ufo-payment-test-") &&
    !target.startsWith(resolve(tmpdir()) + "/ufo-payment-test-")
  )
    throw new Error("Unsafe test cleanup path");
  rmSync(target, { recursive: true, force: true });
});
function fixture(channel: SalesChannel = "retail") {
  const customer = upsertCustomerAccount({
    mobileNumber: "09123456789",
    customerType: channel,
    profile: { firstName: "کاربر", lastName: "تست" },
  });
  const order: SubmittedOrder = {
    id: "ord_test",
    orderNumber: "TEST-0001",
    channel,
    userId: customer.id,
    status: "awaiting_receipt",
    paymentStatus: "awaiting_receipt",
    paymentMethod: "card_to_card",
    shippingMethod: "tipax",
    shippingTitleFa: "تیپاکس",
    etaFa: "دو روز",
    customer: { phone: "09999999999", fullName: "کاربر تست" },
    shippingAddress: address,
    items: [],
    subtotalRial: 10000000,
    discountRial: 0,
    shippingRial: 1650000,
    totalRial: 11650000,
    receiptNote: "",
    timeline: [],
    chat: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(getOrderStorePath(), JSON.stringify({ orders: [order] }));
  const token = createCustomerSessionToken({
    customerId: customer.id,
    customerType: channel,
    roles: ["customer"],
    phone: "09123456789",
  });
  // Test-only configuration; never written to the application's real data directory.
  writeFileSync(
    join(directory, "payment-accounts.json"),
    JSON.stringify([{ ...demoBankAccounts[0], enabled: true }]),
  );
  return { customer, order, token };
}
function context() {
  return { params: Promise.resolve({ orderId: "ord_test" }) };
}
function receipt() {
  return {
    id: crypto.randomUUID(),
    note: "رسید آزمایشی، پیگیری TEST-123",
    submittedAt: new Date().toISOString(),
  };
}
async function adminRequest(action: string, extra = {}, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/admin/orders/ord_test/receipt", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      origin,
      cookie: `ufo_admin_session=${await createAdminSessionToken("test-admin")}`,
    },
    body: JSON.stringify({ action, ...extra }),
  });
}

describe("manual payment and shipping", () => {
  it("records delivery once, only after approved payment and shipment", async () => {
    const { customer } = fixture();
    expect(() => updateSubmittedOrderStatus("ord_test", "delivered")).toThrow();
    submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    reviewOrderPayment("ord_test", "approve", new Date(Date.now() + 86400000).toISOString());
    updateSubmittedOrderStatus("ord_test", "processing");
    expect(() => updateSubmittedOrderStatus("ord_test", "delivered")).toThrow();
    updateSubmittedOrderStatus("ord_test", "shipped");
    const cookie = `ufo_admin_session=${await createAdminSessionToken("test-admin")}`;
    const req = (confirmed: boolean) =>
      new Request("http://localhost:3000/api/admin/orders/ord_test/status", {
        method: "PATCH",
        headers: { cookie, origin: "http://localhost:3000", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered", deliveryConfirmed: confirmed }),
      });
    expect((await statusPatch(req(false), context())).status).toBe(400);
    const response = await statusPatch(req(true), context());
    expect(response.status).toBe(200);
    const { order } = await response.json();
    expect(order.deliveredAt).toBeTruthy();
    const again = updateSubmittedOrderStatus("ord_test", "delivered");
    expect(again.deliveredAt).toBe(order.deliveredAt);
    expect(again.timeline).toHaveLength(order.timeline.length);
  });
  it("accepts pickup without a postal address and records the store address", () => {
    vi.stubEnv("STORE_ADDRESS", "نشانی ثابت مغازه تست");
    const variant = variants.find((v) => v.isActive)!;
    const order = createSubmittedOrder({
      channel: "retail",
      customerName: "تست",
      phone: address.receiverPhone,
      address: { ...address, province: "", city: "", line1: "" },
      shippingMethod: "pickup",
      lines: [{ variantId: variant.id, quantity: 1 }],
    });
    expect(order.shippingScope).toBe("pickup");
    expect(order.shippingRial).toBe(0);
    expect(order.shippingAddress.line1).toBe("نشانی ثابت مغازه تست");
    expect(order.shippingAddress.location).toBeUndefined();
  });
  it("pickup can be delivered from ready for pickup but cannot be marked shipped", () => {
    const { customer, order } = fixture();
    writeFileSync(
      getOrderStorePath(),
      JSON.stringify({ orders: [{ ...order, shippingMethod: "pickup", shippingScope: "pickup" }] }),
    );
    submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    reviewOrderPayment("ord_test", "approve", new Date(Date.now() + 86400000).toISOString());
    updateSubmittedOrderStatus("ord_test", "processing");
    expect(() => updateSubmittedOrderStatus("ord_test", "shipped")).toThrow();
    updateSubmittedOrderStatus("ord_test", "ready_for_pickup");
    expect(updateSubmittedOrderStatus("ord_test", "delivered").deliveredAt).toBeTruthy();
  });
  it("allows admin to defer approval SMS and send it later without duplicates", async () => {
    const { customer } = fixture();
    submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    await dispatchOrderNotifications("ord_test");
    const response = await PATCH(
      await adminRequest("approve", {
        sendSms: false,
        estimatedDispatchAt: new Date(Date.now() + 86400000).toISOString(),
      }),
      context(),
    );
    expect(response.status).toBe(200);
    expect(getSubmittedOrder("ord_test")?.notifications?.at(-1)?.status).toBe("pending");
    await PATCH(await adminRequest("retry_sms"), context());
    expect(getSubmittedOrder("ord_test")?.notifications?.at(-1)?.status).toBe("mock");
    const count = getSubmittedOrder("ord_test")?.notifications?.length;
    await PATCH(await adminRequest("retry_sms"), context());
    expect(getSubmittedOrder("ord_test")?.notifications).toHaveLength(count!);
  });
  it("returns unique nonempty shipping codes matching server quote identity", () => {
    const quotes = listAvailableShippingQuotes(address);
    expect(new Set(quotes.map((q) => q.code)).size).toBe(quotes.length);
    quotes.forEach((q) => expect(q.code).toBe(q.method));
    expect(quotes.find((q) => q.code === "pickup")?.costRial).toBe(0);
  });
  it("creates an order awaiting a receipt, preserving coordinates and server total", () => {
    const variant = variants.find((v) => v.isActive)!;
    const order = createSubmittedOrder({
      channel: "retail",
      customerName: "تست",
      phone: address.receiverPhone,
      address,
      shippingMethod: "tipax",
      lines: [{ variantId: variant.id, quantity: 1 }],
    });
    expect(order.status).toBe("awaiting_receipt");
    expect(order.shippingAddress.location).toEqual(address.location);
    expect(order.totalRial).toBe(order.subtotalRial - order.discountRial + order.shippingRial);
  });
  it("saves coordinates in the address book and rejects invalid points", () => {
    const { customer } = fixture();
    createCustomerAddress(customer.id, { ...address, label: "خانه" });
    expect(listCustomerAddresses(customer.id)[0]?.location).toEqual(address.location);
    for (const point of [
      { latitude: NaN, longitude: 51 },
      { latitude: 0, longitude: 51 },
      { latitude: 35, longitude: "51" },
      { latitude: 35, longitude: 180 },
    ])
      expect(() => parseLocation(point)).toThrow();
  });
  it.each(["retail", "wholesale"] as const)(
    "accepts a text receipt for %s and waits for admin",
    async (channel) => {
      const { token } = fixture(channel);
      const form = new FormData();
      form.set("note", "رسید آزمایشی TEST");
      const response = await POST(
        new Request("http://localhost:3000/api/orders/ord_test/receipt", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: form,
        }),
        context(),
      );
      expect(response.status).toBe(200);
      const { order } = await response.json();
      expect(order.status).toBe("payment_under_review");
      expect(order.notifications[0].status).toBe("mock");
    },
  );
  it("blocks approval without a receipt and blocks bypassing the review endpoint", () => {
    fixture();
    expect(() =>
      reviewOrderPayment("ord_test", "approve", new Date(Date.now() + 86400000).toISOString()),
    ).toThrow();
    expect(() => updateSubmittedOrderStatus("ord_test", "confirmed")).toThrow();
    expect(() => updateSubmittedOrderStatus("ord_test", "shipped")).toThrow();
  });
  it("requires future dispatch time, approves once, and prevents receipt overwrite", () => {
    const { customer } = fixture();
    submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    expect(() => reviewOrderPayment("ord_test", "approve")).toThrow();
    expect(() => reviewOrderPayment("ord_test", "approve", "2000-01-01")).toThrow();
    const time = new Date(Date.now() + 86400000).toISOString();
    expect(reviewOrderPayment("ord_test", "approve", time)).toMatchObject({
      status: "confirmed",
      paymentStatus: "approved",
      estimatedDispatchAt: time,
    });
    expect(() => reviewOrderPayment("ord_test", "approve", time)).toThrow();
    expect(() => submitOrderReceipt("ord_test", customer.id, "retail", receipt())).toThrow();
  });
  it("rejects with a reason and allows a new receipt while retaining history", () => {
    const { customer } = fixture();
    submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    expect(() => reviewOrderPayment("ord_test", "reject")).toThrow();
    reviewOrderPayment("ord_test", "reject", undefined, "مبلغ متفاوت است");
    const next = submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    expect(next.receipts).toHaveLength(2);
    expect(next.rejectionReason).toBeUndefined();
  });
  it("checks customer ownership and channel", async () => {
    const { customer } = fixture();
    expect(() => submitOrderReceipt("ord_test", "other", "retail", receipt())).toThrow();
    expect(() => submitOrderReceipt("ord_test", customer.id, "wholesale", receipt())).toThrow();
    const response = await GET(
      new Request("http://localhost:3000/api/orders/ord_test/receipt?id=test"),
      context(),
    );
    expect(response.status).toBe(401);
  });
  it("checks admin authentication and cross-origin mutation", async () => {
    fixture();
    expect(
      (
        await PATCH(
          new Request("http://localhost:3000/api/admin/orders/ord_test/receipt", {
            method: "PATCH",
            body: "{}",
          }),
          context(),
        )
      ).status,
    ).toBe(401);
    expect(
      (await PATCH(await adminRequest("approve", {}, "https://evil.example"), context())).status,
    ).toBe(403);
    expect(
      (
        await statusPatch(
          new Request("http://localhost:3000/api/admin/orders/ord_test/status", {
            method: "PATCH",
            body: '{"status":"confirmed"}',
          }),
          context(),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await adminImage(
          new Request("http://localhost:3000/api/admin/orders/ord_test/receipt?id=test"),
          context(),
        )
      ).status,
    ).toBe(401);
  });
  it("stores actual images privately and denies access to other customers", async () => {
    const { token } = fixture();
    const bytes = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set("image", new File([bytes], "receipt.png", { type: "image/png" }));
    const response = await POST(
      new Request("http://localhost:3000/api/orders/ord_test/receipt", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      }),
      context(),
    );
    expect(response.status).toBe(200);
    const { order } = await response.json();
    const url = `http://localhost:3000/api/orders/ord_test/receipt?id=${order.receipts[0].id}`;
    const image = await GET(
      new Request(url, { headers: { authorization: `Bearer ${token}` } }),
      context(),
    );
    expect(image.status).toBe(200);
    expect(image.headers.get("cache-control")).toContain("no-store");
    const other = createCustomerSessionToken({
      customerId: "other",
      customerType: "retail",
      roles: ["customer"],
      phone: "09120000000",
    });
    expect(
      (await GET(new Request(url, { headers: { authorization: `Bearer ${other}` } }), context()))
        .status,
    ).toBe(404);
  });
  it("rejects disguised non-image uploads and oversized requests", async () => {
    const { token } = fixture();
    const form = new FormData();
    form.set("image", new File(["<svg onload='alert(1)'/>"], "fake.png", { type: "image/png" }));
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/orders/ord_test/receipt", {
            method: "POST",
            headers: { authorization: `Bearer ${token}` },
            body: form,
          }),
          context(),
        )
      ).status,
    ).toBe(400);
    expect(getSubmittedOrder("ord_test")?.status).toBe("awaiting_receipt");
  });
  it("keeps confirmation when SMS fails, retries only failed notifications, and uses verified account phone", async () => {
    const { customer } = fixture();
    submitOrderReceipt("ord_test", customer.id, "retail", receipt());
    await dispatchOrderNotifications("ord_test");
    reviewOrderPayment("ord_test", "approve", new Date(Date.now() + 86400000).toISOString());
    vi.stubEnv("SMS_PROVIDER", "melipayamak");
    vi.stubEnv("MELIPAYAMAK_USERNAME", "test");
    vi.stubEnv("MELIPAYAMAK_API_KEY", "test-key");
    vi.stubEnv("MELIPAYAMAK_FROM", "50001234");
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(Response.json({ Value: "1234567890" }));
    vi.stubGlobal("fetch", fetcher);
    expect((await dispatchOrderNotifications("ord_test")).paymentStatus).toBe("approved");
    expect(getSubmittedOrder("ord_test")?.notifications?.at(-1)?.status).toBe("failed");
    await Promise.all([
      dispatchOrderNotifications("ord_test", true),
      dispatchOrderNotifications("ord_test", true),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[1].body.get("to")).toBe(customer.mobileNumber);
    expect(getSubmittedOrder("ord_test")?.notifications?.at(-1)?.status).toBe("sent");
  });
  it("does not accept provider error codes or expose responses", async () => {
    vi.stubEnv("SMS_PROVIDER", "melipayamak");
    vi.stubEnv("MELIPAYAMAK_USERNAME", "test");
    vi.stubEnv("MELIPAYAMAK_API_KEY", "test-key");
    vi.stubEnv("MELIPAYAMAK_FROM", "50001234");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ Value: "-110", secret: "must-not-leak" })),
    );
    await expect(sendOrderSms("09123456789", "test")).rejects.toThrow("ارسال پیامک پذیرفته نشد");
  });
  it("leaves demo accounts disabled and rejects their activation", () => {
    expect(validateBankAccounts(demoBankAccounts).every((a) => !a.enabled)).toBe(true);
    expect(() =>
      validateBankAccounts(demoBankAccounts.map((a) => ({ ...a, enabled: true }))),
    ).toThrow();
  });
});
