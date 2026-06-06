---
status: stable
figma: TODO
storybook: TODO (Storybook MDX: src/stories/design-system/motion.mdx)
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P5, P6, P7, P8, P9]
---

# Motion

> Design.md §8 の再展開 | 詳細: [`docs/motion.md`](../../motion.md)

## 1. Duration トークン

| Token | 値 | 用途 |
|---|---|---|
| `--duration-instant` | 0 | `prefers-reduced-motion` フォールバック |
| `--duration-fast` | 150ms | button hover / focus / link underline |
| `--duration-normal` | 200ms | card hover (lift + shadow) |
| `--duration-slow` | 300ms | dialog open / sheet slide |
| `--duration-slower` | 500ms | page transition (ほぼ未使用) |

## 2. Easing

| Easing | 用途 |
|---|---|
| `ease-out` | 開く / 現れる (Dialog open, fade in) |
| `ease-in` | 閉じる / 消える (Dialog close, fade out) |
| `ease-in-out` | 同質変化 (color transition) |
| `ease-spring` | 微小な弾み (avatar stack hover) |

## 3. 原則

- **情報伝達目的のみ** (status 変化を伝える) — ループ装飾アニメ禁止 (Design.md §8)
- skeleton の `animate-pulse` は例外、ただし `prefers-reduced-motion` で停止
- ユーザー視点で 100ms 未満の処理にはアニメ不要

## 4. 標準パターン

```tsx
// Button hover
className="transition-colors duration-fast ease-out"

// Card hover
className="transition-all duration-normal ease-out hover:-translate-y-0.5 hover:shadow-md"

// Dialog open
data-[state=open]:animate-in fade-in-0 zoom-in-95 duration-slow

// Sheet slide
data-[state=open]:slide-in-from-right duration-slow
```

## 5. reduced-motion 対応

`prefers-reduced-motion: reduce` で **全アニメ無効化** (`globals.css` のメディアクエリで自動)。

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
```

## 6. アンチパターン

- ❌ ループする装飾アニメ → ✅ 禁止 (skeleton pulse のみ例外)
- ❌ 500ms 超えの長いアニメ → ✅ slow (300ms) まで
- ❌ JS 物理アニメ (react-spring の bouncy 等) → ✅ CSS transition のみ
- ❌ reduced-motion 無視 → ✅ 自動で 0ms に

## 7. 関連

- [Design.md §8](../../../Design.md)
- [docs/motion.md](../../motion.md)
- [accessibility.md](./accessibility.md)
