# 画像アップロード (image-upload.md)

connpass のイベント画像、グループ画像、プロフィールアバターのアップロード機能と、推奨サイズ / リサイズ / OGP 連携についての調査。

## 1. 機能の目的

connpass の画像アップロード機能は、**イベント・グループ・ユーザーの視覚的アイデンティティを確立し、一覧画面 / SNS シェア時の発見性を高める** ことを目的とする。

- **イベント画像** (アイキャッチ): 一覧画面のサムネイル、SNS シェア時の OGP 画像
- **グループ画像** (カバー / サムネイル): グループブランディング、グループページ表示
- **プロフィール画像** (アバター): 個人活動の認知、フォロー機能との連動

公式の説明:
> PC 版 connpass ではイベント画像は、横 660pixel × 縦 270pixel サイズで表示されます。
> 1.91:1 の比率にすることで、画像全体を表示させることができます。

## 2. 利用シナリオ

| シナリオ | 画像種別 | サイズ要件 |
|----------|----------|-------------|
| イベント告知をかっこよく見せたい | イベント画像 | 660 × 345px (1.91:1) |
| SNS シェア時のサムネを最適化 | イベント画像 | 同上 (X / Facebook カード対応) |
| グループブランドを統一 | グループカバー / サムネ | グループページの上部に表示 |
| 個人を識別したい | プロフィール画像 | 正方形 (推奨 200 × 200px 以上) |
| イベント説明文に画像を埋め込み | Markdown 内の `<img>` タグ | 外部 URL のみ (connpass 上にホストできない) |

## 3. 関連エンティティ・フィールド

```
EventImage
├─ event_id
├─ original_url: string (S3 / CDN)
├─ pc_url: 660px width 版
├─ mobile_url: 200px width 版 (mobile detail)
├─ thumbnail_url: 75px × 75px (一覧表示用)
├─ ogp_url: 1200 × 630px 推奨 (SNS シェア用)
├─ file_size_bytes
├─ original_width, original_height
└─ uploaded_at

GroupImage
├─ group_id
├─ cover_url
├─ thumbnail_url
└─ background_color: string (グループページのテーマカラー)

UserAvatar
├─ user_id
├─ original_url
├─ thumb_64_url, thumb_128_url, thumb_256_url
└─ uploaded_at
```

## 4. UI 上の入口と画面

### 4.1 イベント画像

- イベント作成 / 編集画面の「イベント画像」セクション
- ファイル選択ダイアログ → プレビュー → 保存
- 推奨サイズが UI 上にツールチップで明示 (660 × 345px、1.91:1)

### 4.2 グループ画像

- グループ作成 / 編集画面の「カバー画像」「サムネイル画像」「背景色」セクション
- 背景色はカラーピッカーで指定 (グループ内のイベントカードのスタイリングに影響)

### 4.3 プロフィール画像

- 利用設定の「プロフィール」セクション
- SNS 連携時に X / Facebook / GitHub のアバターが初期値として取り込まれる
- 手動アップロードで上書き可能

### 4.4 説明文内の画像

- イベント / グループ説明文の Markdown に `![alt](url)` または `<img src="url">` を記述
- **connpass 上に画像をホストすることはできず**、外部 URL (imgur / GitHub / 自前ストレージ) を貼る必要あり

## 5. 外部サービス連携

- **OGP (Open Graph Protocol)**: イベントページの `<meta property="og:image">` にイベント画像 URL を設定。SNS シェア時にカード形式で表示。
- **Twitter Card**: `twitter:card=summary_large_image` を出力し、X 上で大きな画像カードとして表示。
- **CDN**: 推測では Akamai / CloudFront / 自前 nginx 等で配信。画像 URL に WebP 自動変換やリサイズパラメータを付与している可能性が高い。
- **X のサムネ反映遅延**: イベント画像を差し替えても X 側のカードキャッシュにより反映が遅れる旨が FAQ に明記されている。

## 6. ルール・制約

### 6.1 イベント画像

- PC 表示: 横 660px 縦 270px (公式表記。実際は 660 × 345px の 1.91:1 が SNS 最適)
- モバイル詳細: 横 200px × 縦 200px にリサイズ → サムネ表示時は 75 × 75px
- 推奨アスペクト比 1.91:1 (SNS シェア時のクロップ最適化)
- ファイルサイズ上限 1MB (公式表記)
- 上限超過時は横 660px に縮小、その上で上下が中央クロップされる
- 対応フォーマット: JPEG / PNG / GIF (アニメーション対応は不確実)

### 6.2 説明文内画像

- connpass 自体は画像ホスティングしない (説明文は外部 URL のみ)
- HTML の `<img>` タグは Markdown 同等に許可される (リサイズ用)

### 6.3 グループ画像

- カバー画像 / サムネイル画像をそれぞれ別個にアップロード
- 背景色はリンク先イベントの装飾にも反映される

## 7. 模倣実装時の代替案

### 7.1 アップロードパイプライン

```
[ブラウザ] → presigned URL → [S3] → [Lambda / Cloudflare Worker] → リサイズ複数バリアント生成 → [CloudFront / Cloudflare CDN]
```

- presigned PUT URL でブラウザ → S3 直接アップロード (サーバを経由しない)
- Lambda@Edge / Image Resizer (Sharp / libvips) で複数サイズを自動生成
- WebP / AVIF への自動変換でファイルサイズ削減

### 7.2 推奨サイズ (新規実装)

| 用途 | 推奨サイズ | フォーマット |
|------|------------|---------------|
| イベント OGP / アイキャッチ | 1200 × 630px (1.91:1) | JPEG / PNG / WebP |
| イベント一覧サムネ | 400 × 210px | WebP |
| グループカバー | 1500 × 500px | JPEG / WebP |
| グループサムネ (正方形) | 400 × 400px | JPEG / WebP |
| プロフィールアバター | 400 × 400px | JPEG / PNG / WebP |
| 説明文内画像 | 自由 (max 2MB) | 任意 |

### 7.3 ファイル上限の見直し

- 1MB は WebP / AVIF を活用すれば十分だが、JPEG / PNG だけ受け付ける場合は 5MB に拡張するのが現代的
- アップロード時にクライアントサイド圧縮 (browser-image-compression ライブラリ) を組み込む

### 7.4 説明文内画像のホスティング

connpass のように外部 URL のみ許可するアプローチには以下のデメリット:

- 画像リンク切れリスク (imgur 等のサービス終了)
- HTTPS 混在コンテンツの問題
- 投稿体験の悪化 (ドラッグ&ドロップで貼れない)

模倣実装では **説明文内に貼り付けた画像も自前 S3 にホスト** する設計を推奨:

```
[Markdown エディタ] → ドラッグ&ドロップ → presigned URL アップロード → エディタ内に Markdown 形式の URL を自動挿入
```

### 7.5 OGP 動的生成

- イベントタイトル + 主催グループ名 + 日付を画像化した動的 OGP を生成 (Vercel OG Image / Cloudinary / Bannerbear)
- 主催者がアイキャッチを設定し忘れても、自動で見栄えの良いカードを生成

### 7.6 セキュリティ

- アップロード時に MIME チェック + マジックバイト検証
- ImageMagick の RCE 脆弱性回避のため Sharp / libvips を採用
- EXIF データ (GPS 情報等) のストリップ
- ウイルススキャン (ClamAV)
- 不適切画像 (NSFW / 暴力) の自動検出 (Cloud Vision API / AWS Rekognition)

### 7.7 アクセシビリティ

- alt テキストの入力欄を必須化 (画像説明)
- ロード時の placeholder (LQIP / blurhash) を出力

### 7.8 X カードキャッシュ問題

- X 側のカードキャッシュは数時間 〜 数日残るため、画像差し替え後は X の Card Validator で再クロールを促す案内を表示
- 画像 URL にバージョン番号 (`?v=123`) を付与してキャッシュバスティング

---

参考: <https://help.connpass.com/organizers/event-detail>, <https://help.connpass.com/organizers/group>, <https://qiita.com/afroscript10/items/44320ad8299a5f521109>
