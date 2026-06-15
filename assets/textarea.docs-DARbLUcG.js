import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{Default as f,Disabled as p,WithLabel as m,n as h,t as g}from"./textarea.stories-B3QTaRg_.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsx)(u,{children:`複数行のテキスト入力。コメント / 短い説明文 / メモなどに使う。`}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/textarea.md`}),`。
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
`,(0,y.jsx)(t.p,{children:`複数行のテキスト入力。コメント / 短い説明文 / メモなどに使う。`}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか`,children:`2. いつ使うか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`コメント入力`}),`
`,(0,y.jsx)(t.li,{children:`イベントの簡易説明 (3-5 行)`}),`
`,(0,y.jsx)(t.li,{children:`フィードバック / お問い合わせ`}),`
`,(0,y.jsx)(t.li,{children:`メモ欄`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか`,children:`3. いつ使わないか`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`1 行 → `,(0,y.jsx)(t.a,{href:`./input.md`,children:`Input`})]}),`
`,(0,y.jsxs)(t.li,{children:[`Markdown 編集 → `,(0,y.jsx)(t.a,{href:`../components/markdown-editor.md`,children:`MarkdownEditor`})]}),`
`,(0,y.jsx)(t.li,{children:`大量の構造化入力 → 別ページのフォームに`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造`,children:`4. 構造`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌────────────────────────────────┐
│ プレースホルダ / 値             │
│                                │
│                                │
└────────────────────────────────┘
                          [字数 0/500]
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント`,children:`5. バリアント`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.code,{children:`default`})}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`error`}),` (`,(0,y.jsx)(t.code,{children:`aria-invalid`}),` 連動で auto)`]}),`
`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ`,children:`6. サイズ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`rows`}),` prop で高さ制御 (default 3-4)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`min-h-[100px]`}),` 推奨`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態`,children:`7. 状態`}),`
`,(0,y.jsxs)(t.p,{children:[`default / hover / focus-visible / disabled / error。`,(0,y.jsx)(t.code,{children:`<Input>`}),` と同じパターン。`]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ`,children:`8. アクセシビリティ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`Label 必須`}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`maxLength`}),` 設定時は字数カウントに `,(0,y.jsx)(t.code,{children:`aria-live="polite"`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`aria-describedby`}),` でカウント領域を参照`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-使用例`,children:`9. 使用例`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<div className="space-y-2">
  <Label htmlFor="comment">コメント</Label>
  <Textarea
    id="comment"
    rows={4}
    maxLength={500}
    placeholder="感想を共有"
  />
</div>
`})}),`
`,(0,y.jsx)(t.h2,{id:`10-アンチパターン`,children:`10. アンチパターン`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`resize-none`}),` を強制 → ✅ ユーザーに任せる`]}),`
`,(0,y.jsx)(t.li,{children:`❌ Label なし → ✅ 必須`}),`
`,(0,y.jsx)(t.li,{children:`❌ Markdown を Textarea で → ✅ MarkdownEditor`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`11-関連`,children:`11. 関連`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./input.md`,children:`Input`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`../components/markdown-editor.md`,children:`MarkdownEditor`})}),`
`,(0,y.jsx)(t.li,{children:(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`})}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-変更履歴`,children:`12. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};