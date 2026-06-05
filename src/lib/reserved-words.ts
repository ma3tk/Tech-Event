/**
 * グループ subdomain / Calendar slug / その他 URL pathnam 衝突回避用の予約語。
 *
 * フィッシング目的で `admin` / `login` / `signup` のような slug を作られると、
 * ユーザーが URL の見た目で誤認識する可能性があるため、これらは作成段階で拒否する。
 *
 * - `RESERVED_SLUGS`: 既知のシステムパス + 名前空間
 * - `isReservedSlug(slug)`: 大文字小文字を無視して判定 (slug 自体は a-z0-9-)
 *
 * 追加する際は、src/app/(asterisk asterisk)/page.tsx の top-level ディレクトリ名と
 * 一致するようメンテすること。
 */

/**
 * 大文字小文字を無視して比較する。slug の format は `[a-z0-9-]+` 想定。
 */
const RESERVED = new Set<string>([
  // ----- システム / API パス -----
  "api",
  "auth",
  "oauth",
  "_next",
  "static",
  "assets",
  // ----- 管理 / 認証 -----
  "admin",
  "administrator",
  "root",
  "login",
  "logout",
  "signin",
  "signup",
  "register",
  "verify",
  "reset",
  "password",
  // ----- アプリケーションの主要ルート -----
  "www",
  "app",
  "dashboard",
  "event",
  "events",
  "group",
  "groups",
  "user",
  "users",
  "profile",
  "settings",
  "preferences",
  "notifications",
  "bookmarks",
  "pricing",
  "about",
  "terms",
  "privacy",
  "help",
  "support",
  "contact",
  "docs",
  "doc",
  // ----- 探索系 -----
  "discover",
  "explore",
  "ranking",
  "search",
  "series",
  "trending",
  "popular",
  "feed",
  // ----- カレンダー / 埋め込み -----
  "calendar",
  "calendars",
  "embed",
  "share",
  "invite",
  // ----- メディア / 静的アセット -----
  "uploads",
  "upload",
  "media",
  "images",
  "files",
  "public",
  // ----- その他予約済み (将来の機能) -----
  "test",
  "tests",
  "dev",
  "development",
  "staging",
  "prod",
  "production",
  "null",
  "undefined",
  "true",
  "false",
  "stripe",
  "payment",
  "payments",
  "webhook",
  "webhooks",
]);

/**
 * slug が予約語かどうかを返す。大文字小文字は無視する。
 * すでに `^[a-z0-9-]+$` でバリデーション済みであることを前提とする。
 */
export function isReservedSlug(slug: string): boolean {
  if (!slug) return false;
  return RESERVED.has(slug.toLowerCase().trim());
}

/** 予約語リスト (テスト / UI ヒント表示用) */
export function reservedSlugList(): string[] {
  return [...RESERVED].sort();
}
