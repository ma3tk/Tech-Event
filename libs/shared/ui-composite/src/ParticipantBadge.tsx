import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import { Avatar, AvatarImage, AvatarFallback } from "@tech-event/shared-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tech-event/shared-ui";

/**
 * ParticipantBadge は 2 通りの呼び出し方をサポートする:
 *
 * 1. 直接プロパティ (`nickname`, `avatarUrl`, `profileUrl`) で個別に指定
 * 2. `user={{ nickname, displayName?, avatarUrl?, ... }}` のように
 *    ユーザーオブジェクトをまとめて渡す
 *
 * 加えて、参加者リストでの利用を想定して `appliedAt` / `ticketName` /
 * `status` を補助メタとして表示することもできる (任意)。
 *
 * `iconOnly=true` のときはアバターのみを描画し、ニックネームを Tooltip で
 * ホバー時に表示する (アバターだけだと誰が誰だか分からない問題への対処)。
 */
type UserLike = {
  id?: string | number;
  nickname: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type Common = {
  /** サイズ */
  size?: "sm" | "md" | "lg";
  /** ニックネームを非表示にしてアバターだけ表示 */
  iconOnly?: boolean;
  /** 申込日 (ISO8601) を補助表示 */
  appliedAt?: string;
  /** 参加枠名 (任意の補助テキスト) */
  ticketName?: string;
  /** 参加ステータス (任意の補助テキスト) */
  status?: string;
  className?: string;
};

type DirectProps = Common & {
  /** 表示名/ニックネーム */
  nickname: string;
  /** アバター画像 URL (未指定なら User アイコン) */
  avatarUrl?: string | null;
  /** プロフィールページ URL (指定時は `<Link>` で描画) */
  profileUrl?: string;
  user?: undefined;
};

type UserObjProps = Common & {
  user: UserLike;
  nickname?: never;
  avatarUrl?: never;
  profileUrl?: string;
};

export type ParticipantBadgeProps = DirectProps | UserObjProps;

const AVATAR_SIZES = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

const TEXT_SIZES = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

/**
 * 参加者を 1 人分表示する小型 UI (アバター + ニックネーム)。
 * 主催者表示、参加者リスト、コメント著者などで使う。
 *
 * 内部のアバターは `ui/Avatar` + `AvatarImage` + `AvatarFallback` 構成。
 * `iconOnly` モードのときは `ui/Tooltip` で hover/focus 時にニックネームを表示。
 */
export default function ParticipantBadge(props: ParticipantBadgeProps) {
  const {
    size = "md",
    iconOnly = false,
    appliedAt,
    ticketName,
    status,
    profileUrl,
    className,
  } = props;

  // user prop と nickname/avatarUrl 直指定の両方をサポート
  const nickname =
    "user" in props && props.user
      ? props.user.displayName || props.user.nickname
      : (props as DirectProps).nickname;
  const avatarUrl =
    "user" in props && props.user
      ? props.user.avatarUrl ?? undefined
      : (props as DirectProps).avatarUrl ?? undefined;

  const avatar = (
    <Avatar
      className={cn(
        "border border-border bg-brand-orange-soft text-brand-orange",
        AVATAR_SIZES[size],
      )}
    >
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="" loading="lazy" />
      ) : null}
      <AvatarFallback className="bg-brand-orange-soft text-brand-orange">
        <User aria-hidden="true" className="h-1/2 w-1/2" />
      </AvatarFallback>
    </Avatar>
  );

  const hasMeta = appliedAt || ticketName || status;

  const content = (
    <span
      className={cn(
        "inline-flex items-start gap-2",
        TEXT_SIZES[size],
        className,
      )}
    >
      {avatar}
      {iconOnly ? (
        <span className="sr-only">{nickname}</span>
      ) : (
        <span className="flex min-w-0 flex-col">
          <span className="font-medium text-foreground truncate max-w-[14rem]">
            {nickname}
          </span>
          {hasMeta && (
            <span className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
              {ticketName && <span>{ticketName}</span>}
              {status && <span>{status}</span>}
              {appliedAt && (
                <time dateTime={appliedAt}>{formatAppliedAt(appliedAt)}</time>
              )}
            </span>
          )}
        </span>
      )}
    </span>
  );

  const link = profileUrl ? (
    <Link
      href={profileUrl}
      aria-label={`${nickname} のプロフィール`}
      className="inline-block hover:text-brand-orange"
    >
      {content}
    </Link>
  ) : null;

  // iconOnly モード: ニックネームを Tooltip で表示する。
  // (sr-only は維持しつつ、視覚利用者にはホバーでフォロー)
  if (iconOnly) {
    const trigger = link ?? content;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {trigger}
        </TooltipTrigger>
        <TooltipContent>{nickname}</TooltipContent>
      </Tooltip>
    );
  }

  return link ?? content;
}

function formatAppliedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} 申込`;
}
