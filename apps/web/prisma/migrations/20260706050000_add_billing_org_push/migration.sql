-- Wave 6b: Plus プラン課金 / Organization 階層 / Membership tiers / Web Push

-- Group: 課金プラン
ALTER TABLE "groups" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "groups" ADD COLUMN "planExpiresAt" DATETIME;
ALTER TABLE "groups" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "groups" ADD COLUMN "stripeSubscriptionId" TEXT;

-- Calendar: organization 所属
ALTER TABLE "calendars" ADD COLUMN "organizationId" BIGINT;
CREATE INDEX "calendars_organizationId_idx" ON "calendars"("organizationId");

-- CalendarSubscription: tier / status
ALTER TABLE "calendar_subscriptions" ADD COLUMN "tierId" BIGINT;
ALTER TABLE "calendar_subscriptions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
CREATE INDEX "calendar_subscriptions_tierId_idx" ON "calendar_subscriptions"("tierId");

-- Organization
CREATE TABLE "organizations" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "ownerUserId" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "organizations_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_ownerUserId_idx" ON "organizations"("ownerUserId");

-- CalendarMembershipTier
CREATE TABLE "calendar_membership_tiers" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "calendarId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calendar_membership_tiers_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "calendar_membership_tiers_calendarId_idx" ON "calendar_membership_tiers"("calendarId");

-- PushSubscription
CREATE TABLE "push_subscriptions" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");
