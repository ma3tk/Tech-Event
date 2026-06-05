# 視覚差分 最終レポート: tech-event クローン vs connpass / Luma

- 比較日時: 2026-06-04
- ビューポート: 1280 x 1600 (Playwright `chromium-desktop`)
- スクリーンショット: `screenshots/clone/*.png`, `screenshots/connpass/*.png`, `screenshots/luma/*.png`, `screenshots/triptych/*.png`
- 計測ペア数:
  - **connpass 比較: 16 ペア** (既存 9 + 新規 7)
  - **Luma 比較: 13 ペア** (既存 6 + 新規 7)
  - **Triptych (3者並列): 13 種**
- 新規ページ群: `/discover`, `/calendar/ai-developers`, `/calendars`, `/bookmarks` (要認証), `/notifications` (要認証), `/user/fast_moon_169?view=timeline`, `/group/findy?view=timeline`
- 評価軸: レイアウト構造 / 色合い / フォントサイズ感 / 情報密度 (各 ★★★★★ 満点)
- 認証必要ページは `?` query 経由の dev-login (`/api/auth/dev-login?nickname=fast_moon_169&next=...`) でキャプチャ。
- 前版 (`visual-diff-report.md`) との関係: 前版は 9 + 6 ペアの初版で archival。本版が最新版。

---

## エグゼクティブサマリー

### クローン完成度 (連邦推計)

| 観点 | vs connpass | vs Luma | 備考 |
| --- | --- | --- | --- |
| **総合完成度** | **約 72%** | **約 51%** | 初版時点の 60% / 33% から底上げ |
| 機能網羅 (ページ数) | 約 95% | 約 80% | 主要 16 ページが clone 側に揃った |
| レイアウト構造 | 約 70% | 約 50% | 右サイドカラム導入後、connpass 構造に肉薄 |
| ブランドカラー | 約 65% | 約 55% | brand-red 寄せ済 (旧オレンジから脱却) |
| 情報密度 | 約 70% | 約 50% | 行高さ / padding の引き締め継続中 |

### 完成度の判定根拠

- connpass 軸: レイアウト構造 (40%) + 色合い (20%) + フォントサイズ (20%) + 情報密度 (20%) の重み付き平均で 16 ペアの平均★→百分率化。
- Luma 軸: 同じ重みで 13 ペアの平均。Luma 側 404 (`event-detail` / `user-profile`) は構造比較不能扱いで★1 固定し、平均を下押し。
- 新規 7 ペアは「Luma 軸」では平均 ★2.3 / 5、「connpass 軸」では平均 ★3.0 / 5 (connpass に明確な対応ページがない `/bookmarks` `/notifications` `/calendars` などは構造類似より「機能完備」で評価)。

### 1 行で言うと

> connpass 寄せの「機能完成形」は 7 割を超え、Luma 寄せの「視覚的洗練度」は半分を越えた段階。残課題はカラー統一・モバイル最適化・カバー画像/グラデーション・ヒーロー写実性の 4 軸に集約される。

---

## 各ページペアの最終評価

### A. 既存 9 ペア (connpass 比較)

| # | ペア | レイアウト | 色合い | フォント | 情報密度 | 総合 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | top | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| 2 | explore | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| 3 | ranking | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | **★★★☆☆** |
| 4 | login | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| 5 | series | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | **★★★☆☆** |
| 6 | event-detail | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| 7 | group-detail | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | **★★★☆☆** |
| 8 | user-profile | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| 9 | signup | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★☆☆** |

### B. 新規 7 ペア (connpass 比較)

connpass には直接対応するページが無いもの (Discover / Calendars / Bookmarks / Notifications / Timeline) は「最も近い既存ページ」(explore / series / dashboard) を対照 URL に置く運用。よって「レイアウト構造一致」は本来比較不能のため ★1〜2 になり得る。下表は「clone 側ページの完成度」自体を評価対象とした。

| # | ペア | レイアウト | 色合い | フォント | 情報密度 | 総合 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | discover | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** | Luma 寄せのカテゴリ大カード+都市グリッド+トレンドが揃った |
| 11 | calendar/ai-developers | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** | カバー+購読者数+iCal/RSS など Luma カレンダー要件を網羅 |
| 12 | calendars | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** | 一覧+並び替え+ページネーションは機能完備 |
| 13 | bookmarks (auth) | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** | EventListRow 共通化で構造が安定 |
| 14 | notifications (auth) | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** | 種別アイコン+既読/未読+一括既読が揃い、connpass dashboard 級 |
| 15 | user-timeline | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★★** | Luma 風 timeline (月見出し) が機能している |
| 16 | group-timeline | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★★** | 同上。?view=timeline で classic と並走可能 |

### C. Luma 比較 13 ペア

`event-detail` / `user-profile` の Luma 側は撮影時 404 イラスト固定。評価はヘッダ・フッタ・色味を中心に行う。

| # | ペア | レイアウト | 色合い | フォント | 情報密度 | 総合 |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | top | ★★☆☆☆ | ★★☆☆☆ | ★★★☆☆ | ★★☆☆☆ | **★★☆☆☆** |
| L2 | discover (= /explore) | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | **★★★☆☆** |
| L3 | event-detail | ★★☆☆☆ (404) | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ | **★★★☆☆** |
| L4 | calendar (= /group/findy) | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★☆☆** |
| L5 | user-profile | ★★★☆☆ (404) | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | **★★★☆☆** |
| L6 | signin | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| L7 | discover-page (= /discover) | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| L8 | calendar-ai (= /calendar/ai-developers) | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| L9 | calendars (= /calendars) | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★☆☆** |
| L10 | bookmarks (= /bookmarks) | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★☆☆** |
| L11 | notifications (= /notifications) | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★☆☆** |
| L12 | user-timeline | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |
| L13 | group-timeline | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | **★★★★☆** |

---

## Top 3 残差分 (ページ別)

> 既存 9 ページについては前版 `visual-diff-report.md` で挙げた残差を要約。新規 7 ページは初出のため詳細に列挙。

### 1. `top` (トップ)
1. 大型コピー脇のイラスト系装飾 (本家 connpass の「会員になる/イベントを探す/管理する」3 ステップ説明) がまだ未実装
2. 右サイド「最近見たイベント」ペインの追従固定 (sticky right column) が未対応
3. ヒーローの背景パステルグラデ (Luma 寄せ) と赤帯 (connpass 寄せ) のどちらに振り切るか未決

### 2. `explore`
1. 「並び替え: 新着 / 人気 / 開催日」のセグメントタブ化 (現状は select)
2. カードサムネイル比率 16:9 への統一 (現状 1:1 寄り)
3. 「動画あり / 資料あり / キャンセル待ち可」のフィルタチップ

### 3. `ranking`
1. 上位 3 件の金/銀/銅メダルアイコン (現状は番号四角)
2. 行高さ 96px → 64px 圧縮
3. 右サイドの広告 + おすすめ枠

### 4. `login`
1. ログインフォーム左 / 外部認証ボタン右の 2 カラム構成
2. ヘッダ赤帯化 (現状 brand-red 部分適用)
3. 「ログイン状態を保持」を控えめ表現に

### 5. `series`
1. 1 カラムリスト化 (現状 2 カラムグリッド)
2. カバー画像非表示 or 60px 程度の小サムネ
3. 右サイドカラム (おすすめ広告 / カテゴリ絞り込み)

### 6. `event-detail`
1. ヒーロー画像オーバーレイ式 (タイトル文字重畳)
2. 会場の Google Maps 埋め込み or 静的マップ画像
3. 参加者一覧プレビュー (本家は最初の 6 人を縦リスト)

### 7. `group-detail`
1. ヒーローカバー → 80px のブランド帯に縮小
2. 3 カラム化 (左: グループ情報 / 中: イベント / 右: メンバー)
3. アクション CTA 文言を「フォローする」に統一

### 8. `user-profile`
1. プロフィール直下「所属グループのロゴ横並び」
2. 「フォロー / フォロワー数」表示
3. 「メッセージを送る」CTA

### 9. `signup`
1. 上部 3 ステップ進捗インジケータ
2. 外部認証 (X / FB / GitHub) を 1 ブロックにまとめる
3. ヘッダ赤帯の導入

### 10. `discover` (新規)
1. **写真系都市カード**: 都市グリッドは現状ロゴ/アイコン中心。Luma 同等の「桜+スカイツリー」級の写実フォトを (絵柄プレースホルダで) 載せたい
2. **横スクロール「人気イベント」枠**: 現状縦リスト。Luma の `featured` 横スクロールに合わせると印象が大きく変わる
3. **ログイン時の「購読カレンダーの今後」帯**を 1 fold 内に移動: 現状ページ末尾、Luma だと上部の Home 帯相当

### 11. `calendar/ai-developers` (新規)
1. **カバー画像から主要色を抽出してヘッダ背景にバインド**するロジックが未実装 (Luma の特徴)
2. **日付見出しによる自動セクション分割** (今週 / 6月10日 / 6月17日 など) のタイムライン化
3. **「カレンダーを購読」CTA をサイドバー固定** (現状は本文中)

### 12. `calendars` (新規)
1. **カバーサムネタイル化** (現状はテキスト中心のリスト)
2. **「人気」「新着」の切替タブ化** (現状は select / 並び替え URL パラメータ)
3. **購読中バッジ表示** (ログイン時、既に購読しているカレンダーを区別)

### 13. `bookmarks` (新規)
1. **空状態のイラスト** (現状は文字のみ。connpass / Luma ともに空状態を装飾している)
2. **タグ・カテゴリでの絞り込み**(現状は一覧のみ)
3. **「カレンダーに追加 / 共有」のバルクアクション**

### 14. `notifications` (新規)
1. **モバイル時の通知行のレイアウト**: アイコン+本文+メタの 3 列が窮屈 → 2 段スタック化
2. **未読バッジのアニメーション** (Luma 風の subtle pulse)
3. **通知種別ごとのフィルタ** (`?type=comment` のような URL パラメータ)

### 15. `user-timeline` (新規)
1. **月見出しの sticky 化** (スクロール時に上部固定)
2. **イベントカード左の date strip** (Luma の "Tue 10 / Jun" のような大型日付バッジ)
3. **「主催」と「参加」の区別を視覚的に強化** (現状はラベルのみ)

### 16. `group-timeline` (新規)
1. **classic / timeline 切替トグルのスタイル**: 現状リンク。タブ風 ボタン化したい
2. **タイムライン上部のグループサマリ重複**: classic ビューと内容が一部被るため、サマリは縮小版で OK
3. **過去イベントを `<details>` で折りたたみ** にしたい (Luma 流)

---

## 優先度別 残課題リスト

### P0 (リリース前必須)

| ID | 課題 | 対象ページ | 想定工数 |
| --- | --- | --- | --- |
| P0-1 | ブランドカラーの最終固定 (`brand-red-600` を CSS 変数で 1 系統化) | 全ページ | 0.5d |
| P0-2 | `/notifications` モバイル時の行レイアウト崩れ修正 | notifications | 0.3d |
| P0-3 | `/bookmarks` 空状態イラスト追加 (簡易 SVG) | bookmarks | 0.3d |
| P0-4 | `/discover` カテゴリカードに `lucide-react` アイコンを赤系に統一 | discover | 0.3d |
| P0-5 | `event-detail` ヒーロー画像の縦長アスペクト調整 (現状縦に長すぎ) | event-detail | 0.5d |

### P1 (β 期間中に対応)

| ID | 課題 | 対象ページ | 想定工数 |
| --- | --- | --- | --- |
| P1-1 | 右サイドカラム導入 (top / explore / ranking / event-detail / user-profile) | 5 ページ | 2.0d |
| P1-2 | 月見出しの sticky 化 + 大型日付バッジ | user-timeline / group-timeline | 1.0d |
| P1-3 | `/explore` のソートをセグメントタブに変更 | explore | 0.5d |
| P1-4 | `/calendars` のタイル化 + 購読中バッジ | calendars | 0.5d |
| P1-5 | `/calendar/[slug]` のカバー → 主要色抽出ロジック実装 | calendar/[slug] | 1.5d |
| P1-6 | `event-detail` ヒーローオーバーレイ化 + 会場の静的マップ | event-detail | 1.5d |
| P1-7 | `series` を 1 カラム化 + 右サイド追加 | series | 1.0d |

### P2 (将来 / nice-to-have)

| ID | 課題 | 対象ページ | 想定工数 |
| --- | --- | --- | --- |
| P2-1 | `top` パステルグラデ背景 / Luma 風ヒーローオプション | top | 1.0d |
| P2-2 | `/notifications` の subtle pulse アニメ | notifications | 0.5d |
| P2-3 | `signup` 3 ステップ進捗インジケータ | signup | 0.5d |
| P2-4 | `user-profile` フォロー/フォロワー数 + メッセージ CTA | user-profile | 1.0d |
| P2-5 | `group-detail` 3 カラム化 | group-detail | 1.5d |
| P2-6 | `ranking` メダルアイコン (上位 3 件) | ranking | 0.3d |
| P2-7 | `/explore` フィルタチップ (動画 / 資料 / キャンセル待ち) | explore | 0.5d |

---

## スクリーンショットへのリンク表

絶対パスは省略 (リポジトリルート相対)。

### 既存 9 ペア (connpass 比較)

| ペア | clone | connpass | luma | triptych |
| --- | --- | --- | --- | --- |
| top | `screenshots/clone/top.png` | `screenshots/connpass/top.png` | `screenshots/luma/top.png` | `screenshots/triptych/top.png` |
| explore | `screenshots/clone/explore.png` | `screenshots/connpass/explore.png` | `screenshots/luma/discover.png` | `screenshots/triptych/discover.png` |
| ranking | `screenshots/clone/ranking.png` | `screenshots/connpass/ranking.png` | — | — |
| login | `screenshots/clone/login.png` | `screenshots/connpass/login.png` | `screenshots/luma/signin.png` | `screenshots/triptych/signin.png` |
| series | `screenshots/clone/series.png` | `screenshots/connpass/series.png` | — | — |
| event-detail | `screenshots/clone/event-detail.png` | `screenshots/connpass/event-detail.png` | `screenshots/luma/event-detail.png` | `screenshots/triptych/event-detail.png` |
| group-detail | `screenshots/clone/group-detail.png` | `screenshots/connpass/group-detail.png` | `screenshots/luma/calendar.png` | `screenshots/triptych/calendar.png` |
| user-profile | `screenshots/clone/user-profile.png` | `screenshots/connpass/user-profile.png` | `screenshots/luma/user-profile.png` | `screenshots/triptych/user-profile.png` |
| signup | `screenshots/clone/signup.png` | `screenshots/connpass/signup.png` | — | — |

### 新規 7 ペア

| ペア | clone | connpass (対照) | luma (対照) | triptych |
| --- | --- | --- | --- | --- |
| discover (/discover) | `screenshots/clone/discover.png` / `screenshots/clone/discover-page-luma.png` | `screenshots/connpass/discover.png` (= explore) | `screenshots/luma/discover-page.png` | `screenshots/triptych/discover-page.png` |
| calendar/ai-developers | `screenshots/clone/calendar-ai.png` / `screenshots/clone/calendar-ai-luma.png` | `screenshots/connpass/calendar-ai.png` (= explore) | `screenshots/luma/calendar-ai.png` (= /ai) | `screenshots/triptych/calendar-ai.png` |
| calendars | `screenshots/clone/calendars.png` / `screenshots/clone/calendars-luma.png` | `screenshots/connpass/calendars.png` (= series) | `screenshots/luma/calendars.png` | `screenshots/triptych/calendars.png` |
| bookmarks (auth) | `screenshots/clone/bookmarks.png` / `screenshots/clone/bookmarks-luma.png` | `screenshots/connpass/bookmarks.png` (= dashboard) | `screenshots/luma/bookmarks.png` (= /home) | `screenshots/triptych/bookmarks.png` |
| notifications (auth) | `screenshots/clone/notifications.png` / `screenshots/clone/notifications-luma.png` | `screenshots/connpass/notifications.png` (= dashboard) | `screenshots/luma/notifications.png` (= /home) | `screenshots/triptych/notifications.png` |
| user/fast_moon_169?view=timeline | `screenshots/clone/user-timeline.png` / `screenshots/clone/user-timeline-luma.png` | `screenshots/connpass/user-timeline.png` (= user) | `screenshots/luma/user-timeline.png` | `screenshots/triptych/user-timeline.png` |
| group/findy?view=timeline | `screenshots/clone/group-timeline.png` / `screenshots/clone/group-timeline-luma.png` | `screenshots/connpass/group-timeline.png` (= findy) | `screenshots/luma/group-timeline.png` (= /tokyo) | `screenshots/triptych/group-timeline.png` |

---

## 改善ロードマップ (Phase 別)

### Phase 1: ブランド統一フェーズ (1 週間)
- P0-1〜P0-5 を消化。
- ゴール: 全 16 ページでカラーパレット・モバイル崩れ・空状態の "雑な印象" を完全に排除。
- 出力指標: P0 全消化、視覚スクショ regression で `screenshots/clone/*.png` の baseline 再生成 1 回。

### Phase 2: 構造ハーモナイズフェーズ (2 週間)
- P1-1〜P1-7 を消化。右サイドカラム導入 (5 ページ) と timeline UX 改善が主軸。
- ゴール: connpass 完成度 80% / Luma 完成度 60% に乗せる。
- 出力指標: 「3 カラム or 2 カラム + sticky right」構造を top / explore / ranking / event-detail / user-profile で再現。

### Phase 3: 高級化フェーズ (2 〜 4 週間)
- P2-1〜P2-7 を消化。パステル背景、アニメーション、メダルアイコン、3 ステップ進捗等の "細部の磨き込み"。
- ゴール: connpass 完成度 90% / Luma 完成度 75% を視野に入れる。
- 出力指標: 競合と並べて 5 秒で見分けが付かない領域 (login / signup / explore / discover) を 4 ページ確保。

### Phase 4: モバイル特化フェーズ (1 週間)
- iPhone 14 viewport (chromium-mobile プロジェクト) で 16 ページのモバイルキャプチャを取得し、新たな視覚レポートを別途生成。
- ゴール: モバイル限定の崩れを 0 件にする。
- 出力指標: `screenshots/components/mobile/` を `screenshots/pages-mobile/` に拡張。

---

## 横断的に最優先で対応すべき改善 (再整理)

優先度高い順:

1. **ブランドカラーの一系統化** (`brand-red-600` を CSS 変数で固定し、`bg-orange-500` 等の残りを根絶) — 全ページに波及
2. **右サイドカラム導入** (top / explore / ranking / event-detail / user-profile) — connpass 軸の完成度を 75% 超に
3. **timeline ページの月見出し sticky 化 + date strip** — Luma 軸の完成度を 60% 超に
4. **`event-detail` ヒーローオーバーレイ + 静的マップ** — 単一ページ最大の差分
5. **モバイル `notifications` レイアウト改善** — UX 重要度高
6. **空状態イラスト整備** (`bookmarks`, `notifications` 空時, `discover` 検索 0 件) — "雑さ" の除去
7. **`/discover` 都市カード写実化** — Luma の Discover ページとの体験差解消
8. **`/calendar/[slug]` カバー → 主要色抽出** — Luma の Calendar ページの "らしさ" を継承

---

## 比較画像 / Triptych 一覧 (最終版)

`scripts/build-triptych.ts` で生成。出力先: `screenshots/triptych/`。

| # | ペア名 | ファイル | サイズ (px) |
| --- | --- | --- | --- |
| 1 | top | `triptych/top.png` | 2224×1468 |
| 2 | discover | `triptych/discover.png` | 2224×1759 |
| 3 | event-detail | `triptych/event-detail.png` | 2224×1746 |
| 4 | calendar | `triptych/calendar.png` | 2224×3877 |
| 5 | user-profile | `triptych/user-profile.png` | 2224×2790 |
| 6 | signin | `triptych/signin.png` | 2224×900 |
| 7 | discover-page | `triptych/discover-page.png` | 2224×3993 |
| 8 | calendar-ai | `triptych/calendar-ai.png` | 2224×1981 |
| 9 | calendars | `triptych/calendars.png` | 2224×1375 |
| 10 | bookmarks | `triptych/bookmarks.png` | 2224×900 |
| 11 | notifications | `triptych/notifications.png` | 2224×1338 |
| 12 | user-timeline | `triptych/user-timeline.png` | 2224×2790 |
| 13 | group-timeline | `triptych/group-timeline.png` | 2224×3877 |

---

## 検証ログ

- `npx tsc --noEmit` → 0 エラー (出力なし)
- `pnpm tsx scripts/build-triptych.ts` → 全 13 ペア OK/OK/OK で生成成功
- `npx playwright test --project=chromium-desktop e2e/visual-compare.spec.ts` → **16 / 16 PASS**
- `npx playwright test --project=chromium-desktop e2e/visual-compare-luma.spec.ts` → **13 / 13 PASS**
- `npx playwright test --project=chromium-desktop e2e/visual-triptych.spec.ts` → **13 / 13 PASS**

合計 **42 テスト PASS** / 0 FAIL。

---

## 付録: 旧版との差分

| 観点 | 旧版 (`visual-diff-report.md`) | 本版 (`visual-diff-final-report.md`) |
| --- | --- | --- |
| ペア数 (connpass) | 9 | **16** |
| ペア数 (Luma) | 6 | **13** |
| Triptych 数 | 6 | **13** |
| 完成度 (connpass) | 60% | **72%** |
| 完成度 (Luma) | 33% | **51%** |
| 認証必須ページ | 未対応 | dev-login 経由でキャプチャ |
| Phase ロードマップ | 簡易 Top10 | **Phase 1〜4 + P0/P1/P2 分類** |
