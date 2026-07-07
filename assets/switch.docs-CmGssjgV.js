import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DyqvvloQ.js";import{t as d}from"./mdx-react-shim-Co4r-mY_.js";import{Checked as f,Default as p,Disabled as m,n as h,t as g}from"./switch.stories-CD41_nqe.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`即時切替`}),` される ON/OFF トグル。チェックボックスと違い、状態変更が `,(0,y.jsx)(t.strong,{children:`即副作用`}),` (保存 / フィルタ反映) を伴うときに使う。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/switch.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`即時切替`}),` される ON/OFF トグル。チェックボックスと違い、状態変更が `,(0,y.jsx)(t.strong,{children:`即副作用`}),` (保存 / フィルタ反映) を伴うときに使う。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`設定画面の即時保存項目 (通知 ON/OFF)`}),`
`,(0,y.jsx)(t.li,{children:`ダークモード切替`}),`
`,(0,y.jsx)(t.li,{children:`フィルタ ON/OFF`}),`
`,(0,y.jsx)(t.li,{children:`公開状態のクイック切替`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`同意チェック (Submit で確定) → `,(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`})]}),`
`,(0,y.jsxs)(t.li,{children:[`排他的選択 → `,(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`})]}),`
`,(0,y.jsxs)(t.li,{children:[`ボタン的アクション → `,(0,y.jsx)(t.a,{href:`./button.md`,children:`Button`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`ラベル          ◯───  (off)
ラベル          ───◉  (on)
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-状態`,children:`5. 状態`}),`
`,(0,y.jsx)(t.p,{children:`off / on / disabled。`}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`Label 必須`}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`role="switch"`}),` + `,(0,y.jsx)(t.code,{children:`aria-checked`}),` (Radix が処理)`]}),`
`,(0,y.jsx)(t.li,{children:`キーボード Space で切替`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Switch } from "@tech-event/shared-ui";

<div className="flex items-center justify-between">
  <Label htmlFor="notify">メール通知を受け取る</Label>
  <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
</div>
`})}),`
`,(0,y.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ Submit で確定する用途 → ✅ Checkbox`}),`
`,(0,y.jsx)(t.li,{children:`❌ Label 抜け → ✅ 必須`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`})}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/theme-switcher.md`,children:`ThemeSwitcher`}),` — Switch + ロジック`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};