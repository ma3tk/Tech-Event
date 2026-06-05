/**
 * リクエストヘッダに `x-pathname` と `x-locale` を埋め込む共通ミドルウェア。
 *
 * - `x-pathname`: Server Component で `headers().get('x-pathname')` から現在の
 *   パスを参照できる (例: ルートレイアウトで `/embed/...` のときヘッダ/フッタを
 *   出さない判定に使う)。
 * - `x-locale` と cookie `tech_event_locale`: 言語決定 (i18n)
 *   - `?lang=ja|en` が指定されていれば最優先 + cookie へ保存
 *   - 既存 cookie があればそれを採用
 *   - どちらも無ければ Accept-Language ヘッダから推定 (デフォルト ja)
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

export function middleware(request: NextRequest): NextResponse {
  const { locale, setFromQuery } = resolveLocale(request);

  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  headers.set("x-locale", locale);

  const response = NextResponse.next({ request: { headers } });

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
