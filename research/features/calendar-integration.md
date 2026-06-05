# カレンダー連携 (calendar-integration.md)

connpass の Google カレンダー / iCal (iCalendar) 形式によるカレンダー連携機能と、外部カレンダー一般への自動同期についての調査。

## 1. 機能の目的

connpass のカレンダー連携は、**「参加予定のイベントを、ユーザーが普段使うカレンダーアプリに自動表示する」** ことを目的とする。

- 申込済みイベントを Google カレンダーや macOS / iOS のカレンダーに表示してダブルブッキングを防ぐ
- 当日のリマインダ (会場アクセス情報・URL) をカレンダーアプリの通知機能経由で受け取る
- 個別イベントを単発でダウンロードする `.ics` ファイル提供と、「参加予定すべて」を購読する iCal URL の 2 系統を提供

公式の説明:
> connpass は参加予定のイベントを一般的なカレンダーサービスに自動表示する機能を提供しています。
> 連携後に行った参加登録やキャンセルは、カレンダーに反映されるまでに時間がかかる場合があります。

## 2. 利用シナリオ

| シナリオ | 機能 |
|----------|------|
| 仕事用カレンダー (Google) で勉強会予定を一元管理 | Google カレンダー連携 (OAuth) で「connpass 参加イベント」カレンダーを追加 |
| macOS / iPhone のカレンダーアプリで管理 | iCal URL を「照会」として登録 |
| Outlook / Yahoo! カレンダーで管理 | iCal URL を購読として登録 (公式ドキュメントには明記なしだが iCal 互換) |
| 単発の予定としてダウンロード | イベント詳細画面の「カレンダーに追加」ボタンで `.ics` をダウンロード |
| キャンセル時に予定を自動削除 | iCal 同期により非同期で反映 (即時ではない) |

## 3. 関連エンティティ・フィールド

```
User
├─ id
├─ ical_token: string (推測不能なランダムトークン、URL に埋め込む)
├─ google_calendar_oauth:
│   ├─ access_token: encrypted_string
│   ├─ refresh_token: encrypted_string
│   ├─ calendar_id: string ("connpass 参加イベント" カレンダーの ID)
│   └─ scope: "https://www.googleapis.com/auth/calendar.events"
└─ ical_url: computed (= "https://connpass.com/users/<id>/cal/<ical_token>.ics")

Application (参加情報) → iCalendar VEVENT
├─ UID: event_<event_id>@connpass.com
├─ SUMMARY: event.title
├─ DTSTART: event.starts_at (with TZID=Asia/Tokyo)
├─ DTEND: event.ends_at
├─ LOCATION: event.venue + address
├─ URL: event.detail_url
├─ DESCRIPTION: event description (text only)
├─ STATUS: CONFIRMED / CANCELLED
└─ LAST-MODIFIED: updated_at
```

## 4. UI 上の入口と画面

### 4.1 設定画面

- 「利用設定」ページ → 「カレンダー連携」セクション
  - 「Google カレンダーと連携する」ボタン (OAuth へ遷移)
  - 「iCalendar 形式」セクションに購読 URL を表示 + コピーボタン
  - URL を再生成するボタン (旧 URL を無効化)

### 4.2 イベント詳細画面

- 「カレンダーに追加」ボタン (個別 `.ics` ダウンロード)
- Google カレンダー / Outlook へワンクリック追加するリンク

### 4.3 確認モーダル

- Google 連携時、OAuth スコープの説明と同意画面
- 「connpass 参加イベント」という名前のカレンダーが自動作成される旨を明示

## 5. 外部サービス連携 (API / 認可フロー)

### 5.1 Google カレンダー

- OAuth 2.0 with PKCE。
- 必要スコープ: `https://www.googleapis.com/auth/calendar` または `calendar.events`。
- 連携時に専用カレンダー (例: "connpass 参加イベント") を作成 (`POST /calendars`)。
- 参加申込・キャンセルのたびに `Events: insert / update / delete` を呼び出して同期。
- リフレッシュトークンを永続化し、定期同期 (cron + バッチ) でも実行。

### 5.2 iCalendar (iCal) URL

- ユーザーごとに推測不能なトークン付き URL を発行: `https://connpass.com/users/<id>/cal/<token>.ics`
- HTTPS で取得可能、認証なし (URL 自体が capability token)。
- RFC 5545 準拠の VCALENDAR 形式で参加予定の VEVENT を返す。
- カレンダーアプリ側は数時間ごとに polling (Google: 24 時間以上、Apple: 1 時間 〜)。

### 5.3 単発 `.ics` ダウンロード

- イベント詳細画面の「カレンダーに追加」ボタン
- `Content-Disposition: attachment; filename=event_<id>.ics` で配信

### 5.4 サポートされるカレンダーアプリ

公式に明記されているのは Google カレンダー / iCal。実態として iCalendar 互換の以下も購読可能:

- macOS Calendar / iOS Calendar (Apple)
- Outlook / Outlook 365
- Yahoo! カレンダー
- Thunderbird Lightning
- Fastmail / Proton Calendar

## 6. ルール・制約

- iCal 連携は **ポーリングベース** のため、申込・キャンセルが即座にカレンダーに反映されない (公式注記)。
- iCal URL は再生成可能。流出時のリスク軽減のため URL ローテーション機能が必須。
- 参加予定 (confirmed のみ) を返すか、補欠も含めるかは要件次第 (connpass は参加確定分のみを推測)。
- タイムゾーンは `Asia/Tokyo` 固定。海外イベントは UTC オフセット込みで出力。
- Google カレンダー連携は OAuth の有効期限 / 取消で同期が止まる。エラー検知 → ユーザーへの再認可促し通知が必要。

## 7. 模倣実装時の代替案

### 7.1 OAuth 連携の最小構成

Google Calendar API を使うのが最も汎用的だが、OAuth 維持コストが高い。最低限 iCal URL を提供すれば 9 割の実用ユースケースを満たす。優先順位:

| 優先度 | 機能 | 実装難度 |
|--------|------|-----------|
| 必須 | 個別 `.ics` ダウンロード | 低 |
| 必須 | iCal 購読 URL (トークン付き) | 中 |
| 推奨 | Google Calendar OAuth 連携 | 高 |
| 任意 | Outlook (Microsoft Graph) | 高 |
| 任意 | Webhook で push 通知 (Apple は非対応) | 高 |

### 7.2 iCal 生成ライブラリ

- Node.js: `ics` パッケージ、または `node-ical` で生成。
- Ruby: `icalendar` gem。
- Python: `icalendar`。
- 重要なフィールド: `UID`, `DTSTAMP`, `LAST-MODIFIED`, `STATUS`, `SEQUENCE` (更新時にインクリメント)。`SEQUENCE` を更新しないとカレンダーアプリ側で変更が反映されない。

### 7.3 セキュリティ

- iCal URL に含めるトークンは少なくとも 32 文字以上のランダム文字列 (CSPRNG 生成)。
- URL を「公開しないでください」と UI で明示。Re-roll 機能で旧 URL を即時無効化。
- 個人情報 (会場住所・参加者向け非公開情報) を `DESCRIPTION` に含めるかは公開/参加者枠で出し分け。

### 7.4 Google Calendar 連携の代替

OAuth 維持コストを避ける場合、「Google カレンダーに iCal URL を購読として登録する」方法を案内すれば代替可能。ただし Google は **iCal URL のポーリング間隔が 24h 程度** と長く、即時反映は望めない。即時性を重視するなら Google Calendar API の push 通知 (Channel) を使う必要がある。

### 7.5 通知統合

- カレンダーアプリ側のリマインダ機能と重複しないよう、connpass からの 24h 前メール通知と連携。
- iCal の `VALARM` を組み込んで、カレンダー側で 1 時間前のポップアップ通知を強制することもできる。

### 7.6 タイムゾーン処理

- VTIMEZONE ブロックを正しく生成しないと、Outlook 等で時間がずれる。
- ライブラリ任せにせず、`TZID=Asia/Tokyo` を明示し、VTIMEZONE の DTSTART/RRULE を含める。

---

参考: <https://help.connpass.com/basic/setting_calendar>, <https://help.connpass.com/participants/event-join>
