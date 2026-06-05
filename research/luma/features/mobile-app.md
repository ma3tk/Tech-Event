# Luma Mobile App (iOS / Android)

## 概要

Luma のモバイルアプリは「**イベント前 / 当日 / 後の体験をスマホ最適化**」する補完的存在。Web 版に届かない Push 通知 / Wallet / オフラインチェックインを担当する。`lu.ma/app` で QR を読むかストア検索で取得。

## 入手経路

- iOS: App Store ("Luma — Delightful events")
- Android: Google Play
- 共通: `lu.ma/app` を訪れると OS 判別で適切なストアにリダイレクト
- QR: PC 版 luma.com に QR が表示 (デスクトップ → モバイル誘導)

## 主な機能

| 機能 | ユーザー視点 | ホスト視点 |
| --- | --- | --- |
| Discover | 近隣イベント発見 | — |
| Event details | 詳細閲覧 + ワンタップ Register | プレビュー |
| Tickets | 自分のチケット = QR コード | — |
| Calendar | 今後の予定一覧 | — |
| Notifications | リマインダー / 新着 push | 新規登録 push |
| Check-in scanner | — | QR スキャナでゲスト受付 |
| Blast | — | 一斉メッセ送信 |
| Insights | — | 簡易ダッシュボード |
| Profile | プロフ編集 | — |

## ゲスト (参加者) UX

1. アプリ起動 → "Up Next" でフォロー中の Calendar 新着が並ぶ
2. イベント詳細 → ワンタップ Register
3. チケットは My Tickets タブに自動追加 (QR コード)
4. 開催 24 時間前 / 1 時間前にローカル通知
5. 会場で QR 提示 → ホストがアプリでスキャン → "You're in!"
6. イベント後 Feedback push が届く → タップで NPS 回答

## ホスト UX

- ホーム画面で「Upcoming events 自分主催」が並ぶ
- Guest list を検索 (オフラインキャッシュあり)
- QR スキャナ起動 → カメラで即チェックイン
- 急な変更 → "Send Blast" でその場で全員に通知
- 新規登録があるたびに push 通知 (オフ可)

## 通知タイプ

| 種類 | デフォルト | 役割 |
| --- | --- | --- |
| New event from followed calendar | ON | 購読リレーション維持 |
| Event reminder (24h, 1h) | ON | no-show 防止 |
| RSVP confirmed | ON | 登録完了確認 |
| Friend joined an event | OPT | ソーシャル発見 |
| Host: new registration | ON (host のみ) | 集客モニタリング |
| Host: waitlist movement | ON | キャンセル対応 |
| Feedback request | ON (post-event) | PDCA |

## Wallet 統合

- Apple Wallet: チケットを .pkpass で配信、ロック画面通知 (位置近接 + 時間)
- Google Wallet: Android で .googlepay-pass、Now / Discover への表示
- 物理会場到着で自動でチケットがロック画面に浮上

## オフラインモード

- 直近の自分の予定 / チケット QR はオフライン閲覧可
- ホストのゲストリストも事前同期で会場 Wi-Fi なしでチェックイン可能
- 差分は同期回復時にバックアップ送信

## カレンダー同期

- iOS / Android の OS カレンダーと統合 (ICS 自動追加)
- "Going" イベントは登録と同時にカレンダーアプリに表示
- Update / Cancel も自動反映

## QR チェックイン (ホスト)

- カメラ起動 → 連続スキャンモード
- 1 秒に 3 枚程度の高速スキャン
- スキャン後はバイブ + サウンド + "✓ Checked in: Alice"
- 重複スキャンは "Already checked in" 警告
- オフライン時もキューに溜めて後送信

## A11y / UX

- VoiceOver / TalkBack 完全対応
- Dynamic Type (iOS) でフォント拡大対応
- Push 通知タップで該当画面へ deeplink
- Safe area / notch / Dynamic Island 対応

## React Native? Native?

- 公式情報なし。観察上は React Native + 一部 Native module (カメラ / Wallet) の構成と思われる
- アプリサイズ ~30MB
- 起動時間 < 1 秒

## API との対応

アプリは公開 API ではなく内部 API (内部 GraphQL or REST) を使用。Public API (`api.lu.ma/public/v1`) はホスト・統合用で、アプリと別系統。

## 真似すべきポイント

1. **PC で QR → モバイルアプリインストール** の導線が滑らか
2. **チケット = OS Wallet パス** で「アプリ開かなくても会場で出せる」状態に
3. **オフライン QR スキャン** は当日のネットワーク事故耐性を上げる
4. **ホストアプリ機能を 1 アプリに統合** — 参加者と主催者が同じアプリを使う設計
5. **Push 通知 7 種類を明確に分類** — ユーザーが自分でオン/オフ選べる

## 限界

- Web 版に比べて全機能が出揃っていない (テーマ編集 / Insights 詳細 etc は Web のみ)
- 主にイベント直前 / 当日体験に最適化されている
- 大規模 Door アプリは iPad 専用版が別系統

## connpass との対比

connpass にはモバイルアプリがなく、Web (PWA 風) のみ。Luma はネイティブ Push と OS Wallet 統合で「**当日体験の品質**」を圧倒している。これがリアル会場のテックミートアップに普及した一因。
