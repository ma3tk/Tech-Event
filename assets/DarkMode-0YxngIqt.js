import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,f as i,p as a,s as o,u as s}from"./blocks-DSdAlscu.js";import{t as c}from"./mdx-react-shim-DaZ3R4gt.js";function l(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Design System/Dark Mode`}),`
`,(0,d.jsx)(r,{children:`Dark Mode`}),`
`,(0,d.jsx)(s,{children:`data-theme 属性ベースの 3 モード切替 (light / dark / system)`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`tech-event`}),` は `,(0,d.jsxs)(t.strong,{children:[(0,d.jsx)(t.code,{children:`<html data-theme>`}),` 属性`]}),` をスイッチに、light / dark / system の 3 モードに対応します。
切替の状態は `,(0,d.jsx)(t.code,{children:`localStorage`}),` に保存され、リロード後も保持されます。
`,(0,d.jsx)(t.code,{children:`prefers-color-scheme`}),` の変化にもリアクティブに追従します。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`1-仕組み`,children:`1. 仕組み`}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{children:`ユーザー操作
      ↓
ThemeProvider.setTheme("light" | "dark" | "system")
      ↓
localStorage[\`tech-event:theme\`] に保存
      ↓
<html data-theme="light"|"dark"> 属性を更新
      ↓
src/styles/themes/{light,dark}.css の :root[data-theme=…] ルールが適用
      ↓
@theme inline 経由で Tailwind ユーティリティの色が再評価
`})}),`
`,(0,d.jsx)(t.h3,{id:`11-ssr--hydration-mismatch-を避ける設計`,children:`1.1 SSR / hydration mismatch を避ける設計`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[`サーバー側では `,(0,d.jsx)(t.code,{children:`<html>`}),` に `,(0,d.jsx)(t.code,{children:`data-theme`}),` を `,(0,d.jsx)(t.strong,{children:`付けない`}),`。`]}),`
`,(0,d.jsxs)(t.li,{children:[`クライアント mount 後、`,(0,d.jsx)(t.code,{children:`useEffect`}),` で localStorage を読み、`,(0,d.jsx)(t.code,{children:`data-theme`}),` を初めて設定する。`]}),`
`,(0,d.jsx)(t.li,{children:`これにより SSR と初回 hydration の出力が完全一致するため、mismatch 警告が出ない。`}),`
`,(0,d.jsxs)(t.li,{children:[`mount 前 (FOUC の隙間) のフォールバックは `,(0,d.jsx)(t.code,{children:`dark.css`}),` 末尾の
`,(0,d.jsx)(t.code,{children:`@media (prefers-color-scheme: dark) :root:not([data-theme="light"]):not([data-theme="dark"])`}),` ルールで担保。`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`2-themeprovider-の使い方`,children:`2. ThemeProvider の使い方`}),`
`,(0,d.jsx)(t.h3,{id:`21-セットアップ-既に完了`,children:`2.1 セットアップ (既に完了)`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`src/app/layout.tsx`}),` でルートにマウント済み:`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}
`})}),`
`,(0,d.jsx)(t.h3,{id:`22-任意のコンポーネントから切り替える`,children:`2.2 任意のコンポーネントから切り替える`}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <p>現在: {theme} (実際: {resolvedTheme})</p>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  );
}
`})}),`
`,(0,d.jsx)(t.h3,{id:`23-api`,children:`2.3 API`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`公開値`}),(0,d.jsx)(t.th,{children:`型`}),(0,d.jsx)(t.th,{children:`説明`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`theme`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`"light" | "dark" | "system"`})}),(0,d.jsxs)(t.td,{children:[`ユーザーが選んだ値 (`,(0,d.jsx)(t.code,{children:`"system"`}),` を含む)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`resolvedTheme`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`"light" | "dark"`})}),(0,d.jsx)(t.td,{children:`実際に適用されている値 (system は OS で解決済み)`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`setTheme`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`(t: Theme) => void`})}),(0,d.jsxs)(t.td,{children:[`切り替え関数。localStorage 保存 + `,(0,d.jsx)(t.code,{children:`<html data-theme>`}),` 反映`]})]})]})]}),`
`,(0,d.jsxs)(t.blockquote,{children:[`
`,(0,d.jsxs)(t.p,{children:[`Provider の外で `,(0,d.jsx)(t.code,{children:`useTheme()`}),` を呼ぶと安全側に倒して `,(0,d.jsx)(t.code,{children:`light`}),` を返します。
Server Component やテストでの誤用でクラッシュさせない設計。`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`3-storybook-での切替`,children:`3. Storybook での切替`}),`
`,(0,d.jsxs)(t.p,{children:[`Storybook 側にもダークモード切替を導入する場合は、ツールバーから `,(0,d.jsx)(t.code,{children:`data-theme`}),` を切り替える decorator を追加します
(現状はトークン値の対比表示で確認)。`]}),`
`,(0,d.jsxs)(t.p,{children:[`ライブで切り替えたい場合は `,(0,d.jsx)(t.strong,{children:`Components の各 Story を開き、Canvas 内で DevTools を使い`}),`
`,(0,d.jsx)(t.code,{children:`document.documentElement.setAttribute("data-theme", "dark")`}),` を実行することでテスト可能です。`]}),`
`,(0,d.jsxs)(t.p,{children:[`将来的に `,(0,d.jsx)(t.code,{children:`@storybook/addon-themes`}),` 等を追加すれば、ツールバーから常時切替えできるようになります。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`4-light--dark-トークン値対比表`,children:`4. Light / Dark トークン値対比表`}),`
`,(0,d.jsx)(t.p,{children:`すべての semantic alias の light/dark 値を一覧。`}),`
`,(0,d.jsx)(t.h3,{id:`41-surface--foreground`,children:`4.1 Surface / foreground`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`Semantic`}),(0,d.jsx)(t.th,{children:`Light`}),(0,d.jsx)(t.th,{children:`Dark`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--background`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#f7f7f5`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#030712`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--surface`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#ffffff`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#111827`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--surface-muted`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#f3f4f6`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#1f2937`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--foreground`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#1a1a1a`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#f9fafb`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--muted`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#6b7280`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#9ca3af`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--muted-foreground`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#4b5563`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#d1d5db`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--border`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#e5e7eb`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#374151`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--border-strong`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#d1d5db`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#4b5563`})})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`42-brand`,children:`4.2 Brand`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`Semantic`}),(0,d.jsx)(t.th,{children:`Light`}),(0,d.jsx)(t.th,{children:`Dark`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-orange`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#c2410c`}),` (orange-700)`]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#f97316`}),` (orange-500)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-orange-hover`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#9a3412`}),` (orange-800)`]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#fb923c`}),` (orange-400)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-orange-soft`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#fff1ea`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`rgba(249,115,22,0.12)`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-orange-strong`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#c2410c`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#fdba74`}),` (orange-300)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-red`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#d23a3a`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#ef4f4f`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-red-hover`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#b82c2c`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#f06d6d`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-red-soft`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#fbeaea`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`rgba(239,68,68,0.15)`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--brand-foreground`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#ffffff`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`#ffffff`})})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`43-link`,children:`4.3 Link`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`Semantic`}),(0,d.jsx)(t.th,{children:`Light`}),(0,d.jsx)(t.th,{children:`Dark`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--link`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#005d8c`}),` (link-blue-600)`]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#4aa8d4`}),` (link-blue-300)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--link-hover`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#004161`}),` (link-blue-700)`]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#7dc4e0`}),` (link-blue-200)`]})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`44-status`,children:`4.4 Status`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`Semantic (bg / fg)`}),(0,d.jsx)(t.th,{children:`Light`}),(0,d.jsx)(t.th,{children:`Dark`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-open-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#dcfce7`}),` / `,(0,d.jsx)(t.code,{children:`#14532d`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`rgba(34,197,94,0.18)`}),` / `,(0,d.jsx)(t.code,{children:`#86efac`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-full-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#fee2e2`}),` / `,(0,d.jsx)(t.code,{children:`#991b1b`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`rgba(239,68,68,0.18)`}),` / `,(0,d.jsx)(t.code,{children:`#fca5a5`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-waitlist-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#fef9c3`}),` / `,(0,d.jsx)(t.code,{children:`#713f12`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`rgba(234,179,8,0.18)`}),` / `,(0,d.jsx)(t.code,{children:`#fde047`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-closed-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#f3f4f6`}),` / `,(0,d.jsx)(t.code,{children:`#1f2937`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#1f2937`}),` / `,(0,d.jsx)(t.code,{children:`#e5e7eb`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-cancelled-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#991b1b`}),` / `,(0,d.jsx)(t.code,{children:`#ffffff`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#991b1b`}),` / `,(0,d.jsx)(t.code,{children:`#ffffff`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-ended-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#f3f4f6`}),` / `,(0,d.jsx)(t.code,{children:`#4b5563`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#1f2937`}),` / `,(0,d.jsx)(t.code,{children:`#9ca3af`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-upcoming-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#dbeafe`}),` / `,(0,d.jsx)(t.code,{children:`#1e3a8a`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`rgba(59,130,246,0.18)`}),` / `,(0,d.jsx)(t.code,{children:`#93c5fd`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`--status-ongoing-bg`}),` / `,(0,d.jsx)(t.code,{children:`-fg`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`#fff7ed`}),` / `,(0,d.jsx)(t.code,{children:`#c2410c`})]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`rgba(249,115,22,0.15)`}),` / `,(0,d.jsx)(t.code,{children:`#fdba74`})]})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`45-elevation-shadow`,children:`4.5 Elevation (shadow)`}),`
`,(0,d.jsx)(t.p,{children:`dark では shadow を強くする (背景が暗いと淡いシャドウが見えないため)。`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`Semantic`}),(0,d.jsx)(t.th,{children:`Light`}),(0,d.jsx)(t.th,{children:`Dark`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--elevation-card`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--shadow-sm`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`0 1px 2px rgba(0,0,0,0.4)`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--elevation-popover`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--shadow-md`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`0 4px 8px -2px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.3)`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--elevation-modal`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--shadow-lg`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`0 12px 24px -4px rgba(0,0,0,0.6), 0 4px 8px -4px rgba(0,0,0,0.4)`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--elevation-overlay`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--shadow-xl`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`0 25px 50px -12px rgba(0,0,0,0.8)`})})]})]})]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`5-ビジュアル対比--同じカードを-lightdark-で`,children:`5. ビジュアル対比 — 同じカードを light/dark で`}),`
`,(0,d.jsx)(i,{children:(0,d.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`16px`,fontFamily:`system-ui, sans-serif`,fontSize:`13px`},children:[(0,d.jsxs)(`div`,{style:{background:`#f7f7f5`,padding:`20px`,borderRadius:`8px`,border:`1px solid #e5e7eb`},children:[(0,d.jsx)(`p`,{style:{margin:`0 0 12px`,fontSize:`11px`,color:`#6b7280`,textTransform:`uppercase`},children:(0,d.jsx)(t.p,{children:`Light`})}),(0,d.jsxs)(`div`,{style:{background:`#ffffff`,padding:`16px`,borderRadius:`8px`,boxShadow:`0 1px 2px rgba(0,0,0,0.05)`,color:`#1a1a1a`},children:[(0,d.jsx)(`div`,{style:{display:`inline-block`,padding:`2px 8px`,background:`#dcfce7`,color:`#14532d`,borderRadius:`4px`,fontSize:`11px`,fontWeight:600,marginBottom:`8px`},children:(0,d.jsx)(t.p,{children:`募集中`})}),(0,d.jsx)(`h3`,{style:{margin:`0 0 6px`,fontSize:`16px`,fontWeight:700},children:(0,d.jsx)(t.p,{children:`AI 時代のフロントエンドを語る夜`})}),(0,d.jsx)(`p`,{style:{margin:`0 0 8px`,color:`#4b5563`,fontSize:`12px`},children:(0,d.jsx)(t.p,{children:`2026/06/20 (土) 19:00 / Findy Tech`})}),(0,d.jsx)(`a`,{href:`#`,style:{color:`#005d8c`,fontSize:`12px`,textDecoration:`underline`},children:(0,d.jsx)(t.p,{children:`詳細を見る →`})})]})]}),(0,d.jsxs)(`div`,{style:{background:`#030712`,padding:`20px`,borderRadius:`8px`,border:`1px solid #374151`},children:[(0,d.jsx)(`p`,{style:{margin:`0 0 12px`,fontSize:`11px`,color:`#9ca3af`,textTransform:`uppercase`},children:(0,d.jsx)(t.p,{children:`Dark`})}),(0,d.jsxs)(`div`,{style:{background:`#111827`,padding:`16px`,borderRadius:`8px`,boxShadow:`0 1px 2px rgba(0,0,0,0.4)`,color:`#f9fafb`},children:[(0,d.jsx)(`div`,{style:{display:`inline-block`,padding:`2px 8px`,background:`rgba(34,197,94,0.18)`,color:`#86efac`,borderRadius:`4px`,fontSize:`11px`,fontWeight:600,marginBottom:`8px`},children:(0,d.jsx)(t.p,{children:`募集中`})}),(0,d.jsx)(`h3`,{style:{margin:`0 0 6px`,fontSize:`16px`,fontWeight:700},children:(0,d.jsx)(t.p,{children:`AI 時代のフロントエンドを語る夜`})}),(0,d.jsx)(`p`,{style:{margin:`0 0 8px`,color:`#d1d5db`,fontSize:`12px`},children:(0,d.jsx)(t.p,{children:`2026/06/20 (土) 19:00 / Findy Tech`})}),(0,d.jsx)(`a`,{href:`#`,style:{color:`#4aa8d4`,fontSize:`12px`,textDecoration:`underline`},children:(0,d.jsx)(t.p,{children:`詳細を見る →`})})]})]})]})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`6-注意点`,children:`6. 注意点`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsxs)(t.strong,{children:[`半透明色は禁止 (`,(0,d.jsx)(t.code,{children:`bg-brand-orange/10`}),` 等)`]}),` — 合成後のコントラストが落ち、axe-core 違反になりやすい。
必ず `,(0,d.jsx)(t.code,{children:`--brand-orange-soft`}),` のような `,(0,d.jsx)(t.strong,{children:`明示的なトークン`}),` を使う。`]}),`
`,(0,d.jsxs)(t.li,{children:[`文字色は基本 `,(0,d.jsx)(t.code,{children:`text-foreground`}),` / `,(0,d.jsx)(t.code,{children:`text-muted-foreground`}),` を使い、`,(0,d.jsx)(t.code,{children:`text-white`}),` / `,(0,d.jsx)(t.code,{children:`text-black`}),` 直書きは避ける
(dark テーマで反転しないため)。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`border-gray-200`}),` 等の Tailwind 標準色を直接使うのも禁止。`,(0,d.jsx)(t.code,{children:`border-border`}),` を使う。`]}),`
`,(0,d.jsx)(t.li,{children:`画像の上に文字を重ねる場合は、画像にダークオーバーレイを追加して両テーマで読めるようにする。`}),`
`]})]})}function u(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(l,{...e})}):l(e)}var d;e((()=>{d=t(),c(),a()}))();export{u as default};