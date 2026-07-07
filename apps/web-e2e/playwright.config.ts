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
  // CI workers は 2。
  // - workers=1 は 328 tests 直列で 30 分 timeout に達するため不可。
  // - workers=4 は GitHub の 2 コア runner では過剰並列となり、dev モードの
  //   on-demand compile 遅延下で hydration/Server Action のタイミング race や、
  //   desktop/mobile 2 project が同一 dev.db を共有する mutating テスト
  //   (stripe-payment / calendar 等) の同時衝突を誘発し flaky の温床になっていた。
  // - workers=2 は十分な並列性 (~30 分、timeout 45 分以内) を保ちつつ
  //   並列起因の競合を大幅に減らす中庸点。
  // - serial mode のテスト群 (event-theme / lottery / stripe-payment 等) は
  //   `test.describe.configure({ mode: "serial" })` 内で逐次化されている。
  // - DB 書き込み test は固定 event id を分けて衝突を避けている設計
  //   (global-setup.ts のコメント参照)。
  workers: process.env.CI ? 2 : undefined,
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
    // PWA の Service Worker (本番ビルドで登録される) は E2E のナビゲーションを
    // network-first で respondWith し、CI 負荷下で waitForLoadState を稀に hang させる
    // (navigation abort / load state timeout の flake 源)。E2E では SW を一律ブロックする。
    // 本番挙動には影響しない (Playwright context 限定)。SW 自体の検証は pwa.spec.ts で
    // ファイル配信・manifest を静的に確認している。
    serviceWorkers: "block",
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
          // IMPORTANT: webServer の AUTH_SECRET は _helpers/auth.ts の
          // loginByCookie() が cookie HMAC 署名に使う secret と必ず一致させる。
          // loginByCookie() は `process.env.AUTH_SECRET ?? "dev-auth-secret-please-change"`
          // を使う (= libs/shared/util-auth-session の getSessionSecret() fallback と同じ)。
          // ここで別 placeholder を渡すと、サーバ側 verify と署名が食い違い、
          // dev-login cookie が黙って無効化されて「未ログイン状態」で描画され、
          // 参加申込/ブックマーク系の locator が見つからず flaky になる。
          // そのため fallback はサーバ側 default と同一文字列に固定する。
          AUTH_SECRET:
            process.env.AUTH_SECRET ?? "dev-auth-secret-please-change",
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
