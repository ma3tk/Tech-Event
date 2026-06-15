import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-CD-xvnSv.js";import{t as d}from"./mdx-react-shim-BWVm_lKV.js";import{Default as f,Password as p,WithValue as m,n as h,t as g}from"./input.stories-Bfy9hydH.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:h}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsx)(u,{children:`1 行のテキスト入力 (text / email / password / search / url / number / date) を統一的に扱う。size / error / 左右アイコンを CVA で型付けし、フォーム全般の入力 atom として使う。`}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/input.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[`1 行のテキスト入力 (text / email / password / search / url / number / date) を統一的に扱う。`,(0,y.jsx)(t.code,{children:`size`}),` / `,(0,y.jsx)(t.code,{children:`error`}),` / 左右アイコンを CVA で型付けし、フォーム全般の入力 atom として使う。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`短いテキスト入力 (名前 / タイトル / メール / URL)`}),`
`,(0,y.jsxs)(t.li,{children:[`パスワード入力 (`,(0,y.jsx)(t.code,{children:`type="password"`}),`)`]}),`
`,(0,y.jsx)(t.li,{children:`検索ボックスのコア (アイコン付き、SearchBox の中身)`}),`
`,(0,y.jsxs)(t.li,{children:[`数値入力 (`,(0,y.jsx)(t.code,{children:`type="number"`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[`日付入力 (`,(0,y.jsx)(t.code,{children:`type="date"`}),`、ただし複雑なものは Calendar / DatePicker)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`複数行`}),` → `,(0,y.jsx)(t.a,{href:`./textarea.md`,children:`Textarea`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`選択肢から選ぶ`}),` → `,(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`}),` / `,(0,y.jsx)(t.a,{href:`./radio-group.md`,children:`RadioGroup`}),` / `,(0,y.jsx)(t.a,{href:`./checkbox.md`,children:`Checkbox`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`ON/OFF`}),` → `,(0,y.jsx)(t.a,{href:`./switch.md`,children:`Switch`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`Markdown 入力`}),` → `,(0,y.jsx)(t.a,{href:`../components/markdown-editor.md`,children:`MarkdownEditor`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`大きな検索 UI`}),` → `,(0,y.jsx)(t.a,{href:`../components/search-box.md`,children:`SearchBox`}),` (Input をラップ)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌──────────────────────────────────────┐
│ [icon] placeholder / value  [icon]   │
└──────────────────────────────────────┘
   ▲                              ▲
   └─ leftIcon (optional, 16px)   └─ rightIcon (optional)

Label:        必ず上または左に Label を配置 (htmlFor で連携)
Description:  サブ説明は Input の下、muted 色で
Error:        エラーは FormMessage で下に赤字
`})}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`variant`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`視覚`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`default`})}),(0,y.jsx)(t.td,{children:`通常`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`border-border`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`error`})}),(0,y.jsx)(t.td,{children:`エラー状態`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`border-destructive`}),` + `,(0,y.jsx)(t.code,{children:`focus-visible:ring-destructive`})]})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`error`}),` は `,(0,y.jsx)(t.strong,{children:`boolean prop`}),` で切替: `,(0,y.jsx)(t.code,{children:`<Input error={!!errors.email} />`}),`。`,(0,y.jsx)(t.code,{children:`aria-invalid`}),` も同時に立てる。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ-sizes`,children:`6. サイズ (Sizes)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`size`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`高さ`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`sm`})}),(0,y.jsx)(t.td,{children:`コンパクト (ヘッダーの検索)`}),(0,y.jsx)(t.td,{children:`32px`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`md`})}),(0,y.jsx)(t.td,{children:`標準 (フォーム)`}),(0,y.jsx)(t.td,{children:`40px`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`lg`})}),(0,y.jsx)(t.td,{children:`ヒーロー検索 / ランディング`}),(0,y.jsx)(t.td,{children:`48px`})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[`モバイルでは `,(0,y.jsx)(t.code,{children:`md`}),` 以上推奨 (タッチ領域)。`,(0,y.jsx)(t.code,{children:`lg`}),` はランディング検索 / フォームの主要 input に。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚`}),(0,y.jsx)(t.th,{children:`実装`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`default`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`border-border`})}),(0,y.jsx)(t.td,{children:`base`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`hover`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`border-border-strong`})}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`hover:border-border-strong`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`focus-visible`}),(0,y.jsx)(t.td,{children:`brand-orange ring 2px`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`focus-visible:ring-2 focus-visible:ring-brand-orange`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`disabled`}),(0,y.jsx)(t.td,{children:`opacity-50 + bg-surface-muted`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`disabled:opacity-50 disabled:bg-surface-muted`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`error`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`border-destructive`}),` + red ring`]}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`aria-invalid={true}`}),` で auto`]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`readonly`}),(0,y.jsx)(t.td,{children:`bg-surface-muted (border は default)`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`readOnly`})})]})]})]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:(0,y.jsx)(t.code,{children:`<label htmlFor>`})}),` で必ず Input に関連付け (Label 単独描画 + `,(0,y.jsx)(t.code,{children:`id`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[`必須フィールドは `,(0,y.jsx)(t.code,{children:`required`}),` + `,(0,y.jsx)(t.code,{children:`aria-required="true"`}),` + 視覚的にも `,(0,y.jsx)(t.code,{children:`<span aria-hidden>*</span>`})]}),`
`,(0,y.jsxs)(t.li,{children:[`エラーは `,(0,y.jsx)(t.code,{children:`aria-invalid="true"`}),` + `,(0,y.jsx)(t.code,{children:`aria-describedby={errorId}`}),` で FormMessage と紐付け`]}),`
`,(0,y.jsx)(t.li,{children:`プレースホルダ単独で説明しない (placeholder は label の代替ではない)`}),`
`,(0,y.jsxs)(t.li,{children:[`パスワードの「表示」トグルは `,(0,y.jsx)(t.code,{children:`aria-pressed`}),` 付きの Button で`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`モバイルではフルワイド (`,(0,y.jsx)(t.code,{children:`w-full`}),`) を基本に`]}),`
`,(0,y.jsxs)(t.li,{children:[`フォームは `,(0,y.jsx)(t.code,{children:`space-y-4`}),` で縦積み (sm 未満)`]}),`
`,(0,y.jsxs)(t.li,{children:[`inline 配置 (ラベル + Input 横並び) は `,(0,y.jsx)(t.code,{children:`lg`}),` 以上のみ`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,y.jsx)(t.h3,{id:`101-基本`,children:`10.1 基本`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Input } from "@tech-event/shared-ui";
import { Label } from "@tech-event/shared-ui";

<div className="space-y-2">
  <Label htmlFor="title">タイトル</Label>
  <Input id="title" placeholder="勉強会のタイトル" />
</div>
`})}),`
`,(0,y.jsx)(t.h3,{id:`102-アイコン付き`,children:`10.2 アイコン付き`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import { Search } from "lucide-react";

<Input
  type="search"
  placeholder="イベントを検索"
  leftIcon={<Search />}
  aria-label="イベントを検索"
/>
`})}),`
`,(0,y.jsx)(t.h3,{id:`103-エラー状態-rhf--zod`,children:`10.3 エラー状態 (RHF + Zod)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<FormField
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>メールアドレス</FormLabel>
      <FormControl>
        <Input
          type="email"
          error={!!fieldState.error}
          aria-invalid={!!fieldState.error}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
`})}),`
`,(0,y.jsx)(t.h3,{id:`104-パスワード--表示トグル`,children:`10.4 パスワード + 表示トグル`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`const [show, setShow] = useState(false);

<div className="relative">
  <Input
    type={show ? "text" : "password"}
    autoComplete="current-password"
  />
  <Button
    type="button"
    size="icon"
    variant="ghost"
    className="absolute right-1 top-1/2 -translate-y-1/2"
    aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
    aria-pressed={show}
    onClick={() => setShow((v) => !v)}
  >
    {show ? <EyeOff /> : <Eye />}
  </Button>
</div>
`})}),`
`,(0,y.jsx)(t.h2,{id:`11-アンチパターン-anti-patterns`,children:`11. アンチパターン (Anti-patterns)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<Input placeholder="メール" />`}),` (label なし) → ✅ `,(0,y.jsx)(t.code,{children:`<Label htmlFor>`}),` 必須`]}),`
`,(0,y.jsx)(t.li,{children:`❌ placeholder で説明を完結 → ✅ Label と FormDescription を併用`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`<input>`}),` を直接書く → ✅ `,(0,y.jsx)(t.code,{children:`<Input>`}),` で統一 (`,(0,y.jsx)(t.code,{children:`border-border`}),` 等のトークン適用のため)`]}),`
`,(0,y.jsx)(t.li,{children:`❌ エラー時に border 色だけ赤くする (色のみ依存) → ✅ FormMessage で文言も出す`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`type="text"`}),` でメール / URL も扱う → ✅ 適切な type 指定 (mobile keyboard / browser 補完が変わる)`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ `,(0,y.jsx)(t.code,{children:`autocomplete`}),` 未指定 → ✅ 必ず適切な値 (`,(0,y.jsx)(t.code,{children:`email`}),` / `,(0,y.jsx)(t.code,{children:`current-password`}),` / `,(0,y.jsx)(t.code,{children:`new-password`}),` / `,(0,y.jsx)(t.code,{children:`name`}),` 等)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-関連-related`,children:`12. 関連 (Related)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./label.md`,children:`Label`}),` — 必ずペア`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./form.md`,children:`Form`}),` — RHF + Zod ラッパー (推奨統合)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./textarea.md`,children:`Textarea`}),` — 複数行`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./select.md`,children:`Select`}),` — 選択肢`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/search-box.md`,children:`SearchBox`}),` — 検索 UI のラッパー`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、CVA で size + error variant、leftIcon / rightIcon prop`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),g()}))();export{v as default};