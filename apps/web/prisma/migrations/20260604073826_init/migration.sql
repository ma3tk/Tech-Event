-- CreateTable
CREATE TABLE "users" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "affiliation" TEXT,
    "location" TEXT,
    "websiteUrl" TEXT,
    "xAccount" TEXT,
    "facebookAccount" TEXT,
    "githubAccount" TEXT,
    "receiveNotificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "receiveReminderEmail" BOOLEAN NOT NULL DEFAULT true,
    "receiveRecommendationEmail" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "withdrawnAt" DATETIME,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "oauth_identities" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUid" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oauth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "groups" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "subdomain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "organization" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "backgroundColor" TEXT,
    "websiteUrl" TEXT,
    "xAccount" TEXT,
    "facebookUrl" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "presentationCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "group_admins" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "groupId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "addedByUserId" BIGINT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_admins_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "groupId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "joinedVia" TEXT NOT NULL DEFAULT 'manual',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiveAnnouncement" BOOLEAN NOT NULL DEFAULT true,
    "leftAt" DATETIME,
    CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_blacklist" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "groupId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "reason" TEXT,
    "addedByUserId" BIGINT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_blacklist_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "groupId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "catchPhrase" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "hashTag" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'participation',
    "eventFormat" TEXT NOT NULL DEFAULT 'offline',
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    "acceptsFrom" DATETIME,
    "acceptsUntil" DATETIME,
    "place" TEXT,
    "address" TEXT,
    "lat" REAL,
    "lon" REAL,
    "onlineUrl" TEXT,
    "capacity" INTEGER,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "waitingCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceCode" TEXT,
    "allowAttendanceCodeCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "allowQrCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "allowDuplicateJoin" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recruitmentMethod" TEXT NOT NULL DEFAULT 'fcfs',
    "lotteryAnnounceAt" DATETIME,
    "ownerId" BIGINT NOT NULL,
    "ownerDisplayName" TEXT,
    "parentEventId" BIGINT,
    "seriesEventPosition" INTEGER,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "events_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "events_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_roles" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT '参加枠1',
    "description" TEXT,
    "capacity" INTEGER,
    "recruitmentMethod" TEXT NOT NULL DEFAULT 'fcfs',
    "pricingType" TEXT NOT NULL DEFAULT 'free',
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "autoPromoteFromWaiting" BOOLEAN NOT NULL DEFAULT true,
    "visibleAfterFull" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "event_roles_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "participants" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "eventRoleId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "nominated" BOOLEAN NOT NULL DEFAULT false,
    "waitingPosition" INTEGER,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "cancelledAt" DATETIME,
    "checkInAt" DATETIME,
    "checkInMethod" TEXT,
    "paymentId" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "participants_eventRoleId_fkey" FOREIGN KEY ("eventRoleId") REFERENCES "event_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "participantId" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "provider" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "voucherCodeId" BIGINT,
    "status" TEXT NOT NULL,
    "paidAt" DATETIME,
    "refundedAt" DATETIME,
    "receiptIssuedAt" DATETIME,
    CONSTRAINT "payments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_voucherCodeId_fkey" FOREIGN KEY ("voucherCodeId") REFERENCES "voucher_codes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voucher_codes" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    CONSTRAINT "voucher_codes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "parentCommentId" BIGINT,
    "body" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "comments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "comments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "event_tags" (
    "eventId" BIGINT NOT NULL,
    "tagId" BIGINT NOT NULL,

    PRIMARY KEY ("eventId", "tagId"),
    CONSTRAINT "event_tags_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "presentation_materials" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "presenterUserId" BIGINT,
    "presenterDisplayName" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "presentation_materials_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "presentation_materials_presenterUserId_fkey" FOREIGN KEY ("presenterUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "surveys_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "surveyId" BIGINT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "options" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "surveyQuestionId" BIGINT NOT NULL,
    "participantId" BIGINT NOT NULL,
    "answerValue" TEXT NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "survey_answers_surveyQuestionId_fkey" FOREIGN KEY ("surveyQuestionId") REFERENCES "survey_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "survey_answers_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "recipientUserId" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "eventId" BIGINT,
    "groupId" BIGINT,
    "payload" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookmarks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_stats" (
    "eventId" BIGINT NOT NULL PRIMARY KEY,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "applyCount" INTEGER NOT NULL DEFAULT 0,
    "cancelCount" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "event_stats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT,
    "groupId" BIGINT,
    "senderUserId" BIGINT NOT NULL,
    "audience" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientCount" INTEGER NOT NULL,
    CONSTRAINT "messages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "actorUserId" BIGINT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" BIGINT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_identities_provider_providerUid_key" ON "oauth_identities"("provider", "providerUid");

-- CreateIndex
CREATE UNIQUE INDEX "groups_subdomain_key" ON "groups"("subdomain");

-- CreateIndex
CREATE INDEX "groups_status_idx" ON "groups"("status");

-- CreateIndex
CREATE INDEX "groups_publishedAt_idx" ON "groups"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "group_admins_groupId_userId_key" ON "group_admins"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_blacklist_groupId_userId_key" ON "group_blacklist"("groupId", "userId");

-- CreateIndex
CREATE INDEX "events_groupId_startedAt_idx" ON "events"("groupId", "startedAt");

-- CreateIndex
CREATE INDEX "events_status_publishedAt_idx" ON "events"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "events_startedAt_idx" ON "events"("startedAt");

-- CreateIndex
CREATE INDEX "event_roles_eventId_idx" ON "event_roles"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "participants_paymentId_key" ON "participants"("paymentId");

-- CreateIndex
CREATE INDEX "participants_userId_appliedAt_idx" ON "participants"("userId", "appliedAt");

-- CreateIndex
CREATE INDEX "participants_eventId_status_idx" ON "participants"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "participants_eventId_userId_eventRoleId_key" ON "participants"("eventId", "userId", "eventRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_participantId_key" ON "payments"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_codes_code_key" ON "voucher_codes"("code");

-- CreateIndex
CREATE INDEX "comments_eventId_createdAt_idx" ON "comments"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "presentation_materials_eventId_idx" ON "presentation_materials"("eventId");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_createdAt_idx" ON "notifications"("recipientUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_eventId_key" ON "bookmarks"("userId", "eventId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");
