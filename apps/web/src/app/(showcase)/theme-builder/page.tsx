/**
 * Theme Builder プレイグラウンド (`/theme-builder`)
 *
 * - インタラクティブ UI: ブランド色 (color picker) / 角丸 (slider) / フォントサイズ (slider)
 * - 右側にサンプルカード / ボタン / バッジ / 入力フォームのリアルタイムプレビュー
 * - 設定は `localStorage[tech-event:theme-builder]` に保存
 * - 「適用」「リセット」ボタン
 * - CSS 変数は本ページ内の `<style data-theme-builder>` で動的注入 (= スコープを
 *   `[data-theme-builder-scope]` に限定し、グローバルへの副作用を避ける)
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "tech-event:theme-builder";

type ThemeBuilderState = {
  brandColor: string;
  brandHoverColor: string;
  radius: number; // px
  fontSize: number; // %
};

const DEFAULTS: ThemeBuilderState = {
  brandColor: "#c2410c",
  brandHoverColor: "#9a3412",
  radius: 4,
  fontSize: 100,
};

function readStored(): ThemeBuilderState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ThemeBuilderState>;
    return {
      brandColor: parsed.brandColor ?? DEFAULTS.brandColor,
      brandHoverColor: parsed.brandHoverColor ?? DEFAULTS.brandHoverColor,
      radius: typeof parsed.radius === "number" ? parsed.radius : DEFAULTS.radius,
      fontSize:
        typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULTS.fontSize,
    };
  } catch {
    return DEFAULTS;
  }
}

export default function ThemeBuilderPage() {
  // draft = エディタ上の値 (まだ保存されていないかも)
  // applied = 「適用」ボタンで localStorage に保存された値
  const [draft, setDraft] = useState<ThemeBuilderState>(DEFAULTS);
  const [applied, setApplied] = useState<ThemeBuilderState>(DEFAULTS);

  useEffect(() => {
    const stored = readStored();
    setDraft(stored);
    setApplied(stored);
  }, []);

  const styleVars = useMemo(
    () => buildCssVars(draft),
    [draft],
  );

  const handleApply = () => {
    setApplied(draft);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* 書き込み失敗は無視 */
    }
  };

  const handleReset = () => {
    setDraft(DEFAULTS);
    setApplied(DEFAULTS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* 削除失敗は無視 */
    }
  };

  const isDirty =
    draft.brandColor !== applied.brandColor ||
    draft.brandHoverColor !== applied.brandHoverColor ||
    draft.radius !== applied.radius ||
    draft.fontSize !== applied.fontSize;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Theme Builder</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ブランド色・角丸・フォントサイズを差し替えて、主要 primitive のリアルタイムプレビューを確認できます。
          設定は <code>localStorage</code> に保存され、次回もこのページで復元されます。
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        {/* ============ 左: エディタ ============ */}
        <aside
          aria-label="テーマ設定エディタ"
          className="rounded-lg border border-border bg-surface p-5"
        >
          <h2 className="text-base font-semibold">設定</h2>

          <div className="mt-5 space-y-5">
            <div>
              <Label htmlFor="tb-brand">ブランド色</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="tb-brand"
                  type="color"
                  value={draft.brandColor}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandColor: e.target.value }))
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0"
                  aria-label="ブランド色を選択"
                />
                <Input
                  value={draft.brandColor}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandColor: e.target.value }))
                  }
                  aria-label="ブランド色 (HEX)"
                  className="h-9"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                例: <code>#c2410c</code> (connpass オレンジ)
              </p>
            </div>

            <div>
              <Label htmlFor="tb-brand-hover">ブランド色 (hover)</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="tb-brand-hover"
                  type="color"
                  value={draft.brandHoverColor}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      brandHoverColor: e.target.value,
                    }))
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0"
                  aria-label="ブランド hover 色を選択"
                />
                <Input
                  value={draft.brandHoverColor}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      brandHoverColor: e.target.value,
                    }))
                  }
                  aria-label="ブランド色 hover (HEX)"
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tb-radius">角丸 ({draft.radius}px)</Label>
              <input
                id="tb-radius"
                type="range"
                min={0}
                max={24}
                step={1}
                value={draft.radius}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, radius: Number(e.target.value) }))
                }
                className="mt-1 w-full"
                aria-valuemin={0}
                aria-valuemax={24}
                aria-valuenow={draft.radius}
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0px (シャープ)</span>
                <span>24px (ピル)</span>
              </div>
            </div>

            <div>
              <Label htmlFor="tb-font">フォントサイズ ({draft.fontSize}%)</Label>
              <input
                id="tb-font"
                type="range"
                min={80}
                max={140}
                step={5}
                value={draft.fontSize}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    fontSize: Number(e.target.value),
                  }))
                }
                className="mt-1 w-full"
                aria-valuemin={80}
                aria-valuemax={140}
                aria-valuenow={draft.fontSize}
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>80% (コンパクト)</span>
                <span>140% (アクセシブル)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              type="button"
              onClick={handleApply}
              disabled={!isDirty}
              data-testid="theme-builder-apply"
            >
              適用
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              data-testid="theme-builder-reset"
            >
              リセット
            </Button>
          </div>

          {isDirty && (
            <p
              className="mt-3 text-xs text-muted-foreground"
              data-testid="theme-builder-dirty"
            >
              プレビューは即時更新されています。「適用」を押すと localStorage に保存します。
            </p>
          )}
        </aside>

        {/* ============ 右: プレビュー ============ */}
        <section
          aria-label="プレビュー"
          data-theme-builder-scope
          style={styleVars}
        >
          <style data-theme-builder>{previewScopeCss}</style>

          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-base font-semibold text-foreground">プレビュー</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ブランド色 / 角丸 / フォントサイズが下記コンポーネントに即時反映されます。
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {/* ボタン */}
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </CardContent>
              </Card>

              {/* バッジ */}
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Open</Badge>
                  <Badge variant="warning">Waitlist</Badge>
                  <Badge variant="info">Upcoming</Badge>
                </CardContent>
              </Card>

              {/* 入力 */}
              <Card>
                <CardHeader>
                  <CardTitle>Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="tb-demo-email">メールアドレス</Label>
                      <Input
                        id="tb-demo-email"
                        type="email"
                        placeholder="you@example.com"
                        className="mt-1"
                      />
                    </div>
                    <Button className="w-full">送信</Button>
                  </div>
                </CardContent>
              </Card>

              {/* イベントカード風 */}
              <Card>
                <CardHeader>
                  <CardTitle>Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    React パフォーマンス勉強会 vol.12
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    2026-07-15 (水) 19:30〜
                  </p>
                  <Badge className="mt-2" variant="success">
                    募集中
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * draft の値を CSS 変数オブジェクトに変換 (style attribute 用)。
 * `style={styleVars}` で <section> 配下のみに適用される。
 */
function buildCssVars(s: ThemeBuilderState): React.CSSProperties {
  return {
    // brand 色をオーバーライド
    ["--brand-orange" as string]: s.brandColor,
    ["--brand-orange-hover" as string]: s.brandHoverColor,
    ["--brand-orange-strong" as string]: s.brandColor,
    // radius (control = button / input)
    ["--radius-control" as string]: `${s.radius}px`,
    ["--radius-card" as string]: `${s.radius + 4}px`,
    ["--radius-md" as string]: `${s.radius}px`,
    ["--radius-lg" as string]: `${s.radius + 4}px`,
    // フォントサイズ (% で base を変える)
    fontSize: `${s.fontSize}%`,
  } as React.CSSProperties;
}

/**
 * `[data-theme-builder-scope]` 内の要素にだけ、Tailwind ユーティリティが
 * 参照する `--radius-*` を CSS 変数で上書きする。グローバルに `--radius-*`
 * を書き換えるとヘッダー等にも影響するため、必ずスコープを限定する。
 */
const previewScopeCss = `
[data-theme-builder-scope] .rounded-md { border-radius: var(--radius-md); }
[data-theme-builder-scope] .rounded-lg { border-radius: var(--radius-lg); }
[data-theme-builder-scope] .rounded-full { border-radius: 9999px; }
`;
