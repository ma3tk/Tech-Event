import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,f as i,p as a,s as o,u as s}from"./blocks-CxcFbYk8.js";import{t as c}from"./mdx-react-shim-C2WkHrtd.js";function l(e){let t={code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Design System/Motion`}),`
`,(0,d.jsx)(r,{children:`Motion`}),`
`,(0,d.jsx)(s,{children:`duration / easing / reduced-motion 規約`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`tech-event`}),` のアニメーション・トランジションは `,(0,d.jsx)(t.code,{children:`src/styles/tokens.css`}),` の motion
セクションで定義されたトークン (`,(0,d.jsx)(t.code,{children:`--duration-*`}),` / `,(0,d.jsx)(t.code,{children:`--ease-*`}),`) を経由して統一されて
います。実装ガイドは `,(0,d.jsx)(t.code,{children:`docs/motion.md`}),` を参照してください。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`1-duration-スケール`,children:`1. Duration スケール`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`トークン`}),(0,d.jsx)(t.th,{style:{textAlign:`right`},children:`値`}),(0,d.jsx)(t.th,{children:`Tailwind utility`}),(0,d.jsx)(t.th,{children:`主な用途`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--duration-instant`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:(0,d.jsx)(t.code,{children:`0ms`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`duration-instant`})}),(0,d.jsx)(t.td,{children:`アニメーション無効化 / reduced-motion フォールバック`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--duration-fast`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:(0,d.jsx)(t.code,{children:`150ms`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`duration-fast`})}),(0,d.jsx)(t.td,{children:`button hover / focus / color 変化`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--duration-normal`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:(0,d.jsx)(t.code,{children:`200ms`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`duration-normal`})}),(0,d.jsx)(t.td,{children:`card hover / dropdown / tooltip`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--duration-slow`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:(0,d.jsx)(t.code,{children:`300ms`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`duration-slow`})}),(0,d.jsx)(t.td,{children:`dialog / drawer open-close`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--duration-slower`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:(0,d.jsx)(t.code,{children:`500ms`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`duration-slower`})}),(0,d.jsx)(t.td,{children:`page / route transition`})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`実物デモ--各-duration-で同じ色変化を再生`,children:`実物デモ — 各 duration で同じ「色変化」を再生`}),`
`,(0,d.jsx)(t.p,{children:`下のチップにマウスを当てると hover 時の色変化が再生されます。 duration の違いに
よる体感差を確認してください。`}),`
`,(0,d.jsx)(i,{children:(0,d.jsx)(`div`,{style:{display:`flex`,gap:12,flexWrap:`wrap`,fontFamily:`system-ui, sans-serif`},children:[{name:`instant`,ms:0},{name:`fast`,ms:150},{name:`normal`,ms:200},{name:`slow`,ms:300},{name:`slower`,ms:500}].map(e=>(0,d.jsxs)(`div`,{style:{padding:`16px 20px`,borderRadius:8,background:`#fff7ed`,color:`#9a3412`,fontWeight:600,cursor:`pointer`,border:`1px solid #fed7aa`,transitionProperty:`background-color, color, transform`,transitionDuration:`${e.ms}ms`,transitionTimingFunction:`cubic-bezier(0, 0, 0.2, 1)`},onMouseEnter:e=>{let t=e.currentTarget;t.style.background=`#c2410c`,t.style.color=`#fff`},onMouseLeave:e=>{let t=e.currentTarget;t.style.background=`#fff7ed`,t.style.color=`#9a3412`},children:[`duration-`,e.name,(0,d.jsx)(`br`,{}),(0,d.jsxs)(`span`,{style:{fontSize:12,opacity:.8},children:[e.ms,`ms`]})]},e.name))})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`2-easing-スケール`,children:`2. Easing スケール`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`トークン`}),(0,d.jsx)(t.th,{children:`値`}),(0,d.jsx)(t.th,{children:`Tailwind utility`}),(0,d.jsx)(t.th,{children:`主な用途`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--ease-linear`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`linear`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`ease-linear`})}),(0,d.jsx)(t.td,{children:`progress bar、スピナー`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--ease-in`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`cubic-bezier(0.4, 0, 1, 1)`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`ease-in`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.strong,{children:`退場`}),` (画面外へ消える)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--ease-out`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`cubic-bezier(0, 0, 0.2, 1)`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`ease-out`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.strong,{children:`入場`}),` (現れる)。デフォルト推奨`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--ease-in-out`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`cubic-bezier(0.4, 0, 0.2, 1)`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`ease-in-out`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.strong,{children:`位置の変化`}),` (画面内移動)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`--ease-spring`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`cubic-bezier(0.34, 1.56, 0.64, 1)`})}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`ease-spring`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.strong,{children:`強調`}),` (badge pop)。overshoot あり`]})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`実物デモ--translate-を-400ms-で再生-easing-比較`,children:`実物デモ — translate を 400ms で再生 (easing 比較)`}),`
`,(0,d.jsx)(t.p,{children:`ボックスにマウスを当てると右方向へ slide します。 easing が「立ち上がり」「終わり」
の感触をどう変えるか観察してください。`}),`
`,(0,d.jsx)(i,{children:(0,d.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:12,fontFamily:`system-ui, sans-serif`},children:[{name:`linear`,curve:`linear`},{name:`in`,curve:`cubic-bezier(0.4, 0, 1, 1)`},{name:`out`,curve:`cubic-bezier(0, 0, 0.2, 1)`},{name:`in-out`,curve:`cubic-bezier(0.4, 0, 0.2, 1)`},{name:`spring`,curve:`cubic-bezier(0.34, 1.56, 0.64, 1)`}].map(e=>(0,d.jsxs)(`div`,{style:{position:`relative`,background:`#f3f4f6`,borderRadius:6,height:40,overflow:`hidden`},onMouseEnter:e=>{let t=e.currentTarget.querySelector(`[data-box]`);t&&(t.style.transform=`translateX(220px)`)},onMouseLeave:e=>{let t=e.currentTarget.querySelector(`[data-box]`);t&&(t.style.transform=`translateX(0)`)},children:[(0,d.jsx)(`div`,{"data-box":!0,style:{position:`absolute`,left:4,top:4,bottom:4,width:32,borderRadius:4,background:`#c2410c`,transitionProperty:`transform`,transitionDuration:`400ms`,transitionTimingFunction:e.curve}}),(0,d.jsxs)(`span`,{style:{position:`absolute`,right:12,top:`50%`,transform:`translateY(-50%)`,fontSize:12,color:`#4b5563`,fontWeight:600},children:[`ease-`,e.name]})]},e.name))})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`3-パターン例`,children:`3. パターン例`}),`
`,(0,d.jsxs)(t.h3,{id:`31-button-hover-fast--ease-out`,children:[`3.1 button hover (`,(0,d.jsx)(t.code,{children:`fast`}),` + `,(0,d.jsx)(t.code,{children:`ease-out`}),`)`]}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`duration-fast (150ms)`}),` は「即応性」を最優先する小さな色変化に最適。`]}),`
`,(0,d.jsx)(i,{children:(0,d.jsx)(`button`,{style:{padding:`8px 16px`,borderRadius:6,background:`#c2410c`,color:`#fff`,fontWeight:600,border:`none`,cursor:`pointer`,transitionProperty:`background-color`,transitionDuration:`150ms`,transitionTimingFunction:`cubic-bezier(0, 0, 0.2, 1)`},onMouseEnter:e=>e.currentTarget.style.background=`#9a3412`,onMouseLeave:e=>e.currentTarget.style.background=`#c2410c`,children:(0,d.jsx)(t.p,{children:`Hover me (duration-fast)`})})}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`className="transition-colors duration-fast ease-out hover:bg-brand-orange-hover"
`})}),`
`,(0,d.jsxs)(t.h3,{id:`32-card-hover-normal--ease-out-で持ち上がる`,children:[`3.2 card hover (`,(0,d.jsx)(t.code,{children:`normal`}),` + `,(0,d.jsx)(t.code,{children:`ease-out`}),` で持ち上がる)`]}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`duration-normal (200ms)`}),` で card を `,(0,d.jsx)(t.code,{children:`-translate-y-0.5`}),` + `,(0,d.jsx)(t.code,{children:`shadow-md`}),`。`]}),`
`,(0,d.jsx)(i,{children:(0,d.jsxs)(`div`,{style:{width:240,padding:16,borderRadius:8,background:`#fff`,border:`1px solid #e5e7eb`,cursor:`pointer`,transitionProperty:`transform, box-shadow`,transitionDuration:`200ms`,transitionTimingFunction:`cubic-bezier(0, 0, 0.2, 1)`,boxShadow:`0 1px 2px rgba(0,0,0,0.05)`,color:`#1a1a1a`,fontFamily:`system-ui, sans-serif`},onMouseEnter:e=>{e.currentTarget.style.transform=`translateY(-2px)`,e.currentTarget.style.boxShadow=`0 4px 8px -2px rgba(0,0,0,0.1)`},onMouseLeave:e=>{e.currentTarget.style.transform=`translateY(0)`,e.currentTarget.style.boxShadow=`0 1px 2px rgba(0,0,0,0.05)`},children:[(0,d.jsx)(`strong`,{children:`EventCard 風`}),(0,d.jsx)(`p`,{style:{margin:`8px 0 0`,fontSize:13,color:`#4b5563`},children:(0,d.jsx)(t.p,{children:`hover で -2px 浮き上がる`})})]})}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`className={cn(
  "transition-[transform,box-shadow] duration-normal ease-out",
  "hover:-translate-y-0.5 hover:shadow-md"
)}
`})}),`
`,(0,d.jsx)(t.h3,{id:`33-spring-badge-pop`,children:`3.3 spring (badge pop)`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`ease-spring`}),` は overshoot するので、 `,(0,d.jsx)(t.code,{children:`transform`}),` / `,(0,d.jsx)(t.code,{children:`scale`}),` 専用にしてください
(色や opacity に使うと違和感が出ます)。`]}),`
`,(0,d.jsx)(i,{children:(0,d.jsx)(`div`,{style:{display:`inline-flex`,padding:`6px 12px`,borderRadius:9999,background:`#fef3c7`,color:`#854d0e`,fontSize:12,fontWeight:700,cursor:`pointer`,transitionProperty:`transform`,transitionDuration:`200ms`,transitionTimingFunction:`cubic-bezier(0.34, 1.56, 0.64, 1)`},onMouseEnter:e=>e.currentTarget.style.transform=`scale(1.15)`,onMouseLeave:e=>e.currentTarget.style.transform=`scale(1)`,children:(0,d.jsx)(t.p,{children:`NEW`})})}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`className="transition-transform duration-normal ease-spring hover:scale-110"
`})}),`
`,(0,d.jsxs)(t.h3,{id:`34-dialog-slow--ease-out-で開閉`,children:[`3.4 dialog (`,(0,d.jsx)(t.code,{children:`slow`}),` + `,(0,d.jsx)(t.code,{children:`ease-out`}),` で開閉)`]}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`duration-slow (300ms)`}),` で fade + scale すると、モーダルへの注意を促せます。`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-tsx`,children:`className={cn(
  "duration-slow ease-out",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
)}
`})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsxs)(t.h2,{id:`4-prefers-reduced-motion-対応-必須`,children:[`4. prefers-reduced-motion 対応 (`,(0,d.jsx)(t.strong,{children:`必須`}),`)`]}),`
`,(0,d.jsxs)(t.p,{children:[`全てのアニメーションは `,(0,d.jsx)(t.code,{children:`prefers-reduced-motion: reduce`}),` 環境で無効化される必要が
あります。 `,(0,d.jsx)(t.code,{children:`tech-event`}),` では 2 段構えで実装:`]}),`
`,(0,d.jsxs)(t.ol,{children:[`
`,(0,d.jsxs)(t.li,{children:[`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.strong,{children:`トークン側で 0ms に上書き`}),` (`,(0,d.jsx)(t.code,{children:`src/styles/tokens.css`}),`):`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-css`,children:`@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: var(--duration-instant);
    --duration-normal: var(--duration-instant);
    --duration-slow: var(--duration-instant);
    --duration-slower: var(--duration-instant);
  }
}
`})}),`
`]}),`
`,(0,d.jsxs)(t.li,{children:[`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.strong,{children:`グローバルセーフネット`}),` (`,(0,d.jsx)(t.code,{children:`src/app/globals.css`}),`):`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-css`,children:`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
`})}),`
`]}),`
`]}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.strong,{children:`コンポーネント側からは「トークンを参照するだけ」で自動的に reduced-motion 対応
になります`}),`。逆に `,(0,d.jsx)(t.code,{children:`transition-duration: 300ms`}),` のような直接値の指定は禁止です。`]}),`
`,(0,d.jsx)(t.h3,{id:`確認方法-chrome-devtools`,children:`確認方法 (Chrome DevTools)`}),`
`,(0,d.jsxs)(t.ol,{children:[`
`,(0,d.jsxs)(t.li,{children:[`DevTools を開く (`,(0,d.jsx)(t.code,{children:`F12`}),`)`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`Cmd+Shift+P`}),` (Mac) / `,(0,d.jsx)(t.code,{children:`Ctrl+Shift+P`}),` (Win/Linux) で Command Palette`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`Emulate CSS prefers-reduced-motion`}),` を選択 → `,(0,d.jsx)(t.code,{children:`reduce`}),` を指定`]}),`
`,(0,d.jsx)(t.li,{children:`ページを操作してアニメーションが無効化されることを確認`}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`5-関連リソース`,children:`5. 関連リソース`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`docs/motion.md`}),` — フル仕様 + アンチパターン集`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`tokens/motion.json`}),` — Figma Tokens Studio 連携用 JSON`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`src/styles/tokens.css`}),` — motion トークンの定義`]}),`
`]})]})}function u(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(l,{...e})}):l(e)}var d;e((()=>{d=t(),c(),a()}))();export{u as default};