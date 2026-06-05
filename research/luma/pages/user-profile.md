# Luma ユーザープロフィール ページ調査メモ

調査日: 2026-06-04
対象URL:
- https://luma.com/user/test (Benjamin Nespoulous - 公開プロフィール)
- https://luma.com/user/{handle} 形式
- (参考) https://luma.com/u/... は 404 (`/u/` パスは使われていない)
- (参考) https://luma.com/user/usr-default は 404 (デフォルト fallback ハンドルは未公開 or 設定なし)

備考: WebFetch 経由の HTML 観察に基づく。「(推測)」と明記された箇所は実HTMLから確証が取れず、ヘルプ記事や挙動推定で補完したもの。プロフィール固有のテキスト・画像は引用に留め模倣しない。

---

## 1. 概要・目的

ユーザープロフィール (`/user/{handle}`) は、Luma 上の **ホスト・参加者・コミュニティビルダー** の公開アイデンティティページである。connpass の `/user/{username}/` と似た役割だが、Luma は **ホスト体験寄り** に最適化されている。

役割:

1. **公開プロフィール**: イベントの登録ページにある "Hosted by ..." リンクの遷移先。
2. **ホスト実績の可視化**: Hosted 数 / Attended 数 / Joined 日付の3指標。
3. **ソーシャル連携**: Instagram / X / YouTube / Discord / Web 等の外部リンクハブ。
4. **(推測) フォロー機能**: 参加者がホストをフォローして新着イベントの通知を受ける。

---

## 2. URL構造とパスパターン

| パターン | 説明 |
| --- | --- |
| `https://luma.com/user/{handle}` | プロフィール本体。handle は `@xxx` の文字列部分 |
| `https://luma.com/user/{handle}/hosting` | (推測) Hosting タブ。実装はクエリ or タブ |
| `https://luma.com/user/{handle}/attending` | (推測) Attended タブ |
| `https://luma.com/user/{handle}/about` | (推測) 詳細プロフィール |
| `https://luma.com/u/...` | 404。短縮形は提供されていない |

handle のバリデーション: 英数 + ハイフン + アンダースコア (推測)。短すぎる handle (3文字未満) や予約語 (`admin`, `signin`, `create` 等) は不可と推測。

---

## 3. ページレイアウト (ワイヤーフレーム的記述)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Luma logo]   Discover Events                              [Sign In]     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              ┌───────────┐                                               │
│              │           │     Benjamin Nespoulous                       │
│              │  Avatar   │     @test                                     │
│              │  (112px)  │     Joined August 2024                        │
│              └───────────┘     [IG] [YouTube]                            │
│                                                                          │
│              ┌─────────┐  ┌─────────┐                                    │
│              │ 1       │  │ 0       │                                    │
│              │ Hosted  │  │ Attended│                                    │
│              └─────────┘  └─────────┘                                    │
│                                                                          │
│              [ Follow ] (推測)   [ Contact ] (推測)                       │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────      │
│   [Hosting]   Attending   Past                                           │
│   ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                               │
│   │EventCard │  │EventCard │  │EventCard │                               │
│   └──────────┘  └──────────┘  └──────────┘                               │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Footer                                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 表示される情報項目の網羅リスト

実HTMLで観測:

- アバター (112×112 推測、WebP/自動最適化、背景白)
- 表示名 (例: "Benjamin Nespoulous")
- ハンドル (例: "@test")
- Joined ラベル (例: "Joined August 2024")
- "Hosted" 件数 (例: 1)
- "Attended" 件数 (例: 0)
- ソーシャルリンク (Instagram, YouTube など、ユーザーが設定した分のみ)

観測されなかったが Luma の他機能から存在が推測される要素:

- Bio / 自己紹介テキスト
- 所在地 (City)
- Web サイト URL
- X / TikTok / LinkedIn / Discord 等の追加ソーシャル
- Hosting タブのイベントカード一覧 (Upcoming + Past)
- Attended タブのイベント一覧 (ユーザーが公開設定の場合のみ)
- 主催 Calendar 一覧
- Follow / Unfollow ボタン
- "Contact" / "Message" (DM 機能、推測)
- "Report user" (推測、ヘルプの "Blocking Users" 機能あり)
- "Edit Profile" (自分自身を見ている時)

---

## 5. UIコンポーネント

- **Avatar (Large)**: 正方形 (推測 round-mask 適用) のアバター
- **NameBlock**: 表示名 + handle + Joined
- **StatCard**: 数字 + ラベル ("Hosted"/"Attended") の2列
- **SocialIconRow**: 接続済 SNS のアイコン
- **FollowButton**: ピル形 (推測。普通のサイトと同じ)
- **TabBar**: Hosting / Attending / Past (推測)
- **EventCardGrid**: 同サイトの汎用カード
- **EmptyState**: "{User} hasn't hosted any events yet."

---

## 6. 状態による出し分け

| 状態 | 表示 |
| --- | --- |
| 自分自身 | "Edit Profile" ボタン、Hosting タブにドラフトも含む (推測) |
| 他人 (公開) | Follow / Contact / Report ボタン |
| 他人 (非公開) | 一部情報のみ。"This profile is private" (推測、Luma にプライバシー設定があれば) |
| Blocked | "You have blocked this user" / お互い非表示 (Blocking Users 機能) |
| 未ログイン | Follow 押下 → サインインへ |
| 0 Events | EmptyState 表示 |

---

## 7. インタラクション

- Follow / Unfollow: 楽観UI + API
- Contact: モーダルでメッセージ送信 (推測。ホスト宛のメール経由かもしれない)
- ソーシャルアイコン: 新しいタブで外部リンク
- イベントカード: クリックで `/{event-slug}` へ
- Edit Profile (自分): モーダル / 別ページ `/user/settings` (推測)
- Report user: モーダル + 理由選択 (Blocking Users 機能あり)

---

## 8. 推測されるAPIコール

- `GET /api/user/{handle}` — プロフィール情報
- `GET /api/user/{handle}/events?type=hosting&status=upcoming`
- `GET /api/user/{handle}/events?type=attending&status=past`
- `POST /api/user/{handle}/follow`
- `DELETE /api/user/{handle}/follow`
- `POST /api/user/{handle}/contact` — メッセージ送信
- `POST /api/user/{handle}/report`
- `POST /api/user/{handle}/block`
- `PATCH /api/user/me` — 自分のプロフィール更新

---

## 9. 関連リンク・遷移先

- 各イベント詳細
- 主催 Calendar
- 外部 SNS

---

## 10. SEOメタ情報・OGP

- `<title>`: "{Display Name} (@{handle}) · Luma"
- description: Bio または "Events hosted and attended by {name}"
- OGP image: アバター + 名前のジェネレート画像 (1200×630、vercel/og 等で動的生成、推測)
- `schema.org/Person` (推測)
- canonical: `https://luma.com/user/{handle}` (大文字小文字の正規化は要確認)

---

## 11. レスポンシブ対応

- アバターとステーティックがスマホで中央寄せ
- ソーシャルアイコン行は折り返し
- イベントカードはスマホで1〜2列

---

## 12. A11y観点

- H1 = 表示名 (handle は副情報)
- ソーシャルリンクは `aria-label="Instagram profile of {Name}"`
- Stat の数字+ラベルは `aria-label="Hosted 1 event"` のような累積表記
- Follow ボタンは `aria-pressed`

---

## 13. 模倣実装する際の留意点

- **handle と display name の分離**: handle は URL に使う ID、display name は人間可読の名前。両者を変更可能にする (handle 変更時の旧URLリダイレクト処理が必要)。
- **公開/非公開設定**: connpass よりも公開度を細かく制御したい場合は "Attended events を公開する/しない" のトグルを設ける。Luma も "Managing Your Profile" ヘルプ記事で言及あり。
- **ホストと参加者の動線**: 同じプロフィールで両方を表現するため、Hosting タブを目立たせ、Attended は控えめにする。
- **アバターのデフォルト**: 未設定時のジェネレート (頭文字+ランダムカラー) を最初から用意。
- **handle 予約語**: `discover`, `create`, `home`, `signin`, `pricing`, `user`, ... を予約語化。

---

## 14. connpass との違い / Luma が優れている点・劣っている点

### Luma が優れている点
- **handle のグローバル一意性**: `/user/{handle}` 形式が短くシェアしやすい。
- **OGP のジェネレート**: プロフィール用 OGP 画像を動的生成し、SNS で映える (推測)。
- **ホストの統計が前面**: "Hosted N" が真っ先に見える → ホストとしてのブランディング向き。
- **ソーシャルリンクの集約**: Linktree 的に使える。connpass はリンク欄が地味。
- **Block / Report**: ハラスメント対策が標準装備 (Blocking Users 機能)。

### Luma が劣っている点 / connpass の方が良い点
- **所属・職種の表示**: connpass は所属企業・職種・興味分野などをプロフィールに書ける。Luma はそのフィールドが限定的 (Bio に書く程度)。
- **参加履歴の濃さ**: connpass は「過去参加イベント」のリストが豊富。Luma は Attended 数のみ表示 (詳細は本人設定次第)。
- **アクティビティ**: connpass は「最近参加した X さん」など足跡 UI がある。Luma はそうしたソーシャル要素が薄い。
- **コメント/反応**: connpass のフィードバックを公開可能。Luma は Feedback はホストのみ可視 (Collect Feedback 機能)。
- **採用文脈**: connpass のプロフィールはエンジニア採用に活用される。Luma の海外コミュニティ的なプロフィールは日本の採用文化と相性が悪い。
- **連絡先 (公式メアド) の連携**: connpass は問い合わせフォームが分かりやすい。Luma の Contact 機能は探しづらい (推測)。
