import Link from "next/link";
import { Users, Calendar } from "lucide-react";
import { cn } from "@tech-event/shared-util-cn";
import type { SerializedGroup } from "@/types/event";
import { Card } from "@tech-event/shared-ui";
import { Avatar, AvatarImage, AvatarFallback } from "@tech-event/shared-ui";
import { Button } from "@tech-event/shared-ui";

/**
 * GroupCard で受け取れる最低限のグループ情報。
 *
 * - `SerializedGroup` をそのまま渡しても OK
 * - 別途 `logoUrl` を明示したい場合はそれが最優先される
 *   (thumbnailUrl / coverImageUrl は fallback)
 * - `url` を渡すと詳細ページ URL を上書きできる
 */
export type GroupCardData = Pick<
  SerializedGroup,
  "id" | "name" | "memberCount" | "eventCount"
> & {
  /** サブドメイン (詳細ページの URL 構築に使用)。省略時は href を渡すこと。 */
  subdomain?: string;
  description?: string | null;
  /** ロゴ URL の明示指定。thumbnailUrl/coverImageUrl より優先される。 */
  logoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  subtitle?: string | null;
  /** 詳細ページ URL。指定があれば subdomain より優先 */
  url?: string;
};

export type GroupCardProps = {
  group: GroupCardData;
  /**
   * 表示バリアント。
   * - `standard`: 一覧用の通常サイズ
   * - `sidebar` / `compact`: 省スペース版 (どちらも同じ見た目)
   */
  variant?: "standard" | "sidebar" | "compact";
  /** 詳細ページ URL。デフォルトは `/group/{subdomain}` */
  href?: string;
  /** 現在ユーザーが参加済みか (参加ボタンの表示切り替え) */
  isJoined?: boolean;
  /** 参加ボタンの押下ハンドラ */
  onJoinToggle?: () => void;
  className?: string;
};

/**
 * グループ (シリーズ) カード。
 *
 * - `standard`: ロゴ + 説明 + 統計 + 参加ボタン (一覧用)
 * - `sidebar`: ロゴ + 名前 + 統計のみ (サイドバー用)
 *
 * 入力データは `SerializedGroup` 互換 (description が `string | null` でも可)。
 *
 * 内部実装は `ui/Card` (rounded-lg/border/bg-surface/shadow-sm) をベースに、
 * ロゴは `ui/Avatar`、参加ボタンは `ui/Button` の variant=default/secondary で実装。
 */
export default function GroupCard({
  group,
  variant = "standard",
  href,
  isJoined = false,
  onJoinToggle,
  className,
}: GroupCardProps) {
  const url =
    href ??
    group.url ??
    (group.subdomain ? `/group/${group.subdomain}` : `/group/${group.id}`);
  const titleId = `grp-${group.id}-name`;
  const logoUrl =
    group.logoUrl ?? group.thumbnailUrl ?? group.coverImageUrl ?? null;

  if (variant === "sidebar" || variant === "compact") {
    return (
      <Card
        role="article"
        aria-labelledby={titleId}
        // ui/Card は p-0 ベース。compact は rounded-md + p-3 に上書き
        className={cn(
          "flex items-center gap-3 rounded-md p-3 transition-shadow hover:shadow-sm",
          className,
        )}
      >
        <GroupLogo name={group.name} logoUrl={logoUrl} url={url} size="sm" />
        <div className="min-w-0 flex-1">
          <h3
            id={titleId}
            className="text-sm font-bold text-foreground truncate"
          >
            <Link href={url} className="hover:text-brand-orange hover:underline">
              {group.name}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden="true" className="h-3 w-3" />
              {new Intl.NumberFormat("ja-JP").format(group.memberCount)}人
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar aria-hidden="true" className="h-3 w-3" />
              {new Intl.NumberFormat("ja-JP").format(group.eventCount)}回
            </span>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      role="article"
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-4 p-5 sm:flex-row",
        "transition-all hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      <GroupLogo name={group.name} logoUrl={logoUrl} url={url} />

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <h3
          id={titleId}
          className="text-lg font-bold text-foreground hover:text-brand-orange transition-colors"
        >
          <Link href={url} className="hover:underline">
            {group.name}
          </Link>
        </h3>

        {group.subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {group.subtitle}
          </p>
        )}

        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        )}

        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <dt className="sr-only">メンバー</dt>
            <Users aria-hidden="true" className="h-4 w-4" />
            <dd aria-label={`メンバー ${group.memberCount}人`}>
              {new Intl.NumberFormat("ja-JP").format(group.memberCount)}人
            </dd>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dt className="sr-only">開催回数</dt>
            <Calendar aria-hidden="true" className="h-4 w-4" />
            <dd aria-label={`開催回数 ${group.eventCount}回`}>
              {new Intl.NumberFormat("ja-JP").format(group.eventCount)}回開催
            </dd>
          </div>
        </dl>

        <div className="flex justify-end">
          <Button
            type="button"
            aria-pressed={isJoined}
            onClick={onJoinToggle}
            variant={isJoined ? "secondary" : "default"}
            size="sm"
            // 既存スナップショット維持のため h-9 / px-4 を踏襲 (Button size=sm は h-8/px-3)
            className="h-9 px-4 text-sm font-medium"
          >
            {isJoined ? "参加中" : "グループに参加"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** グループロゴ (`ui/Avatar` ベース、四角形に切り替え) */
function GroupLogo({
  name,
  logoUrl,
  url,
  size = "md",
}: {
  name: string;
  logoUrl: string | null;
  url?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-12 w-12" : "h-24 w-24 sm:h-28 sm:w-28";
  // ui/Avatar は rounded-full 既定。GroupCard のロゴは rounded-lg + 四角枠の
  // ため className で上書きする (tailwind-merge が後勝ち)。
  const avatar = (
    <Avatar
      className={cn(
        "rounded-lg border border-border bg-surface",
        dim,
      )}
    >
      {logoUrl ? (
        <AvatarImage src={logoUrl} alt="" loading="lazy" className="object-cover" />
      ) : null}
      <AvatarFallback className="rounded-lg bg-brand-orange-soft text-brand-orange font-bold">
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );

  if (url) {
    return (
      <Link href={url} aria-label={`${name} の詳細`} className="shrink-0">
        {avatar}
      </Link>
    );
  }
  return <div className="shrink-0">{avatar}</div>;
}
