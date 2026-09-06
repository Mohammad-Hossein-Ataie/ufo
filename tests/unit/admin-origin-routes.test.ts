import { File } from "node:buffer";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminSessionToken } from "@/lib/admin-session";
import { proxy } from "@/proxy";
import { POST as upload } from "@/app/api/admin/storage/upload/route";
import { POST as createShipping } from "@/app/api/admin/shipping-methods/route";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), saveShippingMethod: vi.fn() }));
vi.mock("@ufo/storage", async (original) => ({
  ...(await original<typeof import("@ufo/storage")>()),
  getStorageProvider: () => ({ upload: mocks.upload }),
}));
vi.mock("@ufo/orders", async (original) => ({
  ...(await original<typeof import("@ufo/orders")>()),
  saveShippingMethod: mocks.saveShippingMethod,
}));

let cookie: string;
beforeEach(async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SESSION_SECRET", "0123456789abcdef0123456789abcdef");
  vi.stubEnv("APP_BASE_URL", "https://ufopuff.com");
  vi.stubEnv("TRUST_PROXY_HEADERS", "false");
  vi.stubEnv("ORIGIN_DEBUG", "false");
  vi.stubGlobal("File", File);
  vi.clearAllMocks();
  cookie = `ufo_admin_session=${await createAdminSessionToken("test-admin")}`;
  mocks.upload.mockImplementation(async (input) => ({ ...input, size: input.body.length }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function request(path: string, headers: Record<string, string> = {}, method = "POST") {
  return new NextRequest(`http://172.18.0.2:3000${path}`, { method, headers });
}

describe("admin proxy CSRF boundary", () => {
  it("requires authentication before allowing private APIs", async () => {
    expect(
      (await proxy(request("/api/admin/storage/upload", { origin: "https://ufopuff.com" }))).status,
    ).toBe(401);
  });
  it.each([
    "/api/admin/storage/upload",
    "/api/admin/products",
    "/api/admin/shipping-methods",
    "/api/admin/logout",
  ])("protects mutations at %s behind an internal origin", async (path) => {
    const allowed = await proxy(request(path, { cookie, origin: "https://ufopuff.com" }));
    expect(allowed.headers.get("x-middleware-next")).toBe("1");
    expect(
      (
        await proxy(
          request(path, {
            cookie,
            origin: "https://evil.example",
            "x-forwarded-host": "evil.example",
            "x-forwarded-proto": "https",
          }),
        )
      ).status,
    ).toBe(403);
    expect((await proxy(request(path, { cookie }))).status).toBe(403);
    expect(
      (
        await proxy(request(path, { cookie, referer: "https://ufopuff.com/admin/products" }))
      ).headers.get("x-middleware-next"),
    ).toBe("1");
  });
  it("protects login against CSRF while allowing authenticated reads", async () => {
    expect(
      (await proxy(request("/api/admin/login", { origin: "https://evil.example" }))).status,
    ).toBe(403);
    expect(
      (await proxy(request("/api/admin/login", { origin: "https://ufopuff.com" }))).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
    expect(
      (await proxy(request("/api/admin/products", { cookie }, "GET"))).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
  });
});

describe("route-level upload and shipping protection", () => {
  it("accepts a real image with a public Origin and stores the original privately", async () => {
    const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } })
      .png()
      .toBuffer();
    const body = new FormData();
    body.set("file", new File([bytes], "image.png", { type: "image/png" }));
    const response = await upload(
      new Request("http://172.18.0.2:3000/api/admin/storage/upload", {
        method: "POST",
        headers: { cookie, origin: "https://ufopuff.com" },
        body,
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "private", contentType: "image/png" }),
    );
  });
  it("rejects unauthenticated and forged-origin requests before any mutation", async () => {
    for (const handler of [upload, createShipping]) {
      expect(
        (await handler(request("/api/admin/test", { origin: "https://ufopuff.com" }))).status,
      ).toBe(401);
      expect(
        (await handler(request("/api/admin/test", { cookie, origin: "https://evil.example" })))
          .status,
      ).toBe(403);
      expect((await handler(request("/api/admin/test", { cookie, origin: "null" }))).status).toBe(
        403,
      );
      expect((await handler(request("/api/admin/test", { cookie }))).status).toBe(403);
    }
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.saveShippingMethod).not.toHaveBeenCalled();
  });
});
