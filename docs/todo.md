# tech-event 残課題集約

このドキュメントはコード内に散らばる `TODO` / `FIXME` / `XXX` コメントを集約したものです。
コード品質レビュー (`research/code-review/*.md`) の Medium / Low 指摘のうち
**実装には踏み切らないが追跡が必要なもの** をリストアップしています。

最終更新: 2026-06-05

---

## A. UI 未実装 (Schema 先行済み)

### A1. `GroupBlacklist` — グループ BAN UI
- 位置: `prisma/schema.prisma:142` (`/// TODO: UI実装`)
- 状況: テーブル定義は存在 (空テーブル) / Server Action 無し / UI 無し。
- 仕様: `research/luma/features/` 参照。
- 想定実装場所: `src/app/group/[subdomain]/admin/blacklist/page.tsx`,
  `src/app/actions/group-actions.ts` に `addToBlacklist` / `removeFromBlacklist` を追加。

### A2. 公開 API v2 — カテゴリ enum マッピング
- 位置: `src/app/api/v2/events/route.ts:23`
- 状況: 一部のカテゴリしか mapping されていない (TODO)。
- 想定対応: connpass v1/v2 と同一の `category` enum を全件マッピング。

### A3. PG 用 native enum 移行
- 位置: `prisma/schema.postgres.prisma:6`
- 状況: `status` / `eventFormat` / `recruitmentMethod` 等を将来的に PG native enum へ。
  SQLite は文字列で運用しているので互換性のため当面は同じ。

---

## B. dead code / unused (削除保留)

「CLAUDE.md の不変原則 1.1 (既存機能・既存テストを削減しない)」 に従い、未使用でも
ライブラリ層の export は残している。下記は監視対象。

### B1. `src/lib/serialize.ts`
- `bigintToString(value)` (line 27): src/ 内利用 0 件。
- `nullableBigintToString(value)` (line 31): src/ 内利用 0 件。
- `nullableDateToIso(value)` (line 41): src/ 内利用 0 件。
- `serializeDeep<T>(value)` (line 187): src/ 内利用 0 件。
- 判断: ライブラリ層 API として残す。E2E / 単体テスト追加時に活用候補。

### B2. テスト用 reset ヘルパー (export はあるが呼ばれていない)
- `src/lib/mailer.ts:255` `resetTransporterCacheForTesting()`
- `src/lib/search.ts:427` `resetSearchCacheForTesting()`
- `src/lib/public-api.ts:122` `_resetRateLimitForTest()`
- 判断: Vitest 単体テスト導入時に呼ぶ想定なので保留。

### B3. `Footer.tsx` `getEmptyDict`
- 状況: **2026-06-05 削除済み** (code-quality.md Medium #13)。

### B4. `VoucherCode` / `EventStat` モデル
- 状況: **2026-06-05 削除済み** (migration `20260605120100_remove_voucher_codes_and_event_stats`)。

---

## C. 採番 / DB レベルのレース

### C1. `_max + 1` パターンの race condition
- 位置: `src/lib/id-gen.ts` (`nextId`) + 全 Server Action
- 状況: `withRetry()` で P2002 をリトライしているが、根本対応は Prisma 7 driver-adapter
  の autoincrement サポート完了待ち、または PG 移行で sequence に倒す。
- 監視: `code-review/code-quality.md` Critical #2 / Critical #3。

### C2. `Event.acceptedCount` / `Event.waitingCount` の increment vs count
- 位置: `src/app/actions/event-actions.ts` (`increment`)、
  `src/app/actions/event-admin-actions.ts:remove*` (`count → set`)
- 状況: 採番が混在しており data-model.md Medium #20 に指摘あり。
- 想定対応: `count → set` 方式に統一する、または DB trigger 化。

---

## D. データモデルの整合性 (data-model.md Medium)

### D1. `Bookmark` 一覧の無制限取得
- 位置: `src/app/bookmarks/page.tsx`
- 想定: `take: 50` + cursor pagination。

### D2. admin overview の participants 全件 include
- 位置: `src/app/event/[id]/admin/page.tsx`
- 想定: `take: 50` + KPI 別 `groupBy`。

### D3. `Comment.parentCommentId onDelete=SetNull`
- 想定: ソフトデリート方式 (`deletedAt`) で論理削除する現方針なら
  `onDelete=Restrict` に変更しスレッド破綻を防ぐ。

### D4. `Participant.unique([eventId, userId, eventRoleId])` の重複防御
- 想定: `unique([eventId, userId])` で枠変更も含めて DB レベルで防ぐ。

### D5. `Notification.payload` (String JSON) の型保証
- 想定: Zod schema で parse + version field。

### D6. `Message.audience` `"group_members"` が dead value
- 位置: `src/app/actions/event-admin-actions.ts:680-687`
- 想定: enum を `src/lib/notification.ts` に export し、Zod 検証と DB コメントを同期。

### D7. `Calendar.slug` 文字数制限 (SQLite vs PG)
- 想定: Zod で `max(63)` を強制 (両方の DB で安全)。

---

## E. UX / a11y / SEO (ux-a11y.md Medium)

### E1. テーマ FOUC
- 位置: `src/components/ThemeProvider.tsx:121-151`
- 想定: `<head>` に同期スクリプトで `<html data-theme>` を hydration 前に設定。

### E2. iOS Safari の overscroll bleed
- 位置: `src/components/Header.tsx:149-158`
- 想定: `body { overscroll-behavior: contain }` + `position: fixed; top: -<scrollY>px`。

### E3. Sticky CTA と Main 申込ボックスの Tab 重複
- 位置: `src/components/EventStickyCTA.tsx:221-229`
- 想定: メイン申込ボックスが viewport 内のときは Sticky を `tabIndex={-1}` +
  `aria-hidden="true"`。Intersection Observer 連動。

### E4. タッチ領域 44x44px 未満
- 位置: `src/components/ui/button.tsx:48-49` `xs/sm` サイズ、`src/components/Pagination.tsx`。
- 想定: `@media (pointer: coarse)` で `min-h-[44px] min-w-[44px]` 強制。

### E5. グループ admin 0 件時の hosts 表示崩れ
- 位置: `src/app/event/[id]/page.tsx:347-363`
- 想定: `EmptyState` で「グループ管理者は未登録です」を出すか、owner 警告を出す。

### E6. キャンセル後の再申込ガード不足
- 位置: `src/app/event/[id]/page.tsx:1542-1601`
- 想定: ApplyBox 上部に「過去にキャンセルしています」アラート + Server Action 側で
  cancelled 履歴がある場合は participant レコードを update に倒す。

### E7. パンくず JSON-LD の URL が相対パス
- 位置: `src/components/Breadcrumb.tsx:90-99`
- 想定: `absoluteUrl(href)` で絶対化。

### E8. ハッシュタグ X 検索リンクに `rel="nofollow"` 不足
- 位置: `src/app/event/[id]/page.tsx:595-606, 928-941`
- 想定: `rel="nofollow noopener noreferrer"`。

### E9. sitemap / robots の網羅性
- 想定: sitemap に `/calendars`, `/discover`, `/calendar/[slug]` を追加。
  robots disallow に `/notifications`, `/settings`, `/bookmarks`, `/account`,
  `/event/*/apply`, `/calendar/*/edit`, `/calendar/*/manage`, `/logout`。

### E10. `LanguageSwitcher` 切替で full reload
- 位置: `src/components/LanguageSwitcher.tsx:41-46`
- 想定: middleware が cookie をセット → `router.refresh()` で部分更新。

### E11. Footer SNS リンクがプレースホルダ
- 位置: `src/components/Footer.tsx:115,133,151`
- 想定: 環境変数 `NEXT_PUBLIC_TWITTER_URL` 等から差し込む or 空ならリンク非表示。

### E12. Discord / Slack 共有が「ホーム URL を開くだけ」
- 位置: `src/components/ShareModal.tsx:377-383`
- 想定: コピー専用ボタンに変える、または非表示。

---

## F. Code Quality Low / Best Practices

### F1. `tsconfig.json` `target: ES2017`
- 想定: `ES2022` に上げる + `noUncheckedIndexedAccess: true` を検討。

### F2. `eslint.config.mjs` のルールが薄い
- 想定: `no-non-null-assertion`, `no-explicit-any`, `no-restricted-imports` を追加。

### F3. `as unknown as` 強制キャスト
- 位置: `src/app/api/payments/webhook/route.ts:77`, `src/components/ShareModal.tsx:81`
- 想定: Stripe.Event discriminated union を使う / QRCodeCtor を型付けする。

### F4. `parsed.data!` の non-null assertion
- 位置: `src/app/actions/calendar-actions.ts:374,515` 他
- 想定: `parsed.success` 分岐内なら `!` 不要なので削除。

### F5. `Twitter` provider の clientId フォールバック二重化
- 位置: `auth.ts:139-153`
- 想定: `AUTH_*` 接頭辞に統一。

### F6. `lang` 設定が `ja_JP` でなく `ja`
- 位置: `src/lib/seo.ts:14`, `src/app/layout.tsx:104`
- 想定: locale ごとに `<html lang>` を切り替え (en → "en-US", ja → "ja-JP")。

### F7. `truncateDescription` の bytecount ≠ character count
- 位置: `src/lib/seo.ts:31-39`
- 想定: `Intl.Segmenter` で grapheme 単位に。

### F8. Skip link が main 以降に無い
- 位置: `src/app/layout.tsx:110-112`
- 想定: 「申込へ」「コメントへ」スキップリンクを sr-only + focus visible で。

### F9. グローバル `prefers-reduced-motion` で focus ring まで殺される
- 位置: `src/app/globals.css:245-252`
- 想定: 対象クラスを限定 (`*:not([data-allow-motion])`)。

### F10. `Discover` ラベルが ja/en 同一
- 位置: `src/i18n/messages/ja.json:18`
- 想定: 「発見」に変えるか、固定なら docs/i18n-policy.md 化。

### F11. GCal `details` に Markdown 生テキスト
- 位置: `src/app/event/[id]/page.tsx:783-794`
- 想定: marked + striptags で plain text + 1000 文字制限。

### F12. 自作 tablist が APG 非準拠
- 位置: `src/app/event/[id]/page.tsx:1812-1838`, `src/app/explore/page.tsx:278-300`,
  `src/app/notifications/page.tsx:135-157`
- 想定: 矢印キー / Home / End / `aria-controls` / `aria-labelledby` 連動。

---

## G. インフラ / 設定

### G1. `playwright.config.ts` `reuseExistingServer: true`
- CI では `false` に切り替える、または beforeAll で `_resetRateLimitForTest` 等を呼ぶ。

### G2. `MagicLinkToken.usedAt` クリーンアップ
- バッチ処理を Vercel Cron で追加する想定。`@@index([expiresAt])` は追加済み。
