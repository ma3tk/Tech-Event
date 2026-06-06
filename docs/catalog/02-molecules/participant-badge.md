---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/ParticipantBadge.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P5, P6, P9]
---

# ParticipantBadge

> Design.md 準拠 | Storybook: [ParticipantBadge stories](../../../libs/shared/ui-composite/src/ParticipantBadge.stories.tsx) | 実装: `libs/shared/ui-composite/src/ParticipantBadge.tsx`

## 1. 目的
**参加者のアバター + ニックネーム** を表示する Molecule。`user` オブジェクト or 直接プロパティで指定可能。

## 2. いつ使うか
- 参加者一覧
- 主催者表示 (単体)
- コメントのユーザー名
- イベント詳細の「参加予定」セクション

## 3. いつ使わないか
- 多人数の重ね表示 → [HostAvatarStack](./host-avatar-stack.md)
- アバターのみ → [Avatar](../01-atoms/avatar.md)

## 4. 使用例

```tsx
import { ParticipantBadge } from "@tech-event/shared-ui-composite";

<ParticipantBadge user={user} />
// or
<ParticipantBadge nickname="taro_y" avatarUrl="/u/taro.png" />
```

## 5. アクセシビリティ

- リンク化されている場合は `<Link>` でラップ
- アバター画像に alt

## 6. 関連

- [Avatar](../01-atoms/avatar.md)
- [HostAvatarStack](./host-avatar-stack.md)

## 7. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
