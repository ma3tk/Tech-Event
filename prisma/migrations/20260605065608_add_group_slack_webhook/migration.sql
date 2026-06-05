-- Group に Slack 通知用 Webhook URL 設定を追加。
-- (Prisma schema の Group.slackWebhookUrl と整合)

ALTER TABLE "groups" ADD COLUMN "slackWebhookUrl" TEXT;
