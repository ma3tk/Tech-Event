import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DxazclGI.js";import{t as d}from"./mdx-react-shim-CQBio_OA.js";import{Default as f,FromErrorInstance as p,WithRetry as m,n as h,t as g}from"./error-state.stories-Nn4-TxnD.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`永続的に表示するエラー`}),` UI。Toast の一時的通知と違い、画面の一部 / 全体を占有して、原因と対処を示す。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/error-state.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`永続的に表示するエラー`}),` UI。Toast の一時的通知と違い、画面の一部 / 全体を占有して、原因と対処を示す。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`データ取得失敗 (リスト全体が空 with error)`}),`
`,(0,y.jsx)(t.li,{children:`認可エラー (画面アクセス権なし)`}),`
`,(0,y.jsx)(t.li,{children:`ネットワークエラー (リトライボタン付き)`}),`
`,(0,y.jsxs)(t.li,{children:[`致命的なエラー (`,(0,y.jsx)(t.code,{children:`error.tsx`}),` 内)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`短時間で消える成功/失敗 → `,(0,y.jsx)(t.a,{href:`./toast.md`,children:`Toast`})]}),`
`,(0,y.jsxs)(t.li,{children:[`入力検証 → `,(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`}),` FormMessage (inline)`]}),`
`,(0,y.jsxs)(t.li,{children:[`空状態 → `,(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌─────────────────────────────────────┐
│        [⚠ アイコン]                  │
│                                       │
│   読み込みに失敗しました              │
│   時間をおいて再度お試しください      │
│                                       │
│       [ 再読み込み ]                   │
└─────────────────────────────────────┘
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
`,(0,y.jsx)(t.code,{children:`variant`}),`:`]}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`default`}),` — 一般`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`permission`}),` — 権限なし`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`network`}),` — ネットワーク`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`not-found`}),` — 404 系`]}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`role="alert"`}),` + `,(0,y.jsx)(t.code,{children:`aria-live="assertive"`})]}),`
`,(0,y.jsx)(t.li,{children:`リトライ CTA に明確なラベル`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { ErrorState } from "@tech-event/shared-ui";
import { AlertTriangle } from "lucide-react";

<ErrorState
  icon={<AlertTriangle />}
  title="読み込みに失敗しました"
  description="ネットワークを確認してもう一度お試しください"
  action={
    <Button onClick={refetch}>再読み込み</Button>
  }
/>
`})}),`
`,(0,y.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 原因を技術用語で → ✅ ユーザーが行動できる言葉で`}),`
`,(0,y.jsx)(t.li,{children:`❌ リトライなし → ✅ 可能ならアクション提供`}),`
`,(0,y.jsx)(t.li,{children:`❌ Toast で永続化 → ✅ ErrorState で`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./toast.md`,children:`Toast`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./empty-state.md`,children:`EmptyState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./loading-state.md`,children:`LoadingState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/feedback.md`,children:`blocks/feedback.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};