/**
 * 開発用シードデータ。
 *
 * 実行: `pnpm tsx prisma/seed.ts` または `pnpm seed`
 *
 * 投入内容:
 *   - User 50 名 (うち 5 名が group の owner)
 *   - Group 8 件 (tech 企業風サブドメイン)
 *   - Event 40 件 (published 30 / draft 5 / closed|cancelled 5)
 *     - published 内訳: 未来開催 10 / 受付中 10 / 満員 10
 *   - 各 published イベントに 5〜30 名の Participant
 *   - Tag 20 件 + EventTag 紐付け
 *   - Comment 各イベント 0〜5 件
 *   - PresentationMaterial: closed イベントに 2〜4 件
 *   - GroupAdmin / GroupMember
 *
 * 冪等性: 実行前に既存データを delete 系で一掃する。
 */

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@tech-event/shared-data-access-prisma";

// DATABASE_URL の接頭で adapter を切り替える (SQLite/PG 両対応)。
// SQLite 専用の挙動を維持しつつ、PG 切替時も同じ seed が動くようにする。
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const isPostgres =
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("postgresql://");

const adapter = isPostgres
  ? new PrismaPg({ connectionString: databaseUrl })
  : new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

/* ============================================================
 * 乱数ユーティリティ (シード可能だが今回は単純な Math.random で十分)
 * ============================================================ */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * テーブルごとの ID 採番カウンタ。
 *
 * Prisma 7 + SQLite + Driver Adapter の組み合わせでは `BigInt @id @default(autoincrement())`
 * が rowid alias にならず、INSERT 時の id 自動採番が機能しない。シード側で明示的に
 * BigInt の連番を割り当てる。
 */
const idCounters = new Map<string, bigint>();
const ZERO = BigInt(0);
const ONE = BigInt(1);
function nextId(table: string): bigint {
  const cur = idCounters.get(table) ?? ZERO;
  const next = cur + ONE;
  idCounters.set(table, next);
  return next;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  const take = Math.min(n, copy.length);
  for (let i = 0; i < take; i++) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addHours(base: Date, hours: number): Date {
  const d = new Date(base);
  d.setHours(d.getHours() + hours);
  return d;
}

function setHm(d: Date, h: number, m: number): Date {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

/* ============================================================
 * 固定マスタデータ
 * ============================================================ */

const JAPANESE_FAMILY_NAMES = [
  "山田", "佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "中村", "小林", "加藤",
  "吉田", "山本", "斎藤", "松本", "井上", "木村", "林", "清水", "山口", "森",
  "池田", "橋本", "石川", "中島", "前田", "藤田", "後藤", "岡田", "長谷川", "村上",
];

const JAPANESE_GIVEN_NAMES = [
  "太郎", "花子", "次郎", "美咲", "健太", "さくら", "大輔", "彩", "翔太", "結衣",
  "拓也", "葵", "陽介", "美月", "啓介", "莉子", "海斗", "凛", "悠人", "陽菜",
  "颯太", "梨花", "大樹", "心春", "蓮", "穂乃果", "蒼", "杏", "湊", "美羽",
];

const NICKNAME_ADJ = [
  "happy", "blue", "fast", "calm", "smart", "lucky", "cool", "neon", "silent", "wild",
  "fresh", "bright", "tiny", "lazy", "brave", "kind", "swift", "loud", "sharp", "soft",
];

const NICKNAME_NOUN = [
  "fox", "owl", "tiger", "panda", "whale", "robot", "ninja", "samurai", "river", "moon",
  "cloud", "forest", "ocean", "comet", "rocket", "dragon", "phoenix", "wolf", "raven", "bear",
];

const GROUPS_SEED = [
  {
    subdomain: "findy",
    name: "Findy Engineer Community",
    subtitle: "エンジニアの「いいキャリア」をつくる",
    organization: "Findy Inc. (架空)",
    backgroundColor: "#0E7AE0",
    description:
      "エンジニア向けキャリアプラットフォームを運営する Findy が主催する技術コミュニティです。\n\n## 取り扱う領域\n\n- Web フロントエンド / バックエンド\n- DevOps / SRE\n- 生産性向上 / 開発者体験 (DevEx)\n",
  },
  {
    subdomain: "layerx",
    name: "LayerX 技術勉強会",
    subtitle: "すべての経済活動を、デジタル化する。",
    organization: "LayerX (架空)",
    backgroundColor: "#222222",
    description: "LayerX のエンジニアが社外向けに発表する技術勉強会のグループです。",
  },
  {
    subdomain: "dena",
    name: "DeNA Tech Talk",
    subtitle: "DeNA のエンジニアが語る技術と組織",
    organization: "DeNA (架空)",
    backgroundColor: "#005BAC",
    description: "DeNA のエンジニアによる技術発表のシリーズイベントを開催しています。",
  },
  {
    subdomain: "cyberagent",
    name: "CyberAgent Developers Group",
    subtitle: "AI / Web / Mobile の最前線を共有する",
    organization: "CyberAgent (架空)",
    backgroundColor: "#00A0E9",
    description: "サイバーエージェントが運営する開発者向けコミュニティです。",
  },
  {
    subdomain: "cookpad",
    name: "Cookpad Engineering Meetup",
    subtitle: "料理を通じてエンジニアリングを語る",
    organization: "Cookpad (架空)",
    backgroundColor: "#FF6347",
    description: "Cookpad のエンジニアによる Ruby/Rails / インフラ / 機械学習の発表会です。",
  },
  {
    subdomain: "mercari",
    name: "Mercari Engineering",
    subtitle: "メルカリのエンジニアと技術を語る",
    organization: "Mercari (架空)",
    backgroundColor: "#FF0211",
    description: "メルカリ社内外のエンジニアが集う技術コミュニティです。",
  },
  {
    subdomain: "pixiv",
    name: "pixiv inside Tech",
    subtitle: "クリエイティブを支える技術の話",
    organization: "pixiv (架空)",
    backgroundColor: "#0096FA",
    description: "pixiv のエンジニアがクリエイター向けサービス開発の知見を共有します。",
  },
  {
    subdomain: "linecorp",
    name: "LINE Developer Community",
    subtitle: "メッセージングインフラの裏側",
    organization: "LINE (架空)",
    backgroundColor: "#06C755",
    description: "LINE のエンジニアによる大規模システム / フロントエンド / モバイル開発の発表会です。",
  },
] as const;

const TAGS_SEED = [
  "AI", "React", "Next.js", "Python", "Go", "Rust", "DevOps", "Kubernetes",
  "DDD", "クリーンアーキテクチャ", "新人歓迎", "LT", "ハンズオン", "勉強会",
  "もくもく会", "ハッカソン", "セキュリティ", "データ分析", "機械学習", "PdM",
] as const;

const VENUES_OFFLINE = [
  { place: "渋谷スクランブルスクエア 39F", address: "東京都渋谷区渋谷2-24-12", lat: 35.6585, lon: 139.7020 },
  { place: "東京ミッドタウン カンファレンスホール", address: "東京都港区赤坂9-7-1", lat: 35.6655, lon: 139.7311 },
  { place: "六本木ヒルズ森タワー 49F", address: "東京都港区六本木6-10-1", lat: 35.6604, lon: 139.7292 },
  { place: "グランフロント大阪 北館 タワーC", address: "大阪府大阪市北区大深町3-1", lat: 34.7045, lon: 135.4969 },
  { place: "梅田スカイビル", address: "大阪府大阪市北区大淀中1-1-30", lat: 34.7053, lon: 135.4904 },
  { place: "福岡天神ビジネスセンター", address: "福岡県福岡市中央区天神1-9-17", lat: 33.5901, lon: 130.4017 },
  { place: "FFG ホール", address: "福岡県福岡市中央区天神2-13-1", lat: 33.5912, lon: 130.4007 },
] as const;

const EVENT_TITLE_TEMPLATES = [
  "{topic} 入門ハンズオン #{n}",
  "実践 {topic} 勉強会 vol.{n}",
  "{topic} もくもく会 #{n}",
  "Tech Talk: {topic} の現在地",
  "{topic} LT Night #{n}",
  "深掘り {topic} カンファレンス {n}",
  "{topic} と DDD で考える設計談義 #{n}",
  "新卒向け {topic} 入門セミナー #{n}",
];

const TOPIC_FOR_TITLE = [
  "Next.js", "React", "TypeScript", "Go", "Rust", "Python", "AI", "LLM",
  "Kubernetes", "Terraform", "Datadog", "DDD", "クリーンアーキテクチャ",
  "セキュリティ", "決済システム", "リアルタイム配信", "PdM", "機械学習",
];

const CATCH_PHRASES = [
  "現場で実際に動いているコードと運用の話をします。",
  "登壇者全員が現役エンジニア。ぜひ気軽にご参加ください。",
  "初心者大歓迎、懇親会で個別質問もOKです。",
  "本気で技術と向き合いたい人のための半日。",
  "事例ベースの発表 5 本立てでお届けします。",
  "ハンズオン形式なのでノート PC をお持ちください。",
];

const PRESENTATION_HOSTS = [
  { host: "speakerdeck.com", path: "/example-user/example-talk" },
  { host: "speakerdeck.com", path: "/findy-jp/intro-to-architecture" },
  { host: "docswell.com", path: "/s/example/abc-real-world-react" },
  { host: "www.youtube.com", path: "/watch?v=dQw4w9WgXcQ" },
  { host: "www.docswell.com", path: "/s/layerx-jp/intro-to-go" },
] as const;

const COMMENT_SAMPLES = [
  "とても楽しみにしています!",
  "懇親会から参加することは可能ですか?",
  "資料の事前共有はありますか?",
  "オンライン配信の予定はあるでしょうか?",
  "初心者ですが参加して大丈夫ですか?",
  "ハッシュタグはありますか?",
  "アーカイブの公開予定を教えてください。",
  "貴重な機会をありがとうございます。",
];

/* ============================================================
 * クリーンアップ
 * ============================================================ */

async function cleanup(): Promise<void> {
  // FK 関係を考慮して子から消す
  await prisma.componentFeedback.deleteMany();
  await prisma.surveyAnswer.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.eventRole.deleteMany();
  await prisma.eventTag.deleteMany();
  await prisma.presentationMaterial.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  // Calendar 系 (Event 削除前に消す: CalendarEvent は Event/Calendar の FK を持つ)
  await prisma.calendarSubscription.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupBlacklist.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.groupAdmin.deleteMany();
  await prisma.group.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.oAuthIdentity.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

/* ============================================================
 * 個別 seeder
 * ============================================================ */

async function seedUsers(): Promise<{ id: bigint; nickname: string; displayName: string }[]> {
  const used = new Set<string>();
  const created: { id: bigint; nickname: string; displayName: string }[] = [];

  // 最初のユーザーは E2E / dev-login が依存する固定 nickname を採用する。
  // ref: e2e/participate.spec.ts, e2e/event-detail.spec.ts, e2e/visual-compare.spec.ts
  const FIXED_FIRST_NICKNAME = "fast_moon_169";
  // 2 番目のユーザーは抽選イベント (event id 41) の主催者として固定。
  // E2E (e2e/lottery.spec.ts) で「主催者ログイン」に使う。
  const FIXED_SECOND_NICKNAME = "calm_owl_42";
  const FIXED_NICKNAMES = new Set([
    FIXED_FIRST_NICKNAME,
    FIXED_SECOND_NICKNAME,
  ]);

  for (let i = 0; i < 50; i++) {
    // ニックネームのユニーク化
    let nickname = "";
    if (i === 0) {
      nickname = FIXED_FIRST_NICKNAME;
      used.add(nickname);
    } else if (i === 1) {
      nickname = FIXED_SECOND_NICKNAME;
      used.add(nickname);
    } else {
      for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = `${pick(NICKNAME_ADJ)}_${pick(NICKNAME_NOUN)}_${randInt(1, 999)}`;
        if (!used.has(candidate) && !FIXED_NICKNAMES.has(candidate)) {
          nickname = candidate;
          used.add(nickname);
          break;
        }
      }
      if (!nickname) {
        nickname = `user_${i}_${randInt(1000, 9999)}`;
        used.add(nickname);
      }
    }

    const displayName = `${pick(JAPANESE_FAMILY_NAMES)} ${pick(JAPANESE_GIVEN_NAMES)}`;
    const email = `${nickname}@example.com`;

    const user = await prisma.user.create({
      data: {
        id: nextId("user"),
        nickname,
        displayName,
        email,
        emailVerifiedAt: new Date(),
        bio: i % 3 === 0 ? "Web エンジニアとして働いています。最近は AI 周りに興味あり。" : null,
        affiliation: i % 2 === 0 ? "Web ベンチャー" : null,
        location: pick(["東京", "大阪", "福岡", "リモート", "京都"]),
        avatarUrl: `https://api.dicebear.com/8.x/notionists/svg?seed=${nickname}`,
        status: "active",
        lastLoginAt: addDays(new Date(), -randInt(0, 30)),
      },
    });

    created.push({
      id: user.id,
      nickname: user.nickname,
      displayName: user.displayName,
    });
  }
  return created;
}

async function seedTags(): Promise<{ id: bigint; name: string }[]> {
  const created: { id: bigint; name: string }[] = [];
  for (const name of TAGS_SEED) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || `tag-${randInt(1000, 9999)}`;

    const tag = await prisma.tag.create({
      data: { id: nextId("tag"), name, slug, usageCount: 0 },
    });
    created.push({ id: tag.id, name: tag.name });
  }
  return created;
}

async function seedGroups(
  users: { id: bigint; displayName: string }[],
): Promise<{ id: bigint; subdomain: string; name: string; ownerId: bigint }[]> {
  const created: { id: bigint; subdomain: string; name: string; ownerId: bigint }[] = [];

  // 最初の 5 人をオーナーに、6 番目以降を共同管理者に使う
  // group 数は 8 なので、5 オーナーを使い回す
  for (let i = 0; i < GROUPS_SEED.length; i++) {
    const seed = GROUPS_SEED[i]!;
    const owner = users[i % 5]!;
    const admin = users[5 + (i % 5)]!;

    const group = await prisma.group.create({
      data: {
        id: nextId("group"),
        subdomain: seed.subdomain,
        name: seed.name,
        subtitle: seed.subtitle,
        organization: seed.organization,
        description: seed.description,
        backgroundColor: seed.backgroundColor,
        thumbnailUrl: `https://picsum.photos/seed/group-${seed.subdomain}/120/120`,
        coverImageUrl: `https://picsum.photos/seed/groupcover-${seed.subdomain}/1200/300`,
        websiteUrl: `https://${seed.subdomain}.example.com`,
        memberCount: 0,
        eventCount: 0,
        presentationCount: 0,
        status: "active",
        publishedAt: addDays(new Date(), -randInt(180, 720)),
      },
    });

    // owner
    await prisma.groupAdmin.create({
      data: {
        id: nextId("groupAdmin"),
        groupId: group.id,
        userId: owner.id,
        role: "owner",
      },
    });
    // admin
    await prisma.groupAdmin.create({
      data: {
        id: nextId("groupAdmin"),
        groupId: group.id,
        userId: admin.id,
        role: "admin",
        addedByUserId: owner.id,
      },
    });

    // member: owner + admin + 10〜50 名
    const memberCandidates = users.filter(
      (u) => u.id !== owner.id && u.id !== admin.id,
    );
    const memberPool = pickN(memberCandidates, randInt(10, 50));

    // owner / admin も member として記録
    await prisma.groupMember.create({
      data: {
        id: nextId("groupMember"),
        groupId: group.id,
        userId: owner.id,
        joinedVia: "manual",
      },
    });
    await prisma.groupMember.create({
      data: {
        id: nextId("groupMember"),
        groupId: group.id,
        userId: admin.id,
        joinedVia: "admin_add",
      },
    });
    for (const m of memberPool) {
      await prisma.groupMember.create({
        data: {
          id: nextId("groupMember"),
          groupId: group.id,
          userId: m.id,
          joinedVia: pick(["manual", "event_join", "manual"] as const),
        },
      });
    }

    await prisma.group.update({
      where: { id: group.id },
      data: { memberCount: memberPool.length + 2 },
    });

    created.push({
      id: group.id,
      subdomain: group.subdomain,
      name: group.name,
      ownerId: owner.id,
    });
  }
  return created;
}

type EventCategory =
  | "future"
  | "accepting"
  | "full"
  | "draft"
  | "closed"
  | "cancelled"
  | "lottery_future"
  | "lottery_past";

interface EventPlan {
  category: EventCategory;
  status: "draft" | "published" | "closed" | "cancelled";
  isFuture: boolean;
  startedAt: Date;
  endedAt: Date;
  acceptsFrom: Date;
  acceptsUntil: Date;
  capacity: number;
  fillRatio: number; // 0.0 〜 1.0+ (>1 で満員 + waiting)
  recruitmentMethod?: "fcfs" | "lottery";
  /**
   * lottery 方式のときの抽選発表日時。
   * - lottery_future: 未来日時 (UI 上は「抽選申込中」表示用)
   * - lottery_past: 過去日時 (cron バッチで自動抽選される候補)
   */
  lotteryAnnounceAt?: Date;
  /**
   * lottery_past 用: pending 状態の参加者を確実に作るためのフラグ。
   * cron による自動抽選 / 手動抽選を E2E で確認するために使う。
   */
  forcePendingApplicants?: number;
}

function planEvents(): EventPlan[] {
  const now = new Date();
  const plans: EventPlan[] = [];

  // 10 件: 未来開催 (受付前 or 受付中)
  for (let i = 0; i < 10; i++) {
    // event id 1 (i=0) / id 5 (i=4) は register-states.spec.ts が
    // pre-acceptance (acceptsFrom が未来 = 受付開始前) を前提にする E2E fixture。
    // acceptsFrom は start - 30 日なので、pre-acceptance には daysAhead > 30 が必須。
    // randInt(15,120) のままだと ~15% で daysAhead<=30 となり acceptsFrom が過去化して
    // テストが非決定的に落ちるため、当該 2 件は daysAhead を 90 に固定する
    // (cf. 満員固定の isE2EFullTarget = i === 1)。
    const isPreAcceptanceFixture = i === 0 || i === 4;
    const daysAhead = isPreAcceptanceFixture ? 90 : randInt(15, 120);
    const start = setHm(addDays(now, daysAhead), pick([13, 14, 19, 19, 20]), 0);
    plans.push({
      category: "future",
      status: "published",
      isFuture: true,
      startedAt: start,
      endedAt: addHours(start, randInt(2, 3)),
      acceptsFrom: addDays(start, -30),
      acceptsUntil: addHours(start, -1),
      capacity: pick([20, 30, 40, 50, 80, 100]),
      fillRatio: Math.random() * 0.5,
    });
  }

  // 10 件: 受付中 (直近 1〜14 日後)
  for (let i = 0; i < 10; i++) {
    const daysAhead = randInt(1, 14);
    const start = setHm(addDays(now, daysAhead), pick([13, 14, 19, 19, 20]), 0);
    plans.push({
      category: "accepting",
      status: "published",
      isFuture: true,
      startedAt: start,
      endedAt: addHours(start, randInt(2, 3)),
      acceptsFrom: addDays(now, -7),
      acceptsUntil: addHours(start, -1),
      capacity: pick([20, 30, 40, 50, 80]),
      fillRatio: 0.3 + Math.random() * 0.5,
    });
  }

  // 10 件: 満員 (未来開催だが定員に達している)
  for (let i = 0; i < 10; i++) {
    const daysAhead = randInt(3, 30);
    const start = setHm(addDays(now, daysAhead), pick([13, 14, 19, 19, 20]), 0);
    // i === 1 のイベント (= 全体の plan index 21 = event id 22) は
    // E2E (participate.spec.ts) が定員 15 / 満員を前提にしているため、
    // capacity を固定して必ず満員になるようにする。
    const isE2EFullTarget = i === 1;
    plans.push({
      category: "full",
      status: "published",
      isFuture: true,
      startedAt: start,
      endedAt: addHours(start, randInt(2, 3)),
      acceptsFrom: addDays(now, -14),
      acceptsUntil: addHours(start, -1),
      capacity: isE2EFullTarget ? 15 : pick([10, 15, 20, 25, 30]),
      fillRatio: isE2EFullTarget ? 2.0 : 1.0 + Math.random() * 0.5, // 満員 + waiting
    });
  }

  // 5 件: draft
  for (let i = 0; i < 5; i++) {
    const daysAhead = randInt(30, 90);
    const start = setHm(addDays(now, daysAhead), pick([19, 20]), 0);
    plans.push({
      category: "draft",
      status: "draft",
      isFuture: true,
      startedAt: start,
      endedAt: addHours(start, 2),
      acceptsFrom: addDays(start, -30),
      acceptsUntil: addHours(start, -1),
      capacity: pick([30, 50, 80]),
      fillRatio: 0,
    });
  }

  // 5 件: closed (3 件 closed + 2 件 cancelled)
  for (let i = 0; i < 5; i++) {
    const daysAgo = randInt(15, 180);
    const start = setHm(addDays(now, -daysAgo), pick([13, 19, 20]), 0);
    const isCancelled = i >= 3;
    plans.push({
      category: isCancelled ? "cancelled" : "closed",
      status: isCancelled ? "cancelled" : "closed",
      isFuture: false,
      startedAt: start,
      endedAt: addHours(start, randInt(2, 3)),
      acceptsFrom: addDays(start, -30),
      acceptsUntil: addHours(start, -1),
      capacity: pick([20, 30, 50]),
      fillRatio: isCancelled ? 0.3 : 0.6 + Math.random() * 0.3,
    });
  }

  // 5 件: lottery (抽選方式)
  //   - 3 件: lotteryAnnounceAt が未来 (UI 上は「抽選申込中」表示)
  //   - 2 件: lotteryAnnounceAt が過去 (cron バッチで処理される候補。
  //     pending 参加者がイベント作成時にあらかじめ投入される)
  //
  // 最初の lottery event は plans index = 40 → event id = 41 になり、
  // E2E (`e2e/lottery.spec.ts`) はこれをターゲットにする。
  // - 41: lotteryAnnounceAt = 未来。capacity = 5。pending=0 で開始 (E2E で申込)
  for (let i = 0; i < 3; i++) {
    const daysAhead = randInt(10, 60);
    const start = setHm(addDays(now, daysAhead + 14), pick([19, 20]), 0);
    // 抽選発表日はイベント開催の 1〜7 日前
    const announce = addDays(start, -randInt(1, 7));
    // i === 0 (event id 41) は E2E ターゲットなので固定値を使う
    const isE2ETarget = i === 0;
    plans.push({
      category: "lottery_future",
      status: "published",
      isFuture: true,
      startedAt: start,
      endedAt: addHours(start, 2),
      acceptsFrom: addDays(now, -7),
      acceptsUntil: announce,
      capacity: isE2ETarget ? 5 : pick([10, 20, 30]),
      fillRatio: 0, // 抽選方式は accepted/waiting を seed しない (pending のみ任意)
      recruitmentMethod: "lottery",
      lotteryAnnounceAt: announce,
      // E2E ターゲットは他の pending を 0 にしておき、テストでの申込時に
      // ちょうど capacity 内に収まり、抽選すると必ず accepted になるようにする。
      forcePendingApplicants: isE2ETarget ? 0 : randInt(3, 8),
    });
  }
  for (let i = 0; i < 2; i++) {
    const daysAhead = randInt(7, 30);
    const start = setHm(addDays(now, daysAhead), pick([19, 20]), 0);
    // 発表日時は過去 (例: 1 時間前) → cron が拾う対象
    const announce = addHours(now, -randInt(1, 24));
    plans.push({
      category: "lottery_past",
      status: "published",
      isFuture: true,
      startedAt: start,
      endedAt: addHours(start, 2),
      acceptsFrom: addDays(now, -14),
      acceptsUntil: addHours(start, -1),
      capacity: pick([5, 10]),
      fillRatio: 0,
      recruitmentMethod: "lottery",
      lotteryAnnounceAt: announce,
      forcePendingApplicants: randInt(5, 10),
    });
  }

  return plans;
}

async function seedEvents(
  groups: { id: bigint; subdomain: string; ownerId: bigint }[],
  users: { id: bigint; displayName: string }[],
  tags: { id: bigint; name: string }[],
): Promise<{
  totalEvents: number;
  totalParticipants: number;
  totalComments: number;
  totalEventTags: number;
  totalPresentations: number;
  totalRoles: number;
}> {
  const plans = planEvents();
  let totalParticipants = 0;
  let totalComments = 0;
  let totalEventTags = 0;
  let totalPresentations = 0;
  let totalRoles = 0;

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i]!;
    // 抽選方式の event は fast_moon_169 (users[0]) が owner ではないグループに
    // 寄せておくと、E2E で「主催者ログイン」と「一般参加申込」両方が試せる。
    // groups[1..4] は owner が users[1..4] のためどれを選んでも OK。
    // 各 lottery plan を groups[1..4] にローテーション割り当てする。
    let group;
    if (plan.recruitmentMethod === "lottery") {
      // plans[40..44] が lottery。groups[1..4] にローテーション
      const lotteryIdx = i - 40;
      group = groups[1 + (lotteryIdx % 4)]!;
    } else {
      group = groups[i % groups.length]!;
    }
    const owner = users.find((u) => u.id === group.ownerId)!;

    const titleTpl = pick(EVENT_TITLE_TEMPLATES);
    const title = titleTpl
      .replace("{topic}", pick(TOPIC_FOR_TITLE))
      .replace("{n}", String(randInt(1, 30)));

    // 開催形式と場所
    const format = pick(["offline", "offline", "online", "hybrid"] as const);
    let place: string | null = null;
    let address: string | null = null;
    let lat: number | null = null;
    let lon: number | null = null;
    let onlineUrl: string | null = null;
    if (format === "online") {
      onlineUrl = "https://meet.example.com/" + Math.random().toString(36).slice(2, 10);
      place = "オンライン (Zoom)";
    } else {
      const v = pick(VENUES_OFFLINE);
      place = v.place;
      address = v.address;
      lat = v.lat;
      lon = v.lon;
      if (format === "hybrid") {
        onlineUrl = "https://meet.example.com/" + Math.random().toString(36).slice(2, 10);
      }
    }

    const description = [
      `## ${title} について`,
      "",
      pick(CATCH_PHRASES),
      "",
      "## 当日のプログラム",
      "",
      "- 18:30 受付開始",
      "- 19:00 オープニング",
      "- 19:10 セッション1 (20 分)",
      "- 19:35 セッション2 (20 分)",
      "- 20:00 LT 大会 (5 分 x 3 本)",
      "- 20:30 懇親会",
      "",
      "## 対象者",
      "",
      "- 業務で関連技術に触れているエンジニア",
      "- これから学びたい学生・新卒の方",
      "",
      "ご参加お待ちしております!",
    ].join("\n");

    const publishedAt =
      plan.status === "draft"
        ? null
        : addDays(plan.startedAt, -randInt(7, 30));

    const eventId = nextId("event");
    const recruitmentMethod = plan.recruitmentMethod ?? "fcfs";
    const event = await prisma.event.create({
      data: {
        id: eventId,
        groupId: group.id,
        title,
        catchPhrase: pick(CATCH_PHRASES),
        description,
        coverImageUrl: `https://picsum.photos/seed/event-${eventId.toString()}/660/370`,
        hashTag: `tech_event_${randInt(1, 99)}`,
        eventType: "participation",
        eventFormat: format,
        startedAt: plan.startedAt,
        endedAt: plan.endedAt,
        acceptsFrom: plan.acceptsFrom,
        acceptsUntil: plan.acceptsUntil,
        place,
        address,
        lat,
        lon,
        onlineUrl,
        capacity: plan.capacity,
        acceptedCount: 0,
        waitingCount: 0,
        visibility: plan.status === "draft" ? "draft" : "public",
        status: plan.status,
        recruitmentMethod,
        lotteryAnnounceAt: plan.lotteryAnnounceAt ?? null,
        ownerId: owner.id,
        ownerDisplayName: owner.displayName,
        publishedAt,
      },
    });

    // EventRole: 1〜2 件
    // E2E 用に event id 22 (plans index 21) は roleCount を 1 に固定。
    // capacity 15 の単一ロールが満員になり、補欠登録ボタンを必ず発生させる。
    const isE2EFullTarget = i === 21;
    // 抽選方式の event は 1 ロールに固定 (テスト容易性)
    const isLottery = recruitmentMethod === "lottery";
    const roleCount = isE2EFullTarget || isLottery ? 1 : randInt(1, 2);
    const roles: { id: bigint; capacity: number }[] = [];
    if (roleCount === 1) {
      const r = await prisma.eventRole.create({
        data: {
          id: nextId("eventRole"),
          eventId: event.id,
          displayOrder: 1,
          name: "一般参加枠",
          capacity: plan.capacity,
          recruitmentMethod,
          pricingType: "free",
          price: 0,
        },
      });
      roles.push({ id: r.id, capacity: plan.capacity });
      totalRoles++;
    } else {
      const generalCap = Math.floor(plan.capacity * 0.7);
      const ltCap = plan.capacity - generalCap;
      const r1 = await prisma.eventRole.create({
        data: {
          id: nextId("eventRole"),
          eventId: event.id,
          displayOrder: 1,
          name: "一般参加枠",
          capacity: generalCap,
          recruitmentMethod: "fcfs",
          pricingType: "free",
          price: 0,
        },
      });
      const r2 = await prisma.eventRole.create({
        data: {
          id: nextId("eventRole"),
          eventId: event.id,
          displayOrder: 2,
          name: "LT 枠",
          description: "5 分の LT を発表していただきます。",
          capacity: ltCap,
          recruitmentMethod: "fcfs",
          pricingType: "free",
          price: 0,
        },
      });
      roles.push({ id: r1.id, capacity: generalCap });
      roles.push({ id: r2.id, capacity: ltCap });
      totalRoles += 2;
    }

    // EventTag: 2〜4 件
    const tagsForEvent = pickN(tags, randInt(2, 4));
    for (const t of tagsForEvent) {
      await prisma.eventTag.create({
        data: { eventId: event.id, tagId: t.id },
      });
      totalEventTags++;
      await prisma.tag.update({
        where: { id: t.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Participants: published / closed / cancelled に対して投入
    let acceptedCount = 0;
    let waitingCount = 0;

    if (isLottery) {
      // 抽選方式: pending 参加者だけを seed する。
      // fast_moon_169 (user index 0) は applicant に含めず、E2E で
      // 新規申込できるようにしておく。
      const pendingCount = plan.forcePendingApplicants ?? 0;
      if (pendingCount > 0) {
        const pool = users.filter((u, idx) => idx !== 0); // exclude fast_moon_169
        const applicants = pickN(pool, Math.min(pendingCount, pool.length));
        const role = roles[0]!;
        for (const applicant of applicants) {
          const appliedAt = addDays(
            plan.acceptsFrom,
            randInt(0, Math.max(1, Math.floor((plan.startedAt.getTime() - plan.acceptsFrom.getTime()) / (1000 * 60 * 60 * 24)))),
          );
          try {
            await prisma.participant.create({
              data: {
                id: nextId("participant"),
                eventId: event.id,
                eventRoleId: role.id,
                userId: applicant.id,
                status: "pending",
                appliedAt,
              },
            });
            totalParticipants++;
          } catch {
            // unique 衝突は無視
          }
        }
      }
    } else if (plan.status !== "draft") {
      const targetCount = Math.min(
        users.length - 1,
        Math.max(5, Math.floor(plan.capacity * plan.fillRatio)),
      );
      // 上限 30
      const applyCount = Math.min(30, Math.max(5, targetCount));

      // E2E 用満員イベント (event id 22 / isE2EFullTarget) では、
      // テスト主体 `fast_moon_169` (id=1) を必ず申込者から除外する。
      // これが含まれてしまうと participate.spec.ts の「未参加 → 補欠登録」
      // 前提が崩れ、テストが flake する。
      const eligibleUsers = isE2EFullTarget
        ? users.filter((u) => u.id !== BigInt(1))
        : users;
      const applicants = pickN(eligibleUsers, applyCount);
      // 各 applicant を role に割り当て (role 1 が 7 割、role 2 が 3 割)
      const acceptedSoFarPerRole: Record<string, number> = {};
      for (const r of roles) acceptedSoFarPerRole[r.id.toString()] = 0;

      for (let pi = 0; pi < applicants.length; pi++) {
        const applicant = applicants[pi]!;
        const role = roles.length === 1 ? roles[0]! : pi % 3 === 0 ? roles[1]! : roles[0]!;
        const roleKey = role.id.toString();
        const roleAccepted = acceptedSoFarPerRole[roleKey] ?? 0;

        let status: "accepted" | "waiting" | "cancelled";
        let waitingPosition: number | null = null;

        const roll = Math.random();
        if (plan.status === "cancelled") {
          status = "cancelled";
        } else if (roleAccepted >= role.capacity) {
          // 定員到達後は waiting か cancelled
          if (isE2EFullTarget || roll < 0.85) {
            // E2E 用イベントは確実に waiting を生成する
            status = "waiting";
            waitingPosition = waitingCount + 1;
          } else {
            status = "cancelled";
          }
        } else {
          if (isE2EFullTarget || roll < 0.92) {
            // E2E 用イベントは枠埋まるまで必ず accepted
            status = "accepted";
          } else {
            status = "cancelled";
          }
        }

        const appliedAt = addDays(
          plan.acceptsFrom,
          randInt(0, Math.max(1, Math.floor((plan.startedAt.getTime() - plan.acceptsFrom.getTime()) / (1000 * 60 * 60 * 24)))),
        );

        const data: Parameters<typeof prisma.participant.create>[0]["data"] = {
          id: nextId("participant"),
          eventId: event.id,
          eventRoleId: role.id,
          userId: applicant.id,
          status,
          appliedAt,
        };

        if (status === "accepted") {
          data.acceptedAt = appliedAt;
          acceptedSoFarPerRole[roleKey] = roleAccepted + 1;
          acceptedCount++;
        } else if (status === "waiting") {
          data.waitingPosition = waitingPosition;
          waitingCount++;
        } else if (status === "cancelled") {
          data.cancelledAt = addDays(appliedAt, randInt(1, 5));
        }

        // closed なイベントは attended に変換
        if (plan.status === "closed" && status === "accepted" && Math.random() < 0.7) {
          data.status = "attended";
          data.checkInAt = setHm(plan.startedAt, plan.startedAt.getHours(), 5);
          data.checkInMethod = pick(["code", "qr", "manual"] as const);
        }

        try {
          await prisma.participant.create({ data });
          totalParticipants++;
        } catch {
          // ユニーク制約衝突は無視
        }
      }
    }

    await prisma.event.update({
      where: { id: event.id },
      data: {
        acceptedCount,
        waitingCount,
      },
    });

    // Comments: 0〜5 件
    const commentCount = randInt(0, 5);
    for (let c = 0; c < commentCount; c++) {
      const commenter = pick(users);
      await prisma.comment.create({
        data: {
          id: nextId("comment"),
          eventId: event.id,
          userId: commenter.id,
          body: pick(COMMENT_SAMPLES),
          createdAt: addDays(publishedAt ?? plan.acceptsFrom, randInt(0, 5)),
        },
      });
      totalComments++;
    }

    // PresentationMaterial: closed イベントに 2〜4 件
    if (plan.status === "closed") {
      const presCount = randInt(2, 4);
      for (let p = 0; p < presCount; p++) {
        const tpl = pick(PRESENTATION_HOSTS);
        const presenter = pick(users);
        await prisma.presentationMaterial.create({
          data: {
            id: nextId("presentationMaterial"),
            eventId: event.id,
            presenterUserId: presenter.id,
            presenterDisplayName: presenter.displayName,
            title: `${pick(TOPIC_FOR_TITLE)} の話 - ${pick(["事例紹介", "入門", "設計の勘所", "失敗談"])}`,
            url: `https://${tpl.host}${tpl.path}-${randInt(1000, 9999)}`,
            thumbnailUrl: `https://picsum.photos/seed/pres-${event.id}-${p}/400/240`,
            displayOrder: p + 1,
            postedAt: addDays(plan.endedAt, randInt(1, 7)),
          },
        });
        totalPresentations++;
      }
    }
  }

  // group.eventCount は status=published のみカウント (Server Action と整合)。
  // 詳細は scripts/recalc-counters.ts と src/app/actions/event-admin-actions.ts。
  for (const g of groups) {
    const cnt = await prisma.event.count({
      where: { groupId: g.id, status: "published" },
    });
    const presCnt = await prisma.presentationMaterial.count({
      where: { event: { groupId: g.id } },
    });
    await prisma.group.update({
      where: { id: g.id },
      data: { eventCount: cnt, presentationCount: presCnt },
    });
  }

  return {
    totalEvents: plans.length,
    totalParticipants,
    totalComments,
    totalEventTags,
    totalPresentations,
    totalRoles,
  };
}

/* ============================================================
 * Calendar (Luma 風キュレーション)
 * ============================================================ */

const CALENDARS_SEED = [
  {
    slug: "ai-developers",
    name: "AI Developers Tokyo",
    description:
      "東京で開催される AI / 機械学習 / LLM 関連の勉強会を集めたカレンダーです。",
    tintColor: "#7c3aed",
  },
  {
    slug: "frontend-tokyo",
    name: "Frontend Tokyo",
    description:
      "React / Next.js / TypeScript など Web フロントエンドの勉強会を集めました。",
    tintColor: "#0ea5e9",
  },
  {
    slug: "devops-japan",
    name: "DevOps Japan",
    description:
      "Kubernetes / Terraform / SRE など DevOps 系イベントのキュレーション。",
    tintColor: "#10b981",
  },
  {
    slug: "python-community",
    name: "Python Community",
    description:
      "Python 関連の勉強会・もくもく会を集めたカレンダーです。",
    tintColor: "#facc15",
  },
  {
    slug: "tech-mentors",
    name: "Tech Mentors",
    description:
      "新人・若手エンジニア向けの入門イベントや LT 大会を集めたカレンダー。",
    tintColor: "#ef4444",
  },
] as const;

async function seedCalendars(
  users: { id: bigint; displayName: string }[],
  events: { id: bigint }[],
): Promise<{
  totalCalendars: number;
  totalCalendarEvents: number;
  totalCalendarSubscriptions: number;
}> {
  let totalCalendarEvents = 0;
  let totalCalendarSubscriptions = 0;

  for (let i = 0; i < CALENDARS_SEED.length; i++) {
    const seed = CALENDARS_SEED[i]!;
    // owner は users[0..4] を回す
    const owner = users[i % 5]!;

    const calendarId = nextId("calendar");
    await prisma.calendar.create({
      data: {
        id: calendarId,
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        coverImageUrl: `https://picsum.photos/seed/calendar-${seed.slug}/1200/300`,
        tintColor: seed.tintColor,
        ownerUserId: owner.id,
        subscriberCount: 0,
        eventCount: 0,
        status: "active",
      },
    });

    // 10〜20 件のイベントを紐付け
    const eventCount = randInt(10, 20);
    const picked = pickN(events, Math.min(eventCount, events.length));
    for (const ev of picked) {
      try {
        await prisma.calendarEvent.create({
          data: {
            calendarId,
            eventId: ev.id,
          },
        });
        totalCalendarEvents++;
      } catch {
        // unique 衝突は無視
      }
    }

    // 5〜50 名の subscriber
    const subCount = randInt(5, 50);
    const subscribers = pickN(users, Math.min(subCount, users.length));
    for (const sub of subscribers) {
      try {
        await prisma.calendarSubscription.create({
          data: {
            id: nextId("calendarSubscription"),
            calendarId,
            userId: sub.id,
          },
        });
        totalCalendarSubscriptions++;
      } catch {
        // unique 衝突は無視
      }
    }

    // count を更新
    const actualEventCount = await prisma.calendarEvent.count({
      where: { calendarId },
    });
    const actualSubscriberCount = await prisma.calendarSubscription.count({
      where: { calendarId },
    });
    await prisma.calendar.update({
      where: { id: calendarId },
      data: {
        eventCount: actualEventCount,
        subscriberCount: actualSubscriberCount,
      },
    });
  }

  return {
    totalCalendars: CALENDARS_SEED.length,
    totalCalendarEvents,
    totalCalendarSubscriptions,
  };
}

/* ============================================================
 * main
 * ============================================================ */

/**
 * コンポーネントフィードバックのサンプル。
 * /admin/component-feedback と Storybook Gallery のデモ用に少量投入する。
 */
async function seedComponentFeedback(): Promise<number> {
  const samples: Array<{
    component: string;
    rating: number;
    comment: string | null;
    status: string;
  }> = [
    { component: "Button", rating: 5, comment: "variant が揃っていて使いやすい。", status: "open" },
    { component: "Button", rating: 4, comment: "loading 状態のスピナー位置がもう少し中央だと嬉しい。", status: "triaged" },
    { component: "EventCard", rating: 3, comment: "情報密度が高め。モバイルで余白がほしい。", status: "open" },
    { component: "EventListRow", rating: 4, comment: null, status: "open" },
    { component: "Input", rating: 2, comment: "エラー時のコントラストが弱い気がする。", status: "open" },
    { component: "MiniCalendar", rating: 5, comment: "見やすい！", status: "resolved" },
  ];
  let n = 0;
  for (const s of samples) {
    await prisma.componentFeedback.create({
      data: {
        id: nextId("componentFeedback"),
        component: s.component,
        rating: s.rating,
        comment: s.comment,
        sourceUrl: "http://localhost:6006/?path=/docs/design-system-gallery--docs",
        status: s.status,
        userId: null,
      },
    });
    n += 1;
  }
  return n;
}

async function main(): Promise<void> {
  console.log("[seed] cleanup ...");
  await cleanup();

  console.log("[seed] users ...");
  const users = await seedUsers();
  console.log(`[seed]   -> ${users.length} users`);

  console.log("[seed] tags ...");
  const tags = await seedTags();
  console.log(`[seed]   -> ${tags.length} tags`);

  console.log("[seed] groups (+ admins/members) ...");
  const groups = await seedGroups(users);
  console.log(`[seed]   -> ${groups.length} groups`);

  console.log("[seed] events (+ roles/participants/comments/presentations) ...");
  const eventResult = await seedEvents(groups, users, tags);
  console.log(`[seed]   -> ${eventResult.totalEvents} events`);
  console.log(`[seed]   -> ${eventResult.totalRoles} event_roles`);
  console.log(`[seed]   -> ${eventResult.totalEventTags} event_tags`);
  console.log(`[seed]   -> ${eventResult.totalParticipants} participants`);
  console.log(`[seed]   -> ${eventResult.totalComments} comments`);
  console.log(`[seed]   -> ${eventResult.totalPresentations} presentations`);

  console.log("[seed] calendars (+ subscriptions/events) ...");
  // 既存 Event を引いて Calendar に紐付ける
  const allEventRows = await prisma.event.findMany({ select: { id: true } });
  const calendarResult = await seedCalendars(users, allEventRows);
  console.log(`[seed]   -> ${calendarResult.totalCalendars} calendars`);
  console.log(`[seed]   -> ${calendarResult.totalCalendarEvents} calendar_events`);
  console.log(
    `[seed]   -> ${calendarResult.totalCalendarSubscriptions} calendar_subscriptions`,
  );

  console.log("[seed] component feedback (DS 改善ループ サンプル) ...");
  const feedbackCount = await seedComponentFeedback();
  console.log(`[seed]   -> ${feedbackCount} component_feedback`);

  // 件数サマリ
  const summary = {
    users: await prisma.user.count(),
    groups: await prisma.group.count(),
    groupAdmins: await prisma.groupAdmin.count(),
    groupMembers: await prisma.groupMember.count(),
    events: await prisma.event.count(),
    eventsPublished: await prisma.event.count({ where: { status: "published" } }),
    eventsDraft: await prisma.event.count({ where: { status: "draft" } }),
    eventsClosed: await prisma.event.count({ where: { status: "closed" } }),
    eventsCancelled: await prisma.event.count({ where: { status: "cancelled" } }),
    eventsLottery: await prisma.event.count({ where: { recruitmentMethod: "lottery" } }),
    eventRoles: await prisma.eventRole.count(),
    eventRolesLottery: await prisma.eventRole.count({ where: { recruitmentMethod: "lottery" } }),
    participants: await prisma.participant.count(),
    participantsAccepted: await prisma.participant.count({ where: { status: "accepted" } }),
    participantsWaiting: await prisma.participant.count({ where: { status: "waiting" } }),
    participantsPending: await prisma.participant.count({ where: { status: "pending" } }),
    participantsCancelled: await prisma.participant.count({ where: { status: "cancelled" } }),
    participantsAttended: await prisma.participant.count({ where: { status: "attended" } }),
    tags: await prisma.tag.count(),
    eventTags: await prisma.eventTag.count(),
    comments: await prisma.comment.count(),
    presentations: await prisma.presentationMaterial.count(),
    calendars: await prisma.calendar.count(),
    calendarEvents: await prisma.calendarEvent.count(),
    calendarSubscriptions: await prisma.calendarSubscription.count(),
  };

  console.log("");
  console.log("===== Seed Summary =====");
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(25)} : ${v}`);
  }
  console.log("========================");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("[seed] done");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
