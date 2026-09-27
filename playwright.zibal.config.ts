import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["zibal-payment-feedback.spec.ts", "footer-trust.spec.ts"],
  workers: 1,
  timeout: 45_000,
  use: {
    ...devices["Desktop Chrome"],
    channel: "chrome",
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/next-command.mjs start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SESSION_SECRET: "isolated-browser-test-session-secret-32-characters",
      ZIBAL_MERCHANT: "browser-test-only-never-sent",
      APP_BASE_URL: "https://ufopuff.com",
      UFO_MOCK_DATA_DIR: "temp/zibal-browser-data",
    },
  },
});
