-- AlterTable
ALTER TABLE "events" ADD COLUMN "themeBackgroundStyle" TEXT;
ALTER TABLE "events" ADD COLUMN "themeFontStyle" TEXT;
ALTER TABLE "events" ADD COLUMN "themeTintColor" TEXT;

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "magic_link_tokens_email_idx" ON "magic_link_tokens"("email");
