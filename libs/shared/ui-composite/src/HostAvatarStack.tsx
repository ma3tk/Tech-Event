/**
 * HostAvatarStack
 *
 * Luma の共催文化 (co-host) を参考にした、重ねアバター表示コンポーネント。
 * イベント詳細ページの「主催者 + 共催者」列で利用する。
 *
 * - 各アバターを `-ml-2` (8px) で重ね、最初の 1 つを除き白枠 (ring-2) を付与
 * - `maxVisible` を超えた人数は "+N" のチップで省略
 * - 親要素に `aria-label="主催: 山田 太郎, 佐藤 花子 ほか 2 名"` を集約してスクリーン
 *   リーダーに伝える
 * - `profileUrl` 指定時は各アバターを `<Link>` で包んで遷移可能にする
 * - avatarUrl が無い場合は氏名先頭 1 文字 + 氏名 hash 由来の HSL カラーで自動生成
 *
 * Server Component から渡されたデータをそのまま描画する純粋プレゼンテーション。
 *
 * 内部のアバターは `ui/Avatar` + `AvatarImage` + `AvatarFallback` 構成。
 * `ui/Tooltip` で hover/focus 時に氏名 (+ 肩書き) を浮かせる。
 */
import Link from "next/link";
import { cn } from "@tech-event/shared-util-cn";
import { Avatar, AvatarImage, AvatarFallback } from "@tech-event/shared-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tech-event/shared-ui";

/** ホスト 1 人分のデータ */
export type HostAvatarHost = {
  /** 表示名 */
  name: string;
  /** アバター画像 URL (未指定なら頭文字フォールバック) */
  avatarUrl?: string | null;
  /** プロフィール URL。指定すると `<Link>` で囲む */
  profileUrl?: string;
  /** 主催者/共催者などの肩書き (省略可)。aria-label の文に混ぜない補助テキスト */
  role?: string;
};

export type HostAvatarStackProps = {
  hosts: HostAvatarHost[];
  /** 一覧で表示する最大人数。これを超えた分は "+N" にまとめる (デフォルト 5) */
  maxVisible?: number;
  /** サイズ (sm=28px / md=36px / lg=48px) */
  size?: "sm" | "md" | "lg";
  /** "主催: ..." のような前置きラベル。指定時はアイコン横に表示 */
  label?: string;
  /** 横に氏名サマリを並べる (例: "山田 太郎 ほか 2 名") */
  showNames?: boolean;
  className?: string;
};

const SIZE_CLASS = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

/** 氏名 → 0-359 の HSL hue。同じ名前は常に同じ色 */
function hashHue(name: string): number {
  let acc = 0;
  for (const ch of name) acc = (acc + ch.charCodeAt(0)) % 360;
  return acc;
}

/** "山田 太郎, 佐藤 花子 ほか 2 名" のような文字列 */
function formatHostNames(hosts: HostAvatarHost[]): string {
  if (hosts.length === 0) return "";
  if (hosts.length === 1) return hosts[0]!.name;
  if (hosts.length === 2) return `${hosts[0]!.name}, ${hosts[1]!.name}`;
  const first = hosts.slice(0, 2).map((h) => h.name).join(", ");
  return `${first} ほか ${hosts.length - 2} 名`;
}

/** aria-label 用に全員の名前を列挙 */
function buildAriaLabel(hosts: HostAvatarHost[]): string {
  if (hosts.length === 0) return "主催者なし";
  return `主催: ${hosts.map((h) => h.name).join(", ")}`;
}

/**
 * HostAvatarStack 本体。
 *
 * 描画される DOM 構造:
 *   <div role="group" aria-label="主催: ...">
 *     <ul class="flex"> -- 視覚的にも順序付きの集合
 *       <li><a>...avatar</a></li> ...
 *       <li>+N</li>
 *     </ul>
 *     [showNames] <p>主催 by ...</p>
 *   </div>
 */
export default function HostAvatarStack({
  hosts,
  maxVisible = 5,
  size = "md",
  label,
  showNames = false,
  className,
}: HostAvatarStackProps) {
  if (hosts.length === 0) return null;

  const visible = hosts.slice(0, maxVisible);
  const overflow = Math.max(0, hosts.length - visible.length);
  const sizeClass = SIZE_CLASS[size];
  const ariaLabel = buildAriaLabel(hosts);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-testid="host-avatar-stack"
      className={cn("flex items-center gap-3", className)}
    >
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}
      <ul className="flex items-center">
        {visible.map((host, idx) => (
          <li
            key={`${host.name}-${idx}`}
            // 1 つ目は重ねない / 2 つ目以降を 8px 重ねる
            className={cn(idx > 0 && "-ml-2")}
          >
            <AvatarChip host={host} sizeClass={sizeClass} />
          </li>
        ))}
        {overflow > 0 && (
          <li className={cn(visible.length > 0 && "-ml-2")}>
            <span
              aria-hidden="true"
              data-testid="host-avatar-overflow"
              className={cn(
                sizeClass,
                "inline-flex items-center justify-center rounded-full bg-border-strong font-semibold text-foreground ring-2 ring-surface",
              )}
            >
              +{overflow}
            </span>
          </li>
        )}
      </ul>
      {showNames && (
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">主催: </span>
          <span className="font-semibold">{formatHostNames(hosts)}</span>
        </p>
      )}
    </div>
  );
}

/**
 * 単一アバター (Link で包むか否か)。
 *
 * - `ui/Avatar` + `AvatarFallback` を採用。背景色は氏名 hash 由来の HSL を
 *   AvatarFallback の `style` で上書きする (Tailwind 任意色は使えないため)。
 * - 氏名 + 肩書きを `ui/Tooltip` で hover/focus 時に表示。
 */
function AvatarChip({
  host,
  sizeClass,
}: {
  host: HostAvatarHost;
  sizeClass: string;
}) {
  const tooltipLabel = host.role ? `${host.name} (${host.role})` : host.name;

  const avatar = (
    <Avatar
      className={cn(
        sizeClass,
        "ring-2 ring-surface",
      )}
    >
      {host.avatarUrl ? (
        <AvatarImage src={host.avatarUrl} alt={host.name} />
      ) : null}
      <AvatarFallback
        // 任意色のため Tailwind class ではなく inline style で hue を当てる
        className="font-semibold text-white"
        style={{ backgroundColor: `hsl(${hashHue(host.name)} 65% 50%)` }}
      >
        {host.name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );

  const inner = host.profileUrl ? (
    <Link
      href={host.profileUrl}
      title={tooltipLabel}
      aria-label={tooltipLabel}
      className="inline-block transition-transform hover:z-10 hover:scale-110 focus:z-10 focus:scale-110 focus:outline-none"
    >
      {avatar}
    </Link>
  ) : (
    <span
      title={tooltipLabel}
      aria-label={tooltipLabel}
      role="img"
      className="inline-block"
    >
      {avatar}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}
