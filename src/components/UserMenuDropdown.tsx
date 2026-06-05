"use client";

/**
 * UserMenuDropdown — ログイン済みユーザーのアバター + ドロップダウンメニュー。
 *
 * 元は `Header.tsx` 内の `LoggedInAccount` 末尾にあった DropdownMenu を独立化。
 * Radix DropdownMenu が Client Component を要求するため `"use client"` で
 * 切り出しているが、Header 本体 (静的部分) は Server Component 化できる。
 *
 * Props:
 *   - `userId`        : リンク `/users/{userId}` の組み立て用 (BigInt 文字列)
 *   - `nickname`      : メニュー先頭のラベル + sr-only テキスト
 *   - `avatarUrl`     : 未指定なら Lucide User アイコン
 *   - `labels`        : dashboard / profile / settings / logout の翻訳済みラベル
 */

import Link from "next/link";
import { User } from "lucide-react";

import { cn } from "@/lib/cn";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type UserMenuDropdownLabels = {
  dashboard: string;
  profile: string;
  settings: string;
  logout: string;
};

export type UserMenuDropdownProps = {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  labels: UserMenuDropdownLabels;
};

export default function UserMenuDropdown({
  userId,
  nickname,
  avatarUrl,
  labels,
}: UserMenuDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full px-1 hover:bg-brand-orange-soft transition-colors"
          aria-label={`${nickname} のメニュー`}
        >
          <UserMenuAvatar avatarUrl={avatarUrl} size="md" />
          <span className="sr-only">{nickname}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{nickname}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">{labels.dashboard}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/users/${userId}`}>{labels.profile}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">{labels.settings}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/logout">{labels.logout}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenuAvatar({
  avatarUrl,
  size,
}: {
  avatarUrl?: string;
  size: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <Avatar className={cn("border border-border bg-brand-orange-soft", dim)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-brand-orange-soft text-brand-orange">
        <User aria-hidden="true" className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}
