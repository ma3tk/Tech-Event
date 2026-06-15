import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DSdAlscu.js";import{t as d}from"./mdx-react-shim-DaZ3R4gt.js";import{Dots as f,Spinner as p,SpinnerLarge as m,n as h,t as g}from"./loading-state.stories-CfihoNjV.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`インタラクション後の短い待機`}),` を中央スピナー + テキストで明示する UI。Skeleton と違い、内容のレイアウトを示さず "読み込んでいる" だけを伝える。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/loading-state.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`インタラクション後の短い待機`}),` を中央スピナー + テキストで明示する UI。Skeleton と違い、内容のレイアウトを示さず "読み込んでいる" だけを伝える。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`ボタン押下後の通信待ち (フォーム送信)`}),`
`,(0,y.jsx)(t.li,{children:`Server Action の long task`}),`
`,(0,y.jsxs)(t.li,{children:[`ルート遷移中 (`,(0,y.jsx)(t.code,{children:`loading.tsx`}),`)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`一覧のロード → `,(0,y.jsx)(t.a,{href:`./skeleton.md`,children:`Skeleton`}),` (レイアウト示す)`]}),`
`,(0,y.jsx)(t.li,{children:`100ms 以下の短い処理 → 何も出さない (UI ノイズ回避)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`       ◌
   読み込み中…
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`inline`}),` — テキスト横に小さくスピナー`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`block`}),` — ブロック中央 (default)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`fullscreen`}),` — 画面全体オーバーレイ`]}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`role="status"`}),` + `,(0,y.jsx)(t.code,{children:`aria-live="polite"`})]}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.code,{children:`aria-label="読み込み中"`})}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`prefers-reduced-motion`}),` でスピナーを静止画に`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { LoadingState } from "@tech-event/shared-ui";

<LoadingState variant="block" message="読み込み中" />

// または inline
<Button disabled aria-busy>
  <Loader2 className="animate-spin" />
  送信中…
</Button>
`})}),`
`,(0,y.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 100ms 以下にも出す → ✅ skip`}),`
`,(0,y.jsx)(t.li,{children:`❌ メッセージなし → ✅ 「読み込み中」「送信中」など状態を明示`}),`
`,(0,y.jsx)(t.li,{children:`❌ ループアニメ過剰 → ✅ 単一スピナーに`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./skeleton.md`,children:`Skeleton`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/feedback.md`,children:`blocks/feedback.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};