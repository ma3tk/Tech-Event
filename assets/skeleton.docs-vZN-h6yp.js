import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DxazclGI.js";import{t as d}from"./mdx-react-shim-CQBio_OA.js";import{Default as f,EventCard as p,ProfileCard as m,n as h,t as g}from"./skeleton.stories-CQs7DqUI.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`データ取得中の `,(0,y.jsx)(t.strong,{children:`コンテンツ骨格`}),` を表示するプレースホルダ。animate-pulse でループ感を出すが、prefers-reduced-motion で停止 (Design.md §8 例外規定)。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/skeleton.md`}),`。
ここは `,(0,y.jsx)(t.strong,{children:`言語化テキスト + 実物 Live Preview`}),` を 1 ページに統合した shadcn/ui スタイルの docs。
元の `,(0,y.jsx)(t.code,{children:`.md`}),` ファイルが source of truth、本 MDX は同内容を Storybook 上でレンダリングする視覚層。`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`ライブプレビュー-canvas`,children:`ライブプレビュー (Canvas)`}),`
`,(0,y.jsx)(s,{of:f}),`
`,(0,y.jsx)(s,{of:m}),`
`,(0,y.jsx)(s,{of:p}),`
`,(0,y.jsx)(t.h2,{id:`primary`,children:`Primary`}),`
`,(0,y.jsx)(r,{}),`
`,(0,y.jsx)(t.h2,{id:`props-api`,children:`Props (API)`}),`
`,(0,y.jsx)(a,{}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`1-目的`,children:`1. 目的`}),`
`,(0,y.jsxs)(t.p,{children:[`データ取得中の `,(0,y.jsx)(t.strong,{children:`コンテンツ骨格`}),` を表示するプレースホルダ。`,(0,y.jsx)(t.code,{children:`animate-pulse`}),` でループ感を出すが、`,(0,y.jsx)(t.code,{children:`prefers-reduced-motion`}),` で停止 (Design.md §8 例外規定)。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`一覧 (Card / Row) の loading 表示`}),`
`,(0,y.jsx)(t.li,{children:`ページ全体の初期化中`}),`
`,(0,y.jsx)(t.li,{children:`個別セクション (sidebar / panel) の loading`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`インタラクション後の短い待機 → `,(0,y.jsx)(t.a,{href:`./loading-state.md`,children:`LoadingState`}),` (中央スピナー)`]}),`
`,(0,y.jsxs)(t.li,{children:[`永続的に空 → `,(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`})]}),`
`,(0,y.jsxs)(t.li,{children:[`エラー時 → `,(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`████████████████        ← 矩形 + pulse
████ ███████ ██
█████████████████
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
なし (`,(0,y.jsx)(t.code,{children:`className`}),` で形・サイズを指定)。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-状態`,children:`6. 状態`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`animate-pulse`}),` ループのみ。`,(0,y.jsx)(t.code,{children:`prefers-reduced-motion`}),` で停止。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`aria-busy="true"`}),` を親に付ける`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`role="status"`}),` + `,(0,y.jsx)(t.code,{children:`aria-label="読み込み中"`}),` を 1 箇所`]}),`
`,(0,y.jsx)(t.li,{children:`過剰な pulse はめまいを誘発 → max 1 ループに留めない`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Skeleton } from "@tech-event/shared-ui";

<div aria-busy="true" role="status" aria-label="読み込み中" className="space-y-2">
  <Skeleton className="h-6 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>
`})}),`
`,(0,y.jsxs)(t.p,{children:[`ドメイン用には `,(0,y.jsx)(t.code,{children:`EventCardSkeleton`}),` / `,(0,y.jsx)(t.code,{children:`EventListRowSkeleton`}),` / `,(0,y.jsx)(t.code,{children:`GroupCardSkeleton`}),` を使う。`]}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 派手な shimmer → ✅ pulse のみ (Design.md §8)`}),`
`,(0,y.jsx)(t.li,{children:`❌ aria-busy 抜け → ✅ 必須`}),`
`,(0,y.jsx)(t.li,{children:`❌ 短すぎる待機にも skeleton → ✅ 100ms 以下なら何も出さない`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./loading-state.md`,children:`LoadingState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};