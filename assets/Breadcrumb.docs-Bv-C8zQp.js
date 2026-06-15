import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{Default as f,ManyLevels as p,TwoLevels as m,n as h,t as g}from"./Breadcrumb.stories-BJEV8jbT.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsx)(u,{children:`階層的なナビゲーション。現在地までのパスを示し、上階層に戻れるようにする。JSON-LD 構造化データを同時出力可能。`}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/components/breadcrumb.md`}),`。
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
`,(0,y.jsx)(t.p,{children:`階層的なナビゲーション。現在地までのパスを示し、上階層に戻れるようにする。JSON-LD 構造化データを同時出力可能。`}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`階層が 2 段以上のページ (例: トップ > グループ > イベント詳細)`}),`
`,(0,y.jsx)(t.li,{children:`検索結果のフィルタ階層`}),`
`,(0,y.jsx)(t.li,{children:`管理画面`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`単一ページ`}),`
`,(0,y.jsx)(t.li,{children:`ルート直下 1 階層のみ`}),`
`,(0,y.jsx)(t.li,{children:`モバイルで横スクロール必須レベルに長い → 別 UI`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`Top > グループ > Tokyo TypeScript > AI で始める TS
       ▲                              ▲
       Link で戻れる                  現在地 (Link なし)
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-アクセシビリティ`,children:`5. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.code,{children:`<nav aria-label="breadcrumb">`})}),`
`,(0,y.jsxs)(t.li,{children:[`現在地は `,(0,y.jsx)(t.code,{children:`aria-current="page"`})]}),`
`,(0,y.jsxs)(t.li,{children:[`区切り (ChevronRight) は `,(0,y.jsx)(t.code,{children:`aria-hidden`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`6-使用例`,children:`6. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Breadcrumb } from "@tech-event/shared-ui-composite";

<Breadcrumb
  items={[
    { label: "トップ", href: "/" },
    { label: "グループ", href: "/group" },
    { label: "Tokyo TypeScript", href: "/group/ts-tokyo" },
    { label: event.title },  // 現在地は href なし
  ]}
  emitJsonLd  // SEO 用 JSON-LD 同時出力
/>
`})}),`
`,(0,y.jsx)(t.h2,{id:`7-アンチパターン`,children:`7. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`❌ 5+ 階層 → ✅ 中間を `,(0,y.jsx)(t.code,{children:`…`}),` で省略`]}),`
`,(0,y.jsx)(t.li,{children:`❌ ホームを省略 → ✅ 最初に必ずトップ`}),`
`,(0,y.jsx)(t.li,{children:`❌ aria-current なし → ✅ 現在地に必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`8-関連`,children:`8. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/navigation.md`,children:`blocks/navigation.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-変更履歴`,children:`9. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、JSON-LD 同時出力`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};