---
status: stable
figma: TODO
storybook: libs/shared/ui/src/input.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6, P7]
---

# Input

> Design.md 準拠 | Storybook: [Input stories](../../../libs/shared/ui/src/input.stories.tsx) | 実装: `libs/shared/ui/src/input.tsx`

## 1. 目的 (Purpose)
1 行のテキスト入力 (text / email / password / search / url / number / date) を統一的に扱う。`size` / `error` / 左右アイコンを CVA で型付けし、フォーム全般の入力 atom として使う。

## 2. いつ使うか (When to use)
- 短いテキスト入力 (名前 / タイトル / メール / URL)
- パスワード入力 (`type="password"`)
- 検索ボックスのコア (アイコン付き、SearchBox の中身)
- 数値入力 (`type="number"`)
- 日付入力 (`type="date"`、ただし複雑なものは Calendar / DatePicker)

## 3. いつ使わないか (When NOT to use)
- **複数行** → [Textarea](./textarea.md)
- **選択肢から選ぶ** → [Select](./select.md) / [RadioGroup](./radio-group.md) / [Checkbox](./checkbox.md)
- **ON/OFF** → [Switch](./switch.md)
- **Markdown 入力** → [MarkdownEditor](../02-molecules/markdown-editor.md)
- **大きな検索 UI** → [SearchBox](../02-molecules/search-box.md) (Input をラップ)

## 4. 構造 (Anatomy)

```
┌──────────────────────────────────────┐
│ [icon] placeholder / value  [icon]   │
└──────────────────────────────────────┘
   ▲                              ▲
   └─ leftIcon (optional, 16px)   └─ rightIcon (optional)

Label:        必ず上または左に Label を配置 (htmlFor で連携)
Description:  サブ説明は Input の下、muted 色で
Error:        エラーは FormMessage で下に赤字
```

## 5. バリアント (Variants)

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 | 視覚 |
|---|---|---|
| `default` | 通常 | `border-border` |
| `error` | エラー状態 | `border-destructive` + `focus-visible:ring-destructive` |

`error` は **boolean prop** で切替: `<Input error={!!errors.email} />`。`aria-invalid` も同時に立てる。


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ (Sizes)

| size | 用途 | 高さ |
|---|---|---|
| `sm` | コンパクト (ヘッダーの検索) | 32px |
| `md` | 標準 (フォーム) | 40px |
| `lg` | ヒーロー検索 / ランディング | 48px |

モバイルでは `md` 以上推奨 (タッチ領域)。`lg` はランディング検索 / フォームの主要 input に。

## 7. 状態 (States)

| 状態 | 視覚 | 実装 |
|---|---|---|
| default | `border-border` | base |
| hover | `border-border-strong` | `hover:border-border-strong` |
| focus-visible | brand-orange ring 2px | `focus-visible:ring-2 focus-visible:ring-brand-orange` |
| disabled | opacity-50 + bg-surface-muted | `disabled:opacity-50 disabled:bg-surface-muted` |
| error | `border-destructive` + red ring | `aria-invalid={true}` で auto |
| readonly | bg-surface-muted (border は default) | `readOnly` |

## 8. アクセシビリティ (Accessibility)

- **`<label htmlFor>`** で必ず Input に関連付け (Label 単独描画 + `id`)
- 必須フィールドは `required` + `aria-required="true"` + 視覚的にも `<span aria-hidden>*</span>`
- エラーは `aria-invalid="true"` + `aria-describedby={errorId}` で FormMessage と紐付け
- プレースホルダ単独で説明しない (placeholder は label の代替ではない)
- パスワードの「表示」トグルは `aria-pressed` 付きの Button で

## 9. レスポンシブ

- モバイルではフルワイド (`w-full`) を基本に
- フォームは `space-y-4` で縦積み (sm 未満)
- inline 配置 (ラベル + Input 横並び) は `lg` 以上のみ

## 10. 使用例 (Code)

### 10.1 基本
```tsx
import { Input } from "@tech-event/shared-ui";
import { Label } from "@tech-event/shared-ui";

<div className="space-y-2">
  <Label htmlFor="title">タイトル</Label>
  <Input id="title" placeholder="勉強会のタイトル" />
</div>
```

### 10.2 アイコン付き
```tsx
import { Search } from "lucide-react";

<Input
  type="search"
  placeholder="イベントを検索"
  leftIcon={<Search />}
  aria-label="イベントを検索"
/>
```

### 10.3 エラー状態 (RHF + Zod)
```tsx
<FormField
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
```

### 10.4 パスワード + 表示トグル
```tsx
const [show, setShow] = useState(false);

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
```

## 11. アンチパターン (Anti-patterns)

- ❌ `<Input placeholder="メール" />` (label なし) → ✅ `<Label htmlFor>` 必須
- ❌ placeholder で説明を完結 → ✅ Label と FormDescription を併用
- ❌ `<input>` を直接書く → ✅ `<Input>` で統一 (`border-border` 等のトークン適用のため)
- ❌ エラー時に border 色だけ赤くする (色のみ依存) → ✅ FormMessage で文言も出す
- ❌ `type="text"` でメール / URL も扱う → ✅ 適切な type 指定 (mobile keyboard / browser 補完が変わる)
- ❌ `autocomplete` 未指定 → ✅ 必ず適切な値 (`email` / `current-password` / `new-password` / `name` 等)

## 12. 関連 (Related)

- [Label](./label.md) — 必ずペア
- [Form](./form.md) — RHF + Zod ラッパー (推奨統合)
- [Textarea](./textarea.md) — 複数行
- [Select](./select.md) — 選択肢
- [SearchBox](../02-molecules/search-box.md) — 検索 UI のラッパー

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、CVA で size + error variant、leftIcon / rightIcon prop
