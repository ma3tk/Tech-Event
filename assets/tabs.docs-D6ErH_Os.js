import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Default as f,WithDisabled as p,n as m,t as h}from"./tabs.stories-DWLwvL6v.js";function g(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(l,{of:m}),`
`,(0,v.jsx)(i,{}),`
`,(0,v.jsxs)(u,{children:[`同じ階層の `,(0,v.jsx)(t.strong,{children:`複数ビュー`}),` を切り替えるためのタブナビゲーション。Radix UI ベース、role="tablist" + キーボード操作 (←→) 自動対応。`]}),`
`,(0,v.jsxs)(t.blockquote,{children:[`
`,(0,v.jsxs)(t.p,{children:[`一次資料: `,(0,v.jsx)(t.code,{children:`docs/catalog/ui/tabs.md`}),`。
ここは `,(0,v.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,v.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,v.jsx)(s,{of:f}),`
`,(0,v.jsx)(s,{of:p}),`
`,(0,v.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,v.jsx)(r,{}),`
`,(0,v.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,v.jsx)(a,{}),`
`,(0,v.jsx)(t.hr,{}),`
`,(0,v.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,v.jsxs)(t.p,{children:[`同じ階層の `,(0,v.jsx)(t.strong,{children:`複数ビュー`}),` を切り替えるためのタブナビゲーション。Radix UI ベース、`,(0,v.jsx)(t.code,{children:`role="tablist"`}),` + キーボード操作 (←→) 自動対応。`]}),`
`,(0,v.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`ユーザープロフィールの「主催」「参加予定」「過去」`}),`
`,(0,v.jsx)(t.li,{children:`イベント詳細の「概要」「参加者」「コメント」`}),`
`,(0,v.jsx)(t.li,{children:`ShareModal の「リンク」「SNS」「QR」「埋め込み」`}),`
`,(0,v.jsx)(t.li,{children:`ダッシュボードのサブセクション切替`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`ページ遷移するなら → タブではなく Link`}),`
`,(0,v.jsx)(t.li,{children:`階層的な選択 → 別ページ or ネスト UI`}),`
`,(0,v.jsx)(t.li,{children:`5+ 個 → 別 UI 検討 (DropdownMenu / Select)`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,v.jsx)(t.pre,{children:(0,v.jsx)(t.code,{children:`[概要] [参加者] [コメント]   ← TabsList (Triggers)
─────────────────────────
TabsContent (選択されたタブの中身)
`})}),`
`,(0,v.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,v.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`horizontal (default)`}),`
`,(0,v.jsx)(t.li,{children:`vertical (sidebar 風、稀に使う)`}),`
`]}),`
`,(0,v.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,v.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,v.jsx)(t.p,{children:`inactive / active / disabled / focused。`}),`
`,(0,v.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`←→ / Home / End キー対応 (Radix が処理)`}),`
`,(0,v.jsxs)(t.li,{children:[`各 TabsContent に `,(0,v.jsx)(t.code,{children:`aria-labelledby`}),` が自動付与`]}),`
`,(0,v.jsx)(t.li,{children:`Tab key で TabsList をスキップしないように`}),`
`,(0,v.jsx)(t.li,{children:`TablistKeyboard (composite) でキーボード補助を追加できる`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,v.jsx)(t.pre,{children:(0,v.jsx)(t.code,{className:`language-tsx`,children:`import { Tabs, TabsList, TabsTrigger, TabsContent } from "@tech-event/shared-ui";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">概要</TabsTrigger>
    <TabsTrigger value="participants">参加者</TabsTrigger>
    <TabsTrigger value="comments">コメント</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">{/* ... */}</TabsContent>
  <TabsContent value="participants">{/* ... */}</TabsContent>
  <TabsContent value="comments">{/* ... */}</TabsContent>
</Tabs>
`})}),`
`,(0,v.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`❌ 5+ タブ → ✅ Sub navigation または別ページ`}),`
`,(0,v.jsx)(t.li,{children:`❌ ページ遷移を Tabs で → ✅ Link`}),`
`,(0,v.jsx)(t.li,{children:`❌ Tab 名が長文 → ✅ 2-4 文字に`}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})}),`
`,(0,v.jsx)(t.li,{children:(0,v.jsx)(t.a,{href:`../blocks/navigation.md`,children:`blocks/navigation.md`})}),`
`]}),`
`,(0,v.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,v.jsxs)(t.ul,{children:[`
`,(0,v.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,v.jsx)(t.hr,{}),`
`,(0,v.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,v.jsx)(o,{includePrimary:!1})]})}function _(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,v.jsx)(t,{...e,children:(0,v.jsx)(g,{...e})}):g(e)}var v;e((()=>{v=t(),d(),c(),h()}))();export{_ as default};