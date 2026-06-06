---
status: stable
figma: TODO
storybook: libs/shared/ui/src/dialog.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P6]
---

# Dialog

> Design.md 準拠 | Storybook: [Dialog stories](../../../libs/shared/ui/src/dialog.stories.tsx) | 実装: `libs/shared/ui/src/dialog.tsx`

## 1. 目的 (Purpose)
画面の上に **モーダル (背景操作不可)** を重ねて、確認 / 入力 / 詳細表示 / 操作完了を要求する一連の UI。`@radix-ui/react-dialog` をベースに、フォーカストラップ / Escape クローズ / scroll lock / aria 属性を自動で処理する。

## 2. いつ使うか (When to use)
- **破壊的操作の確認** (「本当に削除しますか?」)
- **短いフォーム入力** (1-2 フィールド程度の編集)
- **詳細情報の差し込み表示** (シェアモーダル / プレビュー)
- **メディアの拡大表示** (画像 / 動画)
- **ステップを跨がない単発の操作** (ヘルプ / 利用規約読み込み)

## 3. いつ使わないか (When NOT to use)
- **画面遷移すべきレベルの大きな入力** → 別ページ (`/event/[id]/edit`)
- **画面サイドからスライドする UI** → [Sheet](./sheet.md) (left / right / top / bottom)
- **クリック位置に小さく出す情報** → [Popover](./popover.md) / [Tooltip](./tooltip.md)
- **メニュー** → [DropdownMenu](./dropdown-menu.md)
- **通知 / フィードバック** → [Toast](./toast.md)
- **エラーの説明** → inline 表示 ([ErrorState](./error-state.md)) を優先

## 4. 構造 (Anatomy)

```
┌──────── Overlay (半透明黒) ────────┐
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
```

- **DialogTrigger** — モーダルを開く要素 (`asChild` で `<Button>` をラップ)
- **DialogOverlay** — 背景の半透明レイヤ
- **DialogContent** — モーダル本体 (centered)
- **DialogHeader / Title / Description** — 見出しと補助説明
- **DialogFooter** — ボタン群 (右寄せが default)
- **DialogClose** — 閉じるための専用 Trigger (右上 X や Cancel に)

## 5. バリアント (Variants)

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
Dialog 自体に variant はない。**サイズは `className` で制御**:

| サイズ | 用途 | className 例 |
|---|---|---|
| sm | 確認モーダル (削除確認等) | `max-w-sm` |
| md | 標準 (1-2 フィールドのフォーム) | `max-w-md` (default) |
| lg | 詳細表示 (ShareModal 等) | `max-w-2xl` |
| xl | 大きなプレビュー | `max-w-4xl` |
| fullscreen | モバイル全画面 | `w-screen h-screen` (`sm:max-w-md` で desktop だけ縮める) |

モバイルでは原則 [Sheet](./sheet.md) (bottom) を使い、Dialog を選ぶのは確認や短い操作のみ。


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ (Sizes)

`max-w-*` で制御。`max-h-[85vh]` + `overflow-y-auto` を組み合わせて長文に備える。

## 7. 状態 (States)

| 状態 | 視覚 / 挙動 |
|---|---|
| open | Overlay フェードイン + Content スケール (`scale-95 → scale-100`) |
| close | Escape / 外側クリック / DialogClose / 明示的 onClose |
| busy | Footer の主要 Button を disabled + `aria-busy` |
| with-error | DialogDescription を ErrorState 文言に差し替え or inline alert |

motion: `data-[state=open]:animate-in fade-in-0 zoom-in-95 duration-slow` (300ms)。`prefers-reduced-motion` で 0ms。

## 8. アクセシビリティ (Accessibility)

- **フォーカストラップ**: Dialog open 中は内部のみフォーカス移動 (Radix が処理)
- **Escape で閉じる** (Radix default)
- **背景の `aria-hidden="true"`** が body 直下要素に付与される
- **DialogTitle 必須** — SR 用に `aria-labelledby` で参照 (省略すると warning)
- **DialogDescription 推奨** — `aria-describedby` 用
- **初期フォーカス**: 主要操作 (Confirm) ではなく Cancel / 入力欄が安全。破壊的操作は **必ず Cancel に初期フォーカス**
- **閉じた時にフォーカスを元の Trigger に戻す** (Radix が処理)

## 9. レスポンシブ

- モバイル (<640px): 横余白を取らず `inset-x-4 bottom-4` 風の **底寄せ** に。または [Sheet](./sheet.md) (side="bottom") に切替
- デスクトップ: 画面中央、`max-w-md` 〜 `max-w-2xl`
- 長文時は `max-h-[85vh] overflow-y-auto`

## 10. 使用例 (Code)

### 10.1 確認モーダル (破壊的操作)
```tsx
import {
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
```

### 10.2 短いフォーム (1-2 フィールド)
```tsx
<Dialog open={open} onOpenChange={setOpen}>
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
```

### 10.3 詳細表示 (ShareModal 風)
```tsx
<Dialog>
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
```

## 11. アンチパターン (Anti-patterns)

- ❌ Dialog に大量のフォーム (5+ フィールド) を詰める → ✅ 別ページに分離
- ❌ Dialog の中に Dialog を入れ子 → ✅ 一段ずつ閉じる or ステップ UI に再設計
- ❌ DialogTitle 省略 → ✅ 必須 (a11y 要件)
- ❌ 破壊的操作で Confirm に autoFocus → ✅ Cancel に autoFocus
- ❌ Escape で閉じられない (`onOpenChange` をフックして抑制) → ✅ ユーザーの離脱経路は常に確保
- ❌ デスクトップ前提で `min-w-[600px]` 固定 → ✅ `max-w-md` + モバイルは余白縮小
- ❌ 重い処理中に二重 submit → ✅ 主要 Button を disabled + `aria-busy`
- ❌ モーダルの中で別タブを開く (UX 混乱) → ✅ closeしてから遷移

## 12. 関連 (Related)

- [Sheet](./sheet.md) — サイドからスライド (モバイル向き)
- [Popover](./popover.md) — anchor 起点の小さい吊り下げ
- [DropdownMenu](./dropdown-menu.md) — メニュー
- [Toast](./toast.md) — 非同期完了通知
- [ShareModal](../02-molecules/share-modal.md) — 統合ダイアログの実例
- [04-patterns/modals-and-sheets.md](../04-patterns/modals-and-sheets.md) — 使い分け詳細

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、Radix UI Dialog + duration-slow (300ms) フェードイン
