import { test, expect } from "@playwright/test";

for (const channel of ["retail", "wholesale"] as const) {
  test(`${channel}: real receiving accounts, PDF receipt, support attachments and approval`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(
      ({ channel }) => {
        localStorage.setItem("ufo-age-verified", "true");
        localStorage.setItem(
          channel === "retail" ? "ufo-retail-session" : "ufo-b2b-session",
          JSON.stringify({
            channel,
            token: "browser-test-token",
            customer: {
              id: "test-customer",
              firstName: "کاربر",
              lastName: "آزمایشی",
              mobileNumber: "09123456789",
            },
          }),
        );
      },
      { channel },
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const base = channel === "retail" ? "" : "/b2b";
    const order = {
      id: "support-test",
      orderNumber: "TEST-SUPPORT",
      channel,
      paymentMethod: "zibal",
      status: "awaiting_payment",
      paymentStatus: "awaiting_gateway",
      items: [],
      subtotalRial: 10000000,
      totalRial: 10000000,
      discountRial: 0,
      shippingRial: 0,
      shippingTitleFa: "تحویل حضوری",
      shippingMethod: "pickup",
      customer: { fullName: "کاربر تست", phone: "09123456789" },
      shippingAddress: {
        province: "تهران",
        city: "تهران",
        line1: "فروشگاه",
        receiverName: "کاربر تست",
        receiverPhone: "09123456789",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [],
      receipts: [] as Record<string, string>[],
    };
    const messages: Record<string, unknown>[] = [];
    let receiptBody = "";
    await page.route(/^https:\/\/(trustseal\.enamad\.ir|zibal\.ir)\//, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
      }),
    );
    await page.route("**/api/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.pathname === "/api/payment-accounts") return route.continue();
      if (url.pathname.endsWith("/support-test/payment-method")) {
        expect(request.headers().authorization).toBe("Bearer browser-test-token");
        order.paymentMethod = "card_to_card";
        order.status = "awaiting_receipt";
        order.paymentStatus = "awaiting_receipt";
        return route.fulfill({ json: { order } });
      }
      if (url.pathname === "/api/cart")
        return route.fulfill({
          json: { items: [], summary: { subtotalRial: 0, discountRial: 0, totalRial: 0 } },
        });
      if (url.pathname === "/api/chat/upload") {
        expect(request.headers().authorization).toBe("Bearer browser-test-token");
        expect(url.searchParams.get("audience")).toBe(channel);
        if (request.method() === "GET")
          return route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4\n%%EOF" });
        return route.fulfill({
          json: {
            file: {
              key: "00000000-0000-0000-0000-000000000001.pdf",
              name: "support.pdf",
              contentType: "application/pdf",
              url: "/api/chat/upload?orderId=support-test&key=00000000-0000-0000-0000-000000000001.pdf",
            },
          },
        });
      }
      if (url.pathname === `/api${base}/chat`) {
        expect(request.headers().authorization).toBe("Bearer browser-test-token");
        if (request.method() === "POST")
          messages.push({
            ...request.postDataJSON(),
            id: `msg-${messages.length}`,
            sender: "customer",
            createdAt: new Date().toISOString(),
          });
        return route.fulfill({ json: { messages } });
      }
      if (url.pathname.endsWith("/support-test/receipt")) {
        if (request.method() === "GET")
          return route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4\n%%EOF" });
        expect(request.headers().authorization).toBe("Bearer browser-test-token");
        receiptBody = request.postData() ?? "";
        order.status = "payment_under_review";
        order.paymentStatus = "pending_review";
        order.receipts.push({
          id: "receipt-1",
          note: "",
          imageKey: "00000000-0000-0000-0000-000000000002.pdf",
          submittedAt: new Date().toISOString(),
        });
        return route.fulfill({ json: { order } });
      }
      if (url.pathname.endsWith("/orders/support-test")) return route.fulfill({ json: { order } });
      return route.fulfill({ json: {} });
    });
    await page.goto(`${base}/orders/support-test`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "پرداخت کارت‌به‌کارت", exact: true }).click();
    const banks = page.getByTestId("payment-bank-accounts");
    await expect(banks.getByRole("button", { name: /بلوبانک/ })).toBeVisible();
    for (const [bank, card, iban] of [
      ["بلوبانک", "6219861911406022", "IR590560611828005272406101"],
      ["بانک ملت", "6104331097847116", "IR470120000000007534884851"],
      ["بانک سامان", "6219861072306516", "IR870560213780004431989001"],
    ]) {
      await banks.getByRole("button", { name: new RegExp(bank!) }).click();
      await page.getByRole("button", { name: "کپی شماره کارت", exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(card);
      await page.getByRole("button", { name: "کپی شبا", exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(iban);
      await banks.screenshot({ path: `temp/receiving-${channel}-${card!.slice(-4)}.png` });
    }
    await page.getByLabel("تصویر یا فایل PDF رسید", { exact: true }).setInputFiles({
      name: "receipt.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%%EOF"),
    });
    await page.getByRole("button", { name: "ارسال رسید برای بررسی" }).click();
    expect(receiptBody).toContain("receipt.pdf");
    await expect(
      page.getByText("رسید شما دریافت شد و در انتظار بررسی ادمین است.", { exact: false }),
    ).toBeVisible();
    await page.getByText("رسیدهای ارسال‌شده", { exact: false }).click();
    await expect(page.getByRole("link", { name: /دریافت PDF · receipt.pdf/ })).toBeVisible();
    await page.getByLabel("متن پیام پشتیبانی").fill("لطفاً زمان آماده‌شدن سفارش را اعلام کنید.");
    await page.getByRole("button", { name: "ارسال پیام", exact: true }).click();
    await expect(
      page.getByText("لطفاً زمان آماده‌شدن سفارش را اعلام کنید.", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("فایل پیوست گفتگو").setInputFiles({
      name: "support.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%%EOF"),
    });
    await expect(page.getByText("۱ فایل آماده ارسال", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "ارسال پیام", exact: true }).click();
    await expect(page.getByRole("link", { name: /دریافت PDF · support.pdf/ })).toBeVisible();
    messages.push({
      id: "admin-1",
      sender: "admin",
      body: "سفارش شما در حال آماده‌سازی است.",
      createdAt: new Date().toISOString(),
    });
    order.status = "confirmed";
    order.paymentStatus = "approved";
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("پرداخت تأیید شد", { exact: true })).toBeVisible();
    await expect(page.getByText("سفارش شما در حال آماده‌سازی است.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator("#order-support").screenshot({ path: `temp/support-${channel}-mobile.png` });
    expect(errors).toEqual([]);
  });
}
