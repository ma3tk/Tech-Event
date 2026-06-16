import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-DxazclGI.js";import{t as d}from"./mdx-react-shim-CQBio_OA.js";import{Default as f,Destructive as p,Secondary as m,n as h,t as g}from"./button.stories-B4SeEpoP.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`ユーザーの `,(0,y.jsx)(t.strong,{children:`意思決定 / 副作用を伴うアクション`}),` をトリガーするための最も基本的な操作要素。形式の異なる 6 variant × 5 size を CVA で型付けし、asChild パターンにより a / Next の Link などにスタイルを乗せ替えられる。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/button.md`}),`。
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
`,(0,y.jsx)(t.h2,{id:`1-目的-purpose`,children:`1. 目的 (Purpose)`}),`
`,(0,y.jsxs)(t.p,{children:[`ユーザーの `,(0,y.jsx)(t.strong,{children:`意思決定 / 副作用を伴うアクション`}),` をトリガーするための最も基本的な操作要素。形式の異なる 6 variant × 5 size を CVA で型付けし、`,(0,y.jsx)(t.code,{children:`asChild`}),` パターンにより `,(0,y.jsx)(t.code,{children:`<a>`}),` / Next の `,(0,y.jsx)(t.code,{children:`<Link>`}),` などにスタイルを乗せ替えられる。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`フォーム送信 (「保存」「送信」「申込」)`}),`
`,(0,y.jsx)(t.li,{children:`副作用を伴う操作 (「削除」「キャンセル」「ログアウト」)`}),`
`,(0,y.jsx)(t.li,{children:`モーダル / ダイアログを開く (「シェア」「編集」「設定」)`}),`
`,(0,y.jsx)(t.li,{children:`主要な遷移を促す CTA (「参加申込」「登録」)`}),`
`,(0,y.jsx)(t.li,{children:`ツールバーの個別操作 (Markdown editor の太字 / 見出し挿入など)`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`画面遷移のみ`}),` → `,(0,y.jsx)(t.a,{href:`#`,children:`Link`}),` (`,(0,y.jsx)(t.code,{children:`<Link>`}),` / `,(0,y.jsx)(t.code,{children:`<a>`}),`) を使う。`,(0,y.jsx)(t.code,{children:`<Button onClick={() => router.push(...)}>`}),` は最悪`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`トグル状態`}),` → `,(0,y.jsx)(t.a,{href:`./switch.md`,children:`Switch`}),` または `,(0,y.jsx)(t.code,{children:`aria-pressed`}),` 付きの specialized component`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`チェック / ラジオ`}),` → `,(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`}),` / `,(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`ナビメニュー項目`}),` → `,(0,y.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`}),` の `,(0,y.jsx)(t.code,{children:`MenuItem`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`タブ切替`}),` → `,(0,y.jsx)(t.a,{href:`./tabs.md`,children:`Tabs`}),` の `,(0,y.jsx)(t.code,{children:`TabsTrigger`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`ステータス表示`}),` (押せない) → `,(0,y.jsx)(t.a,{href:`./badge.md`,children:`Badge`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌─────────────────────────────┐
│  [icon] Label  [trailing]   │
└─────────────────────────────┘
   ▲      ▲           ▲
   │      │           └─ trailing icon (optional)
   │      └────────────── label text (required)
   └───────────────────── leading icon (optional)
`})}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`leading icon`}),` (optional, 16px) — 例: 「保存」の前にディスクアイコン`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`label`}),` (required) — 動詞 + 名詞のシンプル文 (「参加申込」「キャンセル」)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.code,{children:`trailing icon`}),` (optional, 16px) — 例: 「次へ」の後の `,(0,y.jsx)(t.code,{children:`ChevronRight`})]}),`
`,(0,y.jsxs)(t.li,{children:[`フォーカスリング: `,(0,y.jsx)(t.code,{children:`outline 2px brand-orange offset 2px`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`視覚`}),(0,y.jsx)(t.th,{children:`例`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`default`})}),(0,y.jsx)(t.td,{children:`主要 CTA (画面で 1 つだけ)`}),(0,y.jsx)(t.td,{children:`orange 塗り + white text`}),(0,y.jsx)(t.td,{children:`「保存」「参加申込」`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`secondary`})}),(0,y.jsx)(t.td,{children:`補助操作`}),(0,y.jsx)(t.td,{children:`surface + border`}),(0,y.jsx)(t.td,{children:`「キャンセル」「もどる」`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`destructive`})}),(0,y.jsx)(t.td,{children:`破壊的操作`}),(0,y.jsx)(t.td,{children:`red 塗り + white text`}),(0,y.jsx)(t.td,{children:`「削除」「退会」「アカウント削除」`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`outline`})}),(0,y.jsx)(t.td,{children:`フラットな補助`}),(0,y.jsx)(t.td,{children:`透明 + border-strong`}),(0,y.jsx)(t.td,{children:`「下書き保存」`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`ghost`})}),(0,y.jsx)(t.td,{children:`ナビ / ツールバー内`}),(0,y.jsx)(t.td,{children:`完全フラット + hover で background`}),(0,y.jsx)(t.td,{children:`DropdownMenu の trigger`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`link`})}),(0,y.jsx)(t.td,{children:`テキスト風リンク`}),(0,y.jsx)(t.td,{children:`text-link + underline on hover`}),(0,y.jsx)(t.td,{children:`「詳細を見る」`})]})]})]}),`
`,(0,y.jsx)(t.h3,{id:`variant-使い分けの判断フロー`,children:`variant 使い分けの判断フロー`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`副作用を伴うか?
  ├─ Yes
  │   ├─ 破壊的 (削除/退会)? → destructive
  │   └─ そうでない         → default (画面で 1 つだけ)
  └─ No (代替) ─→ secondary / outline / ghost

ナビ・ツールバー? → ghost
インラインテキストの一部? → link
`})}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ-sizes`,children:`6. サイズ (Sizes)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`size`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`高さ`}),(0,y.jsx)(t.th,{children:`内パディング`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`xs`})}),(0,y.jsx)(t.td,{children:`コンパクトな補助 (TagPill の削除等)`}),(0,y.jsxs)(t.td,{children:[`28px (`,(0,y.jsx)(t.code,{children:`h-7`}),`)`]}),(0,y.jsx)(t.td,{children:`px-2`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`sm`})}),(0,y.jsx)(t.td,{children:`フィルタ / ツールバー`}),(0,y.jsxs)(t.td,{children:[`32px (`,(0,y.jsx)(t.code,{children:`h-8`}),`)`]}),(0,y.jsx)(t.td,{children:`px-3`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`md`})}),(0,y.jsx)(t.td,{children:`標準 (default)`}),(0,y.jsxs)(t.td,{children:[`40px (`,(0,y.jsx)(t.code,{children:`h-10`}),`)`]}),(0,y.jsx)(t.td,{children:`px-4`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`lg`})}),(0,y.jsx)(t.td,{children:`大型 CTA (申込ボタン等)`}),(0,y.jsxs)(t.td,{children:[`44px (`,(0,y.jsx)(t.code,{children:`h-11`}),`)`]}),(0,y.jsx)(t.td,{children:`px-6`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`icon`})}),(0,y.jsx)(t.td,{children:`アイコンのみの正方形`}),(0,y.jsxs)(t.td,{children:[`40×40 (`,(0,y.jsx)(t.code,{children:`h-10 w-10`}),`)`]}),(0,y.jsx)(t.td,{children:`p-0`})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[`モバイル (<640px) では `,(0,y.jsx)(t.code,{children:`min-h-11`}),` 相当に拡張するか、`,(0,y.jsx)(t.code,{children:`size="lg"`}),` を使うことで `,(0,y.jsx)(t.strong,{children:`44×44px タッチ領域`}),` を確保する。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚ルール`}),(0,y.jsx)(t.th,{children:`実装`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`default`}),(0,y.jsx)(t.td,{children:`base styles`}),(0,y.jsx)(t.td,{children:`—`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`hover`}),(0,y.jsxs)(t.td,{children:[`1 段濃く (`,(0,y.jsx)(t.code,{children:`bg-brand-orange-hover`}),` 等)`]}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`hover:bg-brand-orange-hover`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`focus-visible`}),(0,y.jsx)(t.td,{children:`brand-orange リング 2px + offset 2px`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`active`}),(0,y.jsx)(t.td,{children:`hover と同色 (押下中の沈み込み)`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`active:bg-brand-orange-hover`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`disabled`}),(0,y.jsx)(t.td,{children:`opacity-50 + pointer-events-none`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`disabled:opacity-50 disabled:pointer-events-none`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`loading`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`aria-busy="true"`}),` + 中身の前にスピナー`]}),(0,y.jsx)(t.td,{children:`カスタム実装`})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`disabled`}),` 時は `,(0,y.jsx)(t.code,{children:`aria-disabled="true"`}),` も必ず併記する (スクリーンリーダーへの伝達)。`]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`WCAG AA コントラスト`}),`: `,(0,y.jsx)(t.code,{children:`default`}),` (white on `,(0,y.jsx)(t.code,{children:`#c2410c`}),`) で 4.93:1、`,(0,y.jsx)(t.code,{children:`destructive`}),` (white on `,(0,y.jsx)(t.code,{children:`#d23a3a`}),`) で 4.5:1+ を確保 (Design.md §2)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`キーボード`}),`: `,(0,y.jsx)(t.code,{children:`Enter`}),` / `,(0,y.jsx)(t.code,{children:`Space`}),` で activate (`,(0,y.jsx)(t.code,{children:`<button>`}),` のネイティブ挙動)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:(0,y.jsx)(t.code,{children:`aria-disabled`})}),` / `,(0,y.jsx)(t.strong,{children:(0,y.jsx)(t.code,{children:`aria-busy`})}),` を状態と整合させる`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`アイコンのみのボタン`}),` (`,(0,y.jsx)(t.code,{children:`size="icon"`}),`) は `,(0,y.jsxs)(t.strong,{children:[`必ず `,(0,y.jsx)(t.code,{children:`aria-label`})]}),` を付ける`,`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Button size="icon" aria-label="閉じる"><X /></Button>
`})}),`
`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`フォーカスリングは隠さない`}),`: `,(0,y.jsx)(t.code,{children:`outline-none`}),` を `,(0,y.jsx)(t.code,{children:`focus-visible:ring-*`}),` で置き換える形 (Tailwind の慣用)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`モバイル (<640px) ではタッチ領域 `,(0,y.jsx)(t.strong,{children:`44×44px`}),` を確保 → `,(0,y.jsx)(t.code,{children:`size="lg"`}),` または `,(0,y.jsx)(t.code,{children:`min-h-11 min-w-11`}),` クラス`]}),`
`,(0,y.jsxs)(t.li,{children:[`長文ラベルは `,(0,y.jsx)(t.code,{children:`whitespace-nowrap`}),` で潰さず、可能なら短縮 (「参加申込」のように 4-5 文字以内)`]}),`
`,(0,y.jsxs)(t.li,{children:[`グループ化 (cancel / save の 2 ボタン) は `,(0,y.jsx)(t.code,{children:`flex-col sm:flex-row`}),` で縦 → 横切替`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,y.jsx)(t.h3,{id:`101-基本`,children:`10.1 基本`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Button } from "@tech-event/shared-ui";

<Button variant="default" size="md">
  参加申込
</Button>
`})}),`
`,(0,y.jsx)(t.h3,{id:`102-アイコン--テキスト`,children:`10.2 アイコン + テキスト`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Save } from "lucide-react";

<Button variant="default">
  <Save />
  下書き保存
</Button>
`})}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`[&_svg]:size-4`}),` が base に入っているため、子の SVG は自動で 16px になる。`]}),`
`,(0,y.jsx)(t.h3,{id:`103-アイコンのみ`,children:`10.3 アイコンのみ`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { X } from "lucide-react";

<Button size="icon" variant="ghost" aria-label="閉じる">
  <X />
</Button>
`})}),`
`,(0,y.jsxs)(t.h3,{id:`104-aschild-で-a-にスタイルを乗せる`,children:[`10.4 asChild で `,(0,y.jsx)(t.code,{children:`<a>`}),` にスタイルを乗せる`]}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import Link from "next/link";

<Button asChild variant="default">
  <Link href="/event/new">イベントを作成</Link>
</Button>
`})}),`
`,(0,y.jsx)(t.h3,{id:`105-ローディング状態`,children:`10.5 ローディング状態`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Button
  type="submit"
  disabled={isPending}
  aria-busy={isPending}
>
  {isPending ? (
    <>
      <Loader2 className="animate-spin" />
      送信中…
    </>
  ) : (
    "送信"
  )}
</Button>
`})}),`
`,(0,y.jsx)(t.h3,{id:`106-destructive--確認モーダル`,children:`10.6 destructive + 確認モーダル`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">アカウント削除</Button>
  </DialogTrigger>
  <DialogContent>
    {/* 確認内容 */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="secondary">キャンセル</Button>
      </DialogClose>
      <Button variant="destructive" onClick={handleDelete}>
        削除する
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
`})}),`
`,(0,y.jsx)(t.h2,{id:`11-アンチパターン-anti-patterns`,children:`11. アンチパターン (Anti-patterns)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<Button onClick={() => router.push("/foo")}>`}),` → ✅ `,(0,y.jsx)(t.code,{children:`<Button asChild><Link href="/foo">...</Link></Button>`}),` (画面遷移は a タグ)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<Button className="bg-blue-500">`}),` → ✅ variant prop で表現 (任意 hex / Tailwind パレットは禁止)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<Button>OK</Button>`}),` の連発 → ✅ ラベルは具体的に (「保存」「送信」「申込」など動詞 + 名詞)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<div onClick role="button">`}),` → ✅ `,(0,y.jsx)(t.code,{children:`<Button>`}),` (キーボード操作と SR 対応)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`default`}),` を 1 画面に 3 つ以上 → ✅ 主要 CTA は 1 画面 1 つに絞る`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ icon-only で `,(0,y.jsx)(t.code,{children:`aria-label`}),` 抜け → ✅ 必須`]}),`
`,(0,y.jsx)(t.li,{children:`❌ disabled で説明なし → ✅ tooltip で「○○の理由で操作できません」を補う`}),`
`,(0,y.jsx)(t.li,{children:`❌ loading 中も中身を非表示にする (CLS 発生) → ✅ サイズを保ったままスピナーで上書き`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-関連-related`,children:`12. 関連 (Related)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`}),` — フォーム送信ボタンは内部の `,(0,y.jsx)(t.code,{children:`<button type="submit">`}),` として使う`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./dialog.md`,children:`Dialog`}),` — `,(0,y.jsx)(t.code,{children:`DialogTrigger`}),` / `,(0,y.jsx)(t.code,{children:`DialogClose`}),` の中で `,(0,y.jsx)(t.code,{children:`asChild`}),` 利用`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`}),` — `,(0,y.jsx)(t.code,{children:`MenuItem`}),` は Button ではない`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./tabs.md`,children:`Tabs`}),` — `,(0,y.jsx)(t.code,{children:`TabsTrigger`}),` は Button ではない`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./loading-state.md`,children:`LoadingState`}),` — 大きい範囲のローディングはこちら`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/event-sticky-cta.md`,children:`EventStickyCTA`}),` — 詳細ページの CTA 統合`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`v1.0.0 (2026-06-05): 初回リリース、CVA で variant + size を型付け、6 variant × 5 size、`,(0,y.jsx)(t.code,{children:`asChild`}),` パターン採用`]}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};