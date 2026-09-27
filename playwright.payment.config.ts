import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["manual-payment.spec.ts", "order-support.spec.ts"],
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3103",
    ...devices["Desktop Chrome"],
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/next-command.mjs start -p 3103",
    url: "http://localhost:3103/products",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next",
      MONGODB_URI: "disabled-for-ui-tests",
      UFO_MOCK_DATA_DIR: "temp/manual-restoration-data",
      SESSION_SECRET: "isolated-manual-restoration-test-secret-32-characters",
      APP_BASE_URL: "http://localhost:3103",
      SMS_PROVIDER: "mock",
    },
  },
});
