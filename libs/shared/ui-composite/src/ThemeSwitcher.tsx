"use client";

/**
 * ThemeSwitcher — テーマ / コントラスト / 書字方向の切替 DropdownMenu。
 *
 * 元は `Header.tsx` 内の `ThemeToggle` として埋め込まれていたが、
 * `useTheme()` (React Context) に依存する Client Component なので、
 * Header の Server/Client 分割 (code-quality.md High #11) に合わせて
 * 独立 Component として切り出した。
 *
 * - 依存: `ThemeProvider` (React Context)
 * - Trigger は `Button` (icon, ghost variant)
 * - menu 内に Theme (light/dark/system) / Contrast (normal/more) / Dir (ltr/rtl) を含む
 */

import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Contrast,
  ArrowLeftRight,
} from "lucide-react";

import { Button } from "@tech-event/shared-ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@tech-event/shared-ui";

import {
  useTheme,
  type Theme,
  type Contrast as ContrastType,
} from "./ThemeProvider";

type Dir = "ltr" | "rtl";
const DIR_STORAGE_KEY = "tech-event:dir";

/**
 * 書字方向 (dir = ltr | rtl) の管理。
 *
 * - `<html dir="…">` 属性を切替
 * - localStorage `tech-event:dir` に保存
 * - mount 時にだけ復元 (hydration mismatch 回避: SSR では常に LTR)
 */
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

export type ThemeSwitcherLabels = {
  ariaLabel: string;
  themeHeading: string;
  contrastHeading: string;
  dirHeading: string;
  light: string;
  dark: string;
  system: string;
  contrastNormal: string;
  contrastMore: string;
  dirLtr: string;
  dirRtl: string;
};

const DEFAULT_LABELS: ThemeSwitcherLabels = {
  ariaLabel: "テーマを切り替え",
  themeHeading: "テーマ",
  contrastHeading: "コントラスト",
  dirHeading: "方向",
  light: "ライト",
  dark: "ダーク",
  system: "システム",
  contrastNormal: "通常",
  contrastMore: "High Contrast",
  dirLtr: "LTR (左→右)",
  dirRtl: "RTL (右→左)",
};

export default function ThemeSwitcher({
  labels: labelsProp,
}: {
  labels?: ThemeSwitcherLabels;
} = {}) {
  const labels = labelsProp ?? DEFAULT_LABELS;
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
          aria-label={labels.ariaLabel}
          data-testid="header-theme-toggle"
          className="hover:bg-brand-orange-soft"
        >
          <Icon aria-hidden="true" className="h-5 w-5 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{labels.themeHeading}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as Theme)}
        >
          <DropdownMenuRadioItem value="light" data-testid="theme-light">
            <Sun aria-hidden="true" className="me-2 h-4 w-4" />
            {labels.light}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" data-testid="theme-dark">
            <Moon aria-hidden="true" className="me-2 h-4 w-4" />
            {labels.dark}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" data-testid="theme-system">
            <Monitor aria-hidden="true" className="me-2 h-4 w-4" />
            {labels.system}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{labels.contrastHeading}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={contrast}
          onValueChange={(v) => setContrast(v as ContrastType)}
        >
          <DropdownMenuRadioItem value="normal" data-testid="contrast-normal">
            <Sun aria-hidden="true" className="me-2 h-4 w-4" />
            {labels.contrastNormal}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="more" data-testid="contrast-more">
            <Contrast aria-hidden="true" className="me-2 h-4 w-4" />
            {labels.contrastMore}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{labels.dirHeading}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={dir}
          onValueChange={(v) => setDir(v as Dir)}
        >
          <DropdownMenuRadioItem value="ltr" data-testid="dir-ltr">
            <ArrowLeftRight aria-hidden="true" className="me-2 h-4 w-4" />
            {labels.dirLtr}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="rtl" data-testid="dir-rtl">
            <ArrowLeftRight
              aria-hidden="true"
              className="me-2 h-4 w-4 rtl-flip"
            />
            {labels.dirRtl}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
