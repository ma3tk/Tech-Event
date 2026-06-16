import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CxcFbYk8.js";import{t as d}from"./mdx-react-shim-C2WkHrtd.js";import{Left as f,Right as p,Top as m,n as h,t as g}from"./sheet.stories-Zvu0on5c.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`画面の `,(0,y.jsx)(t.strong,{children:`左/右/上/下`}),` からスライドして出てくるパネル。Dialog と同様のフォーカストラップ / scroll lock を持つが、モバイル向け or 長いフィルタ UI 向き。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/sheet.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`画面の `,(0,y.jsx)(t.strong,{children:`左/右/上/下`}),` からスライドして出てくるパネル。Dialog と同様のフォーカストラップ / scroll lock を持つが、モバイル向け or 長いフィルタ UI 向き。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`モバイルのナビメニュー (hamburger 展開)`}),`
`,(0,y.jsx)(t.li,{children:`フィルタ UI (検索ページの絞り込み)`}),`
`,(0,y.jsx)(t.li,{children:`詳細パネル (一覧で行選択 → 右からスライド)`}),`
`,(0,y.jsx)(t.li,{children:`カート / 通知の右側プレビュー`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`確認モーダル → `,(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`})]}),`
`,(0,y.jsxs)(t.li,{children:[`小さなメニュー → `,(0,y.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})]}),`
`,(0,y.jsxs)(t.li,{children:[`短い吊り下げ → `,(0,y.jsx)(t.a,{href:`./popover.md`,children:`Popover`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`side="right":
┌──────────────────────────┐
│                          │
│     画面本体             │
│                          ├──┐
│                          │S │  Sheet (右からスライド)
│                          │h │
│                          │e │
│                          │e │
│                          │t │
│                          ├──┘
└──────────────────────────┘
`})}),`
`,(0,y.jsxs)(t.p,{children:[`side: `,(0,y.jsx)(t.code,{children:`left`}),` / `,(0,y.jsx)(t.code,{children:`right`}),` / `,(0,y.jsx)(t.code,{children:`top`}),` / `,(0,y.jsx)(t.code,{children:`bottom`})]}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
`,(0,y.jsx)(t.code,{children:`side`}),` で 4 方向。`,(0,y.jsx)(t.code,{children:`bottom`}),` はモバイルの bottom sheet として最も使う。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`max-w-sm`}),` (`,(0,y.jsx)(t.code,{children:`right`}),`/`,(0,y.jsx)(t.code,{children:`left`}),`) or `,(0,y.jsx)(t.code,{children:`max-h-[80vh]`}),` (`,(0,y.jsx)(t.code,{children:`top`}),`/`,(0,y.jsx)(t.code,{children:`bottom`}),`)。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態`,children:`7. 状態`}),`
`,(0,y.jsxs)(t.p,{children:[`open / close / busy。`,(0,y.jsx)(t.code,{children:`data-[state=open]:slide-in-from-right`}),` 等で方向別アニメ。duration-slow (300ms)。`]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ`,children:`8. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`Dialog と同じ (フォーカストラップ / Escape / aria-labelledby)`}),`
`,(0,y.jsx)(t.li,{children:`SheetTitle 必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-使用例`,children:`9. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import {
  Sheet, SheetTrigger, SheetContent,
  SheetHeader, SheetTitle,
} from "@tech-event/shared-ui";

<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="メニュー">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-64">
    <SheetHeader>
      <SheetTitle>メニュー</SheetTitle>
    </SheetHeader>
    <nav>{/* ... */}</nav>
  </SheetContent>
</Sheet>
`})}),`
`,(0,y.jsx)(t.h2,{id:`10-アンチパターン`,children:`10. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ Dialog で十分なものを Sheet で → ✅ Dialog (中央表示で目線が落ち着く)`}),`
`,(0,y.jsx)(t.li,{children:`❌ Title 抜け → ✅ 必須`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`side="bottom"`}),` でデスクトップにも使う → ✅ モバイル限定`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-関連`,children:`11. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/modals-and-sheets.md`,children:`blocks/modals-and-sheets.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-変更履歴`,children:`12. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};