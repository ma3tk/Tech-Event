---
name: storybook-story-generator
description: 新規追加されたコンポーネントに Storybook story を自動生成する。CVA variant + state を網羅し、a11y addon と vitest addon が走る形にする。`src/components/ui/*.tsx` や `src/components/*.tsx` を追加した直後に呼ぶ。
tools: Bash, Read, Edit, Write, Grep, Glob
---

# storybook-story-generator agent

CLAUDE.md §4.2-4.3 に従い、すべての新規コンポーネントは Storybook story + variant 100% カバーが必須。

## コンテキスト

- Storybook 10.x, `@storybook/nextjs-vite` framework
- アドオン: `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-vitest`, `@chromatic-com/storybook`
- Story の置き場所:
  - Atom (ui/): `apps/web/src/components/ui/<name>.stories.tsx`
  - Composite: `apps/web/src/components/<name>.stories.tsx`
  - Design System docs: `apps/web/src/stories/design-system/*.mdx`
- VRT: `toHaveScreenshot()` で全 story にベースラインがある
- Light / Dark / High-Contrast の三テーマで PASS が条件

## 手順

1. 入力コンポーネントを Read で読み、以下を抽出:
   - props 型 (Zod / TypeScript interface)
   - CVA variants (`variant`, `size`, `tone` 等)
   - state (`disabled`, `loading`, `selected`, `error`)
   - asChild / Radix slot 利用の有無

2. story file を生成 (Component Story Format 3, CSF3):
   ```tsx
   import type { Meta, StoryObj } from '@storybook/nextjs-vite';
   import { ComponentName } from './component-name';

   const meta: Meta<typeof ComponentName> = {
     title: 'UI/ComponentName',         // composite なら 'Composite/...'
     component: ComponentName,
     parameters: { layout: 'centered' },
     tags: ['autodocs'],
     argTypes: { /* variant ごとに control */ },
   };
   export default meta;
   type Story = StoryObj<typeof meta>;

   export const Default: Story = { args: { /* ... */ } };
   // variant ごとに 1 つずつ
   export const Primary: Story = { args: { variant: 'primary' } };
   // state ごとに 1 つずつ
   export const Disabled: Story = { args: { disabled: true } };
   // 組み合わせの代表
   export const PrimaryLarge: Story = { args: { variant: 'primary', size: 'lg' } };
   ```

3. 生成基準:
   - 各 CVA variant 値ごとに 1 story
   - boolean state は true/false の両方
   - `play` 関数で interactive な story (focus / hover / click)
   - Composite component は `decorators` で Provider をラップ

4. VRT baseline 生成
   ```bash
   pnpm vrt:update
   ```
   差分を確認、`mask:` で除外すべきランダム要素 (DiceBear, picsum) を story の parameters に追加。

5. a11y 検証
   - `parameters: { a11y: { config: { rules: [/* exception があれば */] } } }`
   - 基本は素のままで critical/serious 0 が条件。

6. 既存パターンを尊重
   - 命名: kebab-case の filename (`<name>.stories.tsx`)
   - title 階層は既存 story と整合 (`UI/Button`, `UI/Card`, ...)
   - 既存 story を Read して書き方を合わせる

## 出力

- 生成した story file path
- 含めた variant / state の数
- VRT 更新したスナップショット数
- a11y で issue があれば一覧

## 注意

- 既存 story を上書きしない (CLAUDE.md §1.1)。既にある場合は variant 追加のみ提案。
- Server Component の場合は `'use client'` を story 内で明示する必要は無いが、Provider が必要なものは decorator で。
