/**
 * コンポーネントショーケース (`/components`)
 *
 * - 再利用 UI コンポーネントの全 variant / state を一覧表示する
 * - Storybook 代替の "目視+E2E スナップショット" 用ページ
 * - Header / Footer はグローバルなので除外 (ショーケース内では再描画しない)
 * - 本番でも開けるが、SEO 上は無価値なので `robots: noindex` を付与
 *
 * 各セクションは `data-testid="component-{name}-{variant}-{state}"` で個別に
 * 取得できるようにしている (`e2e/components.spec.ts` から参照)。
 *
 * TagPill (selectable / removable)、GroupCard (onJoinToggle) など onClick を
 * 伴うインタラクティブデモを含むため、ページ全体を Client Component として
 * 実装している。metadata は同階層の `layout.tsx` で静的に定義する。
 */

"use client";

import EventStatusBadge, {
  type EventStatus,
} from "@/components/EventStatusBadge";
import EventCard, { type EventCardData } from "@/components/EventCard";
import EventCardCompact from "@/components/EventCardCompact";
import EventListRow from "@/components/EventListRow";
import EventTimeline from "@/components/EventTimeline";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import TagPill from "@/components/TagPill";
import SearchBox from "@/components/SearchBox";
import GroupCard, { type GroupCardData } from "@/components/GroupCard";
import ParticipantBadge from "@/components/ParticipantBadge";
import MiniCalendar from "@/components/MiniCalendar";
import HostAvatarStack, {
  type HostAvatarHost,
} from "@/components/HostAvatarStack";

/* ============================================================
 * デモデータ
 * ============================================================ */

// UI に登場する 8 status のみ (draft/published は DB エイリアス、UI 上は使わない)
const STATUSES = [
  "upcoming",
  "open",
  "full",
  "waitlist",
  "closed",
  "cancelled",
  "ended",
  "ongoing",
] as const satisfies readonly EventStatus[];

const SIZES = ["sm", "md", "lg"] as const;
const STATUS_VARIANTS = ["subtle", "solid", "outline", "dot"] as const;

const baseEvent: EventCardData = {
  id: "demo-1",
  title: "Reactパフォーマンス勉強会 vol.12 - 大規模SPAの最適化",
  catchPhrase: "Concurrent Renderer / Suspense / memoization の実例を交えて",
  startedAt: "2026-07-15T19:30:00+09:00",
  endedAt: "2026-07-15T21:30:00+09:00",
  status: "open",
  thumbnailUrl: undefined,
  location: { type: "offline", prefecture: "東京都", address: "渋谷区" },
  accepted: 32,
  limit: 50,
  group: {
    id: "group-1",
    name: "Tokyo Frontend Engineers",
    iconUrl: undefined,
    url: "/group/tfe",
  },
  hashtags: ["React", "Performance", "Suspense"],
  href: "/event/demo-1",
};

const baseEventOnline: EventCardData = {
  ...baseEvent,
  id: "demo-2",
  title: "オンライン勉強会: Rust入門 - ownership と lifetime を完全理解",
  status: "full",
  location: { type: "online", platform: "Zoom" },
  accepted: 100,
  limit: 100,
  hashtags: ["Rust", "Backend"],
};

const baseEventNoLimit: EventCardData = {
  ...baseEvent,
  id: "demo-3",
  title: "もくもく会 (定員なし)",
  status: "upcoming",
  location: { type: "hybrid", prefecture: "大阪府" },
  accepted: 7,
  limit: null,
  hashtags: ["mokumoku"],
};

// サムネ画像有のサンプル (Picsum で安定したダミー画像を生成)
const baseEventWithThumb: EventCardData = {
  ...baseEvent,
  id: "demo-thumb-1",
  title: "サムネ画像ありイベント - フロントエンドカンファレンス 2026",
  thumbnailUrl: "https://picsum.photos/seed/tech-event-1/640/360",
};

const baseEventWithThumb2: EventCardData = {
  ...baseEvent,
  id: "demo-thumb-2",
  title: "サムネ画像ありイベント (compact) - Backend Night",
  status: "upcoming",
  thumbnailUrl: "https://picsum.photos/seed/tech-event-2/640/360",
  hashtags: ["Backend", "Go"],
};

// EventCard 全 status 用 (退色・cancelled/ended 等のレイアウト確認)
// UI に登場する 8 status のみを対象とする (draft/published は DB エイリアスで除外)
type UiEventStatus = (typeof STATUSES)[number];

function makeEventForStatus(status: UiEventStatus): EventCardData {
  const titles: Record<UiEventStatus, string> = {
    upcoming: "[upcoming] 開催前イベント - 抽選受付開始 7/1",
    open: "[open] 募集中イベント - 残席わずか",
    full: "[full] 満員御礼 - キャンセル待ちはこちら",
    waitlist: "[waitlist] 補欠登録受付中 - 繰り上げ可能性あり",
    closed: "[closed] 募集締切 - フォローして次回情報を待つ",
    cancelled: "[cancelled] 中止になったイベント (返金処理済)",
    ended: "[ended] 終了済イベント - 資料リンクあり",
    ongoing: "[ongoing] 開催中ライブ配信中",
  };
  return {
    ...baseEvent,
    id: `demo-status-${status}`,
    title: titles[status],
    status,
  };
}

const baseGroup: GroupCardData = {
  id: "g-1",
  name: "Tokyo Frontend Engineers",
  subdomain: "tfe",
  memberCount: 12345,
  eventCount: 78,
  description:
    "東京のフロントエンドエンジニアによる勉強会コミュニティ。React/Vue/Svelte などフレームワーク横断のトピックを扱います。",
  subtitle: "フロントエンドエンジニアのための継続コミュニティ",
  logoUrl: null,
  thumbnailUrl: null,
  coverImageUrl: null,
};

const eventDates = new Set<string>();
// 今月の数日を「開催あり」とする (基準月のため動的)
(function seedEventDates() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const days = [3, 7, 12, 18, 25];
  for (const d of days) {
    const dt = new Date(y, m, d);
    const ymd = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    eventDates.add(ymd);
  }
})();

const hostSample: HostAvatarHost[] = [
  {
    name: "山田 太郎",
    avatarUrl: "https://i.pravatar.cc/96?img=12",
    profileUrl: "/user/taro",
    role: "主催",
  },
  {
    name: "佐藤 花子",
    avatarUrl: "https://i.pravatar.cc/96?img=22",
    profileUrl: "/user/hanako",
    role: "共催",
  },
  {
    name: "Suzuki Jiro",
    avatarUrl: "https://i.pravatar.cc/96?img=33",
    profileUrl: "/user/jiro",
    role: "共催",
  },
];

const hostManySample: HostAvatarHost[] = [
  ...hostSample,
  { name: "Alice", avatarUrl: "https://i.pravatar.cc/96?img=41" },
  { name: "Bob", avatarUrl: "https://i.pravatar.cc/96?img=52" },
  { name: "Carol", avatarUrl: "https://i.pravatar.cc/96?img=63" },
  { name: "Dave", avatarUrl: "https://i.pravatar.cc/96?img=14" },
];

/* ============================================================
 * 共通レイアウト
 * ============================================================ */

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-testid={`section-${id}`}
      className="mb-12 rounded-lg border border-border bg-surface p-6 shadow-sm"
    >
      <header className="mb-4 border-b border-border pb-3">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function SubGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

function Cell({
  testid,
  label,
  children,
}: {
  testid: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col gap-1 rounded-md border border-dashed border-border bg-background p-3"
    >
      {label && (
        <span className="text-[10px] font-mono text-muted-foreground">
          {label}
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}

/* ============================================================
 * Page
 * ============================================================ */

export default function ComponentsShowcasePage() {
  return (
    <main
      data-testid="components-showcase"
      className="mx-auto w-full max-w-6xl px-4 py-8"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          コンポーネントショーケース
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          再利用 UI コンポーネントの全 variant / state を一覧表示します。
          視覚回帰テストと a11y チェック (axe) のターゲットとして利用します。
        </p>
      </header>

      {/* ========== EventStatusBadge ========== */}
      <Section
        id="event-status-badge"
        title="EventStatusBadge"
        description="8 status × 3 size × 4 variant の網羅表示"
      >
        {STATUS_VARIANTS.map((variant) => (
          <SubGroup key={variant} label={`variant=${variant}`}>
            {SIZES.map((size) =>
              STATUSES.map((status) => (
                <Cell
                  key={`${variant}-${size}-${status}`}
                  testid={`component-EventStatusBadge-${variant}-${size}-${status}`}
                  label={`${status} / ${size}`}
                >
                  <EventStatusBadge
                    status={status}
                    size={size}
                    variant={variant}
                  />
                </Cell>
              )),
            )}
          </SubGroup>
        ))}
      </Section>

      {/* ========== EventListRow ========== */}
      <Section
        id="event-list-row"
        title="EventListRow"
        description="showRank の有無 / compact の有無 / サムネ有無の組み合わせ"
      >
        <SubGroup label="default">
          <div
            data-testid="component-EventListRow-default-default"
            className="w-full divide-y divide-border rounded-md border border-border bg-surface"
          >
            <EventListRow event={baseEvent} />
            <EventListRow event={baseEventOnline} />
            <EventListRow event={baseEventNoLimit} />
          </div>
        </SubGroup>

        <SubGroup label="withThumbnail">
          <div
            data-testid="component-EventListRow-default-withThumbnail"
            className="w-full divide-y divide-border rounded-md border border-border bg-surface"
          >
            <EventListRow event={baseEventWithThumb} />
            <EventListRow event={baseEventWithThumb2} compact />
          </div>
        </SubGroup>

        <SubGroup label="compact">
          <div
            data-testid="component-EventListRow-compact-default"
            className="w-full divide-y divide-border rounded-md border border-border bg-surface"
          >
            <EventListRow event={baseEvent} compact />
            <EventListRow event={baseEventOnline} compact />
          </div>
        </SubGroup>

        <SubGroup label="showRank">
          <div
            data-testid="component-EventListRow-default-ranked"
            className="w-full divide-y divide-border rounded-md border border-border bg-surface"
          >
            <EventListRow event={baseEvent} showRank={1} />
            <EventListRow event={baseEventOnline} showRank={2} />
            <EventListRow event={baseEventNoLimit} showRank={3} />
            <EventListRow event={baseEvent} showRank={4} />
          </div>
        </SubGroup>
      </Section>

      {/* ========== EventTimeline ========== */}
      <Section
        id="event-timeline"
        title="EventTimeline"
        description="月単位グループ化のタイムラインリスト (Luma 風)"
      >
        <SubGroup label="default (月跨ぎ)">
          <div
            data-testid="component-EventTimeline-default-withGap"
            className="w-full max-w-3xl"
          >
            <EventTimeline
              heading="開催予定"
              events={[
                {
                  ...baseEvent,
                  id: "tl-1",
                  startedAt: "2026-07-04T19:00:00+09:00",
                },
                {
                  ...baseEventOnline,
                  id: "tl-2",
                  startedAt: "2026-07-25T19:30:00+09:00",
                },
                {
                  ...baseEvent,
                  id: "tl-3",
                  startedAt: "2026-09-12T13:00:00+09:00",
                  status: "upcoming",
                },
              ]}
              stickyTopPx={0}
            />
          </div>
        </SubGroup>
        <SubGroup label="empty">
          <div
            data-testid="component-EventTimeline-default-empty"
            className="w-full max-w-3xl"
          >
            <EventTimeline
              heading="主催"
              events={[]}
              emptyMessage="主催したイベントはまだありません"
            />
          </div>
        </SubGroup>
        <SubGroup label="groupByMonth=false (フラット)">
          <div
            data-testid="component-EventTimeline-default-flat"
            className="w-full max-w-3xl"
          >
            <EventTimeline
              heading="新着"
              groupByMonth={false}
              events={[
                {
                  ...baseEvent,
                  id: "tl-flat-1",
                  startedAt: "2026-06-15T19:00:00+09:00",
                },
                {
                  ...baseEventOnline,
                  id: "tl-flat-2",
                  startedAt: "2026-06-20T19:00:00+09:00",
                },
              ]}
            />
          </div>
        </SubGroup>
      </Section>

      {/* ========== EventCard ========== */}
      <Section
        id="event-card"
        title="EventCard"
        description="list / grid の 2 variant × 8 status の全網羅"
      >
        <SubGroup label="variant=list (全 8 status)">
          {STATUSES.map((status) => (
            <Cell
              key={`list-${status}`}
              testid={`component-EventCard-list-${status}`}
              label={`status=${status}`}
            >
              <div className="w-full max-w-3xl">
                <EventCard event={makeEventForStatus(status)} variant="list" />
              </div>
            </Cell>
          ))}
        </SubGroup>

        <SubGroup label="variant=grid (全 8 status)">
          {STATUSES.map((status) => (
            <Cell
              key={`grid-${status}`}
              testid={`component-EventCard-grid-${status}`}
              label={`status=${status}`}
            >
              <div className="w-72">
                <EventCard event={makeEventForStatus(status)} variant="grid" />
              </div>
            </Cell>
          ))}
        </SubGroup>

        <SubGroup label="補助 (location.type / no-hashtags / no-catchPhrase)">
          <Cell
            testid="component-EventCard-list-online"
            label="online"
          >
            <div className="w-full max-w-3xl">
              <EventCard event={baseEventOnline} variant="list" />
            </div>
          </Cell>
          <Cell
            testid="component-EventCard-list-hybrid"
            label="hybrid / no-limit"
          >
            <div className="w-full max-w-3xl">
              <EventCard event={baseEventNoLimit} variant="list" />
            </div>
          </Cell>
          <Cell
            testid="component-EventCard-list-noHashtags"
            label="no hashtags / no catchPhrase"
          >
            <div className="w-full max-w-3xl">
              <EventCard
                event={{
                  ...baseEvent,
                  id: "demo-simple",
                  title: "シンプルカード (ハッシュタグ・キャッチコピー無し)",
                  catchPhrase: undefined,
                  hashtags: undefined,
                }}
                variant="list"
              />
            </div>
          </Cell>
        </SubGroup>
      </Section>

      {/* ========== EventCardCompact ========== */}
      <Section
        id="event-card-compact"
        title="EventCardCompact"
        description="grid variant の薄ラッパー (全 8 status 網羅)"
      >
        <SubGroup label="全 8 status">
          {STATUSES.map((status) => (
            <Cell
              key={`compact-${status}`}
              testid={`component-EventCardCompact-default-${status}`}
              label={`status=${status}`}
            >
              <div className="w-72">
                <EventCardCompact event={makeEventForStatus(status)} />
              </div>
            </Cell>
          ))}
        </SubGroup>

        <SubGroup label="補助 (online / hybrid)">
          <Cell testid="component-EventCardCompact-default-onlineLocation" label="online">
            <div className="w-72">
              <EventCardCompact event={baseEventOnline} />
            </div>
          </Cell>
          <Cell testid="component-EventCardCompact-default-hybridLocation" label="hybrid / no-limit">
            <div className="w-72">
              <EventCardCompact event={baseEventNoLimit} />
            </div>
          </Cell>
        </SubGroup>
      </Section>

      {/* ========== Pagination ========== */}
      <Section
        id="pagination"
        title="Pagination"
        description="ページ数違いの 4 ケース"
      >
        <Cell
          testid="component-Pagination-default-first"
          label="current=1 / total=10"
        >
          <Pagination
            currentPage={1}
            totalPages={10}
            baseUrl="/components"
          />
        </Cell>
        <Cell
          testid="component-Pagination-default-middle"
          label="current=5 / total=10"
        >
          <Pagination
            currentPage={5}
            totalPages={10}
            baseUrl="/components"
          />
        </Cell>
        <Cell
          testid="component-Pagination-default-last"
          label="current=10 / total=10"
        >
          <Pagination
            currentPage={10}
            totalPages={10}
            baseUrl="/components"
          />
        </Cell>
        <Cell
          testid="component-Pagination-default-small"
          label="current=1 / total=3"
        >
          <Pagination currentPage={1} totalPages={3} baseUrl="/components" />
        </Cell>
        <Cell
          testid="component-Pagination-siblingCount0"
          label="siblingCount=0 (周辺非表示)"
        >
          <Pagination
            currentPage={5}
            totalPages={20}
            siblingCount={0}
            baseUrl="/components"
          />
        </Cell>
        <Cell
          testid="component-Pagination-siblingCount2"
          label="siblingCount=2 (周辺多め)"
        >
          <Pagination
            currentPage={10}
            totalPages={20}
            siblingCount={2}
            baseUrl="/components"
          />
        </Cell>
        <Cell
          testid="component-Pagination-boundaryCount2"
          label="boundaryCount=2 (端点多め)"
        >
          <Pagination
            currentPage={10}
            totalPages={20}
            boundaryCount={2}
            baseUrl="/components"
          />
        </Cell>
      </Section>

      {/* ========== Breadcrumb ========== */}
      <Section
        id="breadcrumb"
        title="Breadcrumb"
        description="短い/長い、JSON-LD 有/無"
      >
        <Cell
          testid="component-Breadcrumb-default-short"
          label="2項目 / JSON-LD有"
        >
          <Breadcrumb
            items={[
              { label: "ホーム", href: "/" },
              { label: "現在のページ" },
            ]}
          />
        </Cell>
        <Cell
          testid="component-Breadcrumb-default-long"
          label="5項目 / JSON-LD有"
        >
          <Breadcrumb
            items={[
              { label: "ホーム", href: "/" },
              { label: "イベントを探す", href: "/explore" },
              { label: "東京", href: "/explore?prefecture=tokyo" },
              { label: "フロントエンド", href: "/explore?tag=frontend" },
              { label: "Reactパフォーマンス勉強会" },
            ]}
          />
        </Cell>
        <Cell
          testid="component-Breadcrumb-default-noJsonLd"
          label="JSON-LD 無し"
        >
          <Breadcrumb
            enableJsonLd={false}
            items={[
              { label: "ホーム", href: "/" },
              { label: "JSON-LD なし" },
            ]}
          />
        </Cell>
      </Section>

      {/* ========== TagPill ========== */}
      <Section
        id="tag-pill"
        title="TagPill"
        description="4 variant × 3 size、removable 有/無"
      >
        {(["default", "filter", "outline", "selectable"] as const).map(
          (variant) => (
            <SubGroup key={variant} label={`variant=${variant}`}>
              {SIZES.map((size) => (
                <Cell
                  key={`${variant}-${size}`}
                  testid={`component-TagPill-${variant}-${size}`}
                  label={`size=${size}`}
                >
                  <TagPill label="React" variant={variant} size={size} />
                </Cell>
              ))}
              <Cell
                testid={`component-TagPill-${variant}-withCount`}
                label="count=123"
              >
                <TagPill label="Python" variant={variant} count={123} />
              </Cell>
              <Cell
                testid={`component-TagPill-${variant}-disabled`}
                label="disabled"
              >
                <TagPill label="無効" variant={variant} disabled />
              </Cell>
              {variant === "filter" && (
                <Cell
                  testid="component-TagPill-filter-removable"
                  label="removable"
                >
                  <TagPill label="削除可" variant="filter" removable />
                </Cell>
              )}
              {variant === "selectable" && (
                <Cell
                  testid="component-TagPill-selectable-selected"
                  label="selected"
                >
                  <TagPill label="選択中" variant="selectable" selected />
                </Cell>
              )}
            </SubGroup>
          ),
        )}

        <SubGroup label="href version (リンク描画)">
          <Cell
            testid="component-TagPill-default-asLink"
            label="default + href"
          >
            <TagPill label="React" href="/tag/react" />
          </Cell>
          <Cell
            testid="component-TagPill-outline-asLink"
            label="outline + href"
          >
            <TagPill label="Vue" href="/tag/vue" variant="outline" />
          </Cell>
          <Cell
            testid="component-TagPill-default-asLinkWithCount"
            label="href + count"
          >
            <TagPill label="TypeScript" href="/tag/typescript" count={4321} />
          </Cell>
          <Cell
            testid="component-TagPill-default-asLinkLarge"
            label="href + lg"
          >
            <TagPill label="Next.js" href="/tag/nextjs" size="lg" />
          </Cell>
        </SubGroup>
      </Section>

      {/* ========== SearchBox ========== */}
      <Section
        id="search-box"
        title="SearchBox"
        description="header / hero variant"
      >
        <Cell testid="component-SearchBox-header-default" label="header">
          <div className="w-full max-w-md">
            <SearchBox variant="header" />
          </div>
        </Cell>
        <Cell testid="component-SearchBox-hero-default" label="hero">
          <div className="w-full max-w-2xl">
            <SearchBox variant="hero" placeholder="勉強会・カンファレンスを検索" />
          </div>
        </Cell>
        <Cell
          testid="component-SearchBox-header-prefilled"
          label="header / 初期値あり"
        >
          <div className="w-full max-w-md">
            <SearchBox variant="header" defaultValue="React" />
          </div>
        </Cell>
      </Section>

      {/* ========== GroupCard ========== */}
      <Section
        id="group-card"
        title="GroupCard"
        description="standard / sidebar(compact) variant"
      >
        <SubGroup label="variant=standard">
          <Cell
            testid="component-GroupCard-standard-default"
            label="default / 未参加"
          >
            <div className="w-full max-w-3xl">
              <GroupCard group={baseGroup} variant="standard" />
            </div>
          </Cell>
          <Cell
            testid="component-GroupCard-standard-joined"
            label="参加中"
          >
            <div className="w-full max-w-3xl">
              <GroupCard group={baseGroup} variant="standard" isJoined />
            </div>
          </Cell>
        </SubGroup>
        <SubGroup label="variant=standard / logoUrl 有">
          <Cell
            testid="component-GroupCard-standard-withLogo"
            label="logo (Picsum)"
          >
            <div className="w-full max-w-3xl">
              <GroupCard
                group={{
                  ...baseGroup,
                  logoUrl: "https://picsum.photos/seed/tfe-logo/200/200",
                }}
                variant="standard"
              />
            </div>
          </Cell>
          <Cell
            testid="component-GroupCard-standard-withLogoJoined"
            label="logo + 参加中"
          >
            <div className="w-full max-w-3xl">
              <GroupCard
                group={{
                  ...baseGroup,
                  logoUrl: "https://picsum.photos/seed/tfe-logo-2/200/200",
                }}
                variant="standard"
                isJoined
              />
            </div>
          </Cell>
        </SubGroup>

        <SubGroup label="variant=sidebar">
          <Cell testid="component-GroupCard-sidebar-default" label="sidebar">
            <div className="w-72">
              <GroupCard group={baseGroup} variant="sidebar" />
            </div>
          </Cell>
          <Cell testid="component-GroupCard-sidebar-withLogo" label="sidebar + logo">
            <div className="w-72">
              <GroupCard
                group={{
                  ...baseGroup,
                  logoUrl: "https://picsum.photos/seed/tfe-logo-3/64/64",
                }}
                variant="sidebar"
              />
            </div>
          </Cell>
        </SubGroup>

        <SubGroup label="variant=compact (sidebar の alias)">
          <Cell testid="component-GroupCard-compact-default" label="compact">
            <div className="w-72">
              <GroupCard group={baseGroup} variant="compact" />
            </div>
          </Cell>
        </SubGroup>
      </Section>

      {/* ========== ParticipantBadge ========== */}
      <Section
        id="participant-badge"
        title="ParticipantBadge"
        description="3 size / iconOnly / profileUrl"
      >
        {SIZES.map((size) => (
          <SubGroup key={size} label={`size=${size}`}>
            <Cell
              testid={`component-ParticipantBadge-default-${size}`}
              label="default"
            >
              <ParticipantBadge nickname="taro_yamada" size={size} />
            </Cell>
            <Cell
              testid={`component-ParticipantBadge-iconOnly-${size}`}
              label="iconOnly"
            >
              <ParticipantBadge nickname="taro_yamada" size={size} iconOnly />
            </Cell>
            <Cell
              testid={`component-ParticipantBadge-withMeta-${size}`}
              label="with meta"
            >
              <ParticipantBadge
                nickname="hanako_suzuki"
                size={size}
                ticketName="一般枠"
                status="参加確定"
                appliedAt="2026-06-01T12:00:00+09:00"
              />
            </Cell>
            <Cell
              testid={`component-ParticipantBadge-link-${size}`}
              label="profileUrl"
            >
              <ParticipantBadge
                nickname="link_user"
                size={size}
                profileUrl="/user/link_user"
              />
            </Cell>
            <Cell
              testid={`component-ParticipantBadge-avatar-${size}`}
              label="avatarUrl (DiceBear)"
            >
              <ParticipantBadge
                nickname={`avatar_${size}`}
                size={size}
                avatarUrl={`https://api.dicebear.com/9.x/identicon/svg?seed=avatar-${size}`}
              />
            </Cell>
            <Cell
              testid={`component-ParticipantBadge-avatarIconOnly-${size}`}
              label="avatarUrl + iconOnly"
            >
              <ParticipantBadge
                nickname={`avatar_only_${size}`}
                size={size}
                iconOnly
                avatarUrl={`https://api.dicebear.com/9.x/identicon/svg?seed=avatar-only-${size}`}
              />
            </Cell>
          </SubGroup>
        ))}

        <SubGroup label="user={} オブジェクト形式">
          <Cell
            testid="component-ParticipantBadge-userObject-default"
            label="user={ displayName, avatarUrl }"
          >
            <ParticipantBadge
              user={{
                id: "u-1",
                nickname: "yamada",
                displayName: "山田 太郎",
                avatarUrl:
                  "https://api.dicebear.com/9.x/identicon/svg?seed=user-yamada",
              }}
            />
          </Cell>
          <Cell
            testid="component-ParticipantBadge-userObject-link"
            label="user={} + profileUrl"
          >
            <ParticipantBadge
              user={{
                id: "u-2",
                nickname: "suzuki",
                displayName: "鈴木 花子",
                avatarUrl:
                  "https://api.dicebear.com/9.x/identicon/svg?seed=user-suzuki",
              }}
              profileUrl="/user/suzuki"
            />
          </Cell>
        </SubGroup>
      </Section>

      {/* ========== MiniCalendar ========== */}
      <Section
        id="mini-calendar"
        title="MiniCalendar"
        description="今月 / 開催日複数指定"
      >
        <Cell testid="component-MiniCalendar-default-thisMonth" label="今月">
          <div className="w-64">
            <MiniCalendar eventDates={eventDates} />
          </div>
        </Cell>
        <Cell testid="component-MiniCalendar-default-empty" label="empty">
          <div className="w-64">
            <MiniCalendar eventDates={new Set()} />
          </div>
        </Cell>
        <Cell
          testid="component-MiniCalendar-default-fixedMonth"
          label="2026/07 固定"
        >
          <div className="w-64">
            <MiniCalendar
              baseDate={new Date(2026, 6, 1)}
              eventDates={
                new Set([
                  "2026-07-03",
                  "2026-07-10",
                  "2026-07-15",
                  "2026-07-21",
                  "2026-07-28",
                ])
              }
            />
          </div>
        </Cell>
        <Cell
          testid="component-MiniCalendar-monthBoundary"
          label="2026/02 (うるう年判定 + 月跨ぎセル) / 28日まで"
        >
          <div className="w-64">
            {/*
              2026/02 は 28日まで・1日が日曜のため、前月末の埋めが無く、翌月の埋めが
              28〜42 セル中に出現する。月跨ぎセル (グレーアウト) の見た目を視覚回帰で
              直接ロックするためのケース。
            */}
            <MiniCalendar
              baseDate={new Date(2026, 1, 1)}
              eventDates={
                new Set([
                  "2026-01-31",
                  "2026-02-01",
                  "2026-02-14",
                  "2026-02-28",
                  "2026-03-01",
                ])
              }
            />
          </div>
        </Cell>
        <Cell
          testid="component-MiniCalendar-monthBoundary-may"
          label="2026/05 (前月末セル付き)"
        >
          <div className="w-64">
            {/*
              2026/05/01 は金曜のため、前月 4/26-4/30 が薄色セルとして表示される。
              翌月 5/31〜6/6 までが薄色セルとなる。
            */}
            <MiniCalendar
              baseDate={new Date(2026, 4, 15)}
              eventDates={
                new Set([
                  "2026-04-30",
                  "2026-05-15",
                  "2026-05-31",
                  "2026-06-01",
                ])
              }
            />
          </div>
        </Cell>
      </Section>

      {/* ========== HostAvatarStack (Luma 参考) ========== */}
      <Section
        id="host-avatar-stack"
        title="HostAvatarStack"
        description="共催ホストの重ねアバター表示 (Luma の co-host UX を参考)"
      >
        <SubGroup label="2 人">
          <Cell
            testid="component-HostAvatarStack-default-pair"
            label="size=md / showNames"
          >
            <HostAvatarStack
              hosts={hostSample.slice(0, 2)}
              showNames
            />
          </Cell>
        </SubGroup>
        <SubGroup label="3 人">
          <Cell
            testid="component-HostAvatarStack-default-trio"
            label="size=md"
          >
            <HostAvatarStack hosts={hostSample} />
          </Cell>
        </SubGroup>
        <SubGroup label="オーバーフロー (+N)">
          <Cell
            testid="component-HostAvatarStack-default-overflow"
            label="hosts=7 / maxVisible=4"
          >
            <HostAvatarStack
              hosts={hostManySample}
              maxVisible={4}
              showNames
            />
          </Cell>
        </SubGroup>
        <SubGroup label="サイズ">
          <Cell testid="component-HostAvatarStack-sm" label="sm">
            <HostAvatarStack hosts={hostSample} size="sm" />
          </Cell>
          <Cell testid="component-HostAvatarStack-md" label="md">
            <HostAvatarStack hosts={hostSample} size="md" />
          </Cell>
          <Cell testid="component-HostAvatarStack-lg" label="lg">
            <HostAvatarStack hosts={hostSample} size="lg" />
          </Cell>
        </SubGroup>
        <SubGroup label="avatarUrl 無し (頭文字フォールバック)">
          <Cell
            testid="component-HostAvatarStack-noAvatar"
            label="hash カラー"
          >
            <HostAvatarStack
              hosts={[
                { name: "山田 太郎" },
                { name: "佐藤 花子" },
                { name: "Suzuki" },
              ]}
              showNames
            />
          </Cell>
        </SubGroup>
      </Section>
    </main>
  );
}
