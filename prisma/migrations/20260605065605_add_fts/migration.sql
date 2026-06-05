-- SQLite FTS5 全文検索インデックスの追加。
--
-- - 仮想テーブル `events_fts` を `content='events'` (external content) で作成。
--   `events` 本体行は変更せず、`rowid = events.id` でインデックス側だけ
--   タイトル/キャッチコピー/説明/ハッシュタグ/会場名を全文検索可能にする。
-- - tokenizer は `unicode61` をベースに数字を含む形で残し、簡易ながら
--   日本語の英単語/英数字混在キーワード (Python, Next.js 等) で AND/OR/PHRASE
--   マッチが効くようにする。日本語形態素解析 (kuromoji) は今回はスコープ外。
-- - INSERT/UPDATE/DELETE トリガで `events_fts` と `events` の同期を保つ。
-- - SQLite ビルドが FTS5 を含まない場合、`searchEvents()` 側がフォールバックで
--   `LIKE` 検索に切り替わる (src/lib/search.ts 参照)。

CREATE VIRTUAL TABLE events_fts USING fts5(
  title,
  catchPhrase,
  description,
  hashTag,
  place,
  content='events',
  content_rowid='id',
  tokenize='unicode61'
);

-- INSERT トリガ
CREATE TRIGGER events_ai AFTER INSERT ON events BEGIN
  INSERT INTO events_fts(rowid, title, catchPhrase, description, hashTag, place)
  VALUES (
    new.id,
    coalesce(new.title, ''),
    coalesce(new.catchPhrase, ''),
    coalesce(new.description, ''),
    coalesce(new.hashTag, ''),
    coalesce(new.place, '')
  );
END;

-- DELETE トリガ
CREATE TRIGGER events_ad AFTER DELETE ON events BEGIN
  INSERT INTO events_fts(events_fts, rowid, title, catchPhrase, description, hashTag, place)
  VALUES (
    'delete',
    old.id,
    coalesce(old.title, ''),
    coalesce(old.catchPhrase, ''),
    coalesce(old.description, ''),
    coalesce(old.hashTag, ''),
    coalesce(old.place, '')
  );
END;

-- UPDATE トリガ
CREATE TRIGGER events_au AFTER UPDATE ON events BEGIN
  INSERT INTO events_fts(events_fts, rowid, title, catchPhrase, description, hashTag, place)
  VALUES (
    'delete',
    old.id,
    coalesce(old.title, ''),
    coalesce(old.catchPhrase, ''),
    coalesce(old.description, ''),
    coalesce(old.hashTag, ''),
    coalesce(old.place, '')
  );
  INSERT INTO events_fts(rowid, title, catchPhrase, description, hashTag, place)
  VALUES (
    new.id,
    coalesce(new.title, ''),
    coalesce(new.catchPhrase, ''),
    coalesce(new.description, ''),
    coalesce(new.hashTag, ''),
    coalesce(new.place, '')
  );
END;

-- 既存の events 行を FTS にロード
INSERT INTO events_fts(rowid, title, catchPhrase, description, hashTag, place)
SELECT
  id,
  coalesce(title, ''),
  coalesce(catchPhrase, ''),
  coalesce(description, ''),
  coalesce(hashTag, ''),
  coalesce(place, '')
FROM events;
