---
status: stable
figma: TODO
storybook: libs/shared/ui/src/radio-group.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P4, P6]
---

# RadioGroup

> Design.md 準拠 | Storybook: [RadioGroup stories](../../../libs/shared/ui/src/radio-group.stories.tsx) | 実装: `libs/shared/ui/src/radio-group.tsx`

## 1. 目的
**排他的に 1 つ** だけ選択させる選択肢グループ。2-4 個の選択肢に最適。

## 2. いつ使うか
- 表示形式 (リスト / グリッド)
- 公開範囲 (公開 / 限定公開 / 非公開)
- 価格プラン (Free / Pro)
- 性別 / 年代 など

## 3. いつ使わないか
- 5+ 個 → [Select](./select.md)
- 複数選択 → [Checkbox](./checkbox.md)
- ON/OFF → [Switch](./switch.md)

## 4. 構造

```
○ オプション A
● オプション B (選択中)
○ オプション C
```

## 5. 状態

unchecked / checked / disabled / error。

## 6. アクセシビリティ

- 全体は `<fieldset>` + `<legend>` で括る (Radix が role="radiogroup" 付与)
- 各 Item に Label を関連付け
- キーボード ←→ / ↑↓ で切替

## 7. 使用例

```tsx
import { RadioGroup, RadioGroupItem } from "@tech-event/shared-ui";

<fieldset className="space-y-2">
  <legend className="text-sm font-medium">公開範囲</legend>
  <RadioGroup defaultValue="public">
    <div className="flex items-center gap-2">
      <RadioGroupItem id="public" value="public" />
      <Label htmlFor="public">公開</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="unlisted" value="unlisted" />
      <Label htmlFor="unlisted">限定公開</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="private" value="private" />
      <Label htmlFor="private">非公開</Label>
    </div>
  </RadioGroup>
</fieldset>
```

## 8. アンチパターン

- ❌ Checkbox を排他制御 → ✅ RadioGroup
- ❌ legend 抜け → ✅ fieldset + legend で意味的に括る

## 9. 関連

- [Checkbox](./checkbox.md)
- [Select](./select.md)
- [blocks/data-input.md](../blocks/data-input.md)

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
