-- Wave 4: ソーシャル (ユーザーフォロー / タグフォロー)

-- User: フォロワー / フォロー数カウンタ
ALTER TABLE "users" ADD COLUMN "followerCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "followingCount" INTEGER NOT NULL DEFAULT 0;

-- Follow (ユーザー間フォロー)
CREATE TABLE "follows" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "followerId" BIGINT NOT NULL,
    "followeeId" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follows_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "follows_followerId_followeeId_key" ON "follows"("followerId", "followeeId");
CREATE INDEX "follows_followeeId_idx" ON "follows"("followeeId");

-- TagFollow (タグフォロー)
CREATE TABLE "tag_follows" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "tagId" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tag_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tag_follows_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "tag_follows_userId_tagId_key" ON "tag_follows"("userId", "tagId");
CREATE INDEX "tag_follows_tagId_idx" ON "tag_follows"("tagId");
