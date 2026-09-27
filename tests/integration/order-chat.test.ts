import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import sharp from "sharp";
import * as storage from "@ufo/storage";
import { createSubmittedOrder, getOrderStorePath, getSubmittedOrder } from "@ufo/orders";
import { variants } from "@ufo/domain";
import { createCustomerSessionToken } from "@/lib/customer-session";
import { createAdminSessionToken } from "@/lib/admin-session";
import { chatHandlers } from "@/lib/chat-route";
import { GET as getFile, POST as upload } from "@/app/api/chat/upload/route";

let directory: string, orderId: string, token: string;
const retail = chatHandlers("retail"),
  admin = chatHandlers("admin");
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "ufo-chat-test-"));
  vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
  vi.stubEnv("SESSION_SECRET", "isolated-chat-test-secret-with-32-characters");
  vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
  const order = createSubmittedOrder({
    channel: "retail",
    customerName: "Test",
    phone: "09123456789",
    shippingMethod: "pickup",
    address: {
      province: "تهران",
      city: "تهران",
      line1: "",
      receiverName: "Test",
      receiverPhone: "09123456789",
    },
    lines: [{ variantId: variants.find((item) => item.isActive)!.id, quantity: 1 }],
  });
  orderId = order.id;
  writeFileSync(getOrderStorePath(), JSON.stringify({ orders: [{ ...order, userId: "owner" }] }));
  token = createCustomerSessionToken({
    customerId: "owner",
    customerType: "retail",
    roles: ["customer"],
    phone: "09123456789",
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  const target = resolve(directory);
  if (
    !target.startsWith(resolve(tmpdir()) + "\\ufo-chat-test-") &&
    !target.startsWith(resolve(tmpdir()) + "/ufo-chat-test-")
  )
    throw new Error("Unsafe cleanup path");
  rmSync(target, { recursive: true, force: true });
});

it("serves legacy storage images only when linked to the authorized order", async () => {
  const provider = storage.getStorageProvider();
  const bytes = await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } })
    .png()
    .toBuffer();
  const read = vi
    .spyOn(provider, "read")
    .mockResolvedValue({ key: "chat/legacy.png", body: bytes, contentType: "image/png" });
  vi.spyOn(storage, "getStorageProvider").mockReturnValue(provider);
  const original = getSubmittedOrder(orderId)!;
  writeFileSync(
    getOrderStorePath(),
    JSON.stringify({
      orders: [
        {
          ...original,
          chat: [
            {
              id: "legacy",
              orderId,
              sender: "customer",
              body: "",
              createdAt: original.createdAt,
              attachments: [{ key: "chat/legacy.png", url: "https://old.example/image" }],
            },
          ],
        },
      ],
    }),
  );
  const req = (key: string) =>
    new Request(
      `http://localhost:3000/api/chat/upload?orderId=${orderId}&key=${encodeURIComponent(key)}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
  const file = await getFile(req("chat/legacy.png"));
  expect(file.status).toBe(200);
  expect(file.headers.get("content-type")).toBe("image/webp");
  expect(read).toHaveBeenCalledOnce();
  expect((await getFile(req("chat/unrelated.png"))).status).toBe(400);
  expect(read).toHaveBeenCalledOnce();
});
function request(method = "GET", payload = {}, authorization = token) {
  return new Request(`http://localhost:3000/api/chat?orderId=${orderId}`, {
    method,
    headers: { authorization: `Bearer ${authorization}`, "Content-Type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify({ orderId, ...payload }) }),
  });
}
it("requires login, order ownership and the matching storefront for all customer operations", async () => {
  const other = createCustomerSessionToken({
    customerId: "other",
    customerType: "retail",
    roles: ["customer"],
    phone: "09120000000",
  });
  for (const method of ["GET", "POST", "PATCH"] as const) {
    expect((await retail[method](request(method, {}, "invalid"))).status).toBe(401);
    expect((await retail[method](request(method, {}, other))).status).toBe(404);
    expect((await chatHandlers("wholesale")[method](request(method))).status).toBe(401);
  }
  expect(getSubmittedOrder(orderId)?.chat).toHaveLength(0);
});
it("lets customer and authenticated admin converse without changing payment state", async () => {
  const sent = await retail.POST(request("POST", { body: "پیگیری سفارش", sender: "admin" }));
  expect(sent.status).toBe(201);
  const { message } = await sent.json();
  expect(message.sender).toBe("customer");
  expect((await admin.GET(request())).status).toBe(401);
  const cookie = `ufo_admin_session=${await createAdminSessionToken("admin")}`;
  const reply = (origin: string) =>
    new Request("http://localhost:3000/api/admin/chat", {
      method: "POST",
      headers: { cookie, origin, "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, body: "در حال بررسی", replyToId: message.id }),
    });
  expect((await admin.POST(reply("https://evil.example"))).status).toBe(403);
  expect((await admin.POST(reply("http://localhost:3000"))).status).toBe(201);
  const messages = (await (await retail.GET(request())).json()).messages;
  expect(messages).toHaveLength(2);
  expect(messages[1].readByCustomerAt).toBeTruthy();
  expect(
    (await retail.PATCH(request("PATCH", { messageId: messages[1].id, body: "forged" }))).status,
  ).toBe(400);
  expect(getSubmittedOrder(orderId)?.paymentStatus).toBe("awaiting_receipt");
});
it.each(["image", "pdf"])(
  "stores %s privately and rejects cross-order attachment reuse",
  async (kind) => {
    const content =
      kind === "image"
        ? await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } })
            .png()
            .toBuffer()
        : Buffer.from("%PDF-1.4\n%%EOF");
    const form = new FormData();
    form.set(
      "file",
      new File([content], kind === "image" ? "receipt.png" : "receipt.pdf", {
        type: kind === "image" ? "image/png" : "application/pdf",
      }),
    );
    const response = await upload(
      new Request(`http://localhost:3000/api/chat/upload?orderId=${orderId}`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      }),
    );
    expect(response.status).toBe(200);
    const { file } = await response.json();
    expect((await getFile(new Request(`http://localhost:3000${file.url}`))).status).toBe(401);
    const loaded = await getFile(
      new Request(`http://localhost:3000${file.url}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(loaded.status).toBe(200);
    expect(loaded.headers.get("cache-control")).toContain("private");
    expect(
      (
        await retail.POST(
          request("POST", { attachments: [{ ...file, url: "javascript:alert(1)" }] }),
        )
      ).status,
    ).toBe(201);
    expect(getSubmittedOrder(orderId)?.chat[0]?.attachments?.[0]?.url).toBe(file.url);
    const original = getSubmittedOrder(orderId)!;
    writeFileSync(
      getOrderStorePath(),
      JSON.stringify({ orders: [original, { ...original, id: "another-order", chat: [] }] }),
    );
    expect(
      (await retail.POST(request("POST", { orderId: "another-order", attachments: [file] })))
        .status,
    ).toBe(400);
  },
);
it("rejects arbitrary attachment URLs, invalid file content, long messages and nonexistent replies", async () => {
  for (const payload of [
    { attachments: [{ url: "https://evil.example/file" }] },
    { body: "x".repeat(2001) },
    { body: "hi", replyToId: "missing" },
  ])
    expect((await retail.POST(request("POST", payload))).status).toBe(400);
  const form = new FormData();
  form.set("file", new File(["<svg/>"], "receipt.pdf", { type: "application/pdf" }));
  expect(
    (
      await upload(
        new Request(`http://localhost:3000/api/chat/upload?orderId=${orderId}`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: form,
        }),
      )
    ).status,
  ).toBe(400);
});
