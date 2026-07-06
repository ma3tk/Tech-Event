/**
 * tech-event Service Worker (手書き / 依存パッケージなし)
 *
 * キャッシュ戦略:
 *   - navigation (HTML): **ネットワーク優先・キャッシュ保存なし**。
 *     SSR HTML にはログイン状態 (te_session に依存した Header 等) が含まれるため、
 *     HTML レスポンスは一切キャッシュしない (stale 表示・情報漏洩の防止)。
 *     オフライン時のみ precache 済みの /offline.html を返す。
 *   - 静的アセット: cache-first。ただし **allowlist 方式** で
 *     `/_next/static/` (content-hash 付き immutable) と `/icons/` `/offline.html`
 *     `/manifest.webmanifest` のみ対象。
 *   - `/api/` `/_next/image`、認証・Server Action・cross-origin は SW が
 *     一切介入しない (ブラウザのデフォルト動作に fallthrough)。
 *
 * キャッシュ名はバージョン付き。activate 時に旧バージョンを削除する。
 */

const VERSION = "v1";
const CACHE_PREFIX = "tech-event-";
const STATIC_CACHE = `${CACHE_PREFIX}static-${VERSION}`;

const OFFLINE_URL = "/offline.html";

/** install 時に precache する最小 app-shell (すべて認証非依存の静的ファイル) */
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-maskable.svg",
];

/**
 * cache-first の対象にしてよい same-origin GET かどうか (allowlist)。
 * - `/_next/static/` は content-hash 付きで immutable
 * - それ以外は precache 対象の静的ファイルのみ
 * `/api/` / `/_next/image` / SSR HTML / 認証系はここに **絶対に含めない**。
 */
function isCacheableStaticPath(pathname) {
  if (pathname.startsWith("/_next/static/")) return true;
  return PRECACHE_URLS.includes(pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // GET 以外 (POST の Server Action 等) には一切介入しない
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // cross-origin には介入しない
  if (url.origin !== self.location.origin) return;

  // API / 認証 / 画像最適化 / dev 用エンドポイントには介入しない
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/image")) return;

  // ページ遷移 (HTML): ネットワーク優先。レスポンスはキャッシュに保存しない
  // (ログイン状態を含む SSR HTML の stale 表示・漏洩防止)。
  // オフライン時のみ precache 済み offline.html を返す。
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return (
          offline ??
          new Response("オフラインです", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // 静的アセット (allowlist のみ): cache-first
  if (isCacheableStaticPath(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        // 正常レスポンスのみキャッシュ (opaque / error は保存しない)
        if (response.ok && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  // それ以外 (SSR data / RSC payload 等) は介入しない = 常にネットワーク
});
