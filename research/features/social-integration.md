# SNS 連携・ハッシュタグ (social-integration.md)

connpass の SNS 連携機能 (X / Facebook / GitHub) と、ハッシュタグ機能、シェア機能、SNS 経由ログインなどの調査。

## 1. 機能の目的

connpass の SNS 連携には大きく 4 つの目的がある:

1. **アカウント連携 (OAuth)**: 新規登録の摩擦を下げる + SNS の友達ネットワークを connpass 内に持ち込む。
2. **告知のワンクリック化**: 「申し込みました」「イベント公開しました」をワンクリックで X (旧 Twitter) に投稿。
3. **プロフィール拡充**: SNS アイコン・自己紹介の取り込み、SNS アカウントへのリンク掲載。
4. **イベント当日のコミュニケーション**: イベントハッシュタグを共有して、参加者間の実況・感想を集約。

公式の説明:
> イベント参加や告知時に X へクリック一つで告知できるようになります。
> ハッシュタグを指定しておくと、簡単に履歴を追うことができます。

## 2. 利用シナリオ

| シナリオ | 連携先 | 動作 |
|----------|--------|------|
| ユーザー新規登録 | X / Facebook / GitHub | OAuth で initial profile を取得 (アバター・自己紹介) |
| 友達ネットワーク取り込み | Facebook / GitHub | フォロー関係を初期化、友達の参加イベントを dashboard に表示 |
| イベント申込時の告知 | X | 「#hoge イベント に申し込みました」と自動文面を生成して投稿画面へ |
| イベント公開時の告知 | X / Facebook | 主催者がワンクリックで X / Facebook に新着告知 |
| イベント当日の実況 | X (ハッシュタグ) | 参加者が #event_xxxx で投稿、イベントページに埋め込み表示 |
| プロフィール掲載 | X / GitHub | プロフィールページに SNS リンクを掲載、活動アピール |

## 3. 関連エンティティ・フィールド

```
User
├─ id
├─ identities: [SocialIdentity]
│   ├─ provider: enum {x, facebook, github}
│   ├─ provider_user_id: string
│   ├─ access_token: encrypted_string
│   ├─ refresh_token: encrypted_string (Facebook 等)
│   ├─ username: string (X handle、GitHub username)
│   └─ linked_at: datetime
├─ display_name, avatar_url (SNS から初期取得、上書き可)
└─ profile_visibility: enum {public, members_only}

Event
├─ hashtag: string (X 用、"#" は含まない正規化された文字列)
├─ x_share_url: computed (event URL + hashtag を組み立てて intent URL を返す)
└─ facebook_share_url: computed
```

## 4. UI 上の入口と画面

### 4.1 アカウント連携

- 「利用設定」ページの「他アカウントの連携」セクション
  - X / Facebook / GitHub の各行に「連携する」「連携を解除」ボタン
- 新規登録画面に「X で登録 / Facebook で登録 / GitHub で登録」ボタン

### 4.2 イベント作成画面

- 「ハッシュタグ」フィールド (任意、文字列)
- イベント公開後の「告知」モーダル: X 投稿ボタン、Facebook シェアボタン

### 4.3 イベント詳細画面

- 右サイドバーに X / Facebook シェアボタン
- 「X でつぶやく」: 申込ボタンの近くに配置 (申込時の自動投稿用)
- ハッシュタグが設定されている場合、ページ内に "#xxxx" として表示

### 4.4 プロフィール

- X / GitHub のアイコンとリンクが表示される
- Facebook は内部的に友達ネットワーク取り込み専用 (プロフィール公開は X / GitHub のみ)

## 5. 外部サービス連携 (API / 認可フロー)

### 5.1 X (Twitter)

- OAuth 2.0 (with PKCE) または OAuth 1.0a。
- 必要スコープ: `users.read`, `tweet.read`, `tweet.write` (申込時自動ポスト)、`offline.access`
- 投稿は **「Web Intent」 (`https://twitter.com/intent/tweet?text=...&url=...&hashtags=...`)** に遷移させる方式が主流。API 直接投稿はレート制限と API 有料化の影響を受ける。
- 2024 年以降の Twitter API 有料化以降、connpass は「Web Intent でユーザーのブラウザを経由する」方式を維持していると推測される。

### 5.2 Facebook

- Facebook Login (OAuth 2.0)
- 必要スコープ: `email`, `public_profile`, `user_friends` (友達ネットワーク同期用、ただし 2018 年以降は app review が必要)
- シェアは Facebook Sharer (`https://www.facebook.com/sharer/sharer.php?u=...`)

### 5.3 GitHub

- OAuth 2.0
- 必要スコープ: `read:user`, `user:email`
- 主にエンジニア向けの本人性証明として使われる (アカウント連携先がプロフィールに掲載される)。

### 5.4 Slack 連携

公式ドキュメント上、connpass には Slack 連携は **存在しない**。Slack への通知は、外部ユーザーが connpass API + Slack Incoming Webhook で自前構築する形 (Zenn 記事に Discord 通知例あり)。

## 6. ルール・制約

- 連携解除すると、その SNS からは新規ユーザーとしてしかログインできない (= 解除後に同じ SNS でログインを試みると新規登録扱い)。回避するにはメールアドレス + パスワードでログインして再連携する。
- SNS から取得したプロフィール項目 (氏名・自己紹介・アイコン) は、設定ページから上書き / 削除可能。
- アカウント削除時、SNS 連携は自動解除される。
- ハッシュタグは半角英数字推奨 (日本語ハッシュタグも可だが SNS 側の検索互換性は劣る)。
- イベントごとのハッシュタグは 1 つ (複数並列は UI 上想定されていない)。

## 7. 模倣実装時の代替案

### 7.1 X (Twitter) 連携の取扱い

X API は 2023 年以降の有料化により、**サーバー側からの自動投稿は事実上コスト的に不可能**。模倣実装の推奨方針:

- 投稿はすべて Web Intent URL (`https://twitter.com/intent/tweet`) でブラウザリダイレクト方式に統一。
- OAuth 連携は廃止し、X アカウントは「プロフィールに表示するためのハンドル入力」だけに簡素化する。
- ログイン手段としての X OAuth は廃止し、Google OAuth + GitHub OAuth に置き換える。

### 7.2 推奨する連携プロバイダ (新規実装の場合)

| プロバイダ | 用途 | 採用優先度 |
|------------|------|-------------|
| Google OAuth | ログイン (国内エンジニアの過半が利用) | 最優先 |
| GitHub OAuth | ログイン + エンジニア本人性証明 | 最優先 |
| Microsoft (Azure AD) | 法人ユーザー向け | 中 |
| Slack OAuth | コミュニティ Slack ワークスペースとの連携 | 中 |
| LINE Login | 一般層・地方コミュニティ向け | 任意 |
| Bluesky / Mastodon | X 離脱の受け皿 | 試験的に検討 |
| Facebook | 利用率低下中、優先度低 | 任意 |

### 7.3 Slack / Discord 連携 (新機能)

connpass にない機能として、コミュニティ Slack / Discord への通知 Webhook を提供する:

- グループ単位で `notifications_webhook_url` を保持
- イベント作成時・公開時・参加者上限到達時に Incoming Webhook へ payload 送信
- 既存の Zapier / Make.com 型ノーコード連携の代替

### 7.4 シェア文面のカスタマイズ

- ハッシュタグだけでなく、OGP メタタグ最適化 (og:image, og:title, twitter:card=summary_large_image) で SNS シェア時の見栄えを最大化。
- カードプレビュー画像はイベント画像 (660x345px、1.91:1) を流用。

### 7.5 タイムライン埋め込み

- イベントページ内に X のハッシュタグタイムラインを埋め込む (X の `timeline` widget は無料で利用可能)。
- 廃止リスクに備えて、自前で Twitter Search API → DB キャッシュは行わず、クライアント側 widget でのみ表示する設計が現実的。

### 7.6 認可フローのセキュリティ

- 全 OAuth プロバイダで PKCE 必須化、state パラメタによる CSRF 対策。
- access_token は AES-GCM で暗号化して DB に保存。
- 不要になったスコープ (tweet.write 等) は再認可フローを避けるため初期スコープを最小化。

---

参考: <https://help.connpass.com/basic/setting_sns>, <https://help.connpass.com/basic/user-profile>, <https://help.connpass.com/organizers/event-detail>
