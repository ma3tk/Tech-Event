/**
 * 共通ミドルウェア:
 *   1. リクエストヘッダ (`x-pathname`, `x-locale`) を埋める (Server Component 向け)
 *   2. レスポンスにセキュリティヘッダ (CSP / X-Frame-Options / HSTS 等) を付与
 *
 * セキュリティヘッダ:
 *   - Content-Security-Policy:
 *       default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
 *       img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:;
 *       frame-ancestors 'none'; base-uri 'self'; form-action 'self';
 *     - Next.js は inline script (RSC payload) と inline style を多用するため `'unsafe-inline'` を許容。
 *     - 本来は nonce-based に移すべきだが、Next 16 + Storybook のため段階移行。
 *   - X-Frame-Options: DENY (embed routes は除外)
 *   - X-Content-Type-Options: nosniff
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *   - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload (production のみ)
 *   - Permissions-Policy: camera=(), microphone=(), geolocation=()
 *
 * 既存挙動 (i18n / pathname header) は維持する。
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  parseAcceptLanguage,
  type Locale,
} from "@/lib/i18n";

function resolveLocale(request: NextRequest): {
  locale: Locale;
  setFromQuery: boolean;
} {
  const fromQuery = normalizeLocale(request.nextUrl.searchParams.get("lang"));
  if (fromQuery) return { locale: fromQuery, setFromQuery: true };
  const fromCookie = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  if (fromCookie) return { locale: fromCookie, setFromQuery: false };
  const fromHeader = parseAcceptLanguage(
    request.headers.get("accept-language"),
  );
  if (fromHeader) return { locale: fromHeader, setFromQuery: false };
  return { locale: DEFAULT_LOCALE, setFromQuery: false };
}

/**
 * セキュリティヘッダを付与する。
 *
 * @param response 対象 NextResponse
 * @param pathname 現在のパス (embed 判定に使用)
 */
function applySecurityHeaders(
  response: NextResponse,
  pathname: string,
): void {
  const isProd = process.env.NODE_ENV === "production";
  const isEmbed = pathname.startsWith("/embed/");

  // ---- Content Security Policy ----
  // Next.js の RSC は inline script/style を使うため 'unsafe-inline' を許容する
  // (将来的に nonce-based に移行することが望ましい)。
  // dev では HMR の WebSocket のため connect-src に ws: を含める。
  const connectSrc = isProd
    ? "'self'"
    : "'self' ws: wss: http://localhost:* http://127.0.0.1:*";
  // dev では eval を Next の dev runtime が使うため 'unsafe-eval' を許容する
  const scriptSrc = isProd
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  // embed ルートは外部サイトの iframe で表示されるため frame-ancestors を絞らない
  const frameAncestors = isEmbed ? "*" : "'none'";

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // ---- X-Frame-Options ----
  // embed ページは iframe 埋め込み対象なので DENY しない
  if (!isEmbed) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS は production のみ (dev で localhost に preload を効かせない)
  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { locale, setFromQuery } = resolveLocale(request);

  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  headers.set("x-locale", locale);

  // correlation-id: 構造化ログ / 分散トレースの紐付け用。
  // クライアントが `x-request-id` を投げてきた場合は (英数字 + 安全な記号 8-128 文字に限り) 尊重し、
  // 無ければ crypto.randomUUID() で生成する。
  const incomingRid =
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id");
  const requestId =
    incomingRid && /^[A-Za-z0-9._-]{8,128}$/.test(incomingRid)
      ? incomingRid
      : crypto.randomUUID();
  headers.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers } });
  // クライアント / 下流サービスでも参照できるようレスポンスヘッダにも反映
  response.headers.set("x-request-id", requestId);

  // `?lang=` で明示指定が来たときは cookie を更新 (永続化)
  if (setFromQuery) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      sameSite: "lax",
      // 30 日
      maxAge: 60 * 60 * 24 * 30,
    });
  } else if (!request.cookies.get(LOCALE_COOKIE)) {
    // 初回アクセス時は推定 locale を cookie に保存し、次回以降はぶれないようにする。
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // E2E (Playwright) 用: `x-playwright-test=1` ヘッダが来たら
  // `tech_event_disable_sse=1` cookie をレスポンスにセットし、
  // 以後のページで `useNotificationStream` (SSE) を disable する。
  // 個別の test が SSE を force-on したい場合は `tech_event_force_sse=1` cookie で上書き可。
  if (request.headers.get("x-playwright-test") === "1") {
    const hasForce = !!request.cookies.get("tech_event_force_sse");
    if (!hasForce && !request.cookies.get("tech_event_disable_sse")) {
      response.cookies.set("tech_event_disable_sse", "1", {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60,
      });
    }
  }

  // セキュリティヘッダを全レスポンスに付与
  applySecurityHeaders(response, request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
