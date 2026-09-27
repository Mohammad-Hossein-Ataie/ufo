import { afterEach, describe, expect, it, vi } from "vitest";
import { register, onRequestError } from "@/instrumentation";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("production instrumentation", () => {
  it("skips Node-only startup and request diagnostics in Edge", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(register()).resolves.toBeUndefined();
    await onRequestError(
      new Error("private"),
      { method: "GET", path: "/?token=secret", headers: { authorization: "secret" } },
      {
        routerKind: "App Router",
        routePath: "/orders/[id]",
        routeType: "render",
        revalidateReason: undefined,
      },
    );
    expect(log).not.toHaveBeenCalled();
  });

  it("reports route templates and stack frames without request secrets or arbitrary error messages", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await onRequestError(
      new Error("mongodb://user:password@database secret"),
      {
        method: "GET",
        path: "/?token=secret",
        headers: { authorization: "Bearer secret", cookie: "secret" },
      },
      {
        routerKind: "App Router",
        routePath: "/orders/[id]",
        routeType: "render",
        revalidateReason: undefined,
      },
    );
    const output = JSON.stringify(log.mock.calls);
    expect(output).toContain("/orders/[id]");
    expect(output).toContain("instrumentation.test.ts");
    expect(output).not.toMatch(/secret|password|Bearer|mongodb/);
  });
});
