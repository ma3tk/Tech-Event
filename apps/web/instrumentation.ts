/**
 * Next.js instrumentation hook.
 *
 * Server / Edge ランタイムが起動するときに 1 度だけ呼ばれる。
 * - Sentry の server/edge 設定をランタイム別にロードする。
 * - 将来的に OpenTelemetry 等を入れる場合もここで `registerOTel(...)` を呼ぶ。
 *
 * 未設定 (SENTRY_DSN なし) のときは Sentry 側で no-op になる。
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Server Action / Server Component / route handler で発生した未捕捉例外を Sentry に送る。
 * Next.js が自動で呼び出す (App Router 16+)。
 */
export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource?: string;
    revalidateReason?: string;
    renderType?: "dynamic" | "dynamic-resume";
  },
): Promise<void> {
  // 動的 import で Sentry SDK のロードコストを起動時から外す
  try {
    const Sentry = await import("@sentry/nextjs");
    // Sentry が init 未完なら captureRequestError は no-op
    const fn = (
      Sentry as unknown as {
        captureRequestError?: (
          err: unknown,
          request: unknown,
          context: unknown,
        ) => void;
      }
    ).captureRequestError;
    if (typeof fn === "function") {
      fn(err, request, context);
    }
  } catch {
    // ignore
  }
}
