---
status: stable
figma: TODO
storybook: libs/shared/ui/src/switch.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P5]
---

# Switch

> Design.md 準拠 | Storybook: [Switch stories](../../../libs/shared/ui/src/switch.stories.tsx) | 実装: `libs/shared/ui/src/switch.tsx`

## 1. 目的
**即時切替** される ON/OFF トグル。チェックボックスと違い、状態変更が **即副作用** (保存 / フィルタ反映) を伴うときに使う。

## 2. いつ使うか
- 設定画面の即時保存項目 (通知 ON/OFF)
- ダークモード切替
- フィルタ ON/OFF
- 公開状態のクイック切替

## 3. いつ使わないか
- 同意チェック (Submit で確定) → [Checkbox](./checkbox.md)
- 排他的選択 → [RadioGroup](./radio-group.md)
- ボタン的アクション → [Button](./button.md)

## 4. 構造

```
ラベル          ◯───  (off)
ラベル          ───◉  (on)
```

## 5. 状態

off / on / disabled。

## 6. アクセシビリティ

- Label 必須
- `role="switch"` + `aria-checked` (Radix が処理)
- キーボード Space で切替

## 7. 使用例

```tsx
import { Switch } from "@tech-event/shared-ui";

<div className="flex items-center justify-between">
  <Label htmlFor="notify">メール通知を受け取る</Label>
  <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
</div>
```

## 8. アンチパターン

- ❌ Submit で確定する用途 → ✅ Checkbox
- ❌ Label 抜け → ✅ 必須

## 9. 関連

- [Checkbox](./checkbox.md)
- [ThemeSwitcher](../components/theme-switcher.md) — Switch + ロジック

## 10. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
