# 模倣実装のためのマイグレーション戦略 (Prisma スキーマ案)

`entities.md` / `relationships.md` / `enums-and-states.md` を踏まえ、connpass クローン (`tech-event`) を Prisma + PostgreSQL で実装する際のスキーマ案と段階的マイグレーション計画を示す。

---

## 1. 段階的マイグレーション計画

connpass のフル機能を一気にコピーすると初期実装で詰まるため、ドメイン重要度順に 5 フェーズに分割する。

### Phase 1: 認証・グループ・基本イベント (MVP)
- User, OAuthIdentity
- Group, GroupAdmin, GroupMember
- Event, EventRole, Participant
- 先着順のみサポート、決済なし、コメントなし、アンケートなし

### Phase 2: コミュニケーション
- Comment
- Notification (in_app + email)
- Message (一括メッセージ)
- Bookmark

### Phase 3: 抽選・出席・タグ
- Event.recruitment_method=lottery 対応
- attendance_code / qr_check_in
- Tag, EventTag
- PresentationMaterial

### Phase 4: 決済・アンケート
- Payment, VoucherCode
- Survey, SurveyQuestion, SurveyAnswer

### Phase 5: 運用機能
- AuditLog
- EventStat
- GroupBlacklist
- カンファレンス特集 (Event.parent_event_id)

各フェーズは Prisma migration を 1〜2 個に区切り、それぞれデプロイ可能な状態にする。

---

## 2. Prisma スキーマ案 (`schema.prisma`)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ Enums ============

enum UserStatus {
  active
  suspended
  withdrawn
}

enum OAuthProvider {
  twitter
  facebook
  github
}

enum GroupStatus {
  active
  archived
}

enum GroupAdminRole {
  owner
  admin
}

enum GroupMemberJoinedVia {
  manual
  event_join
  admin_add
}

enum EventStatus {
  draft
  published
  closed
  cancelled
}

enum EventFormat {
  offline
  online
  hybrid
}

enum EventVisibility {
  public
  private_link
  draft
}

enum RecruitmentMethod {
  fcfs
  lottery
}

enum RoleRecruitmentMethod {
  fcfs
  lottery
  designated
}

enum PricingType {
  free
  on_site
  prepaid
}

enum ParticipantStatus {
  pending
  accepted
  waiting
  cancelled
  attended
  no_show
}

enum CheckInMethod {
  manual
  code
  qr
}

enum PaymentStatus {
  pending
  succeeded
  refunded
  failed
}

enum PaymentProvider {
  paypal
  voucher
}

enum NotificationKind {
  event_published
  lottery_result
  promoted_from_waiting
  reminder_24h
  reminder_1h
  new_comment
  comment_reply
  message_from_organizer
  survey_request
  payment_succeeded
  payment_refunded
  group_message
  event_cancelled
  event_updated
  bookmark_event_started
}

enum NotificationChannel {
  email
  in_app
  push
}

enum SurveyTrigger {
  on_apply
  after_event
}

enum SurveyInputType {
  text
  textarea
  single
  multi
  scale
}

enum MessageAudience {
  accepted
  waiting
  cancelled
  all
  group_members
}

// ============ Core Models ============

model User {
  id                          BigInt   @id @default(autoincrement())
  nickname                    String   @unique @db.VarChar(64)
  displayName                 String   @db.VarChar(80)
  email                       String   @unique @db.VarChar(255)
  emailVerifiedAt             DateTime?
  passwordHash                String?  @db.VarChar(255)
  avatarUrl                   String?  @db.VarChar(500)
  bio                         String?  @db.Text
  affiliation                 String?  @db.VarChar(120)
  location                    String?  @db.VarChar(120)
  websiteUrl                  String?  @db.VarChar(500)
  xAccount                    String?  @db.VarChar(64)
  facebookAccount             String?  @db.VarChar(64)
  githubAccount               String?  @db.VarChar(64)
  receiveNotificationEmail    Boolean  @default(true)
  receiveReminderEmail        Boolean  @default(true)
  receiveRecommendationEmail  Boolean  @default(true)
  status                      UserStatus @default(active)
  withdrawnAt                 DateTime?
  lastLoginAt                 DateTime?
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  oauthIdentities  OAuthIdentity[]
  groupAdmins      GroupAdmin[]
  groupMembers     GroupMember[]
  ownedEvents      Event[] @relation("EventOwner")
  participants     Participant[]
  comments         Comment[]
  bookmarks        Bookmark[]
  notifications    Notification[]
  sentMessages     Message[]
  presentations    PresentationMaterial[]

  @@map("users")
  @@index([status])
}

model OAuthIdentity {
  id          BigInt   @id @default(autoincrement())
  userId      BigInt
  provider    OAuthProvider
  providerUid String   @db.VarChar(120)
  accessToken String?  @db.Text
  refreshToken String? @db.Text
  connectedAt DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUid])
  @@map("oauth_identities")
}

model Group {
  id                  BigInt   @id @default(autoincrement())
  subdomain           String   @unique @db.VarChar(63)
  name                String   @db.VarChar(120)
  subtitle            String?  @db.VarChar(255)
  organization        String?  @db.VarChar(120)
  description         String?  @db.Text
  coverImageUrl       String?  @db.VarChar(500)
  thumbnailUrl        String?  @db.VarChar(500)
  backgroundColor     String?  @db.VarChar(7)
  websiteUrl          String?  @db.VarChar(500)
  xAccount            String?  @db.VarChar(64)
  facebookUrl         String?  @db.VarChar(500)
  memberCount         Int      @default(0)
  eventCount          Int      @default(0)
  presentationCount   Int      @default(0)
  status              GroupStatus @default(active)
  publishedAt         DateTime @default(now())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  events       Event[]
  admins       GroupAdmin[]
  members      GroupMember[]
  blacklist    GroupBlacklist[]
  messages     Message[]

  @@map("groups")
  @@index([status])
  @@index([publishedAt(sort: Desc)])
}

model GroupAdmin {
  id              BigInt   @id @default(autoincrement())
  groupId         BigInt
  userId          BigInt
  role            GroupAdminRole @default(admin)
  addedByUserId   BigInt?
  addedAt         DateTime @default(now())

  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("group_admins")
}

model GroupMember {
  id                    BigInt   @id @default(autoincrement())
  groupId               BigInt
  userId                BigInt
  joinedVia             GroupMemberJoinedVia @default(manual)
  joinedAt              DateTime @default(now())
  receiveAnnouncement   Boolean  @default(true)
  leftAt                DateTime?

  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("group_members")
  @@index([userId])
}

model GroupBlacklist {
  id              BigInt   @id @default(autoincrement())
  groupId         BigInt
  userId          BigInt
  reason          String?  @db.VarChar(255)
  addedByUserId   BigInt
  addedAt         DateTime @default(now())

  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("group_blacklist")
}

model Event {
  id                          BigInt   @id @default(autoincrement())
  groupId                     BigInt
  title                       String   @db.VarChar(255)
  catch                       String?  @db.VarChar(255)
  description                 String?  @db.Text
  coverImageUrl               String?  @db.VarChar(500)
  hashTag                     String?  @db.VarChar(64)
  eventType                   String   @default("participation") @db.VarChar(20)
  eventFormat                 EventFormat @default(offline)
  startedAt                   DateTime
  endedAt                     DateTime
  acceptsFrom                 DateTime?
  acceptsUntil                DateTime?
  place                       String?  @db.VarChar(255)
  address                     String?  @db.VarChar(255)
  lat                         Decimal? @db.Decimal(10, 7)
  lon                         Decimal? @db.Decimal(10, 7)
  onlineUrl                   String?  @db.VarChar(500)
  capacity                    Int?
  acceptedCount               Int      @default(0)
  waitingCount                Int      @default(0)
  attendanceCode              String?  @db.VarChar(8)
  allowAttendanceCodeCheckIn  Boolean  @default(true)
  allowQrCheckIn              Boolean  @default(true)
  allowDuplicateJoin          Boolean  @default(false)
  visibility                  EventVisibility @default(public)
  status                      EventStatus @default(draft)
  recruitmentMethod           RecruitmentMethod @default(fcfs)
  lotteryAnnounceAt           DateTime?
  ownerId                     BigInt
  ownerDisplayName            String?  @db.VarChar(80)
  parentEventId               BigInt?
  seriesEventPosition         Int?
  publishedAt                 DateTime?
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  group         Group  @relation(fields: [groupId], references: [id])
  owner         User   @relation("EventOwner", fields: [ownerId], references: [id])
  parentEvent   Event? @relation("EventChildren", fields: [parentEventId], references: [id])
  childEvents   Event[] @relation("EventChildren")
  roles         EventRole[]
  participants  Participant[]
  comments      Comment[]
  presentations PresentationMaterial[]
  surveys       Survey[]
  tags          EventTag[]
  bookmarks     Bookmark[]
  notifications Notification[]
  messages      Message[]
  voucherCodes  VoucherCode[]
  stat          EventStat?

  @@map("events")
  @@index([groupId, startedAt(sort: Desc)])
  @@index([status, publishedAt(sort: Desc)])
  @@index([startedAt])
}

model EventRole {
  id                        BigInt   @id @default(autoincrement())
  eventId                   BigInt
  displayOrder              Int      @default(1) @db.SmallInt
  name                      String   @default("参加枠1") @db.VarChar(80)
  description               String?  @db.Text
  capacity                  Int?
  recruitmentMethod         RoleRecruitmentMethod @default(fcfs)
  pricingType               PricingType @default(free)
  price                     Int      @default(0)
  currency                  String   @default("JPY") @db.Char(3)
  autoPromoteFromWaiting    Boolean  @default(true)
  visibleAfterFull          Boolean  @default(true)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  event        Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  participants Participant[]

  @@map("event_roles")
  @@index([eventId])
}

model Participant {
  id              BigInt   @id @default(autoincrement())
  eventId         BigInt
  eventRoleId     BigInt
  userId          BigInt
  status          ParticipantStatus @default(pending)
  nominated       Boolean  @default(false)
  waitingPosition Int?
  appliedAt       DateTime @default(now())
  acceptedAt      DateTime?
  cancelledAt     DateTime?
  checkInAt       DateTime?
  checkInMethod   CheckInMethod?
  paymentId       BigInt?  @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  event       Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventRole   EventRole @relation(fields: [eventRoleId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  payment     Payment?
  surveyAnswers SurveyAnswer[]

  @@unique([eventId, userId, eventRoleId])
  @@map("participants")
  @@index([userId, appliedAt(sort: Desc)])
  @@index([eventId, status])
}

model Payment {
  id              BigInt   @id @default(autoincrement())
  participantId   BigInt   @unique
  amount          Int
  currency        String   @default("JPY") @db.Char(3)
  provider        PaymentProvider
  providerTxnId   String?  @db.VarChar(120)
  voucherCodeId   BigInt?
  status          PaymentStatus
  paidAt          DateTime?
  refundedAt      DateTime?
  receiptIssuedAt DateTime?

  participant   Participant   @relation(fields: [participantId], references: [id])
  voucherCode   VoucherCode?  @relation(fields: [voucherCodeId], references: [id])

  @@map("payments")
}

model VoucherCode {
  id              BigInt   @id @default(autoincrement())
  eventId         BigInt
  code            String   @unique @db.VarChar(32)
  discountAmount  Int
  maxUses         Int?
  usedCount       Int      @default(0)
  expiresAt       DateTime?

  event    Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  payments Payment[]

  @@map("voucher_codes")
}

model Comment {
  id                BigInt   @id @default(autoincrement())
  eventId           BigInt
  userId            BigInt
  parentCommentId   BigInt?
  body              String   @db.Text
  isPinned          Boolean  @default(false)
  createdAt         DateTime @default(now())
  deletedAt         DateTime?

  event        Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id])
  parent       Comment? @relation("CommentReplies", fields: [parentCommentId], references: [id])
  replies      Comment[] @relation("CommentReplies")

  @@map("comments")
  @@index([eventId, createdAt])
}

model Tag {
  id          BigInt   @id @default(autoincrement())
  name        String   @unique @db.VarChar(40)
  slug        String   @unique @db.VarChar(40)
  usageCount  Int      @default(0)

  events      EventTag[]

  @@map("tags")
}

model EventTag {
  eventId BigInt
  tagId   BigInt

  event   Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tag     Tag   @relation(fields: [tagId], references: [id])

  @@id([eventId, tagId])
  @@map("event_tags")
}

model PresentationMaterial {
  id                      BigInt   @id @default(autoincrement())
  eventId                 BigInt
  presenterUserId         BigInt?
  presenterDisplayName    String?  @db.VarChar(120)
  title                   String   @db.VarChar(255)
  url                     String   @db.VarChar(500)
  thumbnailUrl            String?  @db.VarChar(500)
  displayOrder            Int      @default(1) @db.SmallInt
  postedAt                DateTime @default(now())

  event       Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  presenter   User? @relation(fields: [presenterUserId], references: [id])

  @@map("presentation_materials")
  @@index([eventId])
}

model Survey {
  id        BigInt   @id @default(autoincrement())
  eventId   BigInt
  title     String   @db.VarChar(255)
  trigger   SurveyTrigger
  required  Boolean  @default(false)

  event     Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  questions SurveyQuestion[]

  @@map("surveys")
}

model SurveyQuestion {
  id            BigInt   @id @default(autoincrement())
  surveyId      BigInt
  displayOrder  Int      @db.SmallInt
  body          String   @db.Text
  inputType     SurveyInputType
  options       Json?
  required      Boolean  @default(false)

  survey   Survey @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  answers  SurveyAnswer[]

  @@map("survey_questions")
}

model SurveyAnswer {
  id                  BigInt   @id @default(autoincrement())
  surveyQuestionId    BigInt
  participantId       BigInt
  answerValue         Json
  answeredAt          DateTime @default(now())

  question      SurveyQuestion @relation(fields: [surveyQuestionId], references: [id], onDelete: Cascade)
  participant   Participant    @relation(fields: [participantId], references: [id], onDelete: Cascade)

  @@map("survey_answers")
}

model Notification {
  id                BigInt   @id @default(autoincrement())
  recipientUserId   BigInt
  kind              NotificationKind
  eventId           BigInt?
  groupId           BigInt?
  payload           Json
  channel           NotificationChannel
  sentAt            DateTime?
  readAt            DateTime?
  createdAt         DateTime @default(now())

  recipient   User    @relation(fields: [recipientUserId], references: [id])
  event       Event?  @relation(fields: [eventId], references: [id])

  @@map("notifications")
  @@index([recipientUserId, createdAt(sort: Desc)])
}

model Bookmark {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt
  eventId   BigInt
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@map("bookmarks")
}

model EventStat {
  eventId         BigInt   @id
  pageViews       Int      @default(0)
  uniqueViewers   Int      @default(0)
  applyCount      Int      @default(0)
  cancelCount     Int      @default(0)
  attendanceRate  Decimal? @db.Decimal(5, 2)
  updatedAt       DateTime @updatedAt

  event   Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@map("event_stats")
}

model Message {
  id              BigInt   @id @default(autoincrement())
  eventId         BigInt?
  groupId         BigInt?
  senderUserId    BigInt
  audience        MessageAudience
  subject         String   @db.VarChar(255)
  body            String   @db.Text
  sentAt          DateTime @default(now())
  recipientCount  Int

  event   Event?  @relation(fields: [eventId], references: [id])
  group   Group?  @relation(fields: [groupId], references: [id])
  sender  User    @relation(fields: [senderUserId], references: [id])

  @@map("messages")
}

model AuditLog {
  id              BigInt   @id @default(autoincrement())
  actorUserId     BigInt?
  action          String   @db.VarChar(60)
  targetType      String   @db.VarChar(40)
  targetId        BigInt
  ipAddress       String?  @db.Inet
  userAgent       String?  @db.Text
  metadata        Json?
  createdAt       DateTime @default(now())

  @@map("audit_logs")
  @@index([actorUserId, createdAt(sort: Desc)])
  @@index([targetType, targetId])
}
```

---

## 3. データ整合性のための DB トリガ / アプリケーションロジック

Prisma 単体では表現しきれない制約を、Postgres の CHECK 制約・トリガ・アプリ層で補完する。

### 3.1 CHECK 制約 (Prisma migration の SQL に手書き追記)

```sql
ALTER TABLE events
  ADD CONSTRAINT chk_lottery_announce
  CHECK (
    (recruitment_method = 'fcfs')
    OR (recruitment_method = 'lottery' AND lottery_announce_at IS NOT NULL)
  );

ALTER TABLE participants
  ADD CONSTRAINT chk_cancelled_timestamp
  CHECK (
    (status <> 'cancelled') OR (cancelled_at IS NOT NULL)
  );

ALTER TABLE participants
  ADD CONSTRAINT chk_attended_timestamp
  CHECK (
    (status <> 'attended') OR (check_in_at IS NOT NULL AND accepted_at IS NOT NULL)
  );

ALTER TABLE event_roles
  ADD CONSTRAINT chk_price_for_pricing
  CHECK (
    (pricing_type IN ('free', 'on_site')) OR
    (pricing_type = 'prepaid' AND price > 0)
  );
```

### 3.2 自動更新トリガ

カウンタキャッシュ (Event.accepted_count, Group.member_count 等) は after-insert/update/delete トリガで更新する。あるいは Prisma の middleware で実装してもよい。

### 3.3 排他制御

- Participant 申込時: `BEGIN ... SELECT ... FOR UPDATE` で EventRole のロックを取得し、定員と現在の `accepted` 件数を比較。
- 抽選 cron: Event 単位でアドバイザリロック (`pg_advisory_xact_lock(event_id)`)。
- キャンセル時の繰り上がり: 同上のロックで連続実行を防止。

---

## 4. 移行戦略 (本番 connpass から想定データ流入)

実際に connpass から直接データを引き継ぐわけではないが、ETL を行うイメージで次の順序で投入する。

1. **User**: 既存 OAuth ユーザーを発行。`nickname` の正規化。
2. **Group**: 既存 connpass グループ URL のサブドメインを衝突しないよう調整。
3. **GroupAdmin / GroupMember**: User と Group が揃ったあとに投入。
4. **Event**: ownerId / groupId を確認しつつ。
5. **EventRole**: Event ごとに最低 1 件。
6. **Participant**: Event ごとに applied_at の順で投入し waiting_position を再計算。
7. **その他コンテンツ**: Comment, PresentationMaterial, Tag, EventTag, Survey 等。

---

## 5. シードデータ戦略

開発・テストでは `prisma db seed` に以下を実装:

- ユーザー 50 名 (うち 5 名は管理者ロール)
- グループ 5 件 (LayerX, Findy, DeNA を模した名前)
- イベント 30 件 (`published` 20, `draft` 5, `closed` 5)
- 参加枠は各イベント 1〜3 件
- 参加者は accepted 80%, waiting 15%, cancelled 5% でランダム配置
- タグ 20 種、PresentationMaterial 50 件
- 抽選イベント 5 件 (lottery_announce_at は明日 0 時)
- 有料イベント 3 件 + VoucherCode 5 件

---

## 6. 後方互換性 (拡張時の指針)

- Enum 追加は破壊的変更ではない: 既存値はそのまま、新値を Prisma schema に append。
- カラム追加は nullable で投入し、デプロイ後にバックフィル → NOT NULL 化。
- カラム rename は 2 リリースに分割: (1) 新カラム追加 + dual write, (2) 旧カラム削除。
- 外部キーの参照解除は ON DELETE CASCADE / RESTRICT を明示。

---

## 7. パフォーマンス前提

connpass の規模感 (Findy グループ 44,510 名、LayerX グループ 11,635 名) から、想定スケール:

- User: 数百万 (= テーブル分割は不要、適切なインデックスで足りる)
- Event: 数十万 / 年
- Participant: 数千万 (`(event_id, status)` インデックスは必須)
- Notification: 数億 (パーティショニング推奨: `created_at` の月次 RANGE)
- AuditLog: 数億 (同上)

Prisma は標準でパーティションテーブルを宣言できないため、`prisma db push --skip-generate` の代わりに SQL 直書きで CREATE TABLE PARTITION OF を扱うか、`pgroll` のような外部ツールを併用する。

---

## 8. テスト戦略

- **モデルレベル**: 各エンティティの CRUD と CHECK 違反のケース。
- **状態遷移**: Participant.status を全パターンで検証する遷移テーブルテスト。
- **同時並行性**: 100 並列の Participant 申込で定員を超えないことを検証 (Postgres の SERIALIZABLE トランザクションを使う or アプリ層 SELECT FOR UPDATE を使う)。
- **抽選 cron**: 1000 件の pending を抽選 → accepted/waiting の合計が定員一致を検証。

---

以上で `data-model/` の 4 ファイル(entities.md, relationships.md, enums-and-states.md, migration-strategy.md)が完成する。
