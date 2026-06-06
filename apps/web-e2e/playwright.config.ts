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
  // CI で workers=1 にすると 328 tests が直列で 30 分 timeout に達するため 4 並列にする。
  // - serial mode のテスト群 (event-theme / lottery / stripe-payment 等) は
  //   `test.describe.configure({ mode: "serial" })` 内で逐次化されており、
  //   別 worker で別 spec が並列実行されても衝突しない。
  // - DB 書き込み test は固定 event id を分けて衝突を避けている設計
  //   (global-setup.ts のコメント参照)。
  workers: process.env.CI ? 4 : undefined,
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
  // ../../node_modules/.bin/next は POSIX shell script なので `node` で実行できない。
  // 直接 `next/dist/bin/next` (JS) を node で実行する。
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : {
        command: "node ../../node_modules/next/dist/bin/next dev",
        cwd: "../web",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
        // CI で `/api/auth/dev-login` を 200 で動かすために環境変数を子プロセスへ明示伝搬。
        // Playwright の webServer.env は process.env と merge されるはずだが、
        // CI で実際には継承されない事例があるため (NODE_ENV / CI / PATH 系)、明示的に列挙する。
        env: {
          // PATH / HOME / shell 系は process.env から漏らさず継承する
          ...process.env,
          // 明示上書き
          ENABLE_DEV_LOGIN: process.env.ENABLE_DEV_LOGIN ?? "1",
          ENABLE_TEST_ENDPOINTS: process.env.ENABLE_TEST_ENDPOINTS ?? "1",
          AUTH_SECRET:
            process.env.AUTH_SECRET ??
            "ci-placeholder-auth-secret-32chars-min-length-ok",
          DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
          NEXT_PUBLIC_BASE_URL:
            process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
          PUBLIC_API_KEY:
            process.env.PUBLIC_API_KEY ?? "ci-placeholder-public-api-key",
          NEXT_TELEMETRY_DISABLED: "1",
          // `next dev` は内部で NODE_ENV=development を強制設定するが、明示しておけば
          // dev-login route の `isDevLoginEnabled()` が確実に true になる。
          NODE_ENV: process.env.NODE_ENV ?? "development",
        },
      },
});
