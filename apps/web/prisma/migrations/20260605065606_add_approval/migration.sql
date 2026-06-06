-- Approval Required 申込フロー (Luma 風) 用カラムの追加。
--
-- - events.approvalRequired : 主催者が承認制かどうかをトグル。
-- - participants.approvalStatus : pending|approved|rejected (NULL = 承認不要)
-- - participants.approvalNote   : 主催者が任意で付けるメモ。
--
-- SQLite の ALTER TABLE では DEFAULT を伴う列追加が可能なため、
-- そのまま BOOLEAN/TEXT を NOT NULL DEFAULT 付きで追加する。

ALTER TABLE "events" ADD COLUMN "approvalRequired" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "participants" ADD COLUMN "approvalStatus" TEXT;
ALTER TABLE "participants" ADD COLUMN "approvalNote" TEXT;
