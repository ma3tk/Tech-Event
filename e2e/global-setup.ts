import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Playwright globalSetup
 *
 * 目的:
 *   - E2E 開始前に `dev.db` を `dev.db.baseline` に丸ごとコピーして保存する
 *   - テスト中に create-flow.spec.ts などが DB に書き込んでも、テスト終了後に
 *     globalTeardown が baseline で上書き復元するため、後続テスト (visual-compare 等) の
 *     flake (新規イベント分でレイアウトがズレる) を回避できる
 *
 * 注意:
 *   - Prisma + better-sqlite3 driver adapter の場合、dev サーバ (`next dev`) が
 *     dev.db を握ったまま走り続けている。SQLite は WAL モードでも別プロセスからの
 *     ファイルコピーは安全に行えるが、teardown 側で server を止める必要はない。
 *   - SKIP_DB_SNAPSHOT=1 を渡せば snapshot を取らない (CI 等で時間を節約したい場合)。
 */
async function globalSetup(): Promise<void> {
  if (process.env.SKIP_DB_SNAPSHOT === "1") {
    console.log("[e2e/global-setup] SKIP_DB_SNAPSHOT=1 → skipping snapshot");
    return;
  }

  const root = process.cwd();
  const dbPath = path.join(root, "dev.db");
  const baselinePath = path.join(root, "dev.db.baseline");

  // approval-flow.spec.ts などが必要とする `test_user` を冪等に投入。
  // メインシード (pnpm seed) を実行した直後はこのユーザーが存在しないため、
  // E2E 開始前に必ず seed-test-user.ts を流して baseline に含める。
  const seedTestUserPath = path.join(root, "prisma", "seed-test-user.ts");
  if (fs.existsSync(seedTestUserPath)) {
    const res = spawnSync("npx", ["tsx", seedTestUserPath], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env },
    });
    if (res.status !== 0) {
      console.warn(
        `[e2e/global-setup] seed-test-user.ts 失敗 (exit=${res.status}); approval-flow E2E がスキップされる可能性`,
      );
    }
  }

  if (!fs.existsSync(dbPath)) {
    console.warn(
      `[e2e/global-setup] dev.db が見つからない (${dbPath})。snapshot をスキップ。`,
    );
    return;
  }

  // WAL ファイル (-wal, -shm) も併せてコピーしておくと整合性が高い。
  // SQLite は単一ファイルでも安全だが、開発中は journal_mode=wal の可能性があるため。
  const variants = ["", "-wal", "-shm"];
  for (const suffix of variants) {
    const src = dbPath + suffix;
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, baselinePath + suffix);
    } else {
      // baseline 側に古いファイルが残っていれば削除し、状態を揃える
      const stale = baselinePath + suffix;
      if (fs.existsSync(stale)) fs.unlinkSync(stale);
    }
  }

  const stat = fs.statSync(baselinePath);
  console.log(
    `[e2e/global-setup] dev.db → dev.db.baseline スナップショット完了 (${stat.size} bytes)`,
  );
}

export default globalSetup;
