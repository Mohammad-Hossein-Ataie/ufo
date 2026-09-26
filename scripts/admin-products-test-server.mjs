// Isolated localhost server for browser tests. Never uses the configured database or storage.
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
Object.assign(process.env, {
  NODE_ENV: "development",
  APP_BASE_URL: "http://127.0.0.1:3106",
  MONGODB_URI: "",
  STORAGE_PROVIDER: "mock",
  SESSION_SECRET: randomBytes(32).toString("hex"),
  ADMIN_USERNAME: "local-catalog-test",
  ADMIN_PASSWORD: "local-only-catalog-test-password",
  ORIGIN_DEBUG: "false",
  TRUST_PROXY_HEADERS: "false",
  NEXT_DIST_DIR: ".next-content-test",
});
process.argv = [process.execPath, "next", "dev", "-p", "3106", "-H", "127.0.0.1"];
await import(pathToFileURL(createRequire(import.meta.url).resolve("next/dist/bin/next")).href);
