# tech-event TypeScript / コード品質レビュー

レビュー範囲: `/Users/mac_ai/repos/tech-event/src/` 配下 (+ ルート設定ファイル群)
レビュー観点: TypeScript 厳密性、Server/Client 境界、エラーハンドリング、デッドコード、命名一貫性、重複、依存、React パターン、Server Action パターン、Prisma クエリ、テストコード、設定ファイル。

## Executive Summary

全体的なコード品質は **「中の上」**。`strict: true`、Zod による FormData 検証、Server Action と Route Handler の責務分割は明確で、`any` の使用は無く `@ts-ignore`/`@ts-nocheck` も完全に排除されている (E2E に `@ts-expect-error` が 3 箇所のみ)。

一方、以下の領域に体系的な負債がある:

1. **Critical** に近い問題は **Auth 関連の循環 import** (`src/lib/auth.ts` が `@/auth` を毎リクエスト動的 import する) と **`auth.ts` の `Race Condition` を含む _max+1 ID 採番**。後者は Prisma 7 + SQLite の制約に起因するが、いたるところに散在して 30 箇所以上の重複実装になっている。
2. `cn()` ヘルパーが `src/lib/cn.ts` と `src/lib/utils.ts` の 2 箇所に重複定義され、import が分散している (41 + 16 ファイル)。
3. shadcn UI primitive (`Card` / `Badge` / `Skeleton` / `LoadingState` / `ErrorState` / `Label` 等) に **不要な `"use client"`** が付与されており Server Component 内でも Client 境界を発生させている。
4. Server Action のエラー処理が **`throw new Error("invalid_input")`** のような不透明な文字列例外で統一されておらず、UI 側でユーザーに何が起きたか伝える経路がない (toast は「エラーが発生しました」固定)。
5. **E2E `devLogin` ヘルパーが 20+ ファイルにコピペ** されており、`waitForTimeout` が 20 箇所以上で使われる (flake の温床)。

件数サマリー:
- Critical: 3
- High: 9
- Medium: 12
- Low: 8
- Best Practices: 5

---

## Critical

### 1. `getCurrentUser()` 内で `@/auth` を毎呼び出し動的 import している
- 位置: `src/lib/auth.ts:33`
- 問題: `await import("@/auth")` を `getCurrentUser()` 呼び出しのたびに実行している。これはサーバーレス環境で cold start を遅らせるだけでなく、`@/auth` 内部で次回以降の `prisma` import を阻害する循環依存を生む。コメント (`circular import になりやすいので動的 import`) が問題の存在を裏付けている。
- 修正案: 循環の根本原因 (`auth.ts` が `@/lib/auth` の `SESSION_COOKIE_NAME` のみを参照) を素直に解消する。`SESSION_COOKIE_NAME` を `src/lib/constants/auth.ts` のような循環しない場所へ切り出し、`getCurrentUser()` から直接 `import { auth } from "@/auth"` する。

### 2. BigInt id 採番 `_max + 1` パターンの大量重複と race condition
- 位置:
  - `src/app/actions/event-actions.ts:77-96` (`nextParticipantId`/`nextBookmarkId`/`nextNotificationId`)
  - `src/app/actions/event-admin-actions.ts:115-127, 528-536`
  - `src/app/actions/calendar-actions.ts:75-87`
  - `src/app/actions/comment-actions.ts:69-81`
  - `src/app/actions/lottery-actions.ts:61-64`
  - `src/app/actions/group-actions.ts` 内
  - `src/app/actions/notification-preferences-actions.ts:41-45`
  - `src/app/actions/survey-actions.ts` 内
  - `src/app/api/payments/webhook/route.ts:45-57`
  - `src/app/api/auth/magic-link/verify/route.ts:35-36`
  - `auth.ts:74-75, 101-104`
- 問題:
  1. 同じ `_max + 1` イディオムが **8 ファイル × 14 関数以上**で重複。テーブルごとに微妙に異なる関数名で散らばっており保守性が著しく悪い。
  2. 単純トランザクション内でも 2 つの並行 transaction が `_max` を同時に読めば同じ値を返し、UNIQUE 制約違反 (一方が CRASH) になる。コメントは「レアな衝突はクライアント側のリトライ前提」と書いているが、実装にはリトライがない。
  3. ロジックは Prisma 7 driver-adapter の現時点の制約 (autoincrement 未対応) に対する暫定対応だが、抽象化されていないため将来 PostgreSQL に切り替える際の差分が広範囲に及ぶ。
- 修正案: `src/lib/id.ts` に `nextId(tx, model)` のような共通ヘルパーを 1 つ用意し、テーブル名をパラメータ化する (Prisma の DMMF を使えば動的にも書ける)。さらに UNIQUE 違反時のリトライ (`prisma.$transaction` 内で `P2002` を retry) を共通実装する。あるいは Postgres 切替を機に `sequence` ベースに移行する。

### 3. `_max + 1` を含む `prisma.$transaction` に SQLite 既定の `serializable` 隔離レベルを当てていない
- 位置: 上記すべての Server Action と特に `src/app/actions/event-actions.ts:175-409` (joinEvent), `src/app/api/payments/webhook/route.ts:124-216`
- 問題: SQLite Better-SQLite3 adapter のデフォルトは BEGIN DEFERRED で、同時 INSERT の整合性は保証されない。`_max + 1` と `Event.acceptedCount` の `increment` の組合せが特に懸念。`joinEvent` で同じユーザが 2 タブから同時送信した場合、status カウンタが二重に増分する可能性がある。
- 修正案: 採番が衝突した場合のリトライを `prisma.$transaction(..., { isolationLevel: 'Serializable' })` で囲み、`P2002` (UNIQUE 制約違反) を捕捉して 1 回だけ再実行する共通ヘルパー (`withIdRetry`) を用意。あるいは UNIQUE 制約に頼って一度だけ実行する形に直す。

---

## High

### 4. shadcn UI primitive 群に不要な `"use client"` ディレクティブが付与されている
- 位置:
  - `src/components/ui/card.tsx:14`
  - `src/components/ui/badge.tsx:7`
  - `src/components/ui/skeleton.tsx:7`
  - `src/components/ui/label.tsx:7`
  - `src/components/ui/loading-state.tsx:14`
  - `src/components/ui/error-state.tsx:13`
- 問題: これらは hooks も `onClick` も使わず、`forwardRef` + `cn` だけのスタイル wrap。`Card` は dashboard, event page 等の Server Component に大量に挿入されており、不要な Client boundary を作って bundle と hydration コストを増やしている。`ErrorState` は `retry` を任意で受け取るが、関数 prop を渡さない大半のケースでは Server で十分。
- 修正案: 上記から `"use client"` を削除する (`forwardRef` は Server Component でも使える)。本当に必要な `Button`, `Input`, Dialog などとは区別する。`Label` は Radix `LabelPrimitive.Root` を使うがそれは Server で `id` 属性をつなぐだけなので OK。

### 5. `cn()` ユーティリティが 2 箇所に重複定義されている
- 位置: `src/lib/cn.ts:8` と `src/lib/utils.ts:16` (両方とも `twMerge(clsx(inputs))`)
- 問題: 同一実装で、import 元が **41 ファイル (`@/lib/cn`) + 16 ファイル (`@/lib/utils`)** に分散している。今後、片方を編集すると挙動の不一致につながる。
- 修正案: `src/lib/utils.ts` 側を消し、全体を `@/lib/cn` に統一する (もしくはその逆)。同時に `formatEventDate` 等の純粋日付ヘルパは `src/lib/date.ts` に切り出し、`utils.ts` を削除する。

### 6. Server Action のエラー処理が `throw new Error("invalid_input")` で固定文字列
- 位置:
  - `src/app/actions/event-actions.ts:166, 423, 531, 560`
  - `src/app/actions/event-admin-actions.ts:210-212, 314, 318, 322, 564-565, 607-608, 660, 673, 674, 676, 773, 780, 782` …
  - `src/app/actions/comment-actions.ts:94, 226`
  - `src/app/actions/lottery-actions.ts:112, 254, 264, 267`
  - `src/app/actions/calendar-actions.ts:241, 247, 248, 280, 319, 362, 502, 503`
  - `src/app/actions/survey-actions.ts` 内多数
- 問題:
  1. 例外がそのまま UI に届くと Next.js デフォルトの "Something went wrong" になる。`useActionToast` (`src/hooks/useActionToast.ts:74`) では一律 `toast.error("エラーが発生しました")` になり、ユーザーには「何が悪かったか」が伝わらない。
  2. ロジカルエラー (権限不足, バリデーション失敗) と内部例外 (DB 障害, race condition) を同じ throw で区別できないため、グローバル error boundary がオブザーバビリティで両者を分離できない。
- 修正案: 軽量な `ActionError` クラス (`code` + `message` + `userMessage`) を `src/lib/action-error.ts` に作り、Server Action は `throw new ActionError("forbidden", "権限がありません")` で投げる。`useActionToast` は `digest === "NEXT_REDIRECT"` 以外の例外を `ActionError.userMessage` で toast 表示する分岐を追加。`calendar-actions.ts` で既に部分的に実装している `redirectWithError(formData, errorKey, message)` (`src/app/actions/calendar-actions.ts:93-108`) パターンを横展開しても良い。

### 7. E2E の `devLogin` ヘルパが 20 ファイルでコピペされている
- 位置: `e2e/comment-bookmark.spec.ts:18-29`, `e2e/notifications.spec.ts`, `e2e/host-dashboard.spec.ts`, `e2e/notification-preferences.spec.ts`, `e2e/upload.spec.ts`, `e2e/markdown-editor.spec.ts`, `e2e/create-flow.spec.ts`, `e2e/loading-states.spec.ts`, `e2e/visual-compare-mobile.spec.ts`, `e2e/approval-flow.spec.ts`, `e2e/perf.spec.ts`, `e2e/register-states.spec.ts`, `e2e/insights-advanced.spec.ts`, `e2e/survey.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/participate.spec.ts`, `e2e/bookmarks.spec.ts`, `e2e/toast-actions.spec.ts`, `e2e/lottery.spec.ts`, `e2e/slack-webhook.spec.ts`
- 問題: 同一の `devLogin(page, nickname, nextPath)` 関数が 20 箇所以上で再定義。引数や `waitForURL` 正規表現の調整が必要になっても全箇所を直す必要がある。
- 修正案: `e2e/_helpers/auth.ts` (or `e2e/fixtures/auth.ts`) に `loginAs(page, nickname, opts?)` を切り出し、すべての spec から import する。Playwright の Test Fixture (`test.extend`) を使えば `loggedInPage` 引数で受け取れて記述が短くなる。

### 8. E2E で `waitForTimeout` を 20+ 箇所で使っている (Flake のリスク)
- 位置:
  - `e2e/visual-compare-luma.spec.ts:112, 125`
  - `e2e/visual-compare.spec.ts:64, 76`
  - `e2e/components-mobile.spec.ts:73, 90, 109`
  - `e2e/visual-compare-dark.spec.ts:138`
  - `e2e/discover.spec.ts:166`
  - `e2e/visual-compare-mobile.spec.ts:93, 123`
  - `e2e/register-states.spec.ts:130`
  - `e2e/components.spec.ts:61, 92, 301`
  - `e2e/sticky-cta.spec.ts:36, 43, 61, 81`
  - `e2e/component-vs-original.spec.ts:222`
- 問題: 固定 sleep は CI の負荷次第で flaky になりやすい。代替手段 (locator-based `expect.toBeVisible({ timeout })`、`page.waitForLoadState('networkidle')`、`waitForFunction`) で置き換え可能なケースが大半。
- 修正案: VRT のレンダリング安定化目的なら `await page.evaluate(() => document.fonts.ready)` + `expect(locator).toBeVisible()` で同等の安定性を得られる。スクロール → IntersectionObserver 待ちは `waitFor` で目的の状態を直接検証する。

### 9. `serializeForApi` が BigInt を Number に変換するため、ID が `> Number.MAX_SAFE_INTEGER` で破綻する
- 位置: `src/lib/public-api.ts:110-130`, 利用箇所 `src/app/api/v2/events/route.ts:212, 226, 235, 244-249`
- 問題: コメント (lines 17, 113-114) に「connpass 仕様準拠で Number 化」とあるが、`_max + 1` 採番方式と組み合わせると将来 ID が 2^53 を超えた瞬間に整数精度が失われる。さらに `Number(BigInt)` は v8 で警告は出ないがサイレントに精度ロスする。
- 修正案: 公開 API のレスポンス型を `string` ID に揃える (connpass v2 と差別化したい場合)、または ID が安全範囲を超えた時に `JSON.stringify(payload, replacer)` で BigInt→string fallback する。現状は最低でも `if (Number(value) > Number.MAX_SAFE_INTEGER) return String(value)` の防御を入れる。

### 10. `event/[id]/page.tsx` で参加者を 200 件 include したうえで JavaScript フィルタしている
- 位置: `src/app/event/[id]/page.tsx:115-119` の `participants: { include: { user: true }, take: 200 }` と `:289-322` の `.filter(...)` × 5 回。
- 問題:
  - 「accepted/waiting/cancelled の件数」を JavaScript で 3 回フィルタしているが、これは `prisma.participant.groupBy({ where, by: ['status'], _count })` で 1 クエリにできる。
  - 200 件を毎回 include する代わりに、表示するタブ (`accepted` or `waiting` or `cancelled`) だけ別クエリで取れば過剰なデータ転送を回避できる。
  - 自分の参加状況 (`myParticipation`) の検索もイベントロード時に分離クエリにする方が読みやすい。
- 修正案: ページコンポーネントを以下に分割。
  ```ts
  const [event, counts, visible, myParticipation] = await Promise.all([
    fetchEventCore(id),
    fetchParticipantCounts(id),
    fetchParticipantsByStatus(id, tab, 50),
    currentUser ? fetchMyParticipation(id, currentUser.id) : null,
  ]);
  ```

### 11. `Header.tsx` Client Component が `useTheme` を内包し、`HeaderServer` 経由でも全体の hydration 範囲が大きい
- 位置: `src/components/Header.tsx:1-606` (606 行の `"use client"` 巨大ファイル)
- 問題: ヘッダー全体が 1 つの Client Component で、テーマ DropdownMenu / Language Switcher / 検索 / Avatar / Notifications がすべて同じ tree。Server Component で書ける static な部分 (ロゴ、メインナビリンク) もまるごと Client 化されている。
- 修正案: Header を Server Component に戻し、`UserMenu`, `ThemeSwitcher`, `LanguageSwitcher`, `MobileMenuToggle` のような小さな Client Component を子に置く構成にする。これにより初回 JS bundle が大きく減る。

### 12. Insights ページの集計が Prisma の高レベル API のみで、巨大イベントでメモリ消費が増える
- 位置: `src/app/event/[id]/admin/insights/_lib.ts:95-200+`
- 問題: コメント (`SQLite と PostgreSQL でも同一ロジック`) で生 SQL を避ける方針だが、参加者全件 + user join を毎回ロードする実装は数千人規模で重い。`event.participants` は親ページから渡されているはずだがそれでも `Affiliation 集計`/`時間帯ヒストグラム` を Node 上で逐次計算している。
- 修正案: `groupBy({ by: ['user.affiliation'] })` を使う (Prisma 5+) か、PostgreSQL 移行後に `$queryRaw` で集計クエリを書く。SQLite/PG 両対応の方針なら `prisma.participant.groupBy(...)` を抽象化したヘルパーで切り替えられる構成にする。

---

## Medium

### 13. Footer 内のヘルパ関数 `getEmptyDict` がほぼ dead code
- 位置: `src/components/Footer.tsx:58-60`
- 問題: `buildDefaultGroups(dict: ReturnType<typeof getEmptyDict>)` の型注釈のためだけに `getEmptyDict()` を定義しているが、関数本体は決して呼ばれない。`Dict` 型を直接書けば不要。
- 修正案: `function buildDefaultGroups(dict: Dict): FooterGroup[]` に変更し、`getEmptyDict` を削除。

### 14. `src/lib/serialize.ts` の `serializeDeep` / `bigintToString` / `nullableBigintToString` / `nullableDateToIso` が未使用
- 位置: `src/lib/serialize.ts:27-45, 187-200`
- 問題: `grep` で確認した限りこれらの汎用ヘルパーはアプリケーションから一切呼ばれていない。専用 `serializeXxx` 関数のみ利用されている。
- 修正案: 未使用 export を削除する。`serializeDeep` は再帰実装で BigInt → string への戦略が他の `serializeEvent` (=Date を ISO 化) と矛盾していないか確認しつつ、必要なら 1 つに統合する。

### 15. `src/lib/mailer.ts:93-95` `resetTransporterCacheForTesting` は呼ばれていない
- 位置: `src/lib/mailer.ts:93-95` (`grep` で外部呼び出しなし)
- 問題: テスト用 export だが Vitest からも E2E からも呼ばれていない。
- 修正案: 削除するか、`vitest.config.ts` 連携の単体テストを追加する。同様に `src/lib/search.ts:193-196` の `resetSearchCacheForTesting` と `src/lib/public-api.ts:96-98` の `_resetRateLimitForTest` も未使用。

### 16. `Record` 型名がビルトインを shadow している
- 位置: `src/app/api/test/slack-catcher/route.ts:13`
- 問題: `type Record = { token: string; ... }` がグローバルの `Record<K, V>` を局所的に上書きしている。同ファイル内では使われないが、コードリーダーが混乱しやすい。
- 修正案: `type SlackCatcherRecord` のような具体名にリネーム。

### 17. `redirectWithError` が `src/app/actions/calendar-actions.ts` と `src/app/actions/group-actions.ts` で重複定義
- 位置: `src/app/actions/calendar-actions.ts:93-108`, `src/app/actions/group-actions.ts:115-130`
- 問題: 同一実装の関数が 2 ファイルにコピーされている。
- 修正案: `src/lib/server-action.ts` などに `redirectWithFormError(basePath, formData, errorKey, message?)` として共通化。「formData の値を復元してリダイレクト」というパターンは他の Action にも横展開可能。

### 18. `formValue` / `formValueRaw` / `formInt` の各 Action 内重複
- 位置:
  - `src/app/actions/event-actions.ts:32-35`
  - `src/app/actions/event-admin-actions.ts:30-45`
  - `src/app/actions/calendar-actions.ts:27-35`
  - `src/app/actions/comment-actions.ts:28-31`
  - `src/app/actions/lottery-actions.ts:35-38`
  - `src/app/actions/notification-preferences-actions.ts:34-37`
- 問題: ほぼ同じ helper が 8 ファイルに散在している。
- 修正案: `src/lib/form-data.ts` に共通化。`getString(form, key)`, `getStringTrim(form, key)`, `getInt(form, key)` の 3 つで十分。

### 19. 共通の `BigIntIdSchema` / `BigIntIdString` Zod schema が重複定義
- 位置:
  - `src/app/actions/event-actions.ts:37-40`
  - `src/app/actions/event-admin-actions.ts:47`
  - `src/app/actions/payment-actions.ts:29-32`
  - `src/app/actions/lottery-actions.ts:40-43`
  - `src/app/actions/comment-actions.ts:33-36`
- 問題: `z.string().regex(/^\d+$/).transform(s => BigInt(s))` が 5 箇所に複製。
- 修正案: `src/lib/schemas.ts` に `BigIntIdSchema` を 1 つだけ置く。

### 20. `event.acceptedCount` / `waitingCount` を increment/decrement で更新する手法が race-prone
- 位置: `src/app/actions/event-actions.ts:355-358, 461-468, 510-517`, `src/app/api/payments/webhook/route.ts:177-180`
- 問題: 同じイベントへ並列で `joinEvent` + `cancelParticipation` が走った場合、`accepted_count` の `increment` と再計算 (`removeParticipant` で `count` し直す箇所) が混在し、状態がずれる可能性がある。`removeParticipant` (`event-admin-actions.ts:625-644`) は `count → set` の方式で安全だが、`joinEvent` の `increment` 方式とは異なる。
- 修正案: 全箇所を `count → set` 方式 (主側で再集計) に統一するか、ステータス変化のたびに `triggers` (DB レベル) で同期する。短期的には denormalize された `acceptedCount/waitingCount` を捨て、必要な時に集計する設計の方が安全。

### 21. `try { ... } catch { /* 無視 */ }` パターンが多数 (ログ無し)
- 位置:
  - `src/app/actions/lottery-actions.ts:290-306` (Slack 通知失敗を完全に呑む)
  - `src/app/actions/comment-actions.ts:196-212`
  - `src/app/api/auth/login/route.ts:110-117` (`lastLoginAt` 更新失敗)
  - `src/app/api/auth/magic-link/verify/route.ts:102-119` (トークン使用済み更新失敗)
  - `src/app/(showcase)/theme-builder/page.tsx:73-86`
  - `src/components/ImageUploader.tsx:85-91`
  - `src/components/RecentlyViewedEvents.tsx:66-69`
  - `src/components/Header.tsx:504-505, 520-521`
  - `src/components/ShareModal.tsx:91-94, 109-114, 122-126`
- 問題: 「失敗は無視」のコメントはあるが、Sentry 等の監視で見えなくなる。本番障害の根本原因が「黙ったキャッチ」だったことに後で気づくケースが多い。
- 修正案: 開発時のみ `console.warn` を残す、もしくは `src/lib/logger.ts` を作って `logger.warn("[ctx] error", err)` で統一する。`/* 通知失敗は無視 */` のような重要度の低いものでも、最低限ログは残す。

### 22. `src/app/event/[id]/page.tsx:99` で `Array.isArray` チェック後に `as Record<string, string>` キャスト
- 位置: `src/app/event/[id]/page.tsx:420-423` (`themeStyle as Record<string, string>` を 2 回キャスト)
- 問題: `React.CSSProperties` に CSS カスタムプロパティを書く時の正当な型回避だが、`themeStyle: React.CSSProperties = { "--event-tint": tintColor }` と書けば `Record<string, string>` への 2 重キャストは不要。
- 修正案:
  ```ts
  const themeStyle = {
    ["--event-tint" as string]: tintColor,
    ["--event-bg-style" as string]: bgStyle,
  } as React.CSSProperties;
  ```
  もしくは tsconfig に `// CSS Vars` のための型拡張を入れる。

### 23. `categorise.ts` の TODO コメント
- 位置: `src/app/api/v2/events/route.ts:23` (`完全な enum マッピングは要追加 (TODO)`)
- 問題: 公開 API のドキュメントとしては明示されているが、実装に紐づく Issue 番号などへの参照がない。
- 修正案: TODO に GitHub Issue 番号 (or 期限) を付ける。`// TODO(#123)` のように。

### 24. `src/app/actions/event-actions.ts` (583 行) のサイズが肥大化している
- 位置: ファイル全体
- 問題: `joinEvent` だけで 250 行以上、内部ロジックの分岐 (承認制 / 抽選 / 先着) が 1 つの関数に詰め込まれている。ユニットテストが書きづらい構造。
- 修正案: 内部分岐を `applyForApproval`, `applyForLottery`, `applyForFcfs` のような pure-ish 関数 (引数で `tx` を取る) に切り出し、`joinEvent` は dispatcher にする。

---

## Low

### 25. `as unknown as` 強制キャスト
- 位置:
  - `src/app/api/payments/webhook/route.ts:77` (`as unknown as CheckoutCompletedEvent`)
  - `src/components/ShareModal.tsx:81` (`as unknown as QRCodeCtor`)
- 問題: Stripe SDK の `constructEvent` は本来 `Stripe.Event` を返すので、自前の `CheckoutCompletedEvent` 型に narrowing する手段がない。`unknown as` は許容範囲だが、ランタイム検証 (`event.type === "checkout.session.completed"` チェックが続いている) は既にあるため最小限の問題。
- 修正案: `Stripe.Event` を直接使い、`event.type === "checkout.session.completed"` で `event.data.object` を `Stripe.Checkout.Session` 型に narrowing する (Stripe SDK は discriminated union)。

### 26. non-null assertion `!` 経由の配列インデックスアクセス
- 位置:
  - `src/app/actions/event-admin-actions.ts:274, 838`
  - `src/app/actions/lottery-actions.ts:83-84`
  - `src/app/actions/notification-preferences-actions.ts:120-124`
  - `src/app/event/[id]/admin/insights/_lib.ts:149-154` (`timingBuckets[0]!.count`)
  - `src/components/HostAvatarStack.tsx:69-70`
- 問題: 配列要素が必ず存在することは `i < length` ループや初期化済み配列で TypeScript が推論できないため `!` が必要。`noUncheckedIndexedAccess` を tsconfig に入れている方が安全策を取ったうえで `!` が許容される。
- 修正案: tsconfig で `"noUncheckedIndexedAccess": true` を有効化する (現状は有効化していない可能性が高い)。もしくはローカルで `const r = roles[i]; if (!r) continue;` のような早期 return を使う。

### 27. `calendar-actions.ts:374, 515` で `parsed.data!` の non-null assertion
- 位置: `src/app/actions/calendar-actions.ts:374, 515`
- 問題: `EventIdSchema.safeParse(eventIdRaw)` の直後で `parsed.success` を確認しているが、すぐ後の `BigInt(parsed.data!)` で `!` を使っている。`parsed.success` が `true` の分岐内なら `parsed.data` は non-nullable なので `!` は不要。
- 修正案: 単に `BigInt(parsed.data)` でよい (TS が narrowing する)。

### 28. `Twitter` provider の `clientId` フォールバックに環境変数 2 通り (`TWITTER_CLIENT_ID` と `AUTH_TWITTER_ID`)
- 位置: `auth.ts:139-153`
- 問題: 設定の二重化は混乱の元。デフォルトに何を採用すべきか分かりにくい。
- 修正案: `next-auth` v5 の規約に従い `AUTH_*` 接頭辞のみに統一。`.env.example` も合わせて簡素化。

### 29. shadcn `Slot` を `asChild` で使うが、子要素の型は any
- 位置: `src/components/ui/button.tsx:70-77` 等
- 問題: `<Button asChild><Link>...</Link></Button>` のパターンは `Button` の `ButtonHTMLAttributes` 制約が `Link` の `anchor` 属性と矛盾する。型レベルで弾けない (Radix `Slot` の制限)。
- 修正案: 既存 shadcn 規約に従う。これは shadcn 由来の問題なので docs に「`asChild` 利用時は anchor 属性を許容してね」と注意書きを書いて運用する。

### 30. `eslint.config.mjs` が空に近い設定
- 位置: `eslint.config.mjs:1-23`
- 問題: `core-web-vitals` と `typescript` プリセットを並べるだけで、custom rule が一切ない。`no-non-null-assertion` (`!` 禁止) や `no-explicit-any` (any 禁止) などのプロジェクト固有ルールが無いため、上記のような問題が CI で機械的にブロックできない。
- 修正案: 以下のような追加 rule を検討:
  ```js
  rules: {
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "no-restricted-imports": ["error", { "paths": [{ "name": "@/lib/utils", "importNames": ["cn"], "message": "Use @/lib/cn instead." }]}],
    "react-hooks/exhaustive-deps": "error",
  }
  ```

### 31. `tsconfig.json` の `target: ES2017` が古い
- 位置: `tsconfig.json:3`
- 問題: Next.js 16 + React 19 を使うなら `target: ES2022` 以上が現実的。ES2017 ターゲットだと async iteration や top-level await が冗長にトランスパイルされる。
- 修正案: `"target": "ES2022"` に上げる (Node 18+ 前提なら問題ない)。`"noUncheckedIndexedAccess": true` も合わせて検討。

### 32. `playwright.config.ts` で `webServer.reuseExistingServer: true`
- 位置: `playwright.config.ts:42-47`
- 問題: ローカル dev サーバを使い回す設定は便利だが、CI で「他の test 由来の状態」が残っていると flake する。コメントには `globalSetup` で `dev.db` を baseline からコピーすると書いてあるが、サーバープロセスのインメモリ状態 (例: `_publicApiRateMap` や `_slackCatcherStore` の `globalThis`) はリセットされない。
- 修正案: CI 環境では `reuseExistingServer: false` に切り替える、もしくは `_resetRateLimitForTest`/Slack catcher の `DELETE` を `beforeAll` で必ず叩く。

---

## Best Practices

### B1. 既に良い点 (継続したい)
- `strict: true` が有効、`any` ゼロ、`@ts-ignore` ゼロ。
- Server Action の form 入力が全て Zod で検証されている。
- Stripe Webhook の `signature` 検証経路と dev fallback がはっきり分離されている (`src/app/api/payments/webhook/route.ts:71-91`)。
- `src/lib/i18n.ts` の `t()` 実装が小さく、辞書 type-safe (`Dict` 型固定)。
- `src/components/ShareModalDynamic.tsx` の `dynamic({ ssr: false })` 利用は理想的 (重い qrcode-svg / Dialog を遅延ロード)。

### B2. middleware の cookie/locale 設計が綺麗
- 位置: `src/middleware.ts:1-67`
- 良い点: `?lang=` クエリ > cookie > Accept-Language > default のフォールバック順が明確で、cookie の初回保存も含めて 60 行に収まっている。

### B3. Header に Skeleton/Suspense Boundary を入れる余地
- 位置: `src/app/layout.tsx` (確認していないが `HeaderServer` を直接呼んでいるはず)
- 提案: Notification count 取得のための DB クエリ (`HeaderServer.tsx:22-25`) を `<Suspense>` で wrap し、ヘッダーの初回 paint をブロックしない構造に変えると体感が改善する。

### B4. `src/lib/notification.ts` のラベル / kind を constant に集約しているのは良い
- 位置: `src/lib/notification.ts:31-77`
- 良い点: `NOTIFICATION_KIND_KEYS` + `NOTIFICATION_KIND_LABELS` + `NOTIFICATION_CHANNEL_KEYS` がすべて const として 1 ファイルにまとまっている。`Record<NotificationKindKey, string>` で型レベル網羅性も保証されている。
- 改善: `kind: string` (`NotificationKind` 型) と `kind: NotificationKindKey` の使い分けが曖昧。`string | NotificationKindKey` の union 型を厳格化したい。

### B5. Storybook + Playwright VRT の組み合わせが活きている
- 位置: `package.json:21-22` の `vrt` / `vrt:update` script + `e2e/vrt-stories.spec.ts`
- 良い点: UI primitive の差分検知が CI で機械化されている。デザイントークン / ダークモードの破壊的変更を catch できる。

---

## リファクタ Top 10 提案 (優先順)

| # | 内容 | 想定工数 | 影響範囲 |
|---|------|----------|----------|
| 1 | `_max + 1` 採番を共通ヘルパー (`src/lib/id.ts:nextId(tx, model)`) に集約し、UNIQUE 違反のリトライを 1 箇所で実装 | M | 全 Server Action / 採番系 API |
| 2 | `getCurrentUser()` の動的 `import("@/auth")` を廃止し、`SESSION_COOKIE_NAME` を独立モジュール化して循環依存を解消 | S | `src/lib/auth.ts`, `auth.ts`, `src/lib/constants/auth.ts` (新規) |
| 3 | `src/lib/cn.ts` と `src/lib/utils.ts` の `cn` 重複を解消、import を `@/lib/cn` に統一 | S | 57 ファイル |
| 4 | shadcn UI primitive の不要な `"use client"` を削除 (Card / Badge / Skeleton / Label / LoadingState / ErrorState) | S | `src/components/ui/*.tsx` 6 ファイル |
| 5 | `ActionError` クラス + `redirectWithFormError` 共通化により Server Action のエラー伝達を統一 | M | actions/* 全 8 ファイル + `useActionToast` |
| 6 | E2E `loginAs` fixture を `e2e/_helpers/auth.ts` に切り出し、Playwright `test.extend` で配布 | S | e2e/*.spec.ts 20+ ファイル |
| 7 | `waitForTimeout` を locator-based 待機 (`expect.toBeVisible`, `page.waitForFunction`) に置換 | M | e2e/*.spec.ts ~12 ファイル |
| 8 | `Header.tsx` (606 行 Client) を Server Component + 小さい Client サブコンポーネント (`UserMenu`, `ThemeSwitcher`, `MobileMenuToggle`) に分割 | M | `src/components/Header.tsx`, `HeaderServer.tsx` |
| 9 | Server Action 内のヘルパ (`formValue` / `formValueRaw` / `formInt` / `BigIntIdSchema`) を `src/lib/form-data.ts` + `src/lib/schemas.ts` に集約 | S | actions/* 全 8 ファイル |
| 10 | `serializeForApi` の BigInt→Number 変換に MAX_SAFE_INTEGER ガードを入れ、必要なら string fallback。`serializeDeep` 等の未使用 export を削除 | S | `src/lib/public-api.ts`, `src/lib/serialize.ts` |

---

## 件数サマリー

- Critical: **3 件** (Auth 循環 import, `_max+1` 採番重複/race, トランザクション隔離)
- High: **9 件** (不要 `"use client"`, `cn` 重複, Server Action エラー処理, E2E `devLogin` 重複, `waitForTimeout`, Number 精度, over-fetch, 600 行 Client Header, Insights 集計コスト)
- Medium: **12 件** (dead code, helper 重複, race-prone increment, 黙ったキャッチ, TODO 不備, 巨大ファイル等)
- Low: **8 件** (キャスト, non-null assertion, ts target, eslint rule 不足, playwright reuse 等)
- Best Practices: **5 件** (良い点 + 小さい改善提案)

合計 **37 件**。Critical/High に絞ると 12 件で、Top 10 リファクタを順に実施すれば、おおむね本レポートの主要指摘を解消できる。
