---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/event-status-badge.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P6, P7]
---

# イベントステータス オーケストレーション (Event status orchestration)

> Design.md §10 + Personas.md (P1 山田美咲 / P6 小林一郎) | 一次資料: [`docs/design-system.md` §10](../../design-system.md), [`components/event-status-badge.md`](../components/event-status-badge.md)

## 対象ペルソナ

- 主要: P1 山田美咲 (モバイル参加者: 「行けるかどうか」を 1 秒で判断したい), P6 小林一郎 (DevRel: status 変化通知を漏らさず捌きたい)
- 副次: P2 田中慎太郎 (週末参加者: full/waitlist の差を理解したい), P3 佐藤健太 (抽選イベント常連), P7 高橋真由美 (主催者・キャパ管理)

## 0. なぜ専用パターンか

tech-event は **イベント駆動プロダクト** であり、1 つのイベントは時間経過と申込数の関数で 8 状態を遷移する。この遷移を全コンポーネントで一貫表現できないと、参加者は「申込めるのか?」、主催者は「いま何が起きているか」が分からなくなる。本パターンは 8 ステータスの **状態機械** と、それを表現する全コンポーネント (Badge / CTA / 通知 / メッセージ) の対応表を **正典** として固定する。

## 1. 8 ステータスの状態機械

```
                    [upcoming] (将来日付・未公開含む)
                         │ publish
                         ▼
                    [open] ──申込増──▶ [full] ──キャンセル──▶ [open]
                       │  \                │
                       │   \           waitlist 有効化
                       │    \              ▼
                  closing    \──────▶ [waitlist] ──繰上げ──▶ [open]
                       │                   │
                       ▼                   ▼
                    [closed]           [closed]
                       │                   │
                  start time            start time
                       ▼                   ▼
                  [ongoing]          [ongoing]
                       │                   │
                   end time            end time
                       ▼                   ▼
                    [ended]            [ended]

                    [cancelled] ◀── どの状態からでも (主催者操作)
```

### 1.1 各ステータスの定義 (Design.md §10 と同期)

| status | 意味 | 申込可? | 補欠? | 表示色 (semantic) | テキスト (ja / en) |
| --- | --- | :-: | :-: | --- | --- |
| `upcoming` | 公開前 or 申込開始前 | × | × | `status-upcoming-*` (gray) | 開催予定 / Upcoming |
| `open` | 募集中 | ◯ | × | `status-open-*` (green) | 募集中 / Open |
| `full` | 定員到達・補欠なし | × | × | `status-full-*` (orange) | 満員 / Full |
| `waitlist` | 定員到達・補欠受付中 | × | ◯ | `status-waitlist-*` (yellow) | 補欠受付中 / Waitlist |
| `closed` | 申込締切 | × | × | `status-closed-*` (gray) | 申込終了 / Closed |
| `ongoing` | 開催中 | × | × | `status-ongoing-*` (blue) | 開催中 / Ongoing |
| `ended` | 終了 | × | × | `status-ended-*` (gray-dark) | 終了 / Ended |
| `cancelled` | 中止 | × | × | `status-cancelled-*` (red) | 中止 / Cancelled |

> 色は **必ずトークン経由** (`bg-status-open-bg text-status-open-fg`)。ハードコード禁止 (Design.md §14)。

## 2. UI 表現の一貫性 (status × component の対応)

| component | upcoming | open | full | waitlist | closed | ongoing | ended | cancelled |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [EventStatusBadge](../components/event-status-badge.md) | gray pill | green pill | orange pill | yellow pill | gray pill | blue pill (animate-pulse 弱) | gray-dark pill | red pill |
| [Button](../ui/button.md) (主 CTA) | `disabled` "公開前" | `default` "参加申込" | `disabled` "満員" | `secondary` "補欠登録" | `disabled` "申込終了" | `link` "会場へ" | `ghost` "アーカイブを見る" | `disabled` "中止" |
| [EventCard](../components/event-card.md) | 通常 | 通常 | overlay 弱 | overlay + 補欠 hint | 通常 | "LIVE" 装飾 | 彩度 -30% | 取り消し線 + reason |
| [EventListRow](../components/event-list-row.md) | 同上 | 同上 | trailing icon `Users` | trailing icon `Clock` | 同上 | trailing icon `Radio` | 同上 | 同上 |
| [EventStickyCTA](../components/event-sticky-cta.md) | 非表示 | 表示・主 CTA | 表示・disabled | 表示・補欠 CTA | 非表示 | 表示・"会場へ" | 非表示 | 非表示 |
| [Toast](../ui/toast.md) (status 変化通知) | — | "募集開始" | "満員になりました" | "補欠受付開始" | "申込終了" | "開催開始" | — | "中止: 理由" |

> この表が **catalog 全体の背骨**。Badge / Button / Card / Sticky CTA / Toast はすべてこの表に従う。乖離を見つけたら本ファイルで議論し、表を更新してから実装する。

## 3. アンチパターン

- 色だけで status を伝える (色覚特性に配慮しない) → 必ずテキスト併記 (Design.md §10.1)
- `full` 状態で primary CTA を出したまま `disabled` にしない → 押しても何も起きないボタンは UX 悪化
- `waitlist` で `default` variant を使う → 補欠は補助操作なので `secondary`
- status 遷移時に Toast を出さない → P1 のような「予定確定派」は通知に依存する
- 主催者画面でも参加者と同じバッジ表現 → P6/P7 主催者にとっては「自分が制御できるかどうか」が知りたい。後述 [host-vs-participant-ui.md](./host-vs-participant-ui.md) 参照

## 4. 関連

- [components/event-status-badge.md](../components/event-status-badge.md) — Badge 単体仕様
- [blocks/cta-matrix.md](./cta-matrix.md) — CTA ラベルの状態別使い分け
- [blocks/host-vs-participant-ui.md](./host-vs-participant-ui.md) — 主催者 / 参加者で見せ方が変わる
- [blocks/feedback.md](./feedback.md) — Toast / 通知の文言
- [`Personas.md`](../../../Personas.md) P1 / P6 のジャーニー (status 変化時の感情曲線)
