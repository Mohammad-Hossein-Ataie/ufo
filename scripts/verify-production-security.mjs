// Local smoke test only. Build first; uses ephemeral credentials and mock storage.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { File } from "node:buffer";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";

const port = 3105;
const base = `http://127.0.0.1:${port}`;
const origin = "https://ufopuff.com";
const username = "security-smoke-admin";
const password = randomBytes(24).toString("hex");
const env = {
  ...process.env,
  NODE_ENV: "staging", // The command wrapper must normalize this before loading Next.
  APP_BASE_URL: origin,
  ADMIN_BASE_URL: `${origin}/admin`,
  B2B_BASE_URL: `${origin}/b2b`,
  TRUST_PROXY_HEADERS: "false",
  ORIGIN_DEBUG: "false",
  MONGODB_URI: "",
  STORAGE_PROVIDER: "mock",
  ADMIN_USERNAME: username,
  ADMIN_PASSWORD: password,
};

async function start(secret, shouldFail = false) {
  const child = spawn(
    process.execPath,
    ["scripts/next-command.mjs", "start", "-p", String(port), "-H", "127.0.0.1"],
    {
      env: { ...env, SESSION_SECRET: secret },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const exited = once(child, "exit");
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
  };
  try {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (child.exitCode !== null || child.signalCode !== null) {
        assert(
          shouldFail && output.includes("SESSION_SECRET"),
          "Unexpected server startup failure (output withheld to protect environment data)",
        );
        console.log("PASS: production startup rejects an invalid session secret");
        return { stop };
      }
      if (output.includes("Ready in")) {
        assert(!shouldFail, "Server accepted an invalid production secret");
        assert(!output.includes("non-standard"), "NODE_ENV was not normalized");
        return { stop };
      }
      await delay(100);
    }
    throw new Error("Timed out waiting for local production startup");
  } catch (error) {
    await stop();
    throw error;
  }
}

await start("", true);
await start("short", true);
const server = await start(randomBytes(32).toString("hex"));
try {
  const login = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(login.status, 200, "Canonical production login failed");
  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=lax/i);
  const cookie = setCookie.split(";")[0];
  console.log("PASS: production login through internal HTTP issues a secure session cookie");
  for (const [headers, expected] of [
    [{ origin }, 401],
    [
      {
        cookie,
        origin: "https://evil.example",
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
      403,
    ],
    [{ cookie, origin: "null" }, 403],
    [{ cookie }, 403],
  ]) {
    const response = await fetch(`${base}/api/admin/storage/upload`, { method: "POST", headers });
    assert.equal(response.status, expected);
  }
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } })
    .png()
    .toBuffer();
  const body = new FormData();
  body.set("file", new File([bytes], "security-smoke.png", { type: "image/png" }));
  const response = await fetch(`${base}/api/admin/storage/upload`, {
    method: "POST",
    headers: { cookie, origin },
    body,
  });
  assert.equal(response.status, 200, "Canonical production upload failed");
  const result = await response.json();
  assert(result.file.url.startsWith("/api/product-images/"));
  console.log(
    "PASS: authenticated image upload succeeds; unauthenticated, cross-origin and forged-proxy requests are rejected",
  );
} finally {
  await server.stop();
}
