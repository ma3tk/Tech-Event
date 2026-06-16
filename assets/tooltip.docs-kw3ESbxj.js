import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CxcFbYk8.js";import{t as d}from"./mdx-react-shim-C2WkHrtd.js";import{Default as f,Sides as p,WithIcon as m,n as h,t as g}from"./tooltip.stories-B_0a7zMm.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`hover / focus 時に短い説明`}),` を表示する小さな浮き上がり。クリックでは出さない (Popover の領域)。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/tooltip.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`hover / focus 時に短い説明`}),` を表示する小さな浮き上がり。クリックでは出さない (Popover の領域)。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`icon-only ボタンの補足説明 (`,(0,y.jsx)(t.code,{children:`aria-label`}),` と組合せ)`]}),`
`,(0,y.jsx)(t.li,{children:`省略表示された情報の全文表示`}),`
`,(0,y.jsx)(t.li,{children:`アイコン凡例の簡単な説明`}),`
`,(0,y.jsx)(t.li,{children:`状態の補足 (なぜ disabled なのか等)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`クリックで開く → `,(0,y.jsx)(t.a,{href:`./popover.md`,children:`Popover`})]}),`
`,(0,y.jsx)(t.li,{children:`重要な情報 → 常時表示する (Tooltip は補助)`}),`
`,(0,y.jsx)(t.li,{children:`モバイル (hover ない) → Tooltip は出ない or 別 UI`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`                  ┌──────────┐
                  │  ヒント   │ ← Tooltip (小さく濃い背景)
                  └─▼────────┘
      ┌────┐
      │ ⓘ │ ← anchor (hover / focus でトリガー)
      └────┘
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (単色 dark 系)。`,(0,y.jsx)(t.code,{children:`side`}),` で表示位置 (top / right / bottom / left)。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,y.jsx)(t.p,{children:`hidden / visible / focused-via-keyboard。`}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`focus 時にも表示 (hover 専用にしない)`}),`
`,(0,y.jsx)(t.li,{children:`短文 (1 行) に留める`}),`
`,(0,y.jsx)(t.li,{children:`重要情報を Tooltip だけで伝えない (モバイルや SR 利用者に届かない)`}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`aria-describedby`}),` で anchor に紐付け (Radix が処理)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Tooltip, TooltipTrigger, TooltipContent } from "@tech-event/shared-ui";

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="ブックマーク">
      <Bookmark />
    </Button>
  </TooltipTrigger>
  <TooltipContent>ブックマークに追加</TooltipContent>
</Tooltip>
`})}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 長文を入れる → ✅ Popover へ`}),`
`,(0,y.jsx)(t.li,{children:`❌ クリックで開く → ✅ Popover`}),`
`,(0,y.jsx)(t.li,{children:`❌ モバイルで重要情報を Tooltip だけ → ✅ inline 表示`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./popover.md`,children:`Popover`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./button.md`,children:`Button`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};