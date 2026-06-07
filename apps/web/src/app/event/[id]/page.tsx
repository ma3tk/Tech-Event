/**
 * イベント詳細ページ (Server Component)
 *
 * - メイン 2/3 + サイドバー 1/3 のレイアウト
 * - メイン: タイトル、catchPhrase、ステータスバッジ、開催日時、場所、
 *   説明文 (Markdown -> HTML を `marked` で描画)、タグ、参加者一覧
 *   (タブで accepted/waiting/cancelled 切替)、コメント (表示のみ)、
 *   発表資料 (closed のとき)
 * - サイドバー: 申込ボックス (参加枠ごとに定員/残席 + 参加ボタン)、シェア、
 *   主催グループカード、管理者一覧、ハッシュタグ、関連リンク
 * - JSON-LD (schema.org Event) を埋め込み
 * - パンくず: ホーム > グループ名 > イベント名
 *
 * 参加ボタンは未認証想定で `/login` へのリンクとし、申込フロー本体は
 * 別タスクで実装する。
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  Globe,
  Hash,
  MapPin,
  Users,
} from "lucide-react";
import { renderMarkdown, safeJsonLd } from "@/lib/markdown";

import Breadcrumb from "@/components/Breadcrumb";
import EventStatusBadge, {
  type EventStatus,
} from "@/components/EventStatusBadge";
import GroupCard from "@/components/GroupCard";
import ParticipantBadge from "@/components/ParticipantBadge";
import TagPill from "@/components/TagPill";
import HostAvatarStack, {
  type HostAvatarHost,
} from "@/components/HostAvatarStack";
import ShareModal from "@/components/ShareModalDynamic";
import EventStickyCTA, {
  type StickyState,
} from "@/components/EventStickyCTA";
import ActionForm from "../../../components/forms/ActionForm";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  joinEvent,
  cancelParticipation,
  bookmarkEvent,
  unbookmarkEvent,
} from "@/app/actions/event-actions";
import { joinPaidEvent } from "@/app/actions/payment-actions";
import { isStripeEnabled } from "@/lib/stripe";
import {
  postComment,
  deleteComment,
} from "@/app/actions/comment-actions";
import { formatIcsDateUtc } from "@/lib/ical";
import { deriveUiEventStatus } from "@/lib/event-card";
import { toGroupCardData } from "@/lib/group-card";
import {
  formatEventDate,
  formatNumber,
  isFull,
  remainingSeats,
} from "@/lib/utils";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  absoluteUrl,
  truncateDescription,
} from "@/lib/seo";
import { loadDict, t } from "@/lib/i18n";
import { formatDate as formatDateLocale } from "@/lib/date";

import type { ParticipantStatus } from "@/types/event";

import type { StickyState as StickyStateType } from "@/components/EventStickyCTA";

/**
 * 翻訳辞書から Sticky CTA 用のラベル一式を構築するヘルパ。
 * Server Component で呼んで EventStickyCTA に props 経由で渡す。
 */
function buildStickyLabels(
  dict: Awaited<ReturnType<typeof loadDict>>["dict"],
): Record<StickyStateType, string> {
  return {
    cancelled: t(dict, "event.cta.cancelled"),
    ended: t(dict, "event.cta.ended"),
    upcoming: t(dict, "event.cta.upcoming"),
    closed: t(dict, "event.cta.closed"),
    going: t(dict, "event.cta.going"),
    waiting: t(dict, "event.cta.waiting"),
    pending: t(dict, "event.cta.pending"),
    full: t(dict, "event.cta.full"),
    lottery: t(dict, "event.cta.lottery"),
    open: t(dict, "event.cta.open"),
  };
}

/* ============================================================
 * Markdown 設定
 *   sanitize / breaks / gfm の設定は @/lib/markdown に集約
 * ============================================================ */

// セッション cookie に基づきユーザー固有 UI を出すため、動的レンダリング
export const dynamic = "force-dynamic";

/* ============================================================
 * Param 解析
 * ============================================================ */

type EventDetailParams = { id: string };

/** id 文字列を BigInt に変換。不正なら null */
function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/* ============================================================
 * データ取得
 * ============================================================ */

async function fetchEventDetail(id: bigint) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      group: true,
      owner: true,
      roles: { orderBy: { displayOrder: "asc" } },
      tags: { include: { tag: true } },
      participants: {
        include: { user: true },
        orderBy: { appliedAt: "asc" },
        take: 200,
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
        where: { deletedAt: null },
        take: 200,
      },
      presentations: {
        orderBy: { displayOrder: "asc" },
      },
      surveys: {
        where: { trigger: "on_apply" },
        include: { questions: { select: { id: true } } },
      },
    },
  });
  if (!event) return null;

  // 主催グループの管理者
  const groupAdmins = await prisma.groupAdmin.findMany({
    where: { groupId: event.groupId },
    include: { user: true },
    orderBy: { addedAt: "asc" },
  });

  // このイベントを含む Calendar (Luma 風キュレーション)
  const calendarRows = await prisma.calendarEvent.findMany({
    where: {
      eventId: event.id,
      calendar: { status: "active" },
    },
    include: { calendar: true },
    orderBy: { calendar: { subscriberCount: "desc" } },
    take: 6,
  });
  const containingCalendars = calendarRows.map((ce) => ({
    id: ce.calendar.id.toString(),
    slug: ce.calendar.slug,
    name: ce.calendar.name,
    tintColor: ce.calendar.tintColor,
    subscriberCount: ce.calendar.subscriberCount,
  }));

  return { event, groupAdmins, containingCalendars };
}

/* ============================================================
 * Metadata
 * ============================================================ */

export async function generateMetadata({
  params,
}: {
  params: Promise<EventDetailParams>;
}): Promise<Metadata> {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return { title: "イベントが見つかりません" };

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      title: true,
      catchPhrase: true,
      description: true,
      coverImageUrl: true,
      group: { select: { name: true } },
    },
  });
  if (!event) return { title: "イベントが見つかりません" };

  const description = truncateDescription(
    event.catchPhrase ?? event.description ?? "",
  );
  const canonical = absoluteUrl(`/event/${raw}`);
  const ogImage = event.coverImageUrl ?? undefined;

  return {
    title: `${event.title} - ${event.group.name}`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: event.title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/* ============================================================
 * Page
 * ============================================================ */

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<EventDetailParams>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) notFound();

  const data = await fetchEventDetail(id);
  if (!data) notFound();

  const { event, groupAdmins, containingCalendars } = data;

  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  // i18n 辞書 (Sticky CTA ラベルの prop drilling 用)
  const { locale, dict } = await loadDict();
  const stickyLabels = buildStickyLabels(dict);
  const stickyLoginLabel = t(dict, "event.cta.loginToJoin");
  const stickyAriaLabel = t(dict, "event.cta.stickyAriaLabel");
  const stickyAcceptsFromTemplate = t(dict, "event.cta.acceptsFrom");

  // ============ ログインユーザー & 自身の参加状況 ============
  const currentUser = await getCurrentUser();
  const myParticipation = currentUser
    ? event.participants.find(
        (p) =>
          p.userId === currentUser.id &&
          (p.status === "accepted" ||
            p.status === "waiting" ||
            p.status === "pending"),
      )
    : null;

  // 承認制で却下された (approvalStatus=rejected) 申請があるか
  const currentUserRejected = !!(
    currentUser &&
    event.approvalRequired &&
    event.participants.some(
      (p) => p.userId === currentUser.id && p.approvalStatus === "rejected",
    )
  );

  // 自分のブックマーク状態 / 自分が主催者 or グループ管理者か
  const [isBookmarked, isAdmin] = currentUser
    ? await Promise.all([
        prisma.bookmark
          .findUnique({
            where: {
              userId_eventId: { userId: currentUser.id, eventId: event.id },
            },
          })
          .then((b) => !!b),
        currentUser.id === event.ownerId
          ? Promise.resolve(true)
          : prisma.groupAdmin
              .findFirst({
                where: { groupId: event.groupId, userId: currentUser.id },
                select: { id: true },
              })
              .then((a) => !!a),
      ])
    : [false, false];

  // UI 用 EventStatus を導出
  const uiStatus = deriveUiEventStatus(event);

  // 参加者カウントは Prisma groupBy で SQL 側集約 (over-fetch した participants の
  // JS フィルタを 3 回回すよりも CPU / メモリ効率が良い)。
  // 注: `event.participants` には take:200 制限があるため、200 件を超える場合に
  // JS .length では正確な総数が取れない。groupBy なら全件 COUNT 集約になる。
  const statusCountsRaw = await prisma.participant.groupBy({
    by: ["status"],
    where: { eventId: event.id },
    _count: { _all: true },
  });
  const countByStatus: Record<string, number> = {};
  for (const row of statusCountsRaw) {
    countByStatus[row.status] = row._count._all;
  }
  const counts = {
    accepted: countByStatus["accepted"] ?? 0,
    waiting: countByStatus["waiting"] ?? 0,
    cancelled: countByStatus["cancelled"] ?? 0,
  };

  // 参加枠別の accepted / waiting 件数も SQL groupBy で集約
  const roleCountsRaw = await prisma.participant.groupBy({
    by: ["eventRoleId", "status"],
    where: {
      eventId: event.id,
      status: { in: ["accepted", "waiting"] },
    },
    _count: { _all: true },
  });
  const roleAccepted = new Map<string, number>();
  const roleWaiting = new Map<string, number>();
  for (const row of roleCountsRaw) {
    const key = row.eventRoleId.toString();
    if (row.status === "accepted") {
      roleAccepted.set(key, row._count._all);
    } else if (row.status === "waiting") {
      roleWaiting.set(key, row._count._all);
    }
  }

  // タブで絞り込み
  const visibleParticipants = event.participants
    .filter((p) => p.status === tab)
    .map((p) => ({
      id: p.id.toString(),
      eventRoleId: p.eventRoleId.toString(),
      appliedAt: p.appliedAt.toISOString(),
      status: p.status as ParticipantStatus,
      user: {
        id: p.user.id.toString(),
        nickname: p.user.nickname,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl ?? undefined,
      },
    }));

  // 説明文の Markdown -> HTML (DOMPurify で sanitize 済み)
  const descriptionHtml: string = renderMarkdown(event.description);

  // ハッシュタグ (連結文字列) を配列化
  const hashTags = parseHashTags(event.hashTag);

  const groupCardData = toGroupCardData(event.group);
  const eventIdStr = event.id.toString();
  const groupIdStr = event.group.id.toString();

  // JSON-LD
  const jsonLd = buildEventJsonLd({
    event,
    groupName: event.group.name,
    ownerDisplayName: event.ownerDisplayName ?? event.owner.displayName,
    accepted: counts.accepted,
  });

  // ============ 共催ホスト列 (Luma 参考の HostAvatarStack 用データ) ============
  // 主催者 (event.owner) + グループ管理者の上位 2 名 (重複除外)
  // 主催者は先頭、その後管理者を表示順に並べる
  const hosts: HostAvatarHost[] = [];
  hosts.push({
    name: event.ownerDisplayName ?? event.owner.displayName,
    avatarUrl: event.owner.avatarUrl ?? undefined,
    profileUrl: `/user/${event.owner.nickname}`,
    role: "主催",
  });
  for (const a of groupAdmins.slice(0, 2)) {
    // 主催者と同じユーザーは重複追加しない
    if (a.user.id === event.owner.id) continue;
    hosts.push({
      name: a.user.displayName,
      avatarUrl: a.user.avatarUrl ?? undefined,
      profileUrl: `/user/${a.user.nickname}`,
      role: "共催",
    });
  }

  // ============ Sticky CTA に渡す state を導出 ============
  // ApplyButton と同じ優先順位で 1 つの代表 state にまとめる
  // (sticky bar はメイン申込ボックスを「指すリンク」なので、複数枠あっても
  // ざっくり「いま何ができるか」だけ伝えれば良い)
  const nowForSticky = new Date();
  const acceptingRole = event.roles[0] ?? null;
  const firstRoleAccepted = acceptingRole
    ? roleAccepted.get(acceptingRole.id.toString()) ?? 0
    : 0;
  const firstRoleFull =
    acceptingRole?.capacity != null &&
    firstRoleAccepted >= acceptingRole.capacity;
  let stickyState: StickyState;
  if (event.status === "cancelled" || uiStatus === "cancelled") {
    stickyState = "cancelled";
  } else if (nowForSticky > event.endedAt || uiStatus === "ended") {
    stickyState = "ended";
  } else if (event.acceptsFrom && nowForSticky < event.acceptsFrom) {
    stickyState = "upcoming";
  } else if (uiStatus === "closed") {
    stickyState = "closed";
  } else if (myParticipation?.status === "accepted") {
    stickyState = "going";
  } else if (myParticipation?.status === "waiting") {
    stickyState = "waiting";
  } else if (myParticipation?.status === "pending") {
    stickyState = "pending";
  } else if (
    acceptingRole?.recruitmentMethod === "lottery" ||
    event.recruitmentMethod === "lottery"
  ) {
    stickyState = "lottery";
  } else if (firstRoleFull) {
    stickyState = "full";
  } else {
    stickyState = "open";
  }

  // 共有 URL (絶対 URL)
  const shareUrl = absoluteUrl(`/event/${eventIdStr}`);

  // ============ Survey 有無 ============
  // on_apply トリガーの Survey に質問が 1 件以上ある場合は、参加申込フォームを
  // /event/{id}/apply に誘導する。質問が無ければ従来通り joinEvent で直接申込。
  const hasSurvey = event.surveys.some(
    (s) => s.questions && s.questions.length > 0,
  );

  // ============ テーマ設定 (Luma 参考) ============
  // themeTintColor が設定されている場合のみ CSS 変数 `--event-tint` を注入し、
  // HERO 帯背景・アクセント要素の色に反映する。設定がない場合は従来の
  // デフォルト (#1f3c66 / brand-orange) を維持する。
  const tintColor = event.themeTintColor;
  const bgStyle = event.themeBackgroundStyle ?? "solid";
  const fontStyle = event.themeFontStyle ?? "default";
  const themeStyle: React.CSSProperties = {};
  if (tintColor) {
    (themeStyle as Record<string, string>)["--event-tint"] = tintColor;
    (themeStyle as Record<string, string>)["--event-bg-style"] = bgStyle;
  }
  const fontFamilyClass =
    fontStyle === "serif"
      ? "font-serif"
      : fontStyle === "mono"
        ? "font-mono"
        : "";

  // HERO の背景 inline style (tintColor がある場合は反映、なければ従来色)
  const heroInline: React.CSSProperties = tintColor
    ? bgStyle === "gradient"
      ? {
          background: `linear-gradient(135deg, ${tintColor} 0%, ${tintColor}99 100%)`,
        }
      : { background: tintColor }
    : { background: "#1f3c66" };

  return (
    <div
      className={`flex w-full flex-1 flex-col ${fontFamilyClass}`}
      data-event-themed={tintColor ? "true" : "false"}
      data-testid="event-detail-root"
      style={themeStyle}
    >
      {/* ============ HERO 帯 (背景: coverImageUrl をぼかしてオーバーレイ) ============ */}
      <section
        aria-label="イベント概要"
        data-testid="event-hero"
        className="relative overflow-hidden border-b border-border text-white"
        style={heroInline}
      >
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            // Luma 風: より強くぼかして foreground card を引き立てる
            className="pointer-events-none scale-110 object-cover opacity-40 [filter:blur(40px)_brightness(0.5)]"
          />
        ) : null}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: tintColor
              ? // tint がある場合は tint -> 黒へのグラデで「主題色を効かせつつ可読性確保」
                `linear-gradient(135deg, ${tintColor}66 0%, rgba(0,0,0,0.55) 100%)`
              : "linear-gradient(to bottom, rgba(31,60,102,0.7), rgba(19,40,74,0.85))",
          }}
        />
        {/*
         * Luma 風 glassmorphism foreground card。
         *   - rounded-3xl + backdrop-blur(20px) + bg-white/10 (dark hero 内)
         *   - 既存の h1#event-title / EventStatusBadge / 共催スタック等の
         *     DOM 階層・selector を破壊しないよう、ラッパ <div> を追加するのみ。
         */}
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-soft-lg backdrop-blur-md md:p-8">
          <div className="flex items-center gap-2">
            <EventStatusBadge status={uiStatus} />
            <Link
              href={`/group/${groupIdStr}`}
              className="text-sm font-semibold text-white/90 hover:underline"
            >
              {event.group.name}
            </Link>
          </div>

          <h1
            id="event-title"
            className="mt-3 text-3xl font-bold leading-tight tracking-tight drop-shadow-sm md:text-[40px]"
          >
            {event.title}
          </h1>

          {event.catchPhrase && (
            <p className="mt-2 text-base text-white/90 md:text-lg">
              {event.catchPhrase}
            </p>
          )}

          {/*
           * 4 スプリットメタ行 (開催日 / 会場 / 主催 / 参加人数)
           *
           * もとは `<dl>` で組んでいたが、grid 用のラッパ `<div>` が dt/dd と dl
           * の間に入り axe の `definition-list` / `dlitem` ルール (dt/dd は
           * dl の直接の子でなければならない) で serious violation になる。
           * HTML5.1 では `<div>` で dt/dd をグルーピングする書き方が許される
           * が axe-core の現行ルールはまだ追従していないため、ここでは
           * 意味的にも妥当な `<ul role="list">` + `<li>` のリスト構造に変える。
           */}
          <ul
            role="list"
            aria-label="イベント概要"
            className="mt-5 grid list-none grid-cols-2 gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm backdrop-blur-sm md:grid-cols-4"
          >
            <HeroMeta
              icon={<Calendar aria-hidden="true" className="h-4 w-4" />}
              label="開催日"
              value={
                <time dateTime={event.startedAt.toISOString()}>
                  {formatEventDate(event.startedAt, event.endedAt)}
                </time>
              }
            />
            <HeroMeta
              icon={
                event.eventFormat === "online" ? (
                  <Globe aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                )
              }
              label="会場"
              value={
                event.eventFormat === "online"
                  ? "オンライン"
                  : event.place ?? event.address ?? "未定"
              }
            />
            <HeroMeta
              icon={
                <span aria-hidden="true" className="text-sm">
                  👤
                </span>
              }
              label="主催"
              value={event.ownerDisplayName ?? event.owner.displayName}
            />
            <HeroMeta
              icon={<Users aria-hidden="true" className="h-4 w-4" />}
              label="参加人数"
              value={
                event.capacity != null
                  ? `${formatNumber(event.acceptedCount)} / ${formatNumber(
                      event.capacity,
                    )} 人`
                  : `${formatNumber(event.acceptedCount)} 人`
              }
            />
          </ul>

          {/* ============ 共催ホスト列 (HostAvatarStack) ============ */}
          {/* Luma 参考: 主催者 + グループ管理者 上位 2 名を重ねアバターで表示 */}
          {hosts.length > 1 && (
            <div
              className="mt-4 flex items-center gap-3"
              data-testid="hero-host-stack"
            >
              <HostAvatarStack
                hosts={hosts}
                size="md"
                showNames
              />
            </div>
          )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* パンくず */}
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: event.group.name, href: `/group/${groupIdStr}` },
            { label: event.title },
          ]}
        />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        {/* ============ Main ============ */}
        <main aria-labelledby="event-title">
          {/* HERO 下: ハッシュタグなど軽い補足 */}
          <header className="mb-6">
            {hashTags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {hashTags.map((h) => (
                  <li key={h}>
                    <a
                      href={`https://x.com/search?q=%23${encodeURIComponent(h)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-link hover:underline"
                    >
                      <Hash aria-hidden="true" className="h-3 w-3" />
                      {h}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </header>

          {/* 説明文 (Markdown) */}
          {descriptionHtml && (
            <section className="mb-8" aria-labelledby="description-heading">
              <h2
                id="description-heading"
                className="mb-3 border-b border-border pb-2 text-xl font-bold text-foreground"
              >
                イベント概要
              </h2>
              <div
                className="prose prose-sm max-w-none text-foreground"
                /* dangerouslySetInnerHTML: marked が GFM をパースし HTML を生成。
                   投稿者は信頼できる主催者である前提だが、将来 sanitize を挟むのが望ましい。 */
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </section>
          )}

          {/* タグ */}
          {event.tags.length > 0 && (
            <section className="mb-8" aria-labelledby="tags-heading">
              <h2
                id="tags-heading"
                className="mb-3 border-b border-border pb-2 text-xl font-bold text-foreground"
              >
                タグ
              </h2>
              <ul className="flex flex-wrap gap-2">
                {event.tags.map((et) => (
                  <li key={et.tag.id.toString()}>
                    <TagPill
                      label={et.tag.name}
                      href={`/explore?tag=${encodeURIComponent(et.tag.slug)}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 発表資料 (closed のとき) */}
          {event.status === "closed" && event.presentations.length > 0 && (
            <section
              className="mb-8"
              aria-labelledby="presentations-heading"
            >
              <h2
                id="presentations-heading"
                className="mb-3 border-b border-border pb-2 text-xl font-bold text-foreground"
              >
                発表資料
              </h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {event.presentations.map((p) => (
                  <li
                    key={p.id.toString()}
                    className="rounded-lg border border-border bg-surface p-4"
                  >
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-link hover:underline"
                    >
                      {p.title}{" "}
                      <ExternalLink
                        aria-hidden="true"
                        className="inline h-3 w-3"
                      />
                    </a>
                    {p.presenterDisplayName && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        登壇: {p.presenterDisplayName}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 参加者一覧 (タブ切替) */}
          <ParticipantsSection
            tab={tab}
            counts={counts}
            participants={visibleParticipants}
            roles={event.roles.map((r) => ({
              id: r.id.toString(),
              name: r.name,
            }))}
            eventId={eventIdStr}
            locale={locale}
          />

          {/* コメント */}
          <CommentsSection
            locale={locale}
            eventId={eventIdStr}
            currentUserId={currentUser ? currentUser.id.toString() : null}
            comments={event.comments.map((c) => ({
              id: c.id.toString(),
              body: c.body,
              createdAt: c.createdAt.toISOString(),
              parentCommentId: c.parentCommentId
                ? c.parentCommentId.toString()
                : null,
              user: {
                id: c.user.id.toString(),
                nickname: c.user.nickname,
                displayName: c.user.displayName,
                avatarUrl: c.user.avatarUrl ?? undefined,
              },
            }))}
          />
        </main>

        {/* ============ Sidebar ============ */}
        <aside className="flex flex-col gap-6">
          {/* 申込ボックス */}
          <ApplyBox
            eventId={eventIdStr}
            event={{
              acceptsFrom: event.acceptsFrom,
              acceptsUntil: event.acceptsUntil,
              recruitmentMethod: event.recruitmentMethod,
              approvalRequired: event.approvalRequired,
              lotteryAnnounceAt: event.lotteryAnnounceAt,
              rawStatus: event.status,
              endedAt: event.endedAt,
            }}
            currentUserRejected={currentUserRejected}
            roles={event.roles.map((r) => {
              const key = r.id.toString();
              const pendingCount = event.participants.filter(
                (p) => p.eventRoleId === r.id && p.status === "pending",
              ).length;
              return {
                id: key,
                name: r.name,
                description: r.description ?? undefined,
                capacity: r.capacity,
                pricingType: r.pricingType,
                price: r.price,
                currency: r.currency,
                recruitmentMethod: r.recruitmentMethod,
                accepted: roleAccepted.get(key) ?? 0,
                waiting: roleWaiting.get(key) ?? 0,
                pending: pendingCount,
              };
            })}
            status={uiStatus}
            currentUserLoggedIn={!!currentUser}
            myParticipation={
              myParticipation
                ? {
                    status: myParticipation.status,
                    eventRoleId: myParticipation.eventRoleId.toString(),
                    waitingPosition: myParticipation.waitingPosition,
                    approvalStatus: myParticipation.approvalStatus ?? null,
                  }
                : null
            }
            hasSurvey={hasSurvey}
            locale={locale}
          />

          {/* ブックマーク */}
          <BookmarkBox
            eventId={eventIdStr}
            loggedIn={!!currentUser}
            isBookmarked={isBookmarked}
          />

          {/* カレンダー追加 */}
          <CalendarBox
            eventId={eventIdStr}
            eventTitle={event.title}
            description={event.catchPhrase ?? event.description ?? ""}
            location={
              event.eventFormat === "online"
                ? event.onlineUrl ?? "オンライン"
                : [event.place, event.address]
                    .filter((s) => s && s.length > 0)
                    .join(" ")
            }
            startedAt={event.startedAt}
            endedAt={event.endedAt}
          />

          {/* 主催者用クイックアクション */}
          {isAdmin && (
            <section aria-labelledby="admin-actions-heading">
              <h2
                id="admin-actions-heading"
                className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
              >
                主催者操作
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <Link
                    href={`/event/${eventIdStr}/admin/check-in`}
                    className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
                  >
                    出席管理を開く
                  </Link>
                </li>
              </ul>
            </section>
          )}

          {/* シェア (既存ボタン + Luma 参考の統合シェアモーダル) */}
          <ShareBox
            eventTitle={event.title}
            eventId={eventIdStr}
            shareUrl={shareUrl}
            coverImageUrl={event.coverImageUrl}
          />

          {/* 共催ホスト (HostAvatarStack サイドバー版) */}
          {hosts.length >= 1 && (
            <section
              aria-labelledby="hosts-heading"
              data-testid="sidebar-host-stack"
            >
              <h2
                id="hosts-heading"
                className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
              >
                ホスト
              </h2>
              <HostAvatarStack hosts={hosts} size="md" showNames />
            </section>
          )}

          {/* 主催グループ */}
          <section aria-labelledby="organizer-heading">
            <h2
              id="organizer-heading"
              className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
            >
              主催グループ
            </h2>
            <GroupCard group={groupCardData} variant="sidebar" />
          </section>

          {/* 管理者一覧 */}
          {groupAdmins.length > 0 && (
            <section aria-labelledby="admins-heading">
              <h2
                id="admins-heading"
                className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
              >
                管理者
              </h2>
              <ul className="flex flex-wrap gap-2">
                {groupAdmins.map((a) => (
                  <li key={a.user.id.toString()}>
                    <ParticipantBadge
                      nickname={a.user.displayName}
                      avatarUrl={a.user.avatarUrl ?? undefined}
                      profileUrl={`/user/${a.user.nickname}`}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* このイベントを含むカレンダー (Luma 風) */}
          {containingCalendars.length > 0 && (
            <section
              aria-labelledby="containing-calendars-heading"
              data-testid="sidebar-containing-calendars"
            >
              <h2
                id="containing-calendars-heading"
                className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
              >
                このイベントを含むカレンダー
              </h2>
              <ul className="space-y-2">
                {containingCalendars.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/calendar/${c.slug}`}
                      className="flex items-center gap-3 rounded-md border border-border bg-surface p-2 hover:border-brand-orange"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded font-bold text-white"
                        style={{ backgroundColor: c.tintColor ?? "#5b21b6" }}
                        aria-hidden="true"
                      >
                        {c.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-1 text-sm font-semibold text-foreground">
                          {c.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          購読 {formatNumber(c.subscriberCount, locale)} 人
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ハッシュタグ */}
          {hashTags.length > 0 && (
            <section aria-labelledby="hashtags-heading">
              <h2
                id="hashtags-heading"
                className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
              >
                ハッシュタグ
              </h2>
              <ul className="flex flex-wrap gap-2">
                {hashTags.map((h) => (
                  <li key={h}>
                    <a
                      href={`https://x.com/search?q=%23${encodeURIComponent(h)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-link hover:bg-brand-orange-soft"
                    >
                      <Hash aria-hidden="true" className="h-3 w-3" />
                      {h}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連リンク */}
          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
            >
              関連リンク
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link
                  href={`/group/${groupIdStr}`}
                  className="text-link hover:underline"
                >
                  → {event.group.name} のページ
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-link hover:underline">
                  → 他のイベントを探す
                </Link>
              </li>
              {event.onlineUrl && (
                <li>
                  <span className="text-muted-foreground">
                    参加URLは申込者のみに開催前にお知らせします
                  </span>
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>

      {/* JSON-LD: Event schema.org (script breakout 対策で `<` などをエスケープ) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      </div>

      {/* ============ Sticky CTA バー (Luma 参考) ============ */}
      {/* メイン申込ボックス (#apply-heading) が画面外に出たら下から滑り出す。
          モバイルでは常時表示。クリックすると申込ボックスへスクロール、
          未ログイン時は /login へ。 */}
      <EventStickyCTA
        observeId="apply-heading"
        eventTitle={event.title}
        state={stickyState}
        loggedIn={!!currentUser}
        eventId={eventIdStr}
        acceptsFromIso={
          event.acceptsFrom ? event.acceptsFrom.toISOString() : undefined
        }
        labels={stickyLabels}
        loginLabel={stickyLoginLabel}
        acceptsFromTemplate={stickyAcceptsFromTemplate}
        ariaLabel={stickyAriaLabel}
      />
    </div>
  );
}

/* ============================================================
 * 内部 UI ヘルパー
 * ============================================================ */

/**
 * HERO 内のメタ情報セル (白文字)。連結カードの内側に並べる 4 スプリットの 1 列。
 */
function HeroMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 min-w-0">
      <span className="mt-0.5 text-white/70">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-white">
          {value}
        </p>
      </div>
    </li>
  );
}

type RoleSummary = {
  id: string;
  name: string;
  description?: string;
  capacity: number | null;
  pricingType: string;
  price: number;
  currency: string;
  recruitmentMethod: string;
  accepted: number;
  waiting: number;
  pending: number;
};

/** YYYY/MM/DD HH:mm 形式に整形 */
function formatLotteryAnnounce(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

/** YYYY/MM/DD のみ */
function formatLotteryAnnounceDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}/${m}/${day}`;
}

type MyParticipation = {
  status: string;
  eventRoleId: string;
  waitingPosition: number | null;
  approvalStatus: string | null;
};

/** 申込ボックス。参加枠ごとに定員/残席 + 参加ボタンを並べる */
function ApplyBox({
  eventId,
  event,
  roles,
  status,
  currentUserLoggedIn,
  myParticipation,
  hasSurvey,
  currentUserRejected,
  locale,
}: {
  eventId: string;
  event: {
    acceptsFrom: Date | null;
    acceptsUntil: Date | null;
    recruitmentMethod: string;
    /** 承認制 (Luma 風) */
    approvalRequired: boolean;
    lotteryAnnounceAt: Date | null;
    /** Prisma の生 status (`draft|published|closed|cancelled`) */
    rawStatus: string;
    endedAt: Date;
  };
  roles: RoleSummary[];
  status: EventStatus;
  currentUserLoggedIn: boolean;
  hasSurvey?: boolean;
  myParticipation: MyParticipation | null;
  /** 承認制で却下された場合 true */
  currentUserRejected?: boolean;
  /** ja|en — 日時整形に使う */
  locale?: "ja" | "en";
}) {
  const now = new Date();
  const lotteryAnnounced =
    event.recruitmentMethod === "lottery" &&
    event.lotteryAnnounceAt != null &&
    now > event.lotteryAnnounceAt;

  return (
    <section
      aria-labelledby="apply-heading"
      className="rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <h2
        id="apply-heading"
        className="mb-3 text-base font-bold text-foreground"
      >
        参加申込
      </h2>

      <div className="mb-4 flex items-center gap-2">
        <EventStatusBadge status={status} />
        {event.recruitmentMethod === "lottery" && (
          <span className="text-xs text-muted-foreground" data-testid="recruitment-method-lottery">
            抽選方式
          </span>
        )}
        {event.recruitmentMethod === "fcfs" && (
          <span className="text-xs text-muted-foreground">先着順</span>
        )}
      </div>

      {/* 抽選方式の場合は発表日時を表示 */}
      {event.recruitmentMethod === "lottery" && event.lotteryAnnounceAt && (
        <p
          className="mb-3 text-xs text-muted-foreground"
          data-testid="lottery-announce-at"
        >
          発表: {formatLotteryAnnounce(event.lotteryAnnounceAt)}
        </p>
      )}

      {/* 募集期間 */}
      {(event.acceptsFrom || event.acceptsUntil) && (
        <p className="mb-3 text-xs text-muted-foreground">
          募集期間:{" "}
          {event.acceptsFrom
            ? formatDateLocale(event.acceptsFrom, locale ?? "ja")
            : "随時"}{" "}
          〜{" "}
          {event.acceptsUntil
            ? formatDateLocale(event.acceptsUntil, locale ?? "ja")
            : "終了まで"}
        </p>
      )}

      {/* 承認制バッジ */}
      {event.approvalRequired && (
        <p
          className="mb-3 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900"
          data-testid="approval-required-badge"
        >
          承認制 (主催者の承認が必要です)
        </p>
      )}

      {/* 自分の参加状況サマリ */}
      {myParticipation && (
        <p
          className="mb-3 rounded-md border border-brand-orange bg-brand-orange-soft px-3 py-2 text-xs text-foreground"
          data-testid="my-participation-status"
        >
          {/* 承認制: approvalStatus を優先して表示 */}
          {event.approvalRequired &&
            myParticipation.approvalStatus === "pending" &&
            "承認待ち (主催者の承認をお待ちください)"}
          {event.approvalRequired &&
            myParticipation.approvalStatus === "approved" &&
            myParticipation.status === "accepted" &&
            "承認済 (参加確定中です)"}
          {event.approvalRequired &&
            myParticipation.approvalStatus === "approved" &&
            myParticipation.status === "waiting" &&
            `承認済 (補欠${
              myParticipation.waitingPosition != null
                ? ` ${myParticipation.waitingPosition} 番`
                : ""
            })`}

          {!event.approvalRequired && (
            <>
              {myParticipation.status === "accepted" &&
                (lotteryAnnounced ? "抽選結果: 当選" : "参加確定中です。")}
              {myParticipation.status === "waiting" &&
                (lotteryAnnounced
                  ? `抽選結果: 落選 (補欠${
                      myParticipation.waitingPosition != null
                        ? ` ${myParticipation.waitingPosition} 番`
                        : ""
                    })`
                  : `補欠登録中です${
                      myParticipation.waitingPosition != null
                        ? ` (補欠 ${myParticipation.waitingPosition} 番)`
                        : ""
                    }。`)}
              {myParticipation.status === "pending" &&
                (event.recruitmentMethod === "lottery"
                  ? `抽選申込中${
                      event.lotteryAnnounceAt
                        ? ` (発表: ${formatLotteryAnnounceDate(event.lotteryAnnounceAt)})`
                        : ""
                    }`
                  : "申込処理中です。")}
            </>
          )}
        </p>
      )}

      {/* 却下された場合は明示表示 */}
      {currentUserRejected && (
        <p
          className="mb-3 rounded-md border border-status-cancelled-bg bg-status-cancelled-soft px-3 py-2 text-xs text-status-cancelled-fg"
          data-testid="my-participation-rejected"
        >
          却下されました
        </p>
      )}

      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          参加枠が設定されていません。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {roles.map((role) => {
            const remain = remainingSeats(role.accepted, role.capacity);
            const full = isFull(role.accepted, role.capacity);
            const mine =
              myParticipation && myParticipation.eventRoleId === role.id
                ? myParticipation
                : null;
            const isLotteryRole = role.recruitmentMethod === "lottery";
            return (
              <li
                key={role.id}
                className="rounded-md border border-border p-3"
                data-testid={`role-${role.id}`}
              >
                <p className="text-sm font-semibold text-foreground">
                  {role.name}
                </p>
                {role.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role.description}
                  </p>
                )}
                {isLotteryRole ? (
                  // 抽選方式の枠: 現在の申込数を表示
                  <p
                    className="mt-1 text-xs text-muted-foreground"
                    data-testid={`role-info-${role.id}`}
                  >
                    抽選方式 / 定員 {role.capacity ?? "—"} 人
                    {" / "}
                    現在の申込数:{" "}
                    {formatNumber(
                      role.pending + role.accepted + role.waiting,
                    )}{" "}
                    人
                    {" / "}
                    {role.pricingType === "free"
                      ? "無料"
                      : `${formatNumber(role.price)} ${role.currency}`}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role.capacity != null
                      ? `${formatNumber(role.accepted)} / ${formatNumber(
                          role.capacity,
                        )} 人` +
                        (remain != null && remain > 0
                          ? ` (残り ${formatNumber(remain)} 席)`
                          : "")
                      : `${formatNumber(role.accepted)} 人 (定員なし)`}
                    {role.waiting > 0 &&
                      ` ・ 補欠 ${formatNumber(role.waiting)} 人`}
                    {" / "}
                    {role.pricingType === "free"
                      ? "無料"
                      : `${formatNumber(role.price)} ${role.currency} (${
                          role.pricingType === "prepaid"
                            ? "事前決済"
                            : "現地払い"
                        })`}
                  </p>
                )}
                <ApplyButton
                  eventId={eventId}
                  eventRoleId={role.id}
                  full={full}
                  eventStatus={status}
                  loggedIn={currentUserLoggedIn}
                  mine={mine}
                  isLotteryRole={isLotteryRole}
                  approvalRequired={event.approvalRequired}
                  rejected={!!currentUserRejected}
                  lotteryAnnounceAt={event.lotteryAnnounceAt}
                  acceptsFrom={event.acceptsFrom}
                  rawStatus={event.rawStatus}
                  endedAt={event.endedAt}
                  now={now}
                  hasSurvey={!!hasSurvey}
                  pricingType={role.pricingType}
                  stripeEnabled={isStripeEnabled()}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * 参加ボタン。状況に応じて以下を出し分ける。
 * - イベント終了/中止: 申込不可ボタン
 * - 未ログイン: `/login?next=...` リンク
 * - 抽選方式 + 自分が pending: 「抽選申込中」表示 + キャンセル form
 * - 既参加 (accepted): キャンセル form
 * - 補欠 (waiting): 補欠登録中表示 + キャンセル form
 * - 別枠で参加中: 申込不可 (他枠申込中)
 * - 抽選方式 + 通常: 「抽選に申し込む」ボタン
 * - 満員 (fcfs): 補欠登録 form
 * - 通常: 参加申込 form
 */
function ApplyButton({
  eventId,
  eventRoleId,
  full,
  eventStatus,
  loggedIn,
  mine,
  isLotteryRole,
  approvalRequired,
  rejected,
  lotteryAnnounceAt,
  acceptsFrom,
  rawStatus,
  endedAt,
  now,
  hasSurvey,
  pricingType,
  stripeEnabled,
}: {
  eventId: string;
  eventRoleId: string;
  full: boolean;
  /** UI 用に正規化された EventStatus */
  eventStatus: EventStatus;
  loggedIn: boolean;
  mine: MyParticipation | null;
  isLotteryRole: boolean;
  /** 承認制 (Luma 風) */
  approvalRequired?: boolean;
  /** 承認制で過去に却下された */
  rejected?: boolean;
  lotteryAnnounceAt: Date | null;
  acceptsFrom: Date | null;
  /** Prisma の生 status (cancelled の判定に使う) */
  rawStatus: string;
  endedAt: Date;
  now: Date;
  /** 申込時アンケートが設定されているなら true */
  hasSurvey?: boolean;
  /** EventRole.pricingType (free | on_site | prepaid) */
  pricingType?: string;
  /** Stripe 機能が有効か (= STRIPE_SECRET_KEY 設定済み) */
  stripeEnabled?: boolean;
}) {
  // ============ 有料 (prepaid) かつ Stripe 有効なら Checkout に飛ばす ============
  const usePaidCheckout =
    pricingType === "prepaid" &&
    !!stripeEnabled &&
    !mine &&
    !isLotteryRole &&
    !full &&
    loggedIn &&
    rawStatus !== "cancelled" &&
    eventStatus !== "cancelled" &&
    eventStatus !== "ended";
  // ============ 追加された disabled 状態 (Luma 参考の state machine 強化) ============
  // 1. event.status が cancelled
  if (rawStatus === "cancelled" || eventStatus === "cancelled") {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="register-state-cancelled"
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-status-cancelled-soft px-4 text-sm font-semibold text-status-cancelled-fg"
      >
        中止されました
      </button>
    );
  }

  // 2. イベント終了後
  if (now > endedAt || eventStatus === "ended") {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="register-state-ended"
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-border-strong px-4 text-sm font-semibold text-muted-foreground"
      >
        終了しました
      </button>
    );
  }

  // 3. 受付開始前 (acceptsFrom > now)
  if (acceptsFrom && now < acceptsFrom) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="register-state-pre-acceptance"
        className="mt-3 inline-flex h-9 w-full flex-col items-center justify-center rounded-md bg-border-strong px-4 text-xs font-semibold text-muted-foreground"
      >
        受付開始: {formatLotteryAnnounce(acceptsFrom)}
      </button>
    );
  }

  // 既存: closed のキャッチオール (acceptsUntil 切れなど)
  // 注: cancelled / ended は上で個別 state として早期 return 済みなのでここでは含めない
  if (eventStatus === "closed") {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="register-state-closed"
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-border-strong px-4 text-sm font-semibold text-muted-foreground"
      >
        申込不可
      </button>
    );
  }

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/event/${eventId}`)}`}
        data-testid="register-state-not-logged-in"
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
      >
        ログインして参加
      </Link>
    );
  }

  // ============ Approval Required (Luma 風) ============
  // 承認制: pending 申請中 → 「リクエスト送信済み (キャンセル可)」表示
  if (approvalRequired && mine && mine.approvalStatus === "pending") {
    return (
      <ActionForm
        action={cancelParticipation}
        toastMessage="ℹ︎ 申込をキャンセルしました"
        toastKind="info"
        className="mt-3"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <p
          className="mb-2 text-xs font-semibold text-amber-700"
          data-testid="approval-pending-label"
        >
          承認待ち
        </p>
        <button
          type="submit"
          data-testid="register-state-cancel-approval-pending"
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
        >
          申込をキャンセル
        </button>
      </ActionForm>
    );
  }
  // 承認制: 過去に却下された
  if (approvalRequired && rejected && !mine) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="register-state-approval-rejected"
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-status-cancelled-soft px-4 text-sm font-semibold text-status-cancelled-fg"
      >
        却下されました
      </button>
    );
  }

  // 抽選方式 + 自分が pending
  if (mine && mine.status === "pending" && isLotteryRole) {
    const announceLabel =
      lotteryAnnounceAt != null
        ? `抽選申込中 (発表: ${formatLotteryAnnounceDate(lotteryAnnounceAt)})`
        : "抽選申込中";
    return (
      <ActionForm
        action={cancelParticipation}
        toastMessage="ℹ︎ 参加をキャンセルしました"
        toastKind="info"
        className="mt-3"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <p
          className="mb-2 text-xs font-semibold text-brand-orange"
          data-testid="lottery-pending-label"
        >
          {announceLabel}
        </p>
        <button
          type="submit"
          data-testid="register-state-cancel-pending"
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
        >
          申込をキャンセル
        </button>
      </ActionForm>
    );
  }

  // 既に同枠で参加中
  if (mine && mine.status === "accepted") {
    return (
      <ActionForm
        action={cancelParticipation}
        toastMessage="ℹ︎ 参加をキャンセルしました"
        toastKind="info"
        className="mt-3"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <button
          type="submit"
          data-testid="register-state-cancel-accepted"
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
        >
          参加をキャンセル
        </button>
      </ActionForm>
    );
  }

  if (mine && mine.status === "waiting") {
    return (
      <ActionForm
        action={cancelParticipation}
        toastMessage="ℹ︎ 参加をキャンセルしました"
        toastKind="info"
        className="mt-3"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <p className="mb-2 text-xs font-semibold text-brand-orange">
          補欠登録中
          {mine.waitingPosition != null
            ? ` (補欠 ${mine.waitingPosition} 番)`
            : ""}
        </p>
        <button
          type="submit"
          data-testid="register-state-cancel-waiting"
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
        >
          補欠登録をキャンセル
        </button>
      </ActionForm>
    );
  }

  // 別枠で参加中: この枠の申込は不可
  if (mine) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        data-testid="register-state-other-role"
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-border-strong px-4 text-sm font-semibold text-muted-foreground"
      >
        他の枠で申込済み
      </button>
    );
  }

  // Survey 付きの場合は /apply に遷移する Link (Server Action ではなく GET)
  // Survey 無しの場合は従来通り joinEvent Server Action で直接申込
  const applyHref = `/event/${eventId}/apply?eventRoleId=${eventRoleId}`;

  // 抽選方式の通常申込
  if (isLotteryRole) {
    if (hasSurvey) {
      return (
        <Link
          href={applyHref}
          data-testid="register-state-lottery"
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          抽選に申し込む
        </Link>
      );
    }
    return (
      <ActionForm
        action={joinEvent}
        toastMessage="✓ 参加申込しました"
        toastKind="success"
        className="mt-3"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="eventRoleId" value={eventRoleId} />
        <button
          type="submit"
          data-testid="register-state-lottery"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          抽選に申し込む
        </button>
      </ActionForm>
    );
  }

  // 通常 / 満員 (fcfs)
  // 承認制の場合は「参加リクエストを送信」テキストに差し替え
  const applyLabel = approvalRequired
    ? "参加リクエストを送信"
    : full
      ? "補欠登録する"
      : "参加申込";
  if (hasSurvey) {
    return (
      <Link
        href={applyHref}
        data-testid={full ? "register-state-waitlist" : "register-state-open"}
        className={
          full
            ? "mt-3 inline-flex h-9 w-full items-center justify-center rounded-md border border-brand-orange bg-surface px-4 text-sm font-semibold text-brand-orange hover:bg-brand-orange-soft"
            : "mt-3 inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        }
      >
        {applyLabel}
      </Link>
    );
  }
  // 通常 (free / on_site) - 既存挙動
  // 有料 + Stripe 有効なら joinPaidEvent (Stripe Checkout に redirect)
  if (usePaidCheckout) {
    return (
      <form action={joinPaidEvent} className="mt-3">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="eventRoleId" value={eventRoleId} />
        <button
          type="submit"
          data-testid="register-state-paid"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        >
          決済して参加申込
        </button>
      </form>
    );
  }

  return (
    <ActionForm
      action={joinEvent}
      toastMessage={
        approvalRequired ? "✓ 参加リクエストを送信しました" : "✓ 参加申込しました"
      }
      toastKind="success"
      className="mt-3"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="eventRoleId" value={eventRoleId} />
      <button
        type="submit"
        data-testid={
          approvalRequired
            ? "register-state-approval-request"
            : full
              ? "register-state-waitlist"
              : "register-state-open"
        }
        className={
          full
            ? "inline-flex h-9 w-full items-center justify-center rounded-md border border-brand-orange bg-surface px-4 text-sm font-semibold text-brand-orange hover:bg-brand-orange-soft"
            : "inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover"
        }
      >
        {applyLabel}
      </button>
    </ActionForm>
  );
}

function ShareBox({
  eventTitle,
  eventId,
  shareUrl,
  coverImageUrl,
}: {
  eventTitle: string;
  eventId: string;
  shareUrl: string;
  coverImageUrl: string | null;
}) {
  const path = `/event/${eventId}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    eventTitle,
  )}&url=${encodeURIComponent(path)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    path,
  )}`;
  return (
    <section aria-labelledby="share-heading">
      <h2
        id="share-heading"
        className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
      >
        シェア
      </h2>
      {/* 既存ボタン (削除せず保持) */}
      <ul className="mb-2 flex gap-2">
        <li>
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (旧 Twitter) で共有"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-brand-orange-soft"
          >
            X
          </a>
        </li>
        <li>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook で共有"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-brand-orange-soft"
          >
            Facebook
          </a>
        </li>
      </ul>
      {/* Luma 参考: 統合シェアモーダルを起動するトリガー */}
      <ShareModal
        eventTitle={eventTitle}
        shareUrl={shareUrl}
        coverImageUrl={coverImageUrl}
        triggerClassName="w-full"
        triggerLabel="シェア (QR / 埋め込み / コピー)"
      />
    </section>
  );
}

type ParticipantSummary = {
  id: string;
  eventRoleId: string;
  appliedAt: string;
  status: ParticipantStatus;
  user: {
    id: string;
    nickname: string;
    displayName: string;
    avatarUrl?: string;
  };
};

/** 参加者タブセクション */
function ParticipantsSection({
  tab,
  counts,
  participants,
  roles,
  eventId,
  locale,
}: {
  tab: ParticipantStatus;
  counts: { accepted: number; waiting: number; cancelled: number };
  participants: ParticipantSummary[];
  roles: Array<{ id: string; name: string }>;
  eventId: string;
  locale?: "ja" | "en";
}) {
  const roleById = new Map(roles.map((r) => [r.id, r] as const));
  return (
    <section className="mb-8" aria-labelledby="participants-heading">
      <h2
        id="participants-heading"
        className="mb-3 border-b border-border pb-2 text-xl font-bold text-foreground"
      >
        参加者
      </h2>

      <div
        role="tablist"
        aria-label="参加者ステータス"
        className="mb-4 flex gap-1 border-b border-border"
      >
        <ParticipantTab
          eventId={eventId}
          tab="accepted"
          active={tab === "accepted"}
          label="参加者"
          count={counts.accepted}
        />
        <ParticipantTab
          eventId={eventId}
          tab="waiting"
          active={tab === "waiting"}
          label="補欠"
          count={counts.waiting}
        />
        <ParticipantTab
          eventId={eventId}
          tab="cancelled"
          active={tab === "cancelled"}
          label="キャンセル"
          count={counts.cancelled}
        />
      </div>

      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {participants.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            {tab === "accepted"
              ? "まだ参加者はいません。"
              : tab === "waiting"
                ? "補欠の方はいません。"
                : "キャンセルはありません。"}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {participants.map((p) => {
              const role = roleById.get(p.eventRoleId);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
                >
                  <ParticipantBadge
                    nickname={p.user.displayName}
                    avatarUrl={p.user.avatarUrl}
                    profileUrl={`/user/${p.user.nickname}`}
                    size="md"
                  />
                  <div className="flex-1 text-xs text-muted-foreground">
                    {role && <p>{role.name}</p>}
                    <time dateTime={p.appliedAt}>
                      {formatDateLocale(p.appliedAt, locale ?? "ja")}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function ParticipantTab({
  eventId,
  tab,
  active,
  label,
  count,
}: {
  eventId: string;
  tab: ParticipantStatus;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      role="tab"
      id={`tab-${tab}`}
      href={`/event/${eventId}?tab=${tab}`}
      aria-selected={active}
      className={
        active
          ? "border-b-2 border-brand-orange px-4 py-2 text-sm font-semibold text-brand-orange"
          : "border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {label} <span aria-hidden="true">({count})</span>
      <span className="sr-only">{count}人</span>
    </Link>
  );
}

type CommentSummary = {
  id: string;
  body: string;
  createdAt: string;
  parentCommentId: string | null;
  user: {
    id: string;
    nickname: string;
    displayName: string;
    avatarUrl?: string;
  };
};

function CommentsSection({
  eventId,
  currentUserId,
  comments,
  locale,
}: {
  eventId: string;
  currentUserId: string | null;
  comments: CommentSummary[];
  locale?: "ja" | "en";
}) {
  // 1 階層のみの返信構造に組み立てる
  const roots = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = new Map<string, CommentSummary[]>();
  for (const c of comments) {
    if (c.parentCommentId) {
      const arr = repliesByParent.get(c.parentCommentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentCommentId, arr);
    }
  }

  return (
    <section className="mb-8" aria-labelledby="comments-heading">
      <h2
        id="comments-heading"
        className="mb-3 border-b border-border pb-2 text-xl font-bold text-foreground"
      >
        コメント
      </h2>

      {/* 投稿フォーム */}
      {currentUserId ? (
        <ActionForm
          action={postComment}
          toastMessage="✓ コメント投稿しました"
          toastKind="success"
          className="mb-6 flex flex-col gap-2 rounded-md border border-border bg-surface p-4"
          data-testid="comment-post-form"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <label htmlFor="comment-body" className="sr-only">
            コメント本文
          </label>
          <textarea
            id="comment-body"
            name="body"
            required
            rows={3}
            maxLength={2000}
            placeholder="コメントを書く..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover sm:w-40 sm:self-end"
          >
            投稿
          </button>
        </ActionForm>
      ) : (
        <p className="mb-6 rounded-md border border-dashed border-border bg-surface p-4 text-center text-sm text-muted-foreground">
          <Link
            href={`/login?next=${encodeURIComponent(`/event/${eventId}`)}`}
            className="text-link hover:underline"
          >
            ログインしてコメント
          </Link>
        </p>
      )}

      {roots.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          まだコメントはありません。
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {roots.map((c) => {
            const replies = repliesByParent.get(c.id) ?? [];
            return (
              <li
                key={c.id}
                className="rounded-md border border-border bg-surface p-4"
                data-testid={`comment-${c.id}`}
              >
                <CommentItem
                  eventId={eventId}
                  comment={c}
                  currentUserId={currentUserId}
                  locale={locale}
                />
                {/* 返信 (1 階層のみ) */}
                {replies.length > 0 && (
                  <ol className="mt-3 flex flex-col gap-3 border-l border-border pl-4">
                    {replies.map((r) => (
                      <li key={r.id} data-testid={`comment-${r.id}`}>
                        <CommentItem
                          eventId={eventId}
                          comment={r}
                          currentUserId={currentUserId}
                          locale={locale}
                        />
                      </li>
                    ))}
                  </ol>
                )}
                {/* 返信フォーム */}
                {currentUserId && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-link hover:underline">
                      返信する
                    </summary>
                    <ActionForm
                      action={postComment}
                      toastMessage="✓ コメント投稿しました"
                      toastKind="success"
                      className="mt-2 flex flex-col gap-2"
                      data-testid={`reply-form-${c.id}`}
                    >
                      <input type="hidden" name="eventId" value={eventId} />
                      <input
                        type="hidden"
                        name="parentCommentId"
                        value={c.id}
                      />
                      <textarea
                        name="body"
                        required
                        rows={2}
                        maxLength={2000}
                        placeholder="返信を書く..."
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-8 w-fit items-center justify-center rounded-md bg-brand-orange px-3 text-xs font-semibold text-white hover:bg-brand-orange-hover"
                      >
                        返信を投稿
                      </button>
                    </ActionForm>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function CommentItem({
  eventId,
  comment: c,
  currentUserId,
  locale,
}: {
  eventId: string;
  comment: CommentSummary;
  currentUserId: string | null;
  locale?: "ja" | "en";
}) {
  const isOwn = currentUserId && currentUserId === c.user.id;
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <ParticipantBadge
          nickname={c.user.displayName}
          avatarUrl={c.user.avatarUrl}
          profileUrl={`/user/${c.user.nickname}`}
          size="sm"
        />
        <time
          dateTime={c.createdAt}
          className="ml-auto text-xs text-muted-foreground"
        >
          {formatDateLocale(c.createdAt, locale ?? "ja")}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
      {isOwn && (
        <form action={deleteComment} className="mt-2">
          <input type="hidden" name="commentId" value={c.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <button
            type="submit"
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-xs text-muted-foreground hover:text-status-cancelled-bg"
            data-testid={`delete-comment-${c.id}`}
          >
            削除
          </button>
        </form>
      )}
    </>
  );
}

/* ============================================================
 * BookmarkBox / CalendarBox
 * ============================================================ */

function BookmarkBox({
  eventId,
  loggedIn,
  isBookmarked,
}: {
  eventId: string;
  loggedIn: boolean;
  isBookmarked: boolean;
}) {
  return (
    <section aria-labelledby="bookmark-heading">
      <h2
        id="bookmark-heading"
        className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
      >
        ブックマーク
      </h2>
      {!loggedIn ? (
        <Link
          href={`/login?next=${encodeURIComponent(`/event/${eventId}`)}`}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
          data-testid="bookmark-login-link"
        >
          <HeartIcon filled={false} />
          ログインしてブックマーク
        </Link>
      ) : isBookmarked ? (
        <ActionForm
          action={unbookmarkEvent}
          toastMessage="ℹ︎ ブックマークを解除しました"
          toastKind="info"
          data-testid="bookmark-form-on"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <button
            type="submit"
            aria-pressed="true"
            data-testid="bookmark-button"
            data-bookmarked="true"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-brand-orange bg-brand-orange-soft px-4 text-sm font-semibold text-brand-orange hover:bg-brand-orange-soft"
          >
            <HeartIcon filled />
            ブックマーク中
          </button>
        </ActionForm>
      ) : (
        <ActionForm
          action={bookmarkEvent}
          toastMessage="♡ ブックマークしました"
          toastKind="success"
          data-testid="bookmark-form-off"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <button
            type="submit"
            aria-pressed="false"
            data-testid="bookmark-button"
            data-bookmarked="false"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
          >
            <HeartIcon filled={false} />
            ブックマークする
          </button>
        </ActionForm>
      )}
    </section>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CalendarBox({
  eventId,
  eventTitle,
  description,
  location,
  startedAt,
  endedAt,
}: {
  eventId: string;
  eventTitle: string;
  description: string;
  location: string;
  startedAt: Date;
  endedAt: Date;
}) {
  const gcalDates = `${formatIcsDateUtc(startedAt)}/${formatIcsDateUtc(endedAt)}`;
  const gcalParams = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle,
    dates: gcalDates,
    details: description,
    location,
  });
  const gcalUrl = `https://www.google.com/calendar/render?${gcalParams.toString()}`;

  return (
    <section aria-labelledby="calendar-heading">
      <h2
        id="calendar-heading"
        className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
      >
        カレンダーに追加
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        <li>
          <a
            href={`/event/${eventId}/ics`}
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
            data-testid="ics-download-link"
          >
            カレンダーに追加 (.ics)
          </a>
        </li>
        <li>
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-brand-orange-soft"
            data-testid="gcal-link"
          >
            Google カレンダーに追加
          </a>
        </li>
      </ul>
    </section>
  );
}

/* ============================================================
 * Pure helpers
 * ============================================================ */

function parseTab(raw: string | undefined): ParticipantStatus {
  if (raw === "waiting" || raw === "cancelled") return raw;
  return "accepted";
}

function parseHashTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter((t) => t.length > 0);
}

/** schema.org Event の JSON-LD を生成 */
function buildEventJsonLd({
  event,
  groupName,
  ownerDisplayName,
  accepted,
}: {
  event: {
    title: string;
    catchPhrase: string | null;
    description: string | null;
    startedAt: Date;
    endedAt: Date;
    eventFormat: string;
    status: string;
    place: string | null;
    address: string | null;
    onlineUrl: string | null;
    coverImageUrl: string | null;
    capacity: number | null;
  };
  groupName: string;
  ownerDisplayName: string;
  accepted: number;
}) {
  const attendanceMode =
    event.eventFormat === "online"
      ? "https://schema.org/OnlineEventAttendanceMode"
      : event.eventFormat === "hybrid"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode";

  const eventStatus =
    event.status === "cancelled"
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled";

  const location =
    event.eventFormat === "online"
      ? {
          "@type": "VirtualLocation",
          url: event.onlineUrl ?? undefined,
        }
      : {
          "@type": "Place",
          name: event.place ?? groupName,
          address: event.address ?? undefined,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.catchPhrase ?? event.description ?? undefined,
    startDate: event.startedAt.toISOString(),
    endDate: event.endedAt.toISOString(),
    eventAttendanceMode: attendanceMode,
    eventStatus,
    location,
    organizer: {
      "@type": "Organization",
      name: groupName,
    },
    performer: {
      "@type": "Person",
      name: ownerDisplayName,
    },
    image: event.coverImageUrl ?? undefined,
    offers:
      event.capacity != null
        ? {
            "@type": "Offers",
            availability:
              accepted >= event.capacity
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
          }
        : undefined,
  };
}
