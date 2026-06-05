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
    default:
      return `通知 (${kind})`;
  }
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
  // ブックマーク
  if (kind.startsWith("bookmark")) return "heart";
  // イベント / カレンダー
  if (kind === "event_published") return "calendar";
  if (kind.startsWith("event")) return "calendar";
  if (kind.startsWith("calendar")) return "calendar";
  // 表彰 / ランキング
  if (kind.startsWith("award") || kind.startsWith("ranking")) return "award";
  return "bell";
}
