import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // globalSetup で dev.db を dev.db.baseline にコピーし、globalTeardown で復元する。
  // これにより create-flow.spec.ts のような書き込みテストが後続テスト (visual-compare 等)
  // を flake させない (詳細は e2e/global-setup.ts / global-teardown.ts のコメント)。
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  globalTeardown: require.resolve("./e2e/global-teardown.ts"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    // `useNotificationStream` (SSE) は EventSource で長時間接続を貼るため、
    // Playwright の `networkidle` 待ちと衝突する。E2E では cookie で off にしておき、
    // SSE 専用テスト (`e2e/sse-notifications.spec.ts`) だけ context cookie で force on する。
    extraHTTPHeaders: {
      "x-playwright-test": "1",
    },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chromium-mobile",
      // iPhone 14 の viewport/userAgent を流用するが、ブラウザは chromium に固定
      // (`defaultBrowserType: "webkit"` を上書き)。プロジェクト名通り chromium 上で
      // モバイル幅・isMobile=true・hasTouch=true を再現する。
      use: { ...devices["iPhone 14"], defaultBrowserType: "chromium" },
    },
  ],
  // 既に起動済みのdev serverを再利用 (E2E_BASE_URLでオーバーライド可)
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
