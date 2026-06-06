import { defineConfig, devices } from "@playwright/test";

// Playwright CLI (CJS) と `@nx/playwright/plugin` (ESM) の両方からロードされるため、
// `require.resolve` (CJS) または絶対パス (ESM) を使い分ける必要がある。
// Playwright が CJS で読むケースが多いので、`require.resolve` を採用。
// (`@nx/playwright/plugin` 側はファイル解析のみで `require.resolve` は実行しない。)

export default defineConfig({
  // Nx 化で e2e ファイルは apps/web-e2e/src/ に移動。
  testDir: "./src",
  // globalSetup で dev.db を dev.db.baseline にコピーし、globalTeardown で復元する。
  // これにより create-flow.spec.ts のような書き込みテストが後続テスト (visual-compare 等)
  // を flake させない (詳細は src/global-setup.ts / src/global-teardown.ts のコメント)。
  globalSetup: require.resolve("./src/global-setup.ts"),
  globalTeardown: require.resolve("./src/global-teardown.ts"),
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
  // Nx 化で next dev は apps/web/ から起動する。
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : {
        command: "node ../../node_modules/.bin/next dev",
        cwd: "../web",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
