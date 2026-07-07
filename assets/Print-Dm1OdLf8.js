import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,p as i,s as a,u as o}from"./blocks-DyqvvloQ.js";import{t as s}from"./mdx-react-shim-Co4r-mY_.js";function c(e){let t={code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(a,{title:`Design System/Print`}),`
`,(0,u.jsx)(r,{children:`印刷スタイル`}),`
`,(0,u.jsx)(o,{children:`紙とインクにやさしい / リンク URL を残す / QR は保持`}),`
`,(0,u.jsxs)(t.p,{children:[(0,u.jsx)(t.code,{children:`tech-event`}),` は `,(0,u.jsx)(t.strong,{children:(0,u.jsx)(t.code,{children:`@media print`})}),` 専用のスタイルシート (`,(0,u.jsx)(t.code,{children:`src/styles/print.css`}),`) を持ち、`,(0,u.jsx)(t.code,{children:`Ctrl + P`}),` で「読みやすい紙の出力」を 1 発で得られるよう設計されています。`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`1-方針`,children:`1. 方針`}),`
`,(0,u.jsxs)(t.table,{children:[(0,u.jsx)(t.thead,{children:(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.th,{children:`#`}),(0,u.jsx)(t.th,{children:`項目`}),(0,u.jsx)(t.th,{children:`動作`})]})}),(0,u.jsxs)(t.tbody,{children:[(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`1`}),(0,u.jsx)(t.td,{children:`ヘッダー・フッター・サイドバー`}),(0,u.jsxs)(t.td,{children:[`非表示 (`,(0,u.jsx)(t.code,{children:`display: none !important`}),`)`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`2`}),(0,u.jsx)(t.td,{children:`Toast / Dialog / Sheet`}),(0,u.jsx)(t.td,{children:`非表示`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`3`}),(0,u.jsx)(t.td,{children:`背景色 / グラデ / shadow`}),(0,u.jsx)(t.td,{children:`全削除 — テキストは黒、背景は白`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`4`}),(0,u.jsx)(t.td,{children:`リンクの実 URL`}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`a[href]:after { content: " (" attr(href) ")" }`}),` で末尾に展開`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`5`}),(0,u.jsxs)(t.td,{children:[`内部リンク `,(0,u.jsx)(t.code,{children:`#id`}),` / `,(0,u.jsx)(t.code,{children:`mailto:`})]}),(0,u.jsx)(t.td,{children:`URL 補足を出さない (紙では意味なし)`})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`6`}),(0,u.jsx)(t.td,{children:`QR コード / アバター画像`}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`data-print-keep`}),` を付けると色を維持`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`7`}),(0,u.jsx)(t.td,{children:`見出しの page-break`}),(0,u.jsxs)(t.td,{children:[`h1/h2/h3 は次ページ先頭に "ぶら下がり" しない (`,(0,u.jsx)(t.code,{children:`page-break-after: avoid`}),`)`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`8`}),(0,u.jsx)(t.td,{children:`画像・テーブル`}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`page-break-inside: avoid`}),` で 1 枚に収める`]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`9`}),(0,u.jsx)(t.td,{children:`余白`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`@page { margin: 16mm }`})})]})]})]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`2-利用方法`,children:`2. 利用方法`}),`
`,(0,u.jsx)(t.h3,{id:`21-非表示にしたい要素`,children:`2.1 非表示にしたい要素`}),`
`,(0,u.jsxs)(t.p,{children:[`すでに `,(0,u.jsx)(t.code,{children:`header[role="banner"]`}),` / `,(0,u.jsx)(t.code,{children:`footer[role="contentinfo"]`}),` / `,(0,u.jsx)(t.code,{children:`nav[aria-label="グローバルナビゲーション"]`}),` などのセマンティック要素は自動で隠れます。
追加で隠したい場合は `,(0,u.jsx)(t.strong,{children:(0,u.jsx)(t.code,{children:`data-testid$="-sticky-cta"`})}),` に倣って `,(0,u.jsx)(t.code,{children:`data-testid$="-no-print"`}),` 等のセレクタを `,(0,u.jsx)(t.code,{children:`print.css`}),` 側で追加するか、Tailwind の `,(0,u.jsx)(t.code,{children:`print:hidden`}),` を使います。`]}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`{/* 印刷時は隠す */}
<aside className="print:hidden">関連リンク</aside>

{/* 印刷時のみ表示 (デフォルトは隠れている) */}
<p className="hidden print:block">印刷日: {today}</p>
`})}),`
`,(0,u.jsx)(t.h3,{id:`22-色を維持したい要素-qr--バッジ`,children:`2.2 色を維持したい要素 (QR / バッジ)`}),`
`,(0,u.jsxs)(t.p,{children:[`QR コードやステータスバッジは「色がついていてこそ意味がある」要素です。
`,(0,u.jsx)(t.code,{children:`data-print-keep`}),` を付与することで、`,(0,u.jsx)(t.code,{children:`background: transparent !important`}),` のオーバーライドから除外されます。`]}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{className:`language-tsx`,children:`<div data-print-keep className="rounded bg-white p-2 shadow">
  <img src="/qr.png" alt="QR code" />
</div>
`})}),`
`,(0,u.jsx)(t.h3,{id:`23-リンク-url-の展開`,children:`2.3 リンク URL の展開`}),`
`,(0,u.jsxs)(t.p,{children:[`外部リンク (`,(0,u.jsx)(t.code,{children:`http*://…`}),`) は自動的に文末に URL が補足されます:`]}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{children:`詳しくは公式サイト (https://example.com) を参照してください。
`})}),`
`,(0,u.jsxs)(t.p,{children:[`内部アンカー (`,(0,u.jsx)(t.code,{children:`#section`}),`) や `,(0,u.jsx)(t.code,{children:`mailto:`}),` / `,(0,u.jsx)(t.code,{children:`tel:`}),` は紙で意味がないので展開しません。`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`3-テスト方法`,children:`3. テスト方法`}),`
`,(0,u.jsxs)(t.ol,{children:[`
`,(0,u.jsxs)(t.li,{children:[`任意のページで `,(0,u.jsx)(t.code,{children:`Ctrl + P`}),` (macOS は `,(0,u.jsx)(t.code,{children:`Cmd + P`}),`)`]}),`
`,(0,u.jsxs)(t.li,{children:[`プレビューで以下を確認:`,`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsx)(t.li,{children:`ヘッダーバー (オレンジロゴ) が出ていないこと`}),`
`,(0,u.jsxs)(t.li,{children:[`リンクテキストの末尾に `,(0,u.jsx)(t.code,{children:`(https://…)`}),` が付くこと`]}),`
`,(0,u.jsx)(t.li,{children:`背景が真っ白、テキストが真っ黒であること`}),`
`,(0,u.jsx)(t.li,{children:`QR / アバター画像はカラーで残っていること`}),`
`]}),`
`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`4-関連ファイル`,children:`4. 関連ファイル`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`src/styles/print.css`}),` — 印刷用 CSS`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`src/app/globals.css`}),` — `,(0,u.jsx)(t.code,{children:`print.css`}),` を `,(0,u.jsx)(t.code,{children:`@import`}),` 経由で読み込む`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`5-既知の制約`,children:`5. 既知の制約`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsxs)(t.strong,{children:[`背景画像 (`,(0,u.jsx)(t.code,{children:`background-image`}),`)`]}),` は印刷に出るかどうかブラウザ依存。`,(0,u.jsx)(t.code,{children:`data-print-keep`}),` 配下でも保証されません。重要な画像は `,(0,u.jsx)(t.code,{children:`<img>`}),` で書いてください。`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:(0,u.jsx)(t.code,{children:`print-color-adjust: exact`})}),` は Chrome / Edge / Safari でサポートされますが、Firefox では一部色が落ちることがあります (= 仕様)。`]}),`
`]})]})}function l(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,u.jsx)(t,{...e,children:(0,u.jsx)(c,{...e})}):c(e)}var u;e((()=>{u=t(),s(),i()}))();export{l as default};