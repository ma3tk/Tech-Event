---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/HostAvatarStack.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P5, P6]
---

# HostAvatarStack

> Design.md 準拠 | Storybook: [HostAvatarStack stories](../../../libs/shared/ui-composite/src/HostAvatarStack.stories.tsx) | 実装: `libs/shared/ui-composite/src/HostAvatarStack.tsx`

## 1. 目的
**共催 (co-host) アバターの重ね表示**。`maxVisible` 超は "+N" にまとめ、`aria-label` で氏名を集約 (SR 対応)。

## 2. いつ使うか
- イベント詳細の主催者表示
- カードの「主催」表示
- 共催が複数あるイベント

## 3. バリアント / サイズ

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
- size: `sm` / `md` / `lg`
- maxVisible: default 3


<!-- AUTO-GENERATED END: variants -->

## 4. アクセシビリティ

- `aria-label="主催: 山田, 鈴木, 田中 ほか 2 名"`
- Tooltip で個別氏名表示 (hover)

## 5. 使用例

```tsx
<HostAvatarStack hosts={hosts} size="md" maxVisible={3} />
```

## 6. 関連

- [Avatar](../ui/avatar.md)
- [Tooltip](../ui/tooltip.md)
- [ParticipantBadge](./participant-badge.md)

## 7. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、aria-label 氏名集約対応
