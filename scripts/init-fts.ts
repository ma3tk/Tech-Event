/**
 * 既存 `events` 行をすべて `events_fts` に再投入するスクリプト。
 *
 * - 利用シナリオ:
 *   - シード (`pnpm seed`) 直後: シードは prisma client 経由で INSERT/CREATE するが、
 *     トリガが効くので通常は不要。ただし migration を後追いで足したケースや、
 *     `pnpm db:reset` 後の整合性確認に便利。
 *   - FTS インデックスを `rebuild` したいとき (壊れた / tokenizer を差し替えた 等)
 *
 * - 実行: `pnpm tsx scripts/init-fts.ts`
 *
 * - FTS5 が利用不可なビルドでは `events_fts` 自体が無いため、警告ログを出して
 *   no-op で終了する (`search.ts` 側の LIKE フォールバックに任せる)。
 */
import "dotenv/config";
import Database from "better-sqlite3";

function resolveDbFile(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  // 形式: `file:./dev.db` / `file:/abs/path/dev.db`
  if (raw.startsWith("file:")) {
    return raw.slice("file:".length);
  }
  return raw;
}

function main(): void {
  const dbPath = resolveDbFile();
  const db = new Database(dbPath);
  try {
    // FTS5 仮想テーブルが存在するか確認
    const exists = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='events_fts'",
      )
      .get() as { name: string } | undefined;

    if (!exists) {
      console.warn(
        "[init-fts] events_fts 仮想テーブルが存在しません。FTS5 が無効なビルドの可能性があります。LIKE フォールバックで動作します。",
      );
      return;
    }

    db.exec("BEGIN");
    try {
      // SQLite FTS5 の `rebuild` コマンドで content table から再構築する。
      // external content モード (content='events') を使っているので、これだけで
      // 元テーブルから全行が再ロードされる。
      db.exec("INSERT INTO events_fts(events_fts) VALUES('rebuild')");
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }

    const count = (
      db.prepare("SELECT COUNT(*) AS c FROM events_fts").get() as {
        c: number;
      }
    ).c;
    console.log(`[init-fts] rebuilt FTS index. events_fts rows = ${count}`);
  } finally {
    db.close();
  }
}

try {
  main();
} catch (err) {
  console.error("[init-fts] failed:", err);
  process.exit(1);
}
