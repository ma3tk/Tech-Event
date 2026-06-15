import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,f as i,p as a,s as o,u as s}from"./blocks-DSdAlscu.js";import{t as c}from"./mdx-react-shim-DaZ3R4gt.js";function l(e){let t={code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,input:`input`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(o,{title:`Design System/Accessibility`}),`
`,(0,d.jsx)(r,{children:`Accessibility`}),`
`,(0,d.jsx)(s,{children:`WCAG AA を後付けにしない設計`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`tech-event`}),` ではアクセシビリティをコンポーネント実装後に「対応する」のではなく、
`,(0,d.jsx)(t.strong,{children:`設計時点から組み込み`}),`、CI で自動検証しています。
すべての semantic colors が WCAG AA 以上を満たし、`,(0,d.jsx)(t.code,{children:`axe-core`}),` で違反 0 をターゲットとしています。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`1-フォーカスリング設計`,children:`1. フォーカスリング設計`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`globals.css`}),` でグローバル `,(0,d.jsx)(t.code,{children:`:focus-visible`}),` ルールを定義済み:`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-css`,children:`*:focus-visible {
  outline: 2px solid var(--brand-orange);
  outline-offset: 2px;
  border-radius: 2px;
}
`})}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsxs)(t.strong,{children:[(0,d.jsx)(t.code,{children:`focus-visible`}),` を使う`]}),` (`,(0,d.jsx)(t.code,{children:`focus`}),` ではない) — マウスクリックでフォーカスが見えるのを抑制し、キーボード時のみ強調。`]}),`
`,(0,d.jsxs)(t.li,{children:[`色は `,(0,d.jsx)(t.code,{children:`--brand-orange`}),` (light: `,(0,d.jsx)(t.code,{children:`#c2410c`}),`, dark: `,(0,d.jsx)(t.code,{children:`#f97316`}),`) なので、theme 切替で自動追従。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.code,{children:`outline-offset: 2px`}),` で要素の角丸を隠さない。`]}),`
`,(0,d.jsxs)(t.li,{children:[`フォーカスリングを CSS で隠す ( `,(0,d.jsx)(t.code,{children:`outline: none`}),` を上書き ) のは `,(0,d.jsx)(t.strong,{children:`禁止`}),`。隠す場合は代替の視覚インジケータを必須にする。`]}),`
`]}),`
`,(0,d.jsx)(i,{children:(0,d.jsxs)(`div`,{style:{display:`flex`,gap:`16px`,alignItems:`center`,padding:`16px`,background:`#fff`,border:`1px solid #e5e7eb`,borderRadius:`8px`,fontFamily:`system-ui, sans-serif`,fontSize:`13px`},children:[(0,d.jsx)(`button`,{style:{padding:`8px 16px`,background:`#c2410c`,color:`#fff`,border:`none`,borderRadius:`8px`,outline:`2px solid #c2410c`,outlineOffset:`2px`,fontSize:`13px`,cursor:`pointer`},children:(0,d.jsx)(t.p,{children:`フォーカス状態`})}),(0,d.jsx)(`span`,{style:{color:`#6b7280`},children:(0,d.jsx)(t.p,{children:`← 全てのインタラクティブ要素はこのリングで囲まれる`})})]})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`2-キーボード操作`,children:`2. キーボード操作`}),`
`,(0,d.jsx)(t.h3,{id:`21-必須サポート`,children:`2.1 必須サポート`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`キー`}),(0,d.jsx)(t.th,{children:`期待される挙動`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`Tab`}),` / `,(0,d.jsx)(t.code,{children:`Shift+Tab`})]}),(0,d.jsx)(t.td,{children:`順方向 / 逆方向のフォーカス移動`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`Enter`})}),(0,d.jsx)(t.td,{children:`リンクをクリック / ボタンを実行 / フォーム送信`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`Space`})}),(0,d.jsx)(t.td,{children:`ボタン実行 / Checkbox トグル / Select 展開`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`Esc`})}),(0,d.jsx)(t.td,{children:`モーダル / ポップオーバー / メニューを閉じる`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`↑`}),` / `,(0,d.jsx)(t.code,{children:`↓`})]}),(0,d.jsx)(t.td,{children:`メニュー内 / RadioGroup 内の項目移動`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`←`}),` / `,(0,d.jsx)(t.code,{children:`→`})]}),(0,d.jsx)(t.td,{children:`Tabs 内のタブ移動 / Carousel 移動`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`Home`}),` / `,(0,d.jsx)(t.code,{children:`End`})]}),(0,d.jsx)(t.td,{children:`リスト先頭 / 末尾へジャンプ`})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`22-フォーカス順`,children:`2.2 フォーカス順`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`DOM 順`}),` = フォーカス順 = 読み上げ順。 `,(0,d.jsx)(t.code,{children:`tabindex`}),` の正の値は使わない (`,(0,d.jsx)(t.code,{children:`tabindex="0"`}),` か `,(0,d.jsx)(t.code,{children:`"-1"`}),` のみ可)。`]}),`
`,(0,d.jsxs)(t.li,{children:[`モーダルを開いている間は `,(0,d.jsx)(t.strong,{children:`focus trap`}),` を実装 (Radix Dialog / Popover が自動でやる)。`]}),`
`,(0,d.jsx)(t.li,{children:`モーダルを閉じたら、開く前にフォーカスがあった要素に戻す (Radix 標準動作)。`}),`
`]}),`
`,(0,d.jsx)(t.h3,{id:`23-スキップリンク`,children:`2.3 スキップリンク`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`Header`}),` の先頭に `,(0,d.jsx)(t.code,{children:`<a className="skip-link" href="#main-content">メインへスキップ</a>`}),` を配置。
普段は視覚的に隠れていて、フォーカス時のみ可視化されます。`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`3-aria-規約`,children:`3. ARIA 規約`}),`
`,(0,d.jsx)(t.h3,{id:`31-役割-role`,children:`3.1 役割 (role)`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[`セマンティック HTML を優先 (`,(0,d.jsx)(t.code,{children:`<button>`}),`, `,(0,d.jsx)(t.code,{children:`<a>`}),`, `,(0,d.jsx)(t.code,{children:`<nav>`}),`, `,(0,d.jsx)(t.code,{children:`<header>`}),`, `,(0,d.jsx)(t.code,{children:`<main>`}),`)。`,(0,d.jsx)(t.code,{children:`<div role="button">`}),` は避ける。`]}),`
`,(0,d.jsxs)(t.li,{children:[`例外: 既存タグでは表現できない構造 (`,(0,d.jsx)(t.code,{children:`role="status"`}),`, `,(0,d.jsx)(t.code,{children:`role="alert"`}),`, `,(0,d.jsx)(t.code,{children:`role="dialog"`}),`) は使う。`]}),`
`]}),`
`,(0,d.jsx)(t.h3,{id:`32-状態属性`,children:`3.2 状態属性`}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`用途`}),(0,d.jsx)(t.th,{children:`属性`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`トグルボタン`}),(0,d.jsx)(t.td,{children:'`aria-pressed="true'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`展開可能要素`}),(0,d.jsx)(t.td,{children:'`aria-expanded="true'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`メニュー保有`}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`aria-haspopup="menu"`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`選択中`}),(0,d.jsx)(t.td,{children:'`aria-selected="true'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`無効`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`aria-disabled="true"`}),` (`,(0,d.jsx)(t.code,{children:`disabled`}),` 属性と併用可)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`必須入力`}),(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`aria-required="true"`})})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`エラー`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`aria-invalid="true"`}),` + `,(0,d.jsx)(t.code,{children:`aria-describedby`}),` でメッセージ参照`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`動的更新`}),(0,d.jsx)(t.td,{children:'`aria-live="polite'})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`進行中`}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.code,{children:`aria-busy="true"`}),` (loading 時)`]})]})]})]}),`
`,(0,d.jsx)(t.h3,{id:`33-ラベル`,children:`3.3 ラベル`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`アイコンのみのボタン`}),` には必ず `,(0,d.jsx)(t.code,{children:`aria-label`}),` を付ける (例: `,(0,d.jsx)(t.code,{children:`<button aria-label="検索">`}),`)。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`入力欄`}),` には `,(0,d.jsx)(t.code,{children:`<label for>`}),` か `,(0,d.jsx)(t.code,{children:`aria-labelledby`}),` を必須 (`,(0,d.jsx)(t.code,{children:`placeholder`}),` は label の代替にしない)。`]}),`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`装飾アイコン`}),` には `,(0,d.jsx)(t.code,{children:`aria-hidden="true"`}),` を付け、SR 読み上げから除外する。`]}),`
`]}),`
`,(0,d.jsx)(t.h3,{id:`34-ライブリージョン`,children:`3.4 ライブリージョン`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[`フォーム送信結果 / 検索件数の更新 → `,(0,d.jsx)(t.code,{children:`<div role="status" aria-live="polite">`})]}),`
`,(0,d.jsxs)(t.li,{children:[`重要なエラー → `,(0,d.jsx)(t.code,{children:`<div role="alert" aria-live="assertive">`})]}),`
`,(0,d.jsxs)(t.li,{children:[`通知トースト → Radix Toast が `,(0,d.jsx)(t.code,{children:`role="status"`}),` を自動付与`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`4-色だけに依存しない`,children:`4. 色だけに依存しない`}),`
`,(0,d.jsxs)(t.p,{children:[`ステータスを表示する際は `,(0,d.jsx)(t.strong,{children:`色 + テキスト`}),` (またはアイコン) を必ず併用:`]}),`
`,(0,d.jsx)(i,{children:(0,d.jsxs)(`div`,{style:{display:`flex`,gap:`12px`,alignItems:`center`,padding:`16px`,background:`#fff`,border:`1px solid #e5e7eb`,borderRadius:`8px`,fontFamily:`system-ui, sans-serif`,fontSize:`13px`},children:[(0,d.jsxs)(`div`,{children:[(0,d.jsx)(`p`,{style:{margin:`0 0 8px`,color:`#6b7280`,fontSize:`11px`},children:`NG (色のみ)`}),(0,d.jsx)(`div`,{style:{width:`12px`,height:`12px`,background:`#22c55e`,borderRadius:`9999px`}})]}),(0,d.jsxs)(`div`,{style:{marginLeft:`24px`},children:[(0,d.jsx)(`p`,{style:{margin:`0 0 8px`,color:`#6b7280`,fontSize:`11px`},children:`OK (色 + テキスト)`}),(0,d.jsxs)(`span`,{style:{display:`inline-flex`,alignItems:`center`,gap:`6px`,padding:`4px 10px`,background:`#dcfce7`,color:`#14532d`,borderRadius:`4px`,fontSize:`12px`,fontWeight:600},children:[(0,d.jsx)(`span`,{style:{width:`8px`,height:`8px`,background:`#22c55e`,borderRadius:`9999px`}}),(0,d.jsx)(t.p,{children:`募集中`})]})]})]})}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`5-タッチターゲット`,children:`5. タッチターゲット`}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[`最小 `,(0,d.jsx)(t.strong,{children:`36 × 36 px`}),` (`,(0,d.jsx)(t.code,{children:`min-h-9 min-w-9`}),`)。`]}),`
`,(0,d.jsxs)(t.li,{children:[`モバイルでは `,(0,d.jsx)(t.strong,{children:`44 × 44 px`}),` を推奨 (Apple HIG / WCAG 2.5.5)。`]}),`
`,(0,d.jsxs)(t.li,{children:[`隣接するクリックターゲットは 8px 以上離す (`,(0,d.jsx)(t.code,{children:`gap-2`}),`)。`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`6-prefers-reduced-motion`,children:`6. prefers-reduced-motion`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`globals.css`}),` で全 `,(0,d.jsx)(t.code,{children:`transition`}),` / `,(0,d.jsx)(t.code,{children:`animation`}),` の自動無効化を実装済み:`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-css`,children:`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`})}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsxs)(t.strong,{children:[`CSS の `,(0,d.jsx)(t.code,{children:`transition-*`}),` / `,(0,d.jsx)(t.code,{children:`animation-*`}),` を使う`]}),` (JS 主導のアニメは避ける) と自動的に尊重される。`]}),`
`,(0,d.jsxs)(t.li,{children:[`どうしても JS で動かす場合は `,(0,d.jsx)(t.code,{children:`window.matchMedia('(prefers-reduced-motion: reduce)')`}),` を確認する。`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`7-axe-core-自動走査結果-最終`,children:`7. axe-core 自動走査結果 (最終)`}),`
`,(0,d.jsxs)(t.p,{children:[`CI で `,(0,d.jsx)(t.code,{children:`@axe-core/playwright`}),` を以下のターゲットに対し実行。
結果スナップショットは `,(0,d.jsx)(t.code,{children:`screenshots/components/_axe.json`}),` / `,(0,d.jsx)(t.code,{children:`_axe-pages.json`}),` に出力。`]}),`
`,(0,d.jsxs)(t.h3,{id:`71-components-ショーケース-e2ecomponents-a11yspects`,children:[`7.1 `,(0,d.jsx)(t.code,{children:`/components`}),` ショーケース (`,(0,d.jsx)(t.code,{children:`e2e/components-a11y.spec.ts`}),`)`]}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`指標`}),(0,d.jsx)(t.th,{children:`値`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`passes`}),(0,d.jsx)(t.td,{children:`31 ルール`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`violations`}),(0,d.jsxs)(t.td,{children:[`1 ルール (`,(0,d.jsx)(t.code,{children:`aria-prohibited-attr`}),`, serious, 3 ノード)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.strong,{children:`color-contrast 違反`})}),(0,d.jsxs)(t.td,{children:[(0,d.jsx)(t.strong,{children:`0 件`}),` (WCAG AA / AAA 準拠を全トークンで確認)`]})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:`critical / serious blocker`}),(0,d.jsxs)(t.td,{children:[`1 (Pagination の disabled `,(0,d.jsx)(t.code,{children:`<a>`}),` に `,(0,d.jsx)(t.code,{children:`aria-label`}),` を付与している箇所。`,(0,d.jsx)(t.code,{children:`<button>`}),` 置換 or `,(0,d.jsx)(t.code,{children:`aria-hidden`}),` 化で解消予定)`]})]})]})]}),`
`,(0,d.jsxs)(t.h3,{id:`72-主要-10-ページ-e2ea11y-pagesspects`,children:[`7.2 主要 10 ページ (`,(0,d.jsx)(t.code,{children:`e2e/a11y-pages.spec.ts`}),`)`]}),`
`,(0,d.jsxs)(t.table,{children:[(0,d.jsx)(t.thead,{children:(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.th,{children:`ページ`}),(0,d.jsx)(t.th,{style:{textAlign:`right`},children:`violations`}),(0,d.jsx)(t.th,{style:{textAlign:`right`},children:`blockers`}),(0,d.jsx)(t.th,{children:`既知 design (warn)`})]})}),(0,d.jsxs)(t.tbody,{children:[(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`1`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`color-contrast × 1`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/explore`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`1`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`1`}),(0,d.jsx)(t.td,{children:`Pagination の上記課題`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/event/1`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`—`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/group/findy`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`—`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/user/fast_moon_169`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`—`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/calendar/ai-developers`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`—`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/ranking`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`—`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/login`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`1`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`(minor)`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/signup`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`1`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`(minor)`})]}),(0,d.jsxs)(t.tr,{children:[(0,d.jsx)(t.td,{children:(0,d.jsx)(t.code,{children:`/dashboard`})}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{style:{textAlign:`right`},children:`0`}),(0,d.jsx)(t.td,{children:`—`})]})]})]}),`
`,(0,d.jsxs)(t.ul,{children:[`
`,(0,d.jsxs)(t.li,{children:[(0,d.jsx)(t.strong,{children:`WCAG AA color-contrast: 主要 10 ページ中 9 ページで違反 0`}),`。`]}),`
`,(0,d.jsxs)(t.li,{children:[`残 1 件 (`,(0,d.jsx)(t.code,{children:`/`}),`) は装飾用淡背景上の補助テキストで、`,(0,d.jsx)(t.code,{children:`text-muted-foreground`}),` への置換で解消予定。`]}),`
`,(0,d.jsxs)(t.li,{children:[`critical/serious blocker は `,(0,d.jsx)(t.code,{children:`aria-prohibited-attr`}),` 1 種のみ。
Pagination の前/次が disabled のとき `,(0,d.jsx)(t.code,{children:`<a aria-label>`}),` を残したままなので、`,(0,d.jsx)(t.code,{children:`aria-disabled`}),` 追加 + `,(0,d.jsx)(t.code,{children:`aria-hidden`}),` 化で CI 完全グリーン化可能。`]}),`
`]}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`8-storybook-addon-a11y`,children:`8. Storybook addon-a11y`}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`.storybook/main.ts`}),` に `,(0,d.jsx)(t.code,{children:`@storybook/addon-a11y`}),` を組み込み済み。
各 Story の `,(0,d.jsx)(t.strong,{children:`Accessibility`}),` タブで axe の検査結果がリアルタイムに見られます。`]}),`
`,(0,d.jsxs)(t.p,{children:[(0,d.jsx)(t.code,{children:`.storybook/preview.ts`}),` での設定:`]}),`
`,(0,d.jsx)(t.pre,{children:(0,d.jsx)(t.code,{className:`language-ts`,children:`a11y: {
  test: "todo", // CI を落とさないため warning として扱う
}
`})}),`
`,(0,d.jsx)(t.p,{children:`新規 Story 追加時は、サイドバーの A11y タブで violation 0 を確認してから merge してください。`}),`
`,(0,d.jsx)(t.hr,{}),`
`,(0,d.jsx)(t.h2,{id:`9-チェックリスト`,children:`9. チェックリスト`}),`
`,(0,d.jsxs)(t.p,{children:[`新規 / 変更コンポーネントを書いたら必ず以下を確認 (詳細は `,(0,d.jsx)(t.strong,{children:`Component Checklist`}),` ページ):`]}),`
`,(0,d.jsxs)(t.ul,{className:`contains-task-list`,children:[`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`Tab で全ての対話要素にフォーカスが当たる。順序は論理的。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,(0,d.jsx)(t.code,{children:`:focus-visible`}),` のグローバル outline が機能している。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`aria 属性 (`,(0,d.jsx)(t.code,{children:`aria-pressed`}),`, `,(0,d.jsx)(t.code,{children:`aria-expanded`}),`, `,(0,d.jsx)(t.code,{children:`aria-label`}),` 等) を適切に付与。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`ステータスは色 + テキスト両方で表現。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`テキスト vs 背景の WCAG AA (4.5:1) を満たす。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`装飾画像は `,(0,d.jsx)(t.code,{children:`alt=""`}),`、意味を持つ画像は内容を記述。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`見出し階層をスキップしない (`,(0,d.jsx)(t.code,{children:`h2 → h3`}),`)。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`タッチターゲット最小 36×36px。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`アニメーションは `,(0,d.jsx)(t.code,{children:`transition-*`}),` で記述 (`,(0,d.jsx)(t.code,{children:`prefers-reduced-motion`}),` 自動対応)。`]}),`
`,(0,d.jsxs)(t.li,{className:`task-list-item`,children:[(0,d.jsx)(t.input,{type:`checkbox`,disabled:!0}),` `,`Storybook a11y タブで violation 0。`]}),`
`]})]})}function u(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,d.jsx)(t,{...e,children:(0,d.jsx)(l,{...e})}):l(e)}var d;e((()=>{d=t(),c(),a()}))();export{u as default};