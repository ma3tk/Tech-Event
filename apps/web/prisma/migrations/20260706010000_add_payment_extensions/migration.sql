-- Wave 3: 決済拡張 (返金 / 領収 / クーポン / Unlock Code / Donation / 販売期間)

-- Payment: 返金・領収・クーポン割引フィールド
ALTER TABLE "payments" ADD COLUMN "refundedAmount" INTEGER;
ALTER TABLE "payments" ADD COLUMN "refundReason" TEXT;
ALTER TABLE "payments" ADD COLUMN "providerRefundId" TEXT;
ALTER TABLE "payments" ADD COLUMN "discountAmount" INTEGER DEFAULT 0;
ALTER TABLE "payments" ADD COLUMN "couponId" BIGINT;
ALTER TABLE "payments" ADD COLUMN "receiptNumber" TEXT;
ALTER TABLE "payments" ADD COLUMN "receiptName" TEXT;

-- EventRole: 販売期間 / Unlock Code / Donation
ALTER TABLE "event_roles" ADD COLUMN "saleStartsAt" DATETIME;
ALTER TABLE "event_roles" ADD COLUMN "saleEndsAt" DATETIME;
ALTER TABLE "event_roles" ADD COLUMN "unlockCode" TEXT;
ALTER TABLE "event_roles" ADD COLUMN "donationMinAmount" INTEGER;

-- Group: 領収データ (発行者名 / 適格請求書番号)
ALTER TABLE "groups" ADD COLUMN "receiptIssuerName" TEXT;
ALTER TABLE "groups" ADD COLUMN "invoiceRegistrationNumber" TEXT;

-- Coupon
CREATE TABLE "coupons" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'event',
    "eventId" BIGINT,
    "groupId" BIGINT,
    "discountType" TEXT NOT NULL DEFAULT 'fixed',
    "discountValue" INTEGER NOT NULL,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "coupons_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coupons_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "coupons_scope_eventId_groupId_code_key" ON "coupons"("scope", "eventId", "groupId", "code");
CREATE INDEX "coupons_eventId_idx" ON "coupons"("eventId");
CREATE INDEX "coupons_groupId_idx" ON "coupons"("groupId");

-- CouponRedemption
CREATE TABLE "coupon_redemptions" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "couponId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "paymentId" BIGINT,
    "amount" INTEGER NOT NULL,
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coupon_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "coupon_redemptions_couponId_idx" ON "coupon_redemptions"("couponId");
CREATE INDEX "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");

-- Payment.couponId index + FK
CREATE INDEX "payments_couponId_idx" ON "payments"("couponId");
