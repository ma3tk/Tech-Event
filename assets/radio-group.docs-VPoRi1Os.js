import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DxazclGI.js";import{t as d}from"./mdx-react-shim-CQBio_OA.js";import{Default as f,Disabled as p,Horizontal as m,n as h,t as g}from"./radio-group.stories-CxOwfr_s.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[(0,y.jsx)(t.strong,{children:`排他的に 1 つ`}),` だけ選択させる選択肢グループ。2-4 個の選択肢に最適。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/radio-group.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.strong,{children:`排他的に 1 つ`}),` だけ選択させる選択肢グループ。2-4 個の選択肢に最適。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`表示形式 (リスト / グリッド)`}),`
`,(0,y.jsx)(t.li,{children:`公開範囲 (公開 / 限定公開 / 非公開)`}),`
`,(0,y.jsx)(t.li,{children:`価格プラン (Free / Pro)`}),`
`,(0,y.jsx)(t.li,{children:`性別 / 年代 など`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`5+ 個 → `,(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`})]}),`
`,(0,y.jsxs)(t.li,{children:[`複数選択 → `,(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`})]}),`
`,(0,y.jsxs)(t.li,{children:[`ON/OFF → `,(0,y.jsx)(t.a,{href:`./switch.md`,children:`Switch`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`○ オプション A
● オプション B (選択中)
○ オプション C
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-状態`,children:`5. 状態`}),`
`,(0,y.jsx)(t.p,{children:`unchecked / checked / disabled / error。`}),`
`,(0,y.jsx)(t.h2,{id:`6-アクセシビリティ`,children:`6. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`全体は `,(0,y.jsx)(t.code,{children:`<fieldset>`}),` + `,(0,y.jsx)(t.code,{children:`<legend>`}),` で括る (Radix が role="radiogroup" 付与)`]}),`
`,(0,y.jsx)(t.li,{children:`各 Item に Label を関連付け`}),`
`,(0,y.jsx)(t.li,{children:`キーボード ←→ / ↑↓ で切替`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-使用例`,children:`7. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { RadioGroup, RadioGroupItem } from "@tech-event/shared-ui";

<fieldset className="space-y-2">
  <legend className="text-sm font-medium">公開範囲</legend>
  <RadioGroup defaultValue="public">
    <div className="flex items-center gap-2">
      <RadioGroupItem id="public" value="public" />
      <Label htmlFor="public">公開</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="unlisted" value="unlisted" />
      <Label htmlFor="unlisted">限定公開</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="private" value="private" />
      <Label htmlFor="private">非公開</Label>
    </div>
  </RadioGroup>
</fieldset>
`})}),`
`,(0,y.jsx)(t.h2,{id:`8-アンチパターン`,children:`8. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ Checkbox を排他制御 → ✅ RadioGroup`}),`
`,(0,y.jsx)(t.li,{children:`❌ legend 抜け → ✅ fieldset + legend で意味的に括る`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-関連`,children:`9. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../blocks/data-input.md`,children:`blocks/data-input.md`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-変更履歴`,children:`10. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};