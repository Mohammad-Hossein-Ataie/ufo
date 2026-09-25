import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSubmittedOrder, getSubmittedOrder, upsertCustomerAccount } from "@ufo/orders";
import { variants } from "@ufo/domain";
import { createCustomerSessionToken } from "@/lib/customer-session";
import { POST as startPayment } from "@/app/api/payments/zibal/[orderId]/route";
import { GET as paymentCallback } from "@/app/api/payments/zibal/callback/route";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "ufo-zibal-test-"));
  vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
  vi.stubEnv("SESSION_SECRET", "zibal-test-session-secret-at-least-32-characters");
  vi.stubEnv("ZIBAL_MERCHANT", "test-merchant");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  const target = resolve(directory);
  if (
    !target.startsWith(
      resolve(tmpdir()) + (process.platform === "win32" ? "\\" : "/") + "ufo-zibal-test-",
    )
  )
    throw new Error("Unsafe test cleanup path");
  rmSync(target, { recursive: true, force: true });
});

function fixture() {
  const customer = upsertCustomerAccount({
    mobileNumber: "09123456789",
    customerType: "retail",
    profile: { firstName: "کاربر", lastName: "آزمایشی" },
  });
  const variant = variants.find((item) => item.isActive);
  if (!variant) throw new Error("Variant fixture is missing");
  const order = createSubmittedOrder({
    channel: "retail",
    customerId: customer.id,
    customerName: "کاربر آزمایشی",
    phone: "09123456789",
    address: {
      province: "تهران",
      city: "تهران",
      line1: "آدرس آزمایشی",
      receiverName: "کاربر آزمایشی",
      receiverPhone: "09123456789",
    },
    lines: [{ variantId: variant.id, quantity: 1 }],
    shippingMethod: "pickup",
    paymentMethod: "zibal",
  });
  const token = createCustomerSessionToken({
    customerId: customer.id,
    customerType: "retail",
    roles: ["customer"],
    phone: "09123456789",
  });
  return { order, token };
}

function paymentRequest(orderId: string, token: string) {
  return new Request(`http://localhost:3000/api/payments/zibal/${orderId}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

function callback(orderId: string, trackId = "123456789") {
  return new Request(
    `http://localhost:3000/api/payments/zibal/callback?success=1&trackId=${trackId}&orderId=${orderId}`,
  );
}

function gatewayResponse(value: object) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Zibal payment", () => {
  it("requests the saved rial amount and only approves after server-side verification", async () => {
    const { order, token } = fixture();
    let result = "unpaid";
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.merchant).toBe("test-merchant");
      if (path === "/v1/request") {
        expect(body.amount).toBe(order.totalRial);
        expect(body.orderId).toBe(order.id);
        expect(body.callbackUrl).toBe("http://localhost:3000/api/payments/zibal/callback");
        return gatewayResponse({ result: 100, trackId: 123456789 });
      }
      if (path === "/v1/verify") {
        return result === "unpaid"
          ? gatewayResponse({ result: 202, status: -1 })
          : result === "already"
            ? gatewayResponse({ result: 201, status: 1 })
            : gatewayResponse({
                result: 100,
                status: 1,
                amount: order.totalRial,
                orderId: order.id,
                refNumber: 876543,
              });
      }
      if (path === "/v1/inquiry")
        return gatewayResponse({
          result: 100,
          status: 1,
          amount: order.totalRial,
          orderId: order.id,
          refNumber: 876543,
        });
      throw new Error("Unexpected gateway request");
    });
    vi.stubGlobal("fetch", fetchMock);

    const context = { params: Promise.resolve({ orderId: order.id }) };
    const started = await startPayment(paymentRequest(order.id, token), context);
    expect(started.status).toBe(200);
    expect((await started.json()).paymentUrl).toBe("https://gateway.zibal.ir/start/123456789");
    expect(getSubmittedOrder(order.id)?.paymentStatus).toBe("awaiting_gateway");

    const stillUnpaid = await paymentCallback(callback(order.id));
    expect(stillUnpaid.status).toBe(303);
    expect(getSubmittedOrder(order.id)?.paymentStatus).toBe("awaiting_gateway");

    result = "paid";
    const returned = await paymentCallback(callback(order.id));
    expect(returned.status).toBe(303);
    expect(getSubmittedOrder(order.id)?.status).toBe("confirmed");
    expect(getSubmittedOrder(order.id)?.gatewayPayments?.[0]?.refNumber).toBe("876543");

    const timelineLength = getSubmittedOrder(order.id)?.timeline.length;
    result = "already";
    await paymentCallback(callback(order.id));
    expect(getSubmittedOrder(order.id)?.timeline).toHaveLength(timelineLength ?? 0);
  });

  it("rejects a verified response with the wrong amount", async () => {
    const { order, token } = fixture();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const path = new URL(String(input)).pathname;
        if (path === "/v1/request") return gatewayResponse({ result: 100, trackId: 123456789 });
        return gatewayResponse({
          result: 100,
          status: 1,
          amount: order.totalRial + 1,
          orderId: order.id,
          refNumber: 876543,
        });
      }),
    );
    await startPayment(paymentRequest(order.id, token), {
      params: Promise.resolve({ orderId: order.id }),
    });
    const returned = await paymentCallback(callback(order.id));
    expect(returned.status).toBe(502);
    expect(getSubmittedOrder(order.id)?.paymentStatus).toBe("awaiting_gateway");
  });

  it("allows a new attempt after a failed payment without approving forged callback data", async () => {
    const { order, token } = fixture();
    let requests = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      if (path === "/v1/request")
        return gatewayResponse({ result: 100, trackId: ++requests === 1 ? 123456789 : 123456790 });
      if (path === "/v1/verify") return gatewayResponse({ result: 202, status: 3 });
      throw new Error("Unexpected gateway request");
    });
    vi.stubGlobal("fetch", fetchMock);
    const context = { params: Promise.resolve({ orderId: order.id }) };
    await startPayment(paymentRequest(order.id, token), context);
    const forged = await paymentCallback(
      new Request(
        `http://localhost:3000/api/payments/zibal/callback?success=1&trackId=123456789&orderId=another-order`,
      ),
    );
    expect(forged.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const failed = await paymentCallback(callback(order.id));
    expect(failed.status).toBe(303);
    expect(getSubmittedOrder(order.id)?.paymentStatus).toBe("awaiting_gateway");
    expect(getSubmittedOrder(order.id)?.gatewayPayments?.[0]?.state).toBe("failed");
    const restarted = await startPayment(paymentRequest(order.id, token), context);
    expect((await restarted.json()).paymentUrl).toBe("https://gateway.zibal.ir/start/123456790");
    expect(getSubmittedOrder(order.id)?.gatewayPayments).toHaveLength(2);
  });

  it("does not let another customer start payment for this order", async () => {
    const { order } = fixture();
    const other = upsertCustomerAccount({
      mobileNumber: "09121111111",
      customerType: "retail",
      profile: { firstName: "دیگر", lastName: "مشتری" },
    });
    const token = createCustomerSessionToken({
      customerId: other.id,
      customerType: "retail",
      roles: ["customer"],
      phone: "09121111111",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await startPayment(paymentRequest(order.id, token), {
      params: Promise.resolve({ orderId: order.id }),
    });
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a useful, redacted error when an API token is used instead of an IPG merchant", async () => {
    const { order, token } = fixture();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        gatewayResponse({
          result: 104,
          message: "provider response that must not be exposed",
        }),
      ),
    );

    const response = await startPayment(paymentRequest(order.id, token), {
      params: Promise.resolve({ orderId: order.id }),
    });
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(502);
    expect(payload.error).toContain("کد merchant درگاه پرداخت");
    expect(payload.error).toContain("API Token");
    expect(payload.error).not.toContain("provider response");
    expect(getSubmittedOrder(order.id)?.gatewayPayments).toBeUndefined();
  });
});
