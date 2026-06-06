-- データモデル review (research/code-review/data-model.md High #14) の対応。
-- 頻出 orderBy/where に index を追加してフルスキャンを回避する。
--
-- events:
--   - status + visibility + acceptedCount は ranking / popular 並び替えで頻出
-- notifications:
--   - dashboard 未読カウント `where: { recipientUserId, readAt: null }` 用
-- bookmarks:
--   - /bookmarks 一覧の orderBy createdAt desc を覆う複合 index
-- magic_link_tokens:
--   - 期限切れ token の cleanup (`DELETE WHERE expiresAt < now()`)
-- calendars:
--   - 人気のカレンダー (status + subscriberCount desc) 用
-- tags:
--   - 人気タグランキング (`orderBy: { usageCount: 'desc' }`) 用

CREATE INDEX IF NOT EXISTS "events_status_visibility_acceptedCount_idx"
  ON "events"("status", "visibility", "acceptedCount");

CREATE INDEX IF NOT EXISTS "notifications_recipientUserId_readAt_idx"
  ON "notifications"("recipientUserId", "readAt");

CREATE INDEX IF NOT EXISTS "bookmarks_userId_createdAt_idx"
  ON "bookmarks"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "magic_link_tokens_expiresAt_idx"
  ON "magic_link_tokens"("expiresAt");

CREATE INDEX IF NOT EXISTS "calendars_status_subscriberCount_idx"
  ON "calendars"("status", "subscriberCount");

CREATE INDEX IF NOT EXISTS "tags_usageCount_idx"
  ON "tags"("usageCount");
