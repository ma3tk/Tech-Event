import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{T as n,c as r,d as i,i as a,l as o,n as s,p as c,s as l,u}from"./blocks-C7BBlj3r.js";import{t as d}from"./mdx-react-shim-B68M4Igu.js";import{Default as f,HideClose as p,WithForm as m,n as h,t as g}from"./dialog.stories-D1kgOZby.js";function _(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...n(),...e.components};return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(l,{of:g}),`
`,(0,y.jsx)(i,{}),`
`,(0,y.jsxs)(u,{children:[`画面の上に `,(0,y.jsx)(t.strong,{children:`モーダル (背景操作不可)`}),` を重ねて、確認 / 入力 / 詳細表示 / 操作完了を要求する一連の UI。@radix-ui/react-dialog をベースに、フォーカストラップ / Escape クローズ / scroll lock / aria 属性を自動で処理する。`]}),`
`,(0,y.jsxs)(t.blockquote,{children:[`
`,(0,y.jsxs)(t.p,{children:[`一次資料: `,(0,y.jsx)(t.code,{children:`docs/catalog/ui/dialog.md`}),`。
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
`,(0,y.jsxs)(t.p,{children:[`画面の上に `,(0,y.jsx)(t.strong,{children:`モーダル (背景操作不可)`}),` を重ねて、確認 / 入力 / 詳細表示 / 操作完了を要求する一連の UI。`,(0,y.jsx)(t.code,{children:`@radix-ui/react-dialog`}),` をベースに、フォーカストラップ / Escape クローズ / scroll lock / aria 属性を自動で処理する。`]}),`
`,(0,y.jsx)(t.h2,{id:`2-いつ使うか-when-to-use`,children:`2. いつ使うか (When to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`破壊的操作の確認`}),` (「本当に削除しますか?」)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`短いフォーム入力`}),` (1-2 フィールド程度の編集)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`詳細情報の差し込み表示`}),` (シェアモーダル / プレビュー)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`メディアの拡大表示`}),` (画像 / 動画)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`ステップを跨がない単発の操作`}),` (ヘルプ / 利用規約読み込み)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`3-いつ使わないか-when-not-to-use`,children:`3. いつ使わないか (When NOT to use)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`画面遷移すべきレベルの大きな入力`}),` → 別ページ (`,(0,y.jsx)(t.code,{children:`/event/[id]/edit`}),`)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`画面サイドからスライドする UI`}),` → `,(0,y.jsx)(t.a,{href:`./sheet.md`,children:`Sheet`}),` (left / right / top / bottom)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`クリック位置に小さく出す情報`}),` → `,(0,y.jsx)(t.a,{href:`./popover.md`,children:`Popover`}),` / `,(0,y.jsx)(t.a,{href:`./tooltip.md`,children:`Tooltip`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`メニュー`}),` → `,(0,y.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`通知 / フィードバック`}),` → `,(0,y.jsx)(t.a,{href:`./toast.md`,children:`Toast`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`エラーの説明`}),` → inline 表示 (`,(0,y.jsx)(t.a,{href:`./error-state.md`,children:`ErrorState`}),`) を優先`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`4-構造-anatomy`,children:`4. 構造 (Anatomy)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{children:`┌──────── Overlay (半透明黒) ────────┐
│                                    │
│   ┌──── DialogContent ────┐        │
│   │ DialogHeader          │        │
│   │   DialogTitle (h2)    │        │
│   │   DialogDescription   │        │
│   │ ───────────────────── │        │
│   │ body                  │        │
│   │ ───────────────────── │        │
│   │ DialogFooter          │        │
│   │   [Cancel] [Confirm]  │        │
│   │                       │ [X]    │ ← close button
│   └───────────────────────┘        │
│                                    │
└────────────────────────────────────┘
`})}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogTrigger`}),` — モーダルを開く要素 (`,(0,y.jsx)(t.code,{children:`asChild`}),` で `,(0,y.jsx)(t.code,{children:`<Button>`}),` をラップ)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogOverlay`}),` — 背景の半透明レイヤ`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogContent`}),` — モーダル本体 (centered)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogHeader / Title / Description`}),` — 見出しと補助説明`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogFooter`}),` — ボタン群 (右寄せが default)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogClose`}),` — 閉じるための専用 Trigger (右上 X や Cancel に)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`5-バリアント-variants`,children:`5. バリアント (Variants)`}),`
`,(0,y.jsxs)(t.p,{children:[`<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
Dialog 自体に variant はない。`,(0,y.jsxs)(t.strong,{children:[`サイズは `,(0,y.jsx)(t.code,{children:`className`}),` で制御`]}),`:`]}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`サイズ`}),(0,y.jsx)(t.th,{children:`用途`}),(0,y.jsx)(t.th,{children:`className 例`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`sm`}),(0,y.jsx)(t.td,{children:`確認モーダル (削除確認等)`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`max-w-sm`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`md`}),(0,y.jsx)(t.td,{children:`標準 (1-2 フィールドのフォーム)`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`max-w-md`}),` (default)`]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`lg`}),(0,y.jsx)(t.td,{children:`詳細表示 (ShareModal 等)`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`max-w-2xl`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`xl`}),(0,y.jsx)(t.td,{children:`大きなプレビュー`}),(0,y.jsx)(t.td,{children:(0,y.jsx)(t.code,{children:`max-w-4xl`})})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`fullscreen`}),(0,y.jsx)(t.td,{children:`モバイル全画面`}),(0,y.jsxs)(t.td,{children:[(0,y.jsx)(t.code,{children:`w-screen h-screen`}),` (`,(0,y.jsx)(t.code,{children:`sm:max-w-md`}),` で desktop だけ縮める)`]})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[`モバイルでは原則 `,(0,y.jsx)(t.a,{href:`./sheet.md`,children:`Sheet`}),` (bottom) を使い、Dialog を選ぶのは確認や短い操作のみ。`]}),`
`,(0,y.jsx)(t.p,{children:`<!-- AUTO-GENERATED END: variants -->`}),`
`,(0,y.jsx)(t.h2,{id:`6-サイズ-sizes`,children:`6. サイズ (Sizes)`}),`
`,(0,y.jsxs)(t.p,{children:[(0,y.jsx)(t.code,{children:`max-w-*`}),` で制御。`,(0,y.jsx)(t.code,{children:`max-h-[85vh]`}),` + `,(0,y.jsx)(t.code,{children:`overflow-y-auto`}),` を組み合わせて長文に備える。`]}),`
`,(0,y.jsx)(t.h2,{id:`7-状態-states`,children:`7. 状態 (States)`}),`
`,(0,y.jsxs)(t.table,{children:[(0,y.jsx)(t.thead,{children:(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.th,{children:`状態`}),(0,y.jsx)(t.th,{children:`視覚 / 挙動`})]})}),(0,y.jsxs)(t.tbody,{children:[(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`open`}),(0,y.jsxs)(t.td,{children:[`Overlay フェードイン + Content スケール (`,(0,y.jsx)(t.code,{children:`scale-95 → scale-100`}),`)`]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`close`}),(0,y.jsx)(t.td,{children:`Escape / 外側クリック / DialogClose / 明示的 onClose`})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`busy`}),(0,y.jsxs)(t.td,{children:[`Footer の主要 Button を disabled + `,(0,y.jsx)(t.code,{children:`aria-busy`})]})]}),(0,y.jsxs)(t.tr,{children:[(0,y.jsx)(t.td,{children:`with-error`}),(0,y.jsx)(t.td,{children:`DialogDescription を ErrorState 文言に差し替え or inline alert`})]})]})]}),`
`,(0,y.jsxs)(t.p,{children:[`motion: `,(0,y.jsx)(t.code,{children:`data-[state=open]:animate-in fade-in-0 zoom-in-95 duration-slow`}),` (300ms)。`,(0,y.jsx)(t.code,{children:`prefers-reduced-motion`}),` で 0ms。`]}),`
`,(0,y.jsx)(t.h2,{id:`8-アクセシビリティ-accessibility`,children:`8. アクセシビリティ (Accessibility)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`フォーカストラップ`}),`: Dialog open 中は内部のみフォーカス移動 (Radix が処理)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`Escape で閉じる`}),` (Radix default)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsxs)(t.strong,{children:[`背景の `,(0,y.jsx)(t.code,{children:`aria-hidden="true"`})]}),` が body 直下要素に付与される`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogTitle 必須`}),` — SR 用に `,(0,y.jsx)(t.code,{children:`aria-labelledby`}),` で参照 (省略すると warning)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`DialogDescription 推奨`}),` — `,(0,y.jsx)(t.code,{children:`aria-describedby`}),` 用`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`初期フォーカス`}),`: 主要操作 (Confirm) ではなく Cancel / 入力欄が安全。破壊的操作は `,(0,y.jsx)(t.strong,{children:`必ず Cancel に初期フォーカス`})]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.strong,{children:`閉じた時にフォーカスを元の Trigger に戻す`}),` (Radix が処理)`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`9-レスポンシブ`,children:`9. レスポンシブ`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[`モバイル (<640px): 横余白を取らず `,(0,y.jsx)(t.code,{children:`inset-x-4 bottom-4`}),` 風の `,(0,y.jsx)(t.strong,{children:`底寄せ`}),` に。または `,(0,y.jsx)(t.a,{href:`./sheet.md`,children:`Sheet`}),` (side="bottom") に切替`]}),`
`,(0,y.jsxs)(t.li,{children:[`デスクトップ: 画面中央、`,(0,y.jsx)(t.code,{children:`max-w-md`}),` 〜 `,(0,y.jsx)(t.code,{children:`max-w-2xl`})]}),`
`,(0,y.jsxs)(t.li,{children:[`長文時は `,(0,y.jsx)(t.code,{children:`max-h-[85vh] overflow-y-auto`})]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`10-使用例-code`,children:`10. 使用例 (Code)`}),`
`,(0,y.jsx)(t.h3,{id:`101-確認モーダル-破壊的操作`,children:`10.1 確認モーダル (破壊的操作)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@tech-event/shared-ui";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">削除</Button>
  </DialogTrigger>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>このイベントを削除しますか?</DialogTitle>
      <DialogDescription>
        参加者の申込履歴も含めて完全に削除されます。元に戻せません。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="secondary" autoFocus>キャンセル</Button>
      </DialogClose>
      <Button variant="destructive" onClick={handleDelete}>
        削除する
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
`})}),`
`,(0,y.jsx)(t.h3,{id:`102-短いフォーム-1-2-フィールド`,children:`10.2 短いフォーム (1-2 フィールド)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>タグを追加</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>タグ名</FormLabel>
            <FormControl><Input {...field} autoFocus /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">キャンセル</Button>
          </DialogClose>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            追加
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
`})}),`
`,(0,y.jsx)(t.h3,{id:`103-詳細表示-sharemodal-風`,children:`10.3 詳細表示 (ShareModal 風)`}),`
`,(0,y.jsx)(t.pre,{children:(0,y.jsx)(t.code,{className:`language-tsx`,children:`<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="シェア">
      <Share2 />
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>イベントをシェア</DialogTitle>
    </DialogHeader>
    <Tabs defaultValue="link">
      <TabsList>
        <TabsTrigger value="link">リンク</TabsTrigger>
        <TabsTrigger value="sns">SNS</TabsTrigger>
        <TabsTrigger value="qr">QR</TabsTrigger>
        <TabsTrigger value="embed">埋め込み</TabsTrigger>
      </TabsList>
      <TabsContent value="link">{/* ... */}</TabsContent>
      {/* ... */}
    </Tabs>
  </DialogContent>
</Dialog>
`})}),`
`,(0,y.jsx)(t.h2,{id:`11-アンチパターン-anti-patterns`,children:`11. アンチパターン (Anti-patterns)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`❌ Dialog に大量のフォーム (5+ フィールド) を詰める → ✅ 別ページに分離`}),`
`,(0,y.jsx)(t.li,{children:`❌ Dialog の中に Dialog を入れ子 → ✅ 一段ずつ閉じる or ステップ UI に再設計`}),`
`,(0,y.jsx)(t.li,{children:`❌ DialogTitle 省略 → ✅ 必須 (a11y 要件)`}),`
`,(0,y.jsx)(t.li,{children:`❌ 破壊的操作で Confirm に autoFocus → ✅ Cancel に autoFocus`}),`
`,(0,y.jsxs)(t.li,{children:[`❌ Escape で閉じられない (`,(0,y.jsx)(t.code,{children:`onOpenChange`}),` をフックして抑制) → ✅ ユーザーの離脱経路は常に確保`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ デスクトップ前提で `,(0,y.jsx)(t.code,{children:`min-w-[600px]`}),` 固定 → ✅ `,(0,y.jsx)(t.code,{children:`max-w-md`}),` + モバイルは余白縮小`]}),`
`,(0,y.jsxs)(t.li,{children:[`❌ 重い処理中に二重 submit → ✅ 主要 Button を disabled + `,(0,y.jsx)(t.code,{children:`aria-busy`})]}),`
`,(0,y.jsx)(t.li,{children:`❌ モーダルの中で別タブを開く (UX 混乱) → ✅ closeしてから遷移`}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`12-関連-related`,children:`12. 関連 (Related)`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./sheet.md`,children:`Sheet`}),` — サイドからスライド (モバイル向き)`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./popover.md`,children:`Popover`}),` — anchor 起点の小さい吊り下げ`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./dropdown-menu.md`,children:`DropdownMenu`}),` — メニュー`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`./toast.md`,children:`Toast`}),` — 非同期完了通知`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../components/share-modal.md`,children:`ShareModal`}),` — 統合ダイアログの実例`]}),`
`,(0,y.jsxs)(t.li,{children:[(0,y.jsx)(t.a,{href:`../blocks/modals-and-sheets.md`,children:`blocks/modals-and-sheets.md`}),` — 使い分け詳細`]}),`
`]}),`
`,(0,y.jsx)(t.h2,{id:`13-変更履歴`,children:`13. 変更履歴`}),`
`,(0,y.jsxs)(t.ul,{children:[`
`,(0,y.jsx)(t.li,{children:`v1.0.0 (2026-06-05): 初回リリース、Radix UI Dialog + duration-slow (300ms) フェードイン`}),`
`]}),`
`,(0,y.jsx)(t.hr,{}),`
`,(0,y.jsx)(t.h2,{id:`全-stories`,children:`全 Stories`}),`
`,(0,y.jsx)(o,{includePrimary:!1})]})}function v(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,y.jsx)(t,{...e,children:(0,y.jsx)(_,{...e})}):_(e)}var y;e((()=>{y=t(),d(),c(),h()}))();export{v as default};