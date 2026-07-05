-- PasswordResetToken: パスワードリセット用ワンタイムトークン。
-- 生トークン (32byte hex) はメール本文でのみ送付し、DB には sha256 ハッシュのみ保存する
-- (DB 漏洩時にトークンを直接使えなくするため)。
-- 有効期限は発行から 1 時間。使用済みは usedAt を set してワンタイム化する。
-- ユーザー削除時はトークンも削除 (CASCADE)。

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");
