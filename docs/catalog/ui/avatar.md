---
status: stable
figma: TODO
storybook: libs/shared/ui/src/avatar.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P5, P6]
---

# Avatar

> Design.md 準拠 | Storybook: [Avatar stories](../../../libs/shared/ui/src/avatar.stories.tsx) | 実装: `libs/shared/ui/src/avatar.tsx`

## 1. 目的
ユーザー / グループの **アバター画像** を表示。画像読み込み失敗時は **イニシャル** にフォールバック。Radix UI ベース。

## 2. いつ使うか
- ユーザーアイコン (ヘッダー / コメント / 参加者リスト)
- グループのロゴ
- 主催者表示
- アバターと名前のセット ([ParticipantBadge](../components/participant-badge.md))

## 3. いつ使わないか
- 画像のみの装飾 → `<Image>` を直接
- ロゴ単独 → 別コンポーネント (テキストロゴ)

## 4. 構造

```
○ ← 画像 or イニシャル fallback (例: "JS")
```

## 5. バリアント / サイズ

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| サイズ | 用途 | px |
|---|---|---|
| sm | リスト行 / コメント | 24 |
| md | 標準 | 32 |
| lg | ヘッダー / プロフィール | 48 |
| xl | プロフィールヘッダー | 64+ |


<!-- AUTO-GENERATED END: variants -->

## 6. 状態

loading (画像読み込み中) / loaded / fallback (失敗)。

## 7. アクセシビリティ

- `alt` で意味を持つ画像は記述 (主催者「山田太郎のアバター」等)
- イニシャルフォールバックは装飾扱い (`aria-hidden`)
- 周辺テキストで意味を担保

## 8. 使用例

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@tech-event/shared-ui";

<Avatar className="size-8">
  <AvatarImage src={user.image} alt={`${user.name} のアバター`} />
  <AvatarFallback aria-hidden>
    {user.name.slice(0, 2)}
  </AvatarFallback>
</Avatar>
```

## 9. アンチパターン

- ❌ alt 抜け → ✅ 意味があるなら必須
- ❌ 角丸を `rounded-md` 等で → ✅ `rounded-full` 厳守

## 10. 関連

- [ParticipantBadge](../components/participant-badge.md)
- [HostAvatarStack](../components/host-avatar-stack.md)

## 11. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
