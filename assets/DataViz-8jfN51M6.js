import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,f as i,p as a,s as o,u as s}from"./blocks-DxazclGI.js";import{t as c}from"./mdx-react-shim-CQBio_OA.js";function l(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Design System/Data Viz`}),`
`,(0,d.jsx)(r,{children:`Data Visualization カラーパレット`}),`
`,(0,d.jsx)(s,{children:`色覚多様性配慮 (Okabe-Ito) の 8 色シーケンス`}),`
`,(0,d.jsxs)(t.p,{children:[`チャート (bar / pie / line / heatmap) の色は `,(0,d.jsxs)(t.strong,{children:[(0,d.jsx)(t.code,{children:`--chart-1`}),` 〜 `,(0,d.jsx)(t.code,{children:`--chart-8`})]}),` の 8 色を順番にサイクルさせる規約です。
ブランドオレンジ (`,(0,d.jsx)(t.code,{children:`--brand-orange`}),`) や status 色 (`,(0,d.jsx)(t.code,{children:`--status-*-fg`}),`) を chart にそのまま使うと、UI 上の意味と衝突しやすいため避けてください。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`1-パレット-light`,children:`1. パレット (Light)`}),`
`,(0,d.jsx)(i,{children:(0,d.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(4, 1fr)`,gap:`12px`,fontFamily:`system-ui, sans-serif`,fontSize:`12px`},children:[{name:`chart-1`,value:`#0072b2`,desc:`青 (Okabe-Ito)`},{name:`chart-2`,value:`#e69f00`,desc:`オレンジ`},{name:`chart-3`,value:`#009e73`,desc:`緑`},{name:`chart-4`,value:`#cc79a7`,desc:`マゼンタ`},{name:`chart-5`,value:`#56b4e9`,desc:`スカイブルー`},{name:`chart-6`,value:`#d55e00`,desc:`ヴァーミリオン`},{name:`chart-7`,value:`#f0e442`,desc:`黄`},{name:`chart-8`,value:`#4b4b4b`,desc:`ニュートラル`}].map(e=>(0,d.jsxs)(`div`,{style:{border:`1px solid #e5e7eb`,borderRadius:`8px`,overflow:`hidden`,background:`#fff`},children:[(0,d.jsx)(`div`,{style:{height:`56px`,background:e.value}}),(0,d.jsxs)(`div`,{style:{padding:`8px 10px`},children:[(0,d.jsx)(`strong`,{children:e.name}),(0,d.jsxs)(`div`,{style:{color:`#6b7280`},children:[e.value,` — `,e.desc]})]})]},e.name))})}),`
`,(0,d.jsxs)(t.p,{children:[`Dark mode では各色を 1〜2 段明るく差し替え、暗背景上で 4.5:1 のコントラストを確保します (`,(0,d.jsx)(t.code,{children:`src/styles/themes/dark.css`}),` 参照)。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`2-使い方`,children:`2. 使い方`}),`
`,(0,d.jsx)(t.h3,{id:`21-svg-server-component-で-ok`,children:`2.1 SVG (Server Component で OK)`}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`<rect
  fill="var(--chart-1)"
  x={x}
  y={y}
  width={w}
  height={h}
/>
`})}),`
`,(0,d.jsx)(t.h3,{id:`22-tailwind-utility-client-component`,children:`2.2 Tailwind utility (Client Component)`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`globals.css`}),` の `,(0,d.jsx)(t.code,{children:`@theme inline`}),` で `,(0,d.jsx)(t.code,{children:`--color-chart-1`}),` を expose しているため、`,(0,d.jsx)(t.code,{children:`bg-chart-1`}),` / `,(0,d.jsx)(t.code,{children:`text-chart-1`}),` / `,(0,d.jsx)(t.code,{children:`border-chart-1`}),` などが Tailwind ユーティリティとして使えます。`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`<div className="h-4 w-full bg-chart-1" />
<span className="text-chart-2">凡例ラベル</span>
`})}),`
`,(0,d.jsx)(t.h3,{id:`23-順序ルール`,children:`2.3 順序ルール`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`用途`}),(0,d.jsx)(t.th,{children:`推奨`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`主軸データ 1 系列`}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`chart-1`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`比較対象 2 系列`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`chart-1`}),` + `,(0,d.jsx)(t.code,{children:`chart-2`})]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`3〜4 系列`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`chart-1, 2, 3, 4`}),` (この順序が最適)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`ネガティブ / 警告系のハイライト`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`chart-6`}),` (ヴァーミリオン)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`グレースケール背景`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`chart-8`}),` (ニュートラル)`]})]})]})]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`3-色覚多様性配慮`,children:`3. 色覚多様性配慮`}),`
`,(0,d.jsxs)(t.p,{children:[`本パレットは `,(0,d.jsx)(t.strong,{children:`Okabe-Ito の 8 色シーケンス`}),` を基にしています。
特徴:`]}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`赤と緑が並ばない順序`}),` で並べてあるため、Deuteranopia / Protanopia でも隣接バーが識別できる`]}),`
`,(0,d.jsxs)(t.li,{children:[`各色は色相だけでなく `,(0,d.jsx)(t.strong,{children:`明度も連続で変化`}),` するため、グレースケール印刷でも見分けられる`]}),`
`,(0,d.jsxs)(t.li,{children:[`凡例には可能なら `,(0,d.jsx)(t.strong,{children:`色 + テクスチャパターン`}),` (stripe / dot) を併用する規約 (今後対応予定)`]}),`
`]}),`
`,(0,d.jsxs)(t.blockquote,{children:[`
`,(0,d.jsx)(t.p,{children:`参考: M. Okabe and K. Ito (2008) "Color Universal Design (CUD): How to make figures and presentations that are friendly to Colorblind people."`}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`4-アンチパターン`,children:`4. アンチパターン`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[`❌ ブランドオレンジ (`,(0,d.jsx)(t.code,{children:`--brand-orange`}),`) をチャートの主要色に使う — CTA ボタンとぶつかる`]}),`
`,(0,d.jsxs)(t.li,{children:[`❌ Status 色 (`,(0,d.jsx)(t.code,{children:`--status-open-fg`}),` 等) をチャートに使う — 「open / cancelled」の意味が誤読される`]}),`
`,(0,d.jsxs)(t.li,{children:[`❌ HEX をハードコードする (`,(0,d.jsx)(t.code,{children:`fill="#3b82f6"`}),`) — テーマ切替で追従しない`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`5-適用済みページ`,children:`5. 適用済みページ`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`/event/[id]/admin/insights`}),` 申込タイミング分布 (`,(0,d.jsx)(t.code,{children:`--chart-1`}),`) / キャンセル率推移 (`,(0,d.jsx)(t.code,{children:`--chart-6`}),`)`]}),`
`]}),`
`,(0,d.jsxs)(t.p,{children:[`今後 `,(0,d.jsx)(t.code,{children:`/admin`}),` / `,(0,d.jsx)(t.code,{children:`/dashboard`}),` の各種チャートにも段階的に適用していきます。`]})]})}function u(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(l,{...e})}):l(e)}var d;e((()=>{d=t(),c(),a()}))();export{u as default};