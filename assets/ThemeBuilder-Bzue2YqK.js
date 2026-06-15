import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,d as r,p as i,s as a,u as o}from"./blocks-DSdAlscu.js";import{t as s}from"./mdx-react-shim-DaZ3R4gt.js";function c(e){let t={blockquote:`blockquote`,code:`code`,h2:`h2`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(a,{title:`Design System/Theme Builder`}),`
`,(0,u.jsx)(r,{children:`Theme Builder プレイグラウンド`}),`
`,(0,u.jsx)(o,{children:`CSS 変数の差し替えで、ブランド色 / 角丸 / フォントサイズをリアルタイムプレビュー`}),`
`,(0,u.jsxs)(t.p,{children:[(0,u.jsx)(t.code,{children:`/theme-builder`}),` (本プロジェクト内のショーケースルート) はデザインシステム検証のためのインタラクティブ プレイグラウンドです。`]}),`
`,(0,u.jsx)(t.p,{children:`ユーザーがブランド色 (color picker)、角丸 (slider)、フォントサイズ (slider) を調整するたびに、右側のサンプルカード / ボタン / バッジ / 入力フォームに即時反映されます。`}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`1-アクセス`,children:`1. アクセス`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{children:`http://localhost:3000/theme-builder
`})}),`
`,(0,u.jsxs)(t.p,{children:[`本ページは `,(0,u.jsx)(t.code,{children:`robots: noindex`}),` なので本番でも検索インデックスされません。
ナビゲーション上の導線は意図的に持たせていません (= デザイナー / 開発者向けの隠しページ)。`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`2-仕組み`,children:`2. 仕組み`}),`
`,(0,u.jsx)(t.pre,{children:(0,u.jsx)(t.code,{children:`ユーザー操作 (color picker / slider)
      ↓
React state (draft) 更新
      ↓
style={{ "--brand-orange": …, "--radius-md": … }} を [data-theme-builder-scope] に注入
      ↓
配下の primitive (Button / Badge / Card / Input) が新値で再レンダ
`})}),`
`,(0,u.jsx)(t.p,{children:`ポイント:`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`グローバル (`,(0,u.jsx)(t.code,{children:`:root`}),`) の CSS 変数は `,(0,u.jsx)(t.strong,{children:`書き換えない`}),`。ヘッダー等への副作用を防ぐため、必ず `,(0,u.jsx)(t.code,{children:`[data-theme-builder-scope]`}),` 配下に限定する`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.code,{children:`<style data-theme-builder>`}),` で Tailwind の `,(0,u.jsx)(t.code,{children:`rounded-{md,lg,full}`}),` が `,(0,u.jsx)(t.code,{children:`var(--radius-*)`}),` を参照するよう、本ページ内だけで上書きする`]}),`
`,(0,u.jsxs)(t.li,{children:[`「適用」ボタンを押すと `,(0,u.jsx)(t.code,{children:`localStorage[tech-event:theme-builder]`}),` に保存。次回開いた際に復元される`]}),`
`,(0,u.jsxs)(t.li,{children:[`「リセット」ボタンで `,(0,u.jsx)(t.code,{children:`localStorage`}),` を削除しデフォルト値に戻す`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`3-操作項目`,children:`3. 操作項目`}),`
`,(0,u.jsxs)(t.table,{children:[(0,u.jsx)(t.thead,{children:(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.th,{children:`項目`}),(0,u.jsx)(t.th,{children:`範囲`}),(0,u.jsx)(t.th,{children:`反映先 CSS 変数`})]})}),(0,u.jsxs)(t.tbody,{children:[(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`ブランド色`}),(0,u.jsx)(t.td,{children:`HEX`}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`--brand-orange`}),`, `,(0,u.jsx)(t.code,{children:`--brand-orange-strong`})]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`ブランド hover`}),(0,u.jsx)(t.td,{children:`HEX`}),(0,u.jsx)(t.td,{children:(0,u.jsx)(t.code,{children:`--brand-orange-hover`})})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`角丸`}),(0,u.jsx)(t.td,{children:`0〜24px`}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`--radius-md`}),`, `,(0,u.jsx)(t.code,{children:`--radius-lg`}),`, `,(0,u.jsx)(t.code,{children:`--radius-control`})]})]}),(0,u.jsxs)(t.tr,{children:[(0,u.jsx)(t.td,{children:`フォントサイズ`}),(0,u.jsx)(t.td,{children:`80〜140%`}),(0,u.jsxs)(t.td,{children:[(0,u.jsx)(t.code,{children:`font-size`}),` (% で base を変える)`]})]})]})]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`4-デザインシステム改善への活用`,children:`4. デザインシステム改善への活用`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`新しいブランド色候補をテストする`}),` → デザイナーが Figma で見つけた候補 HEX をその場で確認`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`角丸ルールを 4px → 8px に変える影響を見る`}),` → primitive 全体のトーンが「シャープ → 柔らかい」へどう動くか`]}),`
`,(0,u.jsxs)(t.li,{children:[(0,u.jsx)(t.strong,{children:`フォントサイズ +20%`}),` → アクセシビリティ(視覚) ユーザー向けの拡大表示テスト`]}),`
`]}),`
`,(0,u.jsxs)(t.blockquote,{children:[`
`,(0,u.jsxs)(t.p,{children:[(0,u.jsx)(t.strong,{children:`注意`}),`: Theme Builder のオーバーライドは本プレイグラウンド内に閉じています。
実際のテーマ変更を本番に反映するには、`,(0,u.jsx)(t.code,{children:`src/styles/themes/light.css`}),` / `,(0,u.jsx)(t.code,{children:`dark.css`}),` を編集してください。`]}),`
`]}),`
`,(0,u.jsx)(t.hr,{}),`
`,(0,u.jsx)(t.h2,{id:`5-関連`,children:`5. 関連`}),`
`,(0,u.jsxs)(t.ul,{children:[`
`,(0,u.jsxs)(t.li,{children:[`実装: `,(0,u.jsx)(t.code,{children:`src/app/(showcase)/theme-builder/page.tsx`})]}),`
`,(0,u.jsxs)(t.li,{children:[`既存のショーケース: `,(0,u.jsx)(t.code,{children:`/components`}),` (`,(0,u.jsx)(t.code,{children:`Design System/Components`}),` MDX)`]}),`
`,(0,u.jsxs)(t.li,{children:[`トークン構造: `,(0,u.jsx)(t.code,{children:`Design System/Tokens`})]}),`
`]})]})}function l(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,u.jsx)(t,{...e,children:(0,u.jsx)(c,{...e})}):c(e)}var u;e((()=>{u=t(),s(),i()}))();export{l as default};