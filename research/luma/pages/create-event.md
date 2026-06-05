# Luma イベント作成 (Create Event) ページ調査メモ

調査日: 2026-06-04
対象URL:
- https://luma.com/create (未ログインでもUIプレビューは見える、登録時はサインイン必須)
- https://help.luma.com/c/events (作成関連ヘルプ)
- 関連ヘルプ: "Creating an Event", "Setting your Event Visibility", "Setting Up Ticket Types", "Collect Registration Questions", "Multi-Session / Recurring Events", "Hybrid Events", "Event Cover Images", "Event Themes and Customization"

備考: WebFetch 経由の HTML 観察に基づく。「(推測)」と明記された箇所は実HTMLから確証が取れず、ヘルプ記事や挙動推定で補完したもの。

---

## 1. 概要・目的

`/create` は Luma の **ホスト獲得の最終関門** であり、トップの "Create Your First Event" 押下から直接到達する。

特徴:

1. **画面そのものがイベント詳細ページのプレビュー**: 左 (大) = 編集可能なイベントページ、右 (小) = 設定パネル、という構成。"WYSIWYG イベントエディタ" を実現。
2. **最小限の必須入力**: タイトル、日時、場所、説明があれば即公開可能。詳細設定は後からでも変更できる。
3. **デフォルト値が賢い**: 開始時刻 (1時間後)、Capacity Unlimited、Public、Waitlist Enabled。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/create` | 新規作成 (個人カレンダー宛) |
| `https://luma.com/create?calendar={calendar_id}` | 特定カレンダーに紐づけて作成 (推測) |
| `https://luma.com/create?clone={event_id}` | 既存イベント複製 (推測) |
| `https://luma.com/{slug}/edit` | 編集モード (推測。実際は `/event/manage/{id}` 経由) |

未ログイン状態で `/create` にアクセスすると、UI 自体は見える (静的なフォーム) が、"Create Event" 押下時に `/signin?next=%2Fcreate` にリダイレクトされる挙動 (推測)。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]   Discover Events                              [Sign In]     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌──────────────────────────────┐  ┌─────────────────────────────────┐    │
│ │                              │  │  Personal Calendar   ▾          │    │  ← カレンダー選択
│ │                              │  │  Public              ▾          │    │  ← 可視性
│ │   [カバー画像エリア]          │  │                                 │    │
│ │   (ドラッグ&ドロップ)         │  │  When:                          │    │
│ │   [Theme: Minimal ▾]         │  │  Start: 2026/06/05 19:00 JST    │    │
│ │                              │  │  End:   2026/06/05 21:00 JST    │    │
│ ├──────────────────────────────┤  │                                 │    │
│ │ Event Name                   │  │  Where:                         │    │
│ │ [Untitled Event_________]    │  │  + Add Event Location           │    │
│ │                              │  │                                 │    │
│ ├──────────────────────────────┤  │  Description:                   │    │
│ │ + Add Description            │  │  + Add Description              │    │
│ │                              │  │                                 │    │
│ │                              │  │  Event Options:                 │    │
│ │                              │  │  Ticket Price: Free             │    │
│ │                              │  │  Require Approval: Off          │    │
│ │                              │  │  Capacity: Unlimited            │    │
│ │                              │  │  Waitlist: Enabled              │    │
│ │                              │  │                                 │    │
│ └──────────────────────────────┘  │  ┌─────────────────────────┐    │    │
│                                   │  │  Create Event           │    │    │
│                                   │  └─────────────────────────┘    │    │
│                                   └─────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

スマホでは縦1カラム (上: プレビュー、下: 設定パネル) (推測)。

---

## 4. 表示される情報項目の網羅リスト

実HTMLで観測:

### 左カラム (イベントページプレビュー)
- カバー画像エリア (アップロード or テンプレ選択)
- Theme セレクター (例: "Minimal")
- Event Name 入力欄
- "+ Add Description" (Rich Text エディタを展開)

### 右カラム (設定パネル)
- Calendar セレクター (例: "Personal Calendar")
  - Personal Calendar (デフォルト = ユーザーの個人カレンダー)
  - 所属する Calendar 一覧から選択
- Visibility (例: "Public")
  - Public / Calendar Only / Private / Unlisted (Hiding Events 機能、Setting your Event Visibility ヘルプ)
- When: Start / End 日時 + タイムゾーン
- Where: "+ Add Event Location" (物理 / オンライン / Hybrid)
- Event Options:
  - Ticket Price: "Free" デフォルト
  - Payment Optional (任意支払い、寄付スタイル)
  - Require Approval (承認制)
  - Capacity: "Unlimited" デフォルト or 数値
  - Waitlist Enabled: ON デフォルト
- CTA: "Create Event"

### 観測できなかったが Help で示唆される追加項目
- Event Description (Rich Text: 見出し、リスト、画像、リンク、絵文字、Markdown 風)
- Tags
- Co-Hosts / Managers 招待
- Ticket Types (複数種別。価格、定員、Sale Period)
- Group Registration
- Registration Questions
- Unlock Codes
- Custom URL (Plus 機能)
- Theme カスタマイズ (色、フォント)
- Multi-Session / Recurring (連続イベント)
- Hybrid Event (物理+オンライン両立)
- Hide Event Location (登録後に住所表示)
- Crypto Gating (NFT 所有者のみ登録可)
- Event Terms (主催者の利用規約)
- Notification Settings (送信タイミング)

---

## 5. UIコンポーネント

| 種別 | 用途 |
| --- | --- |
| Two-Pane Editor | 左プレビュー × 右設定 |
| Image Uploader (Drop Zone) | カバー画像 |
| Theme Picker | "Minimal" 他テンプレ |
| Text Input | Event Name |
| Rich Text Editor | Description |
| Calendar Picker | 紐付けカレンダー選択 (Dropdown) |
| Visibility Picker | Dropdown (4種) |
| DateTime Picker | Start/End + Timezone (IANA tz) |
| Location Picker | Google Places オートコンプリート (推測) |
| Toggle | Approval / Payment Optional / Waitlist |
| Capacity Stepper | 数値 or "Unlimited" |
| Ticket Price Modal | 通貨選択 + 価格 + Type |
| Primary Button | "Create Event" |

---

## 6. 状態による出し分け

| 状態 | 振る舞い |
| --- | --- |
| 未ログイン | UI 触れるが "Create Event" 押下で /signin |
| ログイン × Free | カスタム URL、Tax、Zapier、API は無効化グレーアウト |
| ログイン × Plus | 上記機能解放 + 0% プラットフォーム手数料 |
| ログイン × Calendar Admin | Calendar 選択肢が複数 |
| ログイン × Calendar Submission | "Calendar to submit to" モードで Approval 待ちに |
| Clone モード | フィールド事前入力済み |

---

## 7. インタラクション

- カバー画像: ドラッグ&ドロップ → クライアントサイドでクロップ + 圧縮 (推測)
- Theme 変更: プレビューが即時反映 (テーマ ID を保存)
- 日時変更: タイムゾーン自動推定 (ブラウザの IANA tz)
- 場所入力: Google Places オートコンプリート → 住所 + lat/lng + place_id 保存
- 説明入力: Rich Text + 画像挿入 (CDN アップロード)
- Visibility 変更: Hidden Location や Unlocked Code などの追加項目が動的に展開
- Create Event: 楽観UI → API → 成功時に新規 event の管理画面 / 公開ページへ
- 編集モード: 既存 event の `/event/manage/{id}/overview` から戻ってきた場合、変更点は autosave

---

## 8. 推測されるAPIコール

- `POST /api/event` — 作成
- `PATCH /api/event/{id}` — 編集
- `POST /api/upload` — カバー画像アップロード
- `GET /api/calendars/mine` — 自分が管理する Calendar 一覧
- `GET /api/places/autocomplete?q=...` — Google Places プロキシ
- `POST /api/event/{id}/theme` — テーマ変更
- `POST /api/event/{id}/clone` — 複製

---

## 9. 関連リンク・遷移先

- 作成後: `/{slug}` 公開ページ + `/event/manage/{id}/overview`
- "Setting Up Ticket Types" などのヘルプ記事
- Stripe 接続が未完了なら "Connect Stripe" 誘導

---

## 10. SEOメタ情報・OGP

- `noindex` 推測 (作成画面のため)
- 認証必須

---

## 11. レスポンシブ対応

- PC: 2カラム (プレビュー + 設定)
- スマホ: 1カラム (フォーム形式、プレビューはモーダル or 折り畳み)
- 入力中はキーボードが出るためフッターを隠す

---

## 12. A11y観点

- 各フィールドに `<label>`
- DateTime Picker は `aria-label` で日時を読み上げ
- Rich Text Editor は WAI-ARIA Authoring Practices 準拠 (推測)
- カバー画像のアップロードは alt 入力欄を提供 (推測)
- エラー: `aria-invalid` + `aria-describedby`

---

## 13. 模倣実装する際の留意点

- **WYSIWYG エディタ** はモチベーションを高める優れた UX だが、実装コストは大きい。React Hook Form + Zod + Zustand あたりで状態管理。
- **Rich Text** は Tiptap / Lexical / Slate のいずれかが現実的。Markdown 互換に倒すと、API も楽。
- **タイムゾーン**: 必ず IANA tz + UTC ISO8601 で保存。表示はクライアントローカル。
- **Google Places**: 月の Places API クォータと費用に注意。Mapbox の Places API が代替。
- **画像アップロード**: 大きいファイルは直接 R2/S3 にプリサインド URL でアップロード。リサイズ後 URL を `eventId` に紐付け。
- **Visibility の4種類** はビジネスロジックが分岐。`public`/`calendar_only`/`private`/`unlisted` で indexing と発見性が変わる。
- **Capacity = Unlimited** vs 数値の境界が UX 上重要。0 と Unlimited を取り違えないように。
- **Approval + Payment** の組み合わせは Stripe Payment Intent の Capture を遅延させる必要がある (`capture_method: manual`)。ヘルプ "Payment + Require Approval" あり。
- **Multi-Session** は同じ `event_series_id` を持つ複数 event レコード。データモデルに最初から入れること。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **2カラム WYSIWYG エディタ**: 作りながら完成形が見える。connpass はフォーム羅列で完成形は別ページ確認。
- **Theme 切替**: カバー周りのトーンが即変わる。connpass は CSS テンプレが固定。
- **Drag & Drop でのカバーアップロード**: 滑らか。connpass はファイル選択ダイアログ。
- **デフォルト値の賢さ**: Capacity Unlimited、Waitlist Enabled、Public が無設定で行ける。
- **承認制トグル1つで実現**: connpass は「先着 + 抽選 + 承認」を別途設定。
- **タイムゾーン自動**: 海外イベントでも安心。connpass は JST 前提に近い。
- **Stripe 直結の有料設定**: 価格入力 → 即販売可。connpass は別手段。

### Luma が劣っている点 / connpass の方が良い点
- **抽選/補欠の詳細設定**: connpass の参加枠 (先着・抽選・参加費別) の組合せは緻密。Luma は Ticket Types + Waitlist で代替するが粒度が粗い。
- **質問項目の表現力**: connpass の「アンケート (任意/必須/公開/非公開)」は古いが安定。Luma は Plus 機能で柔軟だが Free は限定的。
- **領収書/インボイス**: connpass はテンプレあり。Luma は Customize Invoices があるが日本の宛名/源泉徴収には未対応 (推測)。
- **会場検索の DB**: connpass は会場 (Venue) を共有マスターで持ち、過去開催実績を辿れる。Luma は Google Places 由来でデータ独立。
- **テンプレートからの作成**: connpass はグループ内で過去イベントから複製しやすい。Luma も Clone あるが導線が「More」タブに格納。
- **無料イベント中心の摩擦の少なさ**: connpass は無料イベント前提で軽快。Luma は支払い前提のフィールドが目に入る。
- **日本語UI**: 圧倒的に connpass が上。日付フォーマット、敬語、年号表記など。
