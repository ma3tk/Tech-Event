# リッチテキストエディタ (rich-text-editor.md)

connpass のイベント説明文・グループ説明文・参加者向け情報欄における Markdown 対応、許可された HTML タグ、エディタ UI についての調査。

## 1. 機能の目的

connpass の説明文系入力欄は、**Markdown 記法 + 限定 HTML タグ** によるリッチテキスト表現を提供する。これにより:

- 主催者は HTML 知識が浅くても見出し / 箇条書き / リンクで構造化されたイベント説明を書ける
- エンジニア層に親和的な Markdown を採用することで、GitHub README 感覚で編集できる
- 画像サイズ調整など Markdown では困難な場合に `<img>` タグでフォールバックできる

公式の説明:
> connpass ではグループやイベントの説明文を Markdown 記法で記述することで、簡単に豊かな表現が可能です。
> 特定の HTML タグと属性を記述することもできます。
> 2023/2/8 以降「参加者への情報」欄も Markdown 対応。

## 2. 利用シナリオ

| 入力欄 | Markdown 対応 | 用途 |
|--------|----------------|------|
| イベント説明文 | 〇 | タイムテーブル、登壇者紹介、会場アクセス |
| グループ説明文 | 〇 | コミュニティ理念、活動内容、Twitter |
| 参加者への情報欄 | 〇 (2023/2 以降) | Zoom URL、Wi-Fi パスワード、当日連絡先 |
| アンケート質問文 | × (プレーンテキスト) | 質問内容のみ |
| コメント | プレーンテキスト想定 | 質疑応答 |
| プロフィール自己紹介 | プレーンテキストまたは限定 Markdown | 経歴・スキル |

## 3. 関連エンティティ・フィールド

```
Event
├─ description_markdown: text (元の Markdown ソース)
├─ description_html: text (キャッシュされたレンダリング結果)
├─ description_revised_at: datetime
├─ private_info_markdown: text ("参加者への情報" 欄、2023/2 以降 Markdown)
├─ private_info_html: text
└─ ...

Group
├─ description_markdown: text
├─ description_html: text
└─ ...
```

Markdown ソースは永続化し、ビルド済み HTML をキャッシュするのが一般的。

## 4. UI 上の入口と画面

### 4.1 エディタ画面

- イベント / グループ作成・編集画面のテキストエリア
- 「上部に表示されているボタンを活用することで、文字の大きさや色、区切り線、リンクの追加など様々な表示方法を設定」という記述あり = 簡易ツールバー付きの textarea
- WYSIWYG ではなく **Markdown を直接編集する textarea + ヘルパーボタン** という構成 (公式ヘルプから推定)
- ヘルパーボタン例: 見出し挿入、太字、リンク、リスト、画像挿入

### 4.2 プレビュー

- 編集中のプレビュー機能は公式に明確な言及なし
- 保存後のイベント詳細画面で確認

### 4.3 Markdown ヘルプ

- `/organizers/markdown` で対応記法一覧を掲載
- 編集画面から「Markdown ヘルプ」リンクで遷移できると推定

## 5. 外部サービス連携

特定の外部サービス連携はないが、以下のような自動展開が行われている:

- **画像 URL の自動埋め込み**: `https://i.imgur.com/xxx.png` 等の画像 URL を貼ると `<img>` として埋め込み
- **YouTube / SpeakerDeck URL の oEmbed 展開**: 一部の URL は自動的に埋め込みプレビュー化される (説明文ではなく「資料」セクションが主)
- **Twitter / X の埋め込み**: ツイート URL を貼ると埋め込みカード化 (限定的)

## 6. ルール・制約

### 6.1 対応する Markdown 記法

公式ヘルプから抽出した対応記法:

| 要素 | 記法 |
|------|------|
| 見出し | `# H1` 〜 `###### H6` |
| 太字 | `**bold**` |
| イタリック | `*italic*` |
| 打ち消し線 | `~~strike~~` |
| 番号なしリスト | `- item` |
| 番号ありリスト | `1. item` |
| 引用 | `> quote` |
| インラインコード | `` `code` `` |
| コードブロック | ` ``` lang ... ``` ` |
| リンク | `[label](url "title")` |
| 画像 | `![alt](url)` |
| 水平線 | `---` |
| テーブル | `| col1 | col2 |` (左寄せ / 中央 / 右寄せ) |

### 6.2 許可される HTML タグ

> 画像をサイズ変更して表示したい場合は HTML の img タグをご使用ください。

許可タグ (一部公式記述、それ以外は経験的):

- `<img src width height alt>`
- `<a href title target>`
- `<table>`, `<tr>`, `<td>`, `<th>`
- `<br>`, `<hr>`
- `<strong>`, `<em>`
- `<div>` (一部の属性のみ、style 等は禁止と推定)

危険なタグ (`<script>`, `<iframe>`, `<form>`, インライン style 等) は sanitize で除去。

### 6.3 制約

- **説明文内に画像をアップロードすることはできない** (公式 FAQ で明言)。外部 URL のみ。
- HTML タグの属性はホワイトリスト方式
- Markdown のレンダリング結果は HTML として保存 (毎回再パースしない設計と推定)

## 7. 模倣実装時の代替案

### 7.1 エディタ実装

WYSIWYG / Markdown の選択肢:

| 選択肢 | 候補 | 特徴 |
|---------|------|------|
| **Markdown + プレビュー** (connpass 風) | `react-md-editor`, `easymde`, `@uiw/react-md-editor` | エンジニア向け、軽量 |
| **WYSIWYG** | Tiptap, Lexical, Slate | 非エンジニア向け、リッチ |
| **ハイブリッド** | Tiptap (Markdown シリアライズ) | WYSIWYG + Markdown 出力 |
| **ブロックエディタ** | Editor.js, BlockNote | Notion 風 |

模倣実装としては **Tiptap + Markdown シリアライズ** が最もモダンで、エンジニア向け / 非エンジニア向け両方に対応可能。

### 7.2 Markdown パーサ

- `remark` + `rehype` エコシステム (推奨)
  - `remark-gfm` で GitHub Flavored Markdown (表、打ち消し、タスクリスト)
  - `rehype-sanitize` で安全な HTML 出力
  - `rehype-shiki` でコードハイライト
- `marked` (軽量、SSR 向き)
- `markdown-it` (プラグイン豊富)

### 7.3 サニタイゼーション

- `DOMPurify` (クライアント / サーバ両用)
- `rehype-sanitize` (rehype エコシステム)
- 許可タグ・属性のホワイトリストを厳格に定義
- `target="_blank"` 付与時は `rel="noopener noreferrer"` を強制

### 7.4 画像アップロード統合 (差別化)

connpass は説明文内画像のアップロードに対応していないため、模倣実装では:

```
[エディタ] → ドラッグ&ドロップ / paste → presigned URL → S3 → エディタに ![](url) を自動挿入
```

- Tiptap / Lexical はカスタム拡張で実装可能
- ファイルサイズ・形式の制限を明示
- 画像の自動リサイズ・WebP 変換

### 7.5 プレビュー機能

- 編集中にリアルタイムプレビューを併設 (split view)
- モバイル / PC のプレビュー切替

### 7.6 自動補完

- @メンション (登壇者・参加者) で自動補完
- ハッシュタグ補完
- 絵文字補完 (`:smile:` → 😄)
- スラッシュコマンド (Notion 風: `/heading` で見出し挿入)

### 7.7 セキュリティ

- XSS 対策: サーバ側でも必ず sanitize (クライアント送信値を信用しない)
- SSRF 対策: 画像 URL を Markdown に書かれた場合、内部 IP / メタデータエンドポイントを fetch しないようにリゾルバを通す
- 著作権配慮: 説明文内の画像 URL が他サイトのものをホットリンクする場合、hotlink 警告を表示

### 7.8 過去 Markdown との互換性

- connpass からインポート (CSV / API) で既存 Markdown を取り込めるようにする
- 移行時は Markdown ソースをそのまま保存し、レンダリング結果は再生成

### 7.9 i18n

- Markdown 内の <ruby> タグ対応 (日本語ルビ)
- 半角・全角混在の自動整形 (textlint 等)

---

参考: <https://help.connpass.com/organizers/markdown>, <https://help.connpass.com/announcements/update/20230208>, <https://help.connpass.com/organizers/event-detail>, <https://help.connpass.com/organizers/group>
