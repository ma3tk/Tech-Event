---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/ShareModal.stories.tsx
last_reviewed: 2026-06-06
personas: [P6, P7, P8]
---

# ShareModal

> Design.md 準拠 | 実装: `libs/shared/ui-composite/src/ShareModal.tsx` (Dynamic: `ShareModalDynamic.tsx`)

## 対象ペルソナ

- 主要: P6 小林一郎 (DevRel: SNS シェアで集客)、P7 高橋真由美 (個人主催: QR で当日案内)、P8 渡辺浩之 (企業イベント: OG)
- 副次: P1 山田美咲 (参加者として友達にシェア)

(根拠: [`Personas.md`](../../../Personas.md))

## 1. 目的 (Purpose)
イベント / グループの **シェア** を 1 つのモーダルで完結させる統合 UI。OG プレビュー / リンクコピー / SNS シェア / QR / 埋め込みコードを Tabs で切替表示する Client Component。モバイルでは `navigator.share` を先に試行 (Web Share API)。

## 2. いつ使うか (When to use)
- イベント詳細ページの「シェア」ボタンクリック時
- グループ詳細ページの「招待」ボタン
- ユーザープロフィールの「プロフィールを共有」(将来的に)

## 3. いつ使わないか (When NOT to use)
- 単純に URL をコピーするだけ → コピーボタン + Toast で十分 (モーダル不要)
- モバイル単独で十分なら `navigator.share` だけで OK (モーダル不要)
- 1 タブしか中身がない場合 → 通常の Dialog で十分

## 4. 構造 (Anatomy)

```
┌─── Dialog (max-w-2xl) ───────────────────────┐
│ DialogHeader                                  │
│   DialogTitle: イベントをシェア               │
│                                               │
│ ┌─ OG Preview ─────────────────────────┐      │
│ │ サムネ + タイトル + 説明文           │      │
│ └──────────────────────────────────────┘      │
│                                               │
│ [リンク] [SNS] [QR] [埋め込み]   ← Tabs       │
│ ──────────────────────────────                │
│                                               │
│ TabsContent: 選択タブの中身                   │
│   - リンク: コピーボタン + URL                │
│   - SNS: X / Facebook / LINE / Bluesky        │
│   - QR: SVG QR コード                          │
│   - 埋め込み: HTML iframe コード              │
│                                               │
│ DialogFooter: [閉じる]                        │
└───────────────────────────────────────────────┘
```

## 5. バリアント

<!-- AUTO-GENERATED START: variants -->
<!-- 将来は cva variants 設定 / TS Props 型から自動抽出。現状は手書き。乖離検出は CI で。 -->
| variant | 用途 |
|---|---|
| `event` | イベントシェア (default) |
| `group` | グループ招待 |
| `profile` | プロフィール共有 (将来) |


<!-- AUTO-GENERATED END: variants -->

## 6. サイズ

`max-w-2xl` (Dialog 上)。モバイルでは `Sheet` (bottom) に切替 (`useMediaQuery`)。

## 7. 状態

| 状態 | 視覚 / 挙動 |
|---|---|
| open | Dialog open + 「リンク」タブが initial |
| copying | コピーボタン押下 → spinner → 完了 Toast |
| sharing (mobile) | `navigator.share` 起動 → 成功 / キャンセル |
| error | コピー失敗時の inline Alert + manual select |

## 8. アクセシビリティ

- Tabs はキーボード (←→) で切替
- コピーボタンに `aria-live="polite"` の status 領域 (「コピーしました」)
- QR コード SVG に `aria-label="QR コード: ${url}"`
- 埋め込みコード textarea は `readOnly` + クリックで全選択

## 9. レスポンシブ

- デスクトップ: Dialog (max-w-2xl)
- モバイル: bottom Sheet または `navigator.share` 優先

## 10. 使用例 (Code)

### 10.1 イベント詳細ページから
```tsx
import { ShareModalDynamic } from "@tech-event/shared-ui-composite";
import { Share2 } from "lucide-react";

<ShareModalDynamic
  url={`https://tech-event.com/event/${event.id}`}
  title={event.title}
  description={event.summary}
  ogImage={event.ogImage}
  trigger={
    <Button variant="ghost" size="icon" aria-label="シェア">
      <Share2 />
    </Button>
  }
/>
```

`ShareModalDynamic` は `next/dynamic` で client bundle を遅延読み込み (主要画面の TBT を削る)。

### 10.2 modal API (制御)
```tsx
<ShareModal
  open={shareOpen}
  onOpenChange={setShareOpen}
  url={url}
  title={title}
  initialTab="qr"
/>
```

## 11. アンチパターン

- ❌ クリップボード操作後に何も通知しない → ✅ Toast or inline status で必ず告知
- ❌ Web Share API のフォールバックなし → ✅ デスクトップ / 古いブラウザは Dialog
- ❌ QR を大きすぎる SVG にする → ✅ 200×200px 程度で十分
- ❌ 埋め込みコードに `<script>` を含める → ✅ `<iframe>` 単独 (XSS リスク回避)

## 12. 関連

- [Dialog](../ui/dialog.md)
- [Tabs](../ui/tabs.md)
- [Toast](../ui/toast.md)
- [blocks/modals-and-sheets.md](../blocks/modals-and-sheets.md)

## 13. 変更履歴

- v1.0.0 (2026-06-05): 初回リリース、4 タブ統合、Web Share API 優先
