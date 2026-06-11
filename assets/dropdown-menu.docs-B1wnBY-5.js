import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Default as f,WithCheckboxAndRadio as p,WithSubmenu as m,n as h,t as g}from"./dropdown-menu.stories-5tM7owyC.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`ボタンクリックで開く `,(0,y.jsx)(t.strong,{children:`メニュー`}),` (Item / Separator / Sub / Radio / Check)。Radix UI ベースでキーボード操作完備。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/dropdown-menu.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`ボタンクリックで開く `,(0,y.jsx)(t.strong,{children:`メニュー`}),` (Item / Separator / Sub / Radio / Check)。Radix UI ベースでキーボード操作完備。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`ユーザーメニュー (ヘッダー右上アバタークリック)`}),`
`,(0,y.jsx)(t.li,{children:`行のアクションメニュー (「⋯」 → 編集 / 削除 / シェア)`}),`
`,(0,y.jsx)(t.li,{children:`ソート / フィルタの選択`}),`
`,(0,y.jsx)(t.li,{children:`「もっと見る」系のオプション集約`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`タブ切替 → `,(0,y.jsx)(t.a,{href:`./tabs.md`,children:`Tabs`})]}),`
`,(0,y.jsxs)(t.li,{children:[`フォーム選択 → `,(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`})]}),`
`,(0,y.jsxs)(t.li,{children:[`モーダル開く → `,(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`}),` を直接`]}),`
`,(0,y.jsxs)(t.li,{children:[`ホバー解説 → `,(0,y.jsx)(t.a,{href:`./tooltip.md`,children:`Tooltip`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`[⋯]  ← Trigger
  ▼
┌──────────────────┐
│ Item 1           │
│ Item 2     ⌘E   │ ← shortcut
│ ──────────────── │
│ Item 3     ⊳    │ ← submenu
└──────────────────┘
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`Item / CheckboxItem / RadioItem / Separator / Sub / Label / Group`}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,y.jsx)(t.p,{children:`closed / open / focused-item / disabled-item。`}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`キーボード ↑↓ / Enter / Escape / ← (submenu close) / → (submenu open)`}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`role="menu"`}),` + `,(0,y.jsx)(t.code,{children:`role="menuitem"`})]}),`
`,(0,y.jsxs)(t.li,{children:[`Trigger に `,(0,y.jsx)(t.code,{children:`aria-haspopup="menu"`}),` + `,(0,y.jsx)(t.code,{children:`aria-expanded`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@tech-event/shared-ui";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="メニュー">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={handleEdit}>編集</DropdownMenuItem>
    <DropdownMenuItem onSelect={handleShare}>シェア</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
      削除
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
`})}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 大量の Item (10+) → ✅ Sub menu でグループ化、または別 UI`}),`
`,(0,y.jsx)(t.li,{children:`❌ 重要 CTA を Menu に隠す → ✅ 明示的な Button で出す`}),`
`,(0,y.jsx)(t.li,{children:`❌ destructive を上に置く → ✅ Separator で下に分離`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/user-menu-dropdown.md`,children:`UserMenuDropdown`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./tabs.md`,children:`Tabs`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};