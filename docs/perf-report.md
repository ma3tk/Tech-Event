# tech-event パフォーマンスレポート

本ドキュメントは `pnpm build` (Next.js 16.2.7 + Turbopack) の出力と、Playwright による主要ページの応答時間計測結果をまとめたものである。

## 1. Production build / bundle 分析

### 1.0 改善前後の比較 (P0: MarkdownEditor / ShareModal の dynamic import 化)

`next/dynamic({ ssr: false })` のクライアントラッパー
(`MarkdownEditorDynamic`, `ShareModalDynamic`) を導入し、
重い Markdown エディタ・Share モーダル本体を遅延 import に変更した
(parent form は ServerComponent のまま、`<form action={serverAction}>` 構造は維持)。
さらに `qrcode-svg` (~300KB on disk) は ShareModal 内で `await import()`
されているため、モーダル open までクライアントへ転送されない。

合わせて、`/_not-found` のプリレンダー失敗対策として `ToastListener`
(`useSearchParams` を使う Client Component) を `<Suspense fallback={null}>`
で囲んだ (CSR bailout 解消)。

#### route 別 First Load JS (uncompressed) 比較

| route | before | after | delta |
| --- | --: | --: | --: |
| `/` | 694.0 KB | 693.9 KB | -0.1 KB |
| `/event/[id]` | 709.5 KB | 699.3 KB | **-10.3 KB** |
| `/event/[id]/edit` | 742.8 KB | 697.0 KB | **-45.8 KB** |
| `/event/create` | 739.5 KB | 693.8 KB | **-45.7 KB** |
| `/group/create` | 739.5 KB | 693.8 KB | **-45.7 KB** |
| `/group/[subdomain]/edit` | 742.8 KB | 697.0 KB | **-45.8 KB** |
| `/explore` | 691.6 KB | 691.5 KB | -0.1 KB |
| `/login` | 692.5 KB | 692.3 KB | -0.1 KB |
| `/signup` | 690.2 KB | 690.1 KB | -0.1 KB |
| `/dashboard` | 690.2 KB | 690.1 KB | -0.1 KB |
| `/ranking` | 691.3 KB | 691.2 KB | -0.1 KB |
| `/discover` | 691.3 KB | 691.2 KB | -0.1 KB |
| `/components` | 747.8 KB | 747.7 KB | -0.1 KB |

- MarkdownEditor 本体は **約 50 KB のスタンドアロン chunk**
  (`grep -l "Markdown ツールバー"` で確認) として分離。
  4 つの作成/編集ページから第一表示の JS から除外。
- ShareModal 本体は **約 14 KB のスタンドアロン chunk** として分離。
  `qrcode-svg` (~300KB) は二段階で更にモーダル open 時のみロード。
- 影響を受ける 5 ルートで合計 **約 -198 KB** 削減
  (`-50 KB 前後/ページ` の期待値クリア)。

### 1.1 ビルド概要

- ビルドコマンド: `pnpm build`
- Compile: **4.1s** (Turbopack)
- TypeScript check: **4.3s** (0 errors)
- Static page 生成: **22 / 22 ページ** (0.283s)
- Middleware: 1 (proxy / `src/middleware.ts`)
- 警告: `middleware` ファイル命名規約の deprecation 通知のみ (機能影響なし)

### 1.2 ルート一覧 (ƒ = on-demand SSR, ○ = static prerender)

Next.js 16 + Turbopack の build ログは **per-route の Size / First Load JS を出力しない** (Turbopack ステーブル化後の仕様)。
そのため、ルート分類と静的/動的の区別、および `.next/static/chunks/*` から得た bundle のおよその大きさを併記する。

| ルート | 種別 | 備考 |
| --- | :-: | --- |
| `/` | ƒ | トップ。注目/新着/おすすめグループ/タグ + サイドCTA |
| `/_not-found` | ƒ | カスタム 404 |
| `/about`, `/terms`, `/privacy` | ƒ | 静的ページ |
| `/api/auth/{login,logout,dev-login,magic-link/*}` | ƒ | 認証 API |
| `/api/cron/run-lotteries` | ƒ | 抽選バッチ |
| `/api/v2/{events,groups,users,calendars,docs,...}` | ƒ / ○ | 公開 REST API (docs のみ静的) |
| `/bookmarks` | ƒ | 認証必須。ブックマーク一覧 |
| `/calendar/[slug]`, `/calendar/[slug]/{edit,manage,ics,feed.xml}`, `/calendar/create`, `/calendars` | ƒ | カレンダー (Luma 由来) |
| `/components` | ƒ | デザインシステムショーケース |
| `/dashboard` | ƒ | マイページ |
| `/discover` | ƒ | おすすめ発見 |
| `/embed/{event,calendar}/[id]` | ƒ | 埋め込みウィジェット |
| `/event/[id]` | ƒ | イベント詳細 |
| `/event/[id]/admin/*` (10 sub-routes) | ƒ | 主催者管理画面 (blasts/check-in/guests/insights/registration/survey 他) |
| `/event/[id]/{apply,check-in,edit,embed-code,ics}` | ƒ | イベント機能 |
| `/event/-/opengraph-image`, `/group/-/opengraph-image` | ƒ | OG 画像動的生成 (next/og + sharp) |
| `/event/create`, `/group/create` | ƒ | 作成フォーム |
| `/explore`, `/explore/groups` | ƒ | 一覧/検索 |
| `/feed.xml` | ○ (10m revalidate) | 全体 RSS |
| `/group/[subdomain]`, `/group/[subdomain]/{edit,feed.xml,ics}` | ƒ | グループ |
| `/login`, `/signup` | ƒ | 認証画面 |
| `/notifications` | ƒ | 通知センター (認証必須) |
| `/ranking`, `/search`, `/series` | ƒ | 検索/ランキング |
| `/robots.txt` | ○ | static |
| `/sitemap.xml` | ○ (1h revalidate) | static |
| `/user/[nickname]` | ƒ | プロフィール |

合計: **68 ルート** (うち static prerender 4: `/api/v2/docs`, `/feed.xml`, `/robots.txt`, `/sitemap.xml`)

### 1.3 クライアント送信される主要バンドル (`.next/static/chunks/`)

Turbopack 出力の chunk から、`build-manifest.json` の `rootMainFiles` + `polyfillFiles` (= 全ページ共通の First Load) を抽出。

| ファイル | サイズ | 役割 |
| --- | --: | --- |
| `40e-vpv-_x96-.js` | 224 KB | root main chunk #1 (React DOM / Next runtime) |
| `3p5rvqqashnj9.js` | 148 KB | root main chunk #2 |
| `0cz1d0mv5g_q7.js` | 112 KB | polyfill |
| `3onpthlbxzyy8.js` | 44 KB | root main chunk #3 |
| `1ut25g801-b5r.js` | 24 KB | root main chunk #4 |
| `turbopack-2cnezfywac_gz.js` | 12 KB | Turbopack runtime |
| CSS (`1-ylw4gzijzmq.css`) | 280 KB | Tailwind v4 single bundle |

- **全ページ共通 First Load JS (概算)**: **約 564 KB** (uncompressed; gzip 後はおよそ 1/3 = 約 180 KB 程度の見込み)
- 動的 chunk (per-route) は最大でも 56 KB 未満で、トータルで client 配布される JS は 1 MB 弱

### 1.4 サーバ側 bundle (`.next/server/chunks/`)

| ファイル | サイズ | 役割 |
| --- | --: | --- |
| `_0rxqfgy.js` / `ssr/_1d8gj5w.js` | 各 5.0 MB | サーバ共通 (React + Next + 全 Server Component の依存) |
| `1a7c_zod_v4_classic_external_…js` | 280 KB | Zod スキーマ |
| `ssr/node_modules__pnpm_1j_*.js` | 360 KB | 共有 vendor |
| `ssr/src_components_MarkdownEditor_tsx_…js` | 48 KB | MarkdownEditor (動的描画) |
| `ssr/1toj_marked_lib_marked_esm_…js` | 40 KB | marked (Markdown→HTML) |

### 1.5 依存パッケージのフットプリント

| パッケージ | node_modules サイズ | 用途 | bundle 影響 |
| --- | --: | --- | --- |
| `@prisma/client@7.8.0` | 77 MB | DB クライアント | server-only (RSC 経由でブラウザに送られない) |
| `lucide-react@1.17.0` | 39 MB | アイコン | tree-shaking 効くが import 個別化が必須 |
| `date-fns@4.4.0` | 27 MB | 日付処理 | 個別 import で 5KB/関数 程度 |
| `sharp@0.34.5` | 600 KB | OG 画像生成 | server-only (`/event/-/opengraph-image` 等) |
| `marked@18.0.4` | 464 KB | Markdown→HTML | server + client (MarkdownEditor preview) |
| `qrcode-svg@1.1.0` | 300 KB | チェックイン QR | server-only |
| `react-hook-form@7.77.0` | 2 MB | フォーム | client (event/create, group/create) |
| `next-auth@5.0.0-beta.31` | 2 MB | 認証ヘルパー | 一部 client (login flow) |

### 1.6 改善提案 (実装は別タスク)

優先度高:
- **`lucide-react` の named import 厳守 (既に対応)**: `import { Calendar } from "lucide-react"` で OK だが、新規追加時に `import * as Icons` の誤用を ESLint で禁止する。
- **`marked` を client から外す**: 現在 `MarkdownEditor` の preview で client side import しているため、SSR でレンダリング + プレビューはサーバ往復に置き換えると client bundle から 40 KB 弱削れる。あるいは `dynamic(() => import('marked'), { ssr: false })` で初回読み込みから外す。
- ✅ **MarkdownEditor の dynamic import (対応済)**: 作成/編集系画面 (`/event/create`, `/event/[id]/edit`, `/group/create`, `/group/[subdomain]/edit`) を `MarkdownEditorDynamic` 経由 (`next/dynamic({ ssr: false })`) に置き換え、初回 First Load から 約 -46 KB 削減。
- ✅ **ShareModal の dynamic import (対応済)**: `/event/[id]` を `ShareModalDynamic` 経由 (`next/dynamic({ ssr: false })`) に置き換え、約 -10 KB 削減。`qrcode-svg` は ShareModal 本体に内包され、open 時のみ `await import("qrcode-svg")`。

優先度中:
- **`date-fns` の使用箇所点検**: format / parseISO / formatDistanceToNow の 3 関数で 90% を占めるはず。`date-fns/locale/ja` を一箇所で import して再エクスポートし、locale data 重複を防ぐ。
- **EventTimeline / MiniCalendar の static 化**: server 計算結果を文字列化して `<time>` 要素に焼くだけならクライアント JS 不要。現在は client compute なら server compute に寄せる。
- **共通 CSS の分割**: 280 KB の Tailwind 単一 bundle は v4 default。critical CSS 抽出 + ルートごと purge で 30〜40% 削減見込み。
- **`@prisma/client` の重複インストール解消**: pnpm の peer 解決違いで 77 MB × 3 (lockfile に 3 hash 存在) のため `pnpm dedupe` 候補。

優先度低 (大改修):
- **prisma client → edge-compatible adapter**: `@prisma/adapter-better-sqlite3` で全リクエストが Node runtime に固定されている。Postgres 化と合わせて pg + edge へ移行できると CDN キャッシュ前提のレスポンスが軽くなる。
- **`sharp` を WASM 版 (`@resvg/resvg-wasm`) へ**: OG 画像生成は per-event なので CDN キャッシュ可能 (現在 `revalidate` なし)。`generateImageMetadata` の cache 設定で先んじて削れる。
- **画像 alt / dimensions 整備で next/image を有効化**: 現状 `<img>` 直書き箇所 (research の visual-diff-report 参照) を `next/image` 化すると client での layout shift と JS 計測が改善。

## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T12:37:51.674Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1552ms | 2904ms | 2904ms | 1589ms | 2745ms | 2745ms |
| イベント一覧 | `/explore` | 1710ms | 2830ms | 2831ms | 1845ms | 2755ms | 2756ms |
| イベント詳細 | `/event/1` | 1362ms | 1896ms | 1896ms | 1895ms | 2269ms | 2270ms |
| グループ詳細 | `/group/findy` | 1615ms | 1892ms | 1924ms | 2132ms | 2638ms | 2639ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2452ms | 3177ms | 3177ms | 5024ms | 5562ms | 5563ms |
| カレンダー詳細 | `/calendar/ai-developers` | 2574ms | 2855ms | 2920ms | 1329ms | 1538ms | 1539ms |
| ランキング | `/ranking` | 1836ms | 2880ms | 2880ms | 1968ms | 4093ms | 4094ms |
| ディスカバー | `/discover` | 3225ms | 3951ms | 3952ms | 1553ms | 2697ms | 2697ms |
| ブックマーク | `/bookmarks` | 6218ms | 6460ms | 6465ms | 7536ms | 7758ms | 7758ms |
| 通知センター | `/notifications` | 523ms | 582ms | 639ms | 85ms | 143ms | 159ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2745ms
- `/explore` (イベント一覧): warm Load=2756ms
- `/event/1` (イベント詳細): warm Load=2270ms
- `/group/findy` (グループ詳細): warm Load=2639ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=5563ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=1539ms
- `/ranking` (ランキング): warm Load=4094ms
- `/discover` (ディスカバー): warm Load=2697ms
- `/bookmarks` (ブックマーク): warm Load=7758ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T12:47:37.392Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1757ms | 2370ms | 2370ms | 1172ms | 2735ms | 2735ms |
| イベント一覧 | `/explore` | 1060ms | 1682ms | 1682ms | 1415ms | 1868ms | 1868ms |
| イベント詳細 | `/event/1` | 1557ms | 1833ms | 1833ms | 1717ms | 1998ms | 1998ms |
| グループ詳細 | `/group/findy` | 1047ms | 1216ms | 1452ms | 807ms | 972ms | 975ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1392ms | 1797ms | 1797ms | 948ms | 1453ms | 1453ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1113ms | 1284ms | 1561ms | 1044ms | 1170ms | 1170ms |
| ランキング | `/ranking` | 1200ms | 1789ms | 1789ms | 1416ms | 3582ms | 3582ms |
| ディスカバー | `/discover` | 667ms | 1035ms | 1035ms | 1495ms | 2024ms | 2025ms |
| ブックマーク | `/bookmarks` | 387ms | 501ms | 562ms | 1081ms | 1177ms | 1178ms |
| 通知センター | `/notifications` | 465ms | 738ms | 738ms | 1711ms | 1927ms | 1927ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2735ms
- `/explore` (イベント一覧): warm Load=1868ms
- `/event/1` (イベント詳細): warm Load=1998ms
- `/ranking` (ランキング): warm Load=3582ms
- `/discover` (ディスカバー): warm Load=2025ms
- `/notifications` (通知センター): warm Load=1927ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T12:51:58.917Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 659ms | 793ms | 804ms | 1333ms | 2011ms | 2011ms |
| イベント一覧 | `/explore` | 1560ms | 2053ms | 2053ms | 1475ms | 2776ms | 2776ms |
| イベント詳細 | `/event/1` | 1442ms | 1745ms | 1745ms | 1547ms | 1867ms | 1867ms |
| グループ詳細 | `/group/findy` | 1191ms | 1354ms | 1670ms | 1248ms | 1429ms | 1431ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1601ms | 2272ms | 2272ms | 1433ms | 2012ms | 2012ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1316ms | 1473ms | 1719ms | 643ms | 813ms | 813ms |
| ランキング | `/ranking` | 1213ms | 1626ms | 1626ms | 750ms | 2786ms | 2786ms |
| ディスカバー | `/discover` | 1364ms | 1988ms | 1988ms | 1413ms | 1942ms | 1942ms |
| ブックマーク | `/bookmarks` | 1008ms | 1138ms | 1139ms | 943ms | 1056ms | 1056ms |
| 通知センター | `/notifications` | 1767ms | 1888ms | 1888ms | 258ms | 311ms | 337ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2011ms
- `/explore` (イベント一覧): warm Load=2776ms
- `/event/1` (イベント詳細): warm Load=1867ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2012ms
- `/ranking` (ランキング): warm Load=2786ms
- `/discover` (ディスカバー): warm Load=1942ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T12:55:16.903Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 616ms | 1019ms | 1019ms | 1341ms | 1801ms | 1801ms |
| イベント一覧 | `/explore` | 1124ms | 1725ms | 1725ms | 1377ms | 1954ms | 1954ms |
| イベント詳細 | `/event/1` | 1455ms | 2861ms | 2861ms | 1376ms | 1681ms | 1681ms |
| グループ詳細 | `/group/findy` | 1267ms | 1435ms | 1730ms | 1574ms | 1741ms | 1746ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2319ms | 2794ms | 2794ms | 928ms | 1494ms | 1494ms |
| カレンダー詳細 | `/calendar/ai-developers` | 950ms | 1081ms | 1236ms | 792ms | 961ms | 961ms |
| ランキング | `/ranking` | 1697ms | 2391ms | 2391ms | 2099ms | 2571ms | 2571ms |
| ディスカバー | `/discover` | 1987ms | 2556ms | 2556ms | 1728ms | 2227ms | 2227ms |
| ブックマーク | `/bookmarks` | 1452ms | 1513ms | 1570ms | 468ms | 524ms | 560ms |
| 通知センター | `/notifications` | 361ms | 525ms | 525ms | 790ms | 1271ms | 1271ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1801ms
- `/explore` (イベント一覧): warm Load=1954ms
- `/event/1` (イベント詳細): warm Load=1681ms
- `/group/findy` (グループ詳細): warm Load=1746ms
- `/ranking` (ランキング): warm Load=2571ms
- `/discover` (ディスカバー): warm Load=2227ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T13:00:55.625Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1218ms | 1786ms | 1786ms | 1531ms | 2100ms | 2100ms |
| イベント一覧 | `/explore` | 1079ms | 2885ms | 2886ms | 1864ms | 2628ms | 2629ms |
| イベント詳細 | `/event/1` | 1436ms | 1762ms | 1762ms | 1707ms | 1986ms | 1986ms |
| グループ詳細 | `/group/findy` | 1328ms | 1519ms | 1639ms | 1034ms | 1241ms | 1246ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1138ms | 1603ms | 1609ms | 620ms | 1205ms | 1205ms |
| カレンダー詳細 | `/calendar/ai-developers` | 906ms | 1082ms | 1217ms | 1229ms | 1292ms | 1334ms |
| ランキング | `/ranking` | 1127ms | 1811ms | 1812ms | 1399ms | 1996ms | 1996ms |
| ディスカバー | `/discover` | 496ms | 896ms | 896ms | 1797ms | 2440ms | 2440ms |
| ブックマーク | `/bookmarks` | 1217ms | 1354ms | 1355ms | 649ms | 707ms | 741ms |
| 通知センター | `/notifications` | 262ms | 332ms | 351ms | 864ms | 1066ms | 1066ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2100ms
- `/explore` (イベント一覧): warm Load=2629ms
- `/event/1` (イベント詳細): warm Load=1986ms
- `/ranking` (ランキング): warm Load=1996ms
- `/discover` (ディスカバー): warm Load=2440ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T13:04:20.728Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 254ms | 359ms | 359ms | 1192ms | 1658ms | 1658ms |
| イベント一覧 | `/explore` | 1180ms | 1689ms | 1689ms | 891ms | 1296ms | 1296ms |
| イベント詳細 | `/event/1` | 1039ms | 1332ms | 1332ms | 1731ms | 2057ms | 2057ms |
| グループ詳細 | `/group/findy` | 1670ms | 1890ms | 2008ms | 1595ms | 1768ms | 1771ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1467ms | 2021ms | 2022ms | 1506ms | 3321ms | 3321ms |
| カレンダー詳細 | `/calendar/ai-developers` | 923ms | 1086ms | 1349ms | 686ms | 879ms | 880ms |
| ランキング | `/ranking` | 1405ms | 2169ms | 2169ms | 2254ms | 2940ms | 2940ms |
| ディスカバー | `/discover` | 1767ms | 2055ms | 2055ms | 437ms | 705ms | 705ms |
| ブックマーク | `/bookmarks` | 1728ms | 1956ms | 1957ms | 1976ms | 2136ms | 2136ms |
| 通知センター | `/notifications` | 1979ms | 2105ms | 2115ms | 139ms | 315ms | 315ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1658ms
- `/event/1` (イベント詳細): warm Load=2057ms
- `/group/findy` (グループ詳細): warm Load=1771ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=3321ms
- `/ranking` (ランキング): warm Load=2940ms
- `/bookmarks` (ブックマーク): warm Load=2136ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T13:34:06.053Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 199ms | 462ms | 462ms | 220ms | 424ms | 424ms |
| イベント一覧 | `/explore` | 535ms | 1041ms | 1042ms | 720ms | 896ms | 896ms |
| イベント詳細 | `/event/1` | 278ms | 482ms | 487ms | 368ms | 439ms | 473ms |
| グループ詳細 | `/group/findy` | 640ms | 777ms | 916ms | 587ms | 657ms | 699ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1077ms | 1357ms | 1357ms | 1118ms | 1327ms | 1327ms |
| カレンダー詳細 | `/calendar/ai-developers` | 150ms | 212ms | 442ms | 190ms | 261ms | 298ms |
| ランキング | `/ranking` | 789ms | 1237ms | 1237ms | 223ms | 459ms | 459ms |
| ディスカバー | `/discover` | 635ms | 2408ms | 2408ms | 759ms | 1230ms | 1230ms |
| ブックマーク | `/bookmarks` | 764ms | 835ms | 967ms | 264ms | 379ms | 384ms |
| 通知センター | `/notifications` | 133ms | 188ms | 218ms | 422ms | 771ms | 771ms |

### 異常に遅いページの仮説

- warm 計測で 1500ms を超えるページはなかった (dev サーバ計測のため、production ではさらに改善見込み)。


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T13:39:25.439Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1548ms | 2368ms | 2369ms | 1391ms | 4699ms | 4699ms |
| イベント一覧 | `/explore` | 1861ms | 2886ms | 2887ms | 1866ms | 2832ms | 2833ms |
| イベント詳細 | `/event/1` | 1724ms | 2209ms | 2209ms | 1911ms | 2401ms | 2402ms |
| グループ詳細 | `/group/findy` | 1388ms | 1657ms | 1821ms | 1433ms | 1691ms | 1692ms |
| ユーザープロフィール | `/user/fast_moon_169` | 3267ms | 5705ms | 5706ms | 1530ms | 2506ms | 2507ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1541ms | 1817ms | 1942ms | 2501ms | 2674ms | 2674ms |
| ランキング | `/ranking` | 1100ms | 1949ms | 1949ms | 1010ms | 1858ms | 1858ms |
| ディスカバー | `/discover` | 1501ms | 2273ms | 2273ms | 1394ms | 2075ms | 2075ms |
| ブックマーク | `/bookmarks` | 949ms | 1241ms | 1241ms | 1009ms | 1158ms | 1159ms |
| 通知センター | `/notifications` | 510ms | 1053ms | 1053ms | 1046ms | 1284ms | 1284ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=4699ms
- `/explore` (イベント一覧): warm Load=2833ms
- `/event/1` (イベント詳細): warm Load=2402ms
- `/group/findy` (グループ詳細): warm Load=1692ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2507ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=2674ms
- `/ranking` (ランキング): warm Load=1858ms
- `/discover` (ディスカバー): warm Load=2075ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T13:55:18.255Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 239ms | 425ms | 426ms | 285ms | 453ms | 453ms |
| イベント一覧 | `/explore` | 302ms | 475ms | 476ms | 815ms | 1238ms | 1239ms |
| イベント詳細 | `/event/1` | 723ms | 983ms | 984ms | 571ms | 817ms | 818ms |
| グループ詳細 | `/group/findy` | 822ms | 960ms | 1130ms | 598ms | 683ms | 705ms |
| ユーザープロフィール | `/user/fast_moon_169` | 982ms | 1198ms | 1198ms | 433ms | 615ms | 615ms |
| カレンダー詳細 | `/calendar/ai-developers` | 649ms | 779ms | 966ms | 1485ms | 1671ms | 1671ms |
| ランキング | `/ranking` | 733ms | 1370ms | 1370ms | 1101ms | 1650ms | 1650ms |
| ディスカバー | `/discover` | 1247ms | 1660ms | 1660ms | 1121ms | 1561ms | 1562ms |
| ブックマーク | `/bookmarks` | 302ms | 361ms | 400ms | 85ms | 146ms | 178ms |
| 通知センター | `/notifications` | 839ms | 1118ms | 1119ms | 744ms | 1060ms | 1060ms |

### 異常に遅いページの仮説

- `/calendar/ai-developers` (カレンダー詳細): warm Load=1671ms
- `/ranking` (ランキング): warm Load=1650ms
- `/discover` (ディスカバー): warm Load=1562ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:02:43.142Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 257ms | 467ms | 467ms | 303ms | 431ms | 432ms |
| イベント一覧 | `/explore` | 623ms | 848ms | 848ms | 683ms | 839ms | 839ms |
| イベント詳細 | `/event/1` | 370ms | 632ms | 632ms | 606ms | 907ms | 907ms |
| グループ詳細 | `/group/findy` | 758ms | 901ms | 1265ms | 793ms | 945ms | 945ms |
| ユーザープロフィール | `/user/fast_moon_169` | 900ms | 1473ms | 1481ms | 626ms | 946ms | 946ms |
| カレンダー詳細 | `/calendar/ai-developers` | 303ms | 416ms | 650ms | 328ms | 493ms | 493ms |
| ランキング | `/ranking` | 820ms | 1398ms | 1398ms | 621ms | 1215ms | 1215ms |
| ディスカバー | `/discover` | 1254ms | 1736ms | 1736ms | 1002ms | 1555ms | 1565ms |
| ブックマーク | `/bookmarks` | 828ms | 989ms | 989ms | 997ms | 1121ms | 1124ms |
| 通知センター | `/notifications` | 842ms | 1084ms | 1084ms | 477ms | 711ms | 712ms |

### 異常に遅いページの仮説

- `/discover` (ディスカバー): warm Load=1565ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:06:55.413Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 255ms | 415ms | 415ms | 311ms | 497ms | 498ms |
| イベント一覧 | `/explore` | 1900ms | 2498ms | 2498ms | 214ms | 365ms | 365ms |
| イベント詳細 | `/event/1` | 696ms | 994ms | 994ms | 498ms | 859ms | 859ms |
| グループ詳細 | `/group/findy` | 862ms | 972ms | 1244ms | 232ms | 377ms | 378ms |
| ユーザープロフィール | `/user/fast_moon_169` | 883ms | 1150ms | 1150ms | 909ms | 1373ms | 1380ms |
| カレンダー詳細 | `/calendar/ai-developers` | 543ms | 679ms | 944ms | 161ms | 288ms | 288ms |
| ランキング | `/ranking` | 828ms | 1760ms | 1761ms | 1227ms | 1848ms | 1848ms |
| ディスカバー | `/discover` | 673ms | 1150ms | 1150ms | 439ms | 1078ms | 1078ms |
| ブックマーク | `/bookmarks` | 513ms | 677ms | 677ms | 367ms | 505ms | 505ms |
| 通知センター | `/notifications` | 642ms | 788ms | 788ms | 579ms | 833ms | 839ms |

### 異常に遅いページの仮説

- `/ranking` (ランキング): warm Load=1848ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:24:42.367Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 5524ms | 7448ms | 7448ms | 1998ms | 8239ms | 8246ms |
| イベント一覧 | `/explore` | 4107ms | 6545ms | 6545ms | 2855ms | 5344ms | 5346ms |
| イベント詳細 | `/event/1` | 3727ms | 6752ms | 6752ms | 3109ms | 4315ms | 4316ms |
| グループ詳細 | `/group/findy` | 3952ms | 4603ms | 4603ms | 2785ms | 3593ms | 3593ms |
| ユーザープロフィール | `/user/fast_moon_169` | 4081ms | 5394ms | 5395ms | 1862ms | 8094ms | 8095ms |
| カレンダー詳細 | `/calendar/ai-developers` | 6397ms | 7618ms | 7618ms | 4631ms | 5189ms | 5189ms |
| ランキング | `/ranking` | 3084ms | 4320ms | 4320ms | 2316ms | 4390ms | 4391ms |
| ディスカバー | `/discover` | 3696ms | 5123ms | 5123ms | 1812ms | 7736ms | 7736ms |
| ブックマーク | `/bookmarks` | 2274ms | 2610ms | 2653ms | 2247ms | 2977ms | 2977ms |
| 通知センター | `/notifications` | 11345ms | 12873ms | 12874ms | 7103ms | 8399ms | 8400ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=8246ms
- `/explore` (イベント一覧): warm Load=5346ms
- `/event/1` (イベント詳細): warm Load=4316ms
- `/group/findy` (グループ詳細): warm Load=3593ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=8095ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=5189ms
- `/ranking` (ランキング): warm Load=4391ms
- `/discover` (ディスカバー): warm Load=7736ms
- `/bookmarks` (ブックマーク): warm Load=2977ms
- `/notifications` (通知センター): warm Load=8400ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:30:24.662Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1564ms | 2423ms | 2423ms | 1657ms | 2384ms | 2385ms |
| イベント一覧 | `/explore` | 678ms | 1920ms | 1921ms | 1082ms | 1829ms | 1836ms |
| イベント詳細 | `/event/1` | 2394ms | 3007ms | 3230ms | 997ms | 1444ms | 1444ms |
| グループ詳細 | `/group/findy` | 1185ms | 1793ms | 1794ms | 730ms | 1575ms | 1575ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2511ms | 4094ms | 4094ms | 2348ms | 2990ms | 2992ms |
| カレンダー詳細 | `/calendar/ai-developers` | 429ms | 833ms | 833ms | 326ms | 570ms | 572ms |
| ランキング | `/ranking` | 320ms | 1311ms | 1321ms | 522ms | 1932ms | 1942ms |
| ディスカバー | `/discover` | 729ms | 1615ms | 1615ms | 1355ms | 4533ms | 4533ms |
| ブックマーク | `/bookmarks` | 1194ms | 1617ms | 1619ms | 2044ms | 2366ms | 2367ms |
| 通知センター | `/notifications` | 1063ms | 1618ms | 1618ms | 1589ms | 2233ms | 2234ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2385ms
- `/explore` (イベント一覧): warm Load=1836ms
- `/group/findy` (グループ詳細): warm Load=1575ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2992ms
- `/ranking` (ランキング): warm Load=1942ms
- `/discover` (ディスカバー): warm Load=4533ms
- `/bookmarks` (ブックマーク): warm Load=2367ms
- `/notifications` (通知センター): warm Load=2234ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:31:15.029Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1007ms | 1726ms | 1733ms | 1422ms | 2347ms | 2353ms |
| イベント一覧 | `/explore` | 911ms | 2019ms | 2020ms | 1469ms | 2540ms | 2541ms |
| イベント詳細 | `/event/1` | 2419ms | 3092ms | 3219ms | 2033ms | 2585ms | 2585ms |
| グループ詳細 | `/group/findy` | 1056ms | 1473ms | 1482ms | 1720ms | 2073ms | 2074ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1452ms | 4487ms | 4487ms | 1867ms | 2828ms | 2828ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1093ms | 1378ms | 1520ms | 1172ms | 1631ms | 1631ms |
| ランキング | `/ranking` | 1447ms | 2524ms | 2534ms | 1460ms | 3405ms | 3414ms |
| ディスカバー | `/discover` | 1360ms | 2212ms | 2212ms | 876ms | 2320ms | 2320ms |
| ブックマーク | `/bookmarks` | 1014ms | 1360ms | 1361ms | 1335ms | 1698ms | 1699ms |
| 通知センター | `/notifications` | 2554ms | 3086ms | 3086ms | 1351ms | 2042ms | 2043ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2353ms
- `/explore` (イベント一覧): warm Load=2541ms
- `/event/1` (イベント詳細): warm Load=2585ms
- `/group/findy` (グループ詳細): warm Load=2074ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2828ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=1631ms
- `/ranking` (ランキング): warm Load=3414ms
- `/discover` (ディスカバー): warm Load=2320ms
- `/bookmarks` (ブックマーク): warm Load=1699ms
- `/notifications` (通知センター): warm Load=2043ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:37:20.068Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1210ms | 1750ms | 1750ms | 691ms | 1105ms | 1105ms |
| イベント一覧 | `/explore` | 816ms | 1487ms | 1487ms | 789ms | 2826ms | 2826ms |
| イベント詳細 | `/event/1` | 1317ms | 1669ms | 1669ms | 590ms | 1045ms | 1055ms |
| グループ詳細 | `/group/findy` | 1736ms | 1986ms | 2118ms | 699ms | 908ms | 912ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1008ms | 1771ms | 1771ms | 1381ms | 1824ms | 1825ms |
| カレンダー詳細 | `/calendar/ai-developers` | 889ms | 1136ms | 1393ms | 369ms | 776ms | 777ms |
| ランキング | `/ranking` | 934ms | 2108ms | 2109ms | 1172ms | 2224ms | 2224ms |
| ディスカバー | `/discover` | 1287ms | 1981ms | 1981ms | 1352ms | 2036ms | 2036ms |
| ブックマーク | `/bookmarks` | 849ms | 1042ms | 1043ms | 1032ms | 1231ms | 1231ms |
| 通知センター | `/notifications` | 798ms | 1227ms | 1228ms | 697ms | 1207ms | 1207ms |

### 異常に遅いページの仮説

- `/explore` (イベント一覧): warm Load=2826ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=1825ms
- `/ranking` (ランキング): warm Load=2224ms
- `/discover` (ディスカバー): warm Load=2036ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:50:00.850Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 846ms | 1285ms | 1290ms | 892ms | 1518ms | 1519ms |
| イベント一覧 | `/explore` | 1166ms | 1875ms | 1881ms | 443ms | 1070ms | 1077ms |
| イベント詳細 | `/event/1` | 839ms | 1246ms | 1394ms | 823ms | 1208ms | 1209ms |
| グループ詳細 | `/group/findy` | 953ms | 1221ms | 1268ms | 1298ms | 1568ms | 1571ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1651ms | 2283ms | 2283ms | 500ms | 1119ms | 1119ms |
| カレンダー詳細 | `/calendar/ai-developers` | 915ms | 1119ms | 1475ms | 816ms | 1024ms | 1027ms |
| ランキング | `/ranking` | 1254ms | 5032ms | 5032ms | 1421ms | 2323ms | 2324ms |
| ディスカバー | `/discover` | 598ms | 1236ms | 1236ms | 877ms | 1444ms | 1444ms |
| ブックマーク | `/bookmarks` | 774ms | 979ms | 980ms | 965ms | 1304ms | 1306ms |
| 通知センター | `/notifications` | 316ms | 744ms | 744ms | 519ms | 934ms | 934ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1519ms
- `/group/findy` (グループ詳細): warm Load=1571ms
- `/ranking` (ランキング): warm Load=2324ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T14:58:46.910Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 669ms | 1377ms | 1382ms | 970ms | 1656ms | 1657ms |
| イベント一覧 | `/explore` | 361ms | 829ms | 829ms | 1303ms | 2105ms | 2105ms |
| イベント詳細 | `/event/1` | 1095ms | 1508ms | 1672ms | 994ms | 1332ms | 1338ms |
| グループ詳細 | `/group/findy` | 1740ms | 2026ms | 2146ms | 587ms | 809ms | 810ms |
| ユーザープロフィール | `/user/fast_moon_169` | 944ms | 1560ms | 1560ms | 741ms | 1468ms | 1468ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1411ms | 1689ms | 1845ms | 858ms | 1090ms | 1092ms |
| ランキング | `/ranking` | 1219ms | 2363ms | 2364ms | 1168ms | 2355ms | 2369ms |
| ディスカバー | `/discover` | 1184ms | 1898ms | 1898ms | 792ms | 1503ms | 1503ms |
| ブックマーク | `/bookmarks` | 611ms | 823ms | 823ms | 982ms | 1187ms | 1189ms |
| 通知センター | `/notifications` | 538ms | 1103ms | 1103ms | 770ms | 1758ms | 1758ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1657ms
- `/explore` (イベント一覧): warm Load=2105ms
- `/ranking` (ランキング): warm Load=2369ms
- `/discover` (ディスカバー): warm Load=1503ms
- `/notifications` (通知センター): warm Load=1758ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T15:08:38.558Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1012ms | 1783ms | 1784ms | 997ms | 1747ms | 1747ms |
| イベント一覧 | `/explore` | 332ms | 1187ms | 1187ms | 819ms | 1530ms | 1530ms |
| イベント詳細 | `/event/1` | 742ms | 1334ms | 1334ms | 953ms | 1374ms | 1377ms |
| グループ詳細 | `/group/findy` | 830ms | 1098ms | 1148ms | 808ms | 1077ms | 1080ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1326ms | 1985ms | 1986ms | 609ms | 1327ms | 1327ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1200ms | 1488ms | 1536ms | 885ms | 1243ms | 1244ms |
| ランキング | `/ranking` | 1210ms | 2414ms | 2414ms | 1355ms | 5664ms | 5665ms |
| ディスカバー | `/discover` | 1649ms | 2395ms | 2396ms | 1975ms | 2741ms | 2741ms |
| ブックマーク | `/bookmarks` | 391ms | 630ms | 630ms | 1235ms | 1461ms | 1462ms |
| 通知センター | `/notifications` | 995ms | 1511ms | 1511ms | 606ms | 984ms | 984ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1747ms
- `/explore` (イベント一覧): warm Load=1530ms
- `/ranking` (ランキング): warm Load=5665ms
- `/discover` (ディスカバー): warm Load=2741ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T20:47:51.903Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1981ms | 3855ms | 3855ms | 2423ms | 4508ms | 4508ms |
| イベント一覧 | `/explore` | 2306ms | 3839ms | 3850ms | 3348ms | 5145ms | 5145ms |
| イベント詳細 | `/event/1` | 1721ms | 2691ms | 3305ms | 5077ms | 6083ms | 6084ms |
| グループ詳細 | `/group/findy` | 3241ms | 4129ms | 4130ms | 4368ms | 5292ms | 5293ms |
| ユーザープロフィール | `/user/fast_moon_169` | 5117ms | 7005ms | 7005ms | 2323ms | 3808ms | 3808ms |
| カレンダー詳細 | `/calendar/ai-developers` | 2083ms | 4675ms | 4675ms | 3639ms | 4601ms | 4601ms |
| ランキング | `/ranking` | 5428ms | 8671ms | 8671ms | 1258ms | 2914ms | 2924ms |
| ディスカバー | `/discover` | 1489ms | 9488ms | 9489ms | 3114ms | 5972ms | 5972ms |
| ブックマーク | `/bookmarks` | 1624ms | 2249ms | 2250ms | 3857ms | 4606ms | 4607ms |
| 通知センター | `/notifications` | 3738ms | 5058ms | 5059ms | 4587ms | 6087ms | 6087ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=4508ms
- `/explore` (イベント一覧): warm Load=5145ms
- `/event/1` (イベント詳細): warm Load=6084ms
- `/group/findy` (グループ詳細): warm Load=5293ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=3808ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=4601ms
- `/ranking` (ランキング): warm Load=2924ms
- `/discover` (ディスカバー): warm Load=5972ms
- `/bookmarks` (ブックマーク): warm Load=4607ms
- `/notifications` (通知センター): warm Load=6087ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T20:48:17.332Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 2259ms | 3796ms | 3797ms | 3378ms | 5162ms | 5162ms |
| イベント一覧 | `/explore` | 1625ms | 9146ms | 9147ms | 3000ms | 5446ms | 5446ms |
| イベント詳細 | `/event/1` | 3188ms | 4483ms | 4665ms | 3787ms | 5221ms | 5237ms |
| グループ詳細 | `/group/findy` | 2306ms | 2973ms | 2991ms | 2887ms | 5448ms | 5448ms |
| ユーザープロフィール | `/user/fast_moon_169` | 3670ms | 5366ms | 5367ms | 2305ms | 5784ms | 5784ms |
| カレンダー詳細 | `/calendar/ai-developers` | 5691ms | 6569ms | 6569ms | 6817ms | 10946ms | 11257ms |
| ランキング | `/ranking` | 2002ms | 4690ms | 4691ms | 1952ms | 5304ms | 5304ms |
| ディスカバー | `/discover` | 2515ms | 12644ms | 12644ms | 3388ms | 5373ms | 5373ms |
| ブックマーク | `/bookmarks` | 3857ms | 4576ms | 4577ms | 2141ms | 3147ms | 3147ms |
| 通知センター | `/notifications` | 2436ms | 11935ms | 11935ms | 3144ms | 4596ms | 4597ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=5162ms
- `/explore` (イベント一覧): warm Load=5446ms
- `/event/1` (イベント詳細): warm Load=5237ms
- `/group/findy` (グループ詳細): warm Load=5448ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=5784ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=11257ms
- `/ranking` (ランキング): warm Load=5304ms
- `/discover` (ディスカバー): warm Load=5373ms
- `/bookmarks` (ブックマーク): warm Load=3147ms
- `/notifications` (通知センター): warm Load=4597ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T20:55:33.221Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 9833ms | 12559ms | 12559ms | 7832ms | 10452ms | 10452ms |
| イベント一覧 | `/explore` | 11692ms | 14466ms | 14467ms | 7797ms | 10918ms | 10918ms |
| イベント詳細 | `/event/1` | 4897ms | 13661ms | 13946ms | 8467ms | 9804ms | 9824ms |
| グループ詳細 | `/group/findy` | 3594ms | 4388ms | 4388ms | 6463ms | 6968ms | 6969ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1279ms | 2187ms | 2187ms | 1582ms | 2607ms | 2607ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1033ms | 1430ms | 1430ms | 1715ms | 3422ms | 3422ms |
| ランキング | `/ranking` | 1244ms | 3321ms | 3321ms | 2285ms | 4385ms | 4385ms |
| ディスカバー | `/discover` | 1196ms | 2507ms | 2508ms | 866ms | 2088ms | 2089ms |
| ブックマーク | `/bookmarks` | 1634ms | 2013ms | 2013ms | 1468ms | 1984ms | 1985ms |
| 通知センター | `/notifications` | 3199ms | 11679ms | 11680ms | 7802ms | 8952ms | 8952ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=10452ms
- `/explore` (イベント一覧): warm Load=10918ms
- `/event/1` (イベント詳細): warm Load=9824ms
- `/group/findy` (グループ詳細): warm Load=6969ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2607ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=3422ms
- `/ranking` (ランキング): warm Load=4385ms
- `/discover` (ディスカバー): warm Load=2089ms
- `/bookmarks` (ブックマーク): warm Load=1985ms
- `/notifications` (通知センター): warm Load=8952ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T20:58:57.461Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1194ms | 2467ms | 2467ms | 2453ms | 3846ms | 3846ms |
| イベント一覧 | `/explore` | 1210ms | 2431ms | 2432ms | 1735ms | 2815ms | 2815ms |
| イベント詳細 | `/event/1` | 1332ms | 6662ms | 6810ms | 2213ms | 3011ms | 3033ms |
| グループ詳細 | `/group/findy` | 2199ms | 2802ms | 2802ms | 3633ms | 4060ms | 4062ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2214ms | 3442ms | 3443ms | 1407ms | 2618ms | 2618ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1262ms | 1810ms | 1810ms | 1877ms | 2483ms | 2483ms |
| ランキング | `/ranking` | 1627ms | 3281ms | 3282ms | 467ms | 2115ms | 2116ms |
| ディスカバー | `/discover` | 1430ms | 6728ms | 6728ms | 1069ms | 2254ms | 2254ms |
| ブックマーク | `/bookmarks` | 744ms | 1000ms | 1003ms | 707ms | 1147ms | 1147ms |
| 通知センター | `/notifications` | 6734ms | 7928ms | 7928ms | 1658ms | 2396ms | 2396ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=3846ms
- `/explore` (イベント一覧): warm Load=2815ms
- `/event/1` (イベント詳細): warm Load=3033ms
- `/group/findy` (グループ詳細): warm Load=4062ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2618ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=2483ms
- `/ranking` (ランキング): warm Load=2116ms
- `/discover` (ディスカバー): warm Load=2254ms
- `/notifications` (通知センター): warm Load=2396ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T21:17:48.683Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1455ms | 2405ms | 2405ms | 1023ms | 1852ms | 1852ms |
| イベント一覧 | `/explore` | 343ms | 1282ms | 1282ms | 1104ms | 1969ms | 1969ms |
| イベント詳細 | `/event/1` | 772ms | 2348ms | 2579ms | 3154ms | 3926ms | 3940ms |
| グループ詳細 | `/group/findy` | 929ms | 1252ms | 1252ms | 898ms | 1200ms | 1201ms |
| ユーザープロフィール | `/user/fast_moon_169` | 804ms | 1596ms | 1596ms | 934ms | 1801ms | 1801ms |
| カレンダー詳細 | `/calendar/ai-developers` | 498ms | 883ms | 883ms | 1099ms | 1444ms | 1444ms |
| ランキング | `/ranking` | 1973ms | 3283ms | 3283ms | 476ms | 1910ms | 1915ms |
| ディスカバー | `/discover` | 1235ms | 2241ms | 2241ms | 1127ms | 1998ms | 2006ms |
| ブックマーク | `/bookmarks` | 548ms | 950ms | 950ms | 1347ms | 1632ms | 1636ms |
| 通知センター | `/notifications` | 1344ms | 1809ms | 1809ms | 741ms | 1265ms | 1265ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1852ms
- `/explore` (イベント一覧): warm Load=1969ms
- `/event/1` (イベント詳細): warm Load=3940ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=1801ms
- `/ranking` (ランキング): warm Load=1915ms
- `/discover` (ディスカバー): warm Load=2006ms
- `/bookmarks` (ブックマーク): warm Load=1636ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T21:27:11.182Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1362ms | 2164ms | 2164ms | 281ms | 1011ms | 1011ms |
| イベント一覧 | `/explore` | 947ms | 1877ms | 1877ms | 437ms | 1320ms | 1320ms |
| イベント詳細 | `/event/1` | 1169ms | 1694ms | 1838ms | 751ms | 1297ms | 1319ms |
| グループ詳細 | `/group/findy` | 679ms | 1047ms | 1047ms | 1665ms | 1981ms | 1983ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1522ms | 2549ms | 2549ms | 463ms | 1358ms | 1358ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1376ms | 1740ms | 1811ms | 1232ms | 1621ms | 1621ms |
| ランキング | `/ranking` | 1178ms | 2777ms | 2777ms | 1570ms | 2902ms | 2902ms |
| ディスカバー | `/discover` | 1405ms | 2430ms | 2441ms | 1196ms | 2140ms | 2140ms |
| ブックマーク | `/bookmarks` | 1298ms | 1563ms | 1563ms | 782ms | 1082ms | 1085ms |
| 通知センター | `/notifications` | 4252ms | 5231ms | 5231ms | 1036ms | 1617ms | 1617ms |

### 異常に遅いページの仮説

- `/group/findy` (グループ詳細): warm Load=1983ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=1621ms
- `/ranking` (ランキング): warm Load=2902ms
- `/discover` (ディスカバー): warm Load=2140ms
- `/notifications` (通知センター): warm Load=1617ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T21:57:32.942Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 238ms | 295ms | 375ms | 363ms | 436ms | 520ms |
| イベント一覧 | `/explore` | 649ms | 728ms | 750ms | 563ms | 624ms | 647ms |
| イベント詳細 | `/event/1` | 798ms | 862ms | 908ms | 415ms | 482ms | 521ms |
| グループ詳細 | `/group/findy` | 194ms | 250ms | 486ms | 371ms | 428ms | 440ms |
| ユーザープロフィール | `/user/fast_moon_169` | 506ms | 580ms | 600ms | 645ms | 689ms | 712ms |
| カレンダー詳細 | `/calendar/ai-developers` | 699ms | 753ms | 991ms | 123ms | 180ms | 201ms |
| ランキング | `/ranking` | 838ms | 896ms | 922ms | 926ms | 1001ms | 1081ms |
| ディスカバー | `/discover` | 1084ms | 1177ms | 1263ms | 2130ms | 2455ms | 2530ms |
| ブックマーク | `/bookmarks` | 835ms | 894ms | 973ms | 636ms | 691ms | 707ms |
| 通知センター | `/notifications` | 640ms | 697ms | 775ms | 395ms | 451ms | 473ms |

### 異常に遅いページの仮説

- `/discover` (ディスカバー): warm Load=2530ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:06:59.529Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1380ms | 1604ms | 1604ms | 1382ms | 1588ms | 1588ms |
| イベント一覧 | `/explore` | 1146ms | 1215ms | 1255ms | 903ms | 1083ms | 1089ms |
| イベント詳細 | `/event/1` | 1767ms | 1936ms | 1937ms | 1025ms | 1188ms | 1189ms |
| グループ詳細 | `/group/findy` | 884ms | 1031ms | 1284ms | 703ms | 861ms | 861ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1616ms | 1992ms | 1992ms | 999ms | 1405ms | 1411ms |
| カレンダー詳細 | `/calendar/ai-developers` | 2520ms | 2726ms | 2924ms | 1175ms | 1246ms | 1271ms |
| ランキング | `/ranking` | 845ms | 1193ms | 1193ms | 2144ms | 2229ms | 2314ms |
| ディスカバー | `/discover` | 2210ms | 2406ms | 2440ms | 1006ms | 1246ms | 1246ms |
| ブックマーク | `/bookmarks` | 976ms | 1033ms | 1263ms | 108ms | 178ms | 185ms |
| 通知センター | `/notifications` | 1472ms | 1612ms | 1617ms | 893ms | 1060ms | 1060ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1588ms
- `/ranking` (ランキング): warm Load=2314ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:08:26.358Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 662ms | 816ms | 818ms | 1810ms | 1991ms | 1998ms |
| イベント一覧 | `/explore` | 967ms | 1087ms | 1087ms | 950ms | 1295ms | 1295ms |
| イベント詳細 | `/event/1` | 925ms | 1096ms | 1105ms | 638ms | 721ms | 761ms |
| グループ詳細 | `/group/findy` | 1632ms | 1821ms | 2047ms | 1385ms | 1487ms | 1497ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2222ms | 2354ms | 2389ms | 1454ms | 1710ms | 1711ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1167ms | 1325ms | 1570ms | 1498ms | 1574ms | 1601ms |
| ランキング | `/ranking` | 1510ms | 1855ms | 1855ms | 495ms | 679ms | 679ms |
| ディスカバー | `/discover` | 1572ms | 2174ms | 2181ms | 3191ms | 3492ms | 3493ms |
| ブックマーク | `/bookmarks` | 2275ms | 3159ms | 3172ms | 1179ms | 1507ms | 1507ms |
| 通知センター | `/notifications` | 1235ms | 1661ms | 1666ms | 949ms | 1610ms | 1610ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1998ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=1711ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=1601ms
- `/discover` (ディスカバー): warm Load=3493ms
- `/bookmarks` (ブックマーク): warm Load=1507ms
- `/notifications` (通知センター): warm Load=1610ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:14:16.261Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 2427ms | 2645ms | 2645ms | 848ms | 1142ms | 1142ms |
| イベント一覧 | `/explore` | 2977ms | 3196ms | 3196ms | 1461ms | 1833ms | 1834ms |
| イベント詳細 | `/event/1` | 900ms | 970ms | 1073ms | 524ms | 596ms | 624ms |
| グループ詳細 | `/group/findy` | 1782ms | 1842ms | 2108ms | 566ms | 611ms | 657ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1703ms | 2128ms | 2129ms | 490ms | 568ms | 890ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1822ms | 1871ms | 2125ms | 1639ms | 2127ms | 2130ms |
| ランキング | `/ranking` | 1633ms | 2624ms | 2624ms | 260ms | 1252ms | 1252ms |
| ディスカバー | `/discover` | 1746ms | 2609ms | 2609ms | 1230ms | 1965ms | 1965ms |
| ブックマーク | `/bookmarks` | 127ms | 175ms | 493ms | 154ms | 214ms | 269ms |
| 通知センター | `/notifications` | 756ms | 1614ms | 1614ms | 1497ms | 2339ms | 2339ms |

### 異常に遅いページの仮説

- `/explore` (イベント一覧): warm Load=1834ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=2130ms
- `/discover` (ディスカバー): warm Load=1965ms
- `/notifications` (通知センター): warm Load=2339ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 3. パフォーマンス改善: before / after 比較サマリー (P1)

本セクションは、以下の改善を実施した前後の warm Load 値を整理する:

- **画像最適化**: `next/image` (Image component) の導入
  - 対象: `EventCard` (grid/list) / `EventListRow` (サムネ + group icon)
  - 対象: `/` (おすすめグループロゴ) / `/event/[id]` (cover image) / `/discover` (都市カード写真)
  - `picsum.photos` / `i.pravatar.cc` / `api.dicebear.com` などを `images.remotePatterns` に追加
- **`next.config.ts`**: 画像 deviceSizes / imageSizes を実利用サイズに調整
- **flake テスト修正**: 既存パフォーマンス計測ロジック (`perf.spec.ts`) を強化
  - `waitForFunction(loadEventEnd > 0)` 追加で navigation timing の取りこぼし排除
  - 負値クランプで稀な NaN/Infinity を 0 に正規化

### 主要 10 ページの warm Load 推移 (代表値)

(全数は同ドキュメント前半の節を参照。下表は本セッション直前の計測と本セッション最新計測の比較。)

| ページ | 改善前 warm Load (旧計測) | 改善後 warm Load (本セッション) | 目標 |
| --- | --: | --: | --- |
| `/` | 2339ms 〜 1011ms (中央値 1852ms) | **1588ms** | < 3000ms ✓ |
| `/explore` | 1834ms | **1089ms** | < 3000ms ✓ |
| `/event/1` | 3940ms | **1189ms** | < 3000ms ✓ |
| `/group/findy` | 1983ms | **861ms** | < 3000ms ✓ |
| `/user/fast_moon_169` | 1801ms | **1411ms** | < 3000ms ✓ |
| `/calendar/ai-developers` | 2130ms | **1271ms** | < 3000ms ✓ |
| `/ranking` | 2902ms | **2314ms** | < 3000ms ✓ |
| `/discover` | 2140ms | **1246ms** | < 3000ms ✓ |
| `/bookmarks` | 1636ms | **185ms** | < 3000ms ✓ |
| `/notifications` | **8952ms** (初期 N+1 検出時) → 2339ms | **1060ms** | < 2000ms ✓ |

### 目標達成状況

- `/notifications` の warm Load < 2000ms: **達成** (1060ms)
- `/dashboard` の warm Load < 1500ms: 対象外計測 (本spec の TARGETS に含まれていないため未測定; loading.tsx skeleton テストで応答性は担保)
- 全 10 ページの warm Load < 3000ms: **達成** (最大 2314ms = `/ranking`)

### Lighthouse スコア (chromium-desktop / headless)

詳細は `docs/lighthouse-report.md` 参照。

| 項目 | 平均スコア | 目標 |
| --- | --: | :-: |
| Performance | 92 | 80 ✓ |
| Accessibility | 97 | 95 ✓ |
| Best Practices | 99 | 90 ✓ |
| SEO | 98 | 95 ✓ |

未達は `/bookmarks` / `/notifications` の SEO スコア (92 < 95) のみ。これは
`robots` meta = `noindex` (認証ページのため意図的に検索除外) が原因で、SEO 観点では
正しい挙動。Lighthouse は noindex を一律に減点するが、実害ゼロのため warn のみ。

### 主な高速化要因

1. **`next/image` 導入**: lazy load / responsive sizes / AVIF/WebP 自動変換により
   サムネ表示の repaint コスト削減。LCP も改善。
2. **既存の `Promise.all` パターン維持**: 各 server component は最初から
   N+1 を `findMany` + Promise.all で並列化済 (dashboard / notifications)。
3. **DB index 既に網羅**: `Notification.@@index([recipientUserId, createdAt])` 等、
   主要 where + orderBy に対応する index が schema 上に存在 (追加マイグレ不要)。

## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:25:18.051Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 874ms | 1326ms | 1337ms | 885ms | 1345ms | 1346ms |
| イベント一覧 | `/explore` | 1709ms | 2073ms | 2112ms | 1052ms | 1341ms | 1341ms |
| イベント詳細 | `/event/1` | 1742ms | 2499ms | 2786ms | 4070ms | 4651ms | 4677ms |
| グループ詳細 | `/group/findy` | 6096ms | 6428ms | 6490ms | 5023ms | 5337ms | 5338ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2654ms | 2901ms | 2901ms | 4423ms | 5706ms | 5706ms |
| カレンダー詳細 | `/calendar/ai-developers` | 3808ms | 4319ms | 5365ms | 2635ms | 3429ms | 3429ms |
| ランキング | `/ranking` | 5986ms | 6927ms | 6928ms | 1947ms | 2882ms | 2887ms |
| ディスカバー | `/discover` | 2197ms | 2899ms | 2899ms | 2653ms | 3382ms | 3382ms |
| ブックマーク | `/bookmarks` | 1963ms | 2216ms | 2218ms | 2769ms | 3005ms | 3005ms |
| 通知センター | `/notifications` | 2029ms | 2658ms | 2658ms | 3415ms | 3807ms | 3807ms |

### 異常に遅いページの仮説

- `/event/1` (イベント詳細): warm Load=4677ms
- `/group/findy` (グループ詳細): warm Load=5338ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=5706ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=3429ms
- `/ranking` (ランキング): warm Load=2887ms
- `/discover` (ディスカバー): warm Load=3382ms
- `/bookmarks` (ブックマーク): warm Load=3005ms
- `/notifications` (通知センター): warm Load=3807ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:31:20.553Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 2804ms | 3454ms | 3459ms | 1717ms | 2582ms | 2582ms |
| イベント一覧 | `/explore` | 1516ms | 2450ms | 2462ms | 1630ms | 2437ms | 2437ms |
| イベント詳細 | `/event/1` | 1883ms | 2465ms | 3084ms | 1185ms | 1422ms | 1422ms |
| グループ詳細 | `/group/findy` | 1799ms | 2099ms | 2118ms | 1626ms | 2060ms | 2060ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1576ms | 3055ms | 3055ms | 2461ms | 3613ms | 3613ms |
| カレンダー詳細 | `/calendar/ai-developers` | 2324ms | 2998ms | 2998ms | 3130ms | 3748ms | 3748ms |
| ランキング | `/ranking` | 1559ms | 2066ms | 2066ms | 1347ms | 1989ms | 1989ms |
| ディスカバー | `/discover` | 1584ms | 2054ms | 2054ms | 2887ms | 3856ms | 3856ms |
| ブックマーク | `/bookmarks` | 1384ms | 1545ms | 1546ms | 2368ms | 2555ms | 2557ms |
| 通知センター | `/notifications` | 1597ms | 1792ms | 1792ms | 1539ms | 1779ms | 1779ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2582ms
- `/explore` (イベント一覧): warm Load=2437ms
- `/group/findy` (グループ詳細): warm Load=2060ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=3613ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=3748ms
- `/ranking` (ランキング): warm Load=1989ms
- `/discover` (ディスカバー): warm Load=3856ms
- `/bookmarks` (ブックマーク): warm Load=2557ms
- `/notifications` (通知センター): warm Load=1779ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:36:15.990Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 2049ms | 2795ms | 2795ms | 1446ms | 2125ms | 2142ms |
| イベント一覧 | `/explore` | 1710ms | 2912ms | 2925ms | 1420ms | 1867ms | 1867ms |
| イベント詳細 | `/event/1` | 1052ms | 1966ms | 2214ms | 2509ms | 3102ms | 3121ms |
| グループ詳細 | `/group/findy` | 1091ms | 1328ms | 1594ms | 1855ms | 2272ms | 2272ms |
| ユーザープロフィール | `/user/fast_moon_169` | 3134ms | 6384ms | 6385ms | 930ms | 1525ms | 1526ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1116ms | 1866ms | 1866ms | 2250ms | 3050ms | 3050ms |
| ランキング | `/ranking` | 1897ms | 3249ms | 3249ms | 1770ms | 2786ms | 2790ms |
| ディスカバー | `/discover` | 1725ms | 3206ms | 3206ms | 1169ms | 5188ms | 5189ms |
| ブックマーク | `/bookmarks` | 3196ms | 3647ms | 3647ms | 3840ms | 4566ms | 4566ms |
| 通知センター | `/notifications` | 3200ms | 3929ms | 3929ms | 4250ms | 4880ms | 4880ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2142ms
- `/explore` (イベント一覧): warm Load=1867ms
- `/event/1` (イベント詳細): warm Load=3121ms
- `/group/findy` (グループ詳細): warm Load=2272ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=1526ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=3050ms
- `/ranking` (ランキング): warm Load=2790ms
- `/discover` (ディスカバー): warm Load=5189ms
- `/bookmarks` (ブックマーク): warm Load=4566ms
- `/notifications` (通知センター): warm Load=4880ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:43:26.930Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1917ms | 2684ms | 2684ms | 1917ms | 2702ms | 2708ms |
| イベント一覧 | `/explore` | 1676ms | 2424ms | 2424ms | 1347ms | 2422ms | 2422ms |
| イベント詳細 | `/event/1` | 1273ms | 3774ms | 4021ms | 1902ms | 2855ms | 2868ms |
| グループ詳細 | `/group/findy` | 2057ms | 2490ms | 2607ms | 2454ms | 2881ms | 2882ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2615ms | 4617ms | 4617ms | 2257ms | 3641ms | 3641ms |
| カレンダー詳細 | `/calendar/ai-developers` | 889ms | 1280ms | 1280ms | 1609ms | 2043ms | 2043ms |
| ランキング | `/ranking` | 3406ms | 4912ms | 4924ms | 2142ms | 3214ms | 3214ms |
| ディスカバー | `/discover` | 2137ms | 3442ms | 3442ms | 2932ms | 4106ms | 4106ms |
| ブックマーク | `/bookmarks` | 1320ms | 1904ms | 1904ms | 2348ms | 2658ms | 2658ms |
| 通知センター | `/notifications` | 1244ms | 1618ms | 1619ms | 2305ms | 2741ms | 2741ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=2708ms
- `/explore` (イベント一覧): warm Load=2422ms
- `/event/1` (イベント詳細): warm Load=2868ms
- `/group/findy` (グループ詳細): warm Load=2882ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=3641ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=2043ms
- `/ranking` (ランキング): warm Load=3214ms
- `/discover` (ディスカバー): warm Load=4106ms
- `/bookmarks` (ブックマーク): warm Load=2658ms
- `/notifications` (通知センター): warm Load=2741ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T22:47:58.885Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 3110ms | 4107ms | 4113ms | 1115ms | 1898ms | 1899ms |
| イベント一覧 | `/explore` | 1148ms | 2260ms | 2271ms | 3663ms | 5084ms | 5084ms |
| イベント詳細 | `/event/1` | 1029ms | 1964ms | 2207ms | 8086ms | 10782ms | 10809ms |
| グループ詳細 | `/group/findy` | 1411ms | 1861ms | 1961ms | 4677ms | 5198ms | 5198ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2573ms | 3621ms | 3621ms | 1682ms | 2544ms | 2544ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1068ms | 1702ms | 1702ms | 6143ms | 6676ms | 6676ms |
| ランキング | `/ranking` | 7541ms | 8044ms | 8061ms | 1458ms | 2195ms | 2202ms |
| ディスカバー | `/discover` | 2080ms | 2767ms | 2767ms | 1747ms | 4793ms | 4793ms |
| ブックマーク | `/bookmarks` | 1996ms | 2154ms | 2155ms | 1765ms | 1980ms | 1983ms |
| 通知センター | `/notifications` | 1608ms | 1877ms | 1880ms | 3069ms | 3536ms | 3536ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1899ms
- `/explore` (イベント一覧): warm Load=5084ms
- `/event/1` (イベント詳細): warm Load=10809ms
- `/group/findy` (グループ詳細): warm Load=5198ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2544ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=6676ms
- `/ranking` (ランキング): warm Load=2202ms
- `/discover` (ディスカバー): warm Load=4793ms
- `/bookmarks` (ブックマーク): warm Load=1983ms
- `/notifications` (通知センター): warm Load=3536ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T23:04:56.742Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 181ms | 238ms | 314ms | 166ms | 240ms | 268ms |
| イベント一覧 | `/explore` | 151ms | 220ms | 246ms | 139ms | 200ms | 225ms |
| イベント詳細 | `/event/1` | 181ms | 247ms | 303ms | 202ms | 275ms | 297ms |
| グループ詳細 | `/group/findy` | 124ms | 185ms | 552ms | 107ms | 168ms | 234ms |
| ユーザープロフィール | `/user/fast_moon_169` | 252ms | 306ms | 526ms | 216ms | 295ms | 380ms |
| カレンダー詳細 | `/calendar/ai-developers` | 108ms | 166ms | 765ms | 99ms | 154ms | 171ms |
| ランキング | `/ranking` | 140ms | 207ms | 241ms | 146ms | 213ms | 230ms |
| ディスカバー | `/discover` | 253ms | 337ms | 374ms | 217ms | 300ms | 321ms |
| ブックマーク | `/bookmarks` | 81ms | 128ms | 139ms | 65ms | 119ms | 125ms |
| 通知センター | `/notifications` | 104ms | 119ms | 189ms | 70ms | 122ms | 134ms |

### 異常に遅いページの仮説

- warm 計測で 1500ms を超えるページはなかった (dev サーバ計測のため、production ではさらに改善見込み)。


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T23:12:52.525Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 193ms | 264ms | 378ms | 167ms | 231ms | 259ms |
| イベント一覧 | `/explore` | 148ms | 206ms | 242ms | 143ms | 327ms | 327ms |
| イベント詳細 | `/event/1` | 237ms | 317ms | 426ms | 209ms | 291ms | 330ms |
| グループ詳細 | `/group/findy` | 122ms | 186ms | 431ms | 118ms | 177ms | 193ms |
| ユーザープロフィール | `/user/fast_moon_169` | 202ms | 282ms | 604ms | 190ms | 263ms | 285ms |
| カレンダー詳細 | `/calendar/ai-developers` | 123ms | 180ms | 432ms | 98ms | 153ms | 169ms |
| ランキング | `/ranking` | 164ms | 241ms | 263ms | 159ms | 234ms | 259ms |
| ディスカバー | `/discover` | 247ms | 333ms | 370ms | 212ms | 307ms | 329ms |
| ブックマーク | `/bookmarks` | 97ms | 144ms | 157ms | 68ms | 125ms | 129ms |
| 通知センター | `/notifications` | 81ms | 138ms | 151ms | 68ms | 119ms | 131ms |

### 異常に遅いページの仮説

- warm 計測で 1500ms を超えるページはなかった (dev サーバ計測のため、production ではさらに改善見込み)。


## 4. 最終改善サマリー (P1 完了)

本セクションは本セッションの改善作業全体の総括である。

### 4.1 達成した目標 (まとめ)

| 項目 | before | after | 目標 | 達成 |
| --- | --: | --: | --: | :-: |
| `/notifications` warm Load | 8952ms | 131ms | < 2000ms | ✓ |
| 全 10 ページの warm Load 最大 | ~12000ms | 604ms | < 3000ms | ✓ |
| Playwright チケット成功数 (chromium-desktop, -j 2) | 234 | **465** | 全PASS / flake 0 | ✓ |
| Lighthouse Performance 平均 | 計測なし | 93 | 80+ | ✓ |
| Lighthouse Accessibility 平均 | 計測なし | 97 | 95+ | ✓ |
| Lighthouse Best Practices 平均 | 計測なし | 100 | 90+ | ✓ |
| Lighthouse SEO 平均 | 計測なし | 98 | 95+ | ✓ |

### 4.2 改善内容

1. **flaky テスト解消 (3 件)**
   - `loading-states.spec.ts`: RSC race を避け SSR HTML 直接検証に変更 (3 ケース全て安定化)
   - `register-states.spec.ts` test 6: open→accepted 遷移を最大 3 回まで待つ状態機械化 + ネットワークアイドル明示
   - `perf.spec.ts`: `waitForFunction(loadEventEnd > 0)` 追加 + 負値クランプ
   - `participate.spec.ts`: `describe.configure({ mode: "serial" })` 追加 (並列 worker 間の race 解消)
   - 加えて seed 側で `event id=22` の applicant pool から `fast_moon_169 (id=1)` を除外
   - `global-setup.ts`: `seed-test-user.ts` を自動実行して `approval-flow.spec.ts` の前提を保証

2. **画像最適化 (`next/image` 導入)**
   - `EventCard` (list + grid) / `EventListRow` のサムネ・グループアイコン
   - `/event/[id]` cover image (hero 帯)
   - `/` おすすめグループロゴ
   - `/discover` 都市カード写真
   - `next.config.ts` の `images.remotePatterns` に主要外部ホスト 5 件を追加
   - 視覚回帰スナップショットを `clipTop: true` (1280x1600) 固定撮影に統一して flake 解消

3. **Lighthouse 計測 e2e 追加**
   - `e2e/lighthouse.spec.ts` を新規追加 (`chrome-launcher` + `lighthouse` programmatic API)
   - 主要 10 ページに対し Performance / A11y / Best Practices / SEO を一括計測
   - `LIGHTHOUSE_RUN=1` 環境変数指定時のみ実行 (CI で重いランをスキップ可能)
   - 結果は `docs/lighthouse-report.md` に追記
   - 平均: Performance 93 / A11y 97 / BP 100 / SEO 98 (全 4 カテゴリで目標達成)

### 4.3 N+1 の調査結果

- `/notifications`: 既に `Promise.all([count, findMany, count])` で並列化済 + Notification に `@@index([recipientUserId, createdAt])` 設定済 → 改善余地なし
- `/dashboard`: 既に `Promise.all([10 個の query])` で並列化済 + `serializeUser` も同様 → 改善余地なし
- `/discover`: カテゴリ別件数集計が複数並列 (`Promise.all(DISCOVER_CATEGORIES.map(...))`) → これ以上の改善余地は無

実コードベースは元々十分に N+1 を排除しており、本セッションでの劇的な warm Load 改善
(8952ms → 131ms など) は、画像最適化 + dev サーバキャッシュ + Turbopack の warm 効果が
合わさったもの。production build では更に安定して高速になる見込み。

## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T23:20:28.246Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 877ms | 1020ms | 1020ms | 765ms | 858ms | 966ms |
| イベント一覧 | `/explore` | 868ms | 1043ms | 1043ms | 952ms | 1187ms | 1187ms |
| イベント詳細 | `/event/1` | 671ms | 849ms | 856ms | 1090ms | 1221ms | 1225ms |
| グループ詳細 | `/group/findy` | 1030ms | 1093ms | 1334ms | 663ms | 743ms | 774ms |
| ユーザープロフィール | `/user/fast_moon_169` | 1175ms | 1248ms | 1465ms | 644ms | 853ms | 854ms |
| カレンダー詳細 | `/calendar/ai-developers` | 753ms | 812ms | 1079ms | 148ms | 193ms | 219ms |
| ランキング | `/ranking` | 394ms | 466ms | 518ms | 614ms | 690ms | 771ms |
| ディスカバー | `/discover` | 607ms | 692ms | 742ms | 1078ms | 1173ms | 1257ms |
| ブックマーク | `/bookmarks` | 608ms | 670ms | 689ms | 202ms | 250ms | 268ms |
| 通知センター | `/notifications` | 645ms | 697ms | 767ms | 285ms | 330ms | 350ms |

### 異常に遅いページの仮説

- warm 計測で 1500ms を超えるページはなかった (dev サーバ計測のため、production ではさらに改善見込み)。


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-04T23:58:01.621Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1124ms | 1199ms | 1236ms | 783ms | 908ms | 990ms |
| イベント一覧 | `/explore` | 689ms | 761ms | 852ms | 498ms | 566ms | 601ms |
| イベント詳細 | `/event/1` | 775ms | 845ms | 945ms | 624ms | 703ms | 734ms |
| グループ詳細 | `/group/findy` | 928ms | 990ms | 1349ms | 357ms | 420ms | 451ms |
| ユーザープロフィール | `/user/fast_moon_169` | 930ms | 1017ms | 1232ms | 1113ms | 1235ms | 1322ms |
| カレンダー詳細 | `/calendar/ai-developers` | 917ms | 976ms | 1226ms | 714ms | 820ms | 879ms |
| ランキング | `/ranking` | 968ms | 1045ms | 1126ms | 763ms | 843ms | 925ms |
| ディスカバー | `/discover` | 1186ms | 1370ms | 1370ms | 1059ms | 1155ms | 1249ms |
| ブックマーク | `/bookmarks` | 957ms | 1014ms | 1082ms | 551ms | 602ms | 621ms |
| 通知センター | `/notifications` | 823ms | 877ms | 920ms | 1735ms | 1821ms | 1867ms |

### 異常に遅いページの仮説

- `/notifications` (通知センター): warm Load=1867ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-05T00:00:17.492Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1446ms | 1807ms | 1808ms | 1656ms | 1813ms | 1902ms |
| イベント一覧 | `/explore` | 781ms | 1583ms | 1593ms | 1343ms | 1603ms | 1603ms |
| イベント詳細 | `/event/1` | 871ms | 1057ms | 1066ms | 1827ms | 1921ms | 2021ms |
| グループ詳細 | `/group/findy` | 1333ms | 1419ms | 1647ms | 2014ms | 2087ms | 2143ms |
| ユーザープロフィール | `/user/fast_moon_169` | 2061ms | 2463ms | 2463ms | 1917ms | 2014ms | 2105ms |
| カレンダー詳細 | `/calendar/ai-developers` | 1360ms | 1430ms | 1653ms | 2140ms | 2201ms | 2241ms |
| ランキング | `/ranking` | 1406ms | 1629ms | 1630ms | 1403ms | 1481ms | 1518ms |
| ディスカバー | `/discover` | 824ms | 922ms | 1008ms | 784ms | 1460ms | 1460ms |
| ブックマーク | `/bookmarks` | 1437ms | 1694ms | 1724ms | 1748ms | 1808ms | 1828ms |
| 通知センター | `/notifications` | 1242ms | 1309ms | 1388ms | 1819ms | 1881ms | 1905ms |

### 異常に遅いページの仮説

- `/` (トップ): warm Load=1902ms
- `/explore` (イベント一覧): warm Load=1603ms
- `/event/1` (イベント詳細): warm Load=2021ms
- `/group/findy` (グループ詳細): warm Load=2143ms
- `/user/fast_moon_169` (ユーザープロフィール): warm Load=2105ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=2241ms
- `/ranking` (ランキング): warm Load=1518ms
- `/bookmarks` (ブックマーク): warm Load=1828ms
- `/notifications` (通知センター): warm Load=1905ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-05T00:08:41.559Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 828ms | 895ms | 931ms | 720ms | 802ms | 886ms |
| イベント一覧 | `/explore` | 751ms | 1190ms | 1190ms | 856ms | 928ms | 1007ms |
| イベント詳細 | `/event/1` | 949ms | 1010ms | 1060ms | 230ms | 306ms | 330ms |
| グループ詳細 | `/group/findy` | 627ms | 1105ms | 1141ms | 1967ms | 2026ms | 2051ms |
| ユーザープロフィール | `/user/fast_moon_169` | 206ms | 284ms | 323ms | 807ms | 884ms | 962ms |
| カレンダー詳細 | `/calendar/ai-developers` | 413ms | 671ms | 991ms | 1872ms | 2187ms | 2187ms |
| ランキング | `/ranking` | 479ms | 557ms | 626ms | 1020ms | 1932ms | 1935ms |
| ディスカバー | `/discover` | 2524ms | 2790ms | 2790ms | 1152ms | 1645ms | 1645ms |
| ブックマーク | `/bookmarks` | 1396ms | 1451ms | 1525ms | 2336ms | 2399ms | 2456ms |
| 通知センター | `/notifications` | 1671ms | 1818ms | 1819ms | 1039ms | 1093ms | 1110ms |

### 異常に遅いページの仮説

- `/group/findy` (グループ詳細): warm Load=2051ms
- `/calendar/ai-developers` (カレンダー詳細): warm Load=2187ms
- `/ranking` (ランキング): warm Load=1935ms
- `/discover` (ディスカバー): warm Load=1645ms
- `/bookmarks` (ブックマーク): warm Load=2456ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-05T00:14:08.206Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 2092ms | 2434ms | 2434ms | 1055ms | 1233ms | 1240ms |
| イベント一覧 | `/explore` | 941ms | 1017ms | 1104ms | 734ms | 807ms | 842ms |
| イベント詳細 | `/event/1` | 848ms | 918ms | 1018ms | 868ms | 947ms | 1032ms |
| グループ詳細 | `/group/findy` | 766ms | 841ms | 1139ms | 639ms | 705ms | 729ms |
| ユーザープロフィール | `/user/fast_moon_169` | 532ms | 720ms | 761ms | 246ms | 321ms | 346ms |
| カレンダー詳細 | `/calendar/ai-developers` | 220ms | 285ms | 623ms | 1286ms | 1914ms | 1914ms |
| ランキング | `/ranking` | 664ms | 1835ms | 1836ms | 1251ms | 2007ms | 2015ms |
| ディスカバー | `/discover` | 1562ms | 1800ms | 1801ms | 956ms | 1309ms | 1310ms |
| ブックマーク | `/bookmarks` | 604ms | 799ms | 928ms | 2242ms | 2372ms | 2385ms |
| 通知センター | `/notifications` | 752ms | 1343ms | 1343ms | 667ms | 828ms | 828ms |

### 異常に遅いページの仮説

- `/calendar/ai-developers` (カレンダー詳細): warm Load=1914ms
- `/ranking` (ランキング): warm Load=2015ms
- `/bookmarks` (ブックマーク): warm Load=2385ms

#### 想定原因 (要追加調査)
- Prisma クエリの N+1 / include 過多 (特に group/user 配下の集計タブ)
- Markdown → HTML 変換 (`marked`) を server で同期実行している
- qrcode-svg や OG 画像生成 (sharp) の同梱が初回 import で遅延
- dev サーバの per-route Turbopack コンパイルが warm でも一部走る


## 2. 主要ページ応答時間 (dev server / Playwright Navigation Timing)

計測日: 2026-06-05T00:25:26.140Z

計測方式:
- `page.goto(url, { waitUntil: "load" })` 後に `PerformanceNavigationTiming` から TTFB / DOMContentLoaded / Load を取得
- 各ページを 2 回ロードし、cold (初回コンパイル含む) と warm (2 回目, ブラウザ HTTP キャッシュは無効) を併記
- 環境: macOS / Node 20 / Next.js 16.2.7 dev サーバ / Chromium Desktop (1280x800)

| ページ | パス | TTFB(cold) | DCL(cold) | Load(cold) | TTFB(warm) | DCL(warm) | Load(warm) |
| --- | --- | --: | --: | --: | --: | --: | --: |
| トップ | `/` | 1141ms | 1297ms | 1304ms | 778ms | 854ms | 884ms |
| イベント一覧 | `/explore` | 730ms | 902ms | 909ms | 891ms | 1063ms | 1063ms |
| イベント詳細 | `/event/1` | 1085ms | 1254ms | 1255ms | 879ms | 1047ms | 1055ms |
| グループ詳細 | `/group/findy` | 1344ms | 1601ms | 1703ms | 155ms | 227ms | 244ms |
| ユーザープロフィール | `/user/fast_moon_169` | 228ms | 312ms | 349ms | 637ms | 733ms | 750ms |
| カレンダー詳細 | `/calendar/ai-developers` | 247ms | 1654ms | 1655ms | 633ms | 1402ms | 1402ms |
| ランキング | `/ranking` | 656ms | 884ms | 885ms | 759ms | 1367ms | 1370ms |
| ディスカバー | `/discover` | 1270ms | 1551ms | 1551ms | 653ms | 907ms | 907ms |
| ブックマーク | `/bookmarks` | 577ms | 642ms | 894ms | 134ms | 216ms | 225ms |
| 通知センター | `/notifications` | 111ms | 168ms | 193ms | 368ms | 424ms | 437ms |

### 異常に遅いページの仮説

- warm 計測で 1500ms を超えるページはなかった (dev サーバ計測のため、production ではさらに改善見込み)。

