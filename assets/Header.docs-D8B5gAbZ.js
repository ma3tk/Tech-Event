import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{LoggedIn as f,LoggedInWithNotifications as p,LoggedOut as m,n as h,t as g}from"./Header.stories-C52iauac.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsx)(u,{children:`グローバルヘッダー (Client Component)。ロゴ / 検索 / ナビ / アカウント領域を統合する。HeaderServer でログイン状態と通知数を解決し、本 component に props として渡す。`}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/header.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`対象ペルソナ`,children:`対象ペルソナ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`主要: P1 山田美咲 (モバイル: ハンバーガー)、P6 小林一郎 (DevRel: ロール切替)`}),`
`,(0,y.jsx)(t.li,{children:`副次: P2 田中慎太郎、P4 鈴木大輔、P5 中村由美 (言語切替)、P7 高橋真由美`}),`
`]}),`
`,(0,y.jsxs)(t.p,{children:[`(根拠: `,(0,y.jsx)(t.a,{href:`../../../Personas.md`,children:(0,y.jsx)(t.code,{children:`Personas.md`})}),`)`]}),`
`,(0,y.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,y.jsxs)(t.p,{children:[`グローバルヘッダー (Client Component)。ロゴ / 検索 / ナビ / アカウント領域を統合する。`,(0,y.jsx)(t.code,{children:`HeaderServer`}),` でログイン状態と通知数を解決し、本 component に props として渡す。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`全ページのトップ`}),`: 通常 `,(0,y.jsx)(t.code,{children:`apps/web/src/app/layout.tsx`}),` で `,(0,y.jsx)(t.code,{children:`HeaderServer`}),` を呼ぶ`]}),`
`,(0,y.jsx)(t.li,{children:`一部の特殊ページ (auth flow / iframe 埋め込み) では非表示も可`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`iframe 埋め込み (`,(0,y.jsx)(t.code,{children:`/embed/*`}),` 系)`]}),`
`,(0,y.jsx)(t.li,{children:`/auth/* の最小レイアウト`}),`
`,(0,y.jsx)(t.li,{children:`印刷ビュー`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌──────────────────────────────────────────────────────────────────────┐
│ [tech-event]   [SearchBox]      ナビ1 ナビ2 ナビ3   [🌓] [🔔3] [👤▾] │
└──────────────────────────────────────────────────────────────────────┘
   ▲             ▲                ▲                  ▲    ▲     ▲
   ロゴ          検索 (form GET)   主要ナビ           Theme 通知 ユーザーメニュー
`})}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`ロゴ (左): テキストロゴ `,(0,y.jsx)(t.code,{children:`tech-event`}),` (Noto Sans JP Bold)。アイコン化禁止 (Design.md §2)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/search-box.md`,children:`SearchBox`}),` (中央): `,(0,y.jsx)(t.code,{children:`<form method="get">`}),` で JS なし動作`]}),`
`,(0,y.jsx)(t.li,{children:`ナビ (右側): イベントを探す / グループを探す / 主催する 等`}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/theme-switcher.md`,children:`ThemeSwitcher`})}),`
`,(0,y.jsxs)(t.li,{children:[`通知 Badge (`,(0,y.jsx)(t.a,{href:`../ui/badge.md`,children:`Badge`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/user-menu-dropdown.md`,children:`UserMenuDropdown`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`default`})}),(0,y.jsx)(t.td,{children:`ログイン後`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`guest`})}),(0,y.jsx)(t.td,{children:`未ログイン (ログイン / 新規登録 ボタンが代わりに出る)`})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`HeaderServer`}),` が current user を解決して切り替える。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsxs)(t.p,{children:[`固定高さ 56-64px。`,(0,y.jsx)(t.code,{children:`sticky top-0 z-sticky`}),` で常時表示。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態`,children:`7. 状態`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`default`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`bg-surface border-b border-border`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`scroll`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`shadow-sm`}),` を追加 (subtle)`]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`theme switching`}),(0,y.jsx)(t.td,{children:`アニメーション禁止 (即時切替)`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`guest`}),(0,y.jsx)(t.td,{children:`アカウント領域がログイン / 新規登録ボタン`})]})]})]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ`,children:`8. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`<header role="banner">`}),` を直接使う`]}),`
`,(0,y.jsxs)(t.li,{children:[`skip link (`,(0,y.jsx)(t.code,{children:`#main`}),` への jump) を最初に`]}),`
`,(0,y.jsxs)(t.li,{children:[`ナビは `,(0,y.jsx)(t.code,{children:`<nav aria-label="main">`})]}),`
`,(0,y.jsxs)(t.li,{children:[`通知 Badge は `,(0,y.jsx)(t.code,{children:`aria-label="未読 3 件"`}),` で読み上げ補強`]}),`
`,(0,y.jsx)(t.li,{children:`モバイルでは hamburger → Sheet 内にナビを展開`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`モバイル (<md): ロゴ + hamburger + ユーザーアバター。検索は別途トップに`}),`
`,(0,y.jsx)(t.li,{children:`タブレット (md): ロゴ + 検索 + 主要ナビ 2-3 個`}),`
`,(0,y.jsx)(t.li,{children:`デスクトップ (lg+): フルレイアウト`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`// apps/web/src/app/layout.tsx
import { HeaderServer } from "@tech-event/shared-ui-composite";

<HeaderServer />
{children}
<Footer />
`})}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`HeaderServer`}),` 内部で `,(0,y.jsx)(t.code,{children:`auth()`}),` / `,(0,y.jsx)(t.code,{children:`getNotificationCount()`}),` を解決し、`,(0,y.jsx)(t.code,{children:`<Header user={...} notificationCount={...} />`}),` を返す。`]}),`
`,(0,y.jsx)(t.h2,{id:`11-アンチパターン`,children:`11. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ ロゴをアイコン化 → ✅ テキストロゴ厳守`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`bg-white`}),` ハードコード → ✅ `,(0,y.jsx)(t.code,{children:`bg-surface`})]}),`
`,(0,y.jsx)(t.li,{children:`❌ ナビアイテムを 7 個以上 → ✅ 5 個以内、それ以上は DropdownMenu に集約`}),`
`,(0,y.jsx)(t.li,{children:`❌ ヘッダー内に CTA を派手に → ✅ 主要 CTA は本文 (hero) に置く`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ z-index を任意値 → ✅ `,(0,y.jsx)(t.code,{children:`z-sticky`}),` トークン`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-関連`,children:`12. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./header-server.md`,children:`HeaderServer`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/search-box.md`,children:`SearchBox`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/user-menu-dropdown.md`,children:`UserMenuDropdown`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/theme-switcher.md`,children:`ThemeSwitcher`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/navigation.md`,children:`blocks/navigation.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、Client Component`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};