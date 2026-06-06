-- Dead model 削除: VoucherCode / EventStat
--
-- 経緯:
--   - VoucherCode: 0 行 (seed では deleteMany のみ)、src/ から参照なし、Payment.voucherCodeId
--     リレーションも実利用なし。spec 確定するまで保持する積極的理由がないため一旦削除。
--   - EventStat:   seed のみ書き込み。UI (insights / admin) は participant.count などで
--     動的計算するため read 参照ゼロ。dead table。
--
-- SQLite は ALTER TABLE DROP COLUMN を FK 含みカラムでは直接実行できないため、
-- 標準的な「新テーブル作成 → コピー → 旧 drop → リネーム」手順 (PRAGMA foreign_keys = OFF)
-- で payments テーブルを再構築する。
-- 復活する場合は別 migration で再 CREATE する想定。

PRAGMA foreign_keys = OFF;

-- payments を voucherCodeId を除いた構造で作り直す
CREATE TABLE "payments_new" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "participantId" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "provider" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "status" TEXT NOT NULL,
    "paidAt" DATETIME,
    "refundedAt" DATETIME,
    "receiptIssuedAt" DATETIME,
    CONSTRAINT "payments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "payments_new" (
    "id", "participantId", "amount", "currency", "provider", "providerTxnId",
    "status", "paidAt", "refundedAt", "receiptIssuedAt"
)
SELECT
    "id", "participantId", "amount", "currency", "provider", "providerTxnId",
    "status", "paidAt", "refundedAt", "receiptIssuedAt"
FROM "payments";

DROP TABLE "payments";
ALTER TABLE "payments_new" RENAME TO "payments";

CREATE UNIQUE INDEX "payments_participantId_key" ON "payments"("participantId");

-- voucher_codes / event_stats テーブル削除
DROP TABLE IF EXISTS "voucher_codes";
DROP TABLE IF EXISTS "event_stats";

PRAGMA foreign_keys = ON;
