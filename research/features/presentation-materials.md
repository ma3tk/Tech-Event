# 発表資料の登録・閲覧 (presentation-materials.md)

connpass の発表資料 (プレゼン資料) 機能と、SlideShare / Speaker Deck / Docswell / YouTube / Vimeo 等の外部スライド・動画ホスティングサービスとの連携について調査。

## 1. 機能の目的

connpass はファイルアップローダーやスライドホスティングサービスではなく、**「外部サービスで公開された資料の URL を集約し、イベントごとにまとめて閲覧できる場所」** として資料機能を提供している。目的は次の通り。

- イベント終了後の振り返り (復習・参加できなかった人への共有) を容易にする
- 登壇者が個別の SNS でしか URL を共有しないと散逸してしまうため、イベントページに集約する
- 「グループの資料一覧」ページから過去登壇資料を時系列で辿れるようにし、コミュニティの知的資産にする

公式の説明:
> イベント詳細ページに資料 URL・参考サイト URL などを掲載することができます。

> 資料ファイルそのものを connpass 上にアップロードすることはできません。

つまり明示的に「ホスティングはしない、リンク集約に徹する」設計思想である。

## 2. 利用シナリオ

| シナリオ | 動線 |
|----------|------|
| 登壇者が当日資料を共有する | 登壇直後にイベントページの「資料」タブから自分のスライド URL を登録 |
| 主催者がまとめる | イベント終了後に登壇者全員分の URL を一括登録 |
| 参加者が後日復習する | イベントページの資料一覧から各スライドを埋め込みプレビュー / 元サイトで閲覧 |
| 別のエンジニアが過去資料を発見する | グループページの「資料一覧」から関連トピックを探索 |
| ブログや別イベントに引用する | 元の SpeakerDeck / Docswell URL を辿って取得 |

## 3. 関連エンティティ・フィールド

```
Presentation (資料)
├─ id
├─ event_id
├─ presenter_user_id (登壇者 / 投稿者)
├─ title: string (URL から auto-fetch、後で編集可)
├─ url: string (公開 URL)
├─ provider: enum {speaker_deck, docswell, youtube, vimeo, slideshare, blog, other}
├─ embed_html: string (oEmbed / 独自スクレイピング結果)
├─ thumbnail_url: string
├─ created_at, updated_at
└─ visibility: 常にイベント公開状態に追従 (個別に非公開化は不可)
```

## 4. UI 上の入口と画面

### 4.1 投稿

- イベント詳細画面の「資料」タブ → 「資料を投稿する」ボタン
- 入力フォームは「タイトル」と「URL」のみ
- URL を入力すると connpass サーバ側がフェッチして埋め込み HTML とサムネイルを取得

### 4.2 閲覧

- イベント詳細画面 `/event/:id/presentation/` 配下に資料一覧
- 各資料は埋め込みプレビュー (SpeakerDeck / Docswell の iframe、YouTube の player) として表示
- グループページ `/<subdomain>/presentation/` でグループ横断の資料一覧 (時系列)

### 4.3 編集 / 削除

- 投稿者本人 + イベント管理者がタイトル編集・削除可能
- 参加者は自分の投稿のみ削除可 (ゴミ箱アイコン)

## 5. 外部サービス連携

### 5.1 対応プラットフォーム

公式に **埋め込み対応** が明言されているサービス:

| サービス | 種別 | 備考 |
|----------|------|------|
| Speaker Deck | スライド | 国内エンジニア界隈で最も使われる |
| Docswell | スライド | 2023/11 に正式対応 (connpass 公式アナウンス) |
| SlideShare | スライド | 歴史的に対応、ただし SlideShare 自体が衰退・有料化 |
| Slideship | スライド | 過去サポート、現在はサービス自体が縮小 |
| YouTube | 動画 | iframe 埋め込み |
| Vimeo | 動画 | iframe 埋め込み |
| その他 (ブログ等) | 一般 URL | サムネイル + リンク表示のみ (埋め込みなし) |

> 資料の投稿機能は、資料 URL を指定するだけで、URL から取得した情報を、適した形で connpass 上で表示・共有できる機能です。

### 5.2 取得方式

- 各サービスの oEmbed エンドポイントを叩くか、OGP (Open Graph Protocol) メタタグをパースする。
- Speaker Deck: <https://speakerdeck.com/oembed.json?url=...>
- YouTube: <https://www.youtube.com/oembed?url=...>
- Docswell: 同様の oEmbed エンドポイントが提供されている。
- 「適切に埋め込み表示できる資料のみが対象」と公式が明言しているため、任意 URL は OGP からサムネイルとタイトルのみ取得し、iframe では埋め込まないフォールバックを取る。

### 5.3 認可

- 投稿者の OAuth 認可は不要。すべて公開 URL ベースの非認証フェッチ。
- 投稿者は connpass にログイン済みで、かつ当該イベントの「管理者」「発表者」「参加者」のいずれかであることが条件。

## 6. ルール・制約

- **ファイル直接アップロード不可** (画像、PDF、PPTX を connpass にホストできない)。
- 投稿者: 該当イベントの管理者・発表者・参加者のみ。
- 主催者: すべての資料を削除・タイトル編集可能 (モデレーション権限)。
- 公開範囲: 個別の資料単位での非公開設定はない。イベントの公開状態に依存。
- 「リンク集として乱用しない」: 単なる外部ニュースリンクをぶら下げる用途は推奨されない (公式が「general link collection tool ではない」と明言)。
- 投稿数の上限は公式には明記されていないが、実運用上はイベント単位で 10 件前後。

## 7. 模倣実装時の代替案

### 7.1 SlideShare 衰退への対応

SlideShare は 2024 年以降、Scribd 傘下で機能制限・有料化が進み、国内コミュニティでの利用は激減した。模倣実装では以下を優先的にサポートする:

| 優先度 | サービス | 理由 |
|--------|----------|------|
| 高 | **Speaker Deck** | 国内エンジニア界隈の事実上の標準 |
| 高 | **Docswell** | 国産、無料、スライド検索流入が増えている |
| 高 | **YouTube** | アーカイブ動画用 |
| 中 | **GitHub Gist / GitHub Pages** | 技術スライド (reveal.js, marp) |
| 中 | **Notion 公開ページ** | ドキュメント形式の発表資料 |
| 中 | **Figma / FigJam 公開ファイル** | デザイン系発表 |
| 低 | SlideShare | 後方互換のためフォールバック対応のみ |

### 7.2 ファイルアップロード対応 (差別化)

connpass にない「PDF を直接アップロードできる」機能を実装するなら:

- ストレージ: S3 + CloudFront、ファイルサイズ上限 30MB、PDF/PPTX 限定
- セキュリティ: ウイルススキャン (ClamAV) + 内容モデレーション
- 表示: PDF.js でブラウザ内ビューア化、ダウンロードボタン併設
- ただし著作権・運営コスト・モデレーション負荷が増えるため、初期 MVP では URL 集約のみで開始する設計が現実的

### 7.3 埋め込みフェッチの実装

```typescript
// 擬似コード
async function fetchEmbed(url: string): Promise<EmbedMeta> {
  const provider = detectProvider(url);  // URL パターンマッチング
  if (provider.oembedEndpoint) {
    return await fetch(`${provider.oembedEndpoint}?url=${url}`).then(r => r.json());
  }
  // フォールバック: OGP スクレイピング
  const html = await fetch(url).then(r => r.text());
  return parseOGP(html);  // og:title, og:image, og:description
}
```

### 7.4 セキュリティ

- 任意 URL を fetch するため、SSRF 対策で内部 IP / メタデータエンドポイントへのアクセスを禁止。
- 取得 HTML は sanitize (DOMPurify) してから保存。
- iframe 埋め込み時は `sandbox="allow-scripts allow-same-origin"` + 許可ドメインの allowlist を保持。

### 7.5 検索・発見性向上

- 資料タイトル + イベント名 + グループ名で全文検索 (Elasticsearch / Meilisearch)。
- タグ (Speaker Deck からカテゴリ取得) を自動付与。
- グループの「資料 RSS」を提供して購読可能にする。

---

参考: <https://help.connpass.com/organizers/presen>, <https://help.connpass.com/participants/presen>, <https://x.com/connpass_jp/status/1726420821416235519> (Docswell 対応のお知らせ)
