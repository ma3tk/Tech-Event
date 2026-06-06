---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/Header.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P6]
---

# HeaderServer

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/HeaderServer.tsx`

## 1. 目的
`Header` の **Server Component ラッパー**。current user / 通知数を Server で解決し、`Header` (Client) に props として渡す。Hydration mismatch を回避する。

## 2. いつ使うか
- ほぼ全ページの `layout.tsx` で 1 つだけ

## 3. 使用例

```tsx
// apps/web/src/app/layout.tsx
import { HeaderServer } from "@tech-event/shared-ui-composite";

<HeaderServer />
```

## 4. アンチパターン

- ❌ `Header` を Client から直接呼ぶ → ✅ `HeaderServer` 経由
- ❌ ロジックを Header (Client) で書く → ✅ Server で解決

## 5. 関連

- [Header](./header.md)

## 6. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
