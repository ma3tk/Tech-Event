"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * テーマ管理コンテキスト
 *
 * - `theme`        : ユーザーが選んだ値 ("light" | "dark" | "system")
 * - `resolvedTheme`: 実際に適用されている値 ("light" | "dark")
 *                    `theme === "system"` のとき OS 設定で解決される。
 * - `setTheme`     : 切り替え関数。localStorage に保存し、
 *                    `<html data-theme>` を更新する。
 * - `contrast`     : "normal" | "more" — 「High Contrast」モードのスイッチ。
 *                    `"more"` のとき `<html data-contrast="more">` を付与し、
 *                    src/styles/themes/high-contrast.css の WCAG AAA 強制
 *                    オーバーライドが効く。
 * - `setContrast`  : contrast 切替関数。localStorage に保存。
 *
 * 設計メモ:
 *   - SSR では window が無いので、初期値は "system" / "normal" を返す。
 *     実際の data-theme / data-contrast 設定は `useEffect` 内で mount 後に行う。
 *     これにより hydration mismatch を発生させない。
 *   - localStorage キーは `tech-event:theme` / `tech-event:contrast`。
 *   - `prefers-color-scheme` の変化は MediaQueryList で監視し、
 *     `theme === "system"` のときだけ resolvedTheme を再評価する。
 *   - `prefers-contrast: more` は data-contrast が未設定 (= "normal" でも
 *     "more" でもない) のとき CSS 側で自動追従する。
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type Contrast = "normal" | "more";

const STORAGE_KEY = "tech-event:theme";
const CONTRAST_STORAGE_KEY = "tech-event:contrast";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  contrast: Contrast;
  setContrast: (contrast: Contrast) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    /* localStorage が無効 (Safari private 等) — system にフォールバック */
  }
  return "system";
}

function readStoredContrast(): Contrast {
  if (typeof window === "undefined") return "normal";
  try {
    const value = window.localStorage.getItem(CONTRAST_STORAGE_KEY);
    if (value === "more" || value === "normal") {
      return value;
    }
  } catch {
    /* localStorage 無効 — normal にフォールバック */
  }
  return "normal";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

/**
 * `data-contrast` 属性を `<html>` に適用 / 解除する。
 *
 * - `"more"` → `<html data-contrast="more">` を付ける (CSS が高コントラスト発動)
 * - `"normal"` → 属性を明示的に `"normal"` にする
 *   (CSS 側で `prefers-contrast: more` の自動追従を抑えるため、未設定ではなく
 *    `"normal"` を明示する。)
 */
function applyContrast(contrast: Contrast) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-contrast", contrast);
}

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * SSR で `<html data-theme>` を出さない設計のため、初期描画はサーバ側で
   * light として描画される。必要に応じて変更可能。
   */
  defaultTheme?: Theme;
  /**
   * 初期コントラスト。デフォルトは "normal" だが、ユーザー OS が
   * `prefers-contrast: more` を返す場合は CSS 側で自動追従するため、
   * mount 前の SSR 段階では特に何もしない。
   */
  defaultContrast?: Contrast;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultContrast = "normal",
}: ThemeProviderProps) {
  /*
   * 初期値:
   *   - SSR / 初回 hydration では `defaultTheme` (= "system") と
   *     `defaultContrast` (= "normal") を使う。
   *   - mount 後に localStorage から読み直し、resolvedTheme と
   *     `<html data-theme>` / `<html data-contrast>` を反映する。
   *
   * これによりサーバーが返す HTML とクライアント初回 render は完全に一致し、
   * hydration mismatch が起きない。
   */
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [contrast, setContrastState] = useState<Contrast>(defaultContrast);

  /* ---- mount 時に localStorage / OS 設定を反映 ---- */
  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = stored === "system" ? getSystemTheme() : stored;
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    const storedContrast = readStoredContrast();
    setContrastState(storedContrast);
    applyContrast(storedContrast);
  }, []);

  /* ---- system 設定が変わったときの追従 ---- */
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved: ResolvedTheme = mql.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    // Safari < 14 では addEventListener が無いので addListener にフォールバック
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [theme]);

  /* ---- 公開 setter ---- */
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 書き込み失敗は無視 (private mode 等) */
    }
    const resolved: ResolvedTheme =
      next === "system" ? getSystemTheme() : next;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const setContrast = useCallback((next: Contrast) => {
    setContrastState(next);
    try {
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, next);
    } catch {
      /* 書き込み失敗は無視 */
    }
    applyContrast(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, contrast, setContrast }),
    [theme, resolvedTheme, setTheme, contrast, setContrast],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * useTheme — テーマの取得 / 切り替え
 *
 * Provider の外で呼ばれた場合は、安全側に倒して "light" / "normal" を返す
 * (Server Component / テストでの誤用時にクラッシュさせない設計)。
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => {
        /* no-op outside provider */
      },
      contrast: "normal",
      setContrast: () => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}
