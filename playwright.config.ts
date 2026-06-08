import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for i18n E2E smoke tests.
 *
 * Run:  bun run e2e            # against an already-running dev server
 *       bun run e2e:install    # install browsers once
 *
 * Override base URL with PLAYWRIGHT_BASE_URL (e.g. the preview URL).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
