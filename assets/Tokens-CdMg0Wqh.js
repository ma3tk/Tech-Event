import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,f as i,p as a,s as o,u as s}from"./blocks-DyqvvloQ.js";import{t as c}from"./mdx-react-shim-Co4r-mY_.js";function l(e){let t={code:`code`,h2:`h2`,hr:`hr`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,...n(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Design System/Tokens`}),`
`,(0,d.jsx)(r,{children:`Tokens — 全体像`}),`
`,(0,d.jsx)(s,{children:`primitive → semantic → theme の 3 階層構造`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`tech-event`}),` のすべての視覚要素は 3 階層のトークンから成ります。
コンポーネント側からは `,(0,d.jsxs)(t.strong,{children:[`semantic 名 (例: `,(0,d.jsx)(t.code,{children:`bg-background`}),`, `,(0,d.jsx)(t.code,{children:`text-foreground`}),`, `,(0,d.jsx)(t.code,{children:`bg-brand-orange`}),`)`]}),` のみを参照し、
primitive (生の色) を直接書かないのが規約です。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`1-階層構造`,children:`1. 階層構造`}),`
`,(0,d.jsx)(i,{children:(0,d.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(3, 1fr)`,gap:`12px`,padding:`0`,fontFamily:`system-ui, sans-serif`,fontSize:`13px`,lineHeight:1.55,color:`#1a1a1a`},children:[(0,d.jsxs)(`div`,{style:{padding:`16px`,border:`1px solid #e5e7eb`,borderRadius:`8px`,background:`#fff`},children:[(0,d.jsx)(`strong`,{style:{fontSize:`14px`},children:`1. Primitive`}),(0,d.jsx)(`p`,{style:{margin:`8px 0 6px`,color:`#4b5563`},children:(0,d.jsx)(`code`,{children:`src/styles/tokens.css`})}),(0,d.jsx)(`p`,{children:`テーマに依存しない「生の値」。色スケール / size / shadow / z-index。`}),(0,d.jsx)(`p`,{style:{marginTop:`6px`,color:`#6b7280`},children:(0,d.jsxs)(t.p,{children:[`例: `,(0,d.jsx)(`code`,{children:`--color-orange-700: #c2410c`})]})})]}),(0,d.jsxs)(`div`,{style:{padding:`16px`,border:`1px solid #e5e7eb`,borderRadius:`8px`,background:`#fff`},children:[(0,d.jsx)(`strong`,{style:{fontSize:`14px`},children:`2. Semantic`}),(0,d.jsx)(`p`,{style:{margin:`8px 0 6px`,color:`#4b5563`},children:(0,d.jsxs)(`code`,{children:[`src/styles/themes/`,`{light,dark}`,`.css`]})}),(0,d.jsx)(`p`,{children:`意味を持った alias。primitive を「background」「foreground」「brand」等にマッピング。`}),(0,d.jsx)(`p`,{style:{marginTop:`6px`,color:`#6b7280`},children:(0,d.jsxs)(t.p,{children:[`例: `,(0,d.jsx)(`code`,{children:`--brand-orange: var(--color-orange-700)`})]})})]}),(0,d.jsxs)(`div`,{style:{padding:`16px`,border:`1px solid #e5e7eb`,borderRadius:`8px`,background:`#fff`},children:[(0,d.jsx)(`strong`,{style:{fontSize:`14px`},children:`3. Tailwind utility`}),(0,d.jsx)(`p`,{style:{margin:`8px 0 6px`,color:`#4b5563`},children:(0,d.jsxs)(t.p,{children:[(0,d.jsx)(`code`,{children:`src/app/globals.css`}),` の `,(0,d.jsx)(`code`,{children:`@theme inline`})]})}),(0,d.jsxs)(`p`,{children:[`semantic 変数を Tailwind の `,(0,d.jsx)(`code`,{children:`bg-*`}),` / `,(0,d.jsx)(`code`,{children:`text-*`}),` 等にブリッジ。`]}),(0,d.jsx)(`p`,{style:{marginTop:`6px`,color:`#6b7280`},children:(0,d.jsxs)(t.p,{children:[`例: `,(0,d.jsx)(`code`,{children:`bg-brand-orange`})]})})]})]})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`2-primitive-vs-semantic--使い分け`,children:`2. Primitive vs Semantic — 使い分け`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`階層`}),(0,d.jsx)(t.th,{children:`コンポーネント側からの参照`}),(0,d.jsx)(t.th,{children:`例`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`Primitive`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.strong,{children:`使わない`}),` (テーマ非対応になる)`]}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`bg-[var(--color-orange-700)]`}),` ← NG`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`Semantic`}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`常にこちらを使う`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`bg-brand-orange`}),` ← OK`]})]})]})]}),`
`,(0,d.jsx)(t.p,{children:`semantic 名にしか「light で何 / dark で何」のマッピング情報が無いため、primitive を直接使うと自動的にダークモード非対応になります。`}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsxs)(t.h2,{id:`3-tokenscss-の中身-primitive-一覧`,children:[`3. `,(0,d.jsx)(t.code,{children:`tokens.css`}),` の中身 (primitive 一覧)`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-css`,children:`:root {
  /* ---- Color scales ---- */
  /* Gray */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  --color-gray-950: #030712;

  /* Orange (brand) */
  --color-orange-50: #fff7ed;
  --color-orange-100: #ffedd5;
  --color-orange-200: #fed7aa;
  --color-orange-300: #fdba74;
  --color-orange-400: #fb923c;
  --color-orange-500: #f97316;
  --color-orange-600: #ea580c;
  --color-orange-700: #c2410c;
  --color-orange-800: #9a3412;
  --color-orange-900: #7c2d12;
  --color-orange-950: #431407;

  /* Red / Green / Blue / Yellow も同様に 50〜950 (Tailwind v4 標準パレット) */

  /* connpass 由来のリンクブルー (link 専用系) */
  --color-link-blue-500: #006aa1;
  --color-link-blue-600: #005d8c;
  --color-link-blue-700: #004161;
  --color-link-blue-300: #4aa8d4;
  --color-link-blue-200: #7dc4e0;

  /* ---- Typography ---- */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.375rem;   /* 22px */
  --font-size-2xl: 1.75rem;   /* 28px */
  --font-size-3xl: 2.25rem;   /* 36px */
  --font-size-4xl: 3rem;      /* 48px */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-snug: 1.4;
  --line-height-normal: 1.6;
  --line-height-relaxed: 1.7;

  /* ---- Spacing (4px ステップ) ---- */
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  --spacing-24: 6rem;     /* 96px */

  /* ---- Radius ---- */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  /* ---- Shadow ---- */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* ---- Z-index ---- */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 1000;
  --z-popover: 1100;
  --z-toast: 1200;
}
`})}),`
`,(0,d.jsxs)(t.p,{children:[`完全な定義は `,(0,d.jsx)(t.code,{children:`src/styles/tokens.css`}),` を参照してください。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`4-lightdark-テーマ概要`,children:`4. light/dark テーマ概要`}),`
`,(0,d.jsxs)(t.p,{children:[`semantic alias は `,(0,d.jsx)(t.code,{children:`src/styles/themes/light.css`}),` (デフォルト) と `,(0,d.jsx)(t.code,{children:`dark.css`}),` の 2 ファイルに分かれています。
切替はルート要素の `,(0,d.jsx)(t.code,{children:`data-theme`}),` 属性で行います。`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-css`,children:`/* light.css の概要 */
:root,
[data-theme="light"] {
  color-scheme: light;
  --background: #f7f7f5;
  --surface: var(--color-white);
  --foreground: #1a1a1a;
  --brand-orange: var(--color-orange-700);    /* #c2410c, AA: 4.93:1 */
  --link: var(--color-link-blue-600);          /* #005d8c */
  /* ... status colors etc. */
}

/* dark.css の概要 */
[data-theme="dark"] {
  color-scheme: dark;
  --background: var(--color-gray-950);
  --surface: var(--color-gray-900);
  --foreground: var(--color-gray-50);
  --brand-orange: var(--color-orange-500);    /* 暗背景で AA を維持 */
  --link: var(--color-link-blue-300);         /* AAA: 7.1:1 vs gray-950 */
  /* ... */
}
`})}),`
`,(0,d.jsxs)(t.p,{children:[`詳細は `,(0,d.jsx)(t.strong,{children:`Colors`}),` と `,(0,d.jsx)(t.strong,{children:`Dark Mode`}),` ページを参照してください。`]})]})}function u(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(l,{...e})}):l(e)}var d;e((()=>{d=t(),c(),a()}))();export{u as default};