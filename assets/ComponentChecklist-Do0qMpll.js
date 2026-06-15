import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,p as i,s as a,u as o}from"./blocks-DSdAlscu.js";import{t as s}from"./mdx-react-shim-DaZ3R4gt.js";function c(e){let t={code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,input:`input`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(a,{title:`Design System/Component Checklist`}),`
`,(0,u.jsx)(r,{children:`Component Checklist`}),`
`,(0,u.jsx)(o,{children:`新規コンポーネント追加時の必須項目`}),`
`,(0,u.jsx)(t.p,{children:`新しいコンポーネントを追加するときに踏むべき手順と、レビュー時に確認するチェックリストをまとめています。
PR 前にこのページを開いて、すべての項目に「はい」と答えられることを確認してください。`}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`1-ファイル配置`,children:`1. ファイル配置`}),`
`,(0,u.jsxs)(t.table,{children:[(0,u.jsx)(t.thead,{children:(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.th,{children:`種別`}),(0,u.jsx)(t.th,{children:`配置先`}),(0,u.jsx)(t.th,{children:`ファイル名`})]})}),(0,u.jsxs)(t.tbody,{children:[(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`UI primitive (汎用 / Radix ラッパー)`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`src/components/ui/`})}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`kebab-case.tsx`}),` (例: `,(0,u.jsx)(t.code,{children:`dropdown-menu.tsx`}),`)`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`Composite component (ドメイン特化)`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`src/components/`})}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`PascalCase.tsx`}),` (例: `,(0,u.jsx)(t.code,{children:`EventCard.tsx`}),`)`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`Story`}),(0,u.jsx)(t.td,{children:`実装と同じディレクトリ`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`{Name}.stories.tsx`})})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`Server-side wrapper`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`src/components/`})}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`{Name}Server.tsx`}),` (例: `,(0,u.jsx)(t.code,{children:`HeaderServer.tsx`}),`)`]})]})]})]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`2-実装テンプレート-composite-component`,children:`2. 実装テンプレート (Composite component)`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * NewComponent — 簡潔な 1 行説明。
 *
 * - 機能 / レイアウトの要点
 * - 親から受け取る props の意味
 * - SSR / Client どちらを想定するか
 */
export interface NewComponentProps {
  title: string;
  description?: string;
  variant?: "default" | "compact";
  className?: string;
  children?: ReactNode;
}

export function NewComponent({
  title,
  description,
  variant = "default",
  className,
  children,
}: NewComponentProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-elevation-card",
        variant === "compact" && "p-3 text-sm",
        className,
      )}
    >
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
`})}),`
`,(0,u.jsx)(t.h3,{id:`規約`,children:`規約`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`default export ではなく named export`}),` を使う (`,(0,u.jsx)(t.code,{children:`export function ...`}),`)。
Story 側で型推論しやすく、tree-shake もしやすい。`]}),`
`,(0,u.jsxs)(t.li,{children:[`props 型は同名 + `,(0,u.jsx)(t.code,{children:`Props`}),` で `,(0,u.jsx)(t.code,{children:`export`}),` する (`,(0,u.jsx)(t.code,{children:`NewComponentProps`}),`)。`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`className`}),` を受け取り、`,(0,u.jsx)(t.code,{children:`cn()`}),` で merge する (`,(0,u.jsx)(t.code,{children:`tailwind-merge`}),` 経由)。`]}),`
`,(0,u.jsxs)(t.li,{children:[`色 / spacing / radius / shadow はすべて `,(0,u.jsx)(t.strong,{children:`semantic クラス`}),` を使う (生の値・hex は禁止)。`]}),`
`,(0,u.jsxs)(t.li,{children:[`variant 切替は条件式 or `,(0,u.jsx)(t.code,{children:`cva`}),` で行う (新規導入なら `,(0,u.jsx)(t.code,{children:`cva`}),` を推奨)。`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`3-storybook-stories-必須項目`,children:`3. Storybook stories 必須項目`}),`
`,(0,u.jsxs)(t.p,{children:[(0,u.jsx)(t.code,{children:`{Name}.stories.tsx`}),`:`]}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NewComponent } from "./NewComponent";

const meta: Meta<typeof NewComponent> = {
  title: "Components/NewComponent",
  component: NewComponent,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "compact"],
    },
  },
  args: {
    title: "見本タイトル",
    description: "見本の説明文",
  },
};
export default meta;

type Story = StoryObj<typeof NewComponent>;

export const Default: Story = {};
export const Compact: Story = { args: { variant: "compact" } };
export const WithoutDescription: Story = { args: { description: undefined } };
export const LongText: Story = {
  args: {
    title: "とても長いタイトルが入った場合の見た目を確認するためのサンプル",
    description: "本文も長くなる想定で、行折り返しと line-height のバランスを確認します。",
  },
};
`})}),`
`,(0,u.jsx)(t.h3,{id:`story-チェックリスト`,children:`Story チェックリスト`}),`
`,(0,u.jsxs)(t.ul,{className:`contains-task-list`,children:[`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.code,{children:`title`}),` は `,(0,u.jsx)(t.code,{children:`UI/{Name}`}),` (primitive) or `,(0,u.jsx)(t.code,{children:`Components/{Name}`}),` (composite) の形。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`Default`}),` story 必須。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`各 `,(0,u.jsx)(t.strong,{children:`variant`}),` ごとに Story を作る (default / secondary / outline 等)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`状態違い`}),`: disabled / loading / error / empty / selected 等。該当があれば Story 化。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`エッジケース`}),`: 空の場合 / 長いテキスト / 多数項目 (10+) 等。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.code,{children:`argTypes`}),` で `,(0,u.jsx)(t.code,{children:`control`}),` を指定 (boolean / inline-radio / object / text)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.code,{children:`parameters.layout`}),` を `,(0,u.jsx)(t.code,{children:`"centered"`}),` か `,(0,u.jsx)(t.code,{children:`"fullscreen"`}),` か `,(0,u.jsx)(t.code,{children:`"padded"`}),` で適切に指定。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`interactive な props (onClick 等) は `,(0,u.jsx)(t.code,{children:`fn()`}),` でモック (`,(0,u.jsx)(t.code,{children:`@storybook/test`}),`)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`サイドバーで a11y タブを開き violation 0 を確認。`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`4-ui-primitive-の場合の追加項目`,children:`4. UI primitive の場合の追加項目`}),`
`,(0,u.jsxs)(t.p,{children:[(0,u.jsx)(t.code,{children:`src/components/ui/{name}.tsx`}),`:`]}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`Radix UI をラップする場合は、`,(0,u.jsx)(t.code,{children:`<Primitive.Root>`}),` 等の各サブコンポーネントを `,(0,u.jsx)(t.strong,{children:`そのまま re-export`}),` + className 注入する形にする。
shadcn のテンプレートを踏襲。`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`displayName`}),` を設定 (DevTools での視認性 + Storybook Source 表示)。`]}),`
`,(0,u.jsxs)(t.li,{children:[`例: `,(0,u.jsx)(t.code,{children:`Button`}),` のように `,(0,u.jsx)(t.code,{children:`forwardRef`}),` で `,(0,u.jsx)(t.code,{children:`ref`}),` を通す (Radix がこれを期待することが多い)。`]}),`
`]}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const Dialog = DialogPrimitive.Root;
Dialog.displayName = "Dialog";

const DialogTrigger = DialogPrimitive.Trigger;
DialogTrigger.displayName = "DialogTrigger";

// ... 各サブ要素も同様
`})}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`5-アクセシビリティ確認項目`,children:`5. アクセシビリティ確認項目`}),`
`,(0,u.jsx)(t.p,{children:`実装中・PR 提出前に必ず確認:`}),`
`,(0,u.jsxs)(t.ul,{className:`contains-task-list`,children:[`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`キーボードのみで操作可能`}),` (マウス使わず Tab / Enter / Esc で全機能を試す)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.code,{children:`:focus-visible`}),` のリング (orange 2px) が見える。`,(0,u.jsx)(t.code,{children:`outline: none`}),` で消していない。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`ARIA 状態属性`}),` を適切に付与: `,(0,u.jsx)(t.code,{children:`aria-pressed`}),`, `,(0,u.jsx)(t.code,{children:`aria-expanded`}),`, `,(0,u.jsx)(t.code,{children:`aria-haspopup`}),`, `,(0,u.jsx)(t.code,{children:`aria-selected`}),`, `,(0,u.jsx)(t.code,{children:`aria-disabled`}),`, `,(0,u.jsx)(t.code,{children:`aria-invalid`}),` 等。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`アイコンのみのボタン`}),` に `,(0,u.jsx)(t.code,{children:`aria-label`}),` あり。装飾アイコンに `,(0,u.jsx)(t.code,{children:`aria-hidden="true"`}),`。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:(0,u.jsx)(t.code,{children:`<label htmlFor>`})}),` ですべての入力要素にラベル接続。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`見出し階層`}),` をスキップしない (Story 内では `,(0,u.jsx)(t.code,{children:`h2`}),` から開始でも可)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`タッチターゲット`}),` 最小 36 × 36 px (`,(0,u.jsx)(t.code,{children:`min-h-9 min-w-9`}),`)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`コントラスト`}),`: テキスト vs 背景 4.5:1 以上。
特に淡色背景 (`,(0,u.jsx)(t.code,{children:`bg-brand-orange-soft`}),` 等) の上で `,(0,u.jsx)(t.code,{children:`text-muted`}),` を使わない (`,(0,u.jsx)(t.code,{children:`text-muted-foreground`}),` を使う)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`色だけに依存しない`}),`: ステータスは色 + テキスト両方で表現。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`動画 / アニメーション`}),`: CSS `,(0,u.jsx)(t.code,{children:`transition-*`}),` のみで実装 (`,(0,u.jsx)(t.code,{children:`prefers-reduced-motion`}),` 自動尊重)。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`Storybook a11y タブ`}),` で violation 0 を確認。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.strong,{children:`dark テーマ`}),`でも視認性 OK (`,(0,u.jsx)(t.code,{children:`<html data-theme="dark">`}),` で確認)。`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`6-テスト`,children:`6. テスト`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`Vitest`}),` (`,(0,u.jsx)(t.code,{children:`@storybook/addon-vitest`}),` 統合): Story が `,(0,u.jsx)(t.code,{children:`play`}),` 関数を持つ場合、CI で自動実行。`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`Playwright`}),` (`,(0,u.jsx)(t.code,{children:`e2e/`}),`): ページレベルで使われる component は `,(0,u.jsx)(t.code,{children:`e2e/{name}.spec.ts`}),` に visual + interaction テストを追加。`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`axe-core`}),`: `,(0,u.jsx)(t.code,{children:`e2e/components-a11y.spec.ts`}),` の対象一覧に新規コンポーネントを追加 (ショーケースページがあれば自動)。`]}),`
`]}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-bash`,children:`# 開発
pnpm storybook

# 静的ビルド
pnpm build-storybook

# 型チェック
pnpm tsc --noEmit

# E2E
npx playwright test --project=chromium-desktop -j 2
`})}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`7-ドキュメント更新`,children:`7. ドキュメント更新`}),`
`,(0,u.jsx)(t.p,{children:`新規コンポーネントが composite で、ユーザー向け説明が必要な場合:`}),`
`,(0,u.jsxs)(t.ul,{className:`contains-task-list`,children:[`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,u.jsx)(t.code,{children:`docs/design-system.md`}),` の §12 「既存コンポーネント一覧」に 1 行追加。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`大きな変更 (新カテゴリ追加 / トークン追加) があれば `,(0,u.jsx)(t.code,{children:`src/stories/design-system/Components.mdx`}),` も更新。`]}),`
`,(0,u.jsxs)(t.li,{className:`task-list-item`,children:[(0,u.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`新しいトークンを追加した場合は `,(0,u.jsx)(t.code,{children:`src/stories/design-system/Tokens.mdx`}),` / `,(0,u.jsx)(t.code,{children:`Colors.mdx`}),` / `,(0,u.jsx)(t.code,{children:`Spacing.mdx`}),` 等の対応ページを更新。`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`8-pr-チェックリスト-まとめ`,children:`8. PR チェックリスト (まとめ)`}),`
`,(0,u.jsx)(t.p,{children:`このまま PR descriptionにコピペできる形:`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-md`,children:`## デザインシステム適合チェック

- [ ] semantic クラス (bg-brand-orange / text-foreground 等) のみを使用
- [ ] hex / 任意 spacing / shadow の直書きなし
- [ ] Story 完備 (Default + 全 variant + 状態違い + エッジケース)
- [ ] Storybook a11y タブ violation 0
- [ ] キーボードのみで操作可能
- [ ] dark テーマで視認性 OK
- [ ] \`pnpm tsc --noEmit\` クリア
- [ ] \`pnpm build-storybook\` クリア
- [ ] (該当時) docs/design-system.md / Components.mdx 更新
`})})]})}function l(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,u.jsx)(t,{...e,children:(0,u.jsx)(c,{...e})}):c(e)}var u;e((()=>{u=t(),s(),i()}))();export{l as default};