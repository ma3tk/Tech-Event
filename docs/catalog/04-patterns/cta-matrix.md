---
status: stable
figma: TODO
storybook: libs/shared/ui/src/button.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P6]
---

# CTA マトリクス (CTA matrix)

> Design.md §10.2 + Personas.md (P1 山田美咲 / P3 佐藤健太) | 一次資料: [`01-atoms/button.md`](../01-atoms/button.md), [`02-molecules/event-sticky-cta.md`](../02-molecules/event-sticky-cta.md)

## 対象ペルソナ

- 主要: P1 山田美咲 (モバイル参加者: 1 タップで判断したい), P3 佐藤健太 (抽選イベント常連: 抽選 vs 先着の差を理解したい)
- 副次: P2 田中慎太郎 (週末参加者), P4 鈴木大輔 (シニア: 言葉の意味のブレに敏感), P6 小林一郎 (DevRel: 主催者として CTA 文言を正典化したい)

## 0. なぜ専用パターンか

「参加する」「申込む」「登録する」「予約する」のように、似た意味の語が **同じプロダクト内で混在すると参加者は迷う**。とくに P4 シニア層と P1 モバイル層は文言ブレに敏感。Design.md §10.2 で CTA ラベルは **4 種に統一** と規定された。本パターンは 4 CTA の **使い分けマトリクス** と、ステータス × 申込方式 × ユーザー状態の **3 軸マトリクス** をまとめる。

## 1. 4 CTA ラベル (Design.md §10.2 と同期、変更禁止)

| CTA | 日本語 | 英語 | 用途 | Button variant |
| --- | --- | --- | --- | --- |
| Register | 参加申込 | Register | 通常の申込 (先着) | `default` (brand-orange) |
| Waitlist | 補欠登録 | Join Waitlist | 定員到達後の補欠 | `secondary` |
| Lottery | 抽選に申し込む | Apply for Lottery | 抽選方式のイベント | `default` (brand-orange) |
| Request | 参加リクエストを送信 | Request to Join | 主催者承認制 | `secondary` |

> 「参加する」「申込む」「予約する」「行く」などの **独自表現は禁止**。i18n リソース (`apps/web/messages/{ja,en}.json`) で 4 値を strict 化。

## 2. 3 軸マトリクス (status × 申込方式 × ユーザー状態)

### 2.1 status × 申込方式 (どの CTA を出すか)

| status \ 方式 | 先着 (FCFS) | 抽選 (Lottery) | 承認制 (Request) |
| --- | --- | --- | --- |
| upcoming | disabled "公開前" | disabled "公開前" | disabled "公開前" |
| open | **Register** | **Lottery** | **Request** |
| full | (補欠有効なら) **Waitlist** / 無効なら disabled "満員" | (抽選期間中なら) **Lottery** / 締切後は disabled | **Request** (承認制は定員未確定が多い) |
| waitlist | **Waitlist** | — (抽選には waitlist 概念なし) | — |
| closed | disabled "申込終了" | disabled "申込終了" | disabled "申込終了" |
| ongoing | `link` variant "会場へ向かう" (申込済の場合のみ) | 同左 | 同左 |
| ended | `ghost` "アーカイブを見る" | 同左 | 同左 |
| cancelled | disabled "中止: 〇〇のため" | 同左 | 同左 |

### 2.2 ユーザー状態 × CTA 切替 (multi-state button)

参加者の状態 (未申込 / 申込済 / 補欠 / 抽選中 / 抽選当選 / 抽選落選) で **同じボタン位置の表示が変わる**。

| user state | ボタン表示 | variant | クリック動作 |
| --- | --- | --- | --- |
| 未申込 | "参加申込" | `default` | 申込フロー開始 |
| 申込済 | "申込済 ・ 変更" | `outline` + check icon | 申込詳細モーダル (変更 / キャンセル) |
| 補欠待ち | "補欠中 (順位 N) ・ 解除" | `outline` + clock icon | 補欠順位モーダル |
| 抽選応募中 | "抽選応募中 ・ 取り消し" | `outline` + dice icon | 取消確認 dialog |
| 抽選当選 | "当選 ・ 詳細" | `default` (brand-orange) + check | 当選詳細 |
| 抽選落選 | "落選 ・ 他のイベントを探す" | `ghost` | `/discover` へ遷移 |

> 同じ位置で表示が遷移するため、**幅をリセットしない** (max-width 固定、内部だけ swap)。トランジションは `fast` (150ms) + cross-fade。

## 3. multi-state ボタンの実装パターン

```tsx
// EventStickyCTA / EventCard footer などで使う共通パターン
function EventCTA({ event, userState }: { event: Event; userState: UserState }) {
  const cta = resolveCTA(event.status, event.method, userState); // 上記マトリクスを引く
  return (
    <Button
      variant={cta.variant}
      disabled={cta.disabled}
      aria-label={cta.ariaLabel}
      data-cta={cta.key} // analytics 用
      onClick={cta.onClick}
    >
      {cta.icon ? <cta.icon className="h-4 w-4" /> : null}
      {cta.label}
    </Button>
  );
}
```

- `resolveCTA` は本マトリクスの純関数。**テスト 100% カバー必須** (8 status × 3 方式 × 6 user state = 144 ケース、無効を除いて約 60 ケース)
- `data-cta` で analytics は `cta.key` (e.g. `register`, `waitlist-cancel`) を計測
- `aria-label` は文言 + コンテキスト (例: "イベント X に参加申込") を含めて読み上げ明瞭に

## 4. アンチパターン

- 4 CTA 以外の独自文言 ("参加する" "予約する") を増やす → i18n に追加禁止
- multi-state ボタンの幅がガタつく → CLS が発生して P1 のモバイル UX を破壊
- 抽選イベントに "Register" を出す → P3 のような抽選常連は方式の差で意思決定する
- 申込済ユーザーに primary CTA を出し続ける → 二重申込を誘発
- "申込済" の状態で何もできない (変更も解除もできない) → 必ず action を 1 つは残す

## 5. 関連

- [01-atoms/button.md](../01-atoms/button.md) — variant 仕様
- [02-molecules/event-sticky-cta.md](../02-molecules/event-sticky-cta.md) — Sticky CTA 実装
- [04-patterns/event-status-orchestration.md](./event-status-orchestration.md) — 8 status との対応
- [04-patterns/host-vs-participant-ui.md](./host-vs-participant-ui.md) — 主催者は別 CTA
- [`Personas.md`](../../../Personas.md) P3 (抽選), P4 (言葉の正確さ)
