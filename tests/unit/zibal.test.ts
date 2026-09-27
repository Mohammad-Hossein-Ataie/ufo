import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestZibalPayment, verifyZibalPayment, zibalPaymentUrl } from "@/lib/zibal";
import { getZibalCallbackUrl, getZibalMerchant } from "@/lib/zibal-config";
import { safeErrorDetails } from "@/lib/payment-diagnostics";

const args = {
  amountRial: 160000,
  callbackUrl: "https://ufopuff.com/api/payments/zibal/callback",
  orderId: "order-1",
  mobile: "09123456789",
  correlationId: "attempt-1",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

beforeEach(() => {
  vi.stubEnv("ZIBAL_MERCHANT", "  private-test-merchant  ");
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Zibal official IPG contract", () => {
  it("sends runtime merchant and documented JSON fields in rials and returns trackId", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ result: 100, trackId: 15966442233311 }));
    const trackId = await requestZibalPayment(args);
    expect(trackId).toBe("15966442233311");
    expect(zibalPaymentUrl(trackId)).toBe("https://gateway.zibal.ir/start/15966442233311");
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://gateway.zibal.ir/v1/request");
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      merchant: "private-test-merchant",
      amount: 160000,
      callbackUrl: args.callbackUrl,
      orderId: args.orderId,
      mobile: args.mobile,
      description: "سفارش order-1",
    });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"httpStatus":200,"result":100'),
    );
    vi.stubEnv("ZIBAL_MERCHANT", "changed-runtime-merchant");
    expect(getZibalMerchant()).toBe("changed-runtime-merchant");
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(
      "private-test-merchant",
    );
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(args.mobile);
  });

  it.each([
    [102, "پیدا نشد"],
    [103, "غیرفعال"],
    [104, "معتبر نیست"],
    [105, "حداقل"],
    [106, "آدرس بازگشت"],
    [113, "سقف"],
    [115, "آی‌پی"],
    [999, "پذیرفته نشد"],
  ])("maps documented result %s without trusting provider message", async (result, message) => {
    vi.mocked(fetch).mockResolvedValue(json({ result, message: "sensitive-provider-response" }));
    await expect(requestZibalPayment(args)).rejects.toThrow(String(message));
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(
      "sensitive-provider-response",
    );
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining(`"result":${result}`));
  });

  it.each([undefined, "", "   ", '"merchant"', "'merchant'", "merchant\nvalue"])(
    "rejects invalid local config %s before network I/O",
    async (value) => {
      vi.stubEnv("ZIBAL_MERCHANT", value ?? "");
      if (value === undefined) delete process.env.ZIBAL_MERCHANT;
      await expect(requestZibalPayment(args)).rejects.toThrow(/پیکربندی|کوتیشن/);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, "", 0, -1, 1.5, "123/456", {}, 9007199254740992])(
    "rejects malformed trackId %j",
    async (trackId) => {
      vi.mocked(fetch).mockResolvedValue(json({ result: 100, trackId }));
      await expect(requestZibalPayment(args)).rejects.toThrow("شناسه تراکنش");
    },
  );

  it("accepts a numeric string trackId without changing it", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ result: 100, trackId: "123456789" }));
    expect(await requestZibalPayment(args)).toBe("123456789");
  });

  it.each([0, 999, 1000, 1000.5, Number.NaN])(
    "rejects invalid or below-minimum amount %s",
    async (amountRial) => {
      await expect(requestZibalPayment({ ...args, amountRial })).rejects.toThrow("مبلغ");
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("reports network failure without logging arbitrary transport messages", async () => {
    vi.mocked(fetch).mockRejectedValue(
      new TypeError("private-test-merchant Authorization: secret"),
    );
    await expect(requestZibalPayment(args)).rejects.toThrow("ارتباط با درگاه");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("transport-failed"));
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "private-test-merchant",
    );
    expect(JSON.stringify(safeErrorDetails(new Error("password=secret")))).not.toContain(
      "password",
    );
  });

  it.each(["<html>proxy failure</html>", "null", "[]"])(
    "handles non-object/non-JSON response %s",
    async (body) => {
      vi.mocked(fetch).mockResolvedValue(new Response(body));
      await expect(requestZibalPayment(args)).rejects.toThrow("پاسخ درگاه");
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"result":null'));
    },
  );

  it("logs HTTP failure and provider result but never treats it as success", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ result: 100, trackId: 1234 }, 502));
    await expect(requestZibalPayment(args)).rejects.toThrow("پاسخگو نیست");
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"httpStatus":502'));
  });

  it("verifies server-side using numeric trackId and requires confirmed status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      json({
        result: 100,
        status: 1,
        amount: args.amountRial,
        orderId: args.orderId,
        refNumber: 1234,
      }),
    );
    expect(await verifyZibalPayment("12345")).toMatchObject({
      paid: true,
      amountRial: args.amountRial,
      orderId: args.orderId,
    });
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("https://gateway.zibal.ir/v1/verify");
    expect(JSON.parse(String(init?.body))).toEqual({
      merchant: "private-test-merchant",
      trackId: 12345,
    });
    vi.mocked(fetch).mockResolvedValue(json({ result: 100, status: 2 }));
    expect(await verifyZibalPayment("12345")).toEqual({ paid: false, status: 2 });
  });
});

describe("Zibal callback configuration", () => {
  it("uses the public production origin and strips paths/query, independently of proxy flags", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", " https://ufopuff.com/shop?ignored=yes ");
    vi.stubEnv("TRUST_PROXY_HEADERS", "true");
    expect(getZibalCallbackUrl()).toBe(args.callbackUrl);
  });
  it.each([
    undefined,
    "",
    "http://localhost:3000",
    "http://172.18.0.2:3000",
    '"https://ufopuff.com"',
  ])("rejects missing/unsafe production origin %s", (origin) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", origin ?? "");
    if (origin === undefined) delete process.env.APP_BASE_URL;
    expect(() => getZibalCallbackUrl()).toThrow();
  });
});
