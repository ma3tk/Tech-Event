# タグ機能 (Tags)

connpass.com におけるタグの仕様 (タグ付け、関連イベント、タグ一覧) を整理する。タグは「IT 勉強会のテーマ性」をユーザー間で共有・横断検索するための主要なメタデータである。

---

## 1. 機能の目的とユーザーバリュー

### 目的
- イベントを「言語 / フレームワーク / 分野」などの軸でラベリングし、興味分野ベースで横断的に発見できるようにする。
- 検索フィルタとしての利用、関連イベントの推薦、タグページによる SEO 流入を実現する。
- コミュニティ間のクロスオーバー (例: 「Rails」勉強会と「Web」勉強会が同じタグでつながる) を促進する。

### ユーザーバリュー
- **参加者**: 自分の好きな技術スタック・分野のタグを追えば、自然と関連イベントが集まる。
- **主催者**: 適切なタグ付けにより、検索流入を増やし参加者を獲得できる。
- **コミュニティ**: タグページがハブとなり、コミュニティ間の交流を促す。
- **SEO**: タグページが「Python 勉強会」「AI イベント」などのキーワードで検索流入を獲得。

---

## 2. 関連するエンティティとフィールド

### Tag
| Field | 型 | 説明 |
|---|---|---|
| id | int | タグ ID |
| name | string | タグ名 (例: "Python", "AI") |
| slug | string | URL 用スラッグ (例: `python`) |
| normalized_name | string | 正規化済タグ名 (大文字小文字統一など) |
| event_count | int | 紐づくイベント数 (キャッシュ) |
| created_at | datetime | 初出日時 |
| description | text | タグ説明 (運営編集可、推測) |
| is_official | bool | 公式キュレーション済タグ |

### EventTag (関連テーブル)
| Field | 型 | 説明 |
|---|---|---|
| event_id | int | イベント ID |
| tag_id | int | タグ ID |
| created_at | datetime | 付与日時 |
| created_by | int | 付与した管理者 |

### TagAlias (推測)
- 表記ゆれ吸収のため、同義タグを別名として管理。
- 例: "JS" → "JavaScript" にリダイレクト。

| Field | 型 | 説明 |
|---|---|---|
| alias_name | string | 別名 |
| canonical_tag_id | int | 正規タグ |

### UserTagFollow (推測)
- ユーザーが特定タグをフォローし、関連イベントを優先表示。

---

## 3. 状態遷移図 (タグライフサイクル)

```
[新規タグ入力]
     |
     | 既存タグと一致 (正規化)?
     +--- yes -> [既存 Tag に EventTag を関連付け]
     |
     +--- no  -> [Tag INSERT (event_count = 1)]
                          |
                          v
                  [タグページ自動生成]
                          |
                          | 紐づく Event がある間
                          v
                  [event_count を保持]
                          |
                          | 全イベントから外される
                          v
                  [event_count = 0]
                          |
                          | (任意) クリーンアップバッチ
                          v
                  [Tag 削除 / 非表示]
```

### イベント編集とタグ
```
[イベント編集] -> [タグ入力フォーム]
                       |
                       v
                [サジェスト表示]
                       |
            +----------+----------+
            |                     |
   既存タグ選択              新規タグ入力
            |                     |
            v                     v
       EventTag 追加         Tag 作成 + EventTag 追加
```

---

## 4. ルール・制約

### 4.1 タグ作成
- 任意のユーザー (主催者) がイベント編集ページで自由にタグを追加可能。
- 入力時にサジェスト (既存タグ補完) が表示される。
- 入力タグが既存タグと正規化一致すれば既存 Tag に紐づけ、なければ新規作成。

### 4.2 タグ数の制約
- 1 イベントあたりのタグ数上限 (公式明示なし、運用上 5〜10 個程度と推測)。
- 過剰なタグ付け (スパム的) は運営判断で削除される可能性。

### 4.3 タグ名の正規化
- 大文字小文字統一 (例: "python" → "Python")。
- 半角・全角の統一 (例: "Ｐｙｔｈｏｎ" → "Python")。
- 前後空白の除去。
- 同義タグ (TagAlias) で名寄せ。

### 4.4 関連イベント
- タグページでは「そのタグが付いているイベント」を一覧表示。
- デフォルトは開催日昇順 (開催前のイベント優先)。
- 過去イベントは別タブで閲覧可能。

### 4.5 タグの編集・削除
- イベント作成者・共同管理者・グループ管理者がイベント編集画面でタグを追加・削除可能。
- タグ自体の削除はユーザー操作では不可 (event_count = 0 で運営側がクリーンアップ)。
- タグ名の変更は不可 (URL の永続性を保つため)。

### 4.6 タグ検索
- 検索ページでタグを絞り込み条件として指定可能。
- 複数タグ指定時は AND 検索。

### 4.7 タグページの SEO
- `/tag/:slug/` がタグ別ランディングページ。
- meta タグ・OGP がタグ名で最適化されている。
- サイトマップに含まれる。

### 4.8 タグの大文字小文字
- スラッグは小文字化 + ハイフン区切り (例: "Machine Learning" → `machine-learning`)。
- 表示は元の表記を保持。

### 4.9 関連タグ
- タグページに「関連タグ」を表示。
- 算出基準は「同じイベントに付いているタグの共起頻度」(推測)。

---

## 5. ユーザー視点のフロー

### 5.1 タグからイベントを探す
1. イベント詳細ページのタグをクリック。
2. `/tag/:tag_name/` に遷移し、関連イベント一覧を閲覧。
3. 並び順や日付で絞り込み。
4. 気になるイベントをブックマーク or 申込。

### 5.2 関連タグから派生検索
1. タグページの「関連タグ」セクションから別タグへ遷移。
2. 興味の幅を広げて発見。

### 5.3 検索フィルタとしてのタグ
1. 検索ページでタグを指定 (複数可)。
2. 結果が AND で絞り込まれる。

### 5.4 タグフォロー (拡張・推測)
1. タグページで「このタグをフォロー」を押下。
2. フォロー済タグの新着イベント通知をオプションで受信。

---

## 6. 主催者視点のフロー

### 6.1 タグ付け
1. イベント編集画面の「タグ」セクションを開く。
2. テキストフィールドに語句を入力 → サジェストが表示。
3. 既存タグから選ぶ or Enter で新規タグ作成。
4. 複数タグ追加 (例: "Python", "AI", "東京")。
5. 保存。

### 6.2 タグの調整
- イベント開催後でもタグ編集可能。
- SEO 観点から重要なタグを後から追加するケースあり。

### 6.3 タグ戦略
- 自社・コミュニティの代表タグを統一して使う (ブランド意識)。
- 関連カテゴリのメジャータグを 3〜5 個追加。
- ロングテールなニッチタグも併用。

---

## 7. 関連 UI

| 画面 | コンポーネント |
|---|---|
| イベント詳細 (`/event/:id/`) | タグチップ (クリック可能) |
| イベント編集 (`/event/:id/edit/`) | タグ入力欄、サジェストドロップダウン、追加済タグ削除ボタン |
| タグページ (`/tag/:slug/`) | タグ名見出し、説明、イベント一覧、関連タグ、ページネーション |
| 検索ページ (`/search/`) | タグフィルタ (複数選択) |
| トップページ | 人気タグセクション (推測) |
| ユーザー設定 | フォロー中タグ一覧 (推測) |

---

## 8. エッジケース

| ケース | 挙動 |
|---|---|
| 表記ゆれ ("Ruby" vs "ruby") | 正規化で同じタグに統合 |
| 全角入力 ("ＰＨＰ") | 半角に正規化 |
| 同義タグ ("JS" vs "JavaScript") | TagAlias で正規タグにリダイレクト |
| 記号含み ("C++", ".NET") | スラッグエンコード ("c-plus-plus", "dotnet" 等) |
| 極端に長いタグ | 一定長で切り捨て or 拒否 |
| 同タグ複数追加 | 重複排除 |
| 削除済イベントのタグ | event_count から減算、ページからも除外 |
| 下書きイベントのタグ | 公開前は集計対象外 |
| 中止イベントのタグ | 中止後もタグ自体は残るが、リスト表示は条件次第 |
| タグスパム (1 イベントに 50 個) | 上限制約、運営の手動削除対象 |
| 不適切タグ | 運営がブロックリスト管理 |
| イベント編集中のタグ追加 | リアルタイムサジェスト (debounce 300ms 推奨) |
| 同名タグの大量作成 | 正規化により発生しない |

---

## 9. 推測される内部処理

### 9.1 タグ正規化処理
```pseudo
def normalize_tag(input):
  s = input.strip()
  s = unicodedata.normalize('NFKC', s)  # 全角->半角
  s = s.lower()                          # 小文字化
  s = re.sub(r'\s+', ' ', s)             # 空白統一
  return s

def find_or_create_tag(input):
  normalized = normalize_tag(input)
  tag = Tag.find_by(normalized_name=normalized)
  if tag: return tag
  alias = TagAlias.find_by(alias_name=normalized)
  if alias: return Tag.find(alias.canonical_tag_id)
  return Tag.create(name=input, normalized_name=normalized, slug=slugify(input))
```

### 9.2 イベント保存時のタグ処理
```pseudo
def save_event_tags(event, tag_inputs):
  desired = [find_or_create_tag(t) for t in tag_inputs[:MAX_TAGS]]
  existing = event.tags.all()

  to_add = desired - existing
  to_remove = existing - desired

  for tag in to_add:
    EventTag.create(event_id=event.id, tag_id=tag.id)
    Tag.where(id=tag.id).update(event_count = event_count + 1)
  for tag in to_remove:
    EventTag.delete(event_id=event.id, tag_id=tag.id)
    Tag.where(id=tag.id).update(event_count = event_count - 1)
```

### 9.3 関連タグ算出
```sql
-- タグ A と一緒に出てくるタグの上位
SELECT t.id, t.name, COUNT(*) AS co_occurrence
FROM event_tags et1
JOIN event_tags et2 ON et1.event_id = et2.event_id
JOIN tags t ON t.id = et2.tag_id
WHERE et1.tag_id = :tag_id AND et2.tag_id <> :tag_id
GROUP BY t.id, t.name
ORDER BY co_occurrence DESC
LIMIT 10;
```
- 結果をキャッシュ (1 日)。

### 9.4 タグページの表示
- `/tag/:slug/` で `slug -> tag_id -> events` を取得。
- 検索インデックスと同じクエリで「タグ = :tag_id」をフィルタ。
- ページ初回はキャッシュ (5 分) を返し、新着イベントの即時反映は別途。

### 9.5 検索インデックスとの連携
- Tag は Elasticsearch の `keyword` フィールドに格納。
- 検索時は `terms` クエリで AND 絞り込み。

### 9.6 サジェスト API
```
GET /api/tags/suggest?q=Py
  response: [{ id, name, event_count }, ...]
```
- prefix 検索 (Elasticsearch completion suggester)。
- event_count 降順で上位 10 件を返す。

### 9.7 サイトマップ
- 高頻度タグ (event_count > 5) を自動的にサイトマップに含める。
- 低頻度タグはサイトマップから除外し、`noindex` を付与。

---

## 10. 模倣実装する際の設計案

### 10.1 DB スキーマ
```sql
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  event_count INT NOT NULL DEFAULT 0,
  description TEXT,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_tags (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT,
  PRIMARY KEY (event_id, tag_id)
);

CREATE TABLE tag_aliases (
  id BIGSERIAL PRIMARY KEY,
  alias_name TEXT NOT NULL UNIQUE,
  canonical_tag_id BIGINT NOT NULL REFERENCES tags(id)
);
```

### 10.2 API
- `GET /api/tags/suggest?q=:prefix` — 入力補完
- `GET /api/tags/:slug` — タグ詳細
- `GET /api/tags/:slug/events` — タグに紐づくイベント
- `GET /api/tags/:slug/related` — 関連タグ
- `POST /api/events/:id/tags` — タグ付与 (主催者)
- `DELETE /api/events/:id/tags/:tag_id` — タグ削除 (主催者)
- `POST /api/tags/:slug/follow` — タグフォロー (拡張機能)

### 10.3 サービス層
```python
class TagService:
    MAX_TAGS_PER_EVENT = 10
    MAX_TAG_LENGTH = 50

    def normalize(self, raw: str) -> str:
        s = unicodedata.normalize('NFKC', raw.strip()).lower()
        return re.sub(r'\s+', ' ', s)

    def slugify(self, name: str) -> str:
        return slugify_with_symbols(name)  # C++ -> c-plus-plus

    def find_or_create(self, raw: str) -> Tag:
        if not raw or len(raw) > self.MAX_TAG_LENGTH:
            raise InvalidTagError
        normalized = self.normalize(raw)
        if tag := Tag.find_by(normalized_name=normalized):
            return tag
        if alias := TagAlias.find_by(alias_name=normalized):
            return Tag.find(alias.canonical_tag_id)
        return Tag.create(name=raw, normalized_name=normalized, slug=self.slugify(raw))

    def attach(self, event: Event, tag_inputs: list[str]):
        if len(tag_inputs) > self.MAX_TAGS_PER_EVENT:
            tag_inputs = tag_inputs[:self.MAX_TAGS_PER_EVENT]
        tags = [self.find_or_create(t) for t in tag_inputs]
        event.set_tags(tags)
```

### 10.4 関連タグ算出ジョブ
- 1 日 1 回バッチ。
- 各タグについて共起上位 10 件を `tag_relations` テーブルにキャッシュ。

### 10.5 タグ整合性
- `event_count` の整合性確保: 定期バッチで `EventTag` 件数と突合し再計算。

### 10.6 SEO
- `/tag/:slug/` ページに以下を出力:
  - `<title>{tag_name} の勉強会 / イベント | site</title>`
  - meta description
  - OGP 画像 (動的生成)
  - `application/ld+json` で Event Schema 配列

### 10.7 アクセス制御
- タグの追加・削除はイベント編集権限を持つユーザーのみ。
- タグ自体の編集 (公式説明文等) は運営権限のみ。

### 10.8 テスト観点
- 正規化 (大文字小文字、全角半角、空白) の網羅
- スラッグ化 (特殊記号、日本語)
- 重複タグの排除
- event_count の増減正確性
- TagAlias 経由のリダイレクト
- 上限超過時の動作
- 関連タグ算出の精度
- タグページの SEO メタ出力
- イベント削除時のタグ参照整合性
- 大量イベントでのサジェスト性能 (10ms 以内)
