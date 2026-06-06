/**
 * 軽量 i18n ライブラリ。
 *
 * 全リクエスト共通の言語決定ロジック (cookie / `?lang=` クエリ / Accept-Language)
 * と、翻訳 lookup ヘルパ `t()` を提供する。`next-intl` のフル機能ではなく、
 * 既存ページに段階的に翻訳キーを差し込めるよう小さくまとめてある。
 *
 * - 利用例 (Server Component):
 *     const dict = await loadDict(await getLocale());
 *     return <h1>{t(dict, "header.explore")}</h1>;
 *
 * - 利用例 (Client Component): `getLocaleFromCookieClient()` で cookie を読み、
 *   `<LanguageSwitcher>` で `?lang=` を切り替える。
 */
import { headers, cookies } from "next/headers";
import jaMessages from "@/i18n/messages/ja.json";
import enMessages from "@/i18n/messages/en.json";

export type Locale = "ja" | "en";
export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ja";
export const LOCALE_COOKIE = "tech_event_locale";

type Dict = typeof jaMessages;

const DICTS: Record<Locale, Dict> = {
  ja: jaMessages,
  en: enMessages as Dict,
};

/** locale 文字列を正規化 (`ja-JP` → `ja`)。サポート外なら null。 */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const head = raw.toLowerCase().split(/[-_,;]/)[0]?.trim();
  if (!head) return null;
  return (SUPPORTED_LOCALES as readonly string[]).includes(head)
    ? (head as Locale)
    : null;
}

/**
 * Accept-Language ヘッダから最良の locale を 1 件返す。
 * 例: `en-US,en;q=0.9,ja;q=0.5` → "en"
 */
export function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const items = header.split(",").map((s) => {
    const [tag, ...rest] = s.trim().split(";");
    const qMatch = rest.join(";").match(/q=([0-9.]+)/);
    const q = qMatch ? Number(qMatch[1]) : 1;
    return { tag: tag ?? "", q: Number.isFinite(q) ? q : 0 };
  });
  items.sort((a, b) => b.q - a.q);
  for (const it of items) {
    const loc = normalizeLocale(it.tag);
    if (loc) return loc;
  }
  return null;
}

/**
 * 現在のリクエストの locale を返す (Server Component 用)。
 *
 * 優先度:
 *   1. cookie (`tech_event_locale`)
 *   2. middleware が埋めた `x-locale` ヘッダ (querystring / Accept-Language 由来)
 *   3. デフォルト (`ja`)
 */
export async function getLocale(): Promise<Locale> {
  try {
    const c = await cookies();
    const cookieLocale = normalizeLocale(c.get(LOCALE_COOKIE)?.value);
    if (cookieLocale) return cookieLocale;
  } catch {
    /* cookies() が使えない文脈は無視 */
  }
  try {
    const h = await headers();
    const headerLocale = normalizeLocale(h.get("x-locale"));
    if (headerLocale) return headerLocale;
    const accept = parseAcceptLanguage(h.get("accept-language"));
    if (accept) return accept;
  } catch {
    /* headers() が使えない文脈は無視 */
  }
  return DEFAULT_LOCALE;
}

/** 同期的に dict を取得する (JSON は import 済み)。 */
export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

/** `getLocale()` 後にそのまま辞書を返す便利関数。 */
export async function loadDict(
  locale?: Locale,
): Promise<{ locale: Locale; dict: Dict }> {
  const resolved = locale ?? (await getLocale());
  return { locale: resolved, dict: getDict(resolved) };
}

/**
 * `t()` を locale 固定で curry した関数を返すヘルパ。
 *
 * Server Component で 1 ファイル内に多数の翻訳を呼ぶ際、`t(dict, "x.y")` を毎回書くより
 * `const T = await getT();  T("x.y")` の方が読みやすい。
 *
 * 例:
 * ```ts
 * const T = await getT();
 * return <h1>{T("event.applyHeading")}</h1>;
 * ```
 */
export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

export async function getT(locale?: Locale): Promise<TFunc> {
  const { dict } = await loadDict(locale);
  return (key, vars) => t(dict, key, vars);
}

/**
 * "header.explore" のようなドット記法で翻訳をひく。
 * 第3引数で `{year: 2026}` のような置換変数を渡せる。
 * 未定義のキーは key 文字列そのものを返す (フォールバック)。
 */
export function t(
  dict: Dict,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  if (typeof cur !== "string") return key;
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(vars[name] ?? `{${name}}`),
  );
}
