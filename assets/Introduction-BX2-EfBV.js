import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,f as i,p as a,s as o,u as s}from"./blocks-DyqvvloQ.js";import{t as c}from"./mdx-react-shim-Co4r-mY_.js";function l(e){let t={code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Design System/Introduction`}),`
`,(0,d.jsx)(r,{children:`tech-event デザインシステム`}),`
`,(0,d.jsx)(s,{children:`connpass と Luma の中間 — 機能密度と質感を両立する UI 基盤`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`tech-event`}),` (connpass クローン) で利用するデザイントークン、UI primitives、composite components の総合ドキュメントです。
本ページ群は `,(0,d.jsx)(t.code,{children:`docs/design-system.md`}),` の Storybook 版で、実物の色見本やフォントサンプルを使ってデザイン仕様を確認できます。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`1-ねらい`,children:`1. ねらい`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`本家 connpass と Luma の中間`}),`: 機能密度を優先するが、フラットすぎる古い見栄えにはしない。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`情報優先`}),`: 一覧画面は 1 行あたりの情報量を最大化 (タイトル / グループ / 日時 / 会場 / 参加者数 を 1 行で読ませる)。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`モダンな質感`}),`: 角丸 4-8px、淡いシャドウ、`,(0,d.jsx)(t.code,{children:`hover:-translate-y-0.5`}),` などの微細なアニメーションで「触れる感」を出す。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`アクセシビリティを後付けにしない`}),`: フォーカスリング・aria 属性・色だけに依存しないステータス表示を最初から組み込む。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`JS なしでも動作`}),`: 検索フォーム・ページネーション・パンくず等は SSR とリンクで完結。Client Component は最小限。`]}),`
`]}),`
`,(0,d.jsxs)(t.p,{children:[`詳細は本 Introduction の各ページおよび `,(0,d.jsx)(t.code,{children:`docs/design-system.md`}),` を参照してください。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`2-トークン構造-4-階層`,children:`2. トークン構造 (4 階層)`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`tech-event`}),` はトークンを 4 段に分けています。アプリケーション側からは `,(0,d.jsx)(t.strong,{children:`semantic layer 以上`}),` のみを参照する規約です。`]}),`
`,(0,d.jsx)(i,{children:(0,d.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`auto 1fr`,gap:`8px 16px`,padding:`16px`,border:`1px solid #e5e7eb`,borderRadius:`8px`,background:`#ffffff`,color:`#1a1a1a`,fontFamily:`system-ui, sans-serif`,fontSize:`14px`,lineHeight:1.7},children:[(0,d.jsx)(`strong`,{children:`1. Primitive tokens`}),(0,d.jsx)(`span`,{children:(0,d.jsxs)(t.p,{children:[(0,d.jsx)(`code`,{children:`src/styles/tokens.css`}),` — 生の値 (gray-50 〜 950 等の色スケール、font-size、spacing、radius、shadow、z-index)。
意味を持たない。テーマに依存しない。`]})}),(0,d.jsx)(`strong`,{children:`2. Semantic tokens`}),(0,d.jsx)(`span`,{children:(0,d.jsxs)(t.p,{children:[(0,d.jsx)(`code`,{children:`src/styles/semantic.css`}),` — テーマ非依存の alias (radius-control / radius-card 等)。`]})}),(0,d.jsx)(`strong`,{children:`3. Themes (light/dark)`}),(0,d.jsx)(`span`,{children:(0,d.jsxs)(t.p,{children:[(0,d.jsx)(`code`,{children:`src/styles/themes/light.css`}),` / `,(0,d.jsx)(`code`,{children:`dark.css`}),` — primitive を「background」「foreground」「brand」等の意味名にマッピング。
light/dark で同じ semantic 名を提供。`]})}),(0,d.jsx)(`strong`,{children:`4. UI primitives`}),(0,d.jsx)(`span`,{children:(0,d.jsxs)(t.p,{children:[(0,d.jsx)(`code`,{children:`src/components/ui/`}),` — Button / Input / Dialog 等の shadcn 系 primitives 21 個。semantic token のみを参照。`]})}),(0,d.jsx)(`strong`,{children:`5. Composite components`}),(0,d.jsx)(`span`,{children:(0,d.jsxs)(t.p,{children:[(0,d.jsx)(`code`,{children:`src/components/`}),` — EventCard / GroupCard / Header 等のドメイン特化 17 components。
primitives を組み合わせて構成。`]})})]})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`3-見取り図--どこから読むか`,children:`3. 見取り図 — どこから読むか`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`ページ`}),(0,d.jsx)(t.th,{children:`内容`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Tokens`})}),(0,d.jsxs)(t.td,{children:[`トークン全体像、`,(0,d.jsx)(t.code,{children:`tokens.css`}),` の中身、light/dark テーマ概要`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Colors`})}),(0,d.jsx)(t.td,{children:`カラースケール (gray/orange/red/green/blue/yellow)、semantic colors、WCAG コントラスト`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Typography`})}),(0,d.jsx)(t.td,{children:`フォントサイズ・ウェイト・行間の実サンプル`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Spacing`})}),(0,d.jsx)(t.td,{children:`spacing-0 〜 24 のビジュアル比較`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Radius`})}),(0,d.jsx)(t.td,{children:`radius / shadow / z-index 一覧`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Components`})}),(0,d.jsx)(t.td,{children:`primitives 21 個 + composite 17 個の早見表`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Accessibility`})}),(0,d.jsx)(t.td,{children:`フォーカスリング設計、aria 規約、axe-core 結果`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Dark Mode`})}),(0,d.jsx)(t.td,{children:`ThemeProvider の使い方、light/dark トークン対比表`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`Component Checklist`})}),(0,d.jsx)(t.td,{children:`新規コンポーネント追加時のチェックリスト`})]})]})]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`4-関連リソース`,children:`4. 関連リソース`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`docs/design-system.md`}),` — 本デザインシステムの一次ドキュメント (原本)。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`docs/completion-report.md`}),` — フェーズ完了レポート。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`docs/perf-report.md`}),` — パフォーマンスレポート。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`research/`}),` — 実装前の調査資料 (connpass / Luma リファレンス、UX フロー、API/データモデル)。`,`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`research/luma/`}),` — Luma のリファレンススクリーンショット。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`research/ux-flows/`}),` — UX フロー設計メモ。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`research/visual-diff-report.md`}),` — connpass 本家とのビジュアル差分レポート。`]}),`
`]}),`
`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`src/styles/tokens.css`}),` / `,(0,d.jsx)(t.code,{children:`themes/light.css`}),` / `,(0,d.jsx)(t.code,{children:`themes/dark.css`}),` — トークンの一次定義 (single source of truth)。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`src/app/globals.css`}),` — Tailwind v4 `,(0,d.jsx)(t.code,{children:`@theme inline`}),` でトークンをユーティリティクラス化。`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`5-ライブラリ依存`,children:`5. ライブラリ依存`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`React 19 / Next.js 16`}),` (App Router)`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`Tailwind CSS v4`}),` (`,(0,d.jsx)(t.code,{children:`@theme inline`}),` ベース)`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`Radix UI primitives`}),` — Dialog / Dropdown / Tooltip / Toast / Tabs / Popover / Switch / Select etc.`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`class-variance-authority (cva)`}),` — variants`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`lucide-react`}),` — アイコン`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`Storybook 10`}),` (`,(0,d.jsx)(t.code,{children:`@storybook/nextjs-vite`}),`) — UI カタログ + a11y addon`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`@axe-core/playwright`}),` — A11y 自動走査`]}),`
`]})]})}function u(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(l,{...e})}):l(e)}var d;e((()=>{d=t(),c(),a()}))();export{u as default};