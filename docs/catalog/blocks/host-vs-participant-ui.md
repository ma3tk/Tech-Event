---
status: stable
figma: TODO
storybook: libs/shared/ui-composite/src/event-card.stories.tsx
last_reviewed: 2026-06-06
personas: [P1, P2, P3, P4, P5, P6, P7, P8]
---

# 主催者 vs 参加者 UI (Host vs Participant UI)

> Design.md §1 + §6 + Personas.md (参加者 P1-P5 / 主催者 P6-P8) | 一次資料: [`Personas.md`](../../../Personas.md), [`docs/architecture.md`](../../architecture.md)

## 対象ペルソナ

- 主要 (主催者側): P6 小林一郎 (DevRel: dashboard で複数イベントを横断), P7 高橋真由美 (個人主催: 単発イベントの細部を制御), P8 渡辺浩之 (企業イベント: 権限分担と承認フロー)
- 主要 (参加者側): P1 山田美咲 (モバイル: 申込のみに集中), P2 田中慎太郎, P3 佐藤健太
- 副次: P4 鈴木大輔, P5 中村由美, P9 木村翔 (運営: 主催者と類似だが権限がさらに広い)

## 0. なぜ専用パターンか

tech-event の同じ画面 (例: `/event/[id]`) は **主催者と参加者で見せ方が大きく変わる**。これを ad-hoc に分岐すると、主催者/参加者間で UI が乖離して負債化する。本パターンは「同じドメインオブジェクト (Event / Group / Participant) を主催者と参加者で **どう見せ分けるか**」の正典。

## 1. 3 軸の見せ分け

| 軸 | 参加者 (P1-P5) | 主催者 (P6-P8) |
| --- | --- | --- |
| 情報密度 | 低 (申込判断に必要な最小情報) | 高 (KPI / participant list / queue) |
| 権限境界 | 自分の申込のみ操作可 | event 全体 + participant 全員 + 編集権 |
| dashboard | `/bookmarks` / `/profile` (自分のイベントのみ) | `/host/dashboard` (全イベント横断) |
| 通知優先度 | リマインダー > 変更通知 > マーケ | 申込変動 > 質問 > キャンセル |
| primary CTA | 申込 / 補欠 / 抽選 | 公開 / メッセージ送信 / CSV ダウンロード |
| メイン視点 | 「行けるかどうか」 | 「いま何が起きているか」 |

## 2. 画面別の見せ分けマトリクス

| 画面 | 参加者 (P1) | 主催者 (P7) |
| --- | --- | --- |
| `/event/[id]` | sticky CTA (申込) + 詳細 + 主催情報 + 場所 | dashboard panel (KPI 4 枚) + 申込者一覧 + 変更履歴 + メッセージ送信 |
| `/event/[id]/participants` | 参加者数のみ表示 (個別非表示) | 全員リスト + 検索 + CSV + メール一斉送信 |
| `/group/[slug]` | upcoming events リスト + 説明 + フォロー | upcoming + draft + analytics + member 管理 |
| `/event/[id]/edit` | (アクセス禁止 403) | フォーム + 変更履歴 + 公開設定 |
| Header の右側 | "申込済" badge + bell icon | "主催者モード" toggle + bell icon |

## 3. 同じコンポーネントを文脈で切り替える

### 3.1 EventCard

[EventCard](../components/event-card.md) は参加者向け / 主催者向けで以下を切り替える。

| 部位 | 参加者表示 | 主催者表示 |
| --- | --- | --- |
| 右上 badge | status (open / full / waitlist 等) | status + "編集" メニュー (dropdown) |
| footer | "参加申込" Button | "詳細を見る" + "参加者数 N/M" + analytics アイコン |
| ホバー時 | hover lift + shadow | hover lift + 編集 quick action 表示 |

実装は `<EventCard variant="participant">` / `<EventCard variant="host">` の **明示的 prop で分岐**。`useSession()` で自動判定しない (テスト容易性 + Storybook の host story を独立させる)。

### 3.2 EventListRow

[EventListRow](../components/event-list-row.md) も同様。主催者ビューでは "申込数 / 定員 / waitlist 数" の 3 数値を trailing に。

### 3.3 Header

[Header](../components/header.md) の右側メニューは主催者の場合 `?role=host` クエリで `/host/dashboard` シノニムを優先候補に表示。

## 4. 権限境界の UI 表現

| アクション | 参加者 | 主催者 | 失敗時の表示 |
| --- | --- | --- | --- |
| イベント編集 | 403 redirect | 編集フォーム | Toast "編集権限がありません" |
| 参加者一覧閲覧 | 数のみ | 全員 + 個人情報 | EmptyState "主催者のみ閲覧可" |
| 一斉メッセージ送信 | 不可 | 可 | Button そのものを非表示 (disabled より hide) |
| キャンセル | 自分の申込のみ | event 全体中止 | 確認 Dialog で意図確認 |

**原則**: 不可能なアクションは **disabled で見せず非表示** (P1 のような参加者には主催者用 UI を一切見せない)。例外: 「main 主催者のみ可」の機能を共催主催者にも見せる場合は disabled + Tooltip。

## 5. 情報密度の使い分け (Progressive Disclosure)

P1 山田は通勤電車片手操作、P6 小林は PC でダッシュボードを開いている。**同じ event 詳細画面でも密度が違う**。

- 参加者画面: 1 viewport (mobile 393×852) で「申込判断」が完結
- 主催者画面: 1 viewport (desktop 1440×900) で 4 KPI + 直近申込者 10 名 + 質問 3 件が見える
- 主催者でもモバイルアクセスはあるので **同じ dashboard を mobile では tab 分割** (KPI / 申込者 / メッセージ)

詳細: CLAUDE.md §1.4 「進歩的開示 (Progressive Disclosure)」、[`Personas.md`](../../../Personas.md) の P1 / P6 ジャーニー対比

## 6. アンチパターン

- 参加者画面に主催者用ボタンを disabled で表示する → 認知負荷増 + 「これは何?」 と質問が来る
- 主催者と参加者で **画面 URL を分けず** クエリだけで切り替える → ブックマーク / シェアで意図しないビューが表示
- 主催者 UI を参加者 UI のスーパーセットとして実装する → 「申込ボタンが主催者にも表示されて自分のイベントに自己申込できる」みたいなバグの温床
- 主催者専用 UI を mobile で raw に出す → P6/P7 は移動中も dashboard を見るので mobile 最適化必須

## 7. 関連

- [components/event-card.md](../components/event-card.md) — variant prop 仕様
- [components/event-list-row.md](../components/event-list-row.md) — 主催者ビュー
- [components/header.md](../components/header.md) — Role toggle
- [blocks/cta-matrix.md](./cta-matrix.md) — 主催者 CTA (公開 / 中止) は別系統
- [blocks/event-status-orchestration.md](./event-status-orchestration.md) — status はどちらでも共通
- [blocks/navigation.md](./navigation.md) — Header / nav の分岐
- [`Personas.md`](../../../Personas.md) P6 / P7 / P8 のジャーニー
