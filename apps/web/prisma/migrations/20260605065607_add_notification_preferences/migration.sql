-- 通知設定詳細テーブル `notification_preferences`。
--
-- 既存の User.receive*Email (BOOLEAN フラグ) はカテゴリ大まかな ON/OFF。
-- ここでは「kind × channel」単位の細粒度のオプトアウト/オプトインを保持する。
-- 未登録 (=レコード無し) なら **既定で有効** として扱う (詳細は src/lib/notification.ts)。
--
-- (userId, kind, channel) で UNIQUE。

CREATE TABLE "notification_preferences" (
  "id" BIGINT NOT NULL PRIMARY KEY,
  "userId" BIGINT NOT NULL,
  "kind" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notification_preferences_userId_kind_channel_key"
  ON "notification_preferences"("userId", "kind", "channel");

CREATE INDEX "notification_preferences_userId_idx"
  ON "notification_preferences"("userId");
