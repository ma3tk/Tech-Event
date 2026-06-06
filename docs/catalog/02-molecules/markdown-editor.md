# MarkdownEditor

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/MarkdownEditor.tsx` (Dynamic: `MarkdownEditorDynamic.tsx`)

## 1. 目的 (Purpose)
2 カラム WYSIWYG Markdown エディタ (Client Component)。左 textarea + 右ライブプレビュー (`marked`)、太字 / 見出し / リスト / リンク等のツールバー、モバイルではタブ切替、文字数カウント付き。uncontrolled として `<form>` submit にそのまま乗る。

## 2. いつ使うか (When to use)
- イベント本文 (`/event/[id]/edit`)
- グループの説明文 (`/group/[subdomain]/edit`)
- ユーザープロフィールの自己紹介
- お知らせ / 告知の編集

## 3. いつ使わないか (When NOT to use)
- 短い 1 行入力 → [Input](../01-atoms/input.md)
- 数行の Plain text → [Textarea](../01-atoms/textarea.md)
- リッチテキスト (画像インライン編集が必要) → 別 WYSIWYG (将来的に検討)
- コメント (短文) → 軽量 textarea + preview ボタンで十分

## 4. 構造 (Anatomy)

### デスクトップ (md+)
```
┌─────────────────────────────────────────────────────────────┐
│ [B] [I] [H1] [H2] [• Lst] [1. Lst] [Link] [Code]   字数 0/5000 │
│ ─────────────────────────────────────────────────────────── │
│ ┌────────────────────────┐ ┌────────────────────────────┐  │
│ │ Markdown 入力 textarea │ │ ライブプレビュー (marked)  │  │
│ │                        │ │                            │  │
│ └────────────────────────┘ └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### モバイル
```
┌─────────────────────────────────┐
│ [B] [I] [H1] [H2] [• Lst] ...    │
│ ─────────────────────────────── │
│ [編集] [プレビュー]   ← Tabs    │
│ ─────────────────────────────── │
│ 選択タブの中身                  │
└─────────────────────────────────┘
```

## 5. バリアント

- `mode="edit-preview"` (default) — 2 カラム
- `mode="edit-only"` — ツールバー + textarea のみ
- `mode="preview-only"` — 表示専用 (`<MarkdownPreview>` だけでも代替可)

## 6. サイズ

`min-h-[400px]` 程度。`maxLength` prop で字数制限を強制。

## 7. 状態

| 状態 | 視覚 |
|---|---|
| empty | placeholder「マークダウンで本文を書く」 |
| editing | プレビューが追随 (debounce 200ms) |
| over-limit | 字数カウントが `text-destructive` + textarea border |
| sanitize-error | プレビュー領域に `<ErrorState>` |
| loading (dynamic import) | `<Skeleton>` で骨格 |

## 8. アクセシビリティ

- ツールバーボタンに `aria-label` + `aria-keyshortcuts` (例: Bold = Ctrl+B)
- textarea に `aria-describedby` で字数カウント領域を参照
- preview 部分は **sanitize 必須** (`@/lib/markdown` の `renderMarkdown` 経由、DOMPurify)
- preview の見出しは編集中のため `h2-h4` に降格 (ページ内 h1 と競合させない)

## 9. レスポンシブ

- モバイル (<md): Tabs で edit / preview を切替 (画面狭い)
- デスクトップ (md+): 2 カラム並列

## 10. 使用例 (Code)

```tsx
import { MarkdownEditorDynamic } from "@tech-event/shared-ui-composite";

<form action={updateEventDescription}>
  <MarkdownEditorDynamic
    name="description"
    defaultValue={event.description}
    maxLength={5000}
    placeholder="イベントの内容を Markdown で記述"
  />
  <Button type="submit">保存</Button>
</form>
```

uncontrolled (`name` + `defaultValue`) なので Server Action にそのまま乗る。

## 11. アンチパターン

- ❌ preview を sanitize しない → ✅ DOMPurify (`renderMarkdown`) 必須
- ❌ `dangerouslySetInnerHTML` を直接 → ✅ ラッパー経由
- ❌ ツールバー操作後に focus を奪う → ✅ textarea にフォーカスを戻す
- ❌ controlled state で毎キー parent re-render → ✅ uncontrolled + debounce プレビュー
- ❌ モバイル 2 カラム → ✅ Tabs 切替

## 12. 関連

- [Textarea](../01-atoms/textarea.md)
- [Tabs](../01-atoms/tabs.md)
- [ErrorState](../01-atoms/error-state.md)
- [04-patterns/forms.md](../04-patterns/forms.md)

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、Dynamic import で main bundle から分離
