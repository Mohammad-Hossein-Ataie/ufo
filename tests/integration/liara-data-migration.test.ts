import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterEach, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const migrationPath = require.resolve("../../scripts/liara-data-migration.cjs");
let directory = "";

afterEach(() => {
  vi.unstubAllEnvs();
  delete require.cache[migrationPath];
  if (directory) rmSync(directory, { recursive: true, force: true });
});

it("restores the encrypted customer and address backup without overwriting other data", async () => {
  directory = mkdtempSync(join(tmpdir(), "ufo-data-migration-"));
  const source = join(directory, "source");
  const destination = join(directory, "destination");
  mkdirSync(source);
  mkdirSync(destination);
  const customerData = JSON.stringify({
    customers: [{ id: "cus_test", firstName: "Existing", lastName: "Customer" }],
    carts: [],
    addresses: [{ id: "addr_home", customerId: "cus_test", line1: "Home" }],
  });
  writeFileSync(join(source, "customer-accounts.json"), customerData);
  writeFileSync(join(source, "orders.json"), JSON.stringify({ orders: [] }));

  const objects = new Map<string, Buffer>();
  const server = createServer(async (request, response) => {
    const key = new URL(request.url ?? "/", "http://localhost").pathname;
    if (request.method === "PUT") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      objects.set(key, Buffer.concat(chunks));
      response.statusCode = 200;
      response.end();
      return;
    }
    const body = objects.get(key);
    response.statusCode = body ? 200 : 404;
    if (body) response.setHeader("Content-Length", body.length);
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server failed to start.");
    vi.stubEnv("LIARA_ENDPOINT", `http://127.0.0.1:${address.port}`);
    vi.stubEnv("LIARA_BUCKET_NAME", "test-bucket");
    vi.stubEnv("LIARA_ACCESS_KEY", "test-key");
    vi.stubEnv("LIARA_SECRET_KEY", "test-secret");
    vi.stubEnv("SESSION_SECRET", "test-session-secret-at-least-32-characters");
    vi.stubEnv("UFO_MOCK_DATA_DIR", source);
    const { backup } = require(migrationPath) as { backup: () => Promise<{ key: string; customers: number; addresses: number }> };
    const saved = await backup();
    expect(saved).toMatchObject({ customers: 1, addresses: 1 });
    expect([...objects.values()][0]?.includes(Buffer.from("Existing"))).toBe(false);

    vi.stubEnv("UFO_MOCK_DATA_DIR", destination);
    delete require.cache[migrationPath];
    const { restore } = require(migrationPath) as { restore: (key: string) => Promise<{ restored: boolean }> };
    writeFileSync(join(destination, "unrelated.txt"), "keep");
    await expect(restore(saved.key)).rejects.toThrow("refusing to mix files");
    rmSync(join(destination, "unrelated.txt"));
    expect((await restore(saved.key)).restored).toBe(true);
    expect(readFileSync(join(destination, "customer-accounts.json"), "utf8")).toBe(customerData);
    expect((await restore(saved.key)).restored).toBe(false);
  } finally {
    server.close();
  }
});
