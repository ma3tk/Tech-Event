# データモデル / Prisma スキーマ レビュー (`tech-event`)

対象: `prisma/schema.prisma` (SQLite, 正本) / `prisma/schema.postgres.prisma` / `prisma/migrations/*` (全 7 個) / `src/**/*.ts(x)` のうち Prisma クエリを行う 1st-class コード。

`research/data-model/migration-strategy.md` と `research/luma/*` を参照して照合した。

---

## Executive Summary

- **モデル総数**: 28 個。うち **6 個 (21%)** は src/ から **完全未参照** または「seed/構築コードで書くのみ・読まない」の dead model: `AuditLog`, `VoucherCode`, `EventStat`, `GroupBlacklist`, (`OAuthIdentity` は auth.ts のみ・seed 無し / `OAuthIdentity` テーブルは 0 行)、`Payment.voucherCodeId` (関連 dead)。
- **postgres schema が SQLite 正本と完全に乖離**しており、`Event.approvalRequired` / `Participant.approvalStatus` / `Participant.approvalNote` / `Group.slackWebhookUrl` の一部 / `NotificationPreference` モデル全体が抜けている。 `pnpm db:sync-pg` を実行していないコミットがある。これは **本番デプロイブロッカー** レベルの不整合。
- **denormalized counter の整合性**: `Group.memberCount` は **`createGroup` 時の `1` 以外で一切更新されない**。`Group.presentationCount` は **どこからも更新されない**。`Tag.usageCount` は seed では増えるがアプリ実行時の `event-admin-actions.duplicateEvent` / `createEvent` / 編集時に増減処理がない。
- **N+1 / 大きいクエリ**: `event-admin-actions.sendBlast` で受信者ごとに `notification.aggregate({_max})` → `notification.create` を直列ループ、`lottery-actions.runLotteryForRole` でも acceptedSlice/waitingSlice 全件で同じ。`_lib.ts` (insights) の peer ループで `participant.findMany` を 6 回呼ぶ。`/discover` の category/city 集計で `count` を 6〜10 回 Promise.all。
- **`take` の欠落 / 上限なし**: `event/[id]/page.tsx` で participants 200 件取得、`group/[subdomain]/page.tsx` の `eventTag.findMany({ where:{event:{groupId}} })` がページサイズなし、`/bookmarks/page.tsx` がブックマーク全件無制限、`event/[id]/admin/page.tsx` で participants 全件取得 (no take)。
- **Index の不足**: `Event.acceptedCount` (ranking / popular 並び替えで頻出だが index なし)、`Notification(recipientUserId, readAt)` (ダッシュボードで未読フィルタ)、`Bookmark.userId, createdAt` (`/bookmarks` の order によく使う), `MagicLinkToken.expiresAt` (cleanup 用), `EventTag(tagId, eventId)` の逆引き。
- **dead field 多数**: `Event.allowQrCheckIn`, `Event.allowDuplicateJoin`, `Event.parentEventId`, `Event.seriesEventPosition`, `Event.eventType` (1 値固定), `Participant.nominated`, `EventStat.*` 全列、`VoucherCode.*` 全列。

### 件数サマリー
| Severity | 件数 |
|---|---|
| Critical | **5** |
| High | **9** |
| Medium | **12** |
| Low | **8** |
| Best Practices | **5** |

---

## Critical (即修正)

### 1. `schema.postgres.prisma` が `schema.prisma` (正本) と乖離 — approval / NotificationPreference が欠落
- 位置: `prisma/schema.postgres.prisma:1-569`, 参照側 `prisma/schema.prisma:185-189`, `prisma/schema.prisma:248-281`, `prisma/schema.prisma:576-589`
- 現状: SQLite 側スキーマ末尾の以下要素が postgres 側に **存在しない**。
  - `Event.approvalRequired Boolean @default(false)` (`schema.prisma:187`)
  - `Participant.approvalStatus String?` (`schema.prisma:257`)
  - `Participant.approvalNote String?` (`schema.prisma:258`)
  - `NotificationPreference` model 全体 (`schema.prisma:576-589`) + `User.notificationPreferences` relation (`schema.prisma:54`)
  
  検証コマンド: `grep -c 'NotificationPreference\|approvalRequired\|approvalStatus' prisma/schema.*.prisma` → SQLite=6 / PG=0。
- 問題: `pnpm db:migrate:pg` を本番に走らせると **新機能のテーブル/カラムが作られず**、approval flow / 通知設定 UI が PG 環境で完全に壊れる。`src/app/actions/approval-actions.ts:115` や `src/app/settings/notifications/page.tsx:55` などコードは PG クライアント (`@/generated/prisma-pg`) からも import する場面が出てきた瞬間 type error。
- 修正案: 
  1. `pnpm db:sync-pg` を実行して `schema.postgres.prisma` を再生成。
  2. CI に `db:sync-pg` 後の `git diff --exit-code prisma/schema.postgres.prisma` を入れる (gate)。
  3. `scripts/sync-schema-pg.ts` を pre-commit hook で起動するか、`schema.postgres.prisma` を commit しないで生成物扱いにする。

### 2. `Group.memberCount` が新規作成時の `1` 以外で更新されない
- 位置: `prisma/schema.prisma:91`, 唯一の書き込み `src/app/actions/group-actions.ts:200`
- 現状: 検証コマンド `grep -rn "memberCount" src/app/actions` → ヒット 1 (上記 create 時のみ)。Group 作成時に `memberCount:1`、後の `groupMember.create` (`src/app/actions/group-actions.ts:218` の owner 自己参加) 以外で increment/decrement が無い。`leftAt` を立てる退会フローも無い。
- 問題: UI (`src/app/group/[subdomain]/page.tsx:294,385`, `src/app/series/page.tsx:55,193`) は `memberCount` を表示・人気順ソートに使うが、**Group 作成直後の 1 で永続的に固定**。`/series?order=members` 等の人気順が機能しない。
- 修正案: 
  1. groupMember を increment/decrement する集中 helper を作る (`createGroupMember`, `removeGroupMember`)。`leftAt` 更新時に `{ decrement: 1 }`、再 join で `{ increment: 1 }`。
  2. または **`@@map("group_members")` を CTE / view にして `_count` で算出**、フィールドそのものを削除。
  3. 既存データのリカバリスクリプトを 1 度走らせ `UPDATE groups SET memberCount = (SELECT count(*) FROM group_members WHERE groupId=groups.id AND leftAt IS NULL)`。

### 3. `Group.presentationCount` がアプリから一切更新されない
- 位置: `prisma/schema.prisma:93`, write は `src/app/actions/group-actions.ts:202` の 0 初期化のみ
- 現状: `grep -rn "presentationCount" src/app/actions` → 1 ヒット (init 0)。`PresentationMaterial.create` 実行点が src 内に **存在しない** (`grep "presentationMaterial.create" src` → 0)。
- 問題: `/group/[subdomain]/page.tsx:296,385` で `資料 N 件` として表示するが永久に 0。
- 修正案: presentation の登録 UI/Server Action 実装時に `group.update({ presentationCount: { increment } })` を併走させる。または `Group` から削除し `_count: { presentations: ... }` で算出。**実装上、現在発表資料の登録 API がそもそも無いのでカラムごと一旦削除して dead code を減らすのが合理的**。

### 4. N+1: `sendBlast` で受信者ごとに `notification.aggregate({_max:{id}})`
- 位置: `src/app/actions/event-admin-actions.ts:528-531` (`nextNotificationId`)、`src/app/actions/event-admin-actions.ts:720-734` (受信者ループ)
- 現状: `for (const uid of uniqueRecipientIds)` の **各 iteration** で `tx.notification.aggregate({_max:{id:true}})` → `tx.notification.create` 。受信者 N 人で `2N` クエリ + 競合。
- 問題: 100 人宛て一斉メールで 200 SQL。トランザクション内で MAX(id) を毎回取るため SQLite では table-level lock も延びる。さらに id 採番が **競合に弱い** (並列ブラスト不可)。
- 修正案: 
  - 受信者リストを 1 回だけ取り、`tx.notification.createMany({ data: rows })` で bulk。
  - そもそも `BigInt @id @default(autoincrement())` を機能させるため Prisma 7 + Driver Adapter 設定を見直す。コメント (`src/app/actions/event-actions.ts:67-75`) で「autoincrement が機能しない」とあるが、`prisma.config.ts` 側で `driverAdapters` previewFeature を切り替えれば動くはず。

### 5. `Tag.usageCount` がアプリの event tag 追加/削除と同期していない (seed 時のみ更新)
- 位置: `prisma/schema.prisma:343`, write は `prisma/seed.ts:838` のみ。`src/app/actions/event-admin-actions.ts:857` で `tx.eventTag.create` を呼ぶが usageCount 更新無し
- 現状: `grep -rn usageCount src/app/actions` → 0 ヒット。読み出し側は `/page.tsx:150` (人気タグ降順)、`/page.tsx:485`。
- 問題: 公開後のイベント編集でタグが増えても usageCount が増えない → 人気タグランキングが **seed 時点のスナップショット** に固定。さらに **`Event` をキャンセル/削除時にも decrement されない**。
- 修正案: 
  - `eventTag.create` 直後に `tag.update({ usageCount: { increment: 1 } })` を併記。
  - 削除や cancel 時の decrement 設計。
  - 完全に動的算出に倒すなら `usageCount` を消し `_count: { events: true }` で代替。

---

## High

### 6. `OAuthIdentity` / `AuditLog` / `GroupBlacklist` / `VoucherCode` / `EventStat` の dead テーブル
- 位置: `prisma/schema.prisma:60-73` (OAuthIdentity), `:142-154` (GroupBlacklist), `:284-301` (Payment.voucherCode 関連), `:303-316` (VoucherCode), `:456-468` (EventStat), `:501-515` (AuditLog)
- 現状 (`sqlite3 dev.db "SELECT count(*)..."` 結果):
  - `oauth_identities` 0 行 (auth.ts 内のロジックは存在するが seed 無し)
  - `audit_logs` 0 行 / src/ で参照無し
  - `voucher_codes` 0 行 / src/ で `VoucherCode` 参照 0
  - `event_stats` 45 行 (seed のみ) / src/ で `eventStat`/`EventStat` 参照 0
  - `group_blacklist` 0 行 / src/ で参照 0
- 問題: 
  - `EventStat` は `attendanceRate` を src 側で動的計算 (`src/app/event/[id]/admin/page.tsx:72-76`, `_lib.ts:199`) しているので、**seed されたフィールドが UI に反映されることはない** (混乱の元)。
  - `Payment` モデル (`schema.prisma:284-301`) は `/api/payments/webhook/route.ts` から書き込まれるが、`VoucherCode` 関連 (`voucherCodeId` 参照) は dead。
- 修正案: 
  - すぐ使う予定が無いなら schema から削除し migration 追加。Payment は decide 後でも構わない。
  - 残すならドキュメントに「TODO future」と明示し、`@@map` した上で `@@ignore` する。

### 7. `Event.allowQrCheckIn`, `Event.allowDuplicateJoin` が完全未使用
- 位置: `prisma/schema.prisma:182,183`
- 現状: `grep -rn "allowQrCheckIn\|allowDuplicateJoin" src` → 0 ヒット (generated を除く)。
- 問題: dead field。テーブル容量と migrate 時のリスク (PG 移行で NOT NULL DEFAULT 追加コストあり)。
- 修正案: 削除 (migration `ALTER TABLE events DROP COLUMN ...`)。**SQLite ではカラム DROP は新しい SQLite で可だが Prisma migrate のシャドウ DB と合うか要確認**。

### 8. `Event.parentEventId` / `Event.seriesEventPosition` / `Event.childEvents` が dead
- 位置: `prisma/schema.prisma:191,192,205`
- 現状: `grep -rn "parentEventId\|seriesEventPosition\|childEvents" src --include="*.tsx"` → `src/lib/serialize.ts:110` でシリアライズしているだけ。書き込みも UI 利用も無い。
- 問題: 「シリーズイベント」UX の足場として残されているが、`/app/series/page.tsx` は Group 一覧であって Event 親子関係を使っていない。
- 修正案: 機能スケジュール未定なら一旦削除。後で再追加可能。

### 9. `Participant.nominated`, `Event.eventType` が 1 値固定 (dead)
- 位置: `prisma/schema.prisma:166` (eventType default `participation`), `:259` (nominated)
- 現状: `eventType` は `src/app/actions/event-admin-actions.ts:253` で `"participation"` 固定。`nominated` は src/ 全件 0 ヒット。
- 問題: enum 化されていない柔らかい String 列で、用途不明のまま全 row に同じ値が入る。
- 修正案: 削除 or PG 移行のタイミングで native enum 化 + 用途定義。

### 10. N+1: insights `_lib.ts` の peer 集計
- 位置: `src/app/event/[id]/admin/insights/_lib.ts:213-230`
- 現状: 6 件の peer events 各々で `prisma.participant.findMany({ where:{eventId:e.id}, select:{status:true} })` を直列実行。合計 6 SQL。
- 問題: peer 数を増やすと線形に SQL が増える。
- 修正案: `prisma.participant.groupBy({ by:['eventId','status'], where:{eventId:{in: peerEventIds}}, _count:{_all:true} })` で 1 クエリにまとめる。

### 11. N+1: `/discover/page.tsx` で category/city 毎の `count()`
- 位置: `src/app/discover/page.tsx:124-140` (categories), `:158-181` (cities)
- 現状: `DISCOVER_CATEGORIES.map(async (cat) => prisma.event.count(...))` を Promise.all で並列起動。category 数 + city 数だけ count SQL が走る。
- 問題: 並列ではあるが SQLite では single-writer。`/discover` 表示で 6-10 SQL の同時投入は容易にスループットを下げる。
- 修正案: 
  - categories は `eventTag` を `groupBy({by:['tagId'], _count:{_all:true}, where:{...published...}})` で 1 SQL。
  - cities は raw SQL 1 本で都道府県 LIKE 条件を `CASE` 分岐し 1 クエリで全部返す。

### 12. `event/[id]/page.tsx` で participants `take: 200` & calendarEvent / groupAdmin が直列
- 位置: `src/app/event/[id]/page.tsx:115-118, 138-153`
- 現状: メインの `findUnique` で `participants` を 200 件取得し、その後 `await prisma.groupAdmin.findMany` → `await prisma.calendarEvent.findMany` を **直列**。
- 問題: 大規模イベント (>200 人) で截断、それでも 1 RT 内に participants 200 件取得 + 続く 2 SQL 直列。3 SQL 直列で、ページ TTFB が悪い。
- 修正案: 
  - `Promise.all([prisma.event.findUnique(...), prisma.groupAdmin.findMany(...), prisma.calendarEvent.findMany(...)])` で並列化。
  - participants は別クエリにし、UI 上の `accepted` 表示は `take: 30` の preview + `_count` を別途取る。

### 13. `group/[subdomain]/page.tsx` の eventTag aggregate に take なし
- 位置: `src/app/group/[subdomain]/page.tsx:255-272`
- 現状: `prisma.eventTag.findMany({ where:{ event:{ groupId } }, include:{ tag:true } })` を取り切ってから JS 側で 12 件に絞る。
- 問題: 開催数の多いグループでは数百〜数千 row 取得 + JS 集計。
- 修正案: 
  - `prisma.eventTag.groupBy({ by:['tagId'], where:{event:{groupId}}, _count:{_all:true}, orderBy:{ _count:{ tagId:'desc'} }, take:12 })` を使い、その後 `tag.findMany({where:{id:{in:tagIds}}})` で名前を引く (2 クエリ完結)。

### 14. Index 不足: 頻出 orderBy/where に index 無し
- 位置: `prisma/schema.prisma:158-223` (Event), `:424-441` (Notification), `:443-454` (Bookmark), `:490-499` (MagicLinkToken)
- 現状:
  - `Event.acceptedCount` で `orderBy` する箇所が **少なくとも 6 箇所** (`/page.tsx:96?, /ranking/page.tsx:114, /discover/page.tsx:208,244,254, /dashboard/page.tsx:186, /explore/page.tsx:156,219`) — index なし。
  - `Notification` は `(recipientUserId, createdAt)` だけ。**未読カウント** (`dashboard/page.tsx:173-178` の `where:{recipientUserId, readAt:null}`) は readAt index がないので range 全スキャン → SQLite Index Scan + filter。
  - `Bookmark` の `userId` index は unique key 経由でカバー、ただし `orderBy:{createdAt:desc}` (`/bookmarks/page.tsx:48`) は `(userId, createdAt)` 複合 index が欲しい。
  - `MagicLinkToken.expiresAt` は cleanup batch 用 index が必要 (Vercel/Cron で expired を削除する想定)。
  - `Calendar.subscriberCount` で `orderBy` する場面 (`/page.tsx:106, /calendars/page.tsx:74, /discover/page.tsx:190`)。index なし。
  - `Tag.usageCount` も同様。
- 修正案: 以下を追加。
  ```prisma
  @@index([status, visibility, acceptedCount(desc)]) // events
  @@index([recipientUserId, readAt])                  // notifications
  @@index([userId, createdAt(desc)])                  // bookmarks
  @@index([expiresAt])                                // magic_link_tokens
  @@index([status, subscriberCount(desc)])            // calendars
  @@index([usageCount(desc)])                         // tags
  ```
  ※SQLite では `DESC` は無視されるが PG では効く。

---

## Medium

### 15. `Bookmark` ページの無制限取得
- 位置: `src/app/bookmarks/page.tsx:46-56`
- 現状: `prisma.bookmark.findMany({ where:{ userId } })` — **take 無し**。
- 問題: ヘビーユーザーで全件取得。
- 修正案: pagination 導入 (`take:50, skip` または cursor)。

### 16. admin overview で participants 全件 (`take` なし)
- 位置: `src/app/event/[id]/admin/page.tsx:36-46`
- 現状: `include:{ participants:{ include:{user, eventRole}, orderBy:{appliedAt:'asc'} } }` — take なし。
- 問題: 1000 人参加のイベントで `User` join × 1000。さらにすぐ後で `event.participants.filter(...)` を何度も走る (CPU)。
- 修正案: KPI は `groupBy` で集計し、UI の preview は `take: 50`。

### 17. N+1 (擬似): `event/[id]/page.tsx` の `currentUserRejected` 判定
- 位置: `src/app/event/[id]/page.tsx:255-262`
- 現状: 既に取った participants 配列を JS で `some` するだけなので技術的には N+1 ではないが、200 件で線形スキャン × `myParticipation` の find も同じ配列を再ループ。
- 修正案: 1 回のループで構造体を作るか、サーバー側でフラグ付きで取り出す。

### 18. `lottery-actions.runLotteryForRole` の participant 更新が逐次
- 位置: `src/app/actions/lottery-actions.ts:148-204`
- 現状: acceptedSlice / waitingSlice の各人に `await tx.participant.update` を順番に。さらに `tx.notification.create` も人数分。
- 問題: 100 人抽選で 200 UPDATE + 200 INSERT + (100 × MAX(id) 集計) を直列。
- 修正案: `updateMany` で id `in` 形式に分け、`createMany` で notification 一括投入。

### 19. `Payment.voucherCodeId` の relation は SetNull だが UI/Action から `voucherCode` 取得が無い
- 位置: `prisma/schema.prisma:291-298`, `:303-316`
- 現状: relation 設定済みだが src で参照 0。
- 修正案: 6 と同様、Payment 周りの voucher は機能未実装。spec を確定するか relation を削除。

### 20. `Comment.parentCommentId` の onDelete=SetNull はスレッドの破綻を招く
- 位置: `prisma/schema.prisma:332` (relation), migration `20260604073826_init/migration.sql:223`
- 現状: 親コメント削除時に子の parentId が NULL になる → スレッドが root コメントに昇格。
- 問題: UI 上「返信」だった発言が突然 top-level 発言として現れる。一般的には Cascade or 親を soft-delete (deletedAt) してツリーは保つのがベター。
- 修正案: ソフトデリート (`deletedAt`) で論理削除する現方針なら、parent 物理削除しない実装にして onDelete=Restrict にする方が安全。

### 21. `Participant.eventRoleId` の onDelete デフォルト (Restrict) で枠削除が困難
- 位置: `prisma/schema.prisma:271` (`eventRole User`)
- 現状: 既存 participants がいる EventRole は削除できない (Restrict)。これ自体は正しいが、UI で枠削除を試みた時のエラーハンドリングが見えない (`admin/registration/page.tsx` 経由)。
- 修正案: 枠削除前に該当枠 participants の他枠移譲フローを必須にする UI ガード。

### 22. `Participant.unique([eventId, userId, eventRoleId])` だが、複数枠の重複申込を許す
- 位置: `prisma/schema.prisma:276`
- 現状: 1 ユーザーが同一イベントで枠を変えて何度も `joinEvent` できる。
- 問題: 仕様上は `Event.allowDuplicateJoin: false` で防ぐ意図だったが、`allowDuplicateJoin` は dead field。`joinEvent` でも `tx.participant.findFirst({where:{eventId,userId,status:{not:'cancelled'}}})` で防御している (`src/app/actions/event-actions.ts:185-192`) ので **実害は無いが、DB レベルの保証が弱い**。
- 修正案: `unique([eventId, userId])` (status を関係なく) にして 2 重保証。または `allowDuplicateJoin` を実装して spec を確定。

### 23. `Notification.payload` が String (JSON 文字列) で型安全性ゼロ
- 位置: `prisma/schema.prisma:430`
- 現状: `parseNotificationPayload` (`src/lib/notification.ts:124`) で zod 検証無し、`as NotificationPayload` のみ。
- 問題: 古い払い出しの payload との互換が暗黙。
- 修正案: `payload` を zod schema で parse し、必要なら version field を持つ。

### 24. `Message.audience` が `accepted|waiting|cancelled|all|group_members` を許容するが、`sendBlast` は `group_members` を扱わない
- 位置: `prisma/schema.prisma:475`, 利用 `src/app/actions/event-admin-actions.ts:680-687`
- 現状: ENUM 想定の docs と実装が不一致 (`group_members` が dead value)。
- 修正案: 文字列 enum を `src/lib/notification.ts` に export し、Zod 検証と DB コメントを同期。

### 25. `MagicLinkToken` に `usedAt` のクリーンアップ index 無し
- 位置: `prisma/schema.prisma:490-499`
- 現状: 期限切れ token をバッチ削除する index がない。`@@index([email])` のみ。
- 修正案: `@@index([expiresAt])` を追加して `DELETE WHERE expiresAt < now` を効率化。

### 26. `Calendar.slug` の文字列長制限が SQLite で無いが PG 側は `@db.VarChar(63)` なので migrate 時にデータ依存で失敗しうる
- 位置: `prisma/schema.prisma:525` (SQLite) vs `prisma/schema.postgres.prisma:523` (PG)
- 問題: SQLite で 64 文字以上の slug を許して保存していると PG 移行時に `value too long` エラー。
- 修正案: アプリ側 zod で `max(63)` を課す。`Calendar.slug` 作成 UI でも validate。

---

## Low

### 27. BigInt @id を SQLite で使う必要性
- 位置: 27 モデル中 26 個が `BigInt @id @default(autoincrement())`
- 現状: コメント (`src/app/actions/event-actions.ts:67-76`) で「Prisma 7 + SQLite + Driver Adapter で autoincrement が機能しない」とあり、各 actions に `nextXxxId` helper が散在。
- 問題: BigInt の serialize / API 境界 (`src/lib/serialize.ts:nullableBigintToString` 等多数) で常時変換コスト。実利用件数は myriad レベルではなく数千〜数万を想定。
- 修正案: `Int @id @default(autoincrement())` に倒す + 上限テストを CI に。Driver Adapter の問題が解決すれば `nextXxxId` helper を削除して race condition も消える。

### 28. `User.receiveNotificationEmail` / `receiveReminderEmail` / `receiveRecommendationEmail` と `NotificationPreference` の二重持ち
- 位置: `prisma/schema.prisma:31-33`, `:576-589`
- 現状: 大分類 ON/OFF (User の 3 列) と細粒度 (kind × channel の Preference) が並存。
- 問題: 「`receiveNotificationEmail=false` だが Preference の `(event_published, email)=enabled:true`」のとき送るか送らないかが docs から不明 (`src/app/settings/notifications/page.tsx:7-10` 参照)。
- 修正案: ロジック優先順位を `src/lib/notification.ts` に集中させ doc に明記。長期的には `NotificationPreference` 一本化。

### 29. `EventStat.eventId @id` の片側 1-1 だが seed のみで実装無し
- 位置: `prisma/schema.prisma:456-468`, seed `prisma/seed.ts:977-989`
- 修正案: 上記 dead テーブル削除と共に。

### 30. `User.facebookAccount` / `xAccount` / `githubAccount` と `OAuthIdentity` の二重管理
- 位置: `prisma/schema.prisma:28-30`, `:60-73`
- 現状: 表示用の handle (`@user`) と OAuth 認証 token は別概念だが、`User.xAccount` を OAuth でも上書きするかどうかの仕様が見えない。
- 修正案: 表示 handle は `User.xAccount` (ユーザー編集可)、認証 link 状態は `OAuthIdentity` と明示分離して doc 化。

### 31. `EventRole.name @default("参加枠1")` の日本語デフォルト
- 位置: `prisma/schema.prisma:229`
- 修正案: i18n 対応するなら code 側で代入し、DB は NOT NULL のみ。

### 32. `Group.backgroundColor` の format 制約なし
- 位置: `prisma/schema.prisma:86`
- 現状: `#1f63c1` 想定の hex だが zod validation 無し。
- 修正案: Zod `regex(/^#[0-9a-fA-F]{6}$/)` を `createGroup` に追加 (event の `themeTintColor` (`event-admin-actions.ts:74-80`) と同様)。

### 33. `Participant.checkInMethod` の値 (`manual|code|qr`) で `qr` は `allowQrCheckIn` dead と矛盾
- 位置: `prisma/schema.prisma:265`, `:182`
- 修正案: `allowQrCheckIn` を実装するか、QR を削除して `manual|code` に整理。

### 34. `Tag.slug @unique` だが `slug` 文字列の正規化ロジックがアプリ側に分散
- 位置: `prisma/schema.prisma:342`
- 現状: `categories.ts` / `discover/page.tsx` / `series/page.tsx` 各所で `slug` の文字列処理。
- 修正案: 正規化ロジックを `src/lib/tag-slug.ts` に集約。

---

## Best Practices

### 35. `relation` の inverse 漏れチェック (片側だけ書いたモデル)
- 位置: 確認結果として、`GroupBlacklist` (`prisma/schema.prisma:142-154`) は `User` 側に inverse relation が無い (User → groupBlacklist[] が無い)。dead モデルなので影響なしだが整合性として弱い。
- 推奨: 削除 or `User { ... groupBlacklist GroupBlacklist[] @relation }` を追加。

### 36. `Calendar.events CalendarEvent[]` と `Event.calendars CalendarEvent[]` (`prisma/schema.prisma:217,538,546-557`) は OK
- inverse OK、`onDelete: Cascade` も妥当。`@@index([eventId])` 既存。逆方向 `@@index([calendarId])` は primary key (`@@id([calendarId, eventId])`) の prefix で自動カバー。

### 37. `Notification.recipientUserId` が `onDelete: Restrict` (デフォルト)
- 位置: `prisma/schema.prisma:436-437`
- 現状: User 削除時に Notification が残る (Restrict)。
- 推奨: `withdrawnAt` でソフト削除する設計と整合させ、`onDelete: Cascade` か、user 削除時に明示的に notifications を消す Action を作る。

### 38. enum 値を type-safe に
- 位置: 文字列 enum (`Event.eventFormat`, `Participant.status` 等) は generated Prisma の型では `string`。
- 推奨: `src/types/event.ts:40-50` に既に型あり。serialize 側 (`src/lib/serialize.ts`) で `status as EventStatus` の手動 cast を、`z.enum(...)` で parse する形に統一。

### 39. `revalidatePath` の網羅性
- 位置: `src/app/actions/group-actions.ts:296` の `prisma.group.update` 直後、`revalidatePath` 呼び忘れがあるかどうか別 review 対象。本レビュー対象外だが counter 漏れと併せて要確認。

### 40. migration コメントの一貫性
- 位置: `prisma/migrations/20260605065605_add_fts/migration.sql` 等
- 観察: コメントが充実しており保守性が高い。良い慣習。

---

## 補足: dead/over-allocated columns 早見表

| 場所 | 状態 |
|---|---|
| `Event.allowQrCheckIn` (schema.prisma:182) | dead (src 0 ヒット) |
| `Event.allowDuplicateJoin` (schema.prisma:183) | dead |
| `Event.eventType` (schema.prisma:166) | 1 値固定 |
| `Event.parentEventId` (schema.prisma:191) | dead |
| `Event.seriesEventPosition` (schema.prisma:192) | dead |
| `Event.attendanceCode` (schema.prisma:180) | check-in で利用中 OK |
| `Event.themeTintColor/BackgroundStyle/FontStyle` (schema.prisma:195-197) | 利用あり OK |
| `Group.presentationCount` (schema.prisma:93) | counter 更新無し |
| `Group.memberCount` (schema.prisma:91) | 1 で固定 |
| `Group.eventCount` (schema.prisma:92) | OK (event-admin-actions.ts:291, :864 で increment) |
| `Group.backgroundColor` (schema.prisma:86) | 利用あり OK |
| `Participant.nominated` (schema.prisma:259) | dead |
| `Tag.usageCount` (schema.prisma:343) | seed 時のみ更新、運用中 dead |
| `EventStat.*` 全列 (schema.prisma:456-468) | dead (seed のみ) |
| `VoucherCode.*` 全列 (schema.prisma:303-316) | dead |
| `AuditLog.*` 全列 (schema.prisma:501-515) | dead |
| `GroupBlacklist.*` 全列 (schema.prisma:142-154) | dead |
| `Payment.voucherCodeId` (schema.prisma:291) | dead relation |

---

## 補足: 件数サマリー + N+1 ホットスポット Top 5 (再掲)

### 件数
- Critical: **5** (PG schema 乖離 / Group.memberCount / Group.presentationCount / sendBlast N+1 / Tag.usageCount)
- High: **9** (dead テーブル 5 / dead field 2 / N+1 3 / index 不足 ほか)
- Medium: **12** (取得無制限 / 列車設計 / 詳細 N+1 / enum 不整合)
- Low: **8** (BigInt / 二重通知設定 / serialize 等)
- Best Practices: **5**

### N+1 / 重いクエリ Hot Spot Top 5

1. **`src/app/actions/event-admin-actions.ts:720-734`** — `sendBlast` で受信者 N 人ごとに `notification.aggregate({_max:{id}})` + `notification.create` を直列実行。1 ブラスト 100 人 = 200 SQL + table-level lock 延伸。
2. **`src/app/actions/lottery-actions.ts:148-204`** — `runLotteryForRole` で acceptedSlice + waitingSlice 全件 `participant.update` を逐次 + 各人へ `notification.create` (`nextNotificationId` も毎回 MAX 集計)。100 人抽選で ~400 SQL。
3. **`src/app/event/[id]/admin/insights/_lib.ts:213-230`** — peer events 6 件をループして `participant.findMany`。`groupBy({by:['eventId','status']})` で 1 クエリ化可能。
4. **`src/app/discover/page.tsx:124-181`** — DISCOVER_CATEGORIES × DISCOVER_CITIES の各々で `prisma.event.count` を並列実行 (6〜10 SQL)。`eventTag.groupBy` + raw SQL CASE 集計で 2 SQL に削減可能。
5. **`src/app/group/[subdomain]/page.tsx:255-272`** + 同 ファイル `:138-153` (event 詳細 fetch も含む) — `eventTag.findMany({ where:{event:{groupId}} })` を `take` 無しで全 row 取得 + JS で 12 件に絞り込み。`groupBy` + `take: 12` に置換すべき。
