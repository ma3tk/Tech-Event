# Footer

> Design.md 準拠 | Storybook: [Footer stories](../../../libs/shared/ui-composite/src/Footer.stories.tsx) | 実装: `libs/shared/ui-composite/src/Footer.tsx`

## 1. 目的
グローバルフッター。リンク群 + SNS + コピーライト。

## 2. いつ使うか
- 全ページ (auth flow / iframe 除く)

## 3. 構造

```
┌──────────────────────────────────────────┐
│ サービス    主催者向け    会社情報        │
│ - リンク     - リンク       - リンク       │
│                                            │
│ [SNS アイコン]   © 2026 tech-event         │
└──────────────────────────────────────────┘
```

## 4. アクセシビリティ

- `<footer role="contentinfo">`
- SNS アイコンに `aria-label`
- 各列に `<h2 className="sr-only">`

## 5. アンチパターン

- ❌ リンク 30+ → ✅ 重要 10-15 個に絞る
- ❌ SNS だけアイコン → ✅ テキストも (`<span className="sr-only">`)

## 6. 関連

- [Separator](../01-atoms/separator.md)
- [04-patterns/navigation.md](../04-patterns/navigation.md)

## 7. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース
