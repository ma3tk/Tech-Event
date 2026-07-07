import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Default as f,Success as p,WithDescription as m,n as h,t as g}from"./toast.stories-9_TBNugQ.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`非同期の完了 / エラー / 情報`}),` を画面右下に短時間表示する通知。Radix UI Toast + Sonner ベース。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/toast.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`非同期の完了 / エラー / 情報`}),` を画面右下に短時間表示する通知。Radix UI Toast + Sonner ベース。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`Server Action 完了の通知 (「保存しました」「シェアしました」)`}),`
`,(0,y.jsx)(t.li,{children:`エラー通知 (失敗時)`}),`
`,(0,y.jsx)(t.li,{children:`情報通知 (新着メッセージ等)`}),`
`,(0,y.jsx)(t.li,{children:`クリップボードコピー完了`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`永続表示するエラー → `,(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})]}),`
`,(0,y.jsxs)(t.li,{children:[`入力検証エラー → `,(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`}),` の FormMessage (inline)`]}),`
`,(0,y.jsxs)(t.li,{children:[`重要な確認 → `,(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`            ┌─────────────────────────┐
            │ [icon] タイトル         │
            │ 説明 (optional)         │
            │              [✕]        │
            └─────────────────────────┘
            ← 画面右下 (デスクトップ)
            ← 画面下部 (モバイル)
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`default`}),` — 中立 (neutral)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`success`}),` — 成功 (`,(0,y.jsx)(t.code,{children:`status-open`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`error`}),` — エラー (`,(0,y.jsx)(t.code,{children:`destructive`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`info`}),` — 情報 (`,(0,y.jsx)(t.code,{children:`link`}),`)`]}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-表示時間`,children:`6. 表示時間`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`通常: 3-4 秒`}),`
`,(0,y.jsx)(t.li,{children:`アクション付き: 5-8 秒`}),`
`,(0,y.jsx)(t.li,{children:`エラー: 5 秒以上 (or 永続)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-アクセシビリティ`,children:`7. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`role="status"`}),` (info) または `,(0,y.jsx)(t.code,{children:`role="alert"`}),` (error)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`aria-live="polite"`}),` (info) / `,(0,y.jsx)(t.code,{children:`assertive`}),` (error)`]}),`
`,(0,y.jsx)(t.li,{children:`閉じるボタンは必ず付ける (SR 利用者向け)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-使用例`,children:`8. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { toast } from "@tech-event/shared-ui";

// 成功
toast.success("シェアリンクをコピーしました");

// エラー
toast.error("保存に失敗しました", {
  description: "ネットワークを確認してもう一度お試しください",
});

// アクション付き
toast("予約が完了しました", {
  action: { label: "詳細を見る", onClick: () => router.push("/event/123") },
});
`})}),`
`,(0,y.jsxs)(t.p,{children:[`レイアウト直下に `,(0,y.jsx)(t.code,{children:`<ToastListener />`}),` を 1 つだけ配置。`]}),`
`,(0,y.jsx)(t.h2,{id:`9-アンチパターン`,children:`9. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ 重要情報を Toast だけで → ✅ inline でも残す`}),`
`,(0,y.jsx)(t.li,{children:`❌ Toast の中にフォーム → ✅ Dialog`}),`
`,(0,y.jsx)(t.li,{children:`❌ 連続で 5 個以上発行 → ✅ stacking 制限 (max 3)`}),`
`,(0,y.jsx)(t.li,{children:`❌ 自動非表示なし → ✅ 必ず timeout (5-7 秒) を設定`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-関連`,children:`10. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`ToastListener (`,(0,y.jsx)(t.code,{children:`libs/shared/ui-composite/src/ToastListener.tsx`}),` で provider)`]}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/feedback.md`,children:`blocks/feedback.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-変更履歴`,children:`11. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、Sonner 統合`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};