-- ComponentFeedback: デザインシステム改善ループ用フィードバック。
-- Storybook (Gallery / Docs) の HTML フォームから各コンポーネントへの評価 (1-5) +
-- 任意コメントを受け付け、/admin/component-feedback で集計・トリアージする。
-- 投稿は匿名可 (userId は NULL 許容、ユーザー削除時は SET NULL)。

-- CreateTable
CREATE TABLE "component_feedback" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "component" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "userId" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "component_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "component_feedback_component_createdAt_idx" ON "component_feedback"("component", "createdAt");

-- CreateIndex
CREATE INDEX "component_feedback_status_idx" ON "component_feedback"("status");
