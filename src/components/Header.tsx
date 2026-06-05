"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Bell,
  User,
  Sun,
  Moon,
  Monitor,
  Contrast,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import SearchBox from "./SearchBox";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme, type Contrast as ContrastType } from "./ThemeProvider";

/**
 * Header に渡すログイン済みユーザー情報。
 *
 * - DB の `User.id` は `BigInt` 由来なので、Client Component の boundary を越える際は
 *   必ず文字列化してから渡すこと。
 * - `unreadNotificationCount` は省略 = 0 と同じ扱い。99 を超えると `99+` 表示にクランプされる。
 * - `avatarUrl` 未指定時はデフォルトの User アイコン (lucide) を描画する。
 */
export type HeaderUser = {
  /** ユーザー ID (BigInt 由来の文字列化済み値) */
  id: string;
  /** ログイン名 / ニックネーム */
  nickname: string;
  /** アバター画像 URL (未指定時は User アイコン) */
  avatarUrl?: string;
  /** 未読通知数 (省略 = 0)。99 を超えると `99+` 表示。 */
  unreadNotificationCount?: number;
};

/**
 * `<Header>` の Props。
 *
 * - 全フィールドが optional のため、Storybook や未ログインのテストでは `<Header />` だけで動作する。
 * - Server Component から呼び出す場合は通常 `HeaderServer` 経由を推奨 (`getCurrentUser()` を解決済み)。
 */
/**
 * Header に渡す翻訳済みラベル群。Server で解決した辞書を Client に流し込む。
 * 未指定時は日本語のフォールバックを使う。
 */
export type HeaderLabels = {
  explore: string;
  discover: string;
  groups: string;
  calendars: string;
  ranking: string;
  pricing: string;
  login: string;
  signup: string;
  createEvent: string;
  notifications: string;
  dashboard: string;
  profile: string;
  settings: string;
  logout: string;
};

const DEFAULT_LABELS: HeaderLabels = {
  explore: "イベントを探す",
  discover: "Discover",
  groups: "グループ",
  calendars: "カレンダー",
  ranking: "ランキング",
  pricing: "料金プラン",
  login: "ログイン",
  signup: "新規登録",
  createEvent: "イベントを作る",
  notifications: "通知",
  dashboard: "ダッシュボード",
  profile: "プロフィール",
  settings: "設定",
  logout: "ログアウト",
};

export type HeaderProps = {
  /** ログイン済みユーザー (未指定 / `null` = 未ログイン扱い) */
  user?: HeaderUser | null;
  /** ヘッダー検索ボックスの初期値 (例: `/search?q=...` の `q` を引き継ぐ) */
  searchQuery?: string;
  /** i18n 済みラベル (HeaderServer から渡される)。未指定なら日本語デフォルト。 */
  labels?: HeaderLabels;
  /** 現在の locale (LanguageSwitcher 初期値用) */
  locale?: "ja" | "en";
};

type NavLink = { label: string; href: string };
function buildNavLinks(labels: HeaderLabels): NavLink[] {
  return [
    { label: labels.explore, href: "/explore" },
    { label: labels.discover, href: "/discover" },
    { label: labels.groups, href: "/series" },
    { label: labels.calendars, href: "/calendars" },
    { label: labels.ranking, href: "/ranking" },
    { label: labels.pricing, href: "/pricing" },
  ];
}

/**
 * グローバルヘッダー。
 *
 * - ロゴ (テキスト "tech-event") をトップへのリンクとして表示
 * - 中央に検索ボックス、右側にナビゲーション + アカウント領域
 * - モバイル幅 (<768px) ではハンバーガーメニューに集約 (E2E が
 *   `data-testid="header-mobile-menu"` の `data-open` 属性を見ているため、
 *   Sheet primitive (Radix Portal) ではなくインラインドロワーで実装)
 * - 未ログイン時はログイン/新規登録ボタン、ログイン時はベル + アバター
 *   (アカウントメニューは `ui/DropdownMenu`)
 * - 通知ベルの隣にダークモード切替 (`light/dark/system`) を `ui/DropdownMenu` で
 *   配置。`useTheme()` の値を radio 選択で同期。
 */
export default function Header({
  user = null,
  searchQuery,
  labels: labelsProp,
  locale,
}: HeaderProps) {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const labels = labelsProp ?? DEFAULT_LABELS;
  const NAV_LINKS = buildNavLinks(labels);

  // モバイルメニュー展開中は背景スクロールを止める。
  // (`useEffect` で `document.body.style.overflow` を切替)
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isMobileOpen]);

  const unread = user?.unreadNotificationCount ?? 0;

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full bg-surface border-b border-border"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:h-16 md:px-6">
        {/* ハンバーガー (モバイルのみ) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-brand-orange-soft"
          aria-label={isMobileOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {isMobileOpen ? (
            <X aria-hidden="true" className="h-6 w-6" />
          ) : (
            <Menu aria-hidden="true" className="h-6 w-6" />
          )}
        </Button>

        {/* ロゴ */}
        <Link
          href="/"
          className="flex items-center font-bold text-brand-orange hover:text-brand-orange-hover transition-colors"
          aria-label="tech-event トップへ"
        >
          <span className="text-xl md:text-2xl tracking-tight">tech-event</span>
        </Link>

        {/* 検索ボックス (md 以上で表示) */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <SearchBox defaultValue={searchQuery} />
        </div>

        {/* デスクトップナビ */}
        <nav
          aria-label="グローバルナビゲーション"
          className="hidden md:flex items-center"
        >
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-foreground hover:text-brand-orange hover:bg-brand-orange-soft transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* アカウント領域 */}
        <div className="ms-auto md:ms-0 flex items-center gap-2">
          {user ? (
            <LoggedInAccount user={user} labels={labels} locale={locale} />
          ) : (
            <LoggedOutActions labels={labels} locale={locale} />
          )}
        </div>
      </div>

      {/* モバイル展開メニュー (インラインドロワー: E2E が data-open を見ている) */}
      <div
        id="mobile-menu"
        data-testid="header-mobile-menu"
        data-open={isMobileOpen ? "true" : "false"}
        className={cn(
          "md:hidden border-t border-border bg-surface",
          // 展開時は画面いっぱいに広げて body スクロールと競合しないように
          // (一覧が長くてもメニュー内スクロールで賄う)
          isMobileOpen
            ? "fixed inset-x-0 top-14 z-40 block max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            : "hidden",
        )}
      >
        <div className="px-4 py-3">
          <SearchBox defaultValue={searchQuery} />
        </div>
        <nav aria-label="モバイルナビゲーション" className="pb-3">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center px-4 py-3 text-base font-medium text-foreground hover:bg-brand-orange-soft hover:text-brand-orange"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link
                    href="/event/create"
                    data-testid="header-create-event-mobile"
                    className="flex items-center border-t border-border px-4 py-3 text-base font-semibold text-brand-red hover:bg-brand-orange-soft"
                    onClick={() => setMobileOpen(false)}
                  >
                    {labels.createEvent}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notifications"
                    data-testid="header-notification-bell-mobile"
                    className="flex items-center justify-between px-4 py-3 text-base font-medium text-foreground hover:bg-brand-orange-soft"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Bell aria-hidden="true" className="h-5 w-5" />
                      {labels.notifications}
                    </span>
                    {unread > 0 && (
                      <span
                        data-testid="header-unread-badge-mobile"
                        aria-hidden="true"
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1.5 text-xs font-bold text-white"
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    data-testid="header-account-mobile"
                    className="flex items-center gap-2 px-4 py-3 text-base font-medium text-foreground hover:bg-brand-orange-soft"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserAvatar user={user} size="sm" />
                    {user.nickname}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center border-t border-border px-4 py-3 text-base font-medium text-foreground hover:bg-brand-orange-soft"
                    onClick={() => setMobileOpen(false)}
                  >
                    {labels.login}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="flex items-center px-4 py-3 text-base font-medium text-brand-orange hover:bg-brand-orange-soft"
                    onClick={() => setMobileOpen(false)}
                  >
                    {labels.signup}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function LoggedOutActions({
  labels,
  locale,
}: {
  labels: HeaderLabels;
  locale?: "ja" | "en";
}) {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Button asChild variant="ghost" size="sm" className="h-9 px-3">
        <Link href="/login">{labels.login}</Link>
      </Button>
      <Button asChild variant="default" size="sm" className="h-9 px-4">
        <Link href="/signup">{labels.signup}</Link>
      </Button>
      <LanguageSwitcher initialLocale={locale} />
      <ThemeToggle />
    </div>
  );
}

function LoggedInAccount({
  user,
  labels,
  locale,
}: {
  user: HeaderUser;
  labels: HeaderLabels;
  locale?: "ja" | "en";
}) {
  const unread = user.unreadNotificationCount ?? 0;
  return (
    <div className="flex items-center gap-1">
      {/* イベント作成リンク (デスクトップのみ): 本家連動の赤背景 */}
      <Button
        asChild
        variant="destructive"
        size="sm"
        // 旧見た目: h-9 / px-3 / font-semibold / shadow-sm
        className="hidden md:inline-flex h-9 px-3 font-semibold shadow-sm"
      >
        <Link href="/event/create" data-testid="header-create-event">
          {labels.createEvent}
        </Link>
      </Button>

      {/* 通知ベル: Tooltip 付き */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/notifications"
            data-testid="header-notification-bell"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-orange-soft transition-colors"
            aria-label={
              unread > 0
                ? `${labels.notifications} (${unread})`
                : labels.notifications
            }
          >
            <Bell aria-hidden="true" className="h-5 w-5 text-foreground" />
            {unread > 0 && (
              <span
                data-testid="header-unread-badge"
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          {unread > 0
            ? `${labels.notifications} (${unread})`
            : labels.notifications}
        </TooltipContent>
      </Tooltip>

      {/* 言語切替 */}
      <LanguageSwitcher initialLocale={locale} />

      {/* ダークモード切替: 通知ベルの隣 */}
      <ThemeToggle />

      {/* アカウントメニュー (DropdownMenu) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full px-1 hover:bg-brand-orange-soft transition-colors"
            aria-label={`${user.nickname} のメニュー`}
          >
            <UserAvatar user={user} size="md" />
            <span className="sr-only">{user.nickname}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.nickname}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">{labels.dashboard}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.id}`}>{labels.profile}</Link>
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
    </div>
  );
}

/** ユーザーアバター (デフォルト Lucide User アイコン or 画像) */
function UserAvatar({
  user,
  size,
}: {
  user: HeaderUser;
  size: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <Avatar className={cn("border border-border bg-brand-orange-soft", dim)}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-brand-orange-soft text-brand-orange">
        <User aria-hidden="true" className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * テーマ切替ボタン。
 *
 * - `useTheme()` から現在の theme (light/dark/system) と contrast (normal/more) を取得
 * - `ui/DropdownMenu` の RadioGroup で 3 択 (テーマ) + 2 択 (コントラスト)
 * - トリガーは `ui/Button` (icon size、ghost variant)
 * - High Contrast 有効中はトリガーアイコンを `Contrast` に切替
 */
/**
 * 書字方向 (dir = ltr | rtl) の管理。
 *
 * - `<html dir="…">` 属性を切替
 * - localStorage `tech-event:dir` に保存
 * - mount 時にだけ復元 (hydration mismatch 回避: SSR では常に LTR)
 *
 * RTL の対応範囲は最小 (Header / Breadcrumb / Pagination)。詳細は
 * `Design System / RTL` (RTL.mdx) 参照。
 */
type Dir = "ltr" | "rtl";
const DIR_STORAGE_KEY = "tech-event:dir";

function useDirection(): {
  dir: Dir;
  setDir: (next: Dir) => void;
} {
  const [dir, setDirState] = useState<Dir>("ltr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: Dir | null = null;
    try {
      const v = window.localStorage.getItem(DIR_STORAGE_KEY);
      if (v === "ltr" || v === "rtl") stored = v;
    } catch {
      /* localStorage 無効 — LTR フォールバック */
    }
    if (stored) {
      setDirState(stored);
      document.documentElement.setAttribute("dir", stored);
    }
  }, []);

  const setDir = (next: Dir) => {
    setDirState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", next);
    }
    try {
      window.localStorage.setItem(DIR_STORAGE_KEY, next);
    } catch {
      /* 書き込み失敗は無視 */
    }
  };

  return { dir, setDir };
}

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, contrast, setContrast } = useTheme();
  const { dir, setDir } = useDirection();
  const Icon =
    contrast === "more" ? Contrast : resolvedTheme === "dark" ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="テーマを切り替え"
          data-testid="header-theme-toggle"
          className="hover:bg-brand-orange-soft"
        >
          <Icon aria-hidden="true" className="h-5 w-5 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>テーマ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as Theme)}
        >
          <DropdownMenuRadioItem value="light" data-testid="theme-light">
            <Sun aria-hidden="true" className="me-2 h-4 w-4" />
            ライト
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" data-testid="theme-dark">
            <Moon aria-hidden="true" className="me-2 h-4 w-4" />
            ダーク
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" data-testid="theme-system">
            <Monitor aria-hidden="true" className="me-2 h-4 w-4" />
            システム
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>コントラスト</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={contrast}
          onValueChange={(v) => setContrast(v as ContrastType)}
        >
          <DropdownMenuRadioItem value="normal" data-testid="contrast-normal">
            <Sun aria-hidden="true" className="me-2 h-4 w-4" />
            通常
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="more" data-testid="contrast-more">
            <Contrast aria-hidden="true" className="me-2 h-4 w-4" />
            High Contrast
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>方向</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={dir}
          onValueChange={(v) => setDir(v as Dir)}
        >
          <DropdownMenuRadioItem value="ltr" data-testid="dir-ltr">
            <ArrowLeftRight aria-hidden="true" className="me-2 h-4 w-4" />
            LTR (左→右)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="rtl" data-testid="dir-rtl">
            <ArrowLeftRight
              aria-hidden="true"
              className="me-2 h-4 w-4 rtl-flip"
            />
            RTL (右→左)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
