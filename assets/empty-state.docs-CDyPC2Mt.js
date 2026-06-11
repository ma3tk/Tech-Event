import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Default as f,WithAction as p,WithIcon as m,n as h,t as g}from"./empty-state.stories-KC-zBQQu.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`データが `,(0,y.jsx)(t.strong,{children:`0 件 / 未作成`}),` の状態を、その理由と次のアクションを示しながら伝える。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/empty-state.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[`データが `,(0,y.jsx)(t.strong,{children:`0 件 / 未作成`}),` の状態を、その理由と次のアクションを示しながら伝える。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`一覧が空 (「まだイベントがありません」)`}),`
`,(0,y.jsx)(t.li,{children:`フィルタ結果 0 件`}),`
`,(0,y.jsx)(t.li,{children:`未作成状態 (「最初のグループを作る」)`}),`
`,(0,y.jsx)(t.li,{children:`検索結果なし`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`ロード中 → `,(0,y.jsx)(t.a,{href:`./skeleton.md`,children:`Skeleton`}),` / `,(0,y.jsx)(t.a,{href:`./loading-state.md`,children:`LoadingState`})]}),`
`,(0,y.jsxs)(t.li,{children:[`エラー → `,(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌─────────────────────────────────────┐
│            [大きめのアイコン]         │
│                                       │
│         まだイベントがありません      │
│   最初のイベントを作成してみよう      │
│                                       │
│         [ + 新しいイベント ]           │
└─────────────────────────────────────┘
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
`,(0,y.jsx)(t.code,{children:`variant`}),`:`]}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`default`}),` — 通常`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`search`}),` — 検索結果 0 件`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`filter`}),` — フィルタ 0 件 (フィルタをリセットする CTA)`]}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.code,{children:`role="status"`})}),`
`,(0,y.jsxs)(t.li,{children:[`主見出しは適切なレベル (`,(0,y.jsx)(t.code,{children:`h2`}),` or `,(0,y.jsx)(t.code,{children:`h3`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:`CTA Button or Link 1 つに絞る`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { EmptyState } from "@tech-event/shared-ui";
import { Calendar } from "lucide-react";

<EmptyState
  icon={<Calendar />}
  title="まだイベントがありません"
  description="最初のイベントを作成してみましょう"
  action={
    <Button asChild>
      <Link href="/event/new">新しいイベント</Link>
    </Button>
  }
/>
`})}),`
`,(0,y.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 空のテーブル / 空のリスト (何も出さない) → ✅ EmptyState を出す`}),`
`,(0,y.jsx)(t.li,{children:`❌ 説明なし → ✅ 何故空か & 次のアクションを言語化`}),`
`,(0,y.jsx)(t.li,{children:`❌ CTA 複数 → ✅ 主要 1 つに絞る`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./loading-state.md`,children:`LoadingState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/feedback.md`,children:`blocks/feedback.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};