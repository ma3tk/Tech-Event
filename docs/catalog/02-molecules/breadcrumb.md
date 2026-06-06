---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/Breadcrumb.stories.tsx
last_reviewed: 2026-06-06
personas: [P4, P6]
---

# Breadcrumb

> Design.md 準拠 | Storybook: [Breadcrumb stories](../../../libs/shared/ui-composite/src/Breadcrumb.stories.tsx) | 実装: `libs/shared/ui-composite/src/Breadcrumb.tsx`

## 1. 目的
階層的なナビゲーション。現在地までのパスを示し、上階層に戻れるようにする。JSON-LD 構造化データを同時出力可能。

## 2. いつ使うか
- 階層が 2 段以上のページ (例: トップ > グループ > イベント詳細)
- 検索結果のフィルタ階層
- 管理画面

## 3. いつ使わないか
- 単一ページ
- ルート直下 1 階層のみ
- モバイルで横スクロール必須レベルに長い → 別 UI

## 4. 構造

```
Top > グループ > Tokyo TypeScript > AI で始める TS
       ▲                              ▲
       Link で戻れる                  現在地 (Link なし)
```

## 5. アクセシビリティ

- `<nav aria-label="breadcrumb">`
- 現在地は `aria-current="page"`
- 区切り (ChevronRight) は `aria-hidden`

## 6. 使用例

```tsx
import { Breadcrumb } from "@tech-event/shared-ui-composite";

<Breadcrumb
  items={[
    { label: "トップ", href: "/" },
    { label: "グループ", href: "/group" },
    { label: "Tokyo TypeScript", href: "/group/ts-tokyo" },
    { label: event.title },  // 現在地は href なし
  ]}
  emitJsonLd  // SEO 用 JSON-LD 同時出力
/>
```

## 7. アンチパターン

- ❌ 5+ 階層 → ✅ 中間を `…` で省略
- ❌ ホームを省略 → ✅ 最初に必ずトップ
- ❌ aria-current なし → ✅ 現在地に必須

## 8. 関連

- [04-patterns/navigation.md](../04-patterns/navigation.md)

## 9. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、JSON-LD 同時出力
