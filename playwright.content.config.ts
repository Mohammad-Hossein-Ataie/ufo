import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["content-publishing.spec.ts", "product-image-lightbox.spec.ts"],
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3106",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "node scripts/admin-products-test-server.mjs",
    url: "http://127.0.0.1:3106/blog",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
