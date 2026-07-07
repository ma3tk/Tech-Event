/**
 * Notification 関連の表示ヘルパー。
 *
 * - `Notification.payload` は JSON 文字列。`parseNotificationPayload` で安全に
 *   オブジェクトに戻し、`formatNotificationText` で `kind` に応じた表示文を生成する。
 * - `NOTIFICATION_KINDS` には現状サポートする種別を列挙。
 */

export type NotificationKind =
  | "comment_posted"
  | "comment_replied"
  | "participant_joined"
  | "participant_cancelled"
  | "event_published"
  | "approval_requested"
  | "approval_result"
  | "lottery_result"
  | "promoted_from_waiting"
  | "reminder_24h"
  | "reminder_1h"
  | "new_comment"
  | "comment_reply"
  | "bookmark_event_started"
  | "group_message"
  | "host_direct_message"
  | "host_blast"
  | "join_confirmed"
  | "waitlisted"
  | "event_cancelled"
  | string;

/**
 * 通知設定 UI でユーザーに見せる kind 一覧。
 * 設定ページ (`/settings/notifications`) ではこの順に表示する。
 */
export const NOTIFICATION_KIND_KEYS = [
  "event_published",
  "lottery_result",
  "promoted_from_waiting",
  "reminder_24h",
  "reminder_1h",
  "new_comment",
  "comment_reply",
  "participant_joined",
  "participant_cancelled",
  "approval_requested",
  "approval_result",
  "bookmark_event_started",
  "group_message",
] as const;

export type NotificationKindKey = (typeof NOTIFICATION_KIND_KEYS)[number];

/** ユーザーに表示する kind ラベル */
export const NOTIFICATION_KIND_LABELS: Record<NotificationKindKey, string> = {
  event_published: "新着イベント",
  lottery_result: "抽選結果",
  promoted_from_waiting: "補欠繰上",
  reminder_24h: "開催 24 時間前リマインド",
  reminder_1h: "開催 1 時間前リマインド",
  new_comment: "新着コメント",
  comment_reply: "コメントへの返信",
  participant_joined: "参加申込 (主催イベント)",
  participant_cancelled: "参加キャンセル (主催イベント)",
  approval_requested: "承認制イベントの申請 (主催)",
  approval_result: "承認制イベントの承認/却下結果",
  bookmark_event_started: "ブックマークしたイベントの開始",
  group_message: "グループからの一斉メッセージ",
};

/** チャネル定義 */
export const NOTIFICATION_CHANNEL_KEYS = ["email", "in_app", "push"] as const;
export type NotificationChannelKey =
  (typeof NOTIFICATION_CHANNEL_KEYS)[number];
export const NOTIFICATION_CHANNEL_LABELS: Record<
  NotificationChannelKey,
  string
> = {
  email: "メール",
  in_app: "サイト内",
  push: "プッシュ",
};

/**
 * Server Action / Route Handler 内から呼ぶ汎用ヘルパー。
 * `NotificationPreference` を見て (kind, channel) が有効か判定する。
 * レコード無し = 既定 true。
 *
 * 注意: prisma の循環依存を避けるため、引数で tx/prisma client を受け取る形にする。
 */
export async function isNotificationKindEnabled(
  client: {
    notificationPreference: {
      findUnique: (args: {
        where: {
          userId_kind_channel: {
            userId: bigint;
            kind: string;
            channel: string;
          };
        };
      }) => Promise<{ enabled: boolean } | null>;
    };
  },
  userId: bigint,
  kind: string,
  channel: string,
): Promise<boolean> {
  try {
    const pref = await client.notificationPreference.findUnique({
      where: { userId_kind_channel: { userId, kind, channel } },
    });
    return pref ? pref.enabled : true;
  } catch {
    return true;
  }
}

export type NotificationPayload = {
  commenterDisplayName?: string;
  commenterUserId?: string;
  participantDisplayName?: string;
  participantUserId?: string;
  eventTitle?: string;
  excerpt?: string;
  /** host blast / direct message 用 */
  messageId?: string;
  subject?: string;
  /** reminder_24h / reminder_1h 用: イベント開始日時 (ISO 8601) */
  startedAt?: string;
  /** lottery_result 用: "won" | "lost" */
  lotteryResult?: "won" | "lost";
  /** approval_result 用: "approved" | "rejected" */
  approvalResult?: "approved" | "rejected";
  /** event_published / group_message 用: グループ名 */
  groupName?: string;
  /** event_cancelled / approval_result 用: 主催者からの理由・メモ */
  reason?: string;
};

/** JSON 文字列の payload を安全に object 化する。失敗時は空オブジェクト。 */
export function parseNotificationPayload(raw: string): NotificationPayload {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj as NotificationPayload;
  } catch {
    // fallthrough
  }
  return {};
}

/**
 * 通知種別ごとの表示文を生成する。
 *
 * 例:
 * - comment_posted: 「井上さんがイベントにコメントしました: "..."」
 * - participant_joined: 「井上さんがあなたのイベントに参加申込しました」
 */
export function formatNotificationText(
  kind: string,
  payload: NotificationPayload,
): string {
  switch (kind) {
    case "comment_posted": {
      const who = payload.commenterDisplayName ?? "誰か";
      const excerpt = payload.excerpt ? `: 「${payload.excerpt}」` : "";
      return `${who} さんがイベントにコメントしました${excerpt}`;
    }
    case "comment_replied": {
      const who = payload.commenterDisplayName ?? "誰か";
      const excerpt = payload.excerpt ? `: 「${payload.excerpt}」` : "";
      return `${who} さんがあなたのコメントに返信しました${excerpt}`;
    }
    case "participant_joined": {
      const who = payload.participantDisplayName ?? "誰か";
      return `${who} さんがあなたのイベントに参加申込しました`;
    }
    case "participant_cancelled": {
      const who = payload.participantDisplayName ?? "誰か";
      return `${who} さんがあなたのイベントの参加をキャンセルしました`;
    }
    case "event_published": {
      const title = payload.eventTitle ?? "新しいイベント";
      return `グループの新規イベント「${title}」が公開されました`;
    }
    case "host_blast": {
      const subject = payload.subject ?? "お知らせ";
      return `主催者からの一斉メッセージ: 「${subject}」`;
    }
    case "host_direct_message": {
      const subject = payload.subject ?? "お知らせ";
      return `主催者からのメッセージ: 「${subject}」`;
    }
    case "reminder_24h": {
      const title = payload.eventTitle ?? "参加予定のイベント";
      return `リマインダー: 「${title}」は 24 時間以内に開始します`;
    }
    case "reminder_1h": {
      const title = payload.eventTitle ?? "参加予定のイベント";
      return `リマインダー: 「${title}」はまもなく (1 時間以内に) 開始します`;
    }
    case "join_confirmed": {
      const title = payload.eventTitle ?? "イベント";
      return `「${title}」への参加申込が完了しました`;
    }
    case "waitlisted": {
      const title = payload.eventTitle ?? "イベント";
      return `「${title}」は満席のため補欠登録されました`;
    }
    case "lottery_result": {
      const title = payload.eventTitle ?? "イベント";
      return payload.lotteryResult === "won"
        ? `「${title}」の抽選に当選しました`
        : payload.lotteryResult === "lost"
          ? `「${title}」の抽選は落選となりました`
          : `「${title}」の抽選結果が確定しました`;
    }
    case "promoted_from_waiting": {
      const title = payload.eventTitle ?? "イベント";
      return `補欠だった「${title}」が繰り上がり、参加が確定しました`;
    }
    case "approval_result": {
      const title = payload.eventTitle ?? "イベント";
      return payload.approvalResult === "approved"
        ? `「${title}」への参加申請が承認されました`
        : payload.approvalResult === "rejected"
          ? `「${title}」への参加申請は承認されませんでした`
          : `「${title}」への参加申請の結果が届きました`;
    }
    case "event_cancelled": {
      const title = payload.eventTitle ?? "イベント";
      return `参加予定の「${title}」が中止になりました`;
    }
    case "group_message": {
      const group = payload.groupName ?? "グループ";
      const subject = payload.subject ?? "お知らせ";
      return `${group} からの一斉メッセージ: 「${subject}」`;
    }
    default:
      return `通知 (${kind})`;
  }
}

/* ============================================================
 * 開催前リマインダー (reminder_24h / reminder_1h)
 * ============================================================ */

/** リマインダー通知の kind (cron `run-reminders` が生成する)。 */
export const REMINDER_KINDS = ["reminder_24h", "reminder_1h"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

/** kind ごとの「開催何ミリ秒前からウィンドウに入るか」。 */
export const REMINDER_WINDOW_MS: Record<ReminderKind, number> = {
  reminder_24h: 24 * 60 * 60 * 1000,
  reminder_1h: 60 * 60 * 1000,
};

/**
 * リマインダーメールの件名・本文を組み立てる。
 *
 * - i18n 辞書は使わず日本語直書き (メールはサイト表示言語と独立のため)。
 * - `startedAt` は Asia/Tokyo で整形して本文に含める。
 */
export function buildReminderMailContent(params: {
  kind: ReminderKind;
  eventTitle: string;
  startedAt: Date;
  eventUrl: string;
}): { subject: string; text: string; html: string } {
  const { kind, eventTitle, startedAt, eventUrl } = params;
  const when = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startedAt);

  const lead =
    kind === "reminder_24h"
      ? "開催まであと 24 時間を切りました"
      : "開催まであと 1 時間を切りました";
  const subject =
    kind === "reminder_24h"
      ? `【リマインダー】明日開催: ${eventTitle}`
      : `【リマインダー】まもなく開催: ${eventTitle}`;

  const text = [
    `参加予定のイベント「${eventTitle}」の${lead}。`,
    "",
    `開始日時: ${when}`,
    `イベントページ: ${eventUrl}`,
    "",
    "参加をキャンセルする場合はイベントページから手続きしてください。",
    "このメールの受信設定は「設定 > 通知」から変更できます。",
  ].join("\n");

  const esc = (s: string): string =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = [
    `<p>参加予定のイベント「${esc(eventTitle)}」の${esc(lead)}。</p>`,
    `<p>開始日時: ${esc(when)}<br/>`,
    `イベントページ: <a href="${esc(eventUrl)}">${esc(eventUrl)}</a></p>`,
    `<p style="color:#666;font-size:12px">参加をキャンセルする場合はイベントページから手続きしてください。<br/>`,
    `このメールの受信設定は「設定 &gt; 通知」から変更できます。</p>`,
  ].join("\n");

  return { subject, text, html };
}

/* ============================================================
 * トランザクションメール本文ビルダー (Wave 2)
 *
 * 申込完了 / キャンセル / 抽選結果 / 繰上 / 承認結果 / イベント中止 /
 * グループ一斉メッセージ。i18n 辞書は使わず日本語直書き。
 * 呼び出し側 (feature-event / feature-host-dashboard / feature-group) は
 * これらを使ってメール本文を組み立て、`sendMail` に渡す。
 * ============================================================ */

/** メール本文中の HTML エスケープ。 */
export function escapeMailHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** JST でイベント日時を整形。 */
export function formatEventDateJst(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export type MailContent = { subject: string; text: string; html: string };

/**
 * 汎用ビルダー: リード文 + 明細行 + フッターから text/html を組み立てる。
 * `lines` は `[ラベル, 値]` か、単一文字列 (段落) を受ける。
 */
function buildMailBody(params: {
  subject: string;
  lead: string;
  lines: (string | [string, string])[];
  eventUrl?: string;
  footer?: string;
}): MailContent {
  const { subject, lead, lines, eventUrl, footer } = params;
  const esc = escapeMailHtml;
  const textLines: string[] = [lead, ""];
  const htmlParts: string[] = [`<p>${esc(lead)}</p>`];

  const detail: string[] = [];
  const detailHtml: string[] = [];
  for (const l of lines) {
    if (typeof l === "string") {
      if (detail.length) {
        textLines.push(...detail, "");
        htmlParts.push(`<p>${detailHtml.join("<br/>")}</p>`);
        detail.length = 0;
        detailHtml.length = 0;
      }
      textLines.push(l, "");
      htmlParts.push(`<p>${esc(l)}</p>`);
    } else {
      detail.push(`${l[0]}: ${l[1]}`);
      detailHtml.push(`${esc(l[0])}: ${esc(l[1])}`);
    }
  }
  if (detail.length) {
    textLines.push(...detail, "");
    htmlParts.push(`<p>${detailHtml.join("<br/>")}</p>`);
  }

  if (eventUrl) {
    textLines.push(`イベントページ: ${eventUrl}`, "");
    htmlParts.push(
      `<p>イベントページ: <a href="${esc(eventUrl)}">${esc(eventUrl)}</a></p>`,
    );
  }
  const foot =
    footer ?? "このメールの受信設定は「設定 > 通知」から変更できます。";
  textLines.push(foot);
  htmlParts.push(
    `<p style="color:#666;font-size:12px">${esc(foot)}</p>`,
  );

  return {
    subject,
    text: textLines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd(),
    html: htmlParts.join("\n"),
  };
}

/** 申込完了メール (.ics 添付は呼び出し側で付与)。 */
export function buildJoinConfirmedMailContent(params: {
  eventTitle: string;
  startedAt?: Date;
  venue?: string;
  eventUrl: string;
  roleName?: string;
}): MailContent {
  const { eventTitle, startedAt, venue, eventUrl, roleName } = params;
  const lines: (string | [string, string])[] = [];
  if (startedAt) lines.push(["開催日時", formatEventDateJst(startedAt)]);
  if (venue) lines.push(["会場", venue]);
  if (roleName) lines.push(["参加枠", roleName]);
  lines.push("添付の .ics ファイルからカレンダーに登録できます。");
  return buildMailBody({
    subject: `【参加申込完了】${eventTitle}`,
    lead: `イベント「${eventTitle}」への参加申込が完了しました。`,
    lines,
    eventUrl,
  });
}

/** 補欠登録メール。 */
export function buildWaitlistedMailContent(params: {
  eventTitle: string;
  eventUrl: string;
}): MailContent {
  return buildMailBody({
    subject: `【補欠登録】${params.eventTitle}`,
    lead: `イベント「${params.eventTitle}」は満席のため、補欠登録されました。キャンセルが出ると繰り上がります。`,
    lines: [],
    eventUrl: params.eventUrl,
  });
}

/** 参加キャンセル完了メール。 */
export function buildCancelMailContent(params: {
  eventTitle: string;
  eventUrl: string;
}): MailContent {
  return buildMailBody({
    subject: `【キャンセル完了】${params.eventTitle}`,
    lead: `イベント「${params.eventTitle}」の参加をキャンセルしました。`,
    lines: ["またのご参加をお待ちしています。"],
    eventUrl: params.eventUrl,
  });
}

/** 補欠繰上げメール。 */
export function buildPromotedMailContent(params: {
  eventTitle: string;
  startedAt?: Date;
  eventUrl: string;
}): MailContent {
  const lines: (string | [string, string])[] = [];
  if (params.startedAt)
    lines.push(["開催日時", formatEventDateJst(params.startedAt)]);
  lines.push("添付の .ics ファイルからカレンダーに登録できます。");
  return buildMailBody({
    subject: `【繰上当選】${params.eventTitle} への参加が確定しました`,
    lead: `補欠だったイベント「${params.eventTitle}」に空きが出て繰り上がり、参加が確定しました。`,
    lines,
    eventUrl: params.eventUrl,
  });
}

/** 抽選結果メール (当選 / 落選)。 */
export function buildLotteryResultMailContent(params: {
  eventTitle: string;
  result: "won" | "lost";
  startedAt?: Date;
  eventUrl: string;
}): MailContent {
  const won = params.result === "won";
  const lines: (string | [string, string])[] = [];
  if (won && params.startedAt)
    lines.push(["開催日時", formatEventDateJst(params.startedAt)]);
  lines.push(
    won
      ? "参加が確定しました。当日お待ちしています。"
      : "誠に残念ですが、今回はご参加いただけません。",
  );
  return buildMailBody({
    subject: won
      ? `【抽選結果: 当選】${params.eventTitle}`
      : `【抽選結果: 落選】${params.eventTitle}`,
    lead: won
      ? `イベント「${params.eventTitle}」の抽選に当選しました。`
      : `イベント「${params.eventTitle}」の抽選は落選となりました。`,
    lines,
    eventUrl: params.eventUrl,
  });
}

/** 承認制イベントの承認/却下結果メール。 */
export function buildApprovalResultMailContent(params: {
  eventTitle: string;
  result: "approved" | "rejected";
  reason?: string;
  eventUrl: string;
}): MailContent {
  const approved = params.result === "approved";
  const lines: (string | [string, string])[] = [];
  if (params.reason) lines.push(["主催者より", params.reason]);
  lines.push(
    approved
      ? "参加が確定しました。当日お待ちしています。"
      : "誠に残念ですが、今回はご参加いただけません。",
  );
  return buildMailBody({
    subject: approved
      ? `【承認されました】${params.eventTitle}`
      : `【承認されませんでした】${params.eventTitle}`,
    lead: approved
      ? `イベント「${params.eventTitle}」への参加申請が承認されました。`
      : `イベント「${params.eventTitle}」への参加申請は承認されませんでした。`,
    lines,
    eventUrl: params.eventUrl,
  });
}

/** イベント中止メール (参加者向け)。 */
export function buildEventCancelledMailContent(params: {
  eventTitle: string;
  reason?: string;
  eventUrl: string;
}): MailContent {
  const lines: (string | [string, string])[] = [];
  if (params.reason) lines.push(["中止理由", params.reason]);
  lines.push("ご参加予定でしたが、開催が中止となりました。ご了承ください。");
  return buildMailBody({
    subject: `【開催中止】${params.eventTitle}`,
    lead: `参加予定のイベント「${params.eventTitle}」が中止になりました。`,
    lines,
    eventUrl: params.eventUrl,
  });
}

/** グループ一斉メッセージ / 新着イベント通知メール。 */
export function buildGroupMessageMailContent(params: {
  groupName: string;
  subject: string;
  body: string;
  url?: string;
}): MailContent {
  return buildMailBody({
    subject: `【${params.groupName}】${params.subject}`,
    lead: `${params.groupName} からのお知らせです。`,
    lines: [params.body],
    eventUrl: params.url,
    footer:
      "このメールの受信設定はグループのメンバー設定から変更できます。",
  });
}

/**
 * 表示用の通知アイコン種別 (lucide-react コンポーネント名にマップする想定の論理キー)
 *
 * - comment      : `MessageCircle` (コメント投稿/返信)
 * - user-plus    : `UserPlus`      (参加申込)
 * - user-minus   : `UserMinus`     (参加キャンセル)
 * - heart        : `Heart`         (ブックマーク追加など)
 * - calendar     : `Calendar`      (イベント公開/カレンダー追加)
 * - award        : `Award`         (出席バッジ/ランキング表彰など)
 * - user         : `User`          (旧種別との後方互換)
 * - bell         : `Bell`          (汎用フォールバック)
 */
export type NotificationIconKind =
  | "comment"
  | "user"
  | "user-plus"
  | "user-minus"
  | "heart"
  | "calendar"
  | "award"
  | "bell";

/**
 * Notification.kind から表示アイコン種別を決定する。
 *
 * 未知の kind は "bell" にフォールバック。
 */
export function notificationIconKind(kind: string): NotificationIconKind {
  // コメント系
  if (kind === "comment_posted" || kind === "comment_replied") return "comment";
  if (kind.startsWith("comment")) return "comment";
  // 参加系
  if (kind === "participant_joined") return "user-plus";
  if (kind === "participant_cancelled") return "user-minus";
  if (kind.startsWith("participant")) return "user";
  if (kind === "join_confirmed" || kind === "promoted_from_waiting")
    return "user-plus";
  if (kind === "waitlisted" || kind === "approval_result") return "user";
  // 抽選
  if (kind === "lottery_result") return "award";
  // ブックマーク
  if (kind.startsWith("bookmark")) return "heart";
  // 開催前リマインダー
  if (kind.startsWith("reminder")) return "calendar";
  // イベント / カレンダー
  if (kind === "event_published") return "calendar";
  if (kind.startsWith("event")) return "calendar";
  if (kind.startsWith("calendar")) return "calendar";
  // 表彰 / ランキング
  if (kind.startsWith("award") || kind.startsWith("ranking")) return "award";
  return "bell";
}
