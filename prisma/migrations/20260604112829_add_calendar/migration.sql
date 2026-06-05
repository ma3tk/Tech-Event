-- CreateTable
CREATE TABLE "calendars" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "tintColor" TEXT,
    "ownerUserId" BIGINT NOT NULL,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calendars_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "calendarId" BIGINT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("calendarId", "eventId"),
    CONSTRAINT "calendar_events_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calendar_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_subscriptions" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "calendarId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calendar_subscriptions_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calendar_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "calendars_slug_key" ON "calendars"("slug");

-- CreateIndex
CREATE INDEX "calendars_status_idx" ON "calendars"("status");

-- CreateIndex
CREATE INDEX "calendars_ownerUserId_idx" ON "calendars"("ownerUserId");

-- CreateIndex
CREATE INDEX "calendar_events_eventId_idx" ON "calendar_events"("eventId");

-- CreateIndex
CREATE INDEX "calendar_subscriptions_userId_idx" ON "calendar_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_subscriptions_calendarId_userId_key" ON "calendar_subscriptions"("calendarId", "userId");
