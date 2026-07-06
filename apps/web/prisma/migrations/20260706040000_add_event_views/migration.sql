-- Wave 6: Insights ファネル用イベント閲覧ログ

CREATE TABLE "event_views" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" BIGINT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_views_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "event_views_eventId_createdAt_idx" ON "event_views"("eventId", "createdAt");
CREATE INDEX "event_views_eventId_sessionId_idx" ON "event_views"("eventId", "sessionId");
